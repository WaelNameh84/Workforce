import { Router } from "express";
import { db } from "@workspace/db";
import { requests, employees } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/requests
router.get("/requests", authMiddleware, async (req, res) => {
  try {
    const requestedCompanyId = parseInt(req.query.companyId as string);
    const companyId = req.user?.companyId;
    if (!companyId || !requestedCompanyId) { res.status(400).json({ error: "companyId required" }); return; }
    if (requestedCompanyId !== companyId) { res.status(403).json({ error: "You can only access your company requests" }); return; }

    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    // Employees can only see their own requests
    let filterEmployeeId: number | undefined;
    if (req.user?.role === "employee" && req.user.employeeId) {
      filterEmployeeId = req.user.employeeId;
    }

    const rows = await db
      .select({
        id: requests.id,
        employeeId: requests.employeeId,
        employeeName: employees.fullName,
        type: requests.type,
        title: requests.title,
        description: requests.description,
        reason: requests.reason,
        amount: requests.amount,
        installments: requests.installments,
        status: requests.status,
        paymentStatus: requests.paymentStatus,
        approvedBy: requests.approvedBy,
        approvedAt: requests.approvedAt,
        createdAt: requests.createdAt,
      })
      .from(requests)
      .innerJoin(employees, eq(requests.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          filterEmployeeId ? eq(requests.employeeId, filterEmployeeId) : undefined,
          status ? eq(requests.status, status) : undefined,
          type ? eq(requests.type, type) : undefined,
        ),
      )
      .orderBy(requests.createdAt);

    res.json({ requests: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Get requests error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/requests
router.post("/requests", authMiddleware, async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = Number(req.body?.employeeId);
    if (!companyId || !Number.isInteger(employeeId)) { res.status(400).json({ error: "A valid employee is required" }); return; }
    if (req.user?.role === "employee" && employeeId !== req.user.employeeId) {
      res.status(403).json({ error: "Employees can only create requests for themselves" });
      return;
    }
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)))
      .limit(1);
    if (!employee) { res.status(404).json({ error: "Employee not found" }); return; }
    const { employeeId: _ignoredEmployeeId, approvedBy: _ignoredApprovedBy, ...input } = req.body ?? {};
    const [request] = await db.insert(requests).values({ ...input, employeeId }).returning();
    res.status(201).json(request);
  } catch (err) {
    req.log.error({ err }, "Create request error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/requests/:id
router.put("/requests/:id", authMiddleware, async (req, res) => {
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
    const [ownedRequest] = await db
      .select({ id: requests.id })
      .from(requests)
      .innerJoin(employees, eq(requests.employeeId, employees.id))
      .where(and(eq(requests.id, id), eq(employees.companyId, companyId)))
      .limit(1);
    if (!ownedRequest) { res.status(404).json({ error: "Request not found" }); return; }
    const [request] = await db
      .update(requests)
      .set(updates)
      .where(eq(requests.id, id))
      .returning();
    if (!request) { res.status(404).json({ error: "Request not found" }); return; }
    res.json(request);
  } catch (err) {
    req.log.error({ err }, "Update request error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
