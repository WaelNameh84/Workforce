import { Router } from "express";

const router = Router();

/* Keyword map: Arabic → Unsplash photo ID */
const KEYWORD_MAP: Array<[RegExp, string]> = [
  [/نجار|نجارة|خشب/,              "1504148455328-c376907d081c"],
  [/حداد|حدادة|لحام/,             "1504917595217-d4dc5ebe6122"],
  [/كهرباء|كهربائي/,              "1621905251918-14bf3f6b2b0b"],
  [/سباك|سباكة|مياه/,             "1581094794329-c8112a89af12"],
  [/بناء|مقاول|إنشاء/,            "1504307651254-35680f356dfd"],
  [/محاسب|محاسبة|مالي|مال/,       "1554224155-6726b3ff858f"],
  [/مبيعات|بيع/,                  "1552581234-26160f608093"],
  [/تسويق|ماركتنج/,               "1542744173-8e7e53415bb0"],
  [/هندسة|مهندس/,                 "1581092335878-2d9ff86ca2bf"],
  [/تقنية|برمجة|حاسوب|آي تي|it/i, "1518770660439-4636190af475"],
  [/طبي|طب|صحة|مستشفى/,          "1576091160399-112ba8d25d1d"],
  [/أمن|حراسة|حراس/,              "1582139329536-e7284fece509"],
  [/نظافة|تنظيف|جلي/,             "1581578731548-c64695cc6952"],
  [/مطبخ|طعام|وجبات/,             "1556910103-1c02745aae4d"],
  [/طباخ|طهي|شيف/,                "1547592180-85f173990554"],
  [/زراع|مزارع|زراعة/,            "1574943320219-cda689be1d32"],
  [/نقل|توصيل|شحن|سائق/,          "1601584130-24a3aa4c57c1"],
  [/موارد بشرية|hr|إدارة/,         "1521737604893-d14cc237f11d"],
  [/مستودع|مخزن|تخزين/,           "1553413077-190dd305871c"],
  [/تصميم|ديزاين|جرافيك/,         "1558618666-fcd25c85cd64"],
  [/قانون|محامي|قضاء/,            "1589391886645-d51941baf7fb"],
  [/خدمة عملاء|كول سنتر/,         "1556745757-8d76bdb6984b"],
  [/صيانة|ميكانيك|تصليح/,         "1530124566582-a618bc2615dc"],
  [/طيران|مطار/,                  "1436491865332-7a61a109cc05"],
  [/فندق|ضيافة|سياحة/,            "1566073771259-470de1bed4e0"],
  [/تعليم|مدرسة|معلم/,            "1503676260728-1c4252028a5b"],
  [/إعلام|صحافة|تصوير/,           "1495020689067-958852172e31"],
  [/رياضة|جيم|لياقة/,             "1534258936119-cfe4c2f85c3a"],
  [/موسيقى|فن|إبداع/,             "1511379938547-c1f69419868d"],
];

const FALLBACK_ID = "1497366216548-37526070297c";

function getPhotoId(name: string): string {
  const lower = name.toLowerCase();
  for (const [pattern, id] of KEYWORD_MAP) {
    if (pattern.test(lower)) return id;
  }
  return FALLBACK_ID;
}

// GET /api/images/dept?name=النجارة
router.get("/images/dept", async (req, res) => {
  const name = (req.query.name as string) || "";
  const photoId = getPhotoId(name);
  const url = `https://images.unsplash.com/photo-${photoId}?w=600&h=240&fit=crop&auto=format&q=80`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      res.status(502).send("image fetch failed");
      return;
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const cacheControl = "public, max-age=86400, stale-while-revalidate=604800";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("Access-Control-Allow-Origin", "*");

    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch {
    res.status(502).send("image fetch failed");
  }
});

export default router;
