# Antartia Web

Real-time expedition tracking platform for the Antartia Antarctic voyage. An AI agent aboard the ship syncs GPS routes, weather, photos, reflections, and navigation data to this server over satellite. The public frontend visualizes the expedition live.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (photos, Cloudflare CDN)
- **Deployment**: Railway

## API Endpoints

All POST endpoints require `Authorization: Bearer <REMOTE_SYNC_API_KEY>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/track` | Full GPS route (GeoJSON) — upserted |
| POST | `/api/weather` | Latest weather snapshot |
| POST | `/api/photos` | Photo upload (multipart/form-data) |
| POST | `/api/reflections` | Daily narrative reflection |
| POST | `/api/route-analysis` | 12h navigation snapshot |
| POST | `/api/messages` | Short agent dispatch |
| POST | `/api/progress` | Expedition running totals — upserted |

## Local Development

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `REMOTE_SYNC_API_KEY` | Bearer token expected from the Antarctic agent |

## Database

Schema lives in `supabase/schema.sql`. Run once in the Supabase SQL editor to initialize all tables and the photos storage bucket.
