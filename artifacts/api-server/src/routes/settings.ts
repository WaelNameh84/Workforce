import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { db } from "@workspace/db";
import { companies } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /api/settings
 * Returns the company-wide AppSettings for the caller's companyId.
 * All roles can read settings (employees need logo/welcome too).
 */
router.get("/settings", authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const companyId = user?.companyId;
  if (!companyId) {
    res.status(400).json({ error: "No company associated with this account" });
    return;
  }

  const [company] = await db
    .select({ appSettings: companies.appSettings })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json({ settings: company.appSettings ?? null });
});

/**
 * PUT /api/settings
 * Persists the full AppSettings JSON for the company.
 * Only admin/manager roles can update.
 */
router.put("/settings", authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const companyId = user?.companyId;

  if (!companyId) {
    res.status(400).json({ error: "No company associated with this account" });
    return;
  }

  if (user?.role !== "admin" && user?.role !== "manager") {
    res.status(403).json({ error: "Only admin or manager can update settings" });
    return;
  }

  const { settings } = req.body as { settings: Record<string, unknown> };
  if (!settings || typeof settings !== "object") {
    res.status(400).json({ error: "settings object required" });
    return;
  }

  await db
    .update(companies)
    .set({ appSettings: settings })
    .where(eq(companies.id, companyId));

  res.json({ ok: true });
});

export default router;
