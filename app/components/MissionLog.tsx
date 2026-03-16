"use client";

import { useState, useMemo } from "react";

type Message = {
  content: string;
  published_at: string;
};

type Reflection = {
  content: string;
  date: string;
} | null;

interface Props {
  messages: Message[];
  reflection: Reflection;
  today: string; // YYYY-MM-DD Argentina
}

function toARDate(isoUtc: string): string {
  // Convert UTC timestamp to Argentina date (UTC-3)
  const d = new Date(new Date(isoUtc).getTime() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function fmtTabDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function fmtTime(isoUtc: string): string {
  return new Date(isoUtc).toUTCString().slice(17, 25) + " UTC";
}

export default function MissionLog({ messages, reflection, today }: Props) {
  // Build sorted list of available dates (AR) across messages + reflection
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    messages.forEach((m) => set.add(toARDate(m.published_at)));
    if (reflection) set.add(reflection.date);
    // Always include today
    set.add(today);
    return Array.from(set).sort();
  }, [messages, reflection, today]);

  const [selectedDate, setSelectedDate] = useState<string>(today);

  const currentIndex = availableDates.indexOf(selectedDate);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < availableDates.length - 1;

  const dayMessages = useMemo(
    () => messages.filter((m) => toARDate(m.published_at) === selectedDate),
    [messages, selectedDate]
  );

  const dayReflection =
    reflection?.date === selectedDate ? reflection : null;

  const isEmpty = dayMessages.length === 0 && !dayReflection;

  return (
    <div className="log-panel" id="status">
      <div className="section-label">Signal Log</div>
      <h2 className="section-title log-panel__title">Mission Log</h2>

      {/* Date navigator */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "1px solid var(--border)",
      }}>
        <button
          onClick={() => canPrev && setSelectedDate(availableDates[currentIndex - 1])}
          disabled={!canPrev}
          style={{
            background: "none",
            border: "none",
            cursor: canPrev ? "pointer" : "default",
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
            color: canPrev ? "var(--cyan)" : "var(--border)",
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.15em",
          color: "var(--text)",
          textTransform: "uppercase",
          flex: 1,
          textAlign: "center",
        }}>
          {fmtTabDate(selectedDate)}
          {selectedDate === today && (
            <span style={{ color: "var(--cyan)", marginLeft: 8, fontSize: 8 }}>● TODAY</span>
          )}
        </span>
        <button
          onClick={() => canNext && setSelectedDate(availableDates[currentIndex + 1])}
          disabled={!canNext}
          style={{
            background: "none",
            border: "none",
            cursor: canNext ? "pointer" : "default",
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
            color: canNext ? "var(--cyan)" : "var(--border)",
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          →
        </button>
      </div>

      <div className="log-entries log-entries-fill">
        {isEmpty ? (
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--text-muted)",
            padding: "48px 0",
          }}>
            NO TRANSMISSIONS
          </p>
        ) : (
          <>
            {dayReflection && (
              <div className="log-entry">
                <div className="log-entry-header">
                  <span className="log-tag log-tag-reflection">reflection</span>
                  <span className="log-time">21:00:00 UTC</span>
                </div>
                <p className="log-text">{dayReflection.content}</p>
              </div>
            )}
            {dayMessages.map((m) => (
              <div key={m.published_at} className="log-entry">
                <div className="log-entry-header">
                  <span className="log-tag log-tag-message">message</span>
                  <span className="log-time">{fmtTime(m.published_at)}</span>
                </div>
                <p className="log-text">{m.content}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
