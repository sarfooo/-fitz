from time import monotonic
import re

from fastapi import APIRouter, Depends, HTTPException

from app.deps.auth import get_current_user_id
from app.schemas.schemas import (
    AddSavedOutfitResponse,
    ClosetItem,
    CommunityOutfit,
    CommunityOutfitsResponse,
    DeleteSavedOutfitResponse,
    OutfitCreateRequest,
    RenderAngleOut,
    SavedOutfit,
    SavedOutfitsResponse,
)
from app.services.closet import create_outfit, delete_outfit, list_community_outfits, list_outfits
from app.services.storage import signed_url_for


router = APIRouter(prefix="/outfits", tags=["outfits"])

_COMMUNITY_CACHE_TTL_SECONDS = 300
_community_cache: dict[str, tuple[float, CommunityOutfitsResponse]] = {}
_AUTO_USERNAME_RE = re.compile(r"^user_[a-f0-9]{6,}$", re.IGNORECASE)


_ANGLE_ORDER: tuple[str, ...] = (
    "left",
    "left_three_quarter",
    "front",
    "right_three_quarter",
    "right",
)


def _angle_sort_key(angle_name: str) -> int:
    try:
        return _ANGLE_ORDER.index(angle_name)
    except ValueError:
        return len(_ANGLE_ORDER)


def _build_angles_from_render(render_row: dict | None) -> list[RenderAngleOut]:
    if render_row is None:
        return []
    raw = render_row.get("render_angles") or []
    ordered = sorted(
        raw,
        key=lambda a: _angle_sort_key(a.get("angle") or ""),
    )
    outs: list[RenderAngleOut] = []
    for row in ordered:
        bucket = row.get("bucket")
        path = row.get("image_path")
        signed: str | None = None
        if bucket and path:
            try:
                signed = signed_url_for(bucket=bucket, path=path)
            except Exception:
                signed = None
        outs.append(
            RenderAngleOut(
                angle=row.get("angle") or "front",
                image_url=signed,
                storage_path=path,
                bucket=bucket,
            )
        )
    return outs


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

    angles = _build_angles_from_render(row.get("try_on_renders"))

    return SavedOutfit(
        id=row["id"],
        user_id=row["user_id"],
        name=row["name"],
        item_count=len(items),
        cover_image=cover_image,
        created_at=row["created_at"],
        items=items,
        render_id=row.get("render_id"),
        angles=angles,
    )


def normalize_community_outfit(row):
    outfit = normalize_outfit(row)
    profile = row.get("profiles") or {}
    raw_username = (profile.get("username") or "").strip()
    display_name = profile.get("display_name")
    username = raw_username or "community"

    if _AUTO_USERNAME_RE.match(username):
        if isinstance(display_name, str) and display_name.strip():
            username = display_name.strip()
        else:
            username = "community"

    return CommunityOutfit(
        **outfit.model_dump(),
        username=username,
        display_name=display_name,
    )


def _clear_community_cache() -> None:
    _community_cache.clear()


@router.get("", response_model=SavedOutfitsResponse)
def get_outfits(user_id: str = Depends(get_current_user_id)):
    rows = list_outfits(user_id)
    outfits = [normalize_outfit(row) for row in rows]
    return SavedOutfitsResponse(outfits=outfits)


@router.get("/community", response_model=CommunityOutfitsResponse)
def get_community_outfits(user_id: str = Depends(get_current_user_id)):
    cached = _community_cache.get(user_id)
    now = monotonic()
    if cached and now - cached[0] < _COMMUNITY_CACHE_TTL_SECONDS:
      return cached[1]

    rows = list_community_outfits(user_id)
    outfits = [normalize_community_outfit(row) for row in rows]
    response = CommunityOutfitsResponse(outfits=outfits)
    _community_cache[user_id] = (now, response)
    return response


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
        render_id=request.render_id,
    )
    if row is None:
        raise HTTPException(status_code=400, detail="Failed to create outfit")
    _clear_community_cache()
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
    if success:
        _clear_community_cache()
    return DeleteSavedOutfitResponse(
        success=success,
        outfit_id=outfit_id,
    )
