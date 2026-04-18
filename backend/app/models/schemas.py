from pydantic import BaseModel, Field


class TryOnRequest(BaseModel):
    prompt: str = Field(..., description="Outfit description or styling prompt")
    item_image_url: str | None = None
    avatar_image_url: str | None = None
    size: int = 1024


class TryOnResponse(BaseModel):
    success: bool
    image_url: str | None = None
    b64_json: str | None = None
    error: str | None = None
