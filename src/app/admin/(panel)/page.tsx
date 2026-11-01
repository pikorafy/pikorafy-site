import Link from "next/link";
import { db } from "@/lib/admin/db";
import { activeRuns, jobOverview, latestRuns, progressOf, type JobRun } from "@/lib/admin/jobs";
import { requireAdmin } from "@/lib/admin/session";
import AutoRefresh from "./AutoRefresh";
import { RunStatus, duration, fmt, time } from "./ui";

const STORES = [
  { key: "steam", label: "Steam", table: "games", color: "#000000" },
  { key: "xbox", label: "Xbox", table: "xbox_games", color: "#107c10" },
  { key: "playstation", label: "PlayStation", table: "playstation_games", color: "#0062b3" },
  { key: "nintendo", label: "Nintendo", table: "nintendo_games", color: "#fa3931" },
] as const;

/** A number from the database, or null if the table isn't there (an empty local database). */
async function count(sql: string): Promise<number | null> {
  try {
    const { rows } = await db().raw(sql);
    return Number(rows[0]?.n ?? 0);
  } catch {
    return null;
  }
}

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const [titles, steamQueued, dbSize, linkRows, storeCounts, running, recent, jobs, failedToday] = await Promise.all([
    count("select count(*) n from public.titles"),
    count("select count(*) n from public.import_queue where not skip"),
    db().raw("select pg_size_pretty(pg_database_size(current_database())) s").then((r) => r.rows[0].s as string).catch(() => "?"),
    db().raw("select store, count(*) n from public.title_links group by store").then((r) => r.rows as { store: string; n: string }[]).catch(() => []),
    Promise.all(STORES.map((s) => count(`select count(*) n from public.${s.table}`))),
    activeRuns(),
    latestRuns(8),
    jobOverview(),
    count("select count(*) n from public.job_runs where status = 'failed' and queued_at > now() - interval '24 hours'"),
  ]);

  const linked = new Map(linkRows.map((r) => [r.store, Number(r.n)]));
  const totalItems = storeCounts.reduce<number>((a, n) => a + (n ?? 0), 0);
  const totalLinked = STORES.reduce((a, s) => a + (linked.get(s.key) ?? 0), 0);
  const health = totalItems ? Math.round((totalLinked / totalItems) * 100) : 0;
  const nextJob = jobs.filter((j) => j.next && !j.paused && !j.missingKeys.length).sort((a, b) => a.next! - b.next!)[0];
  const steamCount = storeCounts[0] ?? 0;

  return (
    <>
      <AutoRefresh active={running.length > 0} seconds={5} />
      <header className="adm-head">
        <div>
          <h1>Dashboard</h1>
          <p>Hello {user.name}. {running.length ? `${running.length} job${running.length > 1 ? "s" : ""} running or queued.` : "Nothing running right now."}</p>
        </div>
      </header>

      <section className="adm-grid" aria-label="Catalog size">
        <div className="adm-card adm-kpi">
          <span className="adm-kpi-label">Titles</span>
          <strong>{fmt(titles)}</strong>
          <small>Store items joined across stores</small>
        </div>
        {STORES.map((s, i) => (
          <div key={s.key} className="adm-card adm-kpi">
            <span className="adm-kpi-label"><i style={{ background: s.color }} />{s.label}</span>
            <strong>{fmt(storeCounts[i])}</strong>
            {s.key === "steam" && steamQueued ? (
              <>
                <span className="adm-bar"><i style={{ width: `${Math.min(100, (steamCount / steamQueued) * 100)}%` }} /></span>
                <small>of {fmt(steamQueued)} queued</small>
              </>
            ) : (
              <small>{fmt(linked.get(s.key) ?? 0)} linked to a title</small>
            )}
          </div>
        ))}
      </section>

      <section className="adm-grid-wide">
        <div className="adm-card" style={{ gridColumn: "span 2" }}>
          <div className="adm-card-head">
            <h2>Running now</h2>
            <Link href="/admin/jobs" style={{ fontWeight: 600, textDecoration: "none" }}>All jobs →</Link>
          </div>
          {running.length === 0 && <p className="adm-empty">Nothing running. Start a job from the Jobs page.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {running.map((r) => {
              const p = progressOf(r.tail);
              return (
                <Link key={r.id} href={`/admin/jobs?run=${r.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <span><strong>{r.job}</strong> <RunStatus status={r.status} /></span>
                    <span className="adm-muted">
                      {p ? `${fmt(p.done)} / ${fmt(p.total)}` : r.status === "queued" ? "waiting for its store's queue" : `running for ${duration(r.started_at, null)}`}
                    </span>
                  </span>
                  {p && <span className="adm-bar"><i style={{ width: `${(p.done / p.total) * 100}%` }} /></span>}
                </Link>
              );
            })}
          </div>
          <div className="adm-grid" style={{ marginTop: 18 }}>
            <div className="adm-stat"><div>Database</div><div>{dbSize}</div></div>
            <div className="adm-stat"><div>Next scheduled</div><div>{nextJob ? `${nextJob.name} · ${time(nextJob.next)}` : "—"}</div></div>
            <div className="adm-stat"><div>Failed in 24 h</div><div style={{ color: failedToday ? "var(--a-bad)" : undefined }}>{fmt(failedToday)}</div></div>
          </div>
        </div>

        <div className="adm-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>Matching health</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label={`${health}% of store items linked to a title`}>
              <circle cx="66" cy="66" r="54" fill="none" stroke="#efeaf8" strokeWidth="14" />
              {health > 0 && (
                <circle cx="66" cy="66" r="54" fill="none" stroke="#685489" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${(health / 100) * 339.3} 340`} transform="rotate(-90 66 66)" />
              )}
              <text x="66" y="64" textAnchor="middle" fontSize="24" fontWeight="700" fill="#1f1d2b">{health}%</text>
              <text x="66" y="84" textAnchor="middle" fontSize="11" fill="#5f5a75">linked</text>
            </svg>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, flex: 1, minWidth: 150 }}>
              {STORES.map((s, i) => {
                const n = storeCounts[i] ?? 0;
                return (
                  <li key={s.key} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{s.label}</span>
                    <strong>{n ? `${Math.round(((linked.get(s.key) ?? 0) / n) * 100)}%` : "—"}</strong>
                  </li>
                );
              })}
            </ul>
          </div>
          <Link href="/admin/catalog?filter=unlinked" className="adm-btn primary" style={{ minHeight: 44 }}>
            Store items without a title
          </Link>
          <p className="adm-muted" style={{ margin: 0, fontSize: 12 }}>
            Store items joined into titles by the daily link-titles job.
          </p>
        </div>
      </section>

      <section className="adm-card">
        <div className="adm-card-head">
          <h2>Latest job runs</h2>
          <Link href="/admin/jobs" style={{ fontWeight: 600, textDecoration: "none" }}>Open jobs →</Link>
        </div>
        <RunsTable runs={recent} />
      </section>
    </>
  );
}

function RunsTable({ runs }: { runs: JobRun[] }) {
  if (!runs.length) return <p className="adm-empty">No runs yet.</p>;
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead><tr><th scope="col">Job</th><th scope="col">Started</th><th scope="col">Duration</th><th scope="col">Result</th><th scope="col">Summary</th></tr></thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/admin/jobs?run=${r.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>{r.job}</Link><small>{r.trigger === "manual" ? `by ${r.requested_by ?? "hand"}` : "scheduled"}</small></td>
              <td>{time(r.started_at ?? r.queued_at)}</td>
              <td>{r.started_at ? duration(r.started_at, r.finished_at) : "—"}</td>
              <td><RunStatus status={r.status} /></td>
              <td className="adm-muted" style={{ maxWidth: 520, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.summary ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
