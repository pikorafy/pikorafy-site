"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { jobByName } from "@/lib/jobs/definitions";
import { requestStop, runNow, setJobEnabled } from "@/lib/admin/jobs";
import { requireAdmin } from "@/lib/admin/session";

export async function runJobNow(form: FormData) {
  const user = await requireAdmin();
  const job = String(form.get("job") ?? "");
  if (!jobByName(job)) throw new Error("Unknown job");
  const runId = await runNow(job, user.name);
  redirect(`/admin/jobs?run=${runId}`);
}

export async function stopRun(form: FormData) {
  await requireAdmin();
  const runId = Number(form.get("run"));
  if (!Number.isInteger(runId)) throw new Error("Unknown run");
  await requestStop(runId);
  refresh();
}

export async function toggleJob(form: FormData) {
  const user = await requireAdmin();
  const job = String(form.get("job") ?? "");
  if (!jobByName(job)) throw new Error("Unknown job");
  await setJobEnabled(job, form.get("enabled") === "1", user.name);
  refresh();
}
