"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Mock GPS track — Antarctic Peninsula (South Shetlands → Seymour Island)
const TRACK: [number, number][] = [
  [-62.05, -58.40],
  [-62.42, -58.15],
  [-62.80, -57.85],
  [-63.18, -57.40],
  [-63.52, -56.88],
  [-63.76, -57.10],
  [-63.90, -57.32],
  [-64.12, -57.65],
  [-64.28, -56.72],
  [-64.45, -57.10],
];

const START = TRACK[0];
const CURRENT = TRACK[TRACK.length - 1];

export default function ExpeditionMap() {
  useEffect(() => {
    // Fix Leaflet default icon paths in Next.js
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <MapContainer
      center={[-63.3, -57.5]}
      zoom={7}
      style={{ width: "100%", height: "100%", background: "#c8d8e8" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />

      {/* Track line */}
      <Polyline
        positions={TRACK}
        pathOptions={{ color: "#0099b3", weight: 2.5, opacity: 0.85 }}
      />
      {/* Glow duplicate */}
      <Polyline
        positions={TRACK}
        pathOptions={{ color: "#0099b3", weight: 8, opacity: 0.12 }}
      />

      {/* Start point */}
      <CircleMarker
        center={START}
        radius={4}
        pathOptions={{ color: "#0099b3", fillColor: "#0099b3", fillOpacity: 0.4, weight: 1 }}
      >
        <Tooltip permanent direction="top" offset={[0, -6]} className="map-tooltip">
          Start
        </Tooltip>
      </CircleMarker>

      {/* Current position */}
      <CircleMarker
        center={CURRENT}
        radius={7}
        pathOptions={{ color: "#0099b3", fillColor: "#0099b3", fillOpacity: 1, weight: 2 }}
      >
        <Tooltip permanent direction="top" offset={[0, -10]} className="map-tooltip">
          Day 14 · 64.45°S
        </Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
