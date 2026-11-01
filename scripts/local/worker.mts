// The job runner for the local Docker setup (the "jobs" service): schedules every job in
// src/lib/jobs/definitions.ts with BullMQ (Redis), runs them — one at a time per source,
// different sources side by side — and records each run with its whole log in public.job_runs,
// which the admin reads. "Run now", "Stop" and pausing a schedule come from the admin or from
// scripts/local/jobs.mts.
//
//   node scripts/local/worker.mts
//
// Env: DATABASE_URL, REDIS_URL, plus what the importers need (SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY and each importer's API keys).

import { spawn, type ChildProcess } from "node:child_process";
import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import pg from "pg";
import { JOBS, SOURCES, jobByName, queueName, type JobDef } from "../../src/lib/jobs/definitions.ts";
import { migrate } from "./migrate.mts";
import { redisConnection, type RunData } from "./queues.mts";

const DATABASE_URL = required("DATABASE_URL");
const db = new pg.Pool({ connectionString: DATABASE_URL, max: 6 });
const connection = redisConnection(required("REDIS_URL"));

const LOG_FLUSH_MS = 2_000;
const STOP_POLL_MS = 3_000;
const MAX_LOG_CHARS = 2_000_000;      // a run's log keeps its last ~2 MB

const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
const missing = (def: JobDef) => def.needs.filter((k) => !process.env[k]);
const children = new Set<ChildProcess>();

// ─── Database helpers ────────────────────────────────────────────────────────

async function isEnabled(job: string): Promise<boolean> {
  const { rows } = await db.query("select enabled from public.job_settings where job = $1", [job]);
  return rows[0]?.enabled ?? true;
}

async function appendLog(runId: number, text: string) {
  if (!text) return;
  await db.query(
    `update public.job_runs set log = right(log || $2, ${MAX_LOG_CHARS}) where id = $1`,
    [runId, text],
  );
}

async function stopRequested(runId: number): Promise<boolean> {
  const { rows } = await db.query("select stop_requested from public.job_runs where id = $1", [runId]);
  return rows[0]?.stop_requested ?? false;
}

async function finish(runId: number, status: "succeeded" | "failed" | "stopped", summary: string) {
  await db.query(
    "update public.job_runs set status = $2, summary = $3, finished_at = now() where id = $1",
    [runId, status, summary.slice(0, 500)],
  );
}

/** Last meaningful line of a log, for the run's one-line summary. */
function lastLine(log: string): string {
  const lines = log.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.at(-1) ?? "";
}

// ─── Running one job ─────────────────────────────────────────────────────────

