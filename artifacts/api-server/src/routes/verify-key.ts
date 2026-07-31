import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * POST /api/settings/verify-key
 * Body: { provider: string; key: string }
 * Tests whether the given API key is valid by calling the provider's API server-side.
 */
router.post("/settings/verify-key", authMiddleware, async (req, res) => {
  const { provider, key } = req.body as { provider: string; key: string };

  if (!provider || !key || typeof key !== "string" || key.trim().length < 4) {
    res.status(400).json({ ok: false, message: "مفتاح فارغ أو قصير جداً" });
    return;
  }

  try {
    switch (provider) {
      /* ── OpenAI ───────────────────────────────────────────── */
      case "openai": {
        const r = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${key.trim()}` },
        });
        if (r.ok) {
          res.json({ ok: true, message: "مفتاح OpenAI صالح ✓" });
        } else if (r.status === 401) {
          res.json({ ok: false, message: "مفتاح غير صالح (401 Unauthorized)" });
        } else if (r.status === 429) {
          res.json({ ok: true, message: "مفتاح صالح (تجاوز حد الاستخدام مؤقتاً)" });
        } else {
          res.json({ ok: false, message: `خطأ من OpenAI (${r.status})` });
        }
        break;
      }

      /* ── Google Gemini ────────────────────────────────────── */
      case "gemini": {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key.trim())}`;
        const r = await fetch(url);
        if (r.ok) {
          res.json({ ok: true, message: "مفتاح Gemini صالح ✓" });
        } else if (r.status === 400 || r.status === 403) {
          res.json({ ok: false, message: "مفتاح غير صالح أو غير مُفعَّل" });
        } else {
          res.json({ ok: false, message: `خطأ من Google (${r.status})` });
        }
        break;
      }

      /* ── Anthropic Claude ─────────────────────────────────── */
      case "claude": {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": key.trim(),
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "hi" }],
          }),
        });
        if (r.ok || r.status === 529) {
          res.json({ ok: true, message: "مفتاح Claude صالح ✓" });
        } else if (r.status === 401) {
          res.json({ ok: false, message: "مفتاح غير صالح (401 Unauthorized)" });
        } else if (r.status === 429) {
          res.json({ ok: true, message: "مفتاح صالح (تجاوز الحد المؤقت)" });
        } else {
          res.json({ ok: false, message: `خطأ من Anthropic (${r.status})` });
        }
        break;
      }

      /* ── Google Maps ──────────────────────────────────────── */
      case "maps": {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=Riyadh&key=${encodeURIComponent(key.trim())}`;
        const r = await fetch(url);
        const data = (await r.json()) as any;
        if (data?.status === "OK" || data?.status === "ZERO_RESULTS") {
          res.json({ ok: true, message: "مفتاح Google Maps صالح ✓" });
        } else if (data?.status === "REQUEST_DENIED") {
          res.json({ ok: false, message: "مفتاح مرفوض — تحقق من صلاحيات المفتاح" });
        } else {
          res.json({ ok: false, message: `خطأ: ${data?.status || "غير معروف"}` });
        }
        break;
      }

      /* ── Firebase ─────────────────────────────────────────── */
      case "firebase": {
        const k = key.trim();
        if (/^AIza[A-Za-z0-9_-]{35,}$/.test(k)) {
          res.json({ ok: true, message: "تنسيق المفتاح صحيح — اختبر الاتصال من التطبيق" });
        } else {
          res.json({ ok: false, message: "تنسيق مفتاح Firebase غير صحيح (يجب أن يبدأ بـ AIza)" });
        }
        break;
      }

      /* ── SMTP ─────────────────────────────────────────────── */
      case "smtp": {
        const k = key.trim();
        const valid = /^smtp(s?):\/\/.+:.+@.+/.test(k) || k.length > 10;
        res.json({
          ok: valid,
          message: valid
            ? "تنسيق SMTP يبدو صحيحاً — يحتاج اختبار حقيقي من الخادم"
            : "تنسيق غير صحيح — مثال: smtp://user:pass@host:587",
        });
        break;
      }

      /* ── WhatsApp ─────────────────────────────────────────── */
      case "whatsapp": {
        const k = key.trim();
        if (k.length >= 20) {
          res.json({ ok: true, message: "طول المفتاح يبدو صحيحاً — يتطلب اختبار حقيقي من Meta" });
        } else {
          res.json({ ok: false, message: "المفتاح قصير جداً، تحقق من بوابة Meta للمطورين" });
        }
        break;
      }

      /* ── Custom / Unknown ─────────────────────────────────── */
      default: {
        const k = key.trim();
        if (k.length >= 10) {
          res.json({ ok: true, message: "المفتاح مُدخَل (لا يوجد اختبار تلقائي لهذه الخدمة)" });
        } else {
          res.json({ ok: false, message: "المفتاح يبدو قصيراً جداً" });
        }
      }
    }
  } catch (err: any) {
    req.log?.error({ err }, "verify-key error");
    res.status(502).json({ ok: false, message: "تعذّر الوصول إلى الخدمة — تحقق من اتصال الإنترنت" });
  }
});

export default router;
