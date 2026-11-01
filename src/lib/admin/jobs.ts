import "server-only";
import { Queue } from "bullmq";
import { JOBS, SOURCES, jobByName, queueName } from "@/lib/jobs/definitions";
import { db } from "./db";
import { redis, redisConnection } from "./redis";

// The admin's side of the job runner (scripts/local/worker.mts): queue a run, ask a run to
// stop, pause a schedule, and read runs and next times.

const globalForQueues = globalThis as unknown as { adminQueues?: Map<string, Queue> };

function queue(source: string): Queue {
  globalForQueues.adminQueues ??= new Map();
  let q = globalForQueues.adminQueues.get(source);
  if (!q) {
    q = new Queue(queueName(source), { connection: redisConnection() });
    globalForQueues.adminQueues.set(source, q);
  }
  return q;
}

export interface JobRun {
  id: number;
  job: string;
  trigger: "schedule" | "manual";
  status: "queued" | "running" | "succeeded" | "failed" | "stopped";
  requested_by: string | null;
  queued_at: Date;
  started_at: Date | null;
  finished_at: Date | null;
  stop_requested: boolean;
  summary: string | null;
}

const RUN_COLUMNS = ["id", "job", "trigger", "status", "requested_by", "queued_at", "started_at", "finished_at", "stop_requested", "summary"];

export async function runNow(job: string, requestedBy: string): Promise<number> {
  const def = jobByName(job);
  if (!def) throw new Error(`Unknown job ${job}`);
  const [row] = await db()("job_runs").insert({ job, trigger: "manual", status: "queued", requested_by: requestedBy }).returning("id");
  const runId = Number((row as { id: number }).id);
  await queue(def.source).add(job, { trigger: "manual", runId, requestedBy }, { removeOnComplete: 200, removeOnFail: 200 });
  return runId;
}

export async function requestStop(runId: number) {
  await db()("job_runs").where({ id: runId }).whereIn("status", ["queued", "running"]).update({ stop_requested: true });
}

export async function setJobEnabled(job: string, enabled: boolean, by: string) {
  await db().raw(
    `insert into public.job_settings (job, enabled, updated_by) values (?, ?, ?)
     on conflict (job) do update set enabled = excluded.enabled, updated_by = excluded.updated_by, updated_at = now()`,
    [job, enabled, by],
  );
}

export async function latestRuns(limit = 10): Promise<JobRun[]> {
  return db()("job_runs").select(RUN_COLUMNS).orderBy("queued_at", "desc").limit(limit);
}

export async function activeRuns(): Promise<(JobRun & { tail: string })[]> {
  return db()("job_runs")
    .select([...RUN_COLUMNS, db().raw("right(log, 4000) as tail")])
    .whereIn("status", ["running", "queued"])
    .orderBy("queued_at");
}

export async function runWithLog(id: number): Promise<(JobRun & { log: string }) | undefined> {
  return db()("job_runs").select([...RUN_COLUMNS, "log"]).where({ id }).first();
}

/** Per job: last run, paused or not, next scheduled time. */
export async function jobOverview() {
  const lastRuns: JobRun[] = (await db().raw(
    `select distinct on (job) ${RUN_COLUMNS.join(", ")} from public.job_runs order by job, queued_at desc`,
  )).rows;
  const last = new Map(lastRuns.map((r) => [r.job, r]));
  const settings: { job: string; enabled: boolean }[] = await db()("job_settings").select("job", "enabled");
  const paused = new Set(settings.filter((s) => !s.enabled).map((s) => s.job));
  const next = new Map<string, number>();
  await Promise.all(SOURCES.map(async (source) => {
    try {
      for (const s of await queue(source).getJobSchedulers()) if (s.next) next.set(s.key, s.next);
    } catch { /* Redis down: no next times */ }
  }));
  // Written by the job runner at start-up: the API keys live in its container, not this one.
  let missingKeys: Record<string, string[]> = {};
  try {
    missingKeys = JSON.parse((await redis().get("jobs:missing-keys")) ?? "{}");
  } catch { /* unknown until the runner has started */ }
  return JOBS.map((def) => ({
    ...def,
    missingKeys: missingKeys[def.name] ?? [],
    paused: paused.has(def.name),
    last: last.get(def.name) ?? null,
    next: next.get(def.name) ?? null,
  }));
}

/** "Progress: 12000/195929 …" lines the importers print, for a progress bar. */
export function progressOf(tail: string): { done: number; total: number } | null {
  const matches = [...tail.matchAll(/Progress: (\d+)\/(\d+)/g)];
  const m = matches.at(-1);
  return m ? { done: Number(m[1]), total: Number(m[2]) } : null;
}
