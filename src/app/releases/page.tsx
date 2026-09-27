import type { Metadata } from "next";
import Link from "next/link";
import ReleaseCalendar, { ReleaseItem, type CalWeek } from "@/components/ReleaseCalendar";
import { getReleases, PLATFORM_GROUPS, type PlatformGroup, type Release } from "@/lib/releases";

// Release calendar: a rolling five-week view (last week + the next four) or any month from
// six back to six ahead. Data from IGDB (scripts/import-releases.mts), refreshed daily.
export const revalidate = 3600;

const MONTHS_BACK = 6;
const MONTHS_AHEAD = 6;

type Params = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// ─── Dates (all UTC, as YYYY-MM-DD strings) ─────────────────────────────────

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const monday = (d: Date) => addDays(d, -((d.getUTCDay() + 6) % 7));
const monthStart = (ym: string) => new Date(`${ym}-01T00:00:00Z`);
const monthEnd = (ym: string) => { const d = monthStart(ym); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)); };
const shiftMonth = (ym: string, n: number) => { const d = monthStart(ym); return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))).slice(0, 7); };
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "Oct ’26" / "October 2026". */
const monthLabel = (ym: string, style: "short" | "long") => {
  const name = MONTH_NAMES[Number(ym.slice(5, 7)) - 1];
  return style === "short" ? `${name.slice(0, 3)} ’${ym.slice(2, 4)}` : `${name} ${ym.slice(0, 4)}`;
};

function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

const quarterOf = (ym: string) => Math.floor((Number(ym.slice(5, 7)) - 1) / 3);
const quarterStart = (ym: string) => `${ym.slice(0, 4)}-${String(quarterOf(ym) * 3 + 1).padStart(2, "0")}`;

function parse(params: Params, today: string) {
  const current = today.slice(0, 7);
  const m = one(params.month);
  const month = m && /^\d{4}-\d{2}$/.test(m) && m >= shiftMonth(current, -MONTHS_BACK) && m <= shiftMonth(current, MONTHS_AHEAD - 1) ? m : null;
  const p = one(params.platform);
  const platform = PLATFORM_GROUPS.some((g) => g.key === p) ? (p as PlatformGroup) : undefined;
  return { month, platform, current };
}

