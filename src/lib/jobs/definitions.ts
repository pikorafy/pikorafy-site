// Every scheduled job: shared by the worker (scripts/local/worker.mts), the jobs CLI and the
// admin. Plain data, no imports, so Node can load it directly. Times are UTC.

export interface JobDef {
  name: string;
  /** Jobs with the same source never run at the same time (one queue per source). */
  source: string;
  label: string;
  cron: string;
  /** Human version of `cron` for the admin. */
  when: string;
  /** Environment variables the job can't run without. */
  needs: string[];
  /** A Node script with its arguments, or SQL run on the database. */
  run: { script: string; args: string[] } | { sql: string };
}

const IGDB = ["IGDB_CLIENT_ID", "IGDB_CLIENT_SECRET"];

export const JOBS: JobDef[] = [
  { name: "steam", source: "steam", label: "Import and refresh Steam games", cron: "17 */3 * * *", when: "every 3 h", needs: ["STEAM_API_KEY"], run: { script: "scripts/import-steam.mts", args: ["run"] } },
  { name: "steam-seed", source: "steam", label: "Rank every Steam game by reviews", cron: "40 4 * * 1", when: "Mondays 04:40", needs: ["STEAM_API_KEY"], run: { script: "scripts/import-steam.mts", args: ["seed", "all"] } },
  { name: "steam-discover", source: "steam", label: "Trending games, prune", cron: "5 5 * * *", when: "daily 05:05", needs: ["STEAM_API_KEY"], run: { script: "scripts/import-steam.mts", args: ["discover"] } },
  { name: "players", source: "steam-players", label: "Steam player counts", cron: "5 */3 * * *", when: "every 3 h", needs: [], run: { script: "scripts/import-players.mts", args: [] } },
  { name: "itad", source: "itad", label: "Prices from other PC stores", cron: "47 */6 * * *", when: "every 6 h", needs: ["ITAD_API_KEY"], run: { script: "scripts/import-itad.mts", args: ["run"] } },
  { name: "xbox", source: "xbox", label: "Xbox catalog, prices, Game Pass", cron: "23 */6 * * *", when: "every 6 h", needs: [], run: { script: "scripts/import-xbox.mts", args: ["run", "all", "0"] } },
  { name: "nintendo", source: "nintendo", label: "Nintendo eShop catalog and prices", cron: "41 */6 * * *", when: "every 6 h", needs: IGDB, run: { script: "scripts/import-nintendo.mts", args: ["run"] } },
  { name: "playstation", source: "playstation", label: "PlayStation catalog from IGDB", cron: "35 1 * * *", when: "daily 01:35", needs: IGDB, run: { script: "scripts/import-playstation.mts", args: ["run"] } },
  { name: "playstation-store", source: "playstation", label: "PlayStation store pages that are due", cron: "35 7-23/6 * * *", when: "07:35, 13:35, 19:35", needs: IGDB, run: { script: "scripts/import-playstation.mts", args: ["store"] } },
  { name: "releases", source: "igdb", label: "Release calendar", cron: "50 2 * * *", when: "daily 02:50", needs: IGDB, run: { script: "scripts/import-releases.mts", args: ["run"] } },
  { name: "link-titles", source: "igdb", label: "Join store items into titles", cron: "37 3 * * *", when: "daily 03:37", needs: IGDB, run: { script: "scripts/link-titles.mts", args: ["run"] } },
  { name: "time-to-beat", source: "igdb", label: "Time to beat", cron: "59 4 * * 0", when: "Sundays 04:59", needs: IGDB, run: { script: "scripts/import-time-to-beat.mts", args: ["run"] } },
  { name: "home-lists", source: "db", label: "Refresh the home page lists", cron: "17 * * * *", when: "hourly at :17", needs: [], run: { sql: "select public.refresh_home_lists()" } },
];

export const jobByName = (name: string) => JOBS.find((j) => j.name === name);
export const SOURCES = [...new Set(JOBS.map((j) => j.source))];
export const queueName = (source: string) => `jobs-${source}`;
