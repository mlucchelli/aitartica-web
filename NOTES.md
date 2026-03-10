# AITARTICA Web — Project Notes

## What is this?

A full-stack expedition tracking platform for an Antarctic voyage. An AI agent running on a ship in Antarctica sends real-time data to this server (GPS, weather, photos, reflections, etc.). The web frontend displays this data publicly, expedition-style.

---

## Architecture Overview

```
[Agent on ship] → HTTP POST (Bearer token) → [Backend API] → [PostgreSQL DB]
                                                    ↕
                                             [File Storage]
                                                    ↕
                                          [Frontend (Next.js)]
```

---

## Backend API Contract

All endpoints require `Authorization: Bearer <REMOTE_SYNC_API_KEY>`.

| Endpoint | Method | Payload | Description |
|----------|--------|---------|-------------|
| `/api/track` | POST | GeoJSON FeatureCollection | Full GPS route snapshot |
| `/api/weather` | POST | JSON | Latest weather snapshot |
| `/api/photos` | POST | multipart/form-data | Photo + metadata (JPEG, max 2048px) |
| `/api/reflections` | POST | JSON | Daily narrative (150–300 words) |
| `/api/route-analysis` | POST | JSON | Navigation snapshot (12h window) |
| `/api/messages` | POST | JSON | Short agent dispatch (on demand) |
| `/api/progress` | POST | JSON | Expedition running totals (overwrites) |

---

## Database Schema (PostgreSQL)

### `track_snapshots`
Stores the latest full GPS route. Agent replaces/upserts on each call.
- `id`, `geojson` (JSONB), `total_points`, `distance_km`, `recorded_at_first`, `recorded_at_last`, `last_updated`, `created_at`

### `weather_snapshots`
Each weather report from the agent.
- `id`, `latitude`, `longitude`, `temperature`, `apparent_temperature`, `wind_speed`, `wind_gusts`, `wind_direction`, `precipitation`, `snowfall`, `condition`, `recorded_at`, `created_at`

### `photos`
Photo metadata. File stored separately (object storage).
- `id`, `file_name`, `file_url` (stored path/URL), `recorded_at`, `latitude`, `longitude`, `significance_score`, `vision_description`, `vision_summary`, `agent_quote`, `tags` (JSONB array), `width`, `height`, `created_at`

### `reflections`
One per day.
- `id`, `date` (UNIQUE), `content`, `created_at`

### `route_analyses`
Navigation snapshots.
- `id`, `analyzed_at`, `date`, `window_hours`, `point_count`, `position` (JSONB), `bearing_deg`, `bearing_compass`, `speed_kmh`, `avg_speed_kmh`, `distance_km`, `stopped`, `wind` (JSONB), `nearest_sites` (JSONB), `created_at`

### `messages`
Agent dispatches.
- `id`, `content`, `published_at`, `created_at`

### `progress`
Single-row table (upserted). Expedition-wide totals.
- `id` (always 1), `expedition_day`, `distance_km_total`, `photos_captured_total`, `wildlife_spotted_total`, `temperature_min_all_time`, `temperature_max_all_time`, `current_position` (JSONB), `tokens_used_total`, `published_at`, `updated_at`

---

## File Storage (Photos)

Options:
1. **Cloudflare R2** — S3-compatible, generous free tier, good for images
2. **Railway Volumes** — Simpler but persistent disk, not CDN-backed
3. **Supabase Storage** — Comes with Postgres if using Supabase

**Recommendation**: Cloudflare R2 (free egress, S3 API) or Supabase (bundled DB + storage).

---

## Frontend (Visual Reference)

Based on "The Horizon" example screenshot:

