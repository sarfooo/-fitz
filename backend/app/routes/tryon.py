from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.schemas import (
    AvatarRequest,
    AvatarResponse,
    FitPreference,
    GeneratedImageOut,
    TryOnGenerateRequest,
    TryOnResponse,
)
from app.services.image_gen import (
    acompose_from_references,
    acompose_outfit,
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

router = APIRouter(prefix="/tryon", tags=["tryon"])


@router.post("/avatar", response_model=AvatarResponse)
async def create_avatar(req: AvatarRequest) -> AvatarResponse:
    """Generate the reusable base avatar and persist to Supabase."""
    prompt = build_avatar_prompt(
        height_cm=req.height_cm,
        body_notes=req.body_notes,
        hair=req.hair,
        skin_tone=req.skin_tone,
    )
    try:
        images = await agenerate_image(
            prompt, size=req.size, quality=req.quality, response_format="url"
        )
        if not images:
            raise RuntimeError("Dedalus returned no images")

        stored = await upload_avatar(images[0], user_id=req.user_id)
        row = insert_avatar(
            user_id=req.user_id,
            storage_path=stored.path,
            bucket=stored.bucket,
            prompt=prompt,
        )
    except RuntimeError as e:
        raise HTTPException(503, str(e)) from e
    except Exception as e:
        return AvatarResponse(success=False, error=str(e), prompt_used=prompt)

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
async def generate_tryon(req: TryOnGenerateRequest) -> TryOnResponse:
    """Text-to-image try-on. Persists render."""
    prompt = build_tryon_prompt(
        item_description=req.item_description,
        size_label=req.size_label,
        fit_preference=req.fit_preference,
        layering_notes=req.layering_notes,
    )

    try:
        images = await agenerate_image(
            prompt, size=req.image_size, quality=req.quality, response_format="url"
        )
        if not images:
            raise RuntimeError("Dedalus returned no images")

        stored = await upload_render(images[0], user_id=req.user_id)
        row = insert_render(
            user_id=req.user_id,
            avatar_id=req.avatar_id,
            top_garment_id=req.top_garment_id,
            bottom_garment_id=req.bottom_garment_id,
            prompt=prompt,
        )
    except RuntimeError as e:
        raise HTTPException(503, str(e)) from e
    except Exception as e:
        return TryOnResponse(success=False, error=str(e), prompt_used=prompt)

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
    )


@router.post("/edit", response_model=TryOnResponse)
async def edit_tryon(
    user_id: str = Form(...),
    avatar: UploadFile = File(..., description="User's base avatar PNG"),
    item_description: str = Form(...),
    top_garment_id: str | None = Form(None),
    bottom_garment_id: str | None = Form(None),
    avatar_id: str | None = Form(None),
    fit_preference: FitPreference = Form("regular"),
    size_label: str = Form(""),
    layering_notes: str = Form(""),
    image_size: str = Form("1024x1024"),
    mask: UploadFile | None = File(None, description="Optional mask for inpainting"),
) -> TryOnResponse:
    """Image-edit try-on: place garment onto uploaded avatar."""
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

    try:
        images = await aedit_image(
            image=image_tuple, prompt=prompt, mask=mask_tuple, size=image_size
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
    except RuntimeError as e:
        raise HTTPException(503, str(e)) from e
    except Exception as e:
        return TryOnResponse(success=False, error=str(e), prompt_used=prompt)

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
    )


@router.post("/outfit", response_model=TryOnResponse)
async def outfit_tryon(
    user_id: str = Form(...),
    avatar: UploadFile = File(..., description="Person/avatar PNG"),
    shirt: UploadFile | None = File(None, description="Shirt reference image"),
    pants: UploadFile | None = File(None, description="Pants reference image"),
    top_garment_id: str | None = Form(None),
    bottom_garment_id: str | None = Form(None),
    avatar_id: str | None = Form(None),
    fit_preference: FitPreference = Form("regular"),
    size_label: str = Form(""),
    layering_notes: str = Form(""),
) -> TryOnResponse:
    """Composite try-on: dress the avatar in supplied shirt/pants reference images."""
    if shirt is None and pants is None:
        raise HTTPException(400, "at least one garment (shirt or pants) is required")

    avatar_bytes = await avatar.read()
    avatar_mime = avatar.content_type or "image/png"

    garments: list[tuple[bytes, str]] = []
    garment_labels: list[str] = []
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

    try:
        images = await acompose_outfit(
            avatar=(avatar_bytes, avatar_mime),
            garments=garments,
            prompt=prompt,
        )
        if not images:
            raise RuntimeError("Dedalus chat completion returned no images")

        stored = await upload_render(images[0], user_id=user_id)
        row = insert_render(
            user_id=user_id,
            avatar_id=avatar_id,
            top_garment_id=top_garment_id,
            bottom_garment_id=bottom_garment_id,
            prompt=prompt,
        )
    except RuntimeError as e:
        raise HTTPException(503, str(e)) from e
    except Exception as e:
        return TryOnResponse(success=False, error=str(e), prompt_used=prompt)

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
    )


@router.post("/avatar-from-photo", response_model=AvatarResponse)
async def avatar_from_photo(
    user_id: str = Form(...),
    references: list[UploadFile] = File(..., description="Real photos of the person"),
    height_cm: int | None = Form(None),
    body_notes: str = Form(""),
) -> AvatarResponse:
    """Generate a FitCheck-style base avatar from one or more real reference photos."""
    if not references:
        raise HTTPException(400, "at least one reference photo is required")

    ref_tuples: list[tuple[bytes, str]] = [
        (await r.read(), r.content_type or "image/png") for r in references
    ]

    prompt = build_avatar_from_photo_prompt(
        num_references=len(ref_tuples),
        body_notes=body_notes,
        height_cm=height_cm,
    )

    try:
        images = await acompose_from_references(references=ref_tuples, prompt=prompt)
        if not images:
            raise RuntimeError("Dedalus chat completion returned no images")

        stored = await upload_avatar(images[0], user_id=user_id)
        row = insert_avatar(
            user_id=user_id,
            storage_path=stored.path,
            bucket=stored.bucket,
            prompt=prompt,
        )
    except RuntimeError as e:
        raise HTTPException(503, str(e)) from e
    except Exception as e:
        return AvatarResponse(success=False, error=str(e), prompt_used=prompt)

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
