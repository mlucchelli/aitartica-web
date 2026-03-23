"use client";

import dynamic from "next/dynamic";

type LatLon = [number, number];

interface Props {
  track: LatLon[];
  expeditionDay: number | null;
  currentPos?: LatLon | null;
}

const ExpeditionMap = dynamic(() => import("./ExpeditionMap"), {
  ssr: false,
  loading: () => <div className="map-loading">LOADING MAP...</div>,
});

export default function MapWrapper({ track, expeditionDay, currentPos }: Props) {
  return <ExpeditionMap track={track} expeditionDay={expeditionDay} currentPos={currentPos} />;
}
