import { useState, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarDays, Globe, Sun, Snowflake, Leaf, Flower2,
  Plus, Trash2, ExternalLink, Info,
} from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

// ─── Swedish public holidays (fixed + floating) ───────────────────────────────
function getSwedishHolidays(year: number) {
  const fixed = [
    { month: 1,  day: 1,  name: { sv: 'Nyårsdagen',            ar: 'رأس السنة الميلادية',    en: "New Year's Day" },             type: 'national' },
    { month: 1,  day: 6,  name: { sv: 'Trettondedag jul',       ar: 'عيد الغطاس',             en: 'Epiphany' },                   type: 'national' },
    { month: 5,  day: 1,  name: { sv: 'Första maj',             ar: 'عيد العمال',             en: 'Labour Day' },                type: 'national' },
    { month: 6,  day: 6,  name: { sv: 'Nationaldagen',          ar: 'اليوم الوطني السويدي',   en: 'Swedish National Day' },      type: 'national' },
    { month: 12, day: 24, name: { sv: 'Julafton',               ar: 'عشية عيد الميلاد',       en: 'Christmas Eve' },              type: 'national' },
    { month: 12, day: 25, name: { sv: 'Juldagen',               ar: 'عيد الميلاد',            en: 'Christmas Day' },             type: 'national' },
    { month: 12, day: 26, name: { sv: 'Annandag jul',           ar: 'ثاني أيام عيد الميلاد',  en: 'Boxing Day' },                type: 'national' },
    { month: 12, day: 31, name: { sv: 'Nyårsafton',             ar: 'ليلة رأس السنة',         en: "New Year's Eve" },             type: 'national' },
  ];

  // Easter calculation (Gregorian)
  const easter = computeEaster(year);
  const add = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const goodFriday    = add(easter, -2);
  const easterSaturday= add(easter, -1);
  const easterMonday  = add(easter, 1);
  const ascension     = add(easter, 39);
  const whit          = add(easter, 49);
  const whitMonday    = add(easter, 50);

  const floating = [
    { date: goodFriday,     name: { sv: 'Långfredagen',       ar: 'الجمعة الحزينة',        en: 'Good Friday' },           type: 'christian' },
    { date: easterSaturday, name: { sv: 'Påskafton',          ar: 'سبت الفصح',             en: 'Holy Saturday' },         type: 'christian' },
    { date: easter,         name: { sv: 'Påskdagen',          ar: 'عيد الفصح',             en: 'Easter Sunday' },         type: 'christian' },
    { date: easterMonday,   name: { sv: 'Annandag påsk',      ar: 'إثنين الفصح',           en: 'Easter Monday' },         type: 'christian' },
    { date: ascension,      name: { sv: 'Kristi himmelsfärds dag', ar: 'صعود المسيح',      en: 'Ascension Day' },         type: 'christian' },
    { date: whit,           name: { sv: 'Pingstdagen',        ar: 'عيد الخمسين',           en: 'Whit Sunday' },           type: 'christian' },
    { date: whitMonday,     name: { sv: 'Annandag pingst',    ar: 'إثنين الخمسين',         en: 'Whit Monday' },           type: 'christian' },
  ];

  // Midsommar (Friday between Jun 19-25)
  const midsommar = nthWeekday(year, 6, 5, 3); // first Friday on/after June 19
  const midsommarEve = add(midsommar, -1);
  const allSaintsEve = getSaturdayBetween(year, 10, 31, 11, 6);

  const special = [
    { date: midsommarEve, name: { sv: 'Midsommarafton',  ar: 'عشية منتصف الصيف', en: 'Midsummer Eve' },  type: 'traditional' },
    { date: midsommar,    name: { sv: 'Midsommardagen',  ar: 'يوم منتصف الصيف',  en: 'Midsummer Day' }, type: 'traditional' },
    { date: allSaintsEve, name: { sv: 'Allhelgonadagen', ar: 'يوم جميع القديسين', en: "All Saints' Day" }, type: 'christian' },
  ];

  const all: { date: Date; name: { sv: string; ar: string; en: string }; type: string }[] = [
    ...fixed.map(h => ({ date: new Date(year, h.month - 1, h.day), name: h.name, type: h.type })),
    ...floating,
    ...special,
  ];

  return all.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Easter algorithm (Anonymous Gregorian)
function computeEaster(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function nthWeekday(year: number, month: number, weekday: number, minDay: number): Date {
  const d = new Date(year, month - 1, minDay);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  return d;
}

function getSaturdayBetween(year: number, m1: number, d1: number, m2: number, d2: number): Date {
  const start = new Date(year, m1 - 1, d1);
  const end   = new Date(year, m2 - 1, d2);
  const d = new Date(start);
  while (d.getDay() !== 6 && d <= end) d.setDate(d.getDate() + 1);
  return d;
}

const typeColors: Record<string, string> = {
  national:    'from-blue-500 to-indigo-600',
  christian:   'from-violet-500 to-purple-600',
  traditional: 'from-emerald-500 to-teal-600',
  custom:      'from-amber-500 to-orange-600',
};
const typeIcons: Record<string, string> = {
  national: '🇸🇪', christian: '✝️', traditional: '🌿', custom: '⭐',
};

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTHS_SV = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Holidays() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRTL = locale === 'ar';

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [customHolidays, setCustomHolidays] = useState<{ date: Date; name: { sv: string; ar: string; en: string }; type: string }[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');

  const baseHolidays = useMemo(() => getSwedishHolidays(year), [year]);
  const allHolidays = useMemo(() => [...baseHolidays, ...customHolidays].sort((a, b) => a.date.getTime() - b.date.getTime()), [baseHolidays, customHolidays]);

  const filtered = useMemo(() => allHolidays.filter(h => {
    const matchType  = filterType  === 'all' || h.type === filterType;
    const matchMonth = filterMonth === 0     || h.date.getMonth() + 1 === filterMonth;
    return matchType && matchMonth;
  }), [allHolidays, filterType, filterMonth]);

  const today = new Date();
  const upcoming = allHolidays.filter(h => h.date >= today).slice(0, 3);

  const monthLabels = locale === 'ar' ? MONTHS_AR : locale === 'sv' ? MONTHS_SV : MONTHS_EN;
  const l = (obj: { sv: string; ar: string; en: string }) => obj[locale as 'sv' | 'ar' | 'en'] || obj.sv;
  const fmtDate = (d: Date) => d.toLocaleDateString(locale === 'ar' ? 'en-GB' : locale === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isPast  = (d: Date) => d < today && !isToday(d);

  function addCustom() {
    if (!newDate || !newNameAr) return;
    const d = new Date(newDate);
    setCustomHolidays(prev => [...prev, { date: d, name: { sv: newNameEn || newNameAr, ar: newNameAr, en: newNameEn || newNameAr }, type: 'custom' }]);
    toast({ title: t('holidayAdded') || 'تمت إضافة العطلة ✓' });
    setAddOpen(false);
    setNewDate(''); setNewNameAr(''); setNewNameEn('');
  }

  return (
    <div className="space-y-6 animate-fadeIn" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('officialHolidays')}</h1>
          <p className="text-sm mt-1 text-muted-foreground">{t('officialHolidaysDesc')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 font-bold text-sm hover:bg-amber-500/20 transition">
            <Plus className="w-4 h-4" /> {t('addHoliday') || 'إضافة عطلة'}
          </button>
        </div>
      </div>

      {/* Upcoming next 3 */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('upcomingHolidays') || 'العطل القادمة'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {upcoming.map((h, i) => {
              const grad = typeColors[h.type] || typeColors.custom;
              const daysLeft = Math.ceil((h.date.getTime() - today.getTime()) / 86400000);
              return (
                <div key={i} className="living-card p-5 overflow-hidden"
                  style={{ '--card-accent': h.type === 'national' ? '#3b82f6' : h.type === 'christian' ? '#8b5cf6' : '#10b981' } as React.CSSProperties}>
                  <span className="living-card-orb" style={{ top: '-1rem', right: '-0.75rem' }} />
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${grad} text-white text-xs font-bold mb-3`}>
                    {typeIcons[h.type]} {typeLabels(h.type, locale)}
                  </div>
                  <p className="font-bold text-base leading-tight">{l(h.name)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{h.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</p>
                  <p className="text-xs font-bold text-amber-400 mt-2">{daysLeft === 0 ? (t('today') || 'اليوم') : `${daysLeft} ${t('days') || 'يوم'}`}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Year + filter controls */}
      <div className="card-3d p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="w-8 h-8 rounded-xl border border-border hover:border-rose-500/40 flex items-center justify-center text-sm font-bold">‹</button>
          <span className="font-bold text-base min-w-[50px] text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="w-8 h-8 rounded-xl border border-border hover:border-rose-500/40 flex items-center justify-center text-sm font-bold">›</button>
        </div>
        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
          className="rounded-xl border border-border bg-background px-3 h-10 text-sm focus:outline-none">
          <option value={0}>{t('allMonths') || 'كل الأشهر'}</option>
          {monthLabels.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 h-10 text-sm focus:outline-none">
          <option value="all">{t('allTypes') || 'كل الأنواع'}</option>
          <option value="national">🇸🇪 {locale === 'ar' ? 'وطنية' : locale === 'sv' ? 'Nationell' : 'National'}</option>
          <option value="christian">✝️ {locale === 'ar' ? 'مسيحية' : locale === 'sv' ? 'Kristen' : 'Christian'}</option>
          <option value="traditional">🌿 {locale === 'ar' ? 'تقليدية' : locale === 'sv' ? 'Traditionell' : 'Traditional'}</option>
          <option value="custom">⭐ {locale === 'ar' ? 'مخصصة' : locale === 'sv' ? 'Anpassad' : 'Custom'}</option>
        </select>
        <span className="text-sm text-muted-foreground ms-auto">{filtered.length} {locale === 'ar' ? 'عطلة' : locale === 'sv' ? 'helgdagar' : 'holidays'}</span>
      </div>

      {/* Holidays list grouped by month */}
      {(() => {
        const byMonth: Map<number, typeof filtered> = new Map();
        filtered.forEach(h => {
          const m = h.date.getMonth();
          if (!byMonth.has(m)) byMonth.set(m, []);
          byMonth.get(m)!.push(h);
        });
        return Array.from(byMonth.entries()).map(([m, holidays]) => (
          <div key={m} className="space-y-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-300 flex items-center justify-center text-xs font-black">{m + 1}</span>
              {monthLabels[m]} {year}
            </h3>
            {holidays.map((h, i) => {
              const grad = typeColors[h.type] || typeColors.custom;
              const past = isPast(h.date);
              const todayMark = isToday(h.date);
              return (
                <div key={i}
                  className={`living-card px-5 py-4 flex items-center gap-4 transition ${past ? 'opacity-50' : ''} ${todayMark ? 'ring-2 ring-rose-500/40' : ''}`}
                  style={{ '--card-accent': h.type === 'national' ? '#3b82f6' : h.type === 'christian' ? '#8b5cf6' : h.type === 'traditional' ? '#10b981' : '#f59e0b' } as React.CSSProperties}>
                  <span className="living-card-orb" style={{ top: '-1rem', right: '-0.75rem' }} />
                  {/* Date block */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex flex-col items-center justify-center shrink-0`}>
                    <span className="text-white font-black text-lg leading-none">{h.date.getDate()}</span>
                    <span className="text-white/70 text-[10px]">{monthLabels[h.date.getMonth()].slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{l(h.name)}</span>
                      {todayMark && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">{t('today')}</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {h.date.toLocaleDateString('en-GB', { weekday: 'long' })} · {typeLabels(h.type, locale)}
                    </p>
                  </div>
                  <span className="text-lg shrink-0">{typeIcons[h.type]}</span>
                </div>
              );
            })}
          </div>
        ));
      })()}

      {filtered.length === 0 && (
        <div className="card-3d p-16 text-center">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
          <p className="font-bold text-muted-foreground">{t('noHolidaysFound') || 'لا توجد عطل في هذا التصفية'}</p>
        </div>
      )}

      {/* Add custom holiday drawer */}
      <Drawer open={addOpen} onOpenChange={setAddOpen}>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="border-b border-border/50 pb-3">
            <DrawerTitle className="flex items-center gap-2.5 font-display text-xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              {t('addCustomHoliday') || 'إضافة عطلة مخصصة'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="living-card p-4 space-y-3" style={{ '--card-accent': '#f59e0b' } as React.CSSProperties}>
              <span className="living-card-orb" style={{ top: '-1rem', right: '-0.5rem' }} />
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('date')}</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 h-11 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الاسم بالعربية *</label>
                <input value={newNameAr} onChange={e => setNewNameAr(e.target.value)} placeholder="مثال: يوم المؤسس"
                  className="w-full rounded-xl border border-border bg-background px-3 h-11 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">English / Svenska name</label>
                <input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} placeholder="e.g. Founders Day"
                  className="w-full rounded-xl border border-border bg-background px-3 h-11 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-border/50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
            <button onClick={addCustom} disabled={!newDate || !newNameAr}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm disabled:opacity-40 transition">
              {t('addHoliday') || 'إضافة العطلة'}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function typeLabels(type: string, locale: string): string {
  const map: Record<string, { ar: string; en: string; sv: string }> = {
    national:    { ar: 'وطنية', en: 'National', sv: 'Nationell' },
    christian:   { ar: 'مسيحية', en: 'Christian', sv: 'Kristen' },
    traditional: { ar: 'تقليدية', en: 'Traditional', sv: 'Traditionell' },
    custom:      { ar: 'مخصصة', en: 'Custom', sv: 'Anpassad' },
  };
  const m = map[type] || map.custom;
  return m[locale as 'ar' | 'en' | 'sv'] || m.ar;
}
