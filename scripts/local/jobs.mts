// Jobs from the command line (the admin's Jobs page does the same).
//
//   node scripts/local/jobs.mts list                 every job: schedule, keys, last run
//   node scripts/local/jobs.mts now <job> [job…]     queue jobs to run now (one per store at a time)
//   node scripts/local/jobs.mts stop <job|run id>    stop a running or queued run
//
// In Docker: docker compose exec jobs node scripts/local/jobs.mts list
// Env: DATABASE_URL, REDIS_URL

import pg from "pg";
import { JOBS } from "../../src/lib/jobs/definitions.ts";
import { enqueueRun } from "./queues.mts";

const db = new pg.Pool({ connectionString: required("DATABASE_URL"), max: 2 });
const [cmd, ...args] = process.argv.slice(2);

try {
  if (cmd === "list") {
    const { rows } = await db.query(`select distinct on (job) job, status, started_at, finished_at, summary
      from public.job_runs order by job, queued_at desc`);
    const last = new Map(rows.map((r) => [r.job as string, r]));
    const off = new Set((await db.query("select job from public.job_settings where not enabled")).rows.map((r) => r.job as string));
    for (const def of JOBS) {
      const m = def.needs.filter((k) => !process.env[k]);
      const run = last.get(def.name);
      const state = off.has(def.name) ? "paused" : m.length ? `missing ${m.join(", ")}` : "ready";
      const lastRun = run ? `${run.status}${run.finished_at ? ` ${new Date(run.finished_at).toISOString().slice(0, 16).replace("T", " ")}` : ""}` : "never";
      console.log(`${def.name.padEnd(18)} ${def.when.padEnd(20)} ${state.padEnd(28)} last: ${lastRun}`);
    }
  } else if (cmd === "now") {
    if (!args.length) throw new Error(`Name a job: ${JOBS.map((j) => j.name).join(", ")}`);
    for (const job of args) {
      const id = await enqueueRun(db, required("REDIS_URL"), job, "command line");
      console.log(`Queued ${job} (run ${id}). Follow it with: docker compose logs -f jobs`);
    }
  } else if (cmd === "stop") {
    const target = args[0];
    if (!target) throw new Error("Name a job or a run id.");
    const { rowCount } = /^\d+$/.test(target)
      ? await db.query("update public.job_runs set stop_requested = true where id = $1 and status in ('queued', 'running')", [Number(target)])
      : await db.query("update public.job_runs set stop_requested = true where job = $1 and status in ('queued', 'running')", [target]);
    console.log(rowCount ? `Stop requested for ${rowCount} run(s).` : "Nothing running or queued to stop.");
  } else {
    console.error("Usage: jobs.mts list | now <job> [job…] | stop <job|run id>");
    process.exitCode = 1;
  }
} finally {
  await db.end();
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} must be set`);
  return v;
}
