import base64
import json

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.supabase_client import get_supabase


bearer_scheme = HTTPBearer(auto_error=False)


def _decode_jwt_sub(token: str) -> str | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        payload = parts[1]
        payload += "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload.encode("utf-8"))
        data = json.loads(decoded.decode("utf-8"))
        sub = data.get("sub")
        return str(sub) if sub else None
    except Exception:
        return None


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing bearer token")

    try:
        response = get_supabase().auth.get_user(credentials.credentials)
    except Exception as exc:
        fallback_user_id = _decode_jwt_sub(credentials.credentials)
        if fallback_user_id:
            return fallback_user_id
        raise HTTPException(status_code=401, detail="Invalid auth token") from exc

    user = getattr(response, "user", None)
    user_id = getattr(user, "id", None) if user is not None else None
    if user_id is None and isinstance(response, dict):
        user = response.get("user")
        if isinstance(user, dict):
            user_id = user.get("id")

    if not user_id:
        fallback_user_id = _decode_jwt_sub(credentials.credentials)
        if fallback_user_id:
            return fallback_user_id
        raise HTTPException(status_code=401, detail="Unable to resolve user")

    return str(user_id)
