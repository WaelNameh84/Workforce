import { Router } from "express";
import { db } from "@workspace/db";
import { requests, employees } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/requests
router.get("/requests", authMiddleware, async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string);
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

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
    const [request] = await db.insert(requests).values(req.body).returning();
    res.status(201).json(request);
  } catch (err) {
    req.log.error({ err }, "Create request error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/requests/:id
router.put("/requests/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const updates: Record<string, unknown> = { ...req.body };
    if (req.body.status === "approved" || req.body.status === "rejected") {
      updates.approvedAt = new Date();
      updates.approvedBy = req.user?.userId ?? req.body.approvedBy;
      updates.paymentStatus = req.body.status === "approved"
        ? (req.body.paymentStatus === "unpaid" ? "unpaid" : "paid")
        : "pending";
    }
    const [request] = await db
      .update(requests)
      .set(updates)
      .where(eq(requests.id, id))
      .returning();
    res.json(request);
  } catch (err) {
    req.log.error({ err }, "Update request error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
