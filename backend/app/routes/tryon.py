from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.deps.auth import get_current_user_id
from app.schemas.schemas import (
    AvatarRequest,
    AvatarResponse,
    GeneratedImageOut,
    TryOnGenerateRequest,
    TryOnResponse,
)
from app.services.tryon import (
    acompose_from_references,
    acompose_outfit,
    aedit_image,
    agenerate_image,
    build_avatar_from_photo_prompt,
    build_avatar_prompt,
    build_outfit_prompt,
    build_tryon_prompt,
    credits_remaining,
    insert_avatar,
    insert_render,
    spend_tryon_credits,
    upload_avatar,
    upload_render,
)


router = APIRouter(prefix="/tryon", tags=["tryon"])


def ensure_credit_spend(user_id: str, amount: int, description: str):
    result = spend_tryon_credits(user_id, amount, description)
    if result is False:
        raise HTTPException(status_code=400, detail="Not enough credits")
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to update credits")


@router.post("/avatar", response_model=AvatarResponse)
async def create_avatar(
    req: AvatarRequest,
    user_id: str = Depends(get_current_user_id),
):
    prompt = build_avatar_prompt(
        height_cm=req.height_cm,
        body_notes=req.body_notes,
        hair=req.hair,
        skin_tone=req.skin_tone,
    )
    try:
        images = await agenerate_image(
            prompt,
            size=req.size,
            quality=req.quality,
            response_format="url",
        )
        if not images:
            raise RuntimeError("Dedalus returned no images")

        stored = await upload_avatar(images[0], user_id=user_id)
        row = insert_avatar(
            user_id=user_id,
            storage_path=stored.path,
            bucket=stored.bucket,
            prompt=prompt,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        return AvatarResponse(success=False, error=str(exc), prompt_used=prompt)

    return AvatarResponse(
        success=True,
        avatar_id=row.get("id"),
        image=GeneratedImageOut(
            url=images[0].url,
            revised_prompt=images[0].revised_prompt,
            storage_path=stored.path,
            bucket=stored.bucket,
            signed_url=stored.signed_url,
        ),
        prompt_used=prompt,
    )


@router.post("/generate", response_model=TryOnResponse)
async def generate_tryon(
    req: TryOnGenerateRequest,
    user_id: str = Depends(get_current_user_id),
):
    prompt = build_tryon_prompt(
        item_description=req.item_description,
        size_label=req.size_label,
        fit_preference=req.fit_preference,
        layering_notes=req.layering_notes,
    )
    ensure_credit_spend(user_id, 1, f"Try-on render for {req.item_description}")
    try:
        images = await agenerate_image(
            prompt,
            size=req.image_size,
            quality=req.quality,
            response_format="url",
        )
        if not images:
            raise RuntimeError("Dedalus returned no images")

        stored = await upload_render(images[0], user_id=user_id)
        row = insert_render(
            user_id=user_id,
            avatar_id=req.avatar_id,
            top_garment_id=req.top_garment_id,
            bottom_garment_id=req.bottom_garment_id,
            prompt=prompt,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        return TryOnResponse(success=False, error=str(exc), prompt_used=prompt)

    return TryOnResponse(
        success=True,
        render_id=row.get("id"),
        image=GeneratedImageOut(
            url=images[0].url,
            revised_prompt=images[0].revised_prompt,
            storage_path=stored.path,
            bucket=stored.bucket,
            signed_url=stored.signed_url,
        ),
        prompt_used=prompt,
        credits_remaining=credits_remaining(user_id),
    )


@router.post("/edit", response_model=TryOnResponse)
async def edit_tryon(
    avatar: UploadFile = File(...),
    item_description: str = Form(...),
    top_garment_id: str | None = Form(None),
    bottom_garment_id: str | None = Form(None),
    avatar_id: str | None = Form(None),
    fit_preference: str = Form("regular"),
    size_label: str = Form(""),
    layering_notes: str = Form(""),
    image_size: str = Form("1024x1024"),
    mask: UploadFile | None = File(None),
    user_id: str = Depends(get_current_user_id),
):
    prompt = build_tryon_prompt(
        item_description=item_description,
        size_label=size_label,
        fit_preference=fit_preference,
        layering_notes=layering_notes,
    )
    avatar_bytes = await avatar.read()
    mask_bytes = await mask.read() if mask else None
    image_tuple = (
        avatar.filename or "avatar.png",
        avatar_bytes,
        avatar.content_type or "image/png",
    )
    mask_tuple = (
        (mask.filename or "mask.png", mask_bytes, mask.content_type or "image/png")
        if mask_bytes
        else None
    )
    ensure_credit_spend(user_id, 1, f"Edited try-on render for {item_description}")
    try:
        images = await aedit_image(
            image=image_tuple,
            prompt=prompt,
            mask=mask_tuple,
            size=image_size,
        )
        if not images:
            raise RuntimeError("Dedalus returned no images")

        stored = await upload_render(images[0], user_id=user_id)
        row = insert_render(
            user_id=user_id,
            avatar_id=avatar_id,
            top_garment_id=top_garment_id,
            bottom_garment_id=bottom_garment_id,
            prompt=prompt,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        return TryOnResponse(success=False, error=str(exc), prompt_used=prompt)

    return TryOnResponse(
        success=True,
        render_id=row.get("id"),
        image=GeneratedImageOut(
            url=images[0].url,
            revised_prompt=images[0].revised_prompt,
            storage_path=stored.path,
            bucket=stored.bucket,
            signed_url=stored.signed_url,
        ),
        prompt_used=prompt,
        credits_remaining=credits_remaining(user_id),
    )


@router.post("/outfit", response_model=TryOnResponse)
async def outfit_tryon(
    avatar: UploadFile = File(...),
    shirt: UploadFile | None = File(None),
    pants: UploadFile | None = File(None),
    top_garment_id: str | None = Form(None),
    bottom_garment_id: str | None = Form(None),
    avatar_id: str | None = Form(None),
    fit_preference: str = Form("regular"),
    size_label: str = Form(""),
    layering_notes: str = Form(""),
    user_id: str = Depends(get_current_user_id),
):
    if shirt is None and pants is None:
        raise HTTPException(status_code=400, detail="at least one garment is required")

    avatar_bytes = await avatar.read()
    avatar_mime = avatar.content_type or "image/png"
    garments = []
    garment_labels = []
    if shirt is not None:
        garments.append((await shirt.read(), shirt.content_type or "image/png"))
        garment_labels.append("shirt")
    if pants is not None:
        garments.append((await pants.read(), pants.content_type or "image/png"))
        garment_labels.append("pants")

    prompt = build_outfit_prompt(
        garment_labels=garment_labels,
        fit_preference=fit_preference,
        size_label=size_label,
        layering_notes=layering_notes,
    )
    ensure_credit_spend(user_id, 5, "Outfit render bundle")
    try:
        images = await acompose_outfit(
            avatar=(avatar_bytes, avatar_mime),
            garments=garments,
            prompt=prompt,
        )
        if not images:
            raise RuntimeError("Dedalus returned no images")

        stored = await upload_render(images[0], user_id=user_id)
        row = insert_render(
            user_id=user_id,
            avatar_id=avatar_id,
            top_garment_id=top_garment_id,
            bottom_garment_id=bottom_garment_id,
            prompt=prompt,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        return TryOnResponse(success=False, error=str(exc), prompt_used=prompt)

    return TryOnResponse(
        success=True,
        render_id=row.get("id"),
        image=GeneratedImageOut(
            url=images[0].url,
            b64_json=images[0].b64_json,
            revised_prompt=images[0].revised_prompt,
            storage_path=stored.path,
            bucket=stored.bucket,
            signed_url=stored.signed_url,
        ),
        prompt_used=prompt,
        credits_remaining=credits_remaining(user_id),
    )


@router.post("/avatar-from-photo", response_model=AvatarResponse)
async def avatar_from_photo(
    references: list[UploadFile] = File(...),
    height_cm: int | None = Form(None),
    body_notes: str = Form(""),
    user_id: str = Depends(get_current_user_id),
):
    if not references:
        raise HTTPException(status_code=400, detail="at least one reference photo is required")

    ref_tuples = [(await ref.read(), ref.content_type or "image/png") for ref in references]
    prompt = build_avatar_from_photo_prompt(
        num_references=len(ref_tuples),
        body_notes=body_notes,
        height_cm=height_cm,
    )
    try:
        images = await acompose_from_references(
            references=ref_tuples,
            prompt=prompt,
        )
        if not images:
            raise RuntimeError("Dedalus returned no images")

        stored = await upload_avatar(images[0], user_id=user_id)
        row = insert_avatar(
            user_id=user_id,
            storage_path=stored.path,
            bucket=stored.bucket,
            prompt=prompt,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        return AvatarResponse(success=False, error=str(exc), prompt_used=prompt)

    return AvatarResponse(
        success=True,
        avatar_id=row.get("id"),
        image=GeneratedImageOut(
            url=images[0].url,
            b64_json=images[0].b64_json,
            revised_prompt=images[0].revised_prompt,
            storage_path=stored.path,
            bucket=stored.bucket,
            signed_url=stored.signed_url,
        ),
        prompt_used=prompt,
    )
