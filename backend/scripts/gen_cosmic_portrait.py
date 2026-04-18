"""Composite the try-on avatar into the cosmic-river style reference via
Higgsfield (seedream v4 edit, with soul fallback).

Inputs expected:
  - backend/out/tryon.png            (the subject portrait)
  - (a user-provided style reference image path — default below)

Usage from backend/:
    PYTHONPATH=. ./venv/bin/python scripts/gen_cosmic_portrait.py \\
        --subject out/tryon.png \\
        --style ~/Downloads/cosmic_river.jpg
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND_DIR / "out"

STYLE_PROMPT = (
    "Ultra-realistic fashion editorial photograph of the same person from the "
    "subject reference, now standing at the center of an endless cosmic river "
    "of luminous particles, stars, and iridescent nebula strands flowing past "
    "them in long curving filaments — styled exactly like the style reference "
    "image. The person is sharply in focus, dressed in their current outfit, "
    "with subtle electric energy arcing across their silhouette as if the "
    "fabric itself is charged. Preserve the person's face, hair, skin tone, "
    "build, and outfit EXACTLY from the subject reference. Pitch-black space "
    "background, glittering multicolored star particles, volumetric starlight "
    "haloing around the person. Cinematic 50mm lens, photoreal skin and fabric "
    "detail, dramatic but soft rim light. No cartoon, no 3D render look, no "
    "plastic skin, no distorted anatomy, no text, no watermark."
)


def _load_env() -> None:
    load_dotenv(BACKEND_DIR / ".env")
    if not (os.environ.get("HF_API_KEY") and os.environ.get("HF_API_SECRET")):
        raise SystemExit("HF_API_KEY and HF_API_SECRET must be set in backend/.env")


def _save_video_or_image(url: str, out_path: Path) -> None:
    with httpx.stream("GET", url, timeout=120) as r:
        r.raise_for_status()
        with out_path.open("wb") as f:
            for chunk in r.iter_bytes():
                f.write(chunk)


def _try_submit(client_mod, model: str, arguments: dict) -> dict | None:
    """Attempt a subscribe call and return the result dict, or None on failure."""
    try:
        print(f"  trying model={model} with keys={list(arguments.keys())}")
        return client_mod.subscribe(model, arguments=arguments)
    except Exception as e:
        print(f"  {model} failed: {type(e).__name__}: {str(e)[:240]}")
        return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--subject",
        type=Path,
        default=OUT_DIR / "tryon.png",
        help="portrait of the person (default: out/tryon.png)",
    )
    ap.add_argument(
        "--style",
        type=Path,
        required=True,
        help="style / scene reference image (e.g. the cosmic river)",
    )
    ap.add_argument(
        "--name",
        default="cosmic",
        help="output basename (produces out/<name>.png)",
    )
    args = ap.parse_args()

    for p in (args.subject, args.style):
        if not p.exists():
            raise SystemExit(f"missing input: {p}")

    _load_env()
    import higgsfield_client  # noqa: PLC0415

    print(f"uploading subject: {args.subject.name}")
    subject_url = higgsfield_client.upload_file(str(args.subject))
    print(f"  -> {subject_url}")
    print(f"uploading style ref: {args.style.name}")
    style_url = higgsfield_client.upload_file(str(args.style))
    print(f"  -> {style_url}")

    # Attempt A: seedream v4 edit with a two-image array (most common shape for
    # multi-reference edit models).
    attempts = [
        (
            "bytedance/seedream/v4/edit",
            {
                "prompt": STYLE_PROMPT,
                "image_urls": [subject_url, style_url],
                "aspect_ratio": "3:4",
            },
        ),
        (
            "bytedance/seedream/v4/edit",
            {
                "prompt": STYLE_PROMPT,
                "reference_image_urls": [subject_url, style_url],
            },
        ),
        (
            "bytedance/seedream/v4/edit",
            {"prompt": STYLE_PROMPT, "image_url": subject_url},
        ),
        (
            "higgsfield-ai/soul/standard",
            {
                "prompt": STYLE_PROMPT,
                "reference_image_url": subject_url,
                "aspect_ratio": "3:4",
                "resolution": "2K",
            },
        ),
        (
            "higgsfield-ai/soul/standard",
            {"prompt": STYLE_PROMPT, "aspect_ratio": "3:4", "resolution": "2K"},
        ),
    ]

    result: dict | None = None
    for model, args_payload in attempts:
        result = _try_submit(higgsfield_client, model, args_payload)
        if result:
            break

    if not result:
        raise SystemExit("every Higgsfield attempt failed — see errors above")

    image_url = None
    images = result.get("images") or []
    if images and isinstance(images, list):
        image_url = images[0].get("url")
    if not image_url:
        video = result.get("video") or {}
        image_url = video.get("url")
    if not image_url:
        raise SystemExit(f"no image/video url in result: {result}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ext = ".png" if ".png" in image_url else ".jpg" if ".jpg" in image_url else ".mp4"
    out_path = OUT_DIR / f"{args.name}{ext}"
    print(f"downloading -> {out_path}")
    _save_video_or_image(image_url, out_path)
    print(f"saved: {out_path}")


if __name__ == "__main__":
    main()
