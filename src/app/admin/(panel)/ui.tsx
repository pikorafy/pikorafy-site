import type { JobRun } from "@/lib/admin/jobs";

// Small display helpers shared by the admin pages.

export const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toLocaleString("en-US"));

/** "10:41" today (UTC), "1 Nov 10:41" otherwise. */
export function time(d: Date | number | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  const hm = date.toISOString().slice(11, 16);
  const today = new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10) === today ? hm : `${date.getUTCDate()} ${date.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${hm}`;
}

export function duration(from: Date | string | null, to: Date | string | null): string {
  if (!from) return "—";
  const ms = (to ? new Date(to) : new Date()).getTime() - new Date(from).getTime();
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  return m < 120 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

const LABEL: Record<JobRun["status"], string> = {
  queued: "Queued", running: "● Running", succeeded: "✓ Done", failed: "✗ Failed", stopped: "■ Stopped",
};

export function RunStatus({ status }: { status: JobRun["status"] }) {
  return <span className={`adm-pill ${status}`}>{LABEL[status]}</span>;
}