const href = (month: string | null, platform?: PlatformGroup) => {
  const qs = new URLSearchParams();
  if (month) qs.set("month", month);
  if (platform) qs.set("platform", platform);
  const s = qs.toString();
  return s ? `/releases?${s}` : "/releases";
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const p = parse(await searchParams, iso(new Date()));
  const when = p.month ? monthLabel(p.month, "long") : "this month and next";
  return {
    title: `Game Release Calendar: ${p.month ? monthLabel(p.month, "long") : "Upcoming Games"}`,
    description: `Every notable game release for ${when} on PC, PlayStation, Xbox and Nintendo Switch, day by day, with prices where we track them.`,
    alternates: { canonical: p.month ? `/releases?month=${p.month}` : "/releases" },
    ...(p.platform ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ReleasesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const now = new Date();
  const today = iso(now);
  const p = parse(await searchParams, today);

  // Grid range: rolling = last week + the next four; a month = its full Monday–Sunday weeks.
  const start = p.month ? monday(monthStart(p.month)) : addDays(monday(now), -7);
  const end = p.month ? addDays(monday(monthEnd(p.month)), 6) : addDays(start, 34);
  const inRange = (d: string) => (p.month ? d.slice(0, 7) === p.month : true);
  // "Without a specific day": the month (the current one in rolling view) and its quarter.
  const undatedMonth = p.month ?? p.current;
  const from = [iso(start), `${quarterStart(undatedMonth)}-01`].sort()[0];

  const releases = await getReleases(from, iso(end), p.platform);
  const days = new Map<string, Release[]>();
  for (const r of releases) if (r.precision === "day") days.set(r.release_date, [...(days.get(r.release_date) ?? []), r]);

  const weeks: CalWeek[] = [];
  for (let w = start; w <= end; w = addDays(w, 7)) {
    weeks.push({
      week: isoWeek(w),
      days: Array.from({ length: 7 }, (_, i) => {
        const date = iso(addDays(w, i));
        return {
          date,
          inRange: inRange(date),
          isToday: date === today,
          upcoming: date > today,
          releases: (days.get(date) ?? []).map(({ igdb_id, title, platforms, art, cover, href, buy }) => ({ igdb_id, title, platforms, art, cover, href, buy })),
        };
      }),
    });
  }
  const shown = weeks.flatMap((w) => w.days);

  const undated = releases.filter((r) =>
    (r.precision === "month" && r.release_date.slice(0, 7) === undatedMonth) ||
    (r.precision === "quarter" && r.release_date.slice(0, 7) === quarterStart(undatedMonth)));
  const quarterLabel = `Q${quarterOf(undatedMonth) + 1} ${undatedMonth.slice(0, 4)}`;
  const total = shown.filter((d) => d.inRange).reduce((n, d) => n + d.releases.length, 0);

  const tabs = [
    ...Array.from({ length: MONTHS_BACK }, (_, i) => shiftMonth(p.current, i - MONTHS_BACK)),
    null,
    ...Array.from({ length: MONTHS_AHEAD }, (_, i) => shiftMonth(p.current, i)),   // this month and the next five
  ];

  return (
    <div className="shell" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="section-hd" style={{ marginBottom: 12 }}>
        <div>
          <div className="eyebrow">Release calendar · {total} {total === 1 ? "release" : "releases"}</div>
          <h1 className="h2" style={{ fontSize: "clamp(30px,5vw,48px)" }}>
            {p.month ? <>Out in <em>{monthLabel(p.month, "long")}.</em></> : <>What&rsquo;s coming <em>out.</em></>}
          </h1>
        </div>
      </div>
      <p style={{ color: "var(--text-2)", maxWidth: "70ch", lineHeight: 1.6, margin: "0 0 20px" }}>
        The most anticipated games on PC, PlayStation, Xbox and Switch, day by day. Click a day to see
        everything out that day; games we track link to their prices. Updated daily.
      </p>

      <nav className="rc-tabs" aria-label="Months">
        {tabs.map((m) => (
          <Link key={m ?? "rolling"} href={href(m, p.platform)} aria-current={m === p.month ? "page" : undefined}
            className={m === null ? "rolling" : undefined}>
            {m === null ? "Rolling" : monthLabel(m, "short")}
          </Link>
        ))}
      </nav>
      {/* Phones: one month at a time instead of the tab strip. */}
      <nav className="rc-step" aria-label="Month">
        {(() => {
          const i = tabs.indexOf(p.month);
          const prev = i > 0 ? tabs[i - 1] : undefined;
          const next = i < tabs.length - 1 ? tabs[i + 1] : undefined;
          const label = (m: string | null) => (m === null ? "Rolling" : monthLabel(m, "short"));
          return (
            <>
              {prev !== undefined ? <Link href={href(prev, p.platform)}>← {label(prev)}</Link> : <span />}
              <b>{p.month ? monthLabel(p.month, "long") : "Rolling"}</b>
              {next !== undefined ? <Link href={href(next, p.platform)}>{label(next)} →</Link> : <span />}
            </>
          );
        })()}
      </nav>
      <div className="fd-chips" style={{ margin: "0 0 18px" }}>
        <Link href={href(p.month)} className="chip" aria-pressed={!p.platform}>All platforms</Link>
        {PLATFORM_GROUPS.map((g) => (
          <Link key={g.key} href={href(p.month, g.key)} className="chip" aria-pressed={p.platform === g.key} rel="nofollow">{g.label}</Link>
        ))}
      </div>

      <ReleaseCalendar weeks={weeks} />

      {undated.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2 className="h2" style={{ fontSize: "clamp(20px,3vw,26px)", marginBottom: 14 }}>
            Releases in {monthLabel(undatedMonth, "long")} without a specific day
          </h2>
          <div className="rc-list">
            {undated.map((r) => (
              <ReleaseItem key={r.igdb_id} r={r} upcoming={undatedMonth >= p.current}
                note={r.precision === "quarter" ? quarterLabel : monthLabel(undatedMonth, "short")} />
            ))}
          </div>
        </section>
      )}

      <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 28 }}>
        Release dates from IGDB, the European date where there is one. Dates move: check the store before you plan around one.
      </p>
    </div>
  );
}
