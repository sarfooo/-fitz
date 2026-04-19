"""Dedalus image-generation wrapper for FitCheck."""

from __future__ import annotations

import base64
from dataclasses import dataclass
from typing import IO, Literal

from dedalus_labs import AsyncDedalus, Dedalus

from app.config import get_settings

ImageSize = Literal[
    "256x256", "512x512", "1024x1024", "1536x1024", "1024x1536", "1792x1024", "1024x1792", "auto"
]
ImageQuality = Literal["auto", "high", "medium", "low", "hd", "standard"]
ResponseFormat = Literal["url", "b64_json"]
OutputFormat = Literal["png", "jpeg", "webp"]


@dataclass(frozen=True)
class GeneratedImage:
    url: str | None
    b64_json: str | None
    revised_prompt: str | None = None

    def bytes(self) -> bytes | None:
        return base64.b64decode(self.b64_json) if self.b64_json else None


def _client() -> Dedalus:
    settings = get_settings()
    if not settings.dedalus_api_key:
        raise RuntimeError("DEDALUS_API_KEY is not configured")
    return Dedalus(api_key=settings.dedalus_api_key)


def _async_client() -> AsyncDedalus:
    settings = get_settings()
    if not settings.dedalus_api_key:
        raise RuntimeError("DEDALUS_API_KEY is not configured")
    return AsyncDedalus(api_key=settings.dedalus_api_key)


def _unwrap(result) -> list[GeneratedImage]:
    data = getattr(result, "data", None) or []
    return [
        GeneratedImage(
            url=getattr(d, "url", None),
            b64_json=getattr(d, "b64_json", None),
            revised_prompt=getattr(d, "revised_prompt", None),
        )
        for d in data
    ]


def generate_image(
    prompt: str,
    *,
    size: ImageSize = "1024x1024",
    quality: ImageQuality = "high",
    n: int = 1,
    response_format: ResponseFormat = "url",
    output_format: OutputFormat = "png",
    model: str | None = None,
    user: str | None = None,
) -> list[GeneratedImage]:
    """Text-to-image. Use for base avatar or solo-garment references."""
    kwargs: dict = {
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "n": n,
        "response_format": response_format,
        "output_format": output_format,
    }
    if model:
        kwargs["model"] = model
    if user:
        kwargs["user"] = user
    return _unwrap(_client().images.generate(**kwargs))


def edit_image(
    image: IO[bytes] | bytes | tuple,
    prompt: str,
    *,
    mask: IO[bytes] | bytes | tuple | None = None,
    size: str = "1024x1024",
    n: int = 1,
    model: str | None = None,
) -> list[GeneratedImage]:
    """Image-to-image edit: the real try-on path. Pass the user's avatar as `image`
    and describe the garment in `prompt`."""
    kwargs: dict = {"image": image, "prompt": prompt, "size": size, "n": n}
    if mask is not None:
        kwargs["mask"] = mask
    if model:
        kwargs["model"] = model
    return _unwrap(_client().images.edit(**kwargs))


async def agenerate_image(
    prompt: str,
    *,
    size: ImageSize = "1024x1024",
    quality: ImageQuality = "high",
    n: int = 1,
    response_format: ResponseFormat | None = None,
    output_format: OutputFormat | None = None,
    model: str | None = None,
    user: str | None = None,
) -> list[GeneratedImage]:
    kwargs: dict = {
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "n": n,
    }
    # gpt-image-1 does not accept response_format / output_format; only include
    # when the caller explicitly opts in (e.g. dall-e-3 path).
    if response_format is not None:
        kwargs["response_format"] = response_format
    if output_format is not None:
        kwargs["output_format"] = output_format
    if model:
        kwargs["model"] = model
    if user:
        kwargs["user"] = user
    async with _async_client() as client:
        return _unwrap(await client.images.generate(**kwargs))


async def aedit_image(
    image: IO[bytes] | bytes | tuple,
    prompt: str,
    *,
    mask: IO[bytes] | bytes | tuple | None = None,
    size: str = "1024x1024",
    n: int = 1,
    model: str | None = None,
) -> list[GeneratedImage]:
    kwargs: dict = {"image": image, "prompt": prompt, "size": size, "n": n}
    if mask is not None:
        kwargs["mask"] = mask
    if model:
        kwargs["model"] = model
    async with _async_client() as client:
        return _unwrap(await client.images.edit(**kwargs))


