"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LatLon = [number, number];

interface Props {
  track: LatLon[];
  expeditionDay: number | null;
}


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

  const { center, zoom } = useMemo(() => getBounds(track), [track]);
  const start = track[0];
  const current = track[track.length - 1];
  const isLive = track.length > 0;

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

      {track.length >= 2 && <Polyline positions={track} pathOptions={{ color: "#0099b3", weight: 2.5, opacity: 0.85 }} />}
      {track.length >= 2 && <Polyline positions={track} pathOptions={{ color: "#0099b3", weight: 8, opacity: 0.12 }} />}

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

      {current && (
        <CircleMarker
          center={current}
          radius={7}
          pathOptions={{ color: "#0099b3", fillColor: "#0099b3", fillOpacity: 1, weight: 2 }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="map-tooltip">
            {`${expeditionDay != null ? `Day ${expeditionDay}` : "Current"} · ${Math.abs(current[0]).toFixed(2)}°S`}
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
