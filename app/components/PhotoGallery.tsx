"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

type Photo = {
  id: number;
  file_url: string;
  vision_summary: string | null;
  agent_quote: string | null;
  recorded_at: string | null;
};


function fmtShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const photo = photos[index];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  const caption = photo.agent_quote ?? photo.vision_summary;

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>

      {index > 0 && (
        <button className="lightbox-nav lightbox-nav--prev" onClick={(e) => { e.stopPropagation(); onPrev(); }}>
          ‹
        </button>
      )}

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={photo.file_url} alt={photo.vision_summary ?? "Expedition photo"} className="lightbox-img" />
        {caption && (
          <div className="lightbox-caption">
            <span className="lightbox-caption-text">{caption}</span>
            <span className="lightbox-counter">{index + 1} / {photos.length}</span>
          </div>
        )}
        {!caption && (
          <div className="lightbox-caption">
            <span className="lightbox-counter">{index + 1} / {photos.length}</span>
          </div>
        )}
      </div>

      {index < photos.length - 1 && (
        <button className="lightbox-nav lightbox-nav--next" onClick={(e) => { e.stopPropagation(); onNext(); }}>
          ›
        </button>
      )}
    </div>
  );
}

const ALL_TAB = "__all__";

export default function PhotoGallery({ photos, today }: { photos: Photo[]; today: string }) {
  const grouped = useMemo(() => {
    if (photos.length === 0) return null;

    const byDate: Record<string, Photo[]> = {};
    for (const photo of photos) {
      const date = photo.recorded_at ? photo.recorded_at.slice(0, 10) : "unknown";
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(photo);
    }

    const days = Object.keys(byDate)
      .filter((d) => d !== "unknown")
      .sort()
      .reverse()
      .map((date) => ({ date, label: fmtShortDate(date) }));

    if (byDate["unknown"]) {
      days.push({ date: "unknown", label: "Unknown" });
    }

    // ALL tab: all photos sorted by recorded_at descending
    byDate[ALL_TAB] = [...photos].sort((a, b) =>
      (b.recorded_at ?? "").localeCompare(a.recorded_at ?? "")
    );

    return { byDate, days };
  }, [photos]);

  // Default to today (Argentina date) if it has photos, else most recent day
  const defaultDay = useMemo(() => {
    if (!grouped) return null;
    if (grouped.byDate[today]?.length) return today;
    return grouped.days.at(0)?.date ?? null;
  }, [grouped, today]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const activeDay = selectedDay ?? defaultDay;
  const visiblePhotos = activeDay && grouped ? (grouped.byDate[activeDay] ?? []) : [];

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevPhoto = useCallback(() => setLightboxIndex((i) => (i != null && i > 0 ? i - 1 : i)), []);
  const nextPhoto = useCallback(() => setLightboxIndex((i) => (i != null && i < visiblePhotos.length - 1 ? i + 1 : i)), [visiblePhotos.length]);

  if (!grouped) {
    return (
      <p style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.12em",
        color: "var(--text-muted)",
        padding: "48px 0",
      }}>
        NO PHOTOS TRANSMITTED YET
      </p>
    );
  }

  return (
    <>
      <div className="mosaic-tabs">
        {grouped.days.map((d) => (
          <button
            key={d.date}
            className={`mosaic-tab${d.date === activeDay ? " active" : ""}`}
            onClick={() => { setSelectedDay(d.date); setLightboxIndex(null); }}
          >
            {d.label}
          </button>
        ))}
        <button
          className={`mosaic-tab${activeDay === ALL_TAB ? " active" : ""}`}
          onClick={() => { setSelectedDay(ALL_TAB); setLightboxIndex(null); }}
        >
          ALL
        </button>
      </div>
      <div className="mosaic-grid">
        {visiblePhotos.map((photo, i) => (
          <div
            key={photo.id}
            className="mosaic-item"
            style={{ cursor: "pointer" }}
            onClick={() => setLightboxIndex(i)}
          >
            <img src={photo.file_url} alt={photo.vision_summary ?? "Expedition photo"} loading="lazy" />
            <div className="mosaic-item-overlay" />
            {(photo.agent_quote ?? photo.vision_summary) && (
              <div className="mosaic-item-label">{photo.agent_quote ?? photo.vision_summary}</div>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex != null && (
        <Lightbox
          photos={visiblePhotos}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}
    </>
  );
}
