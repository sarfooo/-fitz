import asyncio
import logging

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile

from app.deps.auth import get_current_user_id
from app.schemas.schemas import (
    AvatarIdentity,
    AvatarRequest,
    AvatarResponse,
    CaptureIdentityResponse,
    CurrentAvatarResponse,
    FitRequest,
    FitStartResponse,
    FitStatusResponse,
    GeneratedImageOut,
    LookbookFit,
    LookbookResponse,
    SaveFitRequest,
    SaveFitResponse,
    TryOnGenerateRequest,
    TryOnResponse,
)
from app.services.fit_pipeline import (
    build_fit_prompt,
    describe_garment,
    describe_person_from_refs,
    download_avatar_bytes,
    load_latest_identity,
    render_fit_image,
)
from app.services.renders import (
    get_render_for_user,
    insert_render_angle,
    list_lookbook,
    save_to_lookbook,
    update_render_status,
)
from app.services.storage import signed_url_for, upload_render
from app.services.supabase_client import get_supabase
from app.services.tryon import (
    acompose_from_references,
    acompose_outfit,
    acompose_with_gpt_image,
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
)


log = logging.getLogger(__name__)


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


async def _download_garment(url: str) -> tuple[bytes, str]:
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as http:
        r = await http.get(url)
        r.raise_for_status()
        mime = (r.headers.get("content-type") or "image/jpeg").split(";")[0].strip()
        return r.content, mime


async def _run_fit_job(
    *,
    render_id: str,
    user_id: str,
    identity: str,
    top_url: str,
    bottom_url: str,
    image_size: str,
) -> None:
    """Background worker — identical recipe to scripts/gen_tryon.py.

    1. Caption each garment with Gemini vision → shirt_desc + pants_desc.
    2. Build prompt: identity + garment descs + FIXED_WARDROBE + HOUSE_STYLE + NEGATIVE.
    3. gpt-image-1 text-to-image at 1024x1536 quality=high.
    """
    try:
        shirt_desc, pants_desc = await asyncio.gather(
            describe_garment(top_url, kind="shirt/top"),
            describe_garment(bottom_url, kind="pants/bottom"),
        )
        prompt = build_fit_prompt(
            identity=identity, shirt_desc=shirt_desc, pants_desc=pants_desc
        )
        log.info("[tryon] fit prompt (render=%s): %s", render_id, prompt[:200])
        image = await render_fit_image(prompt, size="1024x1536")
        stored = await upload_render(image, user_id=user_id)
        insert_render_angle(
            render_id=render_id,
            angle="front",
            storage_path=stored.path,
            bucket=stored.bucket,
        )
        update_render_status(render_id, "ready")
    except Exception as exc:
        log.exception("[tryon] fit job %s failed", render_id)
        try:
            update_render_status(render_id, "failed")
        except Exception:
            log.exception("[tryon] also failed to mark render %s failed", render_id)
        try:
            from app.services.credits import add_credits
            add_credits(user_id, 1, f"Refund for failed render {render_id}: {exc}")
        except Exception:
            log.exception("[tryon] failed to refund render %s", render_id)


@router.post("/fit", response_model=FitStartResponse)
async def generate_fit(
    req: FitRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
) -> FitStartResponse:
    """Kick off a fit render and return immediately with a render_id to poll.

    The actual gpt-image-1 render runs in a background task. Client should poll
    ``GET /tryon/render/{render_id}`` until status becomes ``ready`` or ``failed``.
    """
    log.info("[tryon] POST /fit user=%s top=%s bottom=%s", user_id, req.top.image_url, req.bottom.image_url)
    identity_row = load_latest_identity(user_id)
    if identity_row is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "No avatar set up yet. Generate your avatar from reference "
                "photos before rendering a fit."
            ),
        )
    identity = identity_row.get("identity_description") or ""
    if not identity.strip():
        raise HTTPException(
            status_code=400,
            detail="Your avatar has no identity description — re-run avatar setup.",
        )

    ensure_credit_spend(user_id, 1, "Try-on fit render")

    row = insert_render(
        user_id=user_id,
        avatar_id=identity_row.get("id"),
        top_garment_id=None,
        bottom_garment_id=None,
        prompt="(pending background job)",
        status="pending",
    )
    render_id = row.get("id")
    if not render_id:
        raise HTTPException(status_code=500, detail="Failed to create render row")

    background_tasks.add_task(
        _run_fit_job,
        render_id=render_id,
        user_id=user_id,
        identity=identity,
        top_url=req.top.image_url,
        bottom_url=req.bottom.image_url,
        image_size=req.image_size,
    )
    log.info("[tryon] queued background render %s", render_id)

    return FitStartResponse(render_id=render_id, status="pending")


@router.get("/render/{render_id}", response_model=FitStatusResponse)
def get_render_status(
    render_id: str,
    user_id: str = Depends(get_current_user_id),
) -> FitStatusResponse:
    """Poll render status. Returns 'pending' until background job finishes."""
    row = get_render_for_user(render_id, user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="render not found")

    status = row.get("status") or "pending"
    angles = row.get("render_angles") or []

    image_out: GeneratedImageOut | None = None
    if status == "ready" and angles:
        angle = angles[0]
        try:
            signed = signed_url_for(bucket=angle["bucket"], path=angle["image_path"])
        except Exception:
            signed = None
        image_out = GeneratedImageOut(
            url=None,
            b64_json=None,
            revised_prompt=None,
            storage_path=angle.get("image_path"),
            bucket=angle.get("bucket"),
            signed_url=signed,
        )

    error_msg = None
    if status == "failed":
        error_msg = "Render failed — credit refunded. Try again."

    return FitStatusResponse(
        render_id=render_id,
        status=status if status in {"pending", "ready", "failed"} else "pending",
        image=image_out,
        error=error_msg,
        credits_remaining=credits_remaining(user_id),
    )


