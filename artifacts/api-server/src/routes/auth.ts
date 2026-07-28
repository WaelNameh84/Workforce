import { Router } from "express";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "@workspace/db";
import { users, companies, employees } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "workforce-secret-key-change-in-production",
  );

const signToken = async (payload: {
  userId: number;
  email: string;
  role: string;
  employeeId?: number | null;
  companyId?: number | null;
}) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());
};

async function resolveEmployeeProfile(user: typeof users.$inferSelect) {
  if (!user.companyId) return null;

  if (user.employeeId) {
    const [linked] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(
        and(
          eq(employees.id, user.employeeId),
          eq(employees.companyId, user.companyId),
        ),
      )
      .limit(1);
    if (linked) return linked.id;
  }

  const [byUserId] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(
      and(
        eq(employees.companyId, user.companyId),
        eq(employees.userId, user.id),
      ),
    )
    .limit(1);
  if (byUserId) return byUserId.id;

  const [byEmail] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(
      and(
        eq(employees.companyId, user.companyId),
        eq(employees.email, user.email),
      ),
    )
    .limit(1);
  if (byEmail) return byEmail.id;

  const [profile] = await db
    .insert(employees)
    .values({
      companyId: user.companyId,
      employeeCode: `${user.role === "admin" ? "ADMIN" : "EMP"}-${user.id}`,
      fullName: user.fullName,
      email: user.email,
      position: user.role === "admin" ? "Administrator" : "Employee",
      status: "active",
      userId: user.id,
    })
    .returning({ id: employees.id });

  return profile?.id ?? null;
}

async function syncEmployeeProfile(user: typeof users.$inferSelect) {
  const employeeId = await resolveEmployeeProfile(user);
  if (employeeId && user.employeeId !== employeeId) {
    await db.update(users).set({ employeeId }).where(eq(users.id, user.id));
  }
  return employeeId;
}

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "This account is inactive" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const employeeId = await syncEmployeeProfile(user);

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId,
      companyId: user.companyId,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        employeeId,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, fullName, company: companyName } = req.body;
    if (!email || !password || !fullName || !companyName) {
      res.status(400).json({ error: "All fields required" });
      return;
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const [company] = await db
      .insert(companies)
      .values({ name: companyName, country: "Global", currency: "USD", language: "en" })
      .returning();

    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        fullName,
        role: "admin",
        companyId: company.id,
        isActive: true,
      })
      .returning();

    const [employeeProfile] = await db
      .insert(employees)
      .values({
        companyId: company.id,
        employeeCode: `ADMIN-${user.id}`,
        fullName,
        email,
        position: "Administrator",
        status: "active",
        userId: user.id,
      })
      .returning({ id: employees.id });

    if (employeeProfile?.id) {
      await db
        .update(users)
        .set({ employeeId: employeeProfile.id })
        .where(eq(users.id, user.id));
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: company.id,
      employeeId: employeeProfile?.id ?? null,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        employeeId: employeeProfile?.id ?? null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// TEMPORARY - one-off cleanup for a diagnostic test account, safe to remove after use.
// Only ever matches the exact hardcoded probe email/company - cannot touch any other data.
router.post("/auth/_cleanup-probe-test", async (req, res) => {
  try {
    const probeEmail = "probe-test@example.com";
    const probeCompanyName = "Probe Co";

    const [user] = await db.select().from(users).where(eq(users.email, probeEmail)).limit(1);
    if (!user || !user.companyId) {
      res.json({ deleted: false, reason: "not found" });
      return;
    }

    const [company] = await db.select().from(companies).where(eq(companies.id, user.companyId)).limit(1);
    if (!company || company.name !== probeCompanyName) {
      res.json({ deleted: false, reason: "company name mismatch, refusing to delete" });
      return;
    }

    await db.delete(employees).where(eq(employees.companyId, company.id));
    await db.delete(users).where(eq(users.id, user.id));
    await db.delete(companies).where(eq(companies.id, company.id));

    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "Cleanup error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/auth/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ error: "This account is inactive" });
      return;
    }

    const employeeId = await syncEmployeeProfile(user);

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      companyId: user.companyId,
      employeeId,
    });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
