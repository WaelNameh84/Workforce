import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { db } from "@workspace/db";
import { companies } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /api/settings/public
 * Returns the company-wide public display fields (logo, appName, welcomeMsg,
 * splash config, accent colour) WITHOUT requiring authentication.
 * Used by the splash screen and login page before a token is available.
 * Returns settings from the first company found (single-tenant deployment).
 */
router.get("/settings/public", async (_req, res) => {
  const [company] = await db
    .select({ appSettings: companies.appSettings })
    .from(companies)
    .limit(1);

  if (!company?.appSettings) {
    res.json({ settings: null });
    return;
  }

  // Only expose visual/display fields — no sensitive config
  const s = company.appSettings as Record<string, unknown>;
  const publicFields: Record<string, unknown> = {};
  const ALLOWED = [
    "appName", "welcomeMsg", "companyName", "logoUrl", "iconUrl",
    "splashUrl", "appColor", "splashTheme", "splashDuration",
    "splashShowLogo", "splashShowName", "splashShowProgress",
    "loginCardStyle", "loginCardGradientFrom", "loginCardGradientTo",
    "loginCardRadius", "loginBgType", "loginBgColor", "loginAccentColor",
    "loginPanelGradientFrom", "loginPanelGradientTo",
    "loginShowLogo", "loginShowClock", "loginShowStats",
    "fontFamily", "fontSize", "background",
  ];
  for (const key of ALLOWED) {
    if (key in s) publicFields[key] = s[key];
  }

  res.json({ settings: publicFields });
});

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
