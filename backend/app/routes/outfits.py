from fastapi import APIRouter, Depends, HTTPException

from app.deps.auth import get_current_user_id
from app.schemas.schemas import (
    AddSavedOutfitResponse,
    ClosetItem,
    CommunityOutfit,
    CommunityOutfitsResponse,
    DeleteSavedOutfitResponse,
    OutfitCreateRequest,
    SavedOutfit,
    SavedOutfitsResponse,
)
from app.services.closet import create_outfit, delete_outfit, list_community_outfits, list_outfits


router = APIRouter(prefix="/outfits", tags=["outfits"])


def normalize_outfit(row):
    outfit_items = row.get("saved_outfit_items") or []
    items = []
    for outfit_item in outfit_items:
        closet_item = outfit_item.get("closet_items")
        if closet_item is not None:
            items.append(ClosetItem(**closet_item))

    cover_image = row.get("cover_image")
    if cover_image is None and items:
        cover_image = items[0].image

    return SavedOutfit(
        id=row["id"],
        user_id=row["user_id"],
        name=row["name"],
        item_count=len(items),
        cover_image=cover_image,
        created_at=row["created_at"],
        items=items,
    )


def normalize_community_outfit(row):
    outfit = normalize_outfit(row)
    profile = row.get("profiles") or {}
    username = profile.get("username") or "community"
    display_name = profile.get("display_name")

    return CommunityOutfit(
        **outfit.model_dump(),
        username=username,
        display_name=display_name,
    )


@router.get("", response_model=SavedOutfitsResponse)
def get_outfits(user_id: str = Depends(get_current_user_id)):
    rows = list_outfits(user_id)
    outfits = [normalize_outfit(row) for row in rows]
    return SavedOutfitsResponse(outfits=outfits)


@router.get("/community", response_model=CommunityOutfitsResponse)
def get_community_outfits(user_id: str = Depends(get_current_user_id)):
    rows = list_community_outfits(user_id)
    outfits = [normalize_community_outfit(row) for row in rows]
    return CommunityOutfitsResponse(outfits=outfits)


@router.post("", response_model=AddSavedOutfitResponse)
def add_outfit(
    request: OutfitCreateRequest,
    user_id: str = Depends(get_current_user_id),
):
    row = create_outfit(
        user_id=user_id,
        name=request.name,
        closet_item_ids=request.closet_item_ids,
        cover_image=request.cover_image,
    )
    if row is None:
        raise HTTPException(status_code=400, detail="Failed to create outfit")
    return AddSavedOutfitResponse(
        success=True,
        outfit=normalize_outfit(row),
    )


@router.delete("/{outfit_id}", response_model=DeleteSavedOutfitResponse)
def remove_outfit(
    outfit_id: str,
    user_id: str = Depends(get_current_user_id),
):
    success = delete_outfit(user_id, outfit_id)
    return DeleteSavedOutfitResponse(
        success=success,
        outfit_id=outfit_id,
    )
