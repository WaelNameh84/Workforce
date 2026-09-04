import { Router } from "express";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { db, pool } from "@workspace/db";
import { users, companies, employees } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ||
      "workforce-secret-key-change-in-production",
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

/* ============================================================
   EMPLOYEE PROFILE HELPERS
   ============================================================ */

async function resolveEmployeeProfile(
  user: typeof users.$inferSelect,
) {
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
      employeeCode: `${
        user.role === "admin" ? "ADMIN" : "EMP"
      }-${user.id}`,
      fullName: user.fullName,
      email: user.email,
      position:
        user.role === "admin"
          ? "Administrator"
          : "Employee",
      status: "active",
      userId: user.id,
    })
    .returning({ id: employees.id });

  return profile?.id ?? null;
}

async function syncEmployeeProfile(
  user: typeof users.$inferSelect,
) {
  const employeeId =
    await resolveEmployeeProfile(user);

  if (
    employeeId &&
    user.employeeId !== employeeId
  ) {
    await db
      .update(users)
      .set({ employeeId })
      .where(eq(users.id, user.id));
  }

  return employeeId;
}

/* ============================================================
   LOGIN
   POST /api/auth/login
   ============================================================ */

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: "Email and password required",
      });
      return;
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      res.status(401).json({
        error: "Invalid credentials",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        error: "pending_approval",
      });
      return;
    }

    const valid = await bcrypt.compare(
      String(password),
      user.password,
    );

    if (!valid) {
      res.status(401).json({
        error: "Invalid credentials",
      });
      return;
    }

    const employeeId =
      await syncEmployeeProfile(user);

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

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

/* ============================================================
   FIRST ADMIN SETUP
   POST /api/auth/setup-admin

   Creates:
   - First company
   - First admin user
   - Admin employee profile

   IMPORTANT:
   This endpoint works only when there is no admin.
   ============================================================ */

router.post(
  "/auth/setup-admin",
  async (req, res) => {
    const {
      companyName,
      fullName,
      email,
      password,
    } = req.body;

    if (
      !companyName ||
      !fullName ||
      !email ||
      !password
    ) {
      res.status(400).json({
        error:
          "companyName, fullName, email and password are required",
      });
      return;
    }

    const cleanCompanyName =
      String(companyName).trim();

    const cleanFullName =
      String(fullName).trim();

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const cleanPassword = String(password);

    if (cleanCompanyName.length < 2) {
      res.status(400).json({
        error: "Company name is too short",
      });
      return;
    }

    if (cleanFullName.length < 2) {
      res.status(400).json({
        error: "Full name is too short",
      });
      return;
    }

    if (cleanPassword.length < 8) {
      res.status(400).json({
        error:
          "Password must be at least 8 characters",
      });
      return;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /* --------------------------------------------------------
         SECURITY:
         Never allow first-admin setup after an admin exists.
         -------------------------------------------------------- */

      const [existingAdmin] = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1);

      if (existingAdmin) {
        await client.query("ROLLBACK");

        res.status(403).json({
          error: "admin_already_exists",
          message:
            "The first administrator has already been created.",
        });

        return;
      }

      /* --------------------------------------------------------
         Make sure email does not already exist.
         -------------------------------------------------------- */

      const [existingUser] = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(
          eq(users.email, normalizedEmail),
        )
        .limit(1);

      if (existingUser) {
        await client.query("ROLLBACK");

        res.status(409).json({
          error: "email_already_registered",
        });

        return;
      }

      /* --------------------------------------------------------
         Create company.
         Only required company field is name,
         matching the current schema.
         -------------------------------------------------------- */

      const [company] = await db
        .insert(companies)
        .values({
          name: cleanCompanyName,
        })
        .returning({
          id: companies.id,
          name: companies.name,
        });

      if (!company) {
        await client.query("ROLLBACK");

        res.status(500).json({
          error: "company_creation_failed",
        });

        return;
      }

      /* --------------------------------------------------------
         Hash password.
         -------------------------------------------------------- */

      const hashedPassword =
        await bcrypt.hash(cleanPassword, 12);

      /* --------------------------------------------------------
         Create admin user.
         -------------------------------------------------------- */

      const [adminUser] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          password: hashedPassword,
          fullName: cleanFullName,
          role: "admin",
          companyId: company.id,
          isActive: true,
        })
        .returning();

      if (!adminUser) {
        await client.query("ROLLBACK");

        res.status(500).json({
          error: "admin_creation_failed",
        });

        return;
      }

      /* --------------------------------------------------------
         Create employee profile for admin.
         -------------------------------------------------------- */

      const [employeeProfile] =
        await db
          .insert(employees)
          .values({
            companyId: company.id,
            employeeCode:
              `ADMIN-${adminUser.id}`,
            fullName: adminUser.fullName,
            email: adminUser.email,
            position: "Administrator",
            status: "active",
            userId: adminUser.id,
          })
          .returning({
            id: employees.id,
          });

      /* --------------------------------------------------------
         Link employee profile to user.
         -------------------------------------------------------- */

      if (employeeProfile?.id) {
        await db
          .update(users)
          .set({
            employeeId:
              employeeProfile.id,
          })
          .where(
            eq(users.id, adminUser.id),
          );
      }

      await client.query("COMMIT");

      /* --------------------------------------------------------
         Generate login token.
         -------------------------------------------------------- */

      const token = await signToken({
        userId: adminUser.id,
        email: adminUser.email,
        role: "admin",
        employeeId:
          employeeProfile?.id ?? null,
        companyId: company.id,
      });

      res.status(201).json({
        message: "admin_created",

        token,

        user: {
          id: adminUser.id,
          email: adminUser.email,
          fullName: adminUser.fullName,
          role: "admin",
          companyId: company.id,
          employeeId:
            employeeProfile?.id ?? null,
        },

        company: {
          id: company.id,
          name: company.name,
        },
      });
    } catch (err: any) {
      await client
        .query("ROLLBACK")
        .catch(() => {});

      req.log.error(
        { err },
        "First admin setup error",
      );

      if (err?.code === "23505") {
        res.status(409).json({
          error:
            "Email or company already exists",
        });

        return;
      }

      res.status(500).json({
        error:
          err?.message ??
          "Internal server error",
      });
    } finally {
      client.release();
    }
  },
);

