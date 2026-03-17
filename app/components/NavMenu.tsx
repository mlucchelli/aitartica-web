"use client";

import { useState, useEffect } from "react";

export default function NavMenu({ base = "" }: { base?: string }) {
  const NAV_LINKS = [
    { href: `${base}#expedition`, label: "Expedition" },
    { href: `${base}#live`,       label: "Mission Log" },
    { href: `${base}#gallery`,    label: "Photo Gallery" },
    { href: `${base}#weather`,    label: "Climate" },
    { href: "/about",             label: "About" },
  ];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    if (open) window.addEventListener("scroll", close, { once: true });
    return () => window.removeEventListener("scroll", close);
  }, [open]);

  return (
    <>
      <button
        className="nav-hamburger"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`nav-hamburger-bar${open ? " open" : ""}`} />
        <span className={`nav-hamburger-bar${open ? " open" : ""}`} />
        <span className={`nav-hamburger-bar${open ? " open" : ""}`} />
      </button>

      {open && (
        <div className="nav-drawer" onClick={() => setOpen(false)}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-drawer-link">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
