import { Router } from "express";
import { db } from "@workspace/db";
import { schedules, employees } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/schedules
router.get("/schedules", authMiddleware, async (req, res) => {
  try {
    const requestedCompanyId = parseInt(req.query.companyId as string);
    const companyId = req.user?.companyId;
    if (!companyId || !requestedCompanyId) { res.status(400).json({ error: "companyId required" }); return; }
    if (requestedCompanyId !== companyId) { res.status(403).json({ error: "You can only access your company schedules" }); return; }

    // Employees can only see their own schedule
    let employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    if (req.user?.role === "employee" && req.user.employeeId) {
      employeeId = req.user.employeeId;
    }
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const rows = await db
      .select({
        id: schedules.id,
        employeeId: schedules.employeeId,
        employeeName: employees.fullName,
        date: schedules.date,
        shiftType: schedules.shiftType,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        isRemote: schedules.isRemote,
        notes: schedules.notes,
        createdAt: schedules.createdAt,
      })
      .from(schedules)
      .innerJoin(employees, eq(schedules.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          employeeId ? eq(schedules.employeeId, employeeId) : undefined,
          startDate ? gte(schedules.date, startDate) : undefined,
          endDate ? lte(schedules.date, endDate) : undefined,
        ),
      )
      .orderBy(schedules.date);

    res.json({ schedules: rows });
  } catch (err) {
    req.log.error({ err }, "Get schedules error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/schedules
router.post("/schedules", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const companyId = req.user?.companyId;
    const employeeId = Number(req.body?.employeeId);
    if (!companyId || !Number.isInteger(employeeId)) { res.status(400).json({ error: "A valid employee is required" }); return; }
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)))
      .limit(1);
    if (!employee) { res.status(404).json({ error: "Employee not found" }); return; }
    const { employeeId: _ignoredEmployeeId, ...input } = req.body ?? {};
    const [schedule] = await db.insert(schedules).values({ ...input, employeeId }).returning();
    res.status(201).json(schedule);
  } catch (err) {
    req.log.error({ err }, "Create schedule error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
