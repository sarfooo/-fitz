"""Supabase Storage helpers — upload render/avatar bytes, get signed URLs."""

from __future__ import annotations

import base64
from io import BytesIO
import uuid
from dataclasses import dataclass

import httpx
import cv2
import numpy as np
from PIL import Image

from app.config import get_settings
from app.services.image_gen import GeneratedImage
from app.services.supabase_client import get_supabase

SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days


@dataclass(frozen=True)
class StoredImage:
    bucket: str
    path: str
    signed_url: str


async def _resolve_bytes(image: GeneratedImage) -> bytes:
    if image.b64_json:
        return base64.b64decode(image.b64_json)
    if image.url:
        async with httpx.AsyncClient(timeout=30) as http:
            r = await http.get(image.url)
            r.raise_for_status()
            return r.content
    raise ValueError("GeneratedImage has neither b64_json nor url")


def _render_to_transparent_png(data: bytes) -> bytes:
    """Remove the near-black studio backdrop and return a transparent PNG.

    Renders are generated with the subject centered on a dark background. We
    identify only the dark region connected to the outer canvas edges, so dark
    garments in the middle are preserved.
    """
    with Image.open(BytesIO(data)) as opened:
        rgba = opened.convert("RGBA")

    rgb = np.array(rgba)[..., :3]
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

    dark_mask = (gray < 54).astype(np.uint8)
    h, w = dark_mask.shape

    background = np.zeros((h, w), dtype=np.uint8)
    if dark_mask[0, :].any():
        background[0, dark_mask[0, :] == 1] = 1
    if dark_mask[-1, :].any():
        background[-1, dark_mask[-1, :] == 1] = 1
    if dark_mask[:, 0].any():
        background[dark_mask[:, 0] == 1, 0] = 1
    if dark_mask[:, -1].any():
        background[dark_mask[:, -1] == 1, -1] = 1

    grown = background.copy()
    previous_sum = -1
    kernel = np.ones((3, 3), dtype=np.uint8)
    while int(grown.sum()) != previous_sum:
        previous_sum = int(grown.sum())
        expanded = cv2.dilate(grown, kernel, iterations=1)
        grown = np.where((expanded == 1) & (dark_mask == 1), 1, 0).astype(np.uint8)

    alpha = np.where(grown == 1, 0, 255).astype(np.uint8)
    alpha = cv2.GaussianBlur(alpha, (0, 0), sigmaX=1.2, sigmaY=1.2)

    out = np.dstack([rgb, alpha])
    output = BytesIO()
    Image.fromarray(out, mode="RGBA").save(output, format="PNG")
    return output.getvalue()


async def upload_generated(
    image: GeneratedImage,
    *,
    bucket: str,
    path_prefix: str,
    content_type: str = "image/png",
    ext: str = "png",
) -> StoredImage:
    data = await _resolve_bytes(image)
    path = f"{path_prefix.rstrip('/')}/{uuid.uuid4().hex}.{ext}"
    sb = get_supabase()
    sb.storage.from_(bucket).upload(
        path=path,
        file=data,
        file_options={"content-type": content_type, "upsert": "false"},
    )
    signed = sb.storage.from_(bucket).create_signed_url(path, SIGNED_URL_TTL_SECONDS)
    return StoredImage(bucket=bucket, path=path, signed_url=signed["signedURL"])


async def upload_avatar(image: GeneratedImage, *, user_id: str) -> StoredImage:
    s = get_settings()
    return await upload_generated(
        image, bucket=s.supabase_bucket_avatars, path_prefix=f"user/{user_id}"
    )


async def upload_render(image: GeneratedImage, *, user_id: str) -> StoredImage:
    s = get_settings()
    data = await _resolve_bytes(image)
    transparent_png = _render_to_transparent_png(data)
    processed = GeneratedImage(url=None, b64_json=base64.b64encode(transparent_png).decode("ascii"))
    return await upload_generated(
        processed,
        bucket=s.supabase_bucket_renders,
        path_prefix=f"user/{user_id}",
        content_type="image/png",
        ext="png",
    )


async def upload_reference_photo(
    data: bytes,
    *,
    user_id: str,
    content_type: str = "image/jpeg",
    ext: str = "jpg",
) -> StoredImage:
    """Upload a raw user-supplied photo (not a generated image) to the avatar bucket."""
    s = get_settings()
    path = f"user/{user_id}/ref/{uuid.uuid4().hex}.{ext}"
    sb = get_supabase()
    sb.storage.from_(s.supabase_bucket_avatars).upload(
        path=path,
        file=data,
        file_options={"content-type": content_type, "upsert": "false"},
    )
    signed = sb.storage.from_(s.supabase_bucket_avatars).create_signed_url(
        path, SIGNED_URL_TTL_SECONDS
    )
    return StoredImage(
        bucket=s.supabase_bucket_avatars,
        path=path,
        signed_url=signed["signedURL"],
    )


def signed_url_for(*, bucket: str, path: str) -> str:
    """Generate a fresh signed URL for an existing storage path."""
    sb = get_supabase()
    signed = sb.storage.from_(bucket).create_signed_url(path, SIGNED_URL_TTL_SECONDS)
    return signed["signedURL"]
