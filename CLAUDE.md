# Antartia Web — Claude Context

## What this project is

Full-stack expedition tracking platform. An AI agent on a ship in Antarctica sends real-time data (GPS, weather, photos, reflections, navigation snapshots) to this server via authenticated HTTP POST requests. The public website visualizes the expedition live.

## Tech stack

- **Next.js 15** — App Router, TypeScript, Tailwind CSS v4
- **Supabase** — PostgreSQL (DB) + Storage (photos, public bucket)
- **Railway** — deployment (single service, auto-deploy from GitHub main)
- **No ORM** — use `@supabase/supabase-js` client directly for all DB and Storage operations

## Key conventions

- **No direct DB access from the browser.** All data fetching is server-side (Server Components or API routes). The browser only accesses Supabase CDN for photo URLs (static files only).
- All Supabase operations use the **service role key** (`SUPABASE_SERVICE_ROLE_KEY`). Never expose it to the browser.
- Bearer token auth is enforced in `middleware.ts` for all POST `/api/*` routes. Do not add per-route auth checks.
- `/api/track` and `/api/progress` **upsert** (one canonical row). All other endpoints **insert** new rows.
- Photos endpoint receives `multipart/form-data` — use `request.formData()` natively, no extra libraries.
- Supabase client is initialized in `lib/supabase.ts` and imported from there everywhere.

## Environment variables required

```
SUPABASE_URL=
SUPABASE_ANON_KEY=           # new: sb_publishable_... (Publishable and secret API keys tab)
SUPABASE_SERVICE_ROLE_KEY=   # new: sb_secret_...     (Publishable and secret API keys tab)
REMOTE_SYNC_API_KEY=         # any secret string — must match what the agent sends
```

Supabase migrated from JWT-based anon/service_role keys to publishable/secret keys.
- `sb_publishable_...` = old anon key (safe for browser)
- `sb_secret_...` = old service_role key (server-side only, bypasses RLS, returns 401 in browser)

## Database tables

| Table | Behavior | Notes |
|-------|----------|-------|
| `track_snapshots` | Upsert (id=1) | Full GeoJSON route, replaced on each sync |
| `weather_snapshots` | Insert | Append each reading |
| `photos` | Insert | Metadata only; file in Supabase Storage `photos` bucket |
| `reflections` | Upsert on `date` | One per day |
| `route_analyses` | Insert | Append each snapshot |
| `messages` | Insert | Append each dispatch |
| `progress` | Upsert (id=1) | Single row, always overwritten |

## Supabase Storage

- Bucket: `photos` (public)
- File path pattern: `{recorded_at_date}/{file_name}` e.g. `2026-03-20/IMG_0423.jpg`
- Public URL: `{SUPABASE_URL}/storage/v1/object/public/photos/{path}`

## Agent data contract

The agent POSTs JSON (or multipart for photos) from Antarctica. Full payload specs are in `NOTES.md`. Key points:
- All timestamps are ISO 8601 UTC strings
- `significance_score` is 0.0–1.0 (only photos ≥ 0.75 are uploaded)
- `tags` is a JSON array or null
- `agent_quote` is null on most photos (only 1–2 remarkable ones per day)
- `nearest_sites` in route-analysis is up to 5 items

## Project structure

```
app/
  api/
    track/route.ts
    weather/route.ts
    photos/route.ts
    reflections/route.ts
    route-analysis/route.ts
    messages/route.ts
    progress/route.ts
  layout.tsx
  page.tsx
lib/
  supabase.ts       # Supabase server client (service role)
middleware.ts       # Bearer token guard for POST /api/*
supabase/
  schema.sql        # Run once in Supabase SQL editor
```

## Commands

```bash
npm run dev       # dev server with Turbopack
npm run build     # production build
npm run lint      # ESLint
```
