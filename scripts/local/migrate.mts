// Applies db/migrations/*.sql to the local database, in name order, each once
// (tracked in public.schema_migrations). The worker runs this when it starts.
//
//   node scripts/local/migrate.mts        Env: DATABASE_URL

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const DIR = fileURLToPath(new URL("../../db/migrations/", import.meta.url));

export async function migrate(databaseUrl: string): Promise<string[]> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`create table if not exists public.schema_migrations (
      name text primary key, applied_at timestamptz not null default now())`);
    const done = new Set((await client.query("select name from public.schema_migrations")).rows.map((r) => r.name as string));
    const files = (await readdir(DIR)).filter((f) => f.endsWith(".sql")).sort();
    const applied: string[] = [];
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await readFile(DIR + file, "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into public.schema_migrations (name) values ($1)", [file]);
        await client.query("commit");
        applied.push(file);
      } catch (err) {
        await client.query("rollback");
        throw new Error(`${file}: ${(err as Error).message}`);
      }
    }
    return applied;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL must be set");
  const applied = await migrate(url);
  console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Database is up to date.");
}
