"""Supabase Storage helpers — upload render/avatar bytes, get signed URLs."""

from __future__ import annotations

import base64
import uuid
from dataclasses import dataclass

import httpx

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
    return await upload_generated(
        image, bucket=s.supabase_bucket_renders, path_prefix=f"user/{user_id}"
    )
