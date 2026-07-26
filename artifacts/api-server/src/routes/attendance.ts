import { Router } from "express";
import { db } from "@workspace/db";
import { attendance, employees } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/attendance
router.get("/attendance", authMiddleware, async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string);
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
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
    const { employeeId, location, method } = req.body;
    const today = new Date().toISOString().split("T")[0];

    // Check if already clocked in today
    const [existing] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)));

    if (existing) {
      // Update clock-in time
      const [updated] = await db
        .update(attendance)
        .set({ clockIn: new Date(), location, method, status: "present" })
        .where(eq(attendance.id, existing.id))
        .returning();
      res.json(updated);
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
    const { employeeId } = req.body;
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

// GET /api/attendance/today
router.get("/attendance/today", authMiddleware, async (req, res) => {
  try {
    const employeeId = parseInt(req.query.employeeId as string);
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
