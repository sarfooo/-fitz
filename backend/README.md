# FitCheck Backend

FastAPI service powering FitCheck virtual try-on.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your DEDALUS_API_KEY
```

## Run

```bash
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive API.

## Endpoints

- `GET /` — service status
- `GET /health` — health check
- `POST /tryon` — generate an outfit image via Dedalus
