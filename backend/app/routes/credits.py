from fastapi import APIRouter, Depends, HTTPException

from app.deps.auth import get_current_user_id
from app.schemas.schemas import CreditsChangeRequest, CreditsChangeResponse, CreditsResponse
from app.services.credits import add_credits, get_credit_summary, spend_credits


router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("", response_model=CreditsResponse)
def get_credits(user_id: str = Depends(get_current_user_id)):
    summary = get_credit_summary(user_id)
    return CreditsResponse(
        user_id=summary["user_id"],
        balance=summary["balance"],
        transactions=summary["transactions"],
    )


@router.post("/spend", response_model=CreditsChangeResponse)
def spend_credit_balance(
    request: CreditsChangeRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = spend_credits(user_id, request.amount, request.description)
    if result is False:
        summary = get_credit_summary(user_id)
        transaction = {
            "id": "failed",
            "amount": 0,
            "type": "failed",
            "description": "Not enough credits",
            "created_at": summary["transactions"][0]["created_at"] if summary["transactions"] else "",
        }
        return CreditsChangeResponse(
            success=False,
            balance=summary["balance"],
            transaction=transaction,
        )
    if result is None or result["transaction"] is None:
        raise HTTPException(status_code=500, detail="Failed to spend credits")

    return CreditsChangeResponse(
        success=True,
        balance=result["balance"],
        transaction=result["transaction"],
    )


@router.post("/add", response_model=CreditsChangeResponse)
def add_credit_balance(
    request: CreditsChangeRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = add_credits(user_id, request.amount, request.description)
    if result is None or result["transaction"] is None:
        raise HTTPException(status_code=500, detail="Failed to add credits")
    return CreditsChangeResponse(
        success=True,
        balance=result["balance"],
        transaction=result["transaction"],
    )
