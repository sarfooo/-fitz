# FitCheck

Virtual try-on for archive and secondhand fashion. Users build a body profile, generate a personalized avatar, and preview how clothing from marketplaces like Grailed and Mercari will look on their body before buying.

> FitCheck gives shoppers a personalized, directionally accurate preview of how a piece may look on their body — without leaving the couch.

---

## Stack

| Layer     | Tech                                                                 |
| --------- | -------------------------------------------------------------------- |
| Frontend  | Next.js 16, React 19, TypeScript, Tailwind v4, Framer Motion         |
| Backend   | FastAPI, Pydantic v2, httpx, Pillow / OpenCV                         |
| AI        | Google GenAI (Gemini / "nano-banana"), Dedalus Labs, Higgsfield      |
| Data      | Supabase (Postgres + Storage + Auth)                                 |
| Infra     | Docker Compose, Caddy (auto-TLS), VPS deploy                         |

---

## Repo layout

```
.
├── frontend/         Next.js app (dashboard, onboarding, checkout)
├── backend/          FastAPI service (try-on, closet, outfits, credits)
├── supabase/         SQL migrations for schema + storage
├── avatar/, avatar2/ Avatar generation experiments
├── outfits/          Sample outfit assets
├── snapshots/        Reference screenshots
├── docker-compose.yml
└── Caddyfile
```

### Frontend (`frontend/`)

Route structure under `src/app`:

- `/` — landing
- `/login`, `/signup`
- `/dashboard` — main workspace (browse, try-on, closet, lookbook, community, credits)
- `/checkout` — credit purchases

Components live under `src/components/{auth,dashboard,landing,ui}`. API calls are centralized in `src/lib/api/backend.ts`.

> **Note:** this repo uses a version of Next.js with breaking changes from the docs you may remember — consult `frontend/node_modules/next/dist/docs/` before editing framework-level code.

### Backend (`backend/`)

FastAPI routes under `app/routes/`:

- `onboarding` — body profile + avatar generation
- `browse` — marketplace item feed
- `tryon` — outfit render pipeline
- `closet` — saved items
- `outfits` — saved outfits + detail
- `credits` — wallet + transactions

Core services under `app/services/` (`banana.py`, `fit_pipeline.py`, `closet.py`, ...). Config in `app/config.py`, schemas in `app/schemas/`.

### Supabase (`supabase/migrations/`)

1. `0001_init.sql` — base tables + storage buckets
2. `0002_core_api_tables.sql` — items, closet, renders, credits
3. `0003_lookbook.sql` — community outfits
4. `0004_profile_usernames.sql` — handles for community tab
5. `0005_saved_outfits_render_link.sql` — outfit ↔ render join

Two **private** Storage buckets are required: `avatars` and `renders`.

---

## Local development

### 1. Supabase

Create a Supabase project, then from the SQL editor run every file in `supabase/migrations/` in order. In Storage, create private buckets `avatars` and `renders`.

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_*, DEDALUS_API_KEY, GOOGLE_API_KEY, ...
uvicorn main:app --reload --port 8000
```

Interactive API at http://localhost:8000/docs.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3005
```

Environment variables for the frontend live in `frontend/.env.local` (Supabase URL + anon key, backend base URL).

---

## Production

Single-VPS deploy via Docker Compose + Caddy:

```bash
docker compose up -d --build
```

- `backend` container exposes `:8000` internally
- `caddy` terminates TLS on `:443` and proxies to the backend
- Host-side `/opt/fitcheck/.env` is mounted into the backend container
- DNS `api.myfitz.us` → VPS public IP; Caddy handles Let's Encrypt automatically

---

## Product pillars

1. **Body Profile** — photos + measurements → normalized profile
2. **Marketplace Browse** — curated sample listings (Grailed / Mercari ingestion later)
3. **Virtual Try-On** — image-based render, not 3D cloth sim
4. **Closet & Lookbook** — saved items, saved outfits, community feed
5. **Credits** — 3 free on signup, 1 credit / standard render, 3 / premium

### Rendering philosophy

- One cohesive FitCheck visual identity (framing, lighting, pose family)
- A different personalized model per user (face, skin, hair, silhouette)
- Identity layer changes only when the profile changes; the fit layer changes per garment

---

## Roadmap

- **Phase 1 — Demoable frontend** — app shell, browse, try-on, closet, lookbook, credits UI
- **Phase 2 — Core product logic** — onboarding, avatar state, render jobs, credit deduction
- **Phase 3 — Backend & persistence** — full schema, auth, storage, API endpoints
- **Phase 4 — AI integration** — body profile processing, garment analysis, try-on rendering, recs

