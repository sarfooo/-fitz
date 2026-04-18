from app.services.supabase_client import get_supabase


def get_body_profile(user_id: str):
    sb = get_supabase()
    response = (
        sb.table("body_profiles")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return response.data


def upsert_body_profile(payload: dict):
    sb = get_supabase()
    response = (
        sb.table("body_profiles")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    return response.data[0] if response.data else None
