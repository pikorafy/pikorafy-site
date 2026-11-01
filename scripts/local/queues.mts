// Shared by the worker and the jobs CLI: the Redis connection for BullMQ and how a run is
// put on its source's queue. (The admin has the same in src/lib/admin/jobs.ts.)

import { Queue } from "bullmq";
import type pg from "pg";
import { jobByName, queueName } from "../../src/lib/jobs/definitions.ts";

export interface RunData {
  trigger: "schedule" | "manual";
  runId?: number;
  requestedBy?: string;
}

export function redisConnection(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    password: u.password ? decodeURIComponent(u.password) : undefined,
    db: u.pathname.length > 1 ? Number(u.pathname.slice(1)) : 0,
    maxRetriesPerRequest: null,
  };
}

/** Records a queued manual run and puts it on its source's queue. Returns the run id. */
export async function enqueueRun(db: pg.Pool | pg.Client, redisUrl: string, job: string, requestedBy: string): Promise<number> {
  const def = jobByName(job);
  if (!def) throw new Error(`Unknown job "${job}"`);
  const { rows } = await db.query(
    "insert into public.job_runs (job, trigger, status, requested_by) values ($1, 'manual', 'queued', $2) returning id",
    [job, requestedBy],
  );
  const runId = rows[0].id as number;
  const queue = new Queue(queueName(def.source), { connection: redisConnection(redisUrl) });
  try {
    await queue.add(job, { trigger: "manual", runId, requestedBy } satisfies RunData, { removeOnComplete: 200, removeOnFail: 200 });
  } finally {
    await queue.close();
  }
  return runId;
}
