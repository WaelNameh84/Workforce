import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: true,          // reflect the request origin — allows all
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use("/api", router);

// Serve the frontend static files in production
// The frontend builds to artifacts/workforce/dist/public
// When running as node artifacts/api-server/dist/index.mjs, __dirname is
// <repo-root>/artifacts/api-server/dist — so we go up three levels to repo root.
const frontendDist = path.resolve(__dirname, "../../../artifacts/workforce/dist/public");

if (existsSync(frontendDist)) {
  /**
   * WorkforceOS is installed as a home-screen web app but intentionally does
   * not cache the application shell. These files must always be fresh so a
   * deploy cannot leave an iOS installation on an older interface.
   */
  app.use((req: Request, res: Response, next) => {
    const isPwaControlFile =
      req.path === "/" ||
      req.path === "/index.html" ||
      req.path === "/manifest.json" ||
      req.path === "/sw.js" ||
      /^\/workbox-[^/]+\.js$/.test(req.path) ||
      req.path === "/registerSW.js";

    if (isPwaControlFile) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }

    next();
  });

  app.use(express.static(frontendDist));
  // Catch-all: serve index.html for client-side routing (Express 5 syntax)
  app.get("/{*wildcard}", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  logger.warn({ frontendDist }, "Frontend dist not found — skipping static file serving");
}

export default app;
