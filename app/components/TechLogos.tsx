"use client";

import Image from "next/image";
import { useState } from "react";

interface Tech {
  name: string;
  use: string;
  logo: React.ReactNode;
}

const TECHS: Tech[] = [
  {
    name: "Qwen",
    use: "Agent brain",
    logo: (
      <div style={{
        height: 32,
        display: "flex",
        alignItems: "center",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: "0.05em",
        color: "var(--text-dim)",
        opacity: 0.4,
      }}>
        QWEN
      </div>
    ),
  },
  {
    name: "Anthropic",
    use: "Coding",
    logo: (
      <Image
        src="https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg"
        alt="Anthropic"
        width={140}
        height={32}
        style={{ filter: "grayscale(100%) brightness(0.4)", objectFit: "contain" }}
        unoptimized
      />
    ),
  },
  {
    name: "OpenAI",
    use: "Prompts review",
    logo: (
      <Image
        src="https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg"
        alt="OpenAI"
        width={120}
        height={32}
        style={{ filter: "grayscale(100%) brightness(0.4)", objectFit: "contain" }}
        unoptimized
      />
    ),
  },
  {
    name: "Google Gemini",
    use: "Image generation",
    logo: (
      <Image
        src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg"
        alt="Google Gemini"
        width={120}
        height={32}
        style={{ filter: "grayscale(100%) brightness(0.4)", objectFit: "contain" }}
        unoptimized
      />
    ),
  },
  {
    name: "Aoki",
    use: "Platform",
    logo: (
      <Image
        src="https://www.aokitech.com.ar/aoki-logo.png"
        alt="Aoki"
        width={100}
        height={32}
        style={{ filter: "grayscale(100%) brightness(0.4)", objectFit: "contain" }}
        unoptimized
      />
    ),
  },
];

export default function TechLogos() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "48px 24px", alignItems: "center" }}>
      {TECHS.map((tech) => (
        <div
          key={tech.name}
          onMouseEnter={() => setHovered(tech.name)}
          onMouseLeave={() => setHovered(null)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative", cursor: "default", justifySelf: "center" }}
        >
          {/* hover tooltip */}
          <div style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderLeft: "2px solid var(--cyan)",
            padding: "6px 12px",
            whiteSpace: "nowrap",
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.12em",
            color: "var(--cyan)",
            textTransform: "uppercase",
            pointerEvents: "none",
            opacity: hovered === tech.name ? 1 : 0,
            transition: "opacity 0.15s",
          }}>
            {tech.use}
          </div>

          {tech.logo}

          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.15em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}>
            {tech.name}
          </span>
        </div>
      ))}
    </div>
  );
}
