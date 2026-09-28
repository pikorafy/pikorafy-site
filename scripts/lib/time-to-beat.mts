// Which IGDB "time to beat" numbers we trust enough to show. IGDB publishes raw averages of
// a few player submissions, so online and endless games get absurd values (Dota 2: 357 h main
// story) and one silly entry can skew a thinly covered game. Shared by the importer and the probe.

export interface IgdbTimeToBeat {
  game_id: number;
  hastily?: number;      // seconds: main story
  normally?: number;     // seconds: main + extras
  completely?: number;   // seconds: 100%
  count?: number;        // player submissions
}

export interface TimeToBeat {
  main: number;          // minutes
  extras: number | null;
  full: number | null;
  count: number;
}

export type Verdict = { ok: true; ttb: TimeToBeat } | { ok: false; reason: string };

export const MIN_SUBMISSIONS = 3;
const MIN_MAIN_H = 0.5;
const MAX_MAIN_H = 300;
const MAX_EXTRAS_X = 5;    // main + extras at most 5× the main story
const MAX_FULL_X = 10;     // 100% at most 10× the main story

/** Story games only: Steam's "Single-player" category, no MMOs. */
export function eligible(categories: string[] | null, genres: string[] | null): boolean {
  return !!categories?.includes("Single-player") && !genres?.includes("Massively Multiplayer");
}

/** Keeps the main story time and whichever longer times are consistent with it. */
export function judge(t: IgdbTimeToBeat | undefined): Verdict {
  if (!t) return { ok: false, reason: "no data" };
  const count = t.count ?? 0;
  if (count < MIN_SUBMISSIONS) return { ok: false, reason: `under ${MIN_SUBMISSIONS} submissions` };
  if (!t.hastily) return { ok: false, reason: "no main story time" };
  const h = t.hastily / 3600;
  if (h < MIN_MAIN_H || h > MAX_MAIN_H) return { ok: false, reason: "main story out of range" };
  const main = t.hastily;
  const extras = t.normally && t.normally >= main && t.normally <= main * MAX_EXTRAS_X ? t.normally : null;
  const full = t.completely && t.completely >= (extras ?? main) && t.completely <= main * MAX_FULL_X ? t.completely : null;
  const min = (s: number | null) => (s == null ? null : Math.round(s / 60));
  return { ok: true, ttb: { main: min(main)!, extras: min(extras), full: min(full), count } };
}
