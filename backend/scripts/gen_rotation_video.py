"""Turn a tryon still into a rotating (orbit) video via Higgsfield.

Reads HF_API_KEY + HF_API_SECRET from backend/.env, uploads the tryon image,
submits it to an image-to-video model with an orbit-rotation prompt, polls
until complete, then downloads the mp4 to backend/out/.

Run from backend/:
    PYTHONPATH=. ./venv/bin/python scripts/gen_rotation_video.py
    PYTHONPATH=. ./venv/bin/python scripts/gen_rotation_video.py \
        --input out/avatar2_tryon.png --name avatar2
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND_DIR / "out"

ROTATION_PROMPT = (
    "Fashion lookbook turntable: the subject stands perfectly still, arms relaxed, "
    "centered in frame, while a motorized rotating platform spins them a complete "
    "full 360 degree revolution — starting facing the camera, rotating smoothly "
    "clockwise to show left side at 90 degrees, full back at 180 degrees, right "
    "side at 270 degrees, and returning to facing the camera at 360 degrees. "
    "The camera itself is locked off and does not move. Constant continuous rotation "
    "speed, pitch-black seamless studio backdrop stays uniform, soft even studio "
    "lighting with subtle rim light, garments and fabric drape naturally. "
    "No zoom, no cuts, no camera shake, no extra people, no environment change, "
    "no reversing direction, no pausing."
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
        default=OUT_DIR / "tryon.png",
        help="still image to animate",
    )
    ap.add_argument(
        "--name",
        default="avatar",
        help="basename for output mp4 (avatar, avatar2, ...)",
    )
    ap.add_argument(
        "--model",
        default="kling-video/v2.1/pro/image-to-video",
        help="Higgsfield image-to-video model id",
    )
    ap.add_argument("--duration", type=int, default=10)
    args = ap.parse_args()

    if not args.input.exists():
        raise SystemExit(f"input image not found: {args.input}")

    _load_env()

    import higgsfield_client  # noqa: PLC0415 — SDK reads env on import

    print(f"uploading {args.input.name} to Higgsfield...")
    image_url = higgsfield_client.upload_file(str(args.input))
    print(f"  uploaded: {image_url}")

    args_payload: dict = {
        "image_url": image_url,
        "prompt": ROTATION_PROMPT,
        "duration": args.duration,
    }
    print(f"submitting to {args.model} (duration={args.duration}s)...")
    print("  polling for status (orbit videos take ~1-3 min)...")

    def on_status(status) -> None:
        print(f"  status: {type(status).__name__}")

    result = higgsfield_client.subscribe(
        args.model,
        arguments=args_payload,
        on_queue_update=on_status,
    )

    video_url = (result.get("video") or {}).get("url")
    if not video_url:
        raise SystemExit(f"no video url in result: {result}")
    print(f"  video url: {video_url}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{args.name}_rotation.mp4"
    with httpx.stream("GET", video_url, timeout=120) as r:
        r.raise_for_status()
        with out_path.open("wb") as f:
            for chunk in r.iter_bytes():
                f.write(chunk)
    print(f"saved: {out_path}")


if __name__ == "__main__":
    main()
