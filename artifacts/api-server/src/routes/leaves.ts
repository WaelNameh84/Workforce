import { Router } from "express";
import { db } from "@workspace/db";
import { leaves, employees } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/leaves
router.get("/leaves", authMiddleware, async (req, res) => {
  try {
    const requestedCompanyId = parseInt(req.query.companyId as string);
    const companyId = req.user?.companyId;
    if (!companyId || !requestedCompanyId) { res.status(400).json({ error: "companyId required" }); return; }
    if (requestedCompanyId !== companyId) { res.status(403).json({ error: "You can only access your company leaves" }); return; }

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
        paymentStatus: leaves.paymentStatus,
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
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }
    const requestedEmployeeId = Number(req.body?.employeeId);
    if (!Number.isInteger(requestedEmployeeId) || requestedEmployeeId <= 0) {
      res.status(400).json({ error: "A valid employee is required" });
      return;
    }
    if (req.user?.role === "employee" && requestedEmployeeId !== req.user.employeeId) {
      res.status(403).json({ error: "Employees can only create leave for themselves" });
      return;
    }
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.id, requestedEmployeeId), eq(employees.companyId, companyId)))
      .limit(1);
    if (!employee) { res.status(404).json({ error: "Employee not found" }); return; }
    const { employeeId: _ignoredEmployeeId, ...input } = req.body ?? {};
    const [leave] = await db.insert(leaves).values({ ...input, employeeId: requestedEmployeeId }).returning();
    res.status(201).json(leave);
  } catch (err) {
    req.log.error({ err }, "Create leave error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/leaves/:id
router.put("/leaves/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const id = parseInt(String(req.params.id), 10);
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }
    const { employeeId: _ignoredEmployeeId, approvedBy: _ignoredApprovedBy, ...updates } = req.body ?? {};
    if (req.body.status === "approved" || req.body.status === "rejected") {
      updates.approvedAt = new Date();
      updates.approvedBy = req.user?.userId ?? req.body.approvedBy;
      updates.paymentStatus = req.body.status === "approved"
        ? (req.body.paymentStatus === "unpaid" ? "unpaid" : "paid")
        : "pending";
    }
    const [ownedLeave] = await db
      .select({ id: leaves.id })
      .from(leaves)
      .innerJoin(employees, eq(leaves.employeeId, employees.id))
      .where(and(eq(leaves.id, id), eq(employees.companyId, companyId)))
      .limit(1);
    if (!ownedLeave) { res.status(404).json({ error: "Leave not found" }); return; }
    const [leave] = await db
      .update(leaves)
      .set(updates)
      .where(eq(leaves.id, id))
      .returning();
    if (!leave) { res.status(404).json({ error: "Leave not found" }); return; }
    res.json(leave);
  } catch (err) {
    req.log.error({ err }, "Update leave error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/leaves/:id
router.delete("/leaves/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const id = parseInt(String(req.params.id), 10);
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }
    const owned = await db
      .select({ id: leaves.id })
      .from(leaves)
      .innerJoin(employees, eq(leaves.employeeId, employees.id))
      .where(and(eq(leaves.id, id), eq(employees.companyId, companyId)))
      .limit(1);
    if (!owned[0]) { res.status(404).json({ error: "Leave not found" }); return; }
    await db.delete(leaves).where(eq(leaves.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete leave error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
