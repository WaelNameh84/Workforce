import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@workspace/db";
import { employees, attendance, leaves, requests, payroll } from "@workspace/db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// POST /api/ai/chat  — streaming SSE
router.post("/ai/chat", authMiddleware, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "GEMINI_API_KEY not configured" });
    return;
  }

  const { message, history = [] } = req.body as {
    message: string;
    history: { role: "user" | "model"; text: string }[];
  };

  if (!message?.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const companyId = req.user!.companyId;
  const today = new Date().toISOString().split("T")[0];

  // ── gather live company context ──────────────────────────────────────────
  let context = "";
  try {
    const [empCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.companyId, companyId));

    const [presentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          eq(attendance.date, today),
          eq(attendance.status, "present"),
        ),
      );

    const [lateCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          eq(attendance.date, today),
          eq(attendance.isLate, true),
        ),
      );

    const [onLeaveCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leaves)
      .innerJoin(employees, eq(leaves.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          lte(leaves.startDate, today),
          gte(leaves.endDate, today),
          eq(leaves.status, "approved"),
        ),
      );

    const [pendingReqCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .innerJoin(employees, eq(requests.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          eq(requests.status, "pending"),
        ),
      );

    const [pendingLeaveCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leaves)
      .innerJoin(employees, eq(leaves.employeeId, employees.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          eq(leaves.status, "pending"),
        ),
      );

    // recent payroll
    const recentPayroll = await db
      .select({
        period: payroll.period,
        status: payroll.status,
        netSalary: payroll.netSalary,
      })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(payroll.createdAt))
      .limit(5);

    const totalPayroll = recentPayroll.reduce(
      (sum, p) => sum + Number(p.netSalary ?? 0),
      0,
    );

    context = `
== بيانات الشركة الحية (${today}) ==
- إجمالي الموظفين: ${empCount?.count ?? 0}
- الحاضرون اليوم: ${presentCount?.count ?? 0}
- المتأخرون اليوم: ${lateCount?.count ?? 0}
- في إجازة اليوم: ${onLeaveCount?.count ?? 0}
- الطلبات المعلقة: ${pendingReqCount?.count ?? 0}
- طلبات الإجازة المعلقة: ${pendingLeaveCount?.count ?? 0}
- إجمالي الرواتب (آخر سجلات): ${totalPayroll.toFixed(2)} ريال
`;
  } catch {
    context = `== بيانات الشركة غير متاحة مؤقتاً ==\n`;
  }

  // ── setup Gemini ─────────────────────────────────────────────────────────
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `أنت مساعد ذكي متخصص في إدارة الموارد البشرية ضمن منصة WorkforceOS.
تساعد المدراء والمسؤولين في تحليل بيانات الموظفين، الحضور، الرواتب، والإجازات.
أجب دائماً بنفس لغة المستخدم (عربي أو إنجليزي). كن مختصراً ودقيقاً.
استخدم البيانات الحية التالية عند الإجابة:
${context}`,
  });

  // convert history to Gemini format
  const chatHistory = history.map((h) => ({
    role: h.role as "user" | "model",
    parts: [{ text: h.text }],
  }));

  // ── SSE stream ───────────────────────────────────────────────────────────
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessageStream(message);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: any) {
    res.write(
      `data: ${JSON.stringify({ error: err?.message ?? "AI error" })}\n\n`,
    );
  }
  res.end();
});

export default router;
