import "server-only";
import knex, { type Knex } from "knex";

// The admin's direct connection to Postgres (DATABASE_URL), shared across requests.
const globalForDb = globalThis as unknown as { adminDb?: Knex };

export function db(): Knex {
  if (!globalForDb.adminDb) {
    const connection = process.env.DATABASE_URL;
    if (!connection) throw new Error("DATABASE_URL must be set for the admin");
    globalForDb.adminDb = knex({ client: "pg", connection, pool: { min: 0, max: 5 } });
  }
  return globalForDb.adminDb;
}
