import json
from html import unescape


def _extract_photo_urls(photo_items):
    urls = []
    seen = set()

    for photo in photo_items:
        if not isinstance(photo, dict):
            continue

        for key in ("url", "image_url", "src", "thumb_url"):
            candidate = photo.get(key)
            if not candidate or candidate in seen:
                continue
            seen.add(candidate)
            urls.append(candidate)
            break

    return urls


def _extract_object_block(text, start_idx):
    depth = 0
    in_string = False
    escaped = False

    for idx in range(start_idx, len(text)):
        char = text[idx]

        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start_idx : idx + 1]

    return None


def extract_listing_data_from_html(html):
    if not html:
        return None

    marker = '"listing":'
    marker_idx = html.rfind(marker)
    if marker_idx == -1:
        return None

    object_start = html.find("{", marker_idx)
    if object_start == -1:
        return None

    listing_block = _extract_object_block(html, object_start)
    if not listing_block:
        return None

    try:
        listing = json.loads(unescape(listing_block))
    except Exception:
        return None
    return listing if isinstance(listing, dict) else None


def extract_listing_photos_from_html(html):
    listing = extract_listing_data_from_html(html)
    if not listing:
        return []
    return _extract_photo_urls(listing.get("photos") or [])


def extract_item(result):
    cover = result.get("cover_photo", {})
    photos = _extract_photo_urls(result.get("photos") or [])
    image = cover.get("image_url") or cover.get("url") or (photos[0] if photos else None)

    return {
        "item_name": result.get("title"),
        "price": result.get("price"),
        "size": result.get("size"),
        "image": image,
        "photos": photos,
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


def extract_listing_item_from_html(html, item_id=None, product_url=None):
    listing = extract_listing_data_from_html(html) or {}
    photos = extract_listing_photos_from_html(html)

    return {
        "listing_id": str(item_id if item_id is not None else listing.get("id") or ""),
        "item_name": listing.get("title") or "",
        "price": listing.get("price"),
        "size": listing.get("size"),
        "image": photos[0] if photos else None,
        "photos": photos,
        "category": listing.get("categoryPath") or listing.get("category"),
        "product_url": product_url or listing.get("url"),
    }
