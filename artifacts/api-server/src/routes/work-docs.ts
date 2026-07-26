import { Router } from "express";
import { db } from "@workspace/db";
import { workDocs, employees, departments, users } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/work-docs
router.get("/work-docs", authMiddleware, async (req, res) => {
  try {
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    const companyId = account?.companyId;
    const requestedCompanyId = parseInt(req.query.companyId as string);
    if (!companyId || !requestedCompanyId || requestedCompanyId !== companyId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;

    const rows = await db
      .select({
        id: workDocs.id,
        companyId: workDocs.companyId,
        employeeId: workDocs.employeeId,
        employeeName: employees.fullName,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        attendanceId: workDocs.attendanceId,
        photoData: workDocs.photoData,
        photoName: workDocs.photoName,
        caption: workDocs.caption,
        uploadedBy: workDocs.uploadedBy,
        createdAt: workDocs.createdAt,
      })
      .from(workDocs)
      .leftJoin(employees, eq(workDocs.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(
        and(
          eq(workDocs.companyId, companyId),
          employeeId ? eq(workDocs.employeeId, employeeId) : undefined,
          departmentId ? eq(employees.departmentId, departmentId) : undefined,
        ),
      )
      .orderBy(workDocs.createdAt);

    res.json({ docs: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Get work-docs error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/work-docs
router.post("/work-docs", authMiddleware, async (req, res) => {
  try {
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    const companyId = account?.companyId;
    if (!companyId) {
      res.status(400).json({ error: "companyId required" });
      return;
    }
    const { photoData, employeeId, attendanceId, photoName, caption } = req.body;
    if (!photoData || !employeeId) {
      res.status(400).json({ error: "photoData and employeeId are required" });
      return;
    }
    const [doc] = await db
      .insert(workDocs)
      .values({
        companyId,
        employeeId: parseInt(String(employeeId)),
        attendanceId: attendanceId ? parseInt(String(attendanceId)) : null,
        photoData,
        photoName: photoName || null,
        caption: caption || null,
        uploadedBy: req.user!.userId,
      })
      .returning();
    res.status(201).json(doc);
  } catch (err) {
    req.log.error({ err }, "Create work-doc error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/work-docs/:id
router.delete("/work-docs/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    if (!account?.companyId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db
      .delete(workDocs)
      .where(and(eq(workDocs.id, id), eq(workDocs.companyId, account.companyId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete work-doc error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
