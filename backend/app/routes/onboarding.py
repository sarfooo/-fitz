from fastapi import APIRouter, HTTPException
from app.schemas.schemas import BodyProfileRequest, BodyProfileResponse


router = APIRouter(prefix="/onboarding", tags=["onboarding"])

@router.post("", response_model = BodyProfileResponse)
def create_body_profile(request: BodyProfileRequest):
    return BodyProfileResponse(
        success = True,
        body_profile = request
    )