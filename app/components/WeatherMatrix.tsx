"use client";

import React, { useState } from "react";

export type WeatherRow = {
  recorded_at: string;
  temperature: number | null;
  apparent_temperature: number | null;
  wind_speed: number | null;
  wind_gusts: number | null;
  wind_direction: number | null;
  precipitation: number | null;
  snowfall: number | null;
  condition: string | null;
};

type Mode = "temp" | "wind" | "snow";

// Hours shown on X axis (every 2h)
const HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

function windDir(deg: number | null): string {
  if (deg === null) return "—";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }

// Meteorological temp scale anchored to Antarctic range: -30 → +15°C
// Stops: deep-blue → cyan → teal-green → amber → orange
const TEMP_STOPS = [
  { t: -30, r: 15,  g: 26,  b: 100 },  // deep blue-navy
  { t: -15, r: 0,   g: 144, b: 168 },  // site cyan
  { t:   0, r: 30,  g: 180, b: 120 },  // teal-green
  { t:   8, r: 220, g: 150, b: 40  },  // amber
  { t:  15, r: 210, g: 70,  b: 30  },  // orange-red
];

function tempToColor(t: number): string {
  const clamped = Math.max(-30, Math.min(15, t));
  for (let i = 1; i < TEMP_STOPS.length; i++) {
    const a = TEMP_STOPS[i - 1], b = TEMP_STOPS[i];
    if (clamped <= b.t) {
      const ratio = (clamped - a.t) / (b.t - a.t);
      return `rgb(${lerp(a.r,b.r,ratio)},${lerp(a.g,b.g,ratio)},${lerp(a.b,b.b,ratio)})`;
    }
  }
  const last = TEMP_STOPS[TEMP_STOPS.length - 1];
  return `rgb(${last.r},${last.g},${last.b})`;
}

function windToColor(w: number): string {
  const ratio = Math.max(0, Math.min(1, w / 80));
  // calm: light steel-blue → storm: deep cyan-saturated
  const r = lerp(160, 0, ratio);
  const g = lerp(200, 130, ratio);
  const b = lerp(220, 180, ratio);
  return `rgb(${r},${g},${b})`;
}

function snowToColor(s: number): string {
  const ratio = Math.max(0, Math.min(1, s / 5));
  // none: pale grey → heavy: bright cyan-white
  const r = lerp(200, 160, ratio);
  const g = lerp(215, 230, ratio);
  const b = lerp(225, 245, ratio);
  return `rgb(${r},${g},${b})`;
}

function cellColor(row: WeatherRow, mode: Mode): string | null {
  if (mode === "temp" && row.temperature !== null) return tempToColor(row.temperature);
  if (mode === "wind" && row.wind_speed !== null) return windToColor(row.wind_speed);
  if (mode === "snow" && row.snowfall !== null) return snowToColor(row.snowfall);
  return null;
}

// Build grid: { "2026-03-15": { 12: WeatherRow, 14: WeatherRow, ... }, ... }
function buildGrid(data: WeatherRow[]): Map<string, Map<number, WeatherRow>> {
  const grid = new Map<string, Map<number, WeatherRow>>();
  for (const row of data) {
    const date = row.recorded_at.slice(0, 10);
    const hour = new Date(row.recorded_at).getUTCHours();
    // Snap to nearest 2h slot
    const slot = Math.round(hour / 2) * 2;
    if (!grid.has(date)) grid.set(date, new Map());
    // If multiple readings fall in same slot, keep the one closer to the slot center
    const existing = grid.get(date)!.get(slot);
    if (!existing) {
      grid.get(date)!.set(slot, row);
    }
  }
  return grid;
}

function getDates(grid: Map<string, Map<number, WeatherRow>>): string[] {
  return Array.from(grid.keys()).sort();
}

