import { Router } from "express";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "@workspace/db";
import { users, companies, employees } from "@workspace/db";
import { eq } from "drizzle-orm";
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

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Find linked employee record
    let employeeId: number | null = user.employeeId || null;
    if (!employeeId && user.companyId) {
      const [emp] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.email, user.email))
        .limit(1);
      if (emp) employeeId = emp.id;
    }

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

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: company.id,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
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

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      companyId: user.companyId,
    });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
