from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import tryon

settings = get_settings()

app = FastAPI(title="FitCheck API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tryon.router)


@app.get("/")
def root() -> dict:
    return {"service": "fitcheck", "status": "ok", "env": settings.app_env}


@app.get("/health")
def health() -> dict:
    return {"status": "healthy"}