### Sections
1. **Hero** — Mission name, tagline, full-screen Antarctic backdrop
2. **Stats Bar** — Distance traveled, photos captured, wildlife spotted, expedition day, min/max temp
3. **Trajectory** — Interactive map (Mapbox GL or Leaflet) with GPS route + live position dot
4. **Archive/Mosaic** — Photo grid filterable by day, with vision descriptions and agent quotes
5. **Reflections** — Daily narrative text, date-indexed
6. **Messages** — Latest agent dispatches
7. **Weather** — Current conditions widget

### Design aesthetic (from screenshot)
- Dark background (#1a1a1a / near-black)
- Orange accent color (approx #FF6B00)
- Monospace/condensed fonts
- "LIVE SIGNAL" indicator badge
- Coordinates display overlay on map

---

## Tech Stack Recommendation

### Backend
**Hono** (TypeScript) — lightweight, edge-ready, runs great on Railway. Or **FastAPI** (Python) if team prefers.

**Recommendation: Hono + TypeScript**
- Single repo with frontend
- Fast cold starts on Railway
- Easy multipart handling for photo uploads

### Frontend
**Next.js 15 (App Router)** — SSR for SEO, ISR for near-realtime updates, easy API routes.

### Database
**PostgreSQL** on Railway — native Railway plugin, zero config.

### ORM
**Drizzle ORM** — TypeScript-native, excellent with PostgreSQL, lightweight.

### Map
**Mapbox GL JS** or **react-leaflet** with OpenStreetMap tiles.

### Deployment
Single Railway project with:
- Service 1: Next.js app (frontend + API routes as backend)
- Plugin: PostgreSQL

---

## Monorepo vs Single App

Since backend is just REST endpoints and frontend is Next.js, the cleanest approach is:
**Single Next.js app** — API routes handle the backend, pages/app handle the frontend.

This means:
- `app/api/track/route.ts` handles `POST /api/track`
- `app/api/weather/route.ts` handles `POST /api/weather`
- etc.
- One Railway service, one deploy, one repo.

---

## Auth

`REMOTE_SYNC_API_KEY` env var. Middleware checks `Authorization: Bearer <key>` on all `/api/*` routes except public GET endpoints.

---

## Key Considerations

1. **Photo uploads**: Next.js API routes support multipart but may need `formidable` or `busboy`. Consider size limits (Railway has 100MB request limit). Store to R2/Supabase after receiving.
2. **Track endpoint**: Agent sends full route each time — server should upsert/replace, not append.
3. **Progress endpoint**: Always overwrites — single row upsert.
4. **Public vs protected**: All POST endpoints require Bearer token. GET endpoints (for frontend) are public.
5. **Real-time feel**: Use ISR (revalidate every 60s) or polling on frontend for near-realtime updates. No need for WebSockets given satellite latency constraints.

---

## Decisions Made

- **Frontend**: 100% público, sin auth de usuario.
- **Stack**: Next.js 15 (monorepo único — API routes + frontend). Un solo servicio en Railway.
- **Dominio**: Railway por defecto (`xxx.railway.app`).
- **Storage de fotos**: Supabase Storage (free: 1GB, CDN Cloudflare built-in, ~480MB necesarios para 240 fotos).
- **CDN**: Supabase Storage incluye CDN Cloudflare — sin costo extra, fotos desde edge.
- **DB**: Supabase PostgreSQL (misma plataforma, simplifica config).

## Supabase Free Tier

- Storage: 1 GB (necesitamos ~480 MB → OK)
- DB: 500 MB
- Bandwidth egress: 2 GB/mes
- Nota: pausa tras 7 días sin actividad → el agente enviando datos cada 6h lo mantiene activo.

## Open Questions

- [ ] ¿Fecha de inicio de la expedición? (el agente envía `expedition_day` calculado, así que no crítico para el server)

---

## Next Steps

1. Init Next.js project (`create-next-app`)
2. Set up Drizzle + PostgreSQL schema
3. Implement all `/api/*` POST routes with Bearer auth
4. Build frontend sections (Hero → Stats → Map → Archive)
5. Deploy to Railway, set env vars
