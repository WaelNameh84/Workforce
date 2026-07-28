import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// SSL rules:
// - localhost / 127.0.0.1 → no SSL (local dev)
// - *.internal (Render private network) → no SSL (same-region private link)
// - everything else (Render external URL, Supabase, Neon, etc.) → SSL, no cert check
const _dbUrl = process.env.DATABASE_URL ?? "";
const _noSsl =
  _dbUrl.includes("localhost") ||
  _dbUrl.includes("127.0.0.1") ||
  _dbUrl.includes(".internal");
const sslConfig = _noSsl ? undefined : { rejectUnauthorized: false };

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
