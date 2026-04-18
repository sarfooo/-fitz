# from dedalus_labs import Dedalus

# from app.config import get_settings


# def _client() -> Dedalus:
#     settings = get_settings()
#     if not settings.dedalus_api_key:
#         raise RuntimeError("DEDALUS_API_KEY is not configured")
#     return Dedalus(api_key=settings.dedalus_api_key)


# def generate_outfit_image(prompt: str, size: int = 1024) -> dict:
#     client = _client()
#     result = client.images.generate(
#         prompt=prompt,
#         size=f"{size}x{size}",
#     )
#     data = result.data[0] if getattr(result, "data", None) else None
#     return {
#         "url": getattr(data, "url", None) if data else None,
#         "b64_json": getattr(data, "b64_json", None) if data else None,
#     }
