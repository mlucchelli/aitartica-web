"use client";

import { useEffect, useState } from "react";

export type DrakeWeather = {
  wind_speed: number | null;
  wind_gusts: number | null;
  wind_direction: number | null;
  temperature: number | null;
  condition: string | null;
  recorded_at: string;
};

export type DrakePhoto = {
  file_url: string;
  agent_quote: string | null;
  vision_summary: string | null;
  recorded_at: string | null;
};

export type OceanObservation = {
  analyzed_at: string;
  wave_height_m: number | null;
  sea_state: string | null;
  beaufort: number | null;
  swell_direction: string | null;
  drake_assessment: string | null;
  confidence: string | null;
};

interface Props {
  weather: DrakeWeather | null;
  crossingPct: number;
  currentLat: number | null;
  oceanData?: OceanObservation[];
}

function windDir(deg: number | null): string {
  if (deg === null) return "";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function getDrakeState(windSpeed: number | null): { label: string; sublabel: string; level: "lake" | "moderate" | "shake" } {
  if (windSpeed === null) return { label: "UNKNOWN", sublabel: "Awaiting data", level: "moderate" };
  if (windSpeed < 20)  return { label: "DRAKE LAKE",     sublabel: "Calm seas · Favorable crossing",      level: "lake"     };
  if (windSpeed < 40)  return { label: "MODERATE SEAS",  sublabel: "Swells building · Steady conditions",  level: "moderate" };
  if (windSpeed < 60)  return { label: "DRAKE SHAKE",    sublabel: "Heavy seas · All hands alert",         level: "shake"    };
  return               { label: "STORM CONDITIONS", sublabel: "Severe weather · Survival mode",     level: "shake"    };
}


type WaveLevel = "lake" | "moderate" | "shake";

function obsToLevel(obs: OceanObservation): WaveLevel {
  const bf = obs.beaufort ?? 0;
  const ss = obs.sea_state ?? "";
  if (bf >= 8 || ["very rough", "high", "storm"].includes(ss)) return "shake";
  if (bf >= 5 || ["rough", "moderate"].includes(ss)) return "moderate";
  return "lake";
}

function toARLabel(utc: string) {
  const d = new Date(new Date(utc).getTime() - 3 * 60 * 60 * 1000);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} ART`;
}

export default function DrakePassage({ weather, crossingPct, currentLat, oceanData = [] }: Props) {
  const [pulse, setPulse] = useState(false);
  const [selectedObs, setSelectedObs] = useState<OceanObservation | null>(null);

  const computed = getDrakeState(weather?.wind_speed ?? null);
  const activeLevel: WaveLevel = selectedObs ? obsToLevel(selectedObs) : computed.level;
  const state = { ...computed, level: activeLevel };

  useEffect(() => {
    if (state.level !== "shake") { setPulse(false); return; }
    const id = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(id);
  }, [state.level]);

  function goLive() {
    setSelectedObs(null);
  }

  return (
    <section className="drake-section">
      <div className="drake-inner">

        {/* Header */}
        <div className="drake-header">
          <div>
            <div className="section-label">Open Ocean Crossing</div>
            <h2 className="section-title drake-title">Drake Passage</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {selectedObs && (
              <button className="drake-preview-btn drake-preview-btn--live" onClick={goLive}>
                CURRENT
              </button>
            )}
            <div className={`drake-state drake-state--${state.level}${state.level === "shake" && pulse ? " drake-state--pulse" : ""}`}>
              <span className="drake-state-dot" />
              {selectedObs ? `AT ${toARLabel(selectedObs.analyzed_at)}` : state.label}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="drake-crossing">
          <div className="drake-crossing-labels">
            <span>SOUTH SHETLAND IS.</span>
            <span>USHUAIA</span>
          </div>
          <div className="drake-bar-track">
            <div className="drake-bar-fill" style={{ width: `${crossingPct}%` }} />
            <div className="drake-bar-ship" style={{ left: `${crossingPct}%` }}>⬡</div>
          </div>
          <div className="drake-crossing-pct">
            {crossingPct}% crossed · {currentLat ? `${Math.abs(currentLat).toFixed(2)}°S` : "—"}
          </div>
        </div>

        {/* Stats + Waves side by side */}
        <div className="drake-body">
          <div className="drake-stats">
            <div className="drake-stat-sublabel">{state.sublabel}</div>
            <div className="drake-stat-grid">
              <div className="drake-stat">
                <div className="drake-stat-value">
                  {weather?.wind_speed != null ? `${Math.round(weather.wind_speed)}` : "—"}
                  <span className="drake-stat-unit">km/h</span>
                </div>
                <div className="drake-stat-label">WIND {windDir(weather?.wind_direction ?? null)}</div>
              </div>
              <div className="drake-stat">
                <div className="drake-stat-value">
                  {weather?.wind_gusts != null ? `${Math.round(weather.wind_gusts)}` : "—"}
                  <span className="drake-stat-unit">km/h</span>
                </div>
                <div className="drake-stat-label">GUSTS</div>
              </div>
              <div className="drake-stat">
                <div className="drake-stat-value">
                  {weather?.temperature != null ? `${weather.temperature.toFixed(1)}` : "—"}
                  <span className="drake-stat-unit">°C</span>
                </div>
                <div className="drake-stat-label">TEMP</div>
              </div>
              <div className="drake-stat">
                <div className="drake-stat-value drake-stat-value--condition">
                  {weather?.condition ?? "—"}
                </div>
                <div className="drake-stat-label">CONDITIONS</div>
              </div>
            </div>
          </div>

          {/* Ocean swell animation */}
          <div className="drake-waves">
            {selectedObs && (
              <div className="drake-waves-obs-label">
                <span>{toARLabel(selectedObs.analyzed_at)}</span>
                {selectedObs.wave_height_m != null && <span>{selectedObs.wave_height_m}m</span>}
                {selectedObs.sea_state && <span>{selectedObs.sea_state}</span>}
                {selectedObs.beaufort != null && <span>BF {selectedObs.beaufort}</span>}
                {selectedObs.swell_direction && <span>swell {selectedObs.swell_direction}</span>}
              </div>
            )}
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" className={`drake-waves-svg drake-waves-svg--${state.level}`} aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <path
                  key={i}
                  className={`drake-wave drake-wave--${i}`}
                  fill="none"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Wave height histogram */}
        <WaveHistogram data={oceanData} selected={selectedObs} onSelect={setSelectedObs} />

      </div>
    </section>
  );
}

function toARDate(utc: string) {
  return new Date(new Date(utc).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function WaveHistogram({ data, selected, onSelect }: {
  data: OceanObservation[];
  selected: OceanObservation | null;
  onSelect: (obs: OceanObservation | null) => void;
}) {
  const readings = data.filter(d => d.wave_height_m != null);
  const maxH = readings.length > 0 ? Math.max(...readings.map(d => d.wave_height_m!)) : 4;
  const scale = Math.ceil(maxH / 2) * 2;

  const days = readings.length > 0
    ? [...new Set(readings.map(d => toARDate(d.analyzed_at)))]
    : [];

  return (
    <div className="drake-histogram">
      <div className="drake-histogram-header">
        <span className="drake-histogram-title">WAVE HEIGHT · m</span>
        <span className="drake-histogram-source">OPEN-METEO MARINE · CLICK BAR TO REPLAY</span>
      </div>

      {readings.length === 0 ? (
        <div className="drake-histogram-skeleton">
          {Array.from({ length: 48 }, (_, i) => (
            <div key={i} className="drake-histogram-skel-bar" style={{ height: `${20 + Math.abs(Math.sin(i * 0.7)) * 60}%` }} />
          ))}
        </div>
      ) : (
        <div className="drake-histogram-chart">
          {[scale, scale * 0.75, scale * 0.5, scale * 0.25].map(v => (
            <div key={v} className="drake-histogram-gridline" style={{ bottom: `${(v / scale) * 100}%` }}>
              <span className="drake-histogram-gridlabel">{v.toFixed(1)}</span>
            </div>
          ))}

          <div className="drake-histogram-bars">
            {readings.map((d, i) => {
              const h = d.wave_height_m!;
              const pct = (h / scale) * 100;
              const isStorm = (d.beaufort ?? 0) >= 8 || h >= 4;
              const isSelected = selected?.analyzed_at === d.analyzed_at;
              const prev = i > 0 ? toARDate(readings[i - 1].analyzed_at) : null;
              const thisDay = toARDate(d.analyzed_at);
              const isDayBoundary = prev !== null && prev !== thisDay;

              return (
                <div
                  key={i}
                  className={`drake-histogram-bar-wrap${isSelected ? " drake-histogram-bar-wrap--selected" : ""}`}
                  onClick={() => onSelect(isSelected ? null : d)}
                >
                  {isDayBoundary && <div className="drake-histogram-day-sep" />}
                  <div
                    className={`drake-histogram-bar${isStorm ? " drake-histogram-bar--storm" : ""}${isSelected ? " drake-histogram-bar--selected" : ""}`}
                    style={{ height: `${pct}%` }}
                  />
                  {isDayBoundary && (
                    <div className="drake-histogram-day-label">{thisDay.slice(5)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {days.length > 0 && (
        <div className="drake-histogram-days">
          {days.map(d => (
            <span key={d} className="drake-histogram-day">{d.slice(5)}</span>
          ))}
        </div>
      )}
    </div>
  );
}