def _data_url(data: bytes, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


def _extract_images_from_chat(completion) -> list[GeneratedImage]:
    """Walk a chat-completion response and pull out any base64 image payloads.

    Gemini-2.5-flash-image (via OpenAI-compat) returns images either as
    ``data:image/...;base64,...`` URIs inside content parts or as extra
    ``images[*].image_url.url`` fields on the message. We scan defensively.
    """
    try:
        data = completion.model_dump()
    except AttributeError:
        data = completion if isinstance(completion, dict) else {}

    found: list[GeneratedImage] = []
    seen: set[str] = set()

    def add_b64(b64: str) -> None:
        if b64 and b64 not in seen:
            seen.add(b64)
            found.append(GeneratedImage(url=None, b64_json=b64))

    def walk(obj: object) -> None:
        if isinstance(obj, str):
            if obj.startswith("data:image/") and ";base64," in obj:
                add_b64(obj.split(",", 1)[1])
        elif isinstance(obj, dict):
            for v in obj.values():
                walk(v)
        elif isinstance(obj, list):
            for item in obj:
                walk(item)

    walk(data)
    return found


async def acompose_from_references(
    *,
    references: list[tuple[bytes, str]],
    prompt: str,
    model: str = "google/gemini-2.5-flash-image",
) -> list[GeneratedImage]:
    """Generic multi-image → image call. Sends N reference images + a text
    prompt to a multimodal image model and returns generated images."""
    if not references:
        raise ValueError("at least one reference image is required")
    parts: list[dict] = [{"type": "text", "text": prompt}]
    for data, mime in references:
        parts.append({"type": "image_url", "image_url": {"url": _data_url(data, mime)}})

    async with _async_client() as client:
        completion = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": parts}],
        )
    return _extract_images_from_chat(completion)


async def acompose_outfit(
    *,
    avatar: tuple[bytes, str],
    garments: list[tuple[bytes, str]],
    prompt: str,
    model: str = "google/gemini-2.5-flash-image",
) -> list[GeneratedImage]:
    """Multi-image try-on via chat completions.

    Sends the avatar plus any number of garment reference images to a
    multimodal image model and returns the composited render.
    """
    avatar_bytes, avatar_mime = avatar
    parts: list[dict] = [
        {"type": "text", "text": prompt},
        {"type": "image_url", "image_url": {"url": _data_url(avatar_bytes, avatar_mime)}},
    ]
    for g_bytes, g_mime in garments:
        parts.append(
            {"type": "image_url", "image_url": {"url": _data_url(g_bytes, g_mime)}}
        )

    async with _async_client() as client:
        completion = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": parts}],
        )
    return _extract_images_from_chat(completion)


def _ext_for(mime: str) -> str:
    if "png" in mime:
        return "png"
    if "webp" in mime:
        return "webp"
    return "jpg"


async def acompose_with_gpt_image(
    *,
    images: list[tuple[bytes, str]],
    prompt: str,
    size: str = "1024x1536",
    quality: str | None = None,  # unused on Dedalus SDK's edit endpoint
    n: int = 1,
    model: str = "openai/gpt-image-1",
) -> list[GeneratedImage]:
    """Multi-image compose via gpt-image-1's images.edit endpoint.

    gpt-image-1 accepts an array of reference images on the edit endpoint. We
    wrap each (bytes, mime) tuple into a named file tuple the SDK expects:
    ``(filename, bytes, mime)``. The ``quality`` param is accepted but unused
    because the Dedalus SDK's images.edit() does not forward it.
    """
    if not images:
        raise ValueError("at least one reference image is required")
    image_tuples = [
        (f"ref_{i}.{_ext_for(mime)}", data, mime)
        for i, (data, mime) in enumerate(images)
    ]
    kwargs: dict = {
        "model": model,
        "image": image_tuples if len(image_tuples) > 1 else image_tuples[0],
        "prompt": prompt,
        "n": n,
    }
    if size:
        kwargs["size"] = size
    async with _async_client() as client:
        raw = await client.images.edit(**kwargs)
    return _unwrap(raw)
