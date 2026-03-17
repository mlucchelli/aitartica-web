"use client";

import { usePathname } from "next/navigation";
import NavMenu from "./NavMenu";

const LINKS = [
  { hash: "expedition", label: "Expedition" },
  { hash: "live",       label: "Mission Log" },
  { hash: "gallery",    label: "Photo Gallery" },
  { hash: "weather",    label: "Climate" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const isAbout = pathname === "/about";
  const base = isAbout ? "/" : "";

  return (
    <nav className="nav">
      <a href="/" className="nav-logo">
        <div className="nav-logo-icon">✦</div>
        AITARTICA
      </a>
      <ul className="nav-links">
        {LINKS.map(({ hash, label }) => (
          <li key={hash}>
            <a href={`${base}#${hash}`}>{label}</a>
          </li>
        ))}
        <li>
          <a href="/about" style={isAbout ? { color: "var(--cyan)" } : undefined}>
            About
          </a>
        </li>
      </ul>
      <NavMenu base={base} />
    </nav>
  );
}
