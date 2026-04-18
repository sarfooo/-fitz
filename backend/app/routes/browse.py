from fastapi import APIRouter, HTTPException

from app.schemas.schemas import ItemsResponse
from app.services.marketplace import search_items


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
