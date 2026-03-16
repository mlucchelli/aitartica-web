"use client";

import { useState } from "react";

interface Action {
  name: string;
  desc: string;
  params?: string;
}

interface Category {
  label: string;
  icon: string;
  tools: Action[];
}

const CATEGORIES: Category[] = [
  {
    label: "GPS & Navigation",
    icon: "◎",
    tools: [
      { name: "get_latest_locations", desc: "Fetch the most recent GPS fixes from the DB", params: "limit" },
      { name: "get_locations_by_date", desc: "All GPS fixes on a specific date", params: "date" },
      { name: "add_location", desc: "Manually insert a GPS coordinate (fallback when iPhone GPS fails)", params: "latitude, longitude, recorded_at?" },
      { name: "get_distance", desc: "Total distance traveled today or on a given date (Haversine)", params: "date?" },
      { name: "analyze_route", desc: "Full navigation analysis: bearing, speed, wind angle, nearest landing sites with ETA. Saves to DB.", params: "hours?" },
      { name: "get_route_analysis", desc: "Read the last saved route analysis", params: "date?" },
    ],
  },
  {
    label: "Weather",
    icon: "∿",
    tools: [
      { name: "get_weather", desc: "Fetch current weather from Open-Meteo (ECMWF IFS) and store snapshot", params: "latitude?, longitude?" },
      { name: "publish_weather_snapshot", desc: "Publish the most recent weather snapshot to the expedition website" },
    ],
  },
  {
    label: "Photos",
    icon: "▣",
    tools: [
      { name: "scan_photo_inbox", desc: "Scan the inbox folder and run the full pipeline on all new photos (preprocess → vision+score → upload queue)" },
      { name: "upload_image", desc: "Upload a scored photo to the expedition website", params: "photo_id" },
      { name: "get_photos", desc: "Fetch photo records with optional filters", params: "vision_status?, date?, limit?" },
    ],
  },
  {
    label: "Knowledge Base",
    icon: "≡",
    tools: [
      { name: "search_knowledge", desc: "Semantic search over expedition documents (itinerary, species, ship, locations, science notes)", params: "query" },
      { name: "add_knowledge", desc: "Add a free-text observation to the knowledge base (species, behavior, site notes, crew info)", params: "content, source?" },
      { name: "index_knowledge", desc: "Re-index all documents in the knowledge inbox folder" },
      { name: "clear_knowledge", desc: "Wipe the entire knowledge base" },
    ],
  },
  {
    label: "Publishing",
    icon: "↑",
    tools: [
      { name: "publish_daily_progress", desc: "Aggregate all-expedition totals (distance, photos, wildlife, temperature extremes, token usage) and publish" },
      { name: "publish_reflection", desc: "Create and publish the daily reflection", params: "date?" },
      { name: "publish_route_analysis", desc: "Publish the latest route analysis (bearing, speed, wind, nearest sites)", params: "date?" },
      { name: "publish_route_snapshot", desc: "Build a GeoJSON track of all GPS coordinates and publish" },
      { name: "comment", desc: "Post a short live dispatch (1–3 sentences) to the expedition website", params: "content" },
    ],
  },
  {
    label: "Logs & Diagnostics",
    icon: "⌗",
    tools: [
      { name: "get_logs", desc: "Activity log for a time range (all tool calls)", params: "from?, to?" },
      { name: "get_token_usage", desc: "Total token usage broken down by call type (chat, vision, scoring, embedding)" },
      { name: "get_reflections", desc: "Read daily reflections", params: "date?, limit?" },
    ],
  },
  {
    label: "Chain Control",
    icon: "✦",
    tools: [
      { name: "send_message", desc: "Display text to the user — progress updates, intermediate results, or the final reply", params: "content" },
      { name: "create_task", desc: "Queue a background task for deferred execution by the scheduler", params: "type, payload" },
      { name: "finish", desc: "Terminate the chain. Required as the last action in every response." },
    ],
  },
];

export default function AgentTools() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 680, marginTop: 40 }}>
      {CATEGORIES.map((cat) => {
        const isOpen = open === cat.label;
        return (
          <div key={cat.label} style={{ borderBottom: "1px solid var(--border)" }}>
            <button
              onClick={() => setOpen(isOpen ? null : cat.label)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: isOpen ? "var(--cyan)" : "var(--text-muted)",
                minWidth: 16,
                transition: "color 0.15s",
              }}>
                {cat.icon}
              </span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.12em",
                color: isOpen ? "var(--text)" : "var(--text-dim)",
                textTransform: "uppercase",
                flex: 1,
                transition: "color 0.15s",
              }}>
                {cat.label}
              </span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
              }}>
                {cat.tools.length} tools
              </span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: "var(--text-muted)",
                marginLeft: 8,
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                display: "inline-block",
              }}>
                ∨
              </span>
            </button>

            {isOpen && (
              <div style={{ paddingBottom: 16 }}>
                {cat.tools.map((action) => (
                  <div
                    key={action.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "220px 1fr",
                      gap: 16,
                      padding: "8px 0 8px 28px",
                      borderTop: "1px solid var(--border)",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 10,
                        color: "var(--cyan)",
                        letterSpacing: "0.04em",
                        marginBottom: action.params ? 4 : 0,
                      }}>
                        {action.name}
                      </div>
                      {action.params && (
                        <div style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 8,
                          color: "var(--text-muted)",
                          letterSpacing: "0.06em",
                        }}>
                          {action.params}
                        </div>
                      )}
                    </div>
                    <p style={{
                      fontSize: 12,
                      lineHeight: 1.65,
                      color: "var(--text-dim)",
                      margin: 0,
                    }}>
                      {action.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
