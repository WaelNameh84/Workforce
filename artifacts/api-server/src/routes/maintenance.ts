import { Router } from "express";
import { db } from "@workspace/db";
import { users, employees } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router = Router();

/**
 * POST /api/admin/purge-emails
 * Master-key admin utility — deletes users (and linked employee records) by email.
 * Auth: X-Admin-Key header must match the SESSION_SECRET env variable.
 * Body: { emails: string[] }
 */
router.post("/admin/purge-emails", async (req, res) => {
  const masterKey = process.env.SESSION_SECRET;
  if (!masterKey) {
    res.status(503).json({ error: "SESSION_SECRET not configured" });
    return;
  }

  const provided = req.headers["x-admin-key"];
  if (provided !== masterKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { emails } = req.body;
  if (!Array.isArray(emails) || emails.length === 0) {
    res.status(400).json({ error: "emails array required" });
    return;
  }

  try {
    // Find the user records
    const found = await db
      .select({ id: users.id, email: users.email, employeeId: users.employeeId })
      .from(users)
      .where(inArray(users.email, emails));

    if (found.length === 0) {
      res.json({ deleted: [], notFound: emails });
      return;
    }

    const deleted: string[] = [];
    for (const u of found) {
      // Delete linked employee profile first
      if (u.employeeId) {
        await db.delete(employees).where(eq(employees.id, u.employeeId));
      }
      // Also delete any employee record linked by userId
      await db.delete(employees).where(eq(employees.userId, u.id));
      // Delete the user
      await db.delete(users).where(eq(users.id, u.id));
      deleted.push(u.email);
    }

    const notFound = emails.filter(e => !deleted.includes(e));
    res.json({ deleted, notFound });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
});

export default router;
