# Ocean Observations — API Endpoint

## `POST /api/ocean-observations`

Records a single ocean observation during the Drake Passage crossing.
The agent fetches marine weather data (e.g. Open-Meteo Marine API) and forwards it here.

### Authentication

```
Authorization: Bearer <REMOTE_SYNC_API_KEY>
Content-Type: application/json
```

---

### Request payload

```json
{
  "analyzed_at":      "2026-03-28T14:32:00Z",
  "wave_height_m":    3.2,
  "sea_state":        "rough",
  "beaufort":         7,
  "swell_direction":  "NW",
  "drake_assessment": "Heavy swells from northwest. Conditions deteriorating.",
  "confidence":       "high"
}
```

### Field reference

| Field              | Type    | Required | Description |
|--------------------|---------|----------|-------------|
| `analyzed_at`      | string  | ✅       | ISO 8601 UTC timestamp of the observation |
| `wave_height_m`    | float   | —        | Wave height in meters (e.g. `3.2`) |
| `sea_state`        | string  | —        | `calm`, `slight`, `moderate`, `rough`, `very rough`, `high`, `storm` |
| `beaufort`         | integer | —        | Beaufort scale 0–12 |
| `swell_direction`  | string  | —        | Cardinal direction of dominant swell: `N`, `NW`, `W`, `SW`, etc. |
| `drake_assessment` | string  | —        | 1–2 sentence description of conditions |
| `confidence`       | string  | —        | `high`, `medium`, `low` |

> All fields except `analyzed_at` are optional. Send whatever is available.

---

### Response

**200 OK**
```json
{ "ok": true }
```

**400 Bad Request**
```json
{ "error": "Missing required field: analyzed_at" }
```

**401 Unauthorized**
```json
{ "error": "Unauthorized" }
```

---

### Suggested data source

[Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api) — free, no key required.

```
GET https://marine-api.open-meteo.com/v1/marine
  ?latitude={lat}
  &longitude={lon}
  &current=wave_height,wave_direction,wave_period
  &wind_speed_unit=kmh
```

Field mapping:
- `wave_height` → `wave_height_m`
- `wave_direction` → `swell_direction` (convert degrees to cardinal)

---

### Notes

- Call this endpoint once per observation cycle (e.g. every 30–60 min during the crossing).
- Multiple readings per hour are fine — every call creates a new row, no deduplication.
- The histogram on the website shows all readings chronologically.
