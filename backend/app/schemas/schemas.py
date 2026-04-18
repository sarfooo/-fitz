from typing import Literal

from pydantic import BaseModel, Field

# --- Shared image generation types (try-on pipeline) --------------------------

FitPreference = Literal["fitted", "regular", "oversized", "baggy"]
ImageSize = Literal[
    "256x256",
    "512x512",
    "1024x1024",
    "1536x1024",
    "1024x1536",
    "1792x1024",
    "1024x1792",
    "auto",
]
ImageQuality = Literal["auto", "high", "medium", "low", "hd", "standard"]


class GeneratedImageOut(BaseModel):
    url: str | None = None
    b64_json: str | None = None
    revised_prompt: str | None = None
    storage_path: str | None = None
    bucket: str | None = None
    signed_url: str | None = None


class AvatarRequest(BaseModel):
    user_id: str
    height_cm: int | None = Field(None, ge=120, le=230)
    body_notes: str = ""
    hair: str = ""
    skin_tone: str = ""
    size: ImageSize = "1024x1536"
    quality: ImageQuality = "high"


class AvatarResponse(BaseModel):
    success: bool
    avatar_id: str | None = None
    image: GeneratedImageOut | None = None
    prompt_used: str | None = None
    error: str | None = None


class TryOnGenerateRequest(BaseModel):
    user_id: str
    top_garment_id: str | None = None
    bottom_garment_id: str | None = None
    avatar_id: str | None = None
    item_description: str = Field(..., min_length=3)
    size_label: str = ""
    fit_preference: FitPreference = "regular"
    layering_notes: str = ""
    image_size: ImageSize = "1024x1536"
    quality: ImageQuality = "high"


class TryOnResponse(BaseModel):
    success: bool
    render_id: str | None = None
    image: GeneratedImageOut | None = None
    prompt_used: str | None = None
    error: str | None = None


# --- Marketplace / closet / credits / lookbook (from grailed API) -------------


class Item(BaseModel):
    item_name: str
    price: int
    size: str
    image: str
    category: str
    listing_id: int


class ItemsResponse(BaseModel):
    query: str
    page: int
    items: list[Item]

class BodyProfileRequest(BaseModel):
    height: str
    weight: str
    photo_referneces: list[str]


class BodyProfileResponse(BaseModel):
    success: bool
    profile: BodyProfileRequest


class ClosetItem(BaseModel):
    item_name: str
    price: int
    size: str
    image: str
    category: str
    listing_id: int


class ClosetResponse(BaseModel):
    items: list[ClosetItem]


class AddClosetItemResponse(BaseModel):
    success: bool
    item: ClosetItem


class DeleteClosetItemResponse(BaseModel):
    success: bool
    listing_id: int


class CreditTransaction(BaseModel):
    amount: int
    type: str
    description: str
    created_at: str


class CreditsResponse(BaseModel):
    balance: int
    transactions: list[CreditTransaction]


class LookbookFit(BaseModel):
    title: str
    image: str
    item_count: int


class LookbookResponse(BaseModel):
    fits: list[LookbookFit]
