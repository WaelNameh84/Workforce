import { Router } from "express";
import { db } from "@workspace/db";
import { payroll, employees, departments } from "@workspace/db";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/payroll/stats
router.get("/payroll/stats", authMiddleware, async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    const period = req.query.period as string | undefined;
    const year   = req.query.year   ? parseInt(req.query.year as string) : undefined;

    // Build filter
    const rows = await db
      .select({
        basicSalary: payroll.basicSalary,
        grossSalary: payroll.grossSalary,
        netSalary:   payroll.netSalary,
        overtime:    payroll.overtime,
        overtimeHours: payroll.overtimeHours,
        bonus:       payroll.bonus,
        allowances:  payroll.allowances,
        totalDeductions: payroll.totalDeductions,
        tax:         payroll.tax,
        insurance:   payroll.insurance,
        workedHours: payroll.workedHours,
        status:      payroll.status,
        period:      payroll.period,
        companyId:   employees.companyId,
      })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          period ? eq(payroll.period, period) : undefined,
          year   ? gte(payroll.period, `${year}-01`) : undefined,
          year   ? lte(payroll.period, `${year}-12`) : undefined,
        ),
      );

    const n = (v: unknown) => Number(v || 0);
    const nets = rows.map(r => n(r.netSalary));
    const totalGross = rows.reduce((a, r) => a + n(r.grossSalary || r.basicSalary), 0);

    const stats = {
      period:             period || `${new Date().getFullYear()}`,
      totalBasicSalary:   rows.reduce((a, r) => a + n(r.basicSalary), 0),
      totalGross,
      totalNet:           rows.reduce((a, r) => a + n(r.netSalary), 0),
      totalOvertime:      rows.reduce((a, r) => a + n(r.overtime), 0),
      totalBonus:         rows.reduce((a, r) => a + n(r.bonus), 0),
      totalAllowances:    rows.reduce((a, r) => a + n(r.allowances), 0),
      totalDeductions:    rows.reduce((a, r) => a + n(r.totalDeductions || 0), 0),
      totalTax:           rows.reduce((a, r) => a + n(r.tax), 0),
      totalInsurance:     rows.reduce((a, r) => a + n(r.insurance), 0),
      averageSalary:      rows.length ? rows.reduce((a, r) => a + n(r.netSalary), 0) / rows.length : 0,
      maxSalary:          nets.length ? Math.max(...nets) : 0,
      minSalary:          nets.length ? Math.min(...nets) : 0,
      headcount:          rows.length,
      approvedCount:      rows.filter(r => r.status === 'approved').length,
      pendingCount:       rows.filter(r => !['approved','paid','locked'].includes(r.status || '')).length,
      paidCount:          rows.filter(r => r.status === 'paid').length,
      totalWorkedHours:   rows.reduce((a, r) => a + n(r.workedHours), 0),
      totalOvertimeHours: rows.reduce((a, r) => a + n(r.overtimeHours), 0),
    };

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Get payroll stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/payroll
router.get("/payroll", authMiddleware, async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    const period      = req.query.period     as string | undefined;
    const status      = req.query.status     as string | undefined;
    const contractType= req.query.contractType as string | undefined;
    const deptId      = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;

    let employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    if (req.user?.role === "employee" && req.user.employeeId) {
      employeeId = req.user.employeeId;
    }

    const rows = await db
      .select({
        id:           payroll.id,
        employeeId:   payroll.employeeId,
        employeeName: employees.fullName,
        departmentName: departments.name,
        period:       payroll.period,
        contractType: payroll.contractType,
        workDaysPerMonth: payroll.workDaysPerMonth,
        dailyHoursScheduled: payroll.dailyHoursScheduled,
        basicSalary:  payroll.basicSalary,
        dailyRate:    payroll.dailyRate,
        hourlyRate:   payroll.hourlyRate,
        minuteRate:   payroll.minuteRate,
        secondRate:   payroll.secondRate,
        workedDays:   payroll.workedDays,
        workedHours:  payroll.workedHours,
        workedMinutes:payroll.workedMinutes,
        workedSeconds:payroll.workedSeconds,
        absentDays:   payroll.absentDays,
        lateMinutes:  payroll.lateMinutes,
        earlyMinutes: payroll.earlyMinutes,
        overtimeHours:payroll.overtimeHours,
        overtimeRate: payroll.overtimeRate,
        overtime:     payroll.overtime,
        bonus:        payroll.bonus,
        allowances:   payroll.allowances,
        commissions:  payroll.commissions,
        grossSalary:  payroll.grossSalary,
        lateDeduction:payroll.lateDeduction,
        absenceDeduction: payroll.absenceDeduction,
        advances:     payroll.advances,
        fines:        payroll.fines,
        deductions:   payroll.deductions,
        tax:          payroll.tax,
        insurance:    payroll.insurance,
        totalEarnings:payroll.totalEarnings,
        totalDeductions: payroll.totalDeductions,
        netSalary:    payroll.netSalary,
        paidLeaveDays:payroll.paidLeaveDays,
        unpaidLeaveDays: payroll.unpaidLeaveDays,
        notes:        payroll.notes,
        status:       payroll.status,
        approvedBy:   payroll.approvedBy,
        approvedAt:   payroll.approvedAt,
        lockedAt:     payroll.lockedAt,
        paidAt:       payroll.paidAt,
        createdAt:    payroll.createdAt,
      })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          period       ? eq(payroll.period, period)               : undefined,
          employeeId   ? eq(payroll.employeeId, employeeId)       : undefined,
          status       ? eq(payroll.status, status)               : undefined,
          contractType ? eq(payroll.contractType, contractType)   : undefined,
          deptId       ? eq(employees.departmentId, deptId)       : undefined,
        ),
      )
      .orderBy(payroll.period);

    res.json({ payroll: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Get payroll error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/payroll  — create or upsert a payroll record
router.post("/payroll", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" }); return;
    }
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }

    const { employeeId, period, ...rest } = req.body ?? {};
    if (!employeeId || !period) {
      res.status(400).json({ error: "employeeId and period are required" }); return;
    }

    // Verify employee belongs to company
    const [emp] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)))
      .limit(1);
    if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }

    // Upsert: find existing or create new
    const [existing] = await db
      .select({ id: payroll.id, status: payroll.status })
      .from(payroll)
      .where(and(eq(payroll.employeeId, employeeId), eq(payroll.period, period)))
      .limit(1);

    if (existing) {
      // Don't allow editing locked payroll
      if (existing.status === 'locked') {
        res.status(409).json({ error: "Payroll is locked and cannot be modified" }); return;
      }
      const [updated] = await db
        .update(payroll)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(payroll.id, existing.id))
        .returning();
      res.status(200).json(updated);
    } else {
      const [created] = await db
        .insert(payroll)
        .values({ employeeId, period, ...rest })
        .returning();
      res.status(201).json(created);
    }
  } catch (err) {
    req.log.error({ err }, "Create payroll error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/payroll/:id
router.put("/payroll/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" }); return;
    }
    const id = parseInt(String(req.params.id), 10);
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }

    const [ownedPayroll] = await db
      .select({ id: payroll.id, status: payroll.status })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .where(and(eq(payroll.id, id), eq(employees.companyId, companyId)))
      .limit(1);
    if (!ownedPayroll) { res.status(404).json({ error: "Payroll record not found" }); return; }
    if (ownedPayroll.status === 'locked') {
      res.status(409).json({ error: "Payroll is locked and cannot be modified" }); return;
    }

    const { employeeId: _ignored, ...updates } = req.body ?? {};
    if (updates.status === "paid") updates.paidAt = new Date();

    const [record] = await db
      .update(payroll)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payroll.id, id))
      .returning();
    if (!record) { res.status(404).json({ error: "Payroll record not found" }); return; }
    res.json(record);
  } catch (err) {
    req.log.error({ err }, "Update payroll error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/payroll/:id/approve
router.post("/payroll/:id/approve", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" }); return;
    }
    const id = parseInt(String(req.params.id), 10);
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }

    const [ownedPayroll] = await db
      .select({ id: payroll.id, status: payroll.status })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .where(and(eq(payroll.id, id), eq(employees.companyId, companyId)))
      .limit(1);
    if (!ownedPayroll) { res.status(404).json({ error: "Payroll record not found" }); return; }
    if (ownedPayroll.status === 'locked') {
      res.status(409).json({ error: "Payroll is locked" }); return;
    }

    const approvedBy = req.body?.approvedBy ?? req.user?.userId;
    const [record] = await db
      .update(payroll)
      .set({ status: 'approved', approvedBy, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(payroll.id, id))
      .returning();
    res.json(record);
  } catch (err) {
    req.log.error({ err }, "Approve payroll error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/payroll/:id/lock
router.post("/payroll/:id/lock", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" }); return;
    }
    const id = parseInt(String(req.params.id), 10);
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }

    const [ownedPayroll] = await db
      .select({ id: payroll.id, status: payroll.status })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .where(and(eq(payroll.id, id), eq(employees.companyId, companyId)))
      .limit(1);
    if (!ownedPayroll) { res.status(404).json({ error: "Payroll record not found" }); return; }
    if (ownedPayroll.status !== 'approved' && ownedPayroll.status !== 'paid') {
      res.status(409).json({ error: "Payroll must be approved before locking" }); return;
    }

    const [record] = await db
      .update(payroll)
      .set({ status: 'locked', lockedAt: new Date(), updatedAt: new Date() })
      .where(eq(payroll.id, id))
      .returning();
    res.json(record);
  } catch (err) {
    req.log.error({ err }, "Lock payroll error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
