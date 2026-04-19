from app.services.supabase_client import get_supabase


def list_closet_items(user_id: str):
    sb = get_supabase()
    response = (
        sb.table("closet_items")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


def create_closet_item(payload: dict):
    sb = get_supabase()
    existing = (
        sb.table("closet_items")
        .select("*")
        .eq("user_id", payload["user_id"])
        .eq("source", payload["source"])
        .eq("listing_id", payload["listing_id"])
        .limit(1)
        .execute()
    )
    existing_rows = getattr(existing, "data", None) or []
    if existing_rows:
        return existing_rows[0]

    response = sb.table("closet_items").insert(payload).execute()
    rows = getattr(response, "data", None) or []
    return rows[0] if rows else None


def delete_closet_item(user_id: str, closet_item_id: str):
    sb = get_supabase()
    response = (
        sb.table("closet_items")
        .delete()
        .eq("user_id", user_id)
        .eq("id", closet_item_id)
        .execute()
    )
    return bool(response.data)


_OUTFITS_SELECT = (
    "*, saved_outfit_items(closet_item_id, closet_items(*)), "
    "try_on_renders(id, render_angles(angle, image_path, bucket))"
)


def list_outfits(user_id: str):
    sb = get_supabase()
    response = (
        sb.table("saved_outfits")
        .select(_OUTFITS_SELECT)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


def list_community_outfits(current_user_id: str, limit: int = 24):
    sb = get_supabase()
    response = (
        sb.table("saved_outfits")
        .select(_OUTFITS_SELECT)
        .neq("user_id", current_user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    outfits = response.data or []
    if not outfits:
        return []

    user_ids = list({row["user_id"] for row in outfits if row.get("user_id")})
    profiles_by_user_id = {}
    if user_ids:
        profiles_response = (
            sb.table("profiles")
            .select("user_id, username, display_name")
            .in_("user_id", user_ids)
            .execute()
        )
        profiles = profiles_response.data or []
        profiles_by_user_id = {profile["user_id"]: profile for profile in profiles}

    for row in outfits:
        row["profiles"] = profiles_by_user_id.get(row.get("user_id"))

    return outfits


def create_outfit(
    user_id: str,
    name: str,
    closet_item_ids: list[str],
    cover_image: str | None,
    render_id: str | None = None,
):
    sb = get_supabase()
    if closet_item_ids:
        owned_items = (
            sb.table("closet_items")
            .select("id")
            .eq("user_id", user_id)
            .in_("id", closet_item_ids)
            .execute()
        )
        owned_item_ids = {row["id"] for row in (owned_items.data or [])}
        if owned_item_ids != set(closet_item_ids):
            return None

    outfit_response = (
        sb.table("saved_outfits")
        .insert(
            {
                "user_id": user_id,
                "name": name,
                "cover_image": cover_image,
                "render_id": render_id,
            }
        )
        .execute()
    )
    outfit = outfit_response.data[0] if outfit_response.data else None
    if outfit is None:
        return None

    if closet_item_ids:
        rows = [
            {"outfit_id": outfit["id"], "closet_item_id": closet_item_id}
            for closet_item_id in closet_item_ids
        ]
        sb.table("saved_outfit_items").insert(rows).execute()

    response = (
        sb.table("saved_outfits")
        .select(_OUTFITS_SELECT)
        .eq("id", outfit["id"])
        .maybe_single()
        .execute()
    )
    return response.data


def delete_outfit(user_id: str, outfit_id: str):
    sb = get_supabase()
    response = (
        sb.table("saved_outfits")
        .delete()
        .eq("user_id", user_id)
        .eq("id", outfit_id)
        .execute()
    )
    return bool(response.data)


def list_renders(user_id: str):
    sb = get_supabase()
    response = (
        sb.table("try_on_renders")
        .select("id, created_at, render_angles(image_path, angle)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []
