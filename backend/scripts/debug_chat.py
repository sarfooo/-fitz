"""Dump raw chat-completion response to diagnose image output shape."""

from __future__ import annotations

import asyncio
import base64
import json
import mimetypes
from pathlib import Path

from dedalus_labs import AsyncDedalus

from app.config import get_settings

REPO_ROOT = Path(__file__).resolve().parents[2]
AVATAR_DIR = REPO_ROOT / "avatar"


def _data_url(data: bytes, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


async def main() -> None:
    settings = get_settings()
    files = sorted(AVATAR_DIR.iterdir())[:2]
    parts = [
        {
            "type": "text",
            "text": "Generate an image: a FitCheck-style full body avatar of the person shown in these reference photos, pitch-black backdrop, centered, photoreal.",
        }
    ]
    for p in files:
        mime = mimetypes.guess_type(p.name)[0] or "image/jpeg"
        parts.append({"type": "image_url", "image_url": {"url": _data_url(p.read_bytes(), mime)}})

    async with AsyncDedalus(api_key=settings.dedalus_api_key) as client:
        raw = await client.chat.completions.with_raw_response.create(
            model="google/gemini-2.5-flash-image",
            messages=[{"role": "user", "content": parts}],
            extra_body={"modalities": ["image", "text"]},
        )
        body_text = raw.http_response.text
    # Redact base64 payloads for printing
    redacted = body_text
    out_path = Path(__file__).resolve().parents[1] / "out" / "raw_chat.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(body_text)
    print(f"wrote raw body to {out_path} ({len(body_text)} chars)")
    # Parse and print top-level keys + a shallow snapshot
    try:
        parsed = json.loads(body_text)
    except Exception as e:
        print("parse error:", e)
        print(body_text[:2000])
        return

    def summarize(obj, depth=0, max_depth=6):
        pad = "  " * depth
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, (dict, list)) and depth < max_depth:
                    print(f"{pad}{k}:")
                    summarize(v, depth + 1, max_depth)
                else:
                    s = repr(v)
                    if len(s) > 120:
                        s = s[:120] + f"... (len={len(s)})"
                    print(f"{pad}{k}: {s}")
        elif isinstance(obj, list):
            print(f"{pad}[list len={len(obj)}]")
            if obj and depth < max_depth:
                summarize(obj[0], depth + 1, max_depth)

    summarize(parsed)


if __name__ == "__main__":
    asyncio.run(main())
