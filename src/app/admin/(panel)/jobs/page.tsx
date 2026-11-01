import Link from "next/link";
import { activeRuns, jobOverview, progressOf, runWithLog } from "@/lib/admin/jobs";
import { requireAdmin } from "@/lib/admin/session";
import AutoRefresh from "../AutoRefresh";
import { RunStatus, duration, fmt, time } from "../ui";
import { runJobNow, stopRun, toggleJob } from "./actions";

export default async function AdminJobs({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  await requireAdmin();
  const { run } = await searchParams;
  const [jobs, active] = await Promise.all([jobOverview(), activeRuns()]);
  const runId = Number(run) || jobs.find((j) => j.last?.status === "running")?.last?.id || jobs.map((j) => j.last).filter(Boolean).sort((a, b) => +new Date(b!.queued_at) - +new Date(a!.queued_at))[0]?.id;
  const selected = runId ? await runWithLog(runId) : undefined;
  const busy = active.length > 0;

  return (
    <>
      <AutoRefresh active={busy} seconds={3} />
      <header className="adm-head">
        <div>
          <h1>Jobs</h1>
          <p>Imports and maintenance · times in UTC · one job per store at a time</p>
        </div>
      </header>

      <section className="adm-card" aria-label="All jobs" style={{ padding: "18px 10px 10px" }}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th scope="col">Job</th><th scope="col">Schedule</th><th scope="col">Last run</th><th scope="col">Result</th><th scope="col">Next</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const last = j.last;
                const live = last && (last.status === "running" || last.status === "queued");
                const p = live ? progressOf(active.find((a) => a.id === last.id)?.tail ?? "") : null;
                return (
                  <tr key={j.name} className={selected && last?.id === selected.id ? "is-selected" : undefined}>
                    <td><strong>{j.name}</strong><small>{j.label}</small></td>
                    <td>
                      {j.when}
                      {j.paused && <small><span className="adm-pill paused">Paused</span></small>}
                      {!j.paused && j.missingKeys.length > 0 && <small title={j.missingKeys.join(", ")}><span className="adm-pill warn">Missing keys</span></small>}
                    </td>
                    <td>
                      {last ? <Link href={`/admin/jobs?run=${last.id}`} style={{ textDecoration: "none" }}>{time(last.started_at ?? last.queued_at)}</Link> : "—"}
                      {last?.started_at && <small>{duration(last.started_at, last.finished_at)}{p ? ` · ${fmt(p.done)} / ${fmt(p.total)}` : ""}</small>}
                    </td>
                    <td>{last ? <RunStatus status={last.status} /> : <span className="adm-pill idle">Not run yet</span>}</td>
                    <td>{j.paused ? "—" : time(j.next)}</td>
                    <td>
                      <div className="adm-actions">
                        {live ? (
                          <form action={stopRun}>
                            <input type="hidden" name="run" value={last.id} />
                            <button type="submit" className="adm-btn danger" disabled={last.stop_requested}>{last.stop_requested ? "Stopping…" : "Stop"}</button>
                          </form>
                        ) : (
                          <form action={runJobNow}>
                            <input type="hidden" name="job" value={j.name} />
                            <button type="submit" className="adm-btn primary">Run now</button>
                          </form>
                        )}
                        <form action={toggleJob}>
                          <input type="hidden" name="job" value={j.name} />
                          <input type="hidden" name="enabled" value={j.paused ? "1" : "0"} />
                          <button type="submit" className="adm-btn" title={j.paused ? "Turn the schedule back on" : "Skip scheduled runs (Run now still works)"}>{j.paused ? "Resume" : "Pause"}</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adm-card" aria-label="Log">
        {selected ? (
          <>
            <div className="adm-card-head">
              <h2>{selected.job} · run {selected.id} · {time(selected.started_at ?? selected.queued_at)}</h2>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <RunStatus status={selected.status} />
                <span className="adm-muted">{selected.started_at ? duration(selected.started_at, selected.finished_at) : ""}</span>
              </span>
            </div>
            <pre className="adm-log">{selected.log || (selected.status === "queued" ? "Waiting for its store's queue…" : "No output yet.")}</pre>
          </>
        ) : (
          <p className="adm-empty">Pick a run to see its log.</p>
        )}
      </section>
    </>
  );
}
