# from fastapi import APIRouter, HTTPException

# from app.schemas.schemas import TryOnRequest, TryOnResponse
# from app.services.image_gen import generate_outfit_image

# router = APIRouter(prefix="/tryon", tags=["tryon"])


# @router.post("", response_model=TryOnResponse)
# def create_tryon(req: TryOnRequest) -> TryOnResponse:
#     try:
#         result = generate_outfit_image(prompt=req.prompt, size=req.size)
#     except RuntimeError as e:
#         raise HTTPException(status_code=503, detail=str(e)) from e
#     except Exception as e:
#         return TryOnResponse(success=False, error=str(e))

#     return TryOnResponse(
#         success=True,
#         image_url=result.get("url"),
#         b64_json=result.get("b64_json"),
#     )
