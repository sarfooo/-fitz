from app.services.supabase_client import get_supabase


SIGNUP_BONUS_CREDITS = 3


def ensure_wallet(user_id: str):
    sb = get_supabase()
    wallet_response = (
        sb.table("credit_wallets")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    rows = wallet_response.data or []
    if rows:
        return rows[0]

    created = (
        sb.table("credit_wallets")
        .insert(
            {
                "user_id": user_id,
                "balance": SIGNUP_BONUS_CREDITS,
            }
        )
        .execute()
    )
    wallet = created.data[0] if created.data else None
    if wallet is None:
        return None

    sb.table("credit_transactions").insert(
        {
            "wallet_id": wallet["id"],
            "user_id": user_id,
            "amount": SIGNUP_BONUS_CREDITS,
            "type": "bonus",
            "description": "New user signup bonus",
        }
    ).execute()
    return wallet


def get_credit_summary(user_id: str):
    sb = get_supabase()
    wallet = ensure_wallet(user_id)
    transactions = (
        sb.table("credit_transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {
        "user_id": user_id,
        "balance": wallet["balance"] if wallet else 0,
        "transactions": transactions.data or [],
    }


def add_credits(user_id: str, amount: int, description: str):
    sb = get_supabase()
    wallet = ensure_wallet(user_id)
    if wallet is None:
        return None

    balance = wallet["balance"] + amount
    sb.table("credit_wallets").update({"balance": balance}).eq("id", wallet["id"]).execute()
    transaction = (
        sb.table("credit_transactions")
        .insert(
            {
                "wallet_id": wallet["id"],
                "user_id": user_id,
                "amount": amount,
                "type": "credit",
                "description": description,
            }
        )
        .execute()
    )
    return {
        "balance": balance,
        "transaction": transaction.data[0] if transaction.data else None,
    }


def spend_credits(user_id: str, amount: int, description: str):
    sb = get_supabase()
    wallet = ensure_wallet(user_id)
    if wallet is None:
        return None
    if wallet["balance"] < amount:
        return False

    balance = wallet["balance"] - amount
    sb.table("credit_wallets").update({"balance": balance}).eq("id", wallet["id"]).execute()
    transaction = (
        sb.table("credit_transactions")
        .insert(
            {
                "wallet_id": wallet["id"],
                "user_id": user_id,
                "amount": -amount,
                "type": "spend",
                "description": description,
            }
        )
        .execute()
    )
    return {
        "balance": balance,
        "transaction": transaction.data[0] if transaction.data else None,
    }
