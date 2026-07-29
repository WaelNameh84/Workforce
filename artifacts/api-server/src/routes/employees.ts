import { Router } from "express";
import { db } from "@workspace/db";
import { employees, departments, users } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /api/employees/pending  — list employees awaiting manager approval
router.get("/employees/pending", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    const rows = await db
      .select({
        userId: users.id,
        employeeId: employees.id,
        fullName: users.fullName,
        email: users.email,
        position: employees.position,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(employees, eq(employees.userId, users.id))
      .where(
        and(
          eq(users.companyId, companyId),
          eq(users.isActive, false),
        ),
      )
      .orderBy(users.createdAt);

    res.json({ pending: rows });
  } catch (err) {
    req.log.error({ err }, "Get pending employees error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/employees/pending/:userId/approve
router.post("/employees/pending/:userId/approve", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const userId = parseInt(String(req.params.userId), 10);
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    // Verify the user belongs to this company
    const [target] = await db
      .select({ id: users.id, employeeId: users.employeeId })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.companyId, companyId), eq(users.isActive, false)))
      .limit(1);

    if (!target) { res.status(404).json({ error: "Pending user not found" }); return; }

    // Activate the user account
    await db.update(users).set({ isActive: true }).where(eq(users.id, userId));

    // Activate the employee profile
    if (target.employeeId) {
      await db.update(employees).set({ status: "active" }).where(eq(employees.id, target.employeeId));
    }

    res.json({ message: "approved" });
  } catch (err) {
    req.log.error({ err }, "Approve employee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/employees/pending/:userId  — reject / remove pending request
router.delete("/employees/pending/:userId", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const userId = parseInt(String(req.params.userId), 10);
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ error: "companyId required" }); return; }

    const [target] = await db
      .select({ id: users.id, employeeId: users.employeeId })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.companyId, companyId), eq(users.isActive, false)))
      .limit(1);

    if (!target) { res.status(404).json({ error: "Pending user not found" }); return; }

    // Delete employee profile first (FK dependency)
    if (target.employeeId) {
      await db.delete(employees).where(eq(employees.id, target.employeeId));
    }
    await db.delete(users).where(eq(users.id, userId));

    res.json({ message: "rejected" });
  } catch (err) {
    req.log.error({ err }, "Reject employee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/employees
router.get("/employees", authMiddleware, async (req, res) => {
  try {
    const requestedCompanyId = parseInt(req.query.companyId as string);
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    const companyId = account?.companyId;
    if (!companyId || !requestedCompanyId) { res.status(400).json({ error: "companyId required" }); return; }
    if (requestedCompanyId !== companyId) { res.status(403).json({ error: "You can only access your company employees" }); return; }

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
        breakMin: employees.breakMin,
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
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    // Prefer the authenticated token, but recover the company for tokens issued
    // before companyId was included in the registration response.
    let companyId = req.user?.companyId ?? undefined;
    if (!companyId && req.user?.userId) {
      const [account] = await db
        .select({ companyId: users.companyId })
        .from(users)
        .where(eq(users.id, req.user.userId))
        .limit(1);
      companyId = account?.companyId ?? undefined;
    }
    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }
    const { companyId: _ignored, employeeCode: requestedEmployeeCode, ...rest } = req.body;
    const employeeCode =
      typeof requestedEmployeeCode === "string" && requestedEmployeeCode.trim()
        ? requestedEmployeeCode.trim()
        : `EMP-${Date.now().toString(36).toUpperCase()}`;
    const [emp] = await db
      .insert(employees)
      .values({ companyId, employeeCode, ...rest })
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
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
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
        breakMin: employees.breakMin,
        workDays: employees.workDays,
        status: employees.status,
        avatar: employees.avatar,
        address: employees.address,
        notes: employees.notes,
        createdAt: employees.createdAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(and(eq(employees.id, id), account?.companyId ? eq(employees.companyId, account.companyId) : undefined));

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
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const id = parseInt(String(req.params.id), 10);
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    if (!account?.companyId) { res.status(400).json({ error: "A company is required" }); return; }
    const { companyId: _ignored, userId: _ignoredUserId, ...updates } = req.body ?? {};
    const [emp] = await db
      .update(employees)
      .set(updates)
      .where(and(eq(employees.id, id), eq(employees.companyId, account.companyId)))
      .returning();
    res.json(emp);
  } catch (err) {
    req.log.error({ err }, "Update employee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/employees/purge-user-by-email — admin only, cleans up orphaned user records
// NOTE: must be registered BEFORE /employees/:id to avoid `:id` capturing this path
router.delete("/employees/purge-user-by-email", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "email required" }); return; }

    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    if (!account?.companyId) { res.status(400).json({ error: "A company is required" }); return; }

    // Find the user with this email in the same company
    const [target] = await db
      .select({ id: users.id, employeeId: users.employeeId })
      .from(users)
      .where(and(eq(users.email, email), eq(users.companyId, account.companyId)))
      .limit(1);

    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Delete linked employee record if any
    if (target.employeeId) {
      await db.delete(employees).where(eq(employees.id, target.employeeId));
    }
    // Delete the user
    await db.delete(users).where(eq(users.id, target.id));

    res.json({ message: "User and linked employee record deleted", email });
  } catch (err) {
    req.log.error({ err }, "Purge user by email error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/employees/:id
router.delete("/employees/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }
    const id = parseInt(String(req.params.id), 10);
    const [account] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);
    if (!account?.companyId) { res.status(400).json({ error: "A company is required" }); return; }

    // Fetch the employee to get the linked userId before deleting
    const [emp] = await db
      .select({ userId: employees.userId })
      .from(employees)
      .where(and(eq(employees.id, id), eq(employees.companyId, account.companyId)))
      .limit(1);

    // Delete employee record first (to avoid FK constraint issues)
    await db.delete(employees).where(and(eq(employees.id, id), eq(employees.companyId, account.companyId)));

    // Also delete the linked user account so the email can be reused
    if (emp?.userId) {
      await db.delete(users).where(eq(users.id, emp.userId));
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete employee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