/* ============================================================
   OLD PUBLIC REGISTER
   Disabled intentionally.

   The first company/admin must be created through
   /api/auth/setup-admin.
   ============================================================ */

router.post(
  "/auth/register",
  (_req, res) => {
    res.status(403).json({
      error:
        "Company registration is disabled. Use first admin setup.",
    });
  },
);

/* ============================================================
   EMPLOYEE REGISTRATION
   POST /api/auth/register-employee

   Creates inactive employee awaiting admin approval.
   ============================================================ */

router.post(
  "/auth/register-employee",
  async (req, res) => {
    const {
      email,
      password,
      fullName,
    } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({
        error: "All fields required",
      });
      return;
    }

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const cleanFullName =
      String(fullName).trim();

    const cleanPassword =
      String(password);

    if (cleanPassword.length < 8) {
      res.status(400).json({
        error:
          "Password must be at least 8 characters",
      });
      return;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /* --------------------------------------------------------
         Find the company's first/only company.
         -------------------------------------------------------- */

      const [company] = await db
        .select({
          id: companies.id,
          name: companies.name,
        })
        .from(companies)
        .orderBy(companies.id)
        .limit(1);

      if (!company) {
        await client.query("ROLLBACK");

        res.status(400).json({
          error: "no_company_found",
          message:
            "No company has been configured yet. The administrator must complete first-time setup.",
        });

        return;
      }

      /* --------------------------------------------------------
         Existing email check.
         -------------------------------------------------------- */

      const [existing] = await db
        .select({
          id: users.id,
          employeeId: users.employeeId,
          isActive: users.isActive,
        })
        .from(users)
        .where(
          eq(users.email, normalizedEmail),
        )
        .limit(1);

      if (existing) {
        if (!existing.employeeId) {
          await db
            .delete(users)
            .where(
              eq(
                users.id,
                existing.id,
              ),
            );
        } else if (!existing.isActive) {
          await client.query("ROLLBACK");

          res.status(202).json({
            message: "pending_approval",
            companyName: company.name,
          });

          return;
        } else {
          await client.query("ROLLBACK");

          res.status(400).json({
            error:
              "Email already registered",
          });

          return;
        }
      }

      /* --------------------------------------------------------
         Hash employee password.
         -------------------------------------------------------- */

      const hashedPassword =
        await bcrypt.hash(
          cleanPassword,
          10,
        );

      /* --------------------------------------------------------
         Create inactive employee user.
         -------------------------------------------------------- */

      const [user] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          password: hashedPassword,
          fullName: cleanFullName,
          role: "employee",
          companyId: company.id,
          isActive: false,
        })
        .returning();

      /* --------------------------------------------------------
         Create employee profile.
         -------------------------------------------------------- */

      const empCode =
        `EMP-${Date.now()
          .toString(36)
          .toUpperCase()}`;

      const [employeeProfile] =
        await db
          .insert(employees)
          .values({
            companyId: company.id,
            employeeCode: empCode,
            fullName: user.fullName,
            email: user.email,
            position: "Employee",
            status: "pending",
            userId: user.id,
          })
          .returning({
            id: employees.id,
          });

      /* --------------------------------------------------------
         Link employee profile.
         -------------------------------------------------------- */

      if (employeeProfile?.id) {
        await db
          .update(users)
          .set({
            employeeId:
              employeeProfile.id,
          })
          .where(
            eq(users.id, user.id),
          );
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "pending_approval",
        companyName: company.name,
      });
    } catch (err: any) {
      await client
        .query("ROLLBACK")
        .catch(() => {});

      req.log.error(
        { err },
        "Register employee error",
      );

      if (err?.code === "23505") {
        res.status(400).json({
          error:
            "Email already registered",
        });
      } else {
        res.status(500).json({
          error:
            err?.message ??
            "Internal server error",
        });
      }
    } finally {
      client.release();
    }
  },
);

