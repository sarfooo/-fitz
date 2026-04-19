"""Nano Banana 2 (Gemini 3.1 Flash Image) wrapper for FitCheck.

Direct integration with the Gemini API via ``google-genai``. Used for:
  1. Avatar generation from user reference photos (multi-image → portrait on
     FitCheck-style near-black backdrop).
  2. Outfit composition: avatar image + garment reference images → composed
     full-body try-on render.

Banana 2 accepts multiple reference images in one call and preserves subject
and garment identity substantially better than text-only gpt-image-1, which
is the whole point of this swap.
"""

from __future__ import annotations

import base64
from typing import Iterable

from google import genai
from google.genai import types

from app.config import get_settings
from app.services.image_gen import GeneratedImage


MODEL_BANANA_2 = "gemini-3.1-flash-image-preview"


def _client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError("GOOGLE_API_KEY is not configured")
    return genai.Client(api_key=settings.google_api_key)


def _image_parts(references: Iterable[tuple[bytes, str]]) -> list[types.Part]:
    return [
        types.Part.from_bytes(data=data, mime_type=mime)
        for data, mime in references
    ]


def _extract_images(response) -> list[GeneratedImage]:
    """Pull inline_data image bytes off a Gemini image-gen response."""
    out: list[GeneratedImage] = []
    for candidate in response.candidates or []:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            inline = getattr(part, "inline_data", None)
            data = getattr(inline, "data", None) if inline else None
            if not data:
                continue
            if isinstance(data, (bytes, bytearray)):
                b64 = base64.b64encode(bytes(data)).decode("ascii")
            else:
                b64 = str(data)
            out.append(GeneratedImage(url=None, b64_json=b64))
    return out


async def _generate(
    *,
    parts: list[types.Part],
    aspect_ratio: str,
) -> list[GeneratedImage]:
    config = types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
    )
    response = await _client().aio.models.generate_content(
        model=MODEL_BANANA_2,
        contents=parts,
        config=config,
    )
    images = _extract_images(response)
    if not images:
        raise RuntimeError("Nano Banana 2 returned no images")
    return images


async def acompose_avatar_from_refs(
    *,
    references: list[tuple[bytes, str]],
    prompt: str,
    aspect_ratio: str = "2:3",
) -> list[GeneratedImage]:
    """Generate an avatar portrait from user reference photos.

    ``references`` is a list of (bytes, mime) tuples (up to a handful — more
    than ~5 doesn't help identity capture). ``prompt`` describes the desired
    portrait (pose, backdrop, neutral base layer, fidelity rules).
    """
    if not references:
        raise ValueError("at least one reference photo is required")
    parts: list[types.Part] = [types.Part.from_text(text=prompt)]
    parts.extend(_image_parts(references))
    return await _generate(parts=parts, aspect_ratio=aspect_ratio)


async def acompose_fit(
    *,
    avatar: tuple[bytes, str],
    garments: list[tuple[bytes, str]],
    prompt: str,
    aspect_ratio: str = "2:3",
) -> list[GeneratedImage]:
    """Compose a full-body try-on render from avatar + garment references.

    Sends the avatar image first, then each garment image in order, plus the
    composed text prompt. The model uses the avatar as identity anchor and
    re-dresses it in the pixel-referenced garments.
    """
    parts: list[types.Part] = [types.Part.from_text(text=prompt)]
    parts.append(types.Part.from_bytes(data=avatar[0], mime_type=avatar[1]))
    parts.extend(_image_parts(garments))
    return await _generate(parts=parts, aspect_ratio=aspect_ratio)


async def acompose_angle(
    *,
    front: tuple[bytes, str],
    prompt: str,
    aspect_ratio: str = "2:3",
) -> list[GeneratedImage]:
    """Render a new camera angle of an existing front render.

    Only the front render image is passed — it anchors the subject, outfit,
    and backdrop. The prompt describes the new camera direction.
    """
    parts: list[types.Part] = [
        types.Part.from_text(text=prompt),
        types.Part.from_bytes(data=front[0], mime_type=front[1]),
    ]
    return await _generate(parts=parts, aspect_ratio=aspect_ratio)
