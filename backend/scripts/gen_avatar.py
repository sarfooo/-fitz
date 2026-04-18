"""Generate a FitCheck-style avatar from reference photos in ../avatar/.

Two-stage pipeline (because Dedalus's Gemini chat doesn't return image bytes
yet):
    1. Gemini vision describes the person from the reference photos.
    2. gpt-image-1 generates the avatar using that description + house style.

Run from backend/ with the venv active:
    PYTHONPATH=. ./venv/bin/python scripts/gen_avatar.py
"""

from __future__ import annotations

import asyncio
import base64
import mimetypes
from pathlib import Path

from dedalus_labs import AsyncDedalus

from app.config import get_settings
from app.services.image_gen import agenerate_image
from app.services.prompts import HOUSE_STYLE, NEGATIVE

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = Path(__file__).resolve().parents[1] / "out"

IDENTITY_INSTRUCTION = (
    "You are a fashion-casting assistant. Study the reference photos of one real "
    "person and produce a concise but visually specific identity description for "
    "a photographer. Cover: apparent age range, gender presentation, ethnicity/skin "
    "tone, face shape, distinctive facial features (eyes, brows, nose, jaw, facial "
    "hair), hair (color, texture, length, style), body type/build, and approximate "
    "height. Output 4-6 dense sentences, no names, no guesses about personality, no "
    "clothing from the photos."
)


def _load_references(avatar_dir: Path) -> list[tuple[bytes, str]]:
    exts = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
    files = sorted(p for p in avatar_dir.iterdir() if p.suffix.lower() in exts)
    if not files:
        raise SystemExit(f"no reference photos found in {avatar_dir}")
    refs: list[tuple[bytes, str]] = []
    for p in files:
        mime = mimetypes.guess_type(p.name)[0] or "image/jpeg"
        refs.append((p.read_bytes(), mime))
    print(f"loaded {len(refs)} reference photo(s) from {avatar_dir}")
    return refs


def _data_url(data: bytes, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


async def describe_person(refs: list[tuple[bytes, str]]) -> str:
    settings = get_settings()
    parts: list[dict] = [{"type": "text", "text": IDENTITY_INSTRUCTION}]
    for data, mime in refs:
        parts.append({"type": "image_url", "image_url": {"url": _data_url(data, mime)}})

    async with AsyncDedalus(api_key=settings.dedalus_api_key) as client:
        resp = await client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[{"role": "user", "content": parts}],
        )
    text = (resp.choices[0].message.content or "").strip()
    if not text:
        raise SystemExit("identity description came back empty")
    return text


def build_avatar_prompt(identity: str) -> str:
    return " ".join(
        [
            f"Identity reference: {identity}",
            "Render that same person as a full-body FitCheck avatar,",
            "wearing a plain fitted neutral base layer (plain solid-color t-shirt "
            "and plain solid-color pants, no logos, no patterns),",
            "preserve the described face, hair, skin tone, build, and proportions exactly.",
            HOUSE_STYLE + ".",
            NEGATIVE,
        ]
    )


async def main() -> None:
    import argparse  # noqa: PLC0415

    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--refs",
        type=Path,
        default=REPO_ROOT / "avatar",
        help="folder of real reference photos",
    )
    ap.add_argument(
        "--name",
        default="avatar",
        help="basename for output files (avatar, avatar2, ...)",
    )
    args = ap.parse_args()

    refs = _load_references(args.refs)
    print("asking Gemini to describe the person...")
    identity = await describe_person(refs)
    print("\n--- identity ---\n" + identity + "\n----------------\n")

    prompt = build_avatar_prompt(identity)
    print("rendering avatar with gpt-image-1...")
    # gpt-image-1 always returns base64; it rejects the response_format param.
    from app.services.image_gen import _async_client, _unwrap  # noqa: PLC0415

    async with _async_client() as client:
        raw = await client.images.generate(
            prompt=prompt,
            size="1024x1536",
            quality="high",
            model="openai/gpt-image-1",
        )
    images = _unwrap(raw)
    if not images:
        raise SystemExit("image model returned no images")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{args.name}.png"
    img = images[0]
    if img.b64_json:
        out_path.write_bytes(base64.b64decode(img.b64_json))
    elif img.url:
        import httpx  # noqa: PLC0415

        out_path.write_bytes(httpx.get(img.url, timeout=60).content)
    else:
        raise SystemExit("generated image has neither b64_json nor url")

    (OUT_DIR / f"{args.name}_identity.txt").write_text(identity)
    (OUT_DIR / f"{args.name}_prompt.txt").write_text(prompt)
    print(f"saved: {out_path}")

    # Post-process: composite the real face onto the generated avatar body
    # so identity is preserved instead of being re-imagined by gpt-image-1.
    try:
        from face_composite import composite_face  # noqa: PLC0415

        # Use the first reference photo as the face source.
        first_ref = sorted(
            p for p in args.refs.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
        )[0]
        composited = OUT_DIR / f"{args.name}_faceswap.png"
        composite_face(source=first_ref, target=out_path, out=composited)
        # Replace the primary avatar with the face-preserved version.
        out_path.write_bytes(composited.read_bytes())
        print(f"face-composited using {first_ref.name} -> {out_path}")
    except Exception as e:
        print(f"face composite skipped: {e}")


if __name__ == "__main__":
    import sys  # noqa: PLC0415

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    asyncio.run(main())
