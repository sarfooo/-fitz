"""Generate 5 pose angles (left / left-3q / front / right-3q / right) of the
same outfitted avatar via Dedalus gpt-image-1.

Consumes the identity description and outfit description produced by
gen_avatar.py + gen_tryon.py, so identity and outfit stay consistent across
all five frames. Face-composites each result against a real reference photo
when a frontal face is detectable (front + 3/4 views usually succeed; strict
profiles fall back to raw generation).

Usage:
    PYTHONPATH=. ./venv/bin/python scripts/gen_angles.py
    PYTHONPATH=. ./venv/bin/python scripts/gen_angles.py --name avatar2
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import re
import sys
from pathlib import Path

from app.services.image_gen import _async_client, _unwrap
from app.services.prompts import NEGATIVE

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND_DIR / "out"
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Lighting / backdrop reused across all angles. We *replace* the HOUSE_STYLE
# "facing camera straight-on" directive so non-front angles can override pose.
BACKDROP_STYLE = (
    "photorealistic fashion lookbook photograph, full body shot head to shoes, "
    "subject perfectly centered in frame, natural realistic skin texture and hair "
    "detail, pitch-black seamless studio backdrop with no visible floor line, soft "
    "even key light with subtle rim light, crisp fabric texture, 50mm lens look, "
    "cohesive FitCheck editorial visual identity"
)

# Anything not in the try-on selection MUST stay identical across all renders
# so a rotation sequence is coherent. Right now only shirt and pants come from
# the garment picker — shoes, accessories, and outerwear are locked here.
FIXED_WARDROBE = (
    "FIXED WARDROBE (do not vary across images, only the shirt and pants "
    "above are the selected garments): plain matte-black low-top canvas "
    "sneakers with white rubber soles and white flat laces, plain white "
    "ankle-length socks barely visible. No jewelry, no necklace, no "
    "bracelet, no watch, no rings, no earrings, no hat, no beanie, no "
    "sunglasses, no belt, no suspenders, no jacket, no outerwear, no "
    "undershirt visible at collar, no tucked-in styling unless the shirt "
    "description specifies it, no additional layers."
)

ANGLES = [
    (
        "left",
        "The subject's entire body is turned 90 degrees in strict profile so "
        "that their nose and the front of their body point toward the LEFT "
        "edge of the frame. Shoulders are perpendicular to the camera. We see "
        "only one side of their head (the side closer to the camera); the "
        "other ear is completely hidden.",
    ),
    (
        "left_three_quarter",
        "The subject is rotated about 30 degrees so their nose and the front "
        "of their body point toward the LEFT side of the frame (between "
        "center and the left edge). Both eyes are still visible but the face "
        "is clearly angled toward the left edge — NOT toward the camera and "
        "NOT toward the right.",
    ),
    ("front", "The subject faces the camera straight on, arms relaxed at sides."),
    (
        "right_three_quarter",
        "The subject is rotated about 30 degrees so their nose and the front "
        "of their body point toward the RIGHT side of the frame (between "
        "center and the right edge). Both eyes are still visible but the face "
        "is clearly angled toward the right edge — NOT toward the camera and "
        "NOT toward the left. This pose is the mirror of the left "
        "three-quarter view.",
    ),
    (
        "right",
        "The subject's entire body is turned 90 degrees in strict profile so "
        "that their nose and the front of their body point toward the RIGHT "
        "edge of the frame. Shoulders are perpendicular to the camera. We see "
        "only one side of their head (the side closer to the camera); the "
        "other ear is completely hidden. This pose is the mirror of the left "
        "profile view.",
    ),
]


def _extract_outfit_block(tryon_prompt: str) -> str:
    """Pull the `Top: ... Bottom: ...` clauses out of a tryon prompt so we
    can re-use the outfit description without the pose directives."""
    match = re.search(r"Top:.*?preserve", tryon_prompt, re.DOTALL)
    if not match:
        # Fallback: use everything after "wearing the following outfit:".
        idx = tryon_prompt.find("outfit:")
        return tryon_prompt[idx + len("outfit:") :].split("preserve")[0].strip()
    return match.group(0).rsplit("preserve", 1)[0].strip()


def build_angle_prompt(*, identity: str, outfit: str, pose: str) -> str:
    return " ".join(
        [
            f"Identity reference: {identity}",
            "Render that same person wearing the following SELECTED GARMENTS:",
            outfit,
            FIXED_WARDROBE,
            "Preserve the described face, hair, skin tone, build, and proportions exactly.",
            f"Pose: {pose}",
            BACKDROP_STYLE + ".",
            NEGATIVE,
        ]
    )


async def generate_angle(prompt: str) -> bytes:
    async with _async_client() as client:
        raw = await client.images.generate(
            prompt=prompt,
            size="1024x1536",
            quality="high",
            model="openai/gpt-image-1",
        )
    images = _unwrap(raw)
    if not images:
        raise RuntimeError("no images returned")
    img = images[0]
    if img.b64_json:
        return base64.b64decode(img.b64_json)
    if img.url:
        import httpx  # noqa: PLC0415

        return httpx.get(img.url, timeout=60).content
    raise RuntimeError("generated image has neither b64_json nor url")


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", default="avatar", help="avatar basename")
    ap.add_argument(
        "--face-source",
        type=Path,
        default=None,
        help="real photo used as face-swap source; defaults to first photo in REPO_ROOT/<name>/",
    )
    ap.add_argument(
        "--angles",
        nargs="+",
        default=[a for a, _ in ANGLES],
        help="subset of angles to render",
    )
    args = ap.parse_args()

    identity_path = OUT_DIR / f"{args.name}_identity.txt"
    tryon_prompt_path = OUT_DIR / f"{args.name}_tryon_prompt.txt"
    if not identity_path.exists():
        raise SystemExit(
            f"missing {identity_path}; run scripts/gen_avatar.py --name {args.name} first"
        )
    if not tryon_prompt_path.exists():
        # Fall back to the older single-tryon prompt file if present.
        legacy = OUT_DIR / "tryon_prompt.txt"
        if not legacy.exists():
            raise SystemExit(
                f"missing {tryon_prompt_path}; run scripts/gen_tryon.py --name {args.name} first"
            )
        tryon_prompt_path = legacy

    identity = identity_path.read_text().strip()
    outfit = _extract_outfit_block(tryon_prompt_path.read_text())
    print(f"using identity from {identity_path.name}")
    print(f"outfit block: {outfit[:120]}...")

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
        face_source = refs[0] if refs else None

    from face_composite import composite_face  # noqa: PLC0415

    for label, pose in ANGLES:
        if label not in args.angles:
            continue
        prompt = build_angle_prompt(identity=identity, outfit=outfit, pose=pose)
        raw_path = OUT_DIR / f"{args.name}_angle_{label}_raw.png"
        final_path = OUT_DIR / f"{args.name}_angle_{label}.png"
        (OUT_DIR / f"{args.name}_angle_{label}_prompt.txt").write_text(prompt)

        print(f"\n[{label}] rendering gpt-image-1...")
        try:
            data = await generate_angle(prompt)
        except Exception as e:
            print(f"  generation FAILED: {e}")
            continue
        raw_path.write_bytes(data)
        print(f"  raw -> {raw_path.name}")

        if face_source is None:
            final_path.write_bytes(data)
            print("  no face source; kept raw")
            continue
        try:
            composite_face(source=face_source, target=raw_path, out=final_path)
            print(f"  face-composited ({face_source.name}) -> {final_path.name}")
        except Exception as e:
            final_path.write_bytes(data)
            print(f"  face composite skipped ({e}); kept raw -> {final_path.name}")


if __name__ == "__main__":
    asyncio.run(main())
