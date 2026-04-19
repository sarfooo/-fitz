# fitz

**See how clothes actually look on you before you buy them.**

fitz is the app. It pairs the **Grailed API** with a virtual try-on so you can preview archive and secondhand listings on your own body before you commit to a purchase. You make a body profile, we generate a personalized avatar in a consistent house style, and you try Grailed items on that avatar.

> One-sentence pitch: fitz pulls listings from the Grailed API and shows you how they actually look on your body before you buy.

---

## The core idea

Shopping resale is a fit lottery. Listing photos are shot on a different body, in a different size, under different lighting. Basic fit questions — *will this look oversized on me? do these pants stack right? does this silhouette work with my shoulders?* — are almost impossible to answer from a thumbnail grid.

fitz answers them by combining three things:

1. **The Grailed API** — live listings pulled directly from Grailed.
2. **A body profile** — a few photos and measurements.
3. **A personalized avatar** — generated once, reused forever.
4. **An image-based try-on render** — put a specific Grailed garment on that specific avatar.

The first version is deliberately image-based, not 3D cloth simulation. The goal is a preview that is *directionally accurate and stylistically believable*, not physically exact.

---

## Product pillars

- **Grailed API** — search and listing data pulled straight from Grailed
- **Body Profile** — photos + height/weight/sizes/fit preference
- **Virtual Try-On** — render a specific Grailed item on your avatar
- **Closet & Lookbook** — save items, save full outfits, browse community looks


---

## Rendering philosophy

Every render should feel like it belongs to the same fitz universe *and* look like a different real person.

| Stays consistent across users | Changes per user |
| ----------------------------- | ---------------- |
| Framing, pose family, lighting | Face, hair, skin tone |
| fitz visual identity | Body shape, proportions |
| Editorial presentation | Silhouette |

Internally this splits into two layers:

- **Identity layer** — who the person is. Changes only when the profile changes.
- **Fit layer** — how the garment sits. Changes per item, size, and styling choice.

The avatar is generated once from reference photos, then reused — so you don't get a different-looking person every time you try something on.

---

## Repo layout

```
frontend/     Next.js app — landing, auth, dashboard (browse + try-on + closet)
backend/      FastAPI service — avatar, try-on, browse, closet, outfits, credits
supabase/     SQL migrations for the Postgres schema + RLS
avatar/       Avatar generation experiments
outfits/      Sample outfit assets
Caddyfile     Reverse-proxy + TLS for the deployed API
docker-compose.yml  Single-VPS deploy (backend + Caddy)
codex.md      Original product brief
```

---

## Stack

- **Frontend** — Next.js, React, TypeScript, Tailwind, Framer Motion
- **Backend** — FastAPI, Pydantic, httpx
- **Data + Auth + Storage** — Supabase (Postgres + Storage + Auth), with row-level security
- **AI** — image generation APIs for avatar + try-on rendering
- **API** — Grailed via Algolia-backed search
- **Infra** — Docker Compose + Caddy (auto-TLS) on a single VPS

---

## Running it locally

**Supabase.** Create a project, run every file in `supabase/migrations/` in order, and create two **private** storage buckets: `avatars` and `renders`.

**Backend.**

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in SUPABASE_* + AI provider keys
uvicorn main:app --reload --port 8000
```

API docs at http://localhost:8000/docs.

**Frontend.**

```bash
cd frontend
npm install
npm run dev                 # http://localhost:3005
```

Frontend `.env.local` needs the Supabase URL + anon key and the backend base URL.

---

## Accuracy honesty

fitz aims for:

- strong identity similarity to the real user
- believable body shape and silhouette
- directionally useful fit guidance

fitz does **not** promise:

- exact fabric physics
- exact garment drape from a single listing photo
- one-to-one body reconstruction

The product claim is a *personalized, directionally accurate preview* — not a measurement tool.

---

## Roadmap

1. **Demoable frontend** — app shell, browse, try-on, closet, lookbook
2. **Core product logic** — onboarding, avatar state, render jobs, credits
3. **Backend + persistence** — schema, auth, storage, API endpoints
4. **AI integration** — body profile, garment analysis, try-on rendering

