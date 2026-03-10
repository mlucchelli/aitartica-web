"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LatLon = [number, number];

interface Props {
  track: LatLon[];
  expeditionDay: number | null;
}

// Fallback track shown when no GPS data is available yet
const FALLBACK_TRACK: LatLon[] = [
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

function getBounds(track: LatLon[]): { center: LatLon; zoom: number } {
  if (track.length === 0) return { center: [-63.3, -57.5], zoom: 6 };
  const lats = track.map(([lat]) => lat);
  const lons = track.map(([, lon]) => lon);
  const center: LatLon = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lons) + Math.max(...lons)) / 2,
  ];
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lonSpan = Math.max(...lons) - Math.min(...lons);
  const span = Math.max(latSpan, lonSpan);
  const zoom = span < 1 ? 9 : span < 3 ? 7 : span < 6 ? 6 : 5;
  return { center, zoom };
}

export default function ExpeditionMap({ track, expeditionDay }: Props) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const activeTrack = track.length >= 2 ? track : FALLBACK_TRACK;
  const { center, zoom } = useMemo(() => getBounds(activeTrack), [activeTrack]);
  const start = activeTrack[0];
  const current = activeTrack[activeTrack.length - 1];
  const isLive = track.length >= 2;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: "100%", height: "100%", background: "#c8d8e8" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />

      <Polyline positions={activeTrack} pathOptions={{ color: "#0099b3", weight: 2.5, opacity: isLive ? 0.85 : 0.4 }} />
      <Polyline positions={activeTrack} pathOptions={{ color: "#0099b3", weight: 8, opacity: isLive ? 0.12 : 0.06 }} />

      {start && (
        <CircleMarker
          center={start}
          radius={4}
          pathOptions={{ color: "#0099b3", fillColor: "#0099b3", fillOpacity: 0.4, weight: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -6]} className="map-tooltip">
            Start
          </Tooltip>
        </CircleMarker>
      )}

      {current && current !== start && (
        <CircleMarker
          center={current}
          radius={7}
          pathOptions={{ color: "#0099b3", fillColor: "#0099b3", fillOpacity: isLive ? 1 : 0.3, weight: 2 }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="map-tooltip">
            {isLive
              ? `${expeditionDay != null ? `Day ${expeditionDay}` : "Current"} · ${Math.abs(current[0]).toFixed(2)}°S`
              : "Awaiting signal..."}
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
