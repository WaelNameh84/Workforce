import type { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";

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
    req.user = payload as { userId: number; email: string; role: string };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
