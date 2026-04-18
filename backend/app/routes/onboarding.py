from fastapi import APIRouter, Depends

from app.deps.auth import get_current_user_id
from app.schemas.schemas import BodyProfileRequest, BodyProfileResponse
from app.services.body_profiles import get_body_profile, upsert_body_profile


router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("", response_model=BodyProfileResponse)
def get_profile(user_id: str = Depends(get_current_user_id)):
    profile = get_body_profile(user_id)
    if profile is None:
        return BodyProfileResponse(
            success=False,
            body_profile=None,
        )

    photo_references = profile.get("photo_refs") or []
    if len(photo_references) != 3:
        return BodyProfileResponse(
            success=False,
            body_profile=None,
        )

    return BodyProfileResponse(
        success=True,
        body_profile=BodyProfileRequest(
            height=profile.get("height") or "",
            weight=profile.get("weight") or "",
            photo_references=photo_references,
        ),
    )


@router.post("", response_model=BodyProfileResponse)
def create_body_profile(
    request: BodyProfileRequest,
    user_id: str = Depends(get_current_user_id),
):
    row = upsert_body_profile(
        {
            "user_id": user_id,
            "height": request.height,
            "weight": request.weight,
            "photo_refs": request.photo_references,
        }
    )

    return BodyProfileResponse(
        success=row is not None,
        body_profile=request if row is not None else None,
    )