async function runJob(job: Job<RunData>): Promise<string> {
  const def = jobByName(job.name);
  if (!def) return `unknown job ${job.name}`;
  const data = job.data ?? { trigger: "schedule" };

  // Scheduled runs respect the admin's pause switch and quietly skip jobs without keys.
  if (data.trigger === "schedule") {
    if (!(await isEnabled(def.name))) return "paused";
    if (missing(def).length) return "missing keys";
  }

  let runId = data.runId;
  if (!runId) {
    const { rows } = await db.query(
      "insert into public.job_runs (job, trigger, status) values ($1, $2, 'queued') returning id",
      [def.name, data.trigger],
    );
    runId = rows[0].id as number;
  }
  if (await stopRequested(runId)) {
    await finish(runId, "stopped", "Stopped before it started.");
    return "stopped";
  }
  await db.query("update public.job_runs set status = 'running', started_at = now() where id = $1", [runId]);
  console.log(`[${stamp()}] ▶ ${def.name} (run ${runId})`);

  const gone = missing(def);
  if (gone.length) {
    const msg = `Missing ${gone.join(", ")} (docker/importers.env).`;
    await appendLog(runId, msg + "\n");
    await finish(runId, "failed", msg);
    console.log(`[${stamp()}] ✗ ${def.name}: ${msg}`);
    return "failed";
  }

  const started = Date.now();
  let status: "succeeded" | "failed" | "stopped";
  let summary: string;
  let full = "";

  if ("sql" in def.run) {
    try {
      await db.query(def.run.sql);
      full = `${def.run.sql}: done\n`;
      status = "succeeded";
    } catch (err) {
      full = `${def.run.sql}: ${(err as Error).message}\n`;
      status = "failed";
    }
    await appendLog(runId, full);
    summary = lastLine(full);
  } else {
    const { script, args } = def.run;
    const id = runId;
    let pending = "";
    const child = spawn(process.execPath, [script, ...args], { env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    children.add(child);
    const take = (chunk: Buffer) => {
      const text = chunk.toString();
      pending += text;
      full = (full + text).slice(-20_000);           // enough for the summary line
      process.stdout.write(text);
    };
    child.stdout!.on("data", take);
    child.stderr!.on("data", take);

    let stopping = false;
    const flush = async () => {
      const text = pending;
      pending = "";
      await appendLog(id, text).catch((err) => console.warn(`log write: ${(err as Error).message}`));
    };
    const flusher = setInterval(() => void flush(), LOG_FLUSH_MS);
    const stopper = setInterval(async () => {
      if (stopping) return;
      if (await stopRequested(id).catch(() => false)) {
        stopping = true;
        pending += `\n[${stamp()}] Stop requested from the admin.\n`;
        child.kill("SIGTERM");
        setTimeout(() => child.exitCode === null && child.kill("SIGKILL"), 15_000).unref();
      }
    }, STOP_POLL_MS);

    const code = await new Promise<number | null>((resolve) => {
      child.on("exit", (c) => resolve(c));
      child.on("error", (err) => { pending += `\n${err.message}\n`; resolve(1); });
    });
    clearInterval(flusher);
    clearInterval(stopper);
    children.delete(child);
    await flush();
    status = stopping ? "stopped" : code === 0 ? "succeeded" : "failed";
    summary = stopping ? "Stopped from the admin." : lastLine(full) || `exit code ${code}`;
  }

  await finish(runId, status, summary);
  const mins = Math.round((Date.now() - started) / 60_000);
  console.log(`[${stamp()}] ${status === "succeeded" ? "✓" : status === "stopped" ? "■" : "✗"} ${def.name} (${mins} min)`);
  return status;
}

// ─── Start-up ────────────────────────────────────────────────────────────────

const applied = await migrate(DATABASE_URL);
if (applied.length) console.log(`Database migrations applied: ${applied.join(", ")}`);

// Runs left "running" by a previous worker can't finish any more. (Queued manual runs stay:
// their jobs are still in Redis and start now.)
const { rowCount: orphans } = await db.query(
  `update public.job_runs set status = 'failed', finished_at = now(),
     summary = coalesce(summary, 'The job runner restarted while this run was in progress.')
   where status = 'running'`,
);
if (orphans) console.log(`Marked ${orphans} interrupted run(s) as failed.`);

const queues = new Map(SOURCES.map((s) => [s, new Queue(queueName(s), { connection })]));
for (const [source, queue] of queues) {
  const defs = JOBS.filter((j) => j.source === source);
  for (const def of defs) {
    await queue.upsertJobScheduler(def.name, { pattern: def.cron, tz: "UTC" }, {
      name: def.name,
      data: { trigger: "schedule" },
      opts: { removeOnComplete: 200, removeOnFail: 200 },
    });
  }
  for (const s of await queue.getJobSchedulers()) {
    if (s.key && !defs.some((d) => d.name === s.key)) await queue.removeJobScheduler(s.key);
  }
}

const workers = SOURCES.map((source) => new Worker<RunData>(queueName(source), runJob, {
  connection,
  concurrency: 1,
  lockDuration: 60_000,
  maxStalledCount: 0,           // a run interrupted by a restart isn't silently started again
}));
for (const w of workers) w.on("failed", (job, err) => console.error(`[${stamp()}] ✗ ${job?.name}: ${err.message}`));

// The admin shows which jobs lack API keys; the keys themselves stay in this container.
const missingKeys = Object.fromEntries(JOBS.map((def) => [def.name, missing(def)]));
const redis = new Redis(connection);
await redis.set("jobs:missing-keys", JSON.stringify(missingKeys));
await redis.quit();

console.log(`[${stamp()}] Job runner started: ${JOBS.length} jobs on ${SOURCES.length} queues (times in UTC).`);
for (const def of JOBS) {
  const m = missing(def);
  if (m.length) console.log(`  ${def.name}: schedule skipped, missing ${m.join(", ")}`);
}

async function shutdown() {
  console.log(`[${stamp()}] Stopping…`);
  for (const child of children) child.kill("SIGTERM");
  await db.query(
    "update public.job_runs set status = 'failed', finished_at = now(), summary = 'The job runner was stopped during this run.' where status = 'running'",
  ).catch(() => {});
  await Promise.allSettled(workers.map((w) => w.close(true)));
  await Promise.allSettled([...queues.values()].map((q) => q.close()));
  await db.end();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} must be set`);
  return v;
}
