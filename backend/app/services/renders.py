"""Persistence helpers for avatars, garments, and try-on renders."""

from __future__ import annotations

from typing import Any

from app.services.supabase_client import get_supabase


# ---------- avatars ----------


def insert_avatar(
    *,
    user_id: str,
    storage_path: str,
    bucket: str,
    prompt: str,
    identity_description: str | None = None,
) -> dict[str, Any]:
    sb = get_supabase()
    res = (
        sb.table("avatars")
        .insert(
            {
                "user_id": user_id,
                "base_image_path": storage_path,
                "bucket": bucket,
                "prompt": prompt,
                "identity_description": identity_description,
                "status": "ready",
            }
        )
        .execute()
    )
    return res.data[0] if res.data else {}


# ---------- garments ----------


def insert_garment(
    *,
    user_id: str,
    category: str,
    storage_path: str,
    bucket: str,
    caption: str | None = None,
    mime_type: str | None = None,
) -> dict[str, Any]:
    sb = get_supabase()
    res = (
        sb.table("garments")
        .insert(
            {
                "user_id": user_id,
                "category": category,
                "image_path": storage_path,
                "bucket": bucket,
                "caption": caption,
                "mime_type": mime_type,
            }
        )
        .execute()
    )
    return res.data[0] if res.data else {}


# ---------- renders ----------


def insert_render(
    *,
    user_id: str,
    avatar_id: str | None,
    top_garment_id: str | None,
    bottom_garment_id: str | None,
    prompt: str,
    status: str = "completed",
) -> dict[str, Any]:
    sb = get_supabase()
    res = (
        sb.table("try_on_renders")
        .insert(
            {
                "user_id": user_id,
                "avatar_id": avatar_id,
                "top_garment_id": top_garment_id,
                "bottom_garment_id": bottom_garment_id,
                "prompt": prompt,
                "status": status,
            }
        )
        .execute()
    )
    return res.data[0] if res.data else {}


def update_render_status(render_id: str, status: str) -> None:
    sb = get_supabase()
    sb.table("try_on_renders").update({"status": status}).eq("id", render_id).execute()


def get_render_for_user(render_id: str, user_id: str) -> dict[str, Any] | None:
    sb = get_supabase()
    res = (
        sb.table("try_on_renders")
        .select("*, render_angles(*)")
        .eq("id", render_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None


def insert_render_angle(
    *,
    render_id: str,
    angle: str,
    storage_path: str,
    bucket: str,
    raw_image_path: str | None = None,
) -> dict[str, Any]:
    sb = get_supabase()
    res = (
        sb.table("render_angles")
        .insert(
            {
                "render_id": render_id,
                "angle": angle,
                "image_path": storage_path,
                "bucket": bucket,
                "raw_image_path": raw_image_path,
            }
        )
        .execute()
    )
    return res.data[0] if res.data else {}


def list_renders_for_user(user_id: str, *, limit: int = 50) -> list[dict[str, Any]]:
    sb = get_supabase()
    res = (
        sb.table("try_on_renders")
        .select("*, render_angles(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def list_lookbook(user_id: str, *, limit: int = 50) -> list[dict[str, Any]]:
    sb = get_supabase()
    res = (
        sb.table("try_on_renders")
        .select("*, render_angles(*)")
        .eq("user_id", user_id)
        .eq("favorited", True)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def save_to_lookbook(render_id: str, user_id: str, name: str | None) -> dict[str, Any] | None:
    sb = get_supabase()
    res = (
        sb.table("try_on_renders")
        .update({"favorited": True, "name": name})
        .eq("id", render_id)
        .eq("user_id", user_id)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None
