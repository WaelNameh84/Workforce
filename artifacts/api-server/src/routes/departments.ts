import { Router } from "express";
import { db } from "@workspace/db";
import { departments, users } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/departments
router.get("/departments", authMiddleware, async (req, res) => {
  try {
    const requestedCompanyId = parseInt(req.query.companyId as string);
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    const companyId = account?.companyId;
    if (!companyId || !requestedCompanyId) { res.status(400).json({ error: "companyId required" }); return; }
    if (requestedCompanyId !== companyId) { res.status(403).json({ error: "You can only access your company departments" }); return; }

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
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    if (!account?.companyId) { res.status(400).json({ error: "A company is required" }); return; }
    const { companyId: _ignored, ...input } = req.body ?? {};
    const [dept] = await db
      .insert(departments)
      .values({ ...input, companyId: account.companyId })
      .returning();
    res.status(201).json(dept);
  } catch (err) {
    req.log.error({ err }, "Create department error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/departments/:id
router.delete("/departments/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const id = parseInt(req.params.id as string);
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    if (!account?.companyId) { res.status(400).json({ error: "A company is required" }); return; }
    await db.delete(departments).where(and(eq(departments.id, id), eq(departments.companyId, account.companyId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete department error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
