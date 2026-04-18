"""Dress the generated avatar in /outfits/shirt and /outfits/pants.

Stage 1: Gemini vision captions each garment in detail.
Stage 2: gpt-image-1 image-edit places the described garments onto the avatar.

Run from backend/ with the venv active:
    PYTHONPATH=. ./venv/bin/python scripts/gen_tryon.py
"""

from __future__ import annotations

import asyncio
import base64
import mimetypes
from pathlib import Path

from dedalus_labs import AsyncDedalus

from app.config import get_settings
from app.services.image_gen import _async_client, _unwrap
from app.services.prompts import HOUSE_STYLE, NEGATIVE

REPO_ROOT = Path(__file__).resolve().parents[2]
OUTFITS_DIR = REPO_ROOT / "outfits"
BACKEND_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND_DIR / "out"


def _detect_mime(data: bytes, fallback: str = "image/png") -> str:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:2] == b"\xff\xd8":
        return "image/jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return fallback


def _pick_garment(dir_path: Path) -> Path:
    """Return newest valid (non-corrupt) image in dir_path."""
    exts = {".jpg", ".jpeg", ".png", ".webp"}
    candidates = [p for p in dir_path.iterdir() if p.is_file() and p.suffix.lower() in exts]
    if not candidates:
        raise SystemExit(f"no image files in {dir_path}")
    # Sort newest-first, skip known-corrupt files.
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    for p in candidates:
        head = p.read_bytes()[:16]
        if head.startswith(b"\xef\xbf\xbd"):
            print(f"  skip {p.name} (UTF-8 corruption marker)")
            continue
        if _detect_mime(head, fallback="") == "":
            print(f"  skip {p.name} (unknown format)")
            continue
        return p
    raise SystemExit(f"no usable images in {dir_path}")

GARMENT_INSTRUCTION = (
    "Describe this single {kind} garment for a fashion try-on prompt. Cover: "
    "primary color and any secondary colors, fabric and visible texture, cut/fit "
    "(fitted, relaxed, baggy, oversized), length, notable details (graphics, "
    "patterns, washes, stitching, hardware, collar/neckline, sleeves, hem). "
    "2-3 dense sentences, no person, no background, no guesses about brand."
)


def _data_url(data: bytes, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


def _load(path: Path) -> tuple[bytes, str]:
    data = path.read_bytes()
    guessed = mimetypes.guess_type(path.name)[0] or "image/png"
    return data, _detect_mime(data, fallback=guessed)


async def describe_garment(path: Path, kind: str) -> str:
    settings = get_settings()
    data, mime = _load(path)
    parts = [
        {"type": "text", "text": GARMENT_INSTRUCTION.format(kind=kind)},
        {"type": "image_url", "image_url": {"url": _data_url(data, mime)}},
    ]
    async with AsyncDedalus(api_key=settings.dedalus_api_key) as client:
        resp = await client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[{"role": "user", "content": parts}],
        )
    text = (resp.choices[0].message.content or "").strip()
    if not text:
        raise SystemExit(f"empty description for {kind}")
    return text


FIXED_WARDROBE = (
    "FIXED WARDROBE (do not vary, only the shirt and pants above are the "
    "selected garments): plain matte-black low-top canvas sneakers with "
    "white rubber soles and white flat laces, plain white ankle-length "
    "socks barely visible. No jewelry, no necklace, no bracelet, no watch, "
    "no rings, no earrings, no hat, no beanie, no sunglasses, no belt, no "
    "suspenders, no jacket, no outerwear, no undershirt visible at collar, "
    "no additional layers."
)


def build_tryon_prompt(*, identity: str, shirt_desc: str, pants_desc: str) -> str:
    return " ".join(
        [
            f"Identity reference: {identity}",
            "Render that same person wearing the following SELECTED GARMENTS:",
            f"Top: {shirt_desc}.",
            f"Bottom: {pants_desc}.",
            FIXED_WARDROBE,
            "preserve the described face, hair, skin tone, build, and proportions exactly.",
            HOUSE_STYLE + ".",
            NEGATIVE,
        ]
    )


