import { Router } from "express";
import { db } from "@workspace/db";
import { leaves, employees } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/leaves
router.get("/leaves", authMiddleware, async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string);
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    // Employees can only see their own leaves
    let employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    if (req.user?.role === "employee" && req.user.employeeId) {
      employeeId = req.user.employeeId;
    }
    const status = req.query.status as string | undefined;

    const rows = await db
      .select({
        id: leaves.id,
        employeeId: leaves.employeeId,
        employeeName: employees.fullName,
        type: leaves.type,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        daysCount: leaves.daysCount,
        reason: leaves.reason,
        status: leaves.status,
        approvedBy: leaves.approvedBy,
        approvedAt: leaves.approvedAt,
        createdAt: leaves.createdAt,
      })
      .from(leaves)
      .innerJoin(employees, eq(leaves.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          employeeId ? eq(leaves.employeeId, employeeId) : undefined,
          status ? eq(leaves.status, status) : undefined,
        ),
      )
      .orderBy(leaves.createdAt);

    res.json({ leaves: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Get leaves error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/leaves
router.post("/leaves", authMiddleware, async (req, res) => {
  try {
    const [leave] = await db.insert(leaves).values(req.body).returning();
    res.status(201).json(leave);
  } catch (err) {
    req.log.error({ err }, "Create leave error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/leaves/:id
router.put("/leaves/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const updates: Record<string, unknown> = { ...req.body };
    if (req.body.status === "approved" || req.body.status === "rejected") {
      updates.approvedAt = new Date();
    }
    const [leave] = await db
      .update(leaves)
      .set(updates)
      .where(eq(leaves.id, id))
      .returning();
    res.json(leave);
  } catch (err) {
    req.log.error({ err }, "Update leave error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/leaves/:id
router.delete("/leaves/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    await db.delete(leaves).where(eq(leaves.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete leave error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
