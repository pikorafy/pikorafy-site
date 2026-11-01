// Creates an admin user, or sets a new password for an existing one.
//
//   docker compose exec -it jobs node scripts/local/create-admin.mts <email> "<name>" [admin|editor]
//
// Asks for the password (hidden). Env: DATABASE_URL

import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import pg from "pg";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../../src/lib/admin/password.ts";
import { migrate } from "./migrate.mts";

const [emailArg, name, roleArg = "admin"] = process.argv.slice(2);
if (!emailArg || !name || !["admin", "editor"].includes(roleArg)) {
  console.error('Usage: create-admin.mts <email> "<name>" [admin|editor]');
  process.exit(1);
}
const email = emailArg.trim().toLowerCase();

/** Reads a line without echoing it. */
function askHidden(question: string): Promise<string> {
  let muted = false;
  const out = new Writable({ write(chunk, _enc, cb) { if (!muted) process.stdout.write(chunk); cb(); } });
  const rl = createInterface({ input: process.stdin, output: out, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); process.stdout.write("\n"); resolve(answer); });
    muted = true;
  });
}

const password = await askHidden(`Password for ${email} (at least ${MIN_PASSWORD_LENGTH} characters): `);
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Too short: use at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}
if (password !== await askHidden("Again: ")) {
  console.error("The two passwords don't match.");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL must be set");
await migrate(url);
const db = new pg.Client({ connectionString: url });
await db.connect();
const { rows } = await db.query(
  `insert into public.admin_users (email, name, password_hash, role) values ($1, $2, $3, $4)
   on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash, role = excluded.role
   returning (xmax = 0) as created`,
  [email, name, await hashPassword(password), roleArg],
);
await db.end();
console.log(rows[0].created ? `Created ${roleArg} ${email}.` : `Updated ${email} (new password, role ${roleArg}).`);
