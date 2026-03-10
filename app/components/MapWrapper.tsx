"use client";

import dynamic from "next/dynamic";

const ExpeditionMap = dynamic(() => import("./ExpeditionMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%", height: "100%",
      background: "#e8eef5",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", fontSize: "10px",
      letterSpacing: "0.2em", color: "#9aacbf"
    }}>
      LOADING MAP...
    </div>
  ),
});

export default function MapWrapper() {
  return <ExpeditionMap />;
}
