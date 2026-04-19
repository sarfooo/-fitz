from app.services.credits import get_credit_summary, spend_credits
from app.services.image_gen import (
    acompose_from_references,
    acompose_outfit,
    acompose_with_gpt_image,
    aedit_image,
    agenerate_image,
)
from app.services.prompts import (
    build_avatar_from_photo_prompt,
    build_avatar_prompt,
    build_outfit_prompt,
    build_tryon_prompt,
)
from app.services.renders import insert_avatar, insert_render
from app.services.storage import upload_avatar, upload_render


def spend_tryon_credits(user_id: str, amount: int, description: str):
    result = spend_credits(user_id, amount, description)
    if result is False:
        return False
    return result


def credits_remaining(user_id: str) -> int:
    summary = get_credit_summary(user_id)
    return summary["balance"]


__all__ = [
    "acompose_from_references",
    "acompose_outfit",
    "acompose_with_gpt_image",
    "aedit_image",
    "agenerate_image",
    "build_avatar_from_photo_prompt",
    "build_avatar_prompt",
    "build_outfit_prompt",
    "build_tryon_prompt",
    "insert_avatar",
    "insert_render",
    "upload_avatar",
    "upload_render",
    "spend_tryon_credits",
    "credits_remaining",
]
