"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LatLon = [number, number];

interface Props {
  track: LatLon[];
  expeditionDay: number | null;
  currentPos?: LatLon | null;
}

const ISLAND_LABELS: { name: string; pos: LatLon }[] = [
  // South Shetland Islands
  { name: "King George I.",  pos: [-62.05, -58.45] },
  { name: "Livingston I.",   pos: [-62.60, -60.70] },
  { name: "Deception I.",    pos: [-62.93, -60.57] },
  { name: "Elephant I.",     pos: [-61.10, -54.87] },
  { name: "Nelson I.",       pos: [-62.30, -59.05] },
  { name: "Greenwich I.",    pos: [-62.48, -59.77] },
  { name: "Snow I.",         pos: [-62.75, -61.30] },
  // Near the peninsula tip
  { name: "Joinville I.",    pos: [-63.25, -55.50] },
  { name: "Dundee I.",       pos: [-63.47, -55.90] },
  { name: "Vega I.",         pos: [-63.87, -57.32] },
  { name: "James Ross I.",   pos: [-64.17, -57.90] },
  { name: "Seymour I.",      pos: [-64.28, -56.72] },
  { name: "Snow Hill I.",    pos: [-64.45, -57.20] },
  // Along the peninsula
  { name: "Trinity I.",      pos: [-63.87, -60.80] },
  { name: "Brabant I.",      pos: [-64.25, -62.30] },
  { name: "Wiencke I.",      pos: [-64.82, -63.50] },
  { name: "Anvers I.",       pos: [-64.55, -63.60] },
  { name: "Adelaide I.",     pos: [-67.50, -68.30] },
];

const RESEARCH_BASES: { name: string; country: string; flag: string; pos: LatLon }[] = [
  // Argentina
  { name: "Carlini",    country: "Argentina", flag: "🇦🇷", pos: [-62.2375, -58.6667] },
  { name: "Esperanza",  country: "Argentina", flag: "🇦🇷", pos: [-63.3971, -56.9964] },
  { name: "Marambio",   country: "Argentina", flag: "🇦🇷", pos: [-64.2369, -56.6275] },
  { name: "San Martín", country: "Argentina", flag: "🇦🇷", pos: [-68.1278, -67.0981] },
  { name: "Belgrano II",country: "Argentina", flag: "🇦🇷", pos: [-77.8742, -34.6260] },
  // Chile
  { name: "Frei",       country: "Chile",     flag: "🇨🇱", pos: [-62.2000, -58.9672] },
  { name: "O'Higgins",  country: "Chile",     flag: "🇨🇱", pos: [-63.3208, -57.9003] },
  { name: "Prat",       country: "Chile",     flag: "🇨🇱", pos: [-62.4832, -59.6627] },
  // Norway
  { name: "Troll",      country: "Norway",    flag: "🇳🇴", pos: [-72.0117,   2.5353] },
  { name: "Tor",        country: "Norway",    flag: "🇳🇴", pos: [-71.8870,   5.1584] },
  // UK
  { name: "Rothera",    country: "UK",        flag: "🇬🇧", pos: [-67.5681, -68.1274] },
  { name: "Halley",     country: "UK",        flag: "🇬🇧", pos: [-75.5740, -25.5170] },
  { name: "Signy",      country: "UK",        flag: "🇬🇧", pos: [-60.7050, -45.6040] },
  // Spain
  { name: "Juan Carlos I",      country: "Spain", flag: "🇪🇸", pos: [-62.6667, -60.3833] },
  { name: "Gabriel de Castilla",country: "Spain", flag: "🇪🇸", pos: [-62.9806, -60.6731] },
  // Germany
  { name: "Neumayer III", country: "Germany", flag: "🇩🇪", pos: [-70.6830,  -8.2740] },
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

export default function ExpeditionMap({ track, expeditionDay, currentPos }: Props) {
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
  const current = currentPos ?? track[track.length - 1];
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

      {ISLAND_LABELS.map((island) => (
        <CircleMarker
          key={island.name}
          center={island.pos}
          radius={1.5}
          pathOptions={{ color: "#94a3b8", fillColor: "#94a3b8", fillOpacity: 0.6, weight: 1 }}
        >
          <Tooltip permanent direction="right" offset={[5, 0]} className="map-label">
            {island.name}
          </Tooltip>
        </CircleMarker>
      ))}

      {RESEARCH_BASES.map((base) => (
        <CircleMarker
          key={base.name}
          center={base.pos}
          radius={3}
          pathOptions={{ color: "#7a8a9a", fillColor: "#7a8a9a", fillOpacity: 0.75, weight: 1 }}
        >
          <Tooltip direction="top" offset={[0, -5]} className="map-tooltip map-tooltip--base">
            {base.flag} {base.name} · {base.country}
          </Tooltip>
        </CircleMarker>
      ))}

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
