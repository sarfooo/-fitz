from fastapi import APIRouter, HTTPException

from app.schemas.schemas import Item, ItemsResponse
from app.services.marketplace import get_item_listing, search_items


router = APIRouter(prefix="/browse", tags=["browse"])


@router.get("", response_model=ItemsResponse)
def query_items(query: str, page: int = 0):
    items = search_items(query, page)
    if items is None:
        raise HTTPException(status_code=502, detail="Failed to query Grailed")

    return ItemsResponse(
        query = query,
        page = page,
        items = items
    )


@router.get("/listing/{item_id}", response_model=Item)
def get_listing(item_id: str):
    item = get_item_listing(item_id)
    if item is None:
        raise HTTPException(status_code=502, detail="Failed to load Grailed listing")

    return Item(**item)
