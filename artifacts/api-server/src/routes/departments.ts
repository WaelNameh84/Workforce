import { Router } from "express";
import { db } from "@workspace/db";
import { departments } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/departments
router.get("/departments", authMiddleware, async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string);
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    const rows = await db
      .select()
      .from(departments)
      .where(eq(departments.companyId, companyId))
      .orderBy(departments.name);

    res.json({ departments: rows });
  } catch (err) {
    req.log.error({ err }, "Get departments error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/departments
router.post("/departments", authMiddleware, async (req, res) => {
  try {
    const [dept] = await db
      .insert(departments)
      .values(req.body)
      .returning();
    res.status(201).json(dept);
  } catch (err) {
    req.log.error({ err }, "Create department error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
