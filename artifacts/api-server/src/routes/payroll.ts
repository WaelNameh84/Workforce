import { Router } from "express";
import { db } from "@workspace/db";
import { payroll, employees } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/payroll
router.get("/payroll", authMiddleware, async (req, res) => {
  try {
    const requestedCompanyId = parseInt(req.query.companyId as string);
    const companyId = req.user?.companyId;
    if (!companyId || !requestedCompanyId) { res.status(400).json({ error: "companyId required" }); return; }
    if (requestedCompanyId !== companyId) { res.status(403).json({ error: "You can only access your company payroll" }); return; }

    const period = req.query.period as string | undefined;
    // Employees can only see their own payroll
    let employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    if (req.user?.role === "employee" && req.user.employeeId) {
      employeeId = req.user.employeeId;
    }

    const rows = await db
      .select({
        id: payroll.id,
        employeeId: payroll.employeeId,
        employeeName: employees.fullName,
        period: payroll.period,
        basicSalary: payroll.basicSalary,
        overtime: payroll.overtime,
        bonus: payroll.bonus,
        deductions: payroll.deductions,
        tax: payroll.tax,
        netSalary: payroll.netSalary,
        status: payroll.status,
        paidAt: payroll.paidAt,
        createdAt: payroll.createdAt,
      })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          period ? eq(payroll.period, period) : undefined,
          employeeId ? eq(payroll.employeeId, employeeId) : undefined,
        ),
      )
      .orderBy(payroll.period);

    res.json({ payroll: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Get payroll error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/payroll/:id
router.put("/payroll/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const id = parseInt(String(req.params.id), 10);
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }
    const { employeeId: _ignoredEmployeeId, ...updates } = req.body ?? {};
    if (req.body.status === "paid") {
      updates.paidAt = new Date();
    }
    const [ownedPayroll] = await db
      .select({ id: payroll.id })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .where(and(eq(payroll.id, id), eq(employees.companyId, companyId)))
      .limit(1);
    if (!ownedPayroll) { res.status(404).json({ error: "Payroll record not found" }); return; }
    const [record] = await db
      .update(payroll)
      .set(updates)
      .where(eq(payroll.id, id))
      .returning();
    if (!record) { res.status(404).json({ error: "Payroll record not found" }); return; }
    res.json(record);
  } catch (err) {
    req.log.error({ err }, "Update payroll error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
