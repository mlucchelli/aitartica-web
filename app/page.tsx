export const revalidate = 600; // fallback: revalidate every hour

import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { fmtDistance, fmtTemp, fmtWildlife } from "@/lib/format";
import MapWrapper from "./components/MapWrapper";
import TokenCounter from "./components/TokenCounter";
import PhotoGallery from "./components/PhotoGallery";
import MissionLog from "./components/MissionLog";
import SiteNav from "./components/SiteNav";
import WeatherMatrix from "./components/WeatherMatrix";

type Stat = {
  label: string;
  unit: string;
  live?: boolean;
  value?: string;
  node?: ReactNode;
};


export default async function Home() {
  // "Today" anchored to Argentina time (UTC-3)
  const todayAR = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = todayAR;
  // UTC window for Argentina's calendar day: midnight ART = 03:00 UTC
  const EXPEDITION_START = "2026-03-17";
  const expeditionDayCalc = Math.floor((new Date(today).getTime() - new Date(EXPEDITION_START).getTime()) / 86400000);

  const [
    { data: progress },
    { data: gpsPoints },
    { data: todayReflection },
    { data: todayMessages },
    { data: photos },
    { data: latestAnalysis },
    { data: weatherData },
  ] = await Promise.all([
    supabase
      .from("progress")
      .select("expedition_day, distance_km_total, wildlife_spotted_total, temperature_min_all_time, tokens_used_total, photos_captured_total, published_at")
      .eq("id", 1)
      .single(),
    supabase
      .from("gps_points")
      .select("latitude, longitude")
      .order("recorded_at", { ascending: true }),
    supabase
      .from("reflections")
      .select("content, date")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("content, published_at")
      .gte("published_at", new Date(Date.now() - 3 * 60 * 60 * 1000 - 11 * 24 * 60 * 60 * 1000).toISOString())
      .order("published_at", { ascending: false }),
    supabase
      .from("photos")
      .select("id, file_url, vision_summary, agent_quote, recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(100),
    supabase
      .from("route_analyses")
      .select("bearing_compass, bearing_deg")
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("weather_snapshots")
      .select("recorded_at, temperature, apparent_temperature, wind_speed, wind_gusts, wind_direction, precipitation, snowfall, condition")
      .order("recorded_at", { ascending: true }),
  ]);

  const rawTokens = progress?.tokens_used_total ?? 0;

  const livePhotos = photos ?? [];

  const track = (gpsPoints ?? []).map(
    (p): [number, number] => [p.latitude, p.longitude]
  );
  const lastPoint = gpsPoints?.at(-1) ?? null;

  function fmtCoord(val: number, posDir: string, negDir: string) {
    return `${Math.abs(val).toFixed(2)}° ${val >= 0 ? posDir : negDir}`;
  }

  const expeditionDayLabel = String(expeditionDayCalc);

  const stats: Stat[] = [
    { label: "Distance",    value: fmtDistance(progress?.distance_km_total ?? null),     unit: "KM",      live: true },
    { label: "Wildlife",    value: fmtWildlife(progress?.wildlife_spotted_total ?? null), unit: "Sightings" },
    { label: "Min Temp",    value: fmtTemp(progress?.temperature_min_all_time ?? null),  unit: "°C" },
    { label: "Expedition",  value: expeditionDayCalc > 0 ? expeditionDayLabel : "—",     unit: "Active" },
    { label: "Processed",   value: fmtWildlife(progress?.photos_captured_total ?? null), unit: "Photos" },
    { label: "Tokens", node: rawTokens > 0 ? <TokenCounter target={rawTokens} /> : "—",  unit: "Used", live: true },
  ];

  return (
    <>
      {/* NAV */}
      <SiteNav />

      {/* HERO */}
      <section className="hero" id="expedition">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-icon">∿</div>
            AUTONOMOUS EXPEDITION
          </div>
          <h1 className="hero-title">AITARTICA</h1>
          <p className="hero-subtitle">Infering from the ice &nbsp;|&nbsp; AI Exploration Agent</p>
        </div>
        <div className="hero-scroll">
          <div className="hero-scroll-line" />
          SCROLL
        </div>
      </section>

      {/* STATS BAR */}
      <div className="stats-bar">
        {stats.map((s) => (
          <div key={s.label} className="stats-item">
            <div className={`stats-label${s.live ? " stats-label-live" : ""}`}>{s.label}</div>
            <div className="stats-value">
              {s.node ?? s.value}
              <span className="stats-value-unit">{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MAP + MISSION LOG */}
      <section className="map-log-section" id="live">
        <div className="map-panel">
          <div className="map-panel-header">
            <div>
              <div className="section-label">Live Position</div>
              <div className="section-title map-panel-header__title">Trajectory Map</div>
            </div>
            {lastPoint && (
              <div className="map-coords">
                <div>LAT: <span>{fmtCoord(lastPoint.latitude, "N", "S")}</span></div>
                <div>LON: <span>{fmtCoord(lastPoint.longitude, "E", "W")}</span></div>
              </div>
            )}
          </div>
          <div className="map-container-tall">
            <MapWrapper track={track} expeditionDay={progress?.expedition_day ?? expeditionDayCalc} />
            {latestAnalysis && (
              <div className="map-overlay">
                {`HEADING: ${Math.round(latestAnalysis.bearing_deg ?? 0)}° ${latestAnalysis.bearing_compass ?? ""}`}
              </div>
            )}
          </div>
        </div>

        <MissionLog
          messages={todayMessages ?? []}
          reflection={todayReflection ?? null}
          today={today}
        />
      </section>

      {/* PHOTO MOSAIC */}
      <section className="mosaic-section" id="gallery">
        <div className="mosaic-header">
          <div>
            <div className="section-label">Photo Gallery</div>
            <h2 className="section-title mosaic-header__title">The Polar Prism</h2>
          </div>
        </div>
        <PhotoGallery photos={livePhotos} today={today} />
      </section>

      {/* WEATHER MATRIX */}
      <section id="weather">
        <WeatherMatrix data={weatherData ?? []} />
      </section>

      {/* DAILY REFLECTION */}
      {todayReflection && (
        <section className="reflection-section">
          <div className="reflection-day">
            AGENT REFLECTION {progress?.expedition_day != null ? `// DAY ${progress.expedition_day}` : ""}
          </div>
          <div className="reflection-quote-mark">"</div>
          <p className="reflection-quote">{todayReflection.content}</p>
          <div className="reflection-meta">
            {lastPoint && (
              <div>Field Position <span>{fmtCoord(lastPoint.latitude, "N", "S")}</span></div>
            )}
            <div>Agent Model <span>Qwen 3.5 9B</span></div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-text">© 2026 AITARTICA EXPEDITION — AUTONOMOUS EXPLORATION</div>
        <div className="footer-text">
          <a href="https://x.com/aitartica" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ color: "var(--cyan)" }}>𝕏 @aitartica</a>
        </div>
        <div className="footer-text">
          POWERED BY <a href="https://www.aokitech.com.ar" target="_blank" rel="noopener noreferrer" className="footer-link">AOKI</a>
          {" · "}<a href="https://www.linkedin.com/in/nosoul" target="_blank" rel="noopener noreferrer" className="footer-link">nosoul</a>
        </div>
        <div className="footer-text">
          {progress?.published_at
            ? `LAST SYNC: ${new Date(progress.published_at).toUTCString().slice(17, 25)} UTC`
            : "LAST SYNC: —"}
        </div>
        <a href="#expedition" className="footer-up">↑</a>
      </footer>
    </>
  );
}
