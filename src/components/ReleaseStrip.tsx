"use client";

import { useRef } from "react";
import Link from "next/link";
import FallbackImg from "@/components/FallbackImg";

// A sideways-scrolling row of release days (home page). Arrows scroll one screenful;
// on touch screens it swipes.

export interface StripGame {
  igdb_id: number;
  title: string;
  art: string[];
  cover: string | null;
  href: string | null;
  buy: { href: string; external: boolean } | null;
}

export interface StripDay {
  date: string;   // YYYY-MM-DD
  more: number;
  games: StripGame[];
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "MON 28 SEP" / "TODAY". Built by hand so server and browser render the same text. */
function dayLabel(iso: string, today: string) {
  if (iso === today) return <>TODAY</>;
  const d = new Date(`${iso}T00:00:00Z`);
  return <>{WEEKDAYS[d.getUTCDay()]} <b>{d.getUTCDate()} {MONTHS[d.getUTCMonth()]}</b></>;
}

export default function ReleaseStrip({ days, today }: { days: StripDay[]; today: string }) {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.9, behavior: "smooth" });

  return (
    <div className="rs">
      <button type="button" className="rs-arrow prev" aria-label="Earlier days" onClick={() => scroll(-1)}>‹</button>
      <div className="rs-row" ref={row}>
        {days.map((d) => (
          <div key={d.date} className="rs-day">
            <div className="rs-date">{dayLabel(d.date, today)}</div>
            {d.games.map((g) => {
              const target = g.href ?? g.buy?.href ?? "/releases";
              const external = !g.href && !!g.buy?.external;
              const tile = (
                <>
                  <FallbackImg srcs={g.art} last={g.cover} alt={g.title} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span className="rs-title">{g.title}</span>
                </>
              );
              return external
                ? <a key={g.igdb_id} href={target} target="_blank" rel="noopener noreferrer" className="rs-tile">{tile}</a>
                : <Link key={g.igdb_id} href={target} className="rs-tile">{tile}</Link>;
            })}
            {d.more > 0 && (
              <Link href={`/releases?month=${d.date.slice(0, 7)}`} className="rs-more">+{d.more} more</Link>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="rs-arrow next" aria-label="Later days" onClick={() => scroll(1)}>›</button>
    </div>
  );
}
