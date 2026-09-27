import Link from "next/link";
import { getReleases } from "@/lib/releases";
import ReleaseStrip, { type StripDay } from "@/components/ReleaseStrip";

// Home page: the next release days (from today), two most anticipated games each,
// scrolling sideways. Full calendar at /releases.

const DAYS_AHEAD = 30;
const MAX_DAYS = 15;
const PER_DAY = 2;

export default async function HomeReleases() {
  const now = new Date();   // server-rendered, cached with the home page (hourly)
  const today = now.toISOString().slice(0, 10);
  const until = new Date(now.getTime() + DAYS_AHEAD * 86_400_000).toISOString().slice(0, 10);
  let releases;
  try {
    releases = await getReleases(today, until);
  } catch {
    return null;   // the home page shouldn't fail because of this strip
  }

  const byDay = new Map<string, typeof releases>();
  for (const r of releases) if (r.precision === "day") byDay.set(r.release_date, [...(byDay.get(r.release_date) ?? []), r]);
  const days: StripDay[] = [...byDay.keys()].sort().slice(0, MAX_DAYS).map((date) => {
    const list = byDay.get(date)!;   // already most anticipated first
    return {
      date,
      more: Math.max(0, list.length - PER_DAY),
      games: list.slice(0, PER_DAY).map((r) => ({
        igdb_id: r.igdb_id, title: r.title, art: r.art, cover: r.cover,
        href: r.href, buy: r.buy,
      })),
    };
  });
  if (!days.length) return null;

  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <div className="section-hd">
          <div>
            <div className="eyebrow">Release calendar · next {DAYS_AHEAD} days</div>
            <h2 className="h2">Coming <em>soon.</em></h2>
          </div>
          <Link href="/releases" className="btn btn-ghost">Full calendar →</Link>
        </div>
        <ReleaseStrip days={days} today={today} />
      </div>
    </section>
  );
}
