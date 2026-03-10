# Antartia Web — Expedition Tracking Platform

## Overview

Full-stack platform that receives real-time expedition data from an AI agent operating aboard a ship in Antarctica. The agent communicates over satellite, POSTing GPS routes, weather snapshots, photos, daily reflections, navigation analyses, short dispatches, and running expedition totals. The server stores everything in Supabase (PostgreSQL + Storage) and serves a public-facing website that visualizes the expedition live.

## Architecture

- **Single Next.js 15 app**: API routes handle all inbound agent POSTs; App Router pages serve the public frontend. One repo, one Railway service.
- **Bearer token auth**: All `/api/*` POST endpoints require `Authorization: Bearer <REMOTE_SYNC_API_KEY>`. Validated in Next.js middleware before any route handler runs.
- **Supabase PostgreSQL**: Stores all structured data (track, weather, reflections, messages, progress, route analyses, photo metadata).
- **Supabase Storage + CDN**: JPEG photos uploaded by the agent are stored in a `photos` bucket, served via Supabase's built-in Cloudflare CDN. No extra CDN config needed.
- **Upsert semantics for singletons**: `/api/track` and `/api/progress` always overwrite — one canonical row. All others append new rows.
- **No direct DB access from browser**: All data fetching is server-side (Server Components or API routes). Browser only touches Supabase CDN for photo URLs.

## Request Flow

```mermaid
graph TD
    Agent([Agent in Antarctica]) --> Auth{Bearer token valid?}
    Auth -->|No| Reject[401 Unauthorized]
    Auth -->|Yes| Router{Endpoint}

    Router -->|POST /api/track| Track[Upsert full GPS route]
    Router -->|POST /api/weather| Weather[Insert weather snapshot]
    Router -->|POST /api/photos| Photos[Upload JPEG to Supabase Storage\nInsert metadata row]
    Router -->|POST /api/reflections| Reflections[Upsert daily reflection by date]
    Router -->|POST /api/route-analysis| RouteAnalysis[Insert route analysis]
    Router -->|POST /api/messages| Messages[Insert agent message]
    Router -->|POST /api/progress| Progress[Upsert single progress row]

    Track --> DB[(Supabase PostgreSQL)]
    Weather --> DB
    Photos --> Storage[(Supabase Storage)]
    Photos --> DB
    Reflections --> DB
    RouteAnalysis --> DB
    Messages --> DB
    Progress --> DB

    DB --> Frontend([Public Frontend\nNext.js SSR])
    Storage --> Frontend
```

## Project Structure

```
aitartica-web/
├── app/
│   ├── api/
│   │   ├── track/route.ts          # POST — GPS route upsert
│   │   ├── weather/route.ts        # POST — weather snapshot
│   │   ├── photos/route.ts         # POST — photo upload (multipart)
│   │   ├── reflections/route.ts    # POST — daily reflection upsert
│   │   ├── route-analysis/route.ts # POST — navigation snapshot
│   │   ├── messages/route.ts       # POST — agent dispatch
│   │   └── progress/route.ts       # POST — expedition totals upsert
│   ├── layout.tsx
│   └── page.tsx                    # Frontend (later)
├── lib/
│   ├── supabase.ts                 # Supabase client (server-side)
│   └── auth.ts                     # Bearer token validation helper
├── middleware.ts                    # Auth guard for /api/* POST routes
├── supabase/
│   └── schema.sql                  # Full DB schema (run once in Supabase dashboard)
├── .env.local                      # SUPABASE_URL, SUPABASE_SERVICE_KEY, REMOTE_SYNC_API_KEY
├── NOTES.md
├── PLAN.md
└── package.json
```

## Key Design Decisions

### Single Next.js app (no separate backend service)
All API endpoints live as Next.js App Router route handlers. This means one Railway service, one deploy, shared env vars, and no cross-origin complexity. For the request volume of a satellite-connected agent (a few POSTs per hour), this is more than sufficient.

### Supabase over raw Railway PostgreSQL
Supabase gives us PostgreSQL + file storage + CDN in one platform with a generous free tier (1GB storage, 500MB DB). The agent uploads ~240 photos over 12 days (~480MB) — well within limits. The Supabase JS client simplifies both DB queries and storage uploads.

### Bearer token in middleware (not per-route)
`middleware.ts` intercepts all `/api/*` requests and validates the `Authorization` header before any route handler executes. This keeps auth logic in one place and prevents accidental exposure of unprotected endpoints.

### Upsert for singletons (track + progress)
The agent sends the full GPS route and full expedition totals on every sync — not deltas. The server upserts a single canonical row for each, so the frontend always reads the latest complete snapshot without accumulating stale partial rows.

