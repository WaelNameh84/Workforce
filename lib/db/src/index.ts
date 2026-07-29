import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Accept either DATABASE_URL (standard) or RENDER_DB_URL (Render secret name)
const _resolvedDbUrl =
  process.env.DATABASE_URL || process.env.RENDER_DB_URL || "";

if (!_resolvedDbUrl) {
  throw new Error(
    "DATABASE_URL (or RENDER_DB_URL) must be set. Did you forget to provision a database?",
  );
}

// Normalise: always expose as DATABASE_URL so downstream libs (drizzle-kit, etc.) work
process.env.DATABASE_URL = _resolvedDbUrl;

// SSL rules:
// - localhost / 127.0.0.1 → no SSL (local dev)
// - *.internal (Render private network) → no SSL (same-region private link)
// - everything else (Render external URL, Supabase, Neon, etc.) → SSL, no cert check
const _dbUrl = _resolvedDbUrl;
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
