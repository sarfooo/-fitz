from pydantic import BaseModel, Field

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
    photo_refs: list[str]


class BodyProfileResponse(BaseModel):
    success: bool
    profile: BodyProfileRequest