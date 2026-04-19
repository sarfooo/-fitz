import base64
from typing import Literal

from pydantic import BaseModel, Field, field_validator


FitPreference = Literal["fitted", "regular", "oversized", "baggy"]


class Item(BaseModel):
    listing_id: str
    item_name: str
    price: int | None = None
    size: str | None = None
    image: str | None = None
    category: str | None = None
    source: str = "grailed"
    product_url: str | None = None


class ItemsResponse(BaseModel):
    query: str
    page: int
    items: list[Item]


class BodyProfileRequest(BaseModel):
    height: str
    weight: str
    photo_references: list[str] = Field(min_length=3, max_length=3)

    @field_validator("photo_references")
    @classmethod
    def validate_photo_references(cls, value: list[str]) -> list[str]:
        validated = []
        for item in value:
            candidate = item.strip()
            if candidate.startswith("data:image/") and ";base64," in candidate:
                candidate = candidate.split(",", 1)[1]
            try:
                base64.b64decode(candidate, validate=True)
            except Exception as exc:
                raise ValueError("photo_references must contain valid base64 image strings") from exc
            validated.append(item)
        return validated


class BodyProfileResponse(BaseModel):
    success: bool
    body_profile: BodyProfileRequest | None


class ClosetItemCreateRequest(BaseModel):
    listing_id: str
    item_name: str
    price: int | None = None
    size: str | None = None
    image: str | None = None
    category: str | None = None
    source: str = "grailed"
    product_url: str | None = None


class ClosetItem(BaseModel):
    id: str
    user_id: str
    listing_id: str
    item_name: str
    price: int | None = None
    size: str | None = None
    image: str | None = None
    category: str | None = None
    source: str
    product_url: str | None = None
    created_at: str


class ClosetResponse(BaseModel):
    items: list[ClosetItem]


class AddClosetItemResponse(BaseModel):
    success: bool
    item: ClosetItem


class DeleteClosetItemResponse(BaseModel):
    success: bool
    closet_item_id: str


class OutfitCreateRequest(BaseModel):
    name: str
    closet_item_ids: list[str] = Field(default_factory=list)
    cover_image: str | None = None


class OutfitItem(BaseModel):
    closet_item_id: str


class SavedOutfit(BaseModel):
    id: str
    user_id: str
    name: str
    item_count: int
    cover_image: str | None = None
    created_at: str
    items: list[ClosetItem] = Field(default_factory=list)


class SavedOutfitsResponse(BaseModel):
    outfits: list[SavedOutfit]


class AddSavedOutfitResponse(BaseModel):
    success: bool
    outfit: SavedOutfit


class CommunityOutfit(SavedOutfit):
    username: str
    display_name: str | None = None


class CommunityOutfitsResponse(BaseModel):
    outfits: list[CommunityOutfit]


class DeleteSavedOutfitResponse(BaseModel):
    success: bool
    outfit_id: str


class ClosetRender(BaseModel):
    render_id: str
    title: str
    image: str | None = None
    created_at: str


class ClosetRendersResponse(BaseModel):
    renders: list[ClosetRender]


class CreditTransaction(BaseModel):
    id: str
    amount: int
    type: str
    description: str
    created_at: str


class CreditsResponse(BaseModel):
    user_id: str
    balance: int
    transactions: list[CreditTransaction]


class CreditsChangeRequest(BaseModel):
    amount: int
    description: str


class CreditsChangeResponse(BaseModel):
    success: bool
    balance: int
    transaction: CreditTransaction


class LookbookFit(BaseModel):
    title: str
    image: str | None = None
    item_count: int


class LookbookResponse(BaseModel):
    fits: list[LookbookFit]


class GeneratedImageOut(BaseModel):
    url: str | None = None
    b64_json: str | None = None
    revised_prompt: str | None = None
    storage_path: str | None = None
    bucket: str | None = None
    signed_url: str | None = None


class AvatarRequest(BaseModel):
    height_cm: int | None = None
    body_notes: str = ""
    hair: str = ""
    skin_tone: str = ""
    size: str = "1024x1024"
    quality: str = "high"


class AvatarResponse(BaseModel):
    success: bool
    avatar_id: str | None = None
    image: GeneratedImageOut | None = None
    prompt_used: str | None = None
    error: str | None = None


class TryOnGenerateRequest(BaseModel):
    item_description: str
    avatar_id: str | None = None
    top_garment_id: str | None = None
    bottom_garment_id: str | None = None
    fit_preference: FitPreference = "regular"
    size_label: str = ""
    layering_notes: str = ""
    image_size: str = "1024x1024"
    quality: str = "high"


class TryOnResponse(BaseModel):
    success: bool
    render_id: str | None = None
    image: GeneratedImageOut | None = None
    prompt_used: str | None = None
    credits_remaining: int | None = None
    error: str | None = None


class FitGarment(BaseModel):
    image_url: str
    name: str | None = None


class FitRequest(BaseModel):
    garments: list[FitGarment] = Field(min_length=1)
    fit_preference: FitPreference = "regular"
    image_size: str = "1024x1536"
    quality: str = "high"


class AvatarIdentity(BaseModel):
    avatar_id: str
    identity_description: str
    image_url: str | None = None  # signed URL to the first reference photo


class CurrentAvatarResponse(BaseModel):
    avatar: AvatarIdentity | None = None


class CaptureIdentityResponse(BaseModel):
    success: bool
    avatar: AvatarIdentity | None = None
    error: str | None = None


RenderStatus = Literal["pending", "ready", "failed"]


class FitStartResponse(BaseModel):
    render_id: str
    status: RenderStatus = "pending"


class RenderAngleOut(BaseModel):
    angle: str
    image_url: str | None = None
    storage_path: str | None = None
    bucket: str | None = None


class FitStatusResponse(BaseModel):
    render_id: str
    status: RenderStatus
    image: GeneratedImageOut | None = None
    angles: list[RenderAngleOut] = Field(default_factory=list)
    error: str | None = None
    credits_remaining: int | None = None


class GenerateAnglesResponse(BaseModel):
    success: bool
    angles: list[RenderAngleOut] = Field(default_factory=list)
    error: str | None = None


class LookbookFit(BaseModel):
    render_id: str
    name: str | None = None
    image_url: str | None = None
    created_at: str


class LookbookResponse(BaseModel):
    fits: list[LookbookFit]


class SaveFitRequest(BaseModel):
    name: str | None = None


class SaveFitResponse(BaseModel):
    success: bool
    fit: LookbookFit | None = None
    error: str | None = None
