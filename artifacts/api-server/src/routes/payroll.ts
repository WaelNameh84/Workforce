import { Router } from "express";
import { db } from "@workspace/db";
import { payroll, employees } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/payroll
router.get("/payroll", authMiddleware, async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string);
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    const period = req.query.period as string | undefined;
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;

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
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = { ...req.body };
    if (req.body.status === "paid") {
      updates.paidAt = new Date();
    }
    const [record] = await db
      .update(payroll)
      .set(updates)
      .where(eq(payroll.id, id))
      .returning();
    res.json(record);
  } catch (err) {
    req.log.error({ err }, "Update payroll error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
