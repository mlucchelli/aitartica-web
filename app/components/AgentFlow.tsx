"use client";

import { useState } from "react";

type NodeId = "field" | "agent" | "uplink" | "live";

interface FlowNode {
  id: NodeId;
  icon: string;
  label: string;
  sub: string;
  detail: string;
}

const NODES: FlowNode[] = [
  {
    id: "field",
    icon: "◎",
    label: "FIELD",
    sub: "MV Ortelius",
    detail:
      "The agent operates aboard the MV Ortelius — a polar expedition vessel navigating the Drake Passage and Antarctic Peninsula. Researchers, naturalists, and expedition crew share the ship. GPS fixes arrive hourly from an iPhone on deck; photos are dropped into an inbox folder and picked up automatically.",
  },
  {
    id: "agent",
    icon: "∿",
    label: "AGENT",
    sub: "Aitartica · M3 Pro",
    detail:
      "Aitartica runs locally on a MacBook Pro M3 Pro (18 GB unified memory) — no cloud dependency. Qwen 2.5 VL 3B handles photo vision: it scores expedition significance, detects species with taxonomic precision, and generates field observations. A larger Qwen reasoning model handles route analysis, daily reflections, and dispatches.",
  },
  {
    id: "uplink",
    icon: "↑",
    label: "UPLINK",
    sub: "Starlink",
    detail:
      "Transmissions happen over Starlink during scheduled sync windows. Failed pushes are queued locally and retried up to 100 times — the agent never loses data to a connectivity gap. Data travels as structured JSON payloads over HTTPS.",
  },
  {
    id: "live",
    icon: "✦",
    label: "LIVE",
    sub: "aitartica.com",
    detail:
      "Everything on this site arrived from Antarctica. GPS tracks, weather snapshots, photo analyses, daily reflections, and dispatches — all generated and published by the agent without human intervention, in real time.",
  },
];

const W = 700;
const CY = 56;
const R = 30;
const NODE_XS = [60, 233, 467, 640];

export default function AgentFlow() {
  const [active, setActive] = useState<NodeId | null>(null);
  const activeNode = NODES.find((n) => n.id === active);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} 130`}
        style={{ width: "100%", maxWidth: 700, display: "block", overflow: "visible" }}
      >
        {/* connection lines + animated dots */}
        {NODES.slice(0, -1).map((node, i) => {
          const x1 = NODE_XS[i] + R;
          const x2 = NODE_XS[i + 1] - R;
          const pathD = `M${x1},${CY} L${x2},${CY}`;
          return (
            <g key={`conn-${node.id}`}>
              <line
                x1={x1} y1={CY} x2={x2} y2={CY}
                stroke="var(--border)" strokeWidth={1}
              />
              {[0, 1].map((d) => (
                <circle key={d} r={2.5} fill="var(--cyan)" opacity={0.7}>
                  <animateMotion
                    dur={`${2.5 + i * 0.4}s`}
                    begin={`${d * 1.2}s`}
                    repeatCount="indefinite"
                    path={pathD}
                  />
                </circle>
              ))}
            </g>
          );
        })}

        {/* nodes */}
        {NODES.map((node, i) => {
          const cx = NODE_XS[i];
          const isActive = active === node.id;
          return (
            <g
              key={node.id}
              onClick={() => setActive(isActive ? null : node.id)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={cx} cy={CY} r={R}
                fill={isActive ? "var(--cyan)" : "var(--bg-panel)"}
                stroke={isActive ? "var(--cyan)" : "var(--border)"}
                strokeWidth={1}
                style={{ transition: "fill 0.2s, stroke 0.2s" }}
              />
              <text
                x={cx} y={CY - 6}
                textAnchor="middle"
                fontSize={13}
                fill={isActive ? "var(--bg)" : "var(--cyan)"}
                style={{ transition: "fill 0.2s", userSelect: "none" }}
              >
                {node.icon}
              </text>
              <text
                x={cx} y={CY + 9}
                textAnchor="middle"
                fontSize={6.5}
                fontFamily="'Space Mono', monospace"
                letterSpacing="0.12em"
                fill={isActive ? "var(--bg)" : "var(--text)"}
                style={{ transition: "fill 0.2s", userSelect: "none" }}
              >
                {node.label}
              </text>
              <text
                x={cx} y={CY + R + 16}
                textAnchor="middle"
                fontSize={7.5}
                fontFamily="'Space Mono', monospace"
                fill="var(--text-muted)"
                style={{ userSelect: "none" }}
              >
                {node.sub}
              </text>
            </g>
          );
        })}
      </svg>

      <div
        style={{
          marginTop: 8,
          minHeight: 80,
          padding: activeNode ? "20px 24px" : "0",
          border: activeNode ? "1px solid var(--border)" : "none",
          background: activeNode ? "var(--bg-panel)" : "transparent",
          borderLeft: activeNode ? "2px solid var(--cyan)" : "none",
          transition: "all 0.2s",
        }}
      >
        {activeNode && (
          <>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.15em",
                color: "var(--cyan)",
                marginBottom: 10,
              }}
            >
              {activeNode.sub.toUpperCase()}
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text-dim)", margin: 0 }}>
              {activeNode.detail}
            </p>
          </>
        )}
      </div>

      {!activeNode && (
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.12em",
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          ↑ SELECT A NODE
        </p>
      )}
    </div>
  );
}
