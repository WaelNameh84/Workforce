import { Router } from "express";
import { db } from "@workspace/db";
import { locations } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/locations
router.get("/locations", authMiddleware, async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string);
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

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
    const [loc] = await db
      .insert(locations)
      .values(req.body)
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
    const id = parseInt(req.params.id as string);
    await db.delete(locations).where(eq(locations.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete location error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
