import type { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db, users } from "@workspace/db";

export interface AuthUser {
  userId: number;
  email: string;
  role: string;
  employeeId?: number | null;
  companyId?: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "workforce-secret-key-change-in-production",
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = typeof payload.userId === "number" ? payload.userId : Number(payload.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const [account] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        employeeId: users.employeeId,
        companyId: users.companyId,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!account || !account.isActive) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Hydrate claims from the current account so older tokens cannot retain
    // stale role, company, or employee ownership data.
    req.user = {
      userId: account.id,
      email: account.email,
      role: account.role,
      employeeId: account.employeeId,
      companyId: account.companyId,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
