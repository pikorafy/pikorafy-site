"use client";

import { useState } from "react";
import Link from "next/link";
import FallbackImg from "@/components/FallbackImg";

// Month grid of release days (Monday–Sunday rows with ISO week numbers). Each day shows the
// most anticipated release's wide art and one dash per release (green = we track its price);
// clicking a day lists all of its releases below the grid.

export interface CalRelease {
  igdb_id: number;
  title: string;
  platforms: string[];
  art: string[];
  cover: string | null;
  href: string | null;
}

export interface CalDay {
  date: string;          // YYYY-MM-DD
  inRange: boolean;      // false for the leading / trailing days of other months
  isToday: boolean;
  releases: CalRelease[];
}

export interface CalWeek {
  week: number;
  days: CalDay[];
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MAX_DASHES = 6;

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

export default function ReleaseCalendar({ weeks, initial }: { weeks: CalWeek[]; initial: string | null }) {
  const [selected, setSelected] = useState<string | null>(initial);
  const day = weeks.flatMap((w) => w.days).find((d) => d.date === selected) ?? null;

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
              {w.days.map((d) => {
                const top = d.releases[0];
                const n = d.releases.length;
                return (
                  <button
                    key={d.date}
                    type="button"
                    role="gridcell"
                    className={`rc-cell${d.inRange ? "" : " out"}${d.isToday ? " today" : ""}${selected === d.date ? " sel" : ""}`}
                    aria-label={`${longDate(d.date)}: ${n ? `${n} release${n === 1 ? "" : "s"}` : "no releases"}`}
                    aria-selected={selected === d.date}
                    onClick={() => setSelected(d.date)}
                  >
                    <span className="rc-head">
                      <b>{ordinal(Number(d.date.slice(8)))}</b>
                      <span className="rc-dashes" aria-hidden="true">
                        {Array.from({ length: MAX_DASHES }, (_, i) => (
                          <i key={i} className={i < n ? (d.releases[i].href ? "on tracked" : "on") : ""} />
                        ))}
                      </span>
                      {n > MAX_DASHES && <span className="rc-more">+{n - MAX_DASHES}</span>}
                    </span>
                    <span className="rc-art">
                      {top && (
                        <FallbackImg srcs={top.art} last={top.cover} alt={top.title} loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      {top && <span className="rc-title">{top.title}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="rc-legend">
        <i className="on tracked" /> We track its price <i className="on" /> Release only · one dash per release, most anticipated first
      </p>

      {day && (
        <section className="rc-panel" aria-live="polite">
          <h2 className="h2" style={{ fontSize: "clamp(20px,3vw,26px)" }}>{longDate(day.date)}</h2>
          {day.releases.length ? (
            <div className="rc-list">{day.releases.map((r) => <ReleaseItem key={r.igdb_id} r={r} />)}</div>
          ) : (
            <p style={{ color: "var(--text-3)" }}>No releases we know of on this day.</p>
          )}
        </section>
      )}
    </>
  );
}

export function ReleaseItem({ r, note }: { r: CalRelease; note?: string }) {
  const body = (
    <>
      <span className="rc-thumb">
        <FallbackImg srcs={r.art} last={r.cover} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </span>
      <span className="rc-info">
        <b>{r.title}</b>
        <span className="rc-plats">{r.platforms.map((p) => <span key={p}>{p}</span>)}</span>
        <span className="rc-go">{note ? `${note} · ` : ""}{r.href ? "Prices →" : "Release only"}</span>
      </span>
    </>
  );
  return r.href
    ? <Link href={r.href} className="rc-item tracked">{body}</Link>
    : <div className="rc-item">{body}</div>;
}
