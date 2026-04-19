"""End-to-end fit render pipeline used by POST /tryon/fit.

Given one or more garment image URLs and a stored identity description, this
pipeline:
  1. Fetches and captions each garment with Gemini (description-bridge)
  2. Builds the full try-on prompt (identity + all selected garments)
  3. Renders a new image via gpt-image-1

This mirrors scripts/gen_tryon.py but operates on URLs + a stored identity
description instead of local files + a text file.
"""

from __future__ import annotations

import base64
import mimetypes
from typing import Any

import httpx
from dedalus_labs import AsyncDedalus

from app.config import get_settings
from app.services.image_gen import GeneratedImage, _async_client, _unwrap
from app.services.prompts import HOUSE_STYLE, NEGATIVE
from app.services.supabase_client import get_supabase


GARMENT_INSTRUCTION = (
    "Describe this single {kind} garment for a fashion try-on prompt. Cover: "
    "primary color and any secondary colors, fabric and visible texture, cut/fit "
    "(fitted, relaxed, baggy, oversized), length, notable details (graphics, "
    "patterns, washes, stitching, hardware, collar/neckline, sleeves, hem), "
    "where it sits on the body, and whether it should be inner layer, outer layer, "
    "footwear, bag, or accessory. Be specific about logos, graphics, distressing, "
    "and silhouette. 2-4 dense sentences, no person, no background, no guesses about brand."
)

UNSELECTED_GARMENT_RULES = (
    "Only use the selected garments described below. Do not invent extra tops, "
    "pants, skirts, jackets, shoes, bags, or accessories that were not selected."
)

GARMENT_FIDELITY_RULES = (
    "Preserve each selected garment faithfully: keep the exact garment type, category, "
    "dominant color, visible graphics, wash, distressing, hardware, proportions, and "
    "overall silhouette. Do not simplify statement pieces into plain basics."
)

OUTFIT_COMPOSITION_RULES = (
    "All selected garments must appear in the final image at the same time unless two "
    "selected pieces are physically impossible to wear together. If layering is needed, "
    "place each garment in the most natural realistic order while keeping every selected "
    "piece visible enough to be recognized."
)


def _detect_mime(data: bytes, fallback: str = "image/png") -> str:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:2] == b"\xff\xd8":
        return "image/jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return fallback


def _data_url(data: bytes, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


async def _download(url: str) -> tuple[bytes, str]:
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as http:
        r = await http.get(url)
        r.raise_for_status()
        data = r.content
        mime = _detect_mime(data, fallback=r.headers.get("content-type", "image/png"))
    return data, mime


async def describe_garment(image_url: str, kind: str) -> str:
    """Caption a garment image with Gemini (returns 2-3 sentences)."""
    settings = get_settings()
    if not settings.dedalus_api_key:
        raise RuntimeError("DEDALUS_API_KEY is not configured")

    data, mime = await _download(image_url)
    parts = [
        {"type": "text", "text": GARMENT_INSTRUCTION.format(kind=kind)},
        {"type": "image_url", "image_url": {"url": _data_url(data, mime)}},
    ]
    async with AsyncDedalus(api_key=settings.dedalus_api_key) as client:
        resp = await client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[{"role": "user", "content": parts}],
        )
    text = (resp.choices[0].message.content or "").strip()
    if not text:
        raise RuntimeError(f"Gemini returned empty caption for {kind}")
    return text


def build_fit_prompt(
    *,
    identity: str,
    garment_descs: list[str],
) -> str:
    """Concatenate identity + selected garments + house style."""
    garment_lines = [
        f"Selected garment {index + 1}: {desc}."
        for index, desc in enumerate(garment_descs)
    ]
    return " ".join(
        [
            f"Identity reference: {identity}",
            "Render that same person wearing all of the following selected garments together as one cohesive outfit:",
            *garment_lines,
            f"There are exactly {len(garment_descs)} selected garments. Keep all {len(garment_descs)} present in the final outfit.",
            "Do not omit any selected garment. If any selected garment is footwear, a bag, or an accessory, place it naturally and correctly on the person.",
            GARMENT_FIDELITY_RULES,
            OUTFIT_COMPOSITION_RULES,
            UNSELECTED_GARMENT_RULES,
            "Keep the person's pose simple and front-facing so the outfit is easy to inspect.",
            "preserve the described face, hair, skin tone, build, and proportions exactly.",
            "Use the same dark FitCheck site backdrop: almost pure black, softly vignetted, "
            "with only a very subtle shadow glow behind the body and no light gray studio wash.",
            HOUSE_STYLE + ".",
            NEGATIVE,
        ]
    )


