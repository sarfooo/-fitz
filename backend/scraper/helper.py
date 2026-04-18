def extract_item(result):
    cover = result.get("cover_photo", {})
    return {
        "item_name": result.get("title"),
        "price": result.get("price"),
        "size": result.get("size"),
        "image": cover.get("image_url") or cover.get("url"),
        "category": result.get("category_path") or result.get("category"),
        "listing_id": str(result.get("id") or result.get("objectID")),
        "product_url": result.get("url"),
    }

def extract_items_from_response(response):
    items = []
    for result in response.get("results", []):
        for hit in result.get("hits", []):
            item = extract_item(hit)
            if item["listing_id"] is not None:
                items.append(item)
    return items