async def main() -> None:
    import argparse  # noqa: PLC0415

    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--name",
        default="avatar",
        help="avatar base name (avatar, avatar2, ...) — matches gen_avatar.py --name",
    )
    ap.add_argument(
        "--face-source",
        type=Path,
        default=None,
        help="real photo to use as the face-swap source; defaults to "
        "REPO_ROOT/<name>/*.jpg[0]",
    )
    ap.add_argument(
        "--shirt",
        type=Path,
        default=None,
        help="specific shirt image (defaults to newest in outfits/shirt/)",
    )
    ap.add_argument(
        "--pants",
        type=Path,
        default=None,
        help="specific pants image (defaults to newest in outfits/pants/)",
    )
    ap.add_argument(
        "--fit-id",
        default=None,
        help="override output basename suffix (e.g. 'polo_khaki'). "
        "Defaults to '<shirt_stem>__<pants_stem>'.",
    )
    args = ap.parse_args()

    identity_path = OUT_DIR / f"{args.name}_identity.txt"
    if not identity_path.exists():
        raise SystemExit(
            f"identity description not found at {identity_path}; run gen_avatar.py --name {args.name} first"
        )
    identity = identity_path.read_text().strip()

    shirt_path = args.shirt or _pick_garment(OUTFITS_DIR / "shirt")
    pants_path = args.pants or _pick_garment(OUTFITS_DIR / "pants")
    if not shirt_path.exists():
        raise SystemExit(f"shirt not found: {shirt_path}")
    if not pants_path.exists():
        raise SystemExit(f"pants not found: {pants_path}")
    print(f"using shirt: {shirt_path.name}")
    print(f"using pants: {pants_path.name}")

    fit_id = args.fit_id or f"{shirt_path.stem}__{pants_path.stem}"
    out_prefix = f"{args.name}_fit_{fit_id}"

    print("describing garments with Gemini...")
    shirt_desc = await describe_garment(shirt_path, "shirt/top")
    pants_desc = await describe_garment(pants_path, "pants/bottom")
    print("\n-- shirt --\n" + shirt_desc)
    print("\n-- pants --\n" + pants_desc + "\n")

    prompt = build_tryon_prompt(identity=identity, shirt_desc=shirt_desc, pants_desc=pants_desc)
    (OUT_DIR / f"{out_prefix}_prompt.txt").write_text(prompt)

    print("rendering outfit with gpt-image-1...")
    async with _async_client() as client:
        raw = await client.images.generate(
            prompt=prompt,
            size="1024x1536",
            quality="high",
            model="openai/gpt-image-1",
        )
    images = _unwrap(raw)
    if not images:
        raise SystemExit("edit returned no images")

    raw_path = OUT_DIR / f"{out_prefix}_raw.png"
    final_path = OUT_DIR / f"{out_prefix}.png"
    img = images[0]
    if img.b64_json:
        raw_path.write_bytes(base64.b64decode(img.b64_json))
    elif img.url:
        import httpx  # noqa: PLC0415

        raw_path.write_bytes(httpx.get(img.url, timeout=60).content)
    else:
        raise SystemExit("generated image has neither b64_json nor url")
    print(f"raw generation saved: {raw_path}")

    # Face composite: keep the real face from a reference photo so the subject
    # actually looks like the person.
    face_source = args.face_source
    if face_source is None:
        candidate_dir = REPO_ROOT / args.name
        if not candidate_dir.is_dir():
            candidate_dir = REPO_ROOT / "avatar"
        refs = sorted(
            p
            for p in candidate_dir.iterdir()
            if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
        )
        if not refs:
            raise SystemExit(f"no reference photos in {candidate_dir}")
        face_source = refs[0]

    try:
        from face_composite import composite_face  # noqa: PLC0415

        composite_face(source=face_source, target=raw_path, out=final_path)
        print(f"face-composited ({face_source.name}) -> {final_path}")
    except Exception as e:
        # Fallback: just promote the raw render so the user still gets an output.
        final_path.write_bytes(raw_path.read_bytes())
        print(f"face composite skipped ({e}); saved raw only -> {final_path}")


if __name__ == "__main__":
    import sys  # noqa: PLC0415

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    asyncio.run(main())
