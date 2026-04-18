from fastapi import APIRouter
from app.schemas.schemas import CreditsResponse

router = APIRouter(prefix="/credits", tags=["credits"])

mock_credit_data = {
    "balance": 3,
    "transactions": [
        {
            "amount": 3,
            "type": "bonus",
            "description": "New user signup bonus",
            "created_at": "2026-04-18T12:00:00Z"
        }
    ]
}

@router.get("", response_model=CreditsResponse)
def get_credits():
    return CreditsResponse(
        balance = mock_credit_data["balance"],
        transactions = mock_credit_data["transactions"]
    )
