from fastapi import APIRouter, Depends, HTTPException

from app.deps.auth import get_current_user_id
from app.schemas.schemas import (
    AddClosetItemResponse,
    ClosetItem,
    ClosetItemCreateRequest,
    ClosetRender,
    ClosetRendersResponse,
    ClosetResponse,
    DeleteClosetItemResponse,
)
from app.services.closet import create_closet_item, delete_closet_item, list_closet_items, list_renders


router = APIRouter(prefix="/closet", tags=["closet"])


@router.get("", response_model=ClosetResponse)
def get_closet_items(user_id: str = Depends(get_current_user_id)):
    rows = list_closet_items(user_id)
    items = [ClosetItem(**row) for row in rows]
    return ClosetResponse(items=items)


@router.post("", response_model=AddClosetItemResponse)
def add_closet_item(
    request: ClosetItemCreateRequest,
    user_id: str = Depends(get_current_user_id),
):
    row = create_closet_item(
        {
            **request.model_dump(),
            "user_id": user_id,
        }
    )
    if row is None:
        raise HTTPException(status_code=500, detail="Failed to save closet item")
    return AddClosetItemResponse(
        success=True,
        item=ClosetItem(**row),
    )


@router.delete("/{closet_item_id}", response_model=DeleteClosetItemResponse)
def remove_closet_item(
    closet_item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    success = delete_closet_item(user_id, closet_item_id)
    return DeleteClosetItemResponse(
        success=success,
        closet_item_id=closet_item_id,
    )


@router.get("/renders", response_model=ClosetRendersResponse)
def get_closet_renders(user_id: str = Depends(get_current_user_id)):
    rows = list_renders(user_id)
    renders = []
    for row in rows:
        image = None
        angles = row.get("render_angles") or []
        if angles:
            image = angles[0].get("image_path")

        renders.append(
            ClosetRender(
                render_id=row["id"],
                title="Try-On Render",
                image=image,
                created_at=row["created_at"],
            )
        )

    return ClosetRendersResponse(renders=renders)
