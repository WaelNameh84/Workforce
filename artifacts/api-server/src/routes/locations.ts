import { Router } from "express";
import { db } from "@workspace/db";
import { locations } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { users } from "@workspace/db";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

async function getCompanyId(req: Parameters<typeof authMiddleware>[0]) {
  if (!req.user?.userId) return null;
  const [account] = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, req.user.userId))
    .limit(1);
  return account?.companyId ?? null;
}

function isAdmin(req: Parameters<typeof authMiddleware>[0]) {
  return req.user?.role === "admin" || req.user?.role === "manager";
}

// GET /api/locations
router.get("/locations", authMiddleware, async (req, res) => {
  try {
    const requestedCompanyId = parseInt(req.query.companyId as string);
    const companyId = await getCompanyId(req);
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }
    if (requestedCompanyId && requestedCompanyId !== companyId) {
      res.status(403).json({ error: "You can only access locations for your company" });
      return;
    }

    const rows = await db
      .select()
      .from(locations)
      .where(eq(locations.companyId, companyId))
      .orderBy(locations.name);

    res.json({ locations: rows });
  } catch (err) {
    req.log.error({ err }, "Get locations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/locations
router.post("/locations", authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const companyId = await getCompanyId(req);
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }
    const { companyId: _ignored, ...input } = req.body ?? {};
    const [loc] = await db
      .insert(locations)
      .values({ ...input, companyId })
      .returning();
    res.status(201).json(loc);
  } catch (err) {
    req.log.error({ err }, "Create location error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/locations/:id
router.delete("/locations/:id", authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const id = parseInt(req.params.id as string);
    const companyId = await getCompanyId(req);
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }
    await db.delete(locations).where(
      and(eq(locations.id, id), eq(locations.companyId, companyId)),
    );
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete location error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