export default function WeatherMatrix({ data }: { data: WeatherRow[] }) {
  const [mode, setMode] = useState<Mode>("temp");
  const [hovered, setHovered] = useState<{ row: WeatherRow; x: number; y: number } | null>(null);

  const grid = buildGrid(data);
  const dates = getDates(grid);

  // Stats
  const allTemps = data.map(r => r.temperature).filter((t): t is number => t !== null);
  const allWinds = data.map(r => r.wind_speed).filter((w): w is number => w !== null);
  const allSnow = data.map(r => r.snowfall).filter((s): s is number => s !== null);
  const minTemp = allTemps.length ? Math.min(...allTemps) : null;
  const maxTemp = allTemps.length ? Math.max(...allTemps) : null;
  const peakWind = allWinds.length ? Math.max(...allWinds) : null;
  const totalSnow = allSnow.length ? allSnow.reduce((a, b) => a + b, 0) : null;

  const hasData = data.length > 0;

  // Legend config per mode
  const legends: Record<Mode, { label: string; from: string; to: string; fromLabel: string; toLabel: string }> = {
    temp: { label: "Temperature", from: "rgb(15,26,100)", to: "rgb(210,70,30)", fromLabel: "−30°C", toLabel: "+15°C" },
    wind: { label: "Wind Speed", from: "rgb(60,80,110)", to: "rgb(0,168,180)", fromLabel: "0 km/h", toLabel: "80+ km/h" },
    snow: { label: "Snowfall", from: "rgb(90,110,130)", to: "rgb(220,240,250)", fromLabel: "0 mm", toLabel: "5+ mm" },
  };
  const legend = legends[mode];

  return (
    <div className="wm-container">
      {/* Header */}
      <div className="wm-header">
        <div>
          <div className="section-label">Field Conditions</div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Climate Tape</h2>
        </div>
        <div className="wm-tabs">
          {(["temp", "wind", "snow"] as Mode[]).map(m => (
            <button
              key={m}
              className={`mosaic-tab${mode === m ? " active" : ""}`}
              onClick={() => setMode(m)}
            >
              {m === "temp" ? "TEMP" : m === "wind" ? "WIND" : "SNOW"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {hasData && (
        <div className="wm-stats">
          {minTemp !== null && <span>Min <strong>{minTemp.toFixed(1)}°</strong></span>}
          {maxTemp !== null && <span>Max <strong>{maxTemp.toFixed(1)}°</strong></span>}
          {peakWind !== null && <span>Peak wind <strong>{peakWind.toFixed(0)} km/h</strong></span>}
          {totalSnow !== null && <span>Total snow <strong>{totalSnow.toFixed(1)} mm</strong></span>}
          <span style={{ color: "var(--text-muted)" }}>{data.length} readings · {dates.length} days</span>
        </div>
      )}

      {/* Grid — transposed: hours = rows (Y), days = columns (X), newest day rightmost */}
      <div className="wm-scroll">
        {!hasData ? (
          <div className="wm-empty">
            <div className="wm-grid-wrap-t" style={{ gridTemplateColumns: `40px repeat(7, 1fr)` }}>
              {/* header row */}
              <div className="wm-hour-label" />
              {Array.from({ length: 7 }).map((_, di) => (
                <span key={di} className="wm-day-label wm-day-label--ghost">D{di + 1}</span>
              ))}
              {/* body */}
              {HOURS.map(h => (
                <React.Fragment key={h}>
                  <span className="wm-hour-label" style={{ textAlign: "right", paddingRight: 6 }}>{String(h).padStart(2, "0")}</span>
                  {Array.from({ length: 7 }).map((_, di) => (
                    <div key={di} className="wm-cell wm-cell--empty" />
                  ))}
                </React.Fragment>
              ))}
            </div>
            <p className="wm-empty-text" style={{ marginTop: 16 }}>
              Expedition begins 2026-03-17 — climate data will populate here.
            </p>
          </div>
        ) : (
          <div
            className="wm-grid-wrap-t"
            style={{ gridTemplateColumns: `40px repeat(${dates.length}, 1fr)` }}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Header row: empty corner + day labels */}
            <div />
            {dates.map((date, di) => {
              const isToday = date === new Date().toISOString().slice(0, 10);
              return (
                <span
                  key={date}
                  className={`wm-day-label${isToday ? " wm-day-label--today" : ""}`}
                  style={{ textAlign: "center", paddingRight: 0 }}
                >
                  D{di + 1}
                </span>
              );
            })}

            {/* One row per hour slot */}
            {HOURS.map(h => (
              <React.Fragment key={h}>
                <span className="wm-hour-label" style={{ textAlign: "right", paddingRight: 6, alignSelf: "center" }}>
                  {String(h).padStart(2, "0")}
                </span>
                {dates.map(date => {
                  const row = grid.get(date)?.get(h);
                  const color = row ? cellColor(row, mode) : null;
                  return (
                    <div
                      key={date}
                      className={`wm-cell${color ? "" : " wm-cell--empty"}`}
                      style={color ? { backgroundColor: color } : undefined}
                      onMouseEnter={e => {
                        if (row) {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setHovered({ row, x: rect.left + rect.width / 2, y: rect.top });
                        }
                      }}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="wm-legend">
        <span className="wm-legend-label">{legend.fromLabel}</span>
        <div
          className="wm-legend-bar"
          style={{ background: `linear-gradient(to right, ${legend.from}, ${legend.to})` }}
        />
        <span className="wm-legend-label">{legend.toLabel}</span>
        <span className="wm-legend-title">{legend.label}</span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          className="wm-tooltip"
          style={{
            left: hovered.x,
            top: hovered.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="wm-tooltip-date">
            {new Date(hovered.row.recorded_at).toUTCString().slice(0, 22)} UTC
          </div>
          <div className="wm-tooltip-row">
            Temp <strong>{hovered.row.temperature?.toFixed(1) ?? "—"}°</strong>
            {hovered.row.apparent_temperature !== null && (
              <> / {hovered.row.apparent_temperature.toFixed(1)}° feels</>
            )}
          </div>
          <div className="wm-tooltip-row">
            Wind{" "}
            <strong>
              {windDir(hovered.row.wind_direction)}{" "}
              {hovered.row.wind_speed?.toFixed(0) ?? "—"} km/h
            </strong>
            {hovered.row.wind_gusts !== null && (
              <> gusts {hovered.row.wind_gusts.toFixed(0)}</>
            )}
          </div>
          <div className="wm-tooltip-row">
            Snow <strong>{hovered.row.snowfall?.toFixed(1) ?? "—"} mm</strong>
            {hovered.row.condition && (
              <> · {hovered.row.condition}</>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
