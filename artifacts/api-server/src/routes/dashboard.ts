import { Router } from "express";
import { db } from "@workspace/db";
import { employees, attendance, leaves, requests, payroll, users } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/dashboard/stats
router.get("/dashboard/stats", authMiddleware, async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ error: "Company ID required" });
      return;
    }
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    if (!account?.companyId) {
      res.status(400).json({ error: "A company is required" });
      return;
    }
    if (companyId !== account.companyId) {
      res.status(403).json({ error: "You can only access your company dashboard" });
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const [totalEmp] = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.companyId, companyId));

    const [presentToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          eq(attendance.date, today),
          eq(attendance.status, "present"),
        ),
      );

    const [onLeave] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leaves)
      .innerJoin(employees, eq(leaves.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          lte(leaves.startDate, today),
          gte(leaves.endDate, today),
          eq(leaves.status, "approved"),
        ),
      );

    const [pendingReqs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .innerJoin(employees, eq(requests.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          eq(requests.status, "pending"),
        ),
      );

    const currentMonth = new Date().toISOString().slice(0, 7);
    const [monthlyPay] = await db
      .select({ total: sql<number>`coalesce(sum(net_salary), 0)` })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          eq(payroll.period, currentMonth),
        ),
      );

    // Last 7 days attendance
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const recentAttendance = await db
      .select({
        date: attendance.date,
        present: sql<number>`count(*) filter (where ${attendance.status} = 'present')`,
        absent: sql<number>`count(*) filter (where ${attendance.status} = 'absent')`,
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          gte(attendance.date, sevenDaysAgo),
        ),
      )
      .groupBy(attendance.date)
      .orderBy(attendance.date);

    // Department stats
    const deptStats = await db
      .select({
        department: sql<string>`coalesce(d.name, 'Unknown')`,
        count: sql<number>`count(*)`,
      })
      .from(employees)
      .leftJoin(
        sql`departments d`,
        sql`${employees.departmentId} = d.id`,
      )
      .where(eq(employees.companyId, companyId))
      .groupBy(sql`d.name`);

    res.json({
      totalEmployees: Number(totalEmp?.count ?? 0),
      presentToday: Number(presentToday?.count ?? 0),
      onLeave: Number(onLeave?.count ?? 0),
      pendingRequests: Number(pendingReqs?.count ?? 0),
      monthlyPayroll: Number(monthlyPay?.total ?? 0),
      recentAttendance,
      departmentStats: deptStats,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
