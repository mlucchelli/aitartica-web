type NearestSite = {
  name: string;
  distance_km: number;
  bearing_deg?: number;
  bearing_compass?: string;
  eta_hours?: number;
};

export type DayAnalysis = {
  date: string;
  bearing_compass: string | null;
  bearing_deg: number | null;
  speed_kmh: number | null;
  avg_speed_kmh: number | null;
  distance_km: number | null;
  stopped: boolean | null;
  nearest_sites: NearestSite[] | null;
  analyzed_at: string;
};

interface Props {
  analyses: DayAnalysis[];
}

function CompassRose({ deg }: { deg: number | null }) {
  const angle = deg ?? 0;
  return (
    <svg viewBox="0 0 60 60" className="nav-compass-svg" aria-label={`Heading ${angle}°`}>
      <circle cx="30" cy="30" r="28" fill="none" stroke="var(--border)" strokeWidth="1" />
      {[0, 90, 180, 270].map((a) => {
        const rad = (a - 90) * (Math.PI / 180);
        return (
          <line
            key={a}
            x1={30 + 23 * Math.cos(rad)} y1={30 + 23 * Math.sin(rad)}
            x2={30 + 28 * Math.cos(rad)} y2={30 + 28 * Math.sin(rad)}
            stroke="var(--border)" strokeWidth="1.5"
          />
        );
      })}
      <text x="30" y="7"  textAnchor="middle" fontSize="6" fontFamily="'Space Mono',monospace" fill="var(--cyan)">N</text>
      <text x="54" y="32" textAnchor="middle" fontSize="5" fontFamily="'Space Mono',monospace" fill="var(--text-muted)">E</text>
      <text x="30" y="57" textAnchor="middle" fontSize="5" fontFamily="'Space Mono',monospace" fill="var(--text-muted)">S</text>
      <text x="6"  y="32" textAnchor="middle" fontSize="5" fontFamily="'Space Mono',monospace" fill="var(--text-muted)">W</text>
      <g transform={`rotate(${angle}, 30, 30)`}>
        <polygon points="30,8 27.5,30 30,33 32.5,30"  fill="var(--cyan)" />
        <polygon points="30,33 27.5,30 30,52 32.5,30" fill="var(--text-muted)" opacity="0.3" />
      </g>
      <circle cx="30" cy="30" r="2.5" fill="var(--cyan)" />
    </svg>
  );
}

function expeditionDay(date: string): number {
  const start = new Date("2026-03-17");
  const d = new Date(date + "T12:00:00Z");
  return Math.floor((d.getTime() - start.getTime()) / 86400000) + 1;
}

function fmtDate(date: string): string {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  });
}

function fmt1(v: number | null, unit: string): string {
  return v != null ? `${v.toFixed(1)} ${unit}` : "—";
}

export default function NavAnalysis({ analyses }: Props) {
  if (analyses.length === 0) return null;

  return (
    <section className="nav-section" id="navigation">
      <div className="nav-section-head">
        <div className="section-label">Navigation Log</div>
        <h2 className="section-title nav-section-title">Route Analysis · By Day</h2>
      </div>

      <div className="nav-days-scroll">
        {analyses.map((day) => {
          const dayNum = expeditionDay(day.date);
          const sites = day.nearest_sites ?? [];

          return (
            <div key={day.date} className="nav-day-card">

              {/* ── Card header ── */}
              <div className="nav-card-header">
                <div className="nav-card-id">
                  <span className="nav-card-day">D{dayNum}</span>
                  <span className="nav-card-date">{fmtDate(day.date)}</span>
                </div>
              </div>

              {/* ── Compass + stats ── */}
              <div className="nav-card-body">
                <CompassRose deg={day.bearing_deg} />

                <div className="nav-card-stats">
                  <div className="nav-stat">
                    <span className="nav-stat-label">HEADING</span>
                    <span className="nav-stat-value nav-stat-value--highlight">
                      {day.bearing_deg != null
                        ? `${Math.round(day.bearing_deg)}° ${day.bearing_compass ?? ""}`
                        : "—"}
                    </span>
                  </div>
                  <div className="nav-stat">
                    <span className="nav-stat-label">SPEED</span>
                    <span className="nav-stat-value">{fmt1(day.speed_kmh, "km/h")}</span>
                  </div>
                  <div className="nav-stat">
                    <span className="nav-stat-label">AVG SPEED</span>
                    <span className="nav-stat-value">{fmt1(day.avg_speed_kmh, "km/h")}</span>
                  </div>
                  <div className="nav-stat">
                    <span className="nav-stat-label">DISTANCE</span>
                    <span className="nav-stat-value">{fmt1(day.distance_km, "km")}</span>
                  </div>
                </div>
              </div>

              {/* ── Nearest sites ── */}
              {sites.length > 0 && (
                <div className="nav-sites">
                  <div className="nav-sites-label">NEAREST SITES</div>
                  {sites.map((s, i) => (
                    <div key={i} className="nav-site-row">
                      <span className="nav-site-rank">{i + 1}</span>
                      <span className="nav-site-name">{s.name}</span>
                      <span className="nav-site-data">
                        <span className="nav-site-dist">{s.distance_km.toFixed(0)} km</span>
                        {s.bearing_compass && (
                          <span className="nav-site-bear">{s.bearing_compass}</span>
                        )}
                        {s.eta_hours != null && (
                          <span className="nav-site-eta">{Math.round(s.eta_hours)}h ETA</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
