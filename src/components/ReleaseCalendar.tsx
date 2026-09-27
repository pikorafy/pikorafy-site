"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import FallbackImg from "@/components/FallbackImg";

// Month grid of release days (Monday–Sunday rows with ISO week numbers). Each day shows the
// most anticipated release's wide art and one dash per release (green = we track its price);
// clicking a day drops its full list open under that week (click again, ✕ or Esc to close).

export interface CalRelease {
  igdb_id: number;
  title: string;
  platforms: string[];
  art: string[];
  cover: string | null;
  href: string | null;
  buy: { href: string; external: boolean } | null;
}

export interface CalDay {
  date: string;          // YYYY-MM-DD
  inRange: boolean;      // false for the leading / trailing days of other months
  isToday: boolean;
  /** After today: releases here are pre-orders. */
  upcoming: boolean;
  releases: CalRelease[];
}

export interface CalWeek {
  week: number;
  days: CalDay[];
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MAX_DASHES = 6;
/** Column widths (fr) Monday → Sunday: most releases land on weekdays, so weekends are narrower. Keep in sync with .rc-grid. */
const COL_FR = [1, 1, 1, 1, 1, 0.6, 0.6];
const caretAt = (col: number) =>
  `${((COL_FR.slice(0, col).reduce((a, b) => a + b, 0) + COL_FR[col] / 2) / COL_FR.reduce((a, b) => a + b, 0)) * 100}%`;

function ordinal(n: number) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "Thursday 24 September 2026". Built by hand: server and browser locale formatting can differ, which breaks hydration. */
function longDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${WEEKDAYS[(d.getUTCDay() + 6) % 7]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default function ReleaseCalendar({ weeks }: { weeks: CalWeek[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const drop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;
    drop.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <>
      <div className="rc-scroll">
        <div className="rc-grid" role="grid" aria-label="Release calendar">
          <div className="rc-wk rc-label">Week</div>
          {WEEKDAYS.map((d) => (
            <div key={d} className="rc-label"><span className="rc-long">{d}</span><span className="rc-short">{d.slice(0, 3)}</span></div>
          ))}
          {weeks.map((w) => (
            <div key={w.week + w.days[0].date} className="rc-row" role="row">
              <div className="rc-wk">{w.week}</div>
              {w.days.map((d, col) => {
                const top = d.releases[0];
                const n = d.releases.length;
                return (
                  <div
                    key={d.date}
                    role="gridcell"
                    aria-selected={selected === d.date}
                    className={`rc-cell${col >= 5 ? " wkend" : ""}${d.inRange ? "" : " out"}${d.isToday ? " today" : ""}${selected === d.date ? " sel" : ""}`}
                  >
                    <span className="rc-head">
                      <b>{ordinal(Number(d.date.slice(8)))}</b>
                      {top?.buy && <BuyLink buy={top.buy} upcoming={d.upcoming} title={top.title} compact />}
                    </span>
                    <button
                      type="button"
                      className="rc-pick"
                      aria-label={`${longDate(d.date)}: ${n ? `${n} release${n === 1 ? "" : "s"}` : "no releases"}`}
                      aria-expanded={selected === d.date}
                      onClick={() => setSelected((s) => (s === d.date ? null : d.date))}
                    >
                      <span className="rc-art">
                        {top && (
                          <FallbackImg srcs={top.art} last={top.cover} alt={top.title} loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </span>
                      <span className="rc-foot" aria-hidden="true">
                        {top && <span className="rc-title">{top.title}</span>}
                        <span className="rc-dash-row">
                          <span className="rc-dashes">
                            {Array.from({ length: MAX_DASHES }, (_, i) => (
                              <i key={i} className={i < n ? (d.releases[i].href ? "on tracked" : "on") : ""} />
                            ))}
                          </span>
                          {n > MAX_DASHES && <span className="rc-more">+{n - MAX_DASHES}</span>}
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })}
              {(() => {
                const col = w.days.findIndex((d) => d.date === selected);
                if (col < 0) return null;
                const day = w.days[col];
                return (
                  <div ref={drop} className="rc-drop" style={{ "--caret": caretAt(col) } as React.CSSProperties} aria-live="polite">
                    <div className="rc-drop-hd">
                      <h2>{longDate(day.date)} <span>· {day.releases.length || "no"} release{day.releases.length === 1 ? "" : "s"}</span></h2>
                      <button type="button" className="rc-close" aria-label="Close" onClick={() => setSelected(null)}>✕</button>
                    </div>
                    {day.releases.length ? (
                      <div className="rc-list">{day.releases.map((r) => <ReleaseItem key={r.igdb_id} r={r} upcoming={day.upcoming} />)}</div>
                    ) : (
                      <p style={{ color: "var(--text-3)", margin: 0 }}>No releases we know of on this day.</p>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
      <p className="rc-legend">
        <i className="on tracked" /> We track its price <i className="on" /> Release only · one dash per release, most anticipated first
      </p>

    </>
  );
}

/** "Pre-order" before the release day, "Buy now" from then on. */
function BuyLink({ buy, upcoming, title, compact = false }: { buy: NonNullable<CalRelease["buy"]>; upcoming: boolean; title: string; compact?: boolean }) {
  const label = upcoming ? (compact ? "Pre-order" : "Pre-order now") : "Buy now";
  const props = { className: `rc-cta${upcoming ? " pre" : ""}`, title: `${label}: ${title}` };
  return buy.external
    ? <a href={buy.href} target="_blank" rel="noopener noreferrer" {...props}>{label}</a>
    : <Link href={buy.href} {...props}>{label}</Link>;
}

export function ReleaseItem({ r, note, upcoming }: { r: CalRelease; note?: string; upcoming: boolean }) {
  return (
    <div className={`rc-item${r.href ? " tracked" : ""}`}>
      <span className="rc-thumb">
        <FallbackImg srcs={r.art} last={r.cover} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </span>
      <span className="rc-info">
        {r.href ? <Link href={r.href} className="rc-name">{r.title}</Link> : <b className="rc-name">{r.title}</b>}
        <span className="rc-plats">{r.platforms.map((p) => <span key={p}>{p}</span>)}</span>
        <span className="rc-go">
          {note && <span>{note}</span>}
          {r.buy ? <BuyLink buy={r.buy} upcoming={upcoming} title={r.title} /> : <span>Release only</span>}
        </span>
      </span>
    </div>
  );
}
