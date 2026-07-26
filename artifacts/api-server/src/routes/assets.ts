import { Router } from "express";
import { db } from "@workspace/db";
import { assets, employees } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/assets
router.get("/assets", authMiddleware, async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string);
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    const status = req.query.status as string | undefined;

    const rows = await db
      .select({
        id: assets.id,
        companyId: assets.companyId,
        name: assets.name,
        type: assets.type,
        serialNumber: assets.serialNumber,
        assignedTo: assets.assignedTo,
        assignedToName: employees.fullName,
        status: assets.status,
        purchaseDate: assets.purchaseDate,
        createdAt: assets.createdAt,
      })
      .from(assets)
      .leftJoin(employees, eq(assets.assignedTo, employees.id))
      .where(
        and(
          eq(assets.companyId, companyId),
          status ? eq(assets.status, status) : undefined,
        ),
      )
      .orderBy(assets.name);

    res.json({ assets: rows });
  } catch (err) {
    req.log.error({ err }, "Get assets error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/assets
router.post("/assets", authMiddleware, async (req, res) => {
  try {
    const [asset] = await db.insert(assets).values(req.body).returning();
    res.status(201).json(asset);
  } catch (err) {
    req.log.error({ err }, "Create asset error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/assets/:id
router.put("/assets/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [asset] = await db
      .update(assets)
      .set(req.body)
      .where(eq(assets.id, id))
      .returning();
    res.json(asset);
  } catch (err) {
    req.log.error({ err }, "Update asset error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/assets/:id
router.delete("/assets/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(assets).where(eq(assets.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete asset error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
