import { Router } from "express";
import { db } from "@workspace/db";
import { attendance, employees, users } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

async function resolveEmployeeId(req: Parameters<typeof authMiddleware>[0], requestedEmployeeId?: unknown) {
  const authenticatedUserId = req.user?.userId;
  if (!authenticatedUserId) return null;

  const [account] = await db
    .select({
      employeeId: users.employeeId,
      companyId: users.companyId,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, authenticatedUserId))
    .limit(1);

  if (!account?.companyId) return null;
  if (account.employeeId) {
    const [linkedById] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(
        and(
          eq(employees.id, account.employeeId),
          eq(employees.companyId, account.companyId),
        ),
      )
      .limit(1);
    if (linkedById) return linkedById.id;
  }
  if (req.user?.employeeId && req.user.employeeId !== account.employeeId) {
    const [tokenEmployee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(
        and(
          eq(employees.id, req.user.employeeId),
          eq(employees.companyId, account.companyId),
        ),
      )
      .limit(1);
    if (tokenEmployee) return tokenEmployee.id;
  }

  const [linkedEmployee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.companyId, account.companyId), eq(employees.email, account.email)))
    .limit(1);
  if (linkedEmployee) return linkedEmployee.id;

  // Legacy accounts may not have an employee profile yet. Create one once so
  // attendance is always stored against a real employee row.
  const [profile] = await db
    .insert(employees)
    .values({
      companyId: account.companyId,
      employeeCode: `${account.role === "admin" ? "ADMIN" : "EMP"}-${authenticatedUserId}`,
      fullName: account.fullName,
      email: account.email,
      position: account.role === "admin" ? "Administrator" : "Employee",
      status: "active",
      userId: authenticatedUserId,
    })
    .returning({ id: employees.id });
  if (profile?.id) {
    await db
      .update(users)
      .set({ employeeId: profile.id })
      .where(eq(users.id, authenticatedUserId));
    return profile.id;
  }

  // Attendance mutations always belong to the authenticated account's
  // employee profile. Never trust a client-supplied employee id as an
  // ownership boundary.
  return null;
}

async function getAccount(req: Parameters<typeof authMiddleware>[0]) {
  if (!req.user?.userId) return null;
  const [account] = await db
    .select({
      companyId: users.companyId,
      employeeId: users.employeeId,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, req.user.userId))
    .limit(1);
  return account ?? null;
}

// GET /api/attendance
router.get("/attendance", authMiddleware, async (req, res) => {
  try {
    const requestedCompanyId = parseInt(req.query.companyId as string);
    const account = await getAccount(req);
    const companyId = account?.companyId ?? null;
    if (!companyId) { res.status(400).json({ error: "A company is required" }); return; }
    if (requestedCompanyId && requestedCompanyId !== companyId) {
      res.status(403).json({ error: "You can only access attendance for your company" });
      return;
    }

    // Employees can only see their own attendance
    let employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    if (account?.role === "employee" && account.employeeId) {
      employeeId = account.employeeId;
    }
    const date = req.query.date as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const rows = await db
      .select({
        id: attendance.id,
        employeeId: attendance.employeeId,
        employeeName: employees.fullName,
        date: attendance.date,
        clockIn: attendance.clockIn,
        clockOut: attendance.clockOut,
        totalHours: attendance.totalHours,
        location: attendance.location,
        method: attendance.method,
        status: attendance.status,
        isLate: attendance.isLate,
        notes: attendance.notes,
        justificationType: attendance.justificationType,
        justificationStatus: attendance.justificationStatus,
        paymentStatus: attendance.paymentStatus,
        justificationApprovedBy: attendance.justificationApprovedBy,
        justificationApprovedAt: attendance.justificationApprovedAt,
        createdAt: attendance.createdAt,
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          employeeId ? eq(attendance.employeeId, employeeId) : undefined,
          date ? eq(attendance.date, date) : undefined,
          startDate ? gte(attendance.date, startDate) : undefined,
          endDate ? lte(attendance.date, endDate) : undefined,
        ),
      )
      .orderBy(attendance.date);

    res.json({ attendance: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Get attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/attendance/clock-in
router.post("/attendance/clock-in", authMiddleware, async (req, res) => {
  try {
    const employeeId = await resolveEmployeeId(req, req.body.employeeId);
    const { location, method } = req.body;
    if (employeeId === null || !Number.isInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({ error: "A valid employee profile is required to record attendance" });
      return;
    }
    const today = new Date().toISOString().split("T")[0];

    // Check if already clocked in today
    const [existing] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)));

    if (existing) {
      if (existing.clockOut) {
        res.status(409).json({ error: "Attendance is already completed for today" });
      } else {
        res.status(409).json({ error: "Already clocked in for today" });
      }
      return;
    }

    // Create new attendance record
    const clockInTime = new Date();
    const workStart = new Date(`${today}T09:00:00`);
    const isLate = clockInTime > workStart;

    const [record] = await db
      .insert(attendance)
      .values({
        employeeId,
        date: today,
        clockIn: clockInTime,
        location,
        method,
        status: "present",
        isLate,
      })
      .returning();

    res.json(record);
  } catch (err) {
    req.log.error({ err }, "Clock in error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/attendance/clock-out
router.post("/attendance/clock-out", authMiddleware, async (req, res) => {
  try {
    const employeeId = await resolveEmployeeId(req, req.body.employeeId);
    if (employeeId === null || !Number.isInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({ error: "A valid employee profile is required to record attendance" });
      return;
    }
    const today = new Date().toISOString().split("T")[0];

    const [existing] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)));

    if (!existing) {
      res.status(404).json({ error: "No clock-in record found for today" });
      return;
    }

    const clockOut = new Date();
    const clockIn = existing.clockIn ? new Date(existing.clockIn) : clockOut;
    const totalMs = clockOut.getTime() - clockIn.getTime();
    const totalHours = (totalMs / (1000 * 60 * 60)).toFixed(2);

    if (existing.clockOut) {
      res.status(409).json({ error: "Attendance is already completed for today" });
      return;
    }

    if (!existing.clockIn) {
      res.status(409).json({ error: "No clock-in time found for today" });
      return;
    }

    const [updated] = await db
      .update(attendance)
      .set({ clockOut, totalHours })
      .where(eq(attendance.id, existing.id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Clock out error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/attendance/:id  (update justification / notes)
router.patch("/attendance/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { notes, status, justificationType, justificationStatus, paymentStatus } = req.body;

    const [updated] = await db
      .update(attendance)
      .set({
        ...(notes !== undefined ? { notes } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(justificationType !== undefined ? { justificationType } : {}),
        ...(justificationStatus !== undefined ? { justificationStatus } : {}),
        ...(paymentStatus !== undefined ? { paymentStatus } : {}),
        ...(justificationStatus === "approved" || justificationStatus === "rejected"
          ? {
              justificationApprovedBy: req.user?.userId,
              justificationApprovedAt: new Date(),
              paymentStatus: justificationStatus === "approved"
                ? (paymentStatus === "unpaid" ? "unpaid" : "paid")
                : "pending",
            }
          : {}),
      })
      .where(eq(attendance.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Patch attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/attendance/today
router.get("/attendance/today", authMiddleware, async (req, res) => {
  try {
    const employeeId = await resolveEmployeeId(req, req.query.employeeId);
    if (!employeeId) {
      res.json(null);
      return;
    }
    const today = new Date().toISOString().split("T")[0];

    const [record] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)));

    res.json(record || null);
  } catch (err) {
    req.log.error({ err }, "Today attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