/* ============================================================
   PENDING USERS
   ============================================================ */

router.get(
  "/auth/pending-users",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      if (
        req.user?.role !== "admin" &&
        req.user?.role !== "manager"
      ) {
        res.status(403).json({
          error:
            "Administrator access required",
        });
        return;
      }

      const companyId =
        req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          error: "No company found",
        });
        return;
      }

      const pending = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          and(
            eq(users.isActive, false),
            eq(
              users.companyId,
              companyId,
            ),
          ),
        );

      res.json({
        users: pending,
      });
    } catch (err) {
      req.log.error(
        { err },
        "Get pending users error",
      );

      res.status(500).json({
        error:
          "Internal server error",
      });
    }
  },
);

/* ============================================================
   APPROVE USER
   ============================================================ */

router.post(
  "/auth/approve-user/:id",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      if (
        req.user?.role !== "admin" &&
        req.user?.role !== "manager"
      ) {
        res.status(403).json({
          error:
            "Administrator access required",
        });
        return;
      }

      const userId = parseInt(
        req.params["id"] as string,
        10,
      );

      if (isNaN(userId)) {
        res.status(400).json({
          error: "Invalid user id",
        });
        return;
      }

      const [updated] =
        await db
          .update(users)
          .set({
            isActive: true,
          })
          .where(
            and(
              eq(
                users.id,
                userId,
              ),
              eq(
                users.companyId,
                req.user.companyId!,
              ),
            ),
          )
          .returning({
            id: users.id,
            fullName:
              users.fullName,
            email: users.email,
          });

      if (!updated) {
        res.status(404).json({
          error: "User not found",
        });
        return;
      }

      await db
        .update(employees)
        .set({
          status: "active",
        })
        .where(
          eq(
            employees.userId,
            userId,
          ),
        );

      res.json({
        message: "approved",
        user: updated,
      });
    } catch (err) {
      req.log.error(
        { err },
        "Approve user error",
      );

      res.status(500).json({
        error:
          "Internal server error",
      });
    }
  },
);

/* ============================================================
   REJECT USER
   ============================================================ */

router.post(
  "/auth/reject-user/:id",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      if (
        req.user?.role !== "admin" &&
        req.user?.role !== "manager"
      ) {
        res.status(403).json({
          error:
            "Administrator access required",
        });
        return;
      }

      const userId = parseInt(
        req.params["id"] as string,
        10,
      );

      if (isNaN(userId)) {
        res.status(400).json({
          error: "Invalid user id",
        });
        return;
      }

      await db
        .delete(employees)
        .where(
          eq(
            employees.userId,
            userId,
          ),
        );

      await db
        .delete(users)
        .where(
          and(
            eq(
              users.id,
              userId,
            ),
            eq(
              users.companyId,
              req.user.companyId!,
            ),
          ),
        );

      res.json({
        message: "rejected",
      });
    } catch (err) {
      req.log.error(
        { err },
        "Reject user error",
      );

      res.status(500).json({
        error:
          "Internal server error",
      });
    }
  },
);

