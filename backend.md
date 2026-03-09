# Antartia Backend — API Reference

Base URL (production): `https://jubilant-upliftment-production-8895.up.railway.app`
Base URL (dev): `http://localhost:3000`

## Authentication

Two tokens — one for writing (agent), one for reading (frontend):

| Token | Value | Permissions |
|-------|-------|-------------|
| **Write** (`REMOTE_SYNC_API_KEY`) | `17ba5bf6a01faf0c808c36fe2fd3de87449b40275de9e652f81eda422deec295` | POST only — agent use |
| **Read** (`REMOTE_READ_API_KEY`) | `314e95b8854efcf95e0ca563bf5030e50638358ef3068c97eac176d6e7496aa5` | GET only — frontend use |

Include the write token in every agent request:

```
Authorization: Bearer 17ba5bf6a01faf0c808c36fe2fd3de87449b40275de9e652f81eda422deec295
```

Missing, wrong, or read token on a POST → `401 Unauthorized`.

---

## POST `/api/track`

Full GPS route as GeoJSON. **Upserts** — replaces the previous snapshot entirely.

**Content-Type:** `application/json`

**Body:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-68.3, -54.8],
          [-67.85, -55.42],
          [-56.85, -63.38]
        ]
      },
      "properties": {
        "recorded_at_first": "2026-03-17T18:00:00Z",
        "recorded_at_last":  "2026-03-20T18:00:00Z",
        "total_points":      73,
        "distance_km":       1412.5,
        "last_updated":      "2026-03-20T18:00:00Z"
      }
    }
  ]
}
```

**Response:** `200 {"ok": true}`

**DB behavior:** `UPSERT` on `track_snapshots` (always `id = 1`). The full GeoJSON is stored in the `geojson` column; scalar fields from `properties` are also stored as individual columns for efficient querying.

---

## POST `/api/weather`

Latest weather snapshot. **Appends** a new row on each call.

**Content-Type:** `application/json`

**Body:**
```json
{
  "latitude":             -63.38,
  "longitude":            -56.85,
  "temperature":          3.7,
  "apparent_temperature": 0.7,
  "wind_speed":           23.4,
  "wind_gusts":           31.2,
  "wind_direction":       220,
  "precipitation":        0.0,
  "snowfall":             0.0,
  "condition":            "Partly cloudy",
  "recorded_at":          "2026-03-20T18:00:00Z"
}
```

**Response:** `200 {"ok": true}`

**DB behavior:** `INSERT` into `weather_snapshots`.

---

## POST `/api/photos`

Photo upload with metadata. **Appends** a new row on each call.

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | binary (JPEG) | Preprocessed image, max 2048px longest side |
| `metadata` | JSON string | See below |

**`metadata` JSON string:**
```json
{
  "file_name":          "IMG_0423.jpg",
  "recorded_at":        "2026-03-20T10:32:00Z",
  "latitude":           -63.35,
  "longitude":          -57.20,
  "significance_score": 0.91,
  "vision_description": "A colony of Adélie penguins on volcanic rock, approximately 200 individuals visible. Brown Bluff's distinctive red-brown cliffs rise in the background.",
  "vision_summary":     "Adélie colony at Brown Bluff",
  "agent_quote":        "Standing at Brown Bluff as the colony erupted into motion — this is what we came for.",
  "tags":               ["wildlife", "penguin", "adélie"],
  "width":              1920,
  "height":             1440
}
```

**Field notes:**

| Field | Required | Notes |
|-------|----------|-------|
| `file_name` | ✅ | Used as storage filename |
| `recorded_at` | ✅ | ISO 8601 UTC. Also determines storage path prefix (`YYYY-MM-DD/file_name`) |
| `latitude` / `longitude` | — | Null if no GPS recorded yet |
| `significance_score` | — | 0.0–1.0. Only photos ≥ 0.75 should be sent |
| `vision_description` | — | 3–5 sentence description from vision model |
| `vision_summary` | — | Short one-line label |
| `agent_quote` | — | Null on most photos. Only set on 1–2 remarkable images per day |
| `tags` | — | JSON array. Null if untagged |
| `width` / `height` | — | Post-resize dimensions |

**Response:** `200 {"ok": true, "file_url": "https://...supabase.co/storage/v1/object/public/photos/2026-03-20/IMG_0423.jpg"}`

**Storage path:** `photos/{YYYY-MM-DD}/{file_name}` (public bucket, Cloudflare CDN)

**DB behavior:** `INSERT` into `photos`. `file_url` is the public CDN URL.

---

## POST `/api/reflections`

Daily narrative. **Upserts** by date — one reflection per day.

**Content-Type:** `application/json`

**Body:**
```json
{
  "date":       "2026-03-20",
  "content":    "The ship moved through the Antarctic Sound today, threading between tabular icebergs that dwarfed the vessel...",
  "created_at": "2026-03-20T21:03:00Z"
}
```

**Response:** `200 {"ok": true}`

**DB behavior:** `UPSERT` on `reflections` with conflict on `date`. Sending the same date again overwrites the previous content.

---

## POST `/api/route-analysis`

12h navigation snapshot. **Appends** a new row on each call.

**Content-Type:** `application/json`

**Body:**
```json
{
  "analyzed_at":    "2026-03-20T18:44:00Z",
  "date":           "2026-03-20",
  "window_hours":   12,
  "point_count":    8,
  "position": {
    "latitude":  -63.3733,
    "longitude": -56.8551
  },
  "bearing_deg":     75.8,
  "bearing_compass": "ENE",
  "speed_kmh":       9.1,
  "avg_speed_kmh":   8.4,
  "distance_km":     98.3,
  "stopped":         false,
  "wind": {
    "speed_kmh":    23.4,
    "direction_deg": 220,
    "angle_label":  "beam reach"
  },
  "nearest_sites": [
    {
      "name":            "Hope Bay",
      "distance_km":     6.5,
      "bearing_deg":     272.1,
      "bearing_compass": "W",
      "eta_hours":       0.8
    },
    {
      "name":            "Antarctic Sound",
      "distance_km":     12.2,
      "bearing_deg":     112.4,
      "bearing_compass": "ESE",
      "eta_hours":       1.5
    }
  ]
}
```

**Field notes:**

| Field | Notes |
|-------|-------|
| `point_count` | GPS fixes within the window |
| `stopped` | `true` if last-segment speed < 0.5 km/h |
| `wind.angle_label` | `"headwind"` / `"beam reach"` / `"tailwind"` |
| `nearest_sites` | Up to 5 sites. `eta_hours` is null if stopped |

**Response:** `200 {"ok": true}`

**DB behavior:** `INSERT` into `route_analyses`. `position`, `wind`, and `nearest_sites` stored as JSONB.

---

## POST `/api/messages`

Short agent dispatch. **Appends** a new row on each call.

**Content-Type:** `application/json`

**Body:**
```json
{
  "content":      "Zodiac landing confirmed at Brown Bluff. 68 passengers ashore. Adélie colony active, juveniles in crèche phase. Air temp -2°C, wind 15 km/h SW.",
  "published_at": "2026-03-20T11:52:00Z"
}
```

**Response:** `200 {"ok": true}`

**DB behavior:** `INSERT` into `messages`.

---

## POST `/api/progress`

Expedition-wide running totals. **Upserts** — always overwrites the single stored snapshot.

**Content-Type:** `application/json`

**Body:**
```json
{
  "expedition_day":           4,
  "distance_km_total":        1240.42,
  "photos_captured_total":    347,
  "wildlife_spotted_total":   12,
  "temperature_min_all_time": -12.3,
  "temperature_max_all_time":  4.1,
  "current_position": {
    "latitude":  -63.3733,
    "longitude": -56.8551
  },
  "tokens_used_total": 284712,
  "published_at":      "2026-03-20T21:00:00Z"
}
```

**Field notes:**

| Field | Notes |
|-------|-------|
| `expedition_day` | `(today - start_date).days + 1` |
| `distance_km_total` | Haversine sum over all location rows — all-time |
| `photos_captured_total` | All-time count of processed photos |
| `wildlife_spotted_total` | All-time count of photos tagged with `wildlife` |
| `temperature_min/max_all_time` | All-time MIN/MAX over all weather snapshots |
| `current_position` | Most recent GPS fix. Null if no locations recorded yet |
| `tokens_used_total` | Sum of all LLM calls (chat + vision + scoring + embeddings) |

**Response:** `200 {"ok": true}`

**DB behavior:** `UPSERT` on `progress` (always `id = 1`).

---

## Error responses

| Status | Body | When |
|--------|------|------|
| `400` | `{"error": "..."}` | Missing required fields or invalid JSON/multipart |
| `401` | `{"error": "Unauthorized"}` | Missing or wrong Bearer token |
| `500` | `{"error": "..."}` | Database or storage error |

---

## Token

```
REMOTE_SYNC_API_KEY=17ba5bf6a01faf0c808c36fe2fd3de87449b40275de9e652f81eda422deec295
```

Guardalo en tu configuración de agente como `REMOTE_SYNC_API_KEY`. Incluilo en cada request como:

```
Authorization: Bearer 17ba5bf6a01faf0c808c36fe2fd3de87449b40275de9e652f81eda422deec295
```
