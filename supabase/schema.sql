-- ============================================================
-- Antartia Web — Database Schema
-- Run once in Supabase SQL editor or via scripts/migrate.mjs
-- ============================================================

-- Full GPS route. Upserted on each agent sync (always one row).
-- DEPRECATED: replaced by gps_points + GET /api/track. Kept for reference.
CREATE TABLE IF NOT EXISTS track_snapshots (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  geojson         JSONB         NOT NULL,
  total_points    INTEGER,
  distance_km     NUMERIC(10,3),
  recorded_at_first TIMESTAMPTZ,
  recorded_at_last  TIMESTAMPTZ,
  last_updated    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Individual GPS fixes. Append-only; never deleted. Full expedition history.
CREATE TABLE IF NOT EXISTS gps_points (
  id          SERIAL      PRIMARY KEY,
  latitude    REAL        NOT NULL,
  longitude   REAL        NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL
);

-- Weather readings. One row per agent sync (4x daily).
CREATE TABLE IF NOT EXISTS weather_snapshots (
  id                    BIGSERIAL   PRIMARY KEY,
  latitude              NUMERIC(9,6)  NOT NULL,
  longitude             NUMERIC(9,6)  NOT NULL,
  temperature           NUMERIC(5,2),
  apparent_temperature  NUMERIC(5,2),
  wind_speed            NUMERIC(6,2),
  wind_gusts            NUMERIC(6,2),
  wind_direction        INTEGER,
  precipitation         NUMERIC(6,2),
  snowfall              NUMERIC(6,2),
  condition             TEXT,
  recorded_at           TIMESTAMPTZ   NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Photo metadata. File stored in Supabase Storage `photos` bucket.
CREATE TABLE IF NOT EXISTS photos (
  file_name           TEXT        PRIMARY KEY,
  file_url            TEXT        NOT NULL,
  recorded_at         TIMESTAMPTZ,
  latitude            NUMERIC(9,6),
  longitude           NUMERIC(9,6),
  significance_score  NUMERIC(4,3),
  vision_description  TEXT,
  vision_summary      TEXT,
  agent_quote         TEXT,
  tags                JSONB,
  width               INTEGER,
  height              INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily narrative. Upserted by date (one per day).
CREATE TABLE IF NOT EXISTS reflections (
  id         BIGSERIAL   PRIMARY KEY,
  date       DATE        UNIQUE NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12h navigation snapshots. Appended on each analysis run.
CREATE TABLE IF NOT EXISTS route_analyses (
  id               BIGSERIAL   PRIMARY KEY,
  analyzed_at      TIMESTAMPTZ NOT NULL,
  date             DATE        NOT NULL,
  window_hours     INTEGER,
  point_count      INTEGER,
  position         JSONB,
  bearing_deg      NUMERIC(6,2),
  bearing_compass  TEXT,
  speed_kmh        NUMERIC(6,2),
  avg_speed_kmh    NUMERIC(6,2),
  distance_km      NUMERIC(10,3),
  stopped          BOOLEAN,
  wind             JSONB,
  nearest_sites    JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Short agent dispatches. Appended on demand.
CREATE TABLE IF NOT EXISTS messages (
  id           BIGSERIAL   PRIMARY KEY,
  content      TEXT        NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vision-based ocean observations during Drake crossing. Append-only.
-- Agent analyzes photos from the ship to estimate sea state, wave height, etc.
CREATE TABLE IF NOT EXISTS ocean_observations (
  id               BIGSERIAL   PRIMARY KEY,
  wave_height_m    NUMERIC(5,2),
  sea_state        TEXT,
  beaufort         INTEGER,
  swell_direction  TEXT,
  drake_assessment TEXT,
  confidence       TEXT,
  analyzed_at      TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expedition-wide running totals. Always one row (upserted).
CREATE TABLE IF NOT EXISTS progress (
  id                       INTEGER PRIMARY KEY DEFAULT 1,
  expedition_day           INTEGER,
  distance_km_total        NUMERIC(10,3),
  photos_captured_total    INTEGER,
  wildlife_spotted_total   INTEGER,
  temperature_min_all_time NUMERIC(5,2),
  temperature_max_all_time NUMERIC(5,2),
  current_position         JSONB,
  tokens_used_total        BIGINT,
  published_at             TIMESTAMPTZ,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);