### Multipart photo uploads via native Web API
Next.js 15 App Router natively supports `request.formData()` for multipart — no `formidable` or `busboy` needed. The JPEG is streamed directly to Supabase Storage; only metadata goes to the DB.

### Service role key for server-side Supabase
All API routes use the Supabase `service_role` key (never exposed to the browser). This bypasses Row Level Security for server-to-server writes. Public GET routes (if added later) use the `anon` key.

## Infrastructure

### Railway
- **Service**: Single Next.js app (web service). Auto-deploy from GitHub `main` branch.
- **Config**: `railway.toml` — build `npm run build`, start `npm run start`, healthcheck `/`.
- **No Railway PostgreSQL plugin** — DB is fully managed by Supabase.
- **Status**: Pending — needs GitHub repo connected + env vars set in dashboard.

### Supabase
- **Plan**: Free tier (sufficient for expedition scope).
- **PostgreSQL**: 7 tables applied ✅. RLS disabled (service role bypasses it).
- **Storage bucket**: `photos` (public) ✅ — Cloudflare CDN at `*.supabase.co/storage/v1/object/public/photos/...`.
- **Status**: ✅ Live and tested.

### Deployment Flow

```mermaid
graph LR
    Dev[Local dev\nnpm run dev] -->|git push main| GH[GitHub repo]
    GH -->|auto-deploy| Railway[Railway service\nNext.js 15]
    Railway -->|reads/writes| Supabase[(Supabase\nPostgreSQL + Storage)]
    Agent[Agent in Antarctica] -->|HTTPS POST| Railway
    Browser[Public browser] -->|HTTPS GET| Railway
    Browser -->|photos CDN| Supabase
```

### Environment Variables

| Variable | Where set | Used for |
|---|---|---|
| `SUPABASE_URL` | `.env` ✅ + Railway ⏳ | Supabase client init |
| `SUPABASE_ANON_KEY` | `.env` ✅ + Railway ⏳ | Legacy JWT anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` ✅ + Railway ⏳ | Server writes, bypasses RLS |
| `REMOTE_SYNC_API_KEY` | `.env` ✅ + Railway ⏳ | Agent Bearer token |

## Frontend — Data Wiring (Pending)

These sections are currently rendering placeholder/hardcoded content and need to be wired to the DB:

### Trajectory Map (`gps_points`)
- **What**: Show all GPS points recorded during the full expedition as a continuous track line.
- **Source**: `gps_points` table, ordered by `recorded_at ASC` — all rows, no date filter.
- **Current map** (`ExpeditionMap.tsx`): hardcoded TRACK array → replace with data fetched server-side and passed as prop.

### Map Header — Last Position (`gps_points` or `progress`)
- **What**: LAT / LON display in the map panel header shows the last recorded position.
- **Source**: `gps_points ORDER BY recorded_at DESC LIMIT 1`, or `progress.current_position` (JSONB `{lat, lon}`).
- **Note**: ALT is not displayed (removed from UI).

### Mission Log (`reflections` + `messages`)
- **What**: Show only today's entries — the day's reflection and any messages sent today, merged and ordered chronologically.
- **Source**:
  - `reflections WHERE date = CURRENT_DATE` (one row max)
  - `messages WHERE published_at::date = CURRENT_DATE ORDER BY published_at ASC`
- **Current**: hardcoded `LOG_ENTRIES` array in `page.tsx`.

### Photo Gallery — The Polar Prism (`photos`)
- **What**: Show real photos uploaded by the agent, filtered by selected day tab.
- **Source**: `photos WHERE recorded_at::date = <selected_date> ORDER BY significance_score DESC`.
- **Day tabs**: derive available days from `SELECT DISTINCT recorded_at::date FROM photos ORDER BY 1 DESC LIMIT 4`.
- **Current**: hardcoded `MOSAIC_PHOTOS` with picsum placeholders.

---

## Commit History

| #   | Description                                      | Status      |
|-----|--------------------------------------------------|-------------|
| 1   | Init Next.js 15 project + env setup              | Done        |
| 2   | Supabase schema (all 7 tables + storage bucket)  | Done        |
| 3   | Supabase client + Bearer auth middleware         | Done        |
| 4   | POST /api/track, /api/weather, /api/progress     | Done        |
| 5   | POST /api/reflections, /api/messages             | Done        |
| 6   | POST /api/route-analysis                         | Done        |
| 7   | POST /api/photos (multipart + Storage upload)    | Done        |
| 8   | backend.md — API reference for agent client      | Done        |
| 9   | railway.toml + GitHub repo + Railway project     | In Progress |
| 10  | Set env vars in Railway dashboard                | Planned     |
| 11  | Verify live deploy + end-to-end test             | Planned     |
