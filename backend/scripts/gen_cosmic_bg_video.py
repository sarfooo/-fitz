"""Turn a still cosmic image into a seamless looping ambient video for use as
the landing-page hero background.

Uses Higgsfield Kling v2.1 Pro image-to-video. The Higgsfield API does not
currently expose a 4K video option — the pro tier caps at 1080p. We request
the highest available and scale with CSS in the browser.

Usage from backend/:
    PYTHONPATH=. ./venv/bin/python scripts/gen_cosmic_bg_video.py \\
        --input out/cosmic_ref.jpg
"""

from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path

import httpx
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
OUT_DIR = BACKEND_DIR / "out"
FRONTEND_PUBLIC = REPO_ROOT / "frontend" / "public"

LOOP_PROMPT = (
    "Seamless cinematic ambient loop of a cosmic river of glittering "
    "multicolored star particles and iridescent nebula filaments flowing "
    "slowly from the top-left to the bottom-right of the frame. No human "
    "figure, no characters, no creatures — only the cosmic scenery. The "
    "particles drift and shimmer, nebula strands gently curl, subtle camera "
    "parallax push-in of about 5 percent over the clip. Pitch-black space "
    "background. Dreamy, meditative pacing. No cuts, no abrupt motion, no "
    "flashing. The first frame and last frame should be nearly identical so "
    "the clip loops seamlessly in a browser video background."
)


def _load_env() -> None:
    load_dotenv(BACKEND_DIR / ".env")
    if not (os.environ.get("HF_API_KEY") and os.environ.get("HF_API_SECRET")):
        raise SystemExit("HF_API_KEY and HF_API_SECRET must be set in backend/.env")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--input",
        type=Path,
        default=OUT_DIR / "cosmic_ref.jpg",
        help="still image to animate (default: out/cosmic_ref.jpg)",
    )
    ap.add_argument(
        "--name",
        default="cosmic_bg",
        help="output basename (produces out/<name>.mp4 and copies to frontend/public)",
    )
    ap.add_argument(
        "--model",
        default="kling-video/v2.1/pro/image-to-video",
        help="Higgsfield image-to-video model id",
    )
    ap.add_argument("--duration", type=int, default=5)
    ap.add_argument(
        "--no-copy",
        action="store_true",
        help="skip copying the final mp4 into frontend/public/",
    )
    args = ap.parse_args()

    if not args.input.exists():
        raise SystemExit(f"missing input: {args.input}")

    _load_env()
    import higgsfield_client  # noqa: PLC0415

    print(f"uploading {args.input.name} to Higgsfield...")
    image_url = higgsfield_client.upload_file(str(args.input))
    print(f"  uploaded: {image_url}")

    print(f"submitting to {args.model} (duration={args.duration}s)...")

    def on_status(status) -> None:
        print(f"  status: {type(status).__name__}")

    result = higgsfield_client.subscribe(
        args.model,
        arguments={
            "image_url": image_url,
            "prompt": LOOP_PROMPT,
            "duration": args.duration,
        },
        on_queue_update=on_status,
    )

    video_url = (result.get("video") or {}).get("url")
    if not video_url:
        raise SystemExit(f"no video url in result: {result}")
    print(f"  video url: {video_url}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{args.name}.mp4"
    with httpx.stream("GET", video_url, timeout=300) as r:
        r.raise_for_status()
        with out_path.open("wb") as f:
            for chunk in r.iter_bytes():
                f.write(chunk)
    print(f"saved: {out_path}")

    if not args.no_copy:
        FRONTEND_PUBLIC.mkdir(parents=True, exist_ok=True)
        final = FRONTEND_PUBLIC / f"{args.name}.mp4"
        shutil.copyfile(out_path, final)
        print(f"copied to frontend public: {final}")


if __name__ == "__main__":
    main()
