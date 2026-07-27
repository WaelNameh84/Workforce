import { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, ClipboardList, Info } from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/i18n/LanguageProvider';

type DetailItem = {
  label: string;
  value: string | number | null | undefined;
};

export type DetailPayload = {
  title: string;
  subtitle?: string;
  badge?: string;
  items: DetailItem[];
};

const STORAGE_KEY = 'workforce-active-detail';

export function saveDetailAndNavigate(
  setLocation: (path: string) => void,
  path: string,
  payload: DetailPayload,
) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  setLocation(path);
}

export default function DetailPage() {
  const [, setLocation] = useLocation();
  const { locale } = useLanguage();
  const [payload, setPayload] = useState<DetailPayload | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setPayload(JSON.parse(raw) as DetailPayload);
    } catch {
      setPayload(null);
    }
  }, []);

  const isArabic = locale === 'ar';

  if (!payload) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-24 text-center">
        <Info className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">{isArabic ? 'التفاصيل غير متاحة' : 'Details unavailable'}</h1>
        <button
          type="button"
          onClick={() => setLocation('/dashboard')}
          className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white"
        >
          {isArabic ? 'العودة للرئيسية' : 'Back to dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fadeIn space-y-5" dir={isArabic ? 'rtl' : 'ltr'}>
      <button
        type="button"
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground transition hover:bg-muted"
      >
        {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        {isArabic ? 'رجوع' : 'Back'}
      </button>

      <section className="overflow-hidden rounded-3xl border border-indigo-400/25 bg-gradient-to-br from-indigo-950/80 via-slate-950/95 to-purple-950/80 shadow-xl">
        <div className="flex items-start gap-4 border-b border-white/10 p-5 sm:p-7">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
            <ClipboardList className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-indigo-300">{payload.badge || (isArabic ? 'صفحة التفاصيل' : 'Details')}</p>
            <h1 className="mt-1 break-words text-2xl font-black text-white">{payload.title}</h1>
            {payload.subtitle && <p className="mt-1 text-sm text-slate-400">{payload.subtitle}</p>}
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
          {payload.items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
              <div className="text-xs font-bold text-slate-400">{item.label}</div>
              <div className="mt-1 break-words text-sm font-bold text-white">{item.value ?? '—'}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}