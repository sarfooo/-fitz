"""Dress the generated avatar using text descriptions of the outfit.

Use when the /outfits garment images are unavailable or corrupt. The outfit
here mirrors the style reference image the user provided (black star-knit
sweater + baggy faded blue denim + black platform shoes, pitch-black backdrop).

Run from backend/ with the venv active:
    PYTHONPATH=. ./venv/bin/python scripts/gen_tryon_fallback.py
"""

from __future__ import annotations

import asyncio
import base64
from pathlib import Path

from app.services.image_gen import _async_client, _unwrap
from app.services.prompts import HOUSE_STYLE, NEGATIVE

BACKEND_DIR = Path(__file__).resolve().parents[1]
IDENTITY_PATH = BACKEND_DIR / "out" / "avatar_identity.txt"
OUT_DIR = BACKEND_DIR / "out"

SHIRT_DESC = (
    "a heavyweight black knit crewneck sweater with a large off-white five-point "
    "star intarsia graphic centered on the chest, contrast off-white trim running "
    "down both sleeves in a zig-zag / diamond pattern, ribbed crew neckline, "
    "regular drop-shoulder fit"
)
PANTS_DESC = (
    "very baggy wide-leg faded blue denim jeans with a heavy vintage acid-wash "
    "look, vertical fade streaks on the thighs, dark contrast seams, full-length "
    "puddling break over the shoes, mid-rise waist"
)


def build_tryon_prompt(identity: str) -> str:
    return " ".join(
        [
            f"Identity reference: {identity}",
            "Render that same person wearing the following outfit:",
            f"Top: {SHIRT_DESC}.",
            f"Bottom: {PANTS_DESC}.",
            "Also chunky black leather platform shoes and a thin silver chain necklace.",
            "preserve the described face, hair, skin tone, build, and proportions exactly.",
            HOUSE_STYLE + ".",
            NEGATIVE,
        ]
    )


async def main() -> None:
    if not IDENTITY_PATH.exists():
        raise SystemExit(
            f"identity description not found at {IDENTITY_PATH}; run gen_avatar.py first"
        )

    identity = IDENTITY_PATH.read_text().strip()
    prompt = build_tryon_prompt(identity)
    (OUT_DIR / "tryon_prompt.txt").write_text(prompt)
    print("prompt written to out/tryon_prompt.txt")

    print("rendering outfit with gpt-image-1 generate...")
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

    out_path = OUT_DIR / "tryon.png"
    img = images[0]
    if img.b64_json:
        out_path.write_bytes(base64.b64decode(img.b64_json))
    elif img.url:
        import httpx

        out_path.write_bytes(httpx.get(img.url, timeout=60).content)
    else:
        raise SystemExit("generated image has neither b64_json nor url")

    print(f"saved: {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