/* ============================================================
   COMPANY
   GET /api/auth/company
   ============================================================ */

router.get(
  "/auth/company",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      if (
        req.user?.role !== "admin" &&
        req.user?.role !== "manager"
      ) {
        res.status(403).json({
          error:
            "Administrator access required",
        });
        return;
      }

      const companyId =
        req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          error: "No company found",
        });
        return;
      }

      const [company] =
        await db
          .select({
            id: companies.id,
            name: companies.name,
          })
          .from(companies)
          .where(
            eq(
              companies.id,
              companyId,
            ),
          )
          .limit(1);

      if (!company) {
        res.status(404).json({
          error: "Company not found",
        });
        return;
      }

      res.json({
        id: company.id,
        name: company.name,
      });
    } catch (err) {
      req.log.error(
        { err },
        "Get company error",
      );

      res.status(500).json({
        error:
          "Internal server error",
      });
    }
  },
);

/* ============================================================
   CURRENT USER
   GET /api/auth/me
   ============================================================ */

router.get(
  "/auth/me",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const [user] =
        await db
          .select()
          .from(users)
          .where(
            eq(
              users.id,
              req.user!.userId,
            ),
          )
          .limit(1);

      if (!user) {
        res.status(404).json({
          error: "User not found",
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          error:
            "This account is inactive",
        });
        return;
      }

      const employeeId =
        await syncEmployeeProfile(
          user,
        );

      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        employeeId,
      });
    } catch (err) {
      req.log.error(
        { err },
        "Get me error",
      );

      res.status(500).json({
        error:
          "Internal server error",
      });
    }
  },
);

/* ============================================================
   CHANGE CREDENTIALS
   PATCH /api/auth/credentials
   ============================================================ */

router.patch(
  "/auth/credentials",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId =
        req.user?.userId;

      if (!userId) {
        res.status(401).json({
          error: "Unauthorized",
        });
        return;
      }

      const {
        currentPassword,
        newPassword,
        newEmail,
      } = req.body as {
        currentPassword: string;
        newPassword?: string;
        newEmail?: string;
      };

      if (!currentPassword) {
        res.status(400).json({
          error:
            "currentPassword is required",
        });
        return;
      }

      if (
        !newPassword &&
        !newEmail
      ) {
        res.status(400).json({
          error:
            "Provide newPassword or newEmail",
        });
        return;
      }

      const [user] =
        await db
          .select()
          .from(users)
          .where(
            eq(
              users.id,
              userId,
            ),
          )
          .limit(1);

      if (!user) {
        res.status(404).json({
          error: "User not found",
        });
        return;
      }

      const valid =
        await bcrypt.compare(
          currentPassword,
          user.password,
        );

      if (!valid) {
        res.status(401).json({
          error:
            "incorrect_password",
        });
        return;
      }

      const updates: Partial<
        typeof users.$inferInsert
      > = {};

      if (newPassword) {
        if (
          newPassword.length < 8
        ) {
          res.status(400).json({
            error:
              "Password must be at least 8 characters",
          });
          return;
        }

        updates.password =
          await bcrypt.hash(
            newPassword,
            10,
          );
      }

      if (
        newEmail &&
        newEmail !== user.email
      ) {
        const normalizedEmail =
          newEmail
            .trim()
            .toLowerCase();

        const [existing] =
          await db
            .select({
              id: users.id,
            })
            .from(users)
            .where(
              eq(
                users.email,
                normalizedEmail,
              ),
            )
            .limit(1);

        if (existing) {
          res.status(400).json({
            error:
              "email_taken",
          });
          return;
        }

        updates.email =
          normalizedEmail;

        if (user.employeeId) {
          await db
            .update(employees)
            .set({
              email:
                normalizedEmail,
            })
            .where(
              eq(
                employees.id,
                user.employeeId,
              ),
            );
        }
      }

      if (
        Object.keys(updates)
          .length > 0
      ) {
        await db
          .update(users)
          .set(updates)
          .where(
            eq(
              users.id,
              userId,
            ),
          );
      }

      res.json({
        ok: true,
        emailChanged:
          !!updates.email,
        passwordChanged:
          !!updates.password,
      });
    } catch (err) {
      req.log.error(
        { err },
        "Update credentials error",
      );

      res.status(500).json({
        error:
          "Internal server error",
      });
    }
  },
);

export default router;
