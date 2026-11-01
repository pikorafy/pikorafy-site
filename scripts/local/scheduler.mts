// Scheduled jobs for the local Docker setup (the "jobs" service): the importers on the same
// schedule as the GitHub Actions workflows, and the hourly home-page refresh pg_cron does on
// Supabase. Jobs run one at a time, in the order they come due.
//
//   node scripts/local/scheduler.mts          run the schedule (times are UTC, as on GitHub)
//   node scripts/local/scheduler.mts list     print the jobs and whether their keys are set
//   node scripts/local/scheduler.mts now <job>   run one job right away, then exit
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, plus each importer's API keys.

import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

interface Job {
  name: string;
  cron: string[];             // 5-field cron expressions, UTC
  needs: string[];            // env vars the job can't run without
  run: () => Promise<void>;
}

const node = (...args: string[]) => () => new Promise<void>((resolve, reject) => {
  const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });
  child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`exit code ${code}`))));
  child.on("error", reject);
});

async function refreshHomeLists() {
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { error } = await db.rpc("refresh_home_lists");
  if (error) throw new Error(error.message);
}

const IGDB = ["IGDB_CLIENT_ID", "IGDB_CLIENT_SECRET"];

// Mirrors .github/workflows/*.yml.
const JOBS: Job[] = [
  { name: "home-lists", cron: ["17 * * * *"], needs: [], run: refreshHomeLists },
  { name: "steam", cron: ["17 */3 * * *"], needs: ["STEAM_API_KEY"], run: node("scripts/import-steam.mts", "run") },
  { name: "steam-seed", cron: ["40 4 * * 1"], needs: ["STEAM_API_KEY"], run: node("scripts/import-steam.mts", "seed", "500") },
  { name: "steam-discover", cron: ["5 5 * * *"], needs: ["STEAM_API_KEY"], run: node("scripts/import-steam.mts", "discover") },
  { name: "players", cron: ["5 */3 * * *"], needs: [], run: node("scripts/import-players.mts") },
  { name: "itad", cron: ["47 */6 * * *"], needs: ["ITAD_API_KEY"], run: node("scripts/import-itad.mts", "run") },
  { name: "xbox", cron: ["23 */6 * * *"], needs: [], run: node("scripts/import-xbox.mts", "run", "500", "0") },
  { name: "nintendo", cron: ["41 */6 * * *"], needs: IGDB, run: node("scripts/import-nintendo.mts", "run") },
  { name: "playstation", cron: ["35 1 * * *"], needs: IGDB, run: node("scripts/import-playstation.mts", "run") },
  { name: "playstation-store", cron: ["35 7-23/6 * * *"], needs: IGDB, run: node("scripts/import-playstation.mts", "store") },
  { name: "releases", cron: ["50 2 * * *"], needs: IGDB, run: node("scripts/import-releases.mts", "run") },
  { name: "link-titles", cron: ["37 3 * * *"], needs: IGDB, run: node("scripts/link-titles.mts", "run") },
  { name: "time-to-beat", cron: ["59 4 * * 0"], needs: IGDB, run: node("scripts/import-time-to-beat.mts", "run") },
];

// ─── Cron matching (minute hour day-of-month month day-of-week; *, */n, a-b, a-b/n, lists) ──

function fieldMatches(field: string, value: number, min: number, max: number): boolean {
  return field.split(",").some((part) => {
    const [range, stepText] = part.split("/");
    const step = stepText ? Number(stepText) : 1;
    let lo = min, hi = max;
    if (range !== "*") {
      const [a, b] = range.split("-").map(Number);
      lo = a; hi = b ?? (stepText ? max : a);
    }
    return value >= lo && value <= hi && (value - lo) % step === 0;
  });
}

function due(expr: string, d: Date): boolean {
  const [mi, h, dom, mon, dow] = expr.trim().split(/\s+/);
  return fieldMatches(mi, d.getUTCMinutes(), 0, 59) && fieldMatches(h, d.getUTCHours(), 0, 23)
    && fieldMatches(dom, d.getUTCDate(), 1, 31) && fieldMatches(mon, d.getUTCMonth() + 1, 1, 12)
    && fieldMatches(dow, d.getUTCDay(), 0, 6);
}

// ─── Running ────────────────────────────────────────────────────────────────

const missing = (job: Job) => job.needs.filter((k) => !process.env[k]);
const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

const queue: Job[] = [];
let running = false;

async function drain() {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift()!;
    const started = Date.now();
    console.log(`[${stamp()}] ▶ ${job.name}`);
    try {
      await job.run();
      console.log(`[${stamp()}] ✓ ${job.name} (${Math.round((Date.now() - started) / 1000)}s)`);
    } catch (err) {
      console.error(`[${stamp()}] ✗ ${job.name}: ${(err as Error).message}`);
    }
  }
  running = false;
}

function tick() {
  const now = new Date();
  for (const job of JOBS) {
    if (!job.cron.some((c) => due(c, now))) continue;
    if (missing(job).length) continue;                      // reported once at start-up
    if (queue.includes(job)) continue;                      // still waiting from last time
    queue.push(job);
  }
  void drain();
  // Next check at the start of the next minute.
  setTimeout(tick, 60_000 - (Date.now() % 60_000) + 500);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "list") {
  for (const job of JOBS) {
    const m = missing(job);
    console.log(`${job.name.padEnd(18)} ${job.cron.join(" | ").padEnd(18)} ${m.length ? `skipped (missing ${m.join(", ")})` : "ready"}`);
  }
} else if (cmd === "now") {
  const job = JOBS.find((j) => j.name === arg);
  if (!job) {
    console.error(`Unknown job "${arg}". Jobs: ${JOBS.map((j) => j.name).join(", ")}`);
    process.exit(1);
  }
  const m = missing(job);
  if (m.length) {
    console.error(`${job.name} needs ${m.join(", ")} (docker/importers.env).`);
    process.exit(1);
  }
  queue.push(job);
  await drain();
} else {
  console.log(`[${stamp()}] Scheduler started (times in UTC).`);
  for (const job of JOBS) {
    const m = missing(job);
    if (m.length) console.log(`  ${job.name}: skipped, missing ${m.join(", ")}`);
  }
  setTimeout(tick, 60_000 - (Date.now() % 60_000) + 500);
}
