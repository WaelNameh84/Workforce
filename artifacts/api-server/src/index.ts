import app from "./app";
import { logger } from "./lib/logger";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Run DB schema push on every startup so tables always exist on Render
if (process.env.DATABASE_URL) {
  try {
    logger.info("Running database schema sync…");
    // Resolve repo root (3 levels up from dist/index.mjs)
    const repoRoot = path.resolve(__dirname, "../../..");
    execSync("pnpm --filter @workspace/db run push --force", {
      cwd: repoRoot,
      stdio: "inherit",
      env: { ...process.env },
      timeout: 60_000,
    });
    logger.info("Database schema sync complete");
  } catch (err) {
    logger.warn({ err }, "Database schema sync failed — continuing anyway");
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
