from fastapi import APIRouter
from app.schemas.schemas import ClosetItem, ClosetResponse, AddClosetItemResponse, DeleteClosetItemResponse

router = APIRouter(prefix="/closet", tags=["closet"])

mock_closet_items = [
    {
        "item_name": "Vetements Star Knit Sweater",
        "price": 280,
        "size": "L",
        "image": "https://images.example.com/vetements-star-knit.jpg",
        "category": "tops",
        "listing_id": 1
    },
    {
        "item_name": "Jaded London Colossus Jeans",
        "price": 190,
        "size": "32",
        "image": "https://images.example.com/jaded-london-colossus-jeans.jpg",
        "category": "bottoms",
        "listing_id": 2
    }
]

@router.get("", response_model=ClosetResponse)
def get_closet_items():
    return ClosetResponse(items = mock_closet_items)


@router.post("", response_model=AddClosetItemResponse)
def add_closet_item(item: ClosetItem):
    mock_closet_items.append(item.model_dump())
    return AddClosetItemResponse(
        success = True,
        item = item
    )


@router.delete("/{listing_id}", response_model=DeleteClosetItemResponse)
def delete_closet_item(listing_id: int):
    for index, item in enumerate(mock_closet_items):
        if item["listing_id"] == listing_id:
            del mock_closet_items[index]
            return DeleteClosetItemResponse(
                success = True,
                listing_id = listing_id
            )

    return DeleteClosetItemResponse(
        success = False,
        listing_id = listing_id
    )
