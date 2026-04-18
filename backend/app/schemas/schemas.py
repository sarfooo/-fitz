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