def _row_to_lookbook_fit(row: dict) -> LookbookFit:
    angles = row.get("render_angles") or []
    image_url: str | None = None
    if angles:
        first = angles[0]
        try:
            image_url = signed_url_for(bucket=first["bucket"], path=first["image_path"])
        except Exception:
            image_url = None
    return LookbookFit(
        render_id=row["id"],
        name=row.get("name"),
        image_url=image_url,
        created_at=row["created_at"],
    )


@router.get("/lookbook", response_model=LookbookResponse)
def get_lookbook(user_id: str = Depends(get_current_user_id)) -> LookbookResponse:
    rows = list_lookbook(user_id)
    return LookbookResponse(fits=[_row_to_lookbook_fit(r) for r in rows])


@router.post("/render/{render_id}/save", response_model=SaveFitResponse)
def save_render_to_lookbook(
    render_id: str,
    body: SaveFitRequest,
    user_id: str = Depends(get_current_user_id),
) -> SaveFitResponse:
    existing = get_render_for_user(render_id, user_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="render not found")
    if existing.get("status") != "ready":
        raise HTTPException(status_code=400, detail="render is not ready yet")
    updated = save_to_lookbook(render_id, user_id, body.name)
    if updated is None:
        return SaveFitResponse(success=False, error="Failed to save")
    # Fetch the fresh row with joined render_angles for the response.
    fresh = get_render_for_user(render_id, user_id) or updated
    return SaveFitResponse(success=True, fit=_row_to_lookbook_fit(fresh))


@router.post("/avatar/identity", response_model=CaptureIdentityResponse)
async def capture_avatar_identity(
    references: list[UploadFile] = File(...),
    user_id: str = Depends(get_current_user_id),
) -> CaptureIdentityResponse:
    """Capture identity and render a character avatar from reference photos.

    Prerequisite for /tryon/fit. In one call we:
      1. Caption the reference photos with Gemini → ``identity_description``.
      2. Render a FitCheck-style base avatar that preserves face/hair/build
         via ``acompose_from_references`` (gpt-image-1).
      3. Upload the generated avatar to the avatars bucket and persist a row.
    """
    if not references:
        raise HTTPException(status_code=400, detail="at least one reference photo is required")

    ref_tuples: list[tuple[bytes, str]] = [
        (await r.read(), r.content_type or "image/jpeg") for r in references
    ]

    try:
        identity = await describe_person_from_refs(ref_tuples)
        log.info("[tryon] avatar: identity captured (%d chars)", len(identity))
        # Build an avatar prompt that weaves the identity description into the
        # FitCheck style. gpt-image-1 text-to-image renders the person described.
        from app.services.prompts import HOUSE_STYLE, NEGATIVE
        avatar_prompt = " ".join(
            [
                f"Portrait of a person matching this identity: {identity}",
                "Full body shot, head to shoes, subject centered, facing camera straight-on, arms relaxed at sides, neutral expression.",
                "wearing a plain fitted neutral base layer (simple crew-neck t-shirt and pants, solid neutral colors),",
                "preserve the described face, hair, skin tone, build, and proportions exactly.",
                HOUSE_STYLE + ".",
                "Ultra-realistic, photographic, natural skin texture, no cartoon.",
                NEGATIVE,
            ]
        )
        log.info("[tryon] avatar: calling gpt-image-1 text-to-image")
        images = await agenerate_image(
            avatar_prompt,
            size="1024x1536",
            quality="high",
            model="openai/gpt-image-1",
        )
        log.info("[tryon] avatar: gpt-image-1 returned %d image(s)", len(images))
        if not images:
            raise RuntimeError("gpt-image-1 returned no avatar image")
        stored = await upload_avatar(images[0], user_id=user_id)
    except RuntimeError as exc:
        log.exception("[tryon] avatar generation failed")
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        log.exception("[tryon] avatar generation crashed")
        raise HTTPException(status_code=500, detail=f"avatar generation error: {exc}") from exc

    sb = get_supabase()
    row = (
        sb.table("avatars")
        .insert(
            {
                "user_id": user_id,
                "base_image_path": stored.path,
                "bucket": stored.bucket,
                "identity_description": identity,
                "prompt": avatar_prompt,
                "status": "ready",
            }
        )
        .execute()
        .data[0]
    )

    return CaptureIdentityResponse(
        success=True,
        avatar=AvatarIdentity(
            avatar_id=row["id"],
            identity_description=identity,
            image_url=stored.signed_url,
        ),
    )


@router.get("/avatar/current", response_model=CurrentAvatarResponse)
def get_current_avatar(
    user_id: str = Depends(get_current_user_id),
) -> CurrentAvatarResponse:
    """Return the user's latest stored avatar (identity + signed image URL)."""
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
    if not rows:
        return CurrentAvatarResponse(avatar=None)

    row = rows[0]
    image_url: str | None = None
    if row.get("base_image_path") and row.get("bucket"):
        try:
            image_url = signed_url_for(bucket=row["bucket"], path=row["base_image_path"])
        except Exception:
            image_url = None

    return CurrentAvatarResponse(
        avatar=AvatarIdentity(
            avatar_id=row["id"],
            identity_description=row["identity_description"],
            image_url=image_url,
        )
    )