def load_latest_identity(user_id: str) -> dict[str, Any] | None:
    """Most recent avatar row with a non-empty identity_description.

    Also returns the generated avatar image path + bucket so the fit pipeline
    can composite the saved avatar image with garment references.
    """
    sb = get_supabase()
    res = (
        sb.table("avatars")
        .select("id, identity_description, base_image_path, bucket")
        .eq("user_id", user_id)
        .not_.is_("identity_description", "null")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None


def download_avatar_bytes(bucket: str, path: str) -> tuple[bytes, str]:
    """Pull the generated avatar PNG back out of Supabase storage (sync)."""
    sb = get_supabase()
    data = sb.storage.from_(bucket).download(path)
    mime = _detect_mime(data, fallback="image/png")
    return data, mime


async def adownload_avatar_bytes(bucket: str, path: str) -> tuple[bytes, str]:
    """Async avatar fetch — uses a signed URL + httpx so the 5s sync SDK
    timeout doesn't hit us, and so we never block the event loop."""
    from app.services.storage import signed_url_for

    url = signed_url_for(bucket=bucket, path=path)
    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as http:
        r = await http.get(url)
        r.raise_for_status()
        data = r.content
    mime = _detect_mime(data, fallback="image/png")
    return data, mime


async def render_fit_image(prompt: str, *, size: str = "1024x1024") -> GeneratedImage:
    """Call gpt-image-1 and return the first generated image."""
    async with _async_client() as client:
        raw = await client.images.generate(
            prompt=prompt,
            size=size,
            quality="high",
            model="openai/gpt-image-1",
        )
    images = _unwrap(raw)
    if not images:
        raise RuntimeError("Dedalus returned no images")
    return images[0]


# Banana 2 (Gemini 3.1 Flash Image) prompts are tuned differently from
# gpt-image-1. The avatar and garment images are passed in as pixel references,
# so the text prompt describes *what changes* (backdrop, pose, composition)
# rather than re-describing the subject. Identity drift is worst when the text
# prompt redundantly describes a person whose image is already attached.

BANANA_AVATAR_PROMPT = (
    "A full-body photograph of the person shown in the reference images. "
    "Framing: head-to-toe, centered, facing the camera straight-on, arms "
    "relaxed at sides, neutral expression, simple standing pose. "
    "Wearing a plain fitted neutral base layer — a solid light gray crew-neck "
    "t-shirt and matching plain pants. No logos, no patterns, no accessories. "
    "Backdrop: a near-black seamless studio backdrop, softly vignetted, with "
    "a subtle shadow glow behind the body and no visible floor line. "
    "Lighting: soft, even, slightly directional from the front, preserving "
    "natural skin texture. "
    "The subject's face, features, hair, skin tone, and build must exactly "
    "match the person in the reference photos — this is the same person. "
    "Do not idealize, stylize, or beautify. "
    "Photorealistic, natural skin texture, no cartoon, no illustration."
)


ANGLE_LABELS: tuple[str, ...] = (
    "left",
    "left_three_quarter",
    "right_three_quarter",
    "right",
)


_ANGLE_CAMERA_DIRECTION: dict[str, str] = {
    "left": (
        "A full LEFT-side profile photograph. The camera is positioned "
        "directly to the subject's left. Visible: the subject's LEFT ear, "
        "the LEFT half of their face in profile, the LEFT shoulder, LEFT "
        "arm, LEFT hip, and the LEFT side of the torso and legs. The RIGHT "
        "side of the body is entirely hidden behind the left side. This is "
        "NOT a mirrored or horizontally flipped version of the right "
        "profile — the subject has natural left/right asymmetries (hair "
        "part, face shape, clothing details) that must remain consistent "
        "with how the subject's left side genuinely looks."
    ),
    "left_three_quarter": (
        "A three-quarter photograph from the subject's FRONT-LEFT. The "
        "camera has moved roughly halfway between straight-on and the full "
        "left profile. Most of the LEFT side of the face and body is "
        "visible; a thin sliver of the right side of the nose and right "
        "shoulder is also visible. The subject's LEFT ear and LEFT cheek "
        "are prominent. This is NOT a mirror of the right three-quarter "
        "view — asymmetries differ."
    ),
    "right_three_quarter": (
        "A three-quarter photograph from the subject's FRONT-RIGHT. The "
        "camera has moved roughly halfway between straight-on and the full "
        "right profile. Most of the RIGHT side of the face and body is "
        "visible; a thin sliver of the left side of the nose and left "
        "shoulder is also visible. The subject's RIGHT ear and RIGHT cheek "
        "are prominent. This is NOT a mirror of the left three-quarter "
        "view — asymmetries differ."
    ),
    "right": (
        "A full RIGHT-side profile photograph. The camera is positioned "
        "directly to the subject's right. Visible: the subject's RIGHT "
        "ear, the RIGHT half of their face in profile, the RIGHT shoulder, "
        "RIGHT arm, RIGHT hip, and the RIGHT side of the torso and legs. "
        "The LEFT side of the body is entirely hidden behind the right "
        "side. This is NOT a mirrored or horizontally flipped version of "
        "the left profile — the subject has natural left/right asymmetries "
        "(hair part, face shape, clothing details) that must remain "
        "consistent with how the subject's right side genuinely looks."
    ),
}


def build_banana_angle_prompt(angle: str) -> str:
    """Prompt for a side/3-quarter rendering derived from a front render.

    The front render is passed as the single reference image — it anchors the
    subject, outfit, and backdrop. The prompt only asks Banana to re-render
    the exact same scene from a new camera angle.
    """
    direction = _ANGLE_CAMERA_DIRECTION.get(angle)
    if direction is None:
        raise ValueError(f"unsupported angle: {angle}")
    return " ".join(
        [
            "Re-render the exact same person wearing the exact same outfit "
            "shown in the reference image, but from a different camera angle:",
            direction + ".",
            "Preserve everything else exactly: the face, hair, skin tone, "
            "build, every garment (colors, prints, hardware, cut, proportions), "
            "the pose stance, the near-black seamless studio backdrop, the "
            "soft vignette, and the lighting. This is the same moment of the "
            "same shoot, captured by a second camera.",
            "Framing: full-body, head to shoes, subject centered.",
            "Photorealistic, natural skin texture. Do not add, remove, or "
            "modify garments, accessories, or props.",
        ]
    )


def build_banana_fit_prompt(garment_descs: list[str]) -> str:
    """Compose a Banana 2 fit prompt.

    The avatar is passed in as the first reference image (identity anchor) and
    each garment follows in order. The text anchors references by position and
    emphasizes preserving the garment pixels + avatar face.
    """
    garment_lines = [
        f"Garment {index + 1}: {desc}"
        for index, desc in enumerate(garment_descs)
    ]
    n = len(garment_descs)
    return " ".join(
        [
            "A full-body photograph of the person from the first reference "
            "image, dressed in the garments shown in the subsequent reference "
            "images.",
            f"There are exactly {n} selected garments and all {n} must appear "
            "on the person in the final image.",
            *garment_lines,
            "Preserve each garment exactly as shown in its reference image — "
            "same colors, graphics, prints, wash, cut, proportions, and "
            "hardware. Do not simplify statement pieces into plain basics.",
            "Layer the pieces in a natural realistic order so every garment "
            "stays visible enough to recognize. If a piece is footwear, a "
            "bag, or an accessory, place it correctly on the body.",
            "Framing: full-body, head to shoes, subject centered, facing the "
            "camera straight-on, arms relaxed at sides, simple pose.",
            "Backdrop: a near-black seamless studio backdrop with a soft "
            "vignette and a subtle shadow glow behind the body, no visible "
            "floor line.",
            "Preserve the face, hair, skin tone, and build of the person in "
            "the first reference image exactly — this is the same person.",
            "Photorealistic, natural skin texture. Do not add garments, "
            "accessories, props, or backgrounds that are not shown in the "
            "references.",
        ]
    )


IDENTITY_INSTRUCTION = (
    "Describe this person for a photorealistic fashion try-on prompt. Cover: "
    "approximate age range, skin tone, face shape, prominent features (nose, "
    "jawline, eyes, facial hair if any), hair color + texture + length, build "
    "(slim/average/athletic/heavy), height impression, posture. 3-4 dense "
    "sentences. Do NOT describe clothing. Do NOT name the person or guess "
    "ethnicity/race — stick to visible physical traits."
)


async def describe_person_from_refs(
    references: list[tuple[bytes, str]],
) -> str:
    """Caption the user's reference photos with Gemini → identity description.

    ``references`` is a list of (bytes, mime) tuples. Returns 3-4 sentences.
    """
    settings = get_settings()
    if not settings.dedalus_api_key:
        raise RuntimeError("DEDALUS_API_KEY is not configured")
    if not references:
        raise ValueError("at least one reference photo is required")

    content: list[dict[str, Any]] = [
        {"type": "text", "text": IDENTITY_INSTRUCTION}
    ]
    for data, mime in references[:5]:
        content.append(
            {"type": "image_url", "image_url": {"url": _data_url(data, mime)}}
        )

    async with AsyncDedalus(api_key=settings.dedalus_api_key) as client:
        resp = await client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[{"role": "user", "content": content}],
        )
    text = (resp.choices[0].message.content or "").strip()
    if not text:
        raise RuntimeError("Gemini returned empty identity description")
    return text
