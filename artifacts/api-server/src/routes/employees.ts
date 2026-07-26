import { Router } from "express";
import { db } from "@workspace/db";
import { employees, departments } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/employees
router.get("/employees", authMiddleware, async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string);
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;

    const rows = await db
      .select({
        id: employees.id,
        companyId: employees.companyId,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        email: employees.email,
        phone: employees.phone,
        position: employees.position,
        salary: employees.salary,
        joinDate: employees.joinDate,
        gender: employees.gender,
        contractType: employees.contractType,
        managerName: employees.managerName,
        workStart: employees.workStart,
        workEnd: employees.workEnd,
        workDays: employees.workDays,
        status: employees.status,
        avatar: employees.avatar,
        address: employees.address,
        notes: employees.notes,
        createdAt: employees.createdAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          search ? ilike(employees.fullName, `%${search}%`) : undefined,
          status ? eq(employees.status, status) : undefined,
          departmentId ? eq(employees.departmentId, departmentId) : undefined,
        ),
      )
      .orderBy(employees.createdAt);

    res.json({ employees: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Get employees error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/employees
router.post("/employees", authMiddleware, async (req, res) => {
  try {
    const { companyId, ...rest } = req.body;
    const [emp] = await db
      .insert(employees)
      .values({ companyId: companyId || req.body.companyId, ...rest })
      .returning();
    res.status(201).json(emp);
  } catch (err) {
    req.log.error({ err }, "Create employee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/employees/:id
router.get("/employees/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [emp] = await db
      .select({
        id: employees.id,
        companyId: employees.companyId,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        email: employees.email,
        phone: employees.phone,
        position: employees.position,
        salary: employees.salary,
        joinDate: employees.joinDate,
        gender: employees.gender,
        contractType: employees.contractType,
        managerName: employees.managerName,
        workStart: employees.workStart,
        workEnd: employees.workEnd,
        workDays: employees.workDays,
        status: employees.status,
        avatar: employees.avatar,
        address: employees.address,
        notes: employees.notes,
        createdAt: employees.createdAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(eq(employees.id, id));

    if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
    res.json(emp);
  } catch (err) {
    req.log.error({ err }, "Get employee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/employees/:id
router.put("/employees/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [emp] = await db
      .update(employees)
      .set(req.body)
      .where(eq(employees.id, id))
      .returning();
    res.json(emp);
  } catch (err) {
    req.log.error({ err }, "Update employee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/employees/:id
router.delete("/employees/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    await db.delete(employees).where(eq(employees.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete employee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
