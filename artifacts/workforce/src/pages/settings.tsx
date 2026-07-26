import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import {
  Settings2, Palette, Clock4, Bot, Key, Bell, Shield, CalendarClock,
  Sun, Moon, Upload, Eye, EyeOff, Save, Check, ChevronRight,
  Fingerprint, Database, RefreshCw, Volume2, VolumeX, User,
  Building2, Phone, Mail, MapPin, Image, Type, Layers,
  Zap, MessageSquare, Globe, Lock, Unlock, Download,
  AlarmClock, Clock, Timer, Play, Pause,
} from 'lucide-react';

// ─── Shared primitives ────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${on ? 'bg-indigo-500' : 'bg-slate-600'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'right-1' : 'right-6'}`} />
    </button>
  );
}

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold">{label}</label>
      {sub && <p className="text-[11px] text-muted-foreground -mt-1">{sub}</p>}
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
      style={{ background: 'var(--background)' }}
    >
      {children}
    </select>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border p-5 ${className}`} style={{ background: 'var(--card)' }}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, color, title, sub }: { icon: React.ElementType; color: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
      </div>
      <div>
        <h3 className="font-bold text-base leading-tight">{title}</h3>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, on, onToggle }: { label: string; sub?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

function PasswordInput({ label, placeholder }: { label: string; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder || '••••••••'}
          className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 pr-10 transition"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </Field>
  );
}

function ColorSwatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full border-2 transition-all ${selected ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
      style={{ background: color }}
    />
  );
}

// ─── Section tabs ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'general',     label: 'عام',              icon: Settings2,     color: 'bg-indigo-500' },
  { id: 'appearance',  label: 'المظهر',            icon: Palette,       color: 'bg-purple-500' },
  { id: 'clock',       label: 'الساعة',            icon: Clock4,        color: 'bg-sky-500' },
  { id: 'assistant',   label: 'المساعد',           icon: Bot,           color: 'bg-pink-500' },
  { id: 'apikeys',     label: 'API Keys',          icon: Key,           color: 'bg-amber-500' },
  { id: 'notif',       label: 'الإشعارات',         icon: Bell,          color: 'bg-orange-500' },
  { id: 'security',    label: 'الأمان',            icon: Shield,        color: 'bg-rose-500' },
  { id: 'attendance',  label: 'إعدادات الحضور',   icon: CalendarClock, color: 'bg-teal-500' },
];

const APP_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f97316','#10b981','#06b6d4','#f59e0b','#ef4444','#64748b'];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { theme, setTheme }       = useTheme();
  const { locale, setLocale }     = useLanguage();
  const { user }                  = useAuth();
  const { toast }                 = useToast();
  const [tab, setTab]             = useState('general');
  const [saved, setSaved]         = useState(false);
  const [appColor, setAppColor]   = useState('#6366f1');

  // General
  const [appName, setAppName]       = useState('WorkforceOS');
  const [companyName, setCompanyName] = useState('');
  const [companyAddr, setCompanyAddr] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [welcomeMsg, setWelcomeMsg]  = useState('أهلاً وسهلاً في نظام إدارة القوى العاملة');

  // Appearance
  const [fontSize, setFontSize]     = useState('medium');
  const [fontFamily, setFontFamily] = useState('system');
  const [iconStyle, setIconStyle]   = useState('rounded');
  const [clockStyle, setClockStyle] = useState('digital');

  // Live Clock
  const [clockColor, setClockColor]     = useState('#6366f1');
  const [clockSize, setClockSize]       = useState('medium');
  const [clockPos, setClockPos]         = useState('header');
  const [showDate, setShowDate]         = useState(true);
  const [showSeconds, setShowSeconds]   = useState(true);

  // Assistant
  const [assistantOn, setAssistantOn]       = useState(true);
  const [assistantName, setAssistantName]   = useState('WorkBot');
  const [assistantMsg, setAssistantMsg]     = useState('مرحباً! كيف يمكنني مساعدتك؟');
  const [assistantPersonality, setAssistantPersonality] = useState('professional');
  const [assistantLang, setAssistantLang]   = useState('ar');

  // API Keys
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys]   = useState<Record<string, string>>({
    openai: '', gemini: '', claude: '', firebase: '',
    maps: '', smtp: '', whatsapp: '',
  });

  // Notifications
  const [notif, setNotif] = useState({
    app: true, email: true, whatsapp: false,
    sound: true, shiftStart: true, shiftEnd: true, salary: true, leaves: true,
  });

  // Attendance
  const [workStart, setWorkStart]   = useState('09:00');
  const [workEnd, setWorkEnd]       = useState('17:00');
  const [breakMin, setBreakMin]     = useState('60');
  const [weekStart, setWeekStart]   = useState('sunday');
  const [lateGrace, setLateGrace]   = useState('15');
  const [otThreshold, setOtThreshold] = useState('60');
  const [deductRate, setDeductRate] = useState('hour');
  const [annualLeave, setAnnualLeave] = useState('21');

  const toggleNotif = (k: keyof typeof notif) =>
    setNotif(p => ({ ...p, [k]: !p[k] }));

  const handleSave = () => {
    setSaved(true);
    toast({ title: 'تم حفظ الإعدادات ✓' });
    setTimeout(() => setSaved(false), 2500);
  };

  const createBackup = () => {
    const content = JSON.stringify({ appName, companyName, workStart, workEnd }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'workforce-backup.json'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'تم حفظ النسخة الاحتياطية ✓' });
  };
  const restoreBackup = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,.txt';
    inp.onchange = () => toast({ title: 'تم تحديد الملف', description: 'راجع الملف قبل التطبيق' });
    inp.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">الإعدادات</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة إعدادات التطبيق والشركة</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${saved ? 'bg-green-500 shadow-green-500/25' : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-indigo-500/25 hover:-translate-y-0.5'}`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'تم الحفظ' : 'حفظ الإعدادات'}
        </button>
      </div>

      {/* Tab strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
              tab === t.id
                ? 'text-white border-transparent shadow-lg'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-indigo-500/30 hover:bg-indigo-500/5'
            }`}
            style={tab === t.id ? { background: `linear-gradient(135deg, ${appColor}, ${appColor}cc)` } : {}}
          >
            <t.icon className="w-4 h-4 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── General ───────────────────────────────────────────────── */}
      {tab === 'general' && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* App identity */}
          <Card>
            <CardHeader icon={Settings2} color="bg-indigo-500" title="هوية التطبيق" sub="اسم وصور التطبيق" />
            <div className="space-y-4">
              <Field label="اسم التطبيق">
                <Input value={appName} onChange={e => setAppName(e.target.value)} />
              </Field>
              <Field label="الرسالة الترحيبية">
                <Input value={welcomeMsg} onChange={e => setWelcomeMsg(e.target.value)} />
              </Field>
              <Field label="شعار التطبيق" sub="PNG أو SVG — حجم موصى به 512×512">
                <label className="flex items-center justify-center gap-3 w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-indigo-500/50 cursor-pointer transition group">
                  <input type="file" className="hidden" accept="image/*" />
                  <div className="text-center">
                    <Image className="w-6 h-6 text-muted-foreground group-hover:text-indigo-400 mx-auto mb-1 transition" />
                    <p className="text-xs text-muted-foreground">انقر لرفع الشعار</p>
                  </div>
                </label>
              </Field>
              <Field label="أيقونة التطبيق" sub="PNG مربع — حجم موصى به 192×192">
                <label className="flex items-center justify-center gap-3 w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-indigo-500/50 cursor-pointer transition group">
                  <input type="file" className="hidden" accept="image/*" />
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-indigo-400 mx-auto mb-1 transition" />
                    <p className="text-xs text-muted-foreground">انقر لرفع الأيقونة</p>
                  </div>
                </label>
              </Field>
              <Field label="شاشة البداية" sub="صورة شاشة التحميل">
                <label className="flex items-center justify-center gap-3 w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-indigo-500/50 cursor-pointer transition group">
                  <input type="file" className="hidden" accept="image/*" />
                  <div className="text-center">
                    <Layers className="w-6 h-6 text-muted-foreground group-hover:text-indigo-400 mx-auto mb-1 transition" />
                    <p className="text-xs text-muted-foreground">انقر لرفع شاشة البداية</p>
                  </div>
                </label>
              </Field>
            </div>
          </Card>

          {/* Company info */}
          <Card>
            <CardHeader icon={Building2} color="bg-blue-500" title="معلومات الشركة" sub="بيانات الشركة الأساسية" />
            <div className="space-y-4">
              <Field label="اسم الشركة">
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="اسم شركتك" />
              </Field>
              <Field label="عنوان الشركة">
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={companyAddr} onChange={e => setCompanyAddr(e.target.value)}
                    placeholder="المدينة، الدولة"
                    className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  />
                </div>
              </Field>
              <Field label="رقم الهاتف">
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={companyPhone} onChange={e => setCompanyPhone(e.target.value)}
                    placeholder="+966 5x xxx xxxx" type="tel"
                    className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  />
                </div>
              </Field>
              <Field label="البريد الإلكتروني">
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}
                    placeholder="info@company.com" type="email"
                    className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  />
                </div>
              </Field>
            </div>
          </Card>
        </div>
      )}

      {/* ── Appearance ────────────────────────────────────────────── */}
      {tab === 'appearance' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader icon={Palette} color="bg-purple-500" title="الوضع والألوان" sub="تخصيص الشكل العام للتطبيق" />
            <div className="space-y-5">
              {/* Light / Dark */}
              <Field label="وضع العرض">
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: 'light', icon: Sun, label: 'فاتح' }, { v: 'dark', icon: Moon, label: 'داكن' }].map(({ v, icon: Icon, label }) => (
                    <button
                      key={v}
                      onClick={() => setTheme(v as 'light' | 'dark')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition ${theme === v ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-border hover:border-indigo-500/30'}`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                      {theme === v && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </Field>

              {/* App color */}
              <Field label="لون التطبيق الرئيسي" sub="يطبق على الأزرار والكروت والأيقونات">
                <div className="flex flex-wrap gap-2 mt-1">
                  {APP_COLORS.map(c => (
                    <ColorSwatch key={c} color={c} selected={appColor === c} onClick={() => setAppColor(c)} />
                  ))}
                </div>
              </Field>

              {/* Card colors */}
              <Field label="ألوان الكروت">
                <Select>
                  <option>تلقائي (من الثيم)</option>
                  <option>شفاف زجاجي</option>
                  <option>داكن صلب</option>
                  <option>فاتح صلب</option>
                </Select>
              </Field>

              {/* Button color */}
              <Field label="لون الأزرار">
                <Select>
                  <option>تلقائي (لون التطبيق)</option>
                  <option>متدرج بنفسجي</option>
                  <option>أخضر</option>
                  <option>أزرق</option>
                </Select>
              </Field>

              {/* Background */}
              <Field label="الخلفية">
                <Select>
                  <option>افتراضي</option>
                  <option>تدرج لوني</option>
                  <option>نقطي ناعم</option>
                  <option>شبكي</option>
                  <option>صورة مخصصة</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon={Type} color="bg-violet-500" title="الخط والأيقونات" sub="شكل وحجم العناصر" />
            <div className="space-y-5">
              <Field label="نوع الخط">
                <Select value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                  <option value="system">System Default</option>
                  <option value="inter">Inter</option>
                  <option value="cairo">Cairo (عربي)</option>
                  <option value="tajawal">Tajawal (عربي)</option>
                  <option value="poppins">Poppins</option>
                  <option value="mono">Monospace</option>
                </Select>
              </Field>

              <Field label="حجم الخط">
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'small', label: 'صغير' }, { v: 'medium', label: 'متوسط' }, { v: 'large', label: 'كبير' }].map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => setFontSize(v)}
                      className={`py-2.5 rounded-xl border font-bold text-xs transition ${fontSize === v ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-border hover:border-indigo-500/30'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="شكل الخط" sub="عرض النصوص العادية">
                <Select>
                  <option>عادي</option>
                  <option>عريض</option>
                  <option>مائل</option>
                </Select>
              </Field>

              <Field label="شكل الأيقونات">
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'rounded', label: 'مدور' }, { v: 'square', label: 'مربع' }, { v: 'circle', label: 'دائري' }].map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => setIconStyle(v)}
                      className={`py-2.5 rounded-xl border font-bold text-xs transition ${iconStyle === v ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-border hover:border-indigo-500/30'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="شكل الساعة في التطبيق">
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'digital', label: 'رقمي' }, { v: 'analog', label: 'تناظري' }, { v: 'minimal', label: 'مبسط' }].map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => setClockStyle(v)}
                      className={`py-2.5 rounded-xl border font-bold text-xs transition ${clockStyle === v ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-border hover:border-indigo-500/30'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Card>
        </div>
      )}

      {/* ── Live Clock ────────────────────────────────────────────── */}
      {tab === 'clock' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader icon={Clock4} color="bg-sky-500" title="شكل الساعة المباشرة" sub="تخصيص ساعة الوقت الفعلي" />
            <div className="space-y-5">
              <Field label="نوع العرض">
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'digital', label: 'رقمي' }, { v: 'analog', label: 'تناظري' }, { v: 'flip', label: 'انقلاب' }].map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => setClockStyle(v)}
                      className={`py-3 rounded-xl border font-bold text-sm transition ${clockStyle === v ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-border hover:border-sky-500/30'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="لون الساعة">
                <div className="flex flex-wrap gap-2 mt-1">
                  {APP_COLORS.map(c => (
                    <ColorSwatch key={c} color={c} selected={clockColor === c} onClick={() => setClockColor(c)} />
                  ))}
                </div>
              </Field>

              <Field label="حجم الساعة">
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'small', label: 'صغير' }, { v: 'medium', label: 'متوسط' }, { v: 'large', label: 'كبير' }].map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => setClockSize(v)}
                      className={`py-2.5 rounded-xl border font-bold text-sm transition ${clockSize === v ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-border hover:border-sky-500/30'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="مكان الساعة">
                <Select value={clockPos} onChange={e => setClockPos(e.target.value)}>
                  <option value="header">الهيدر العلوي</option>
                  <option value="sidebar">القائمة الجانبية</option>
                  <option value="dashboard">لوحة التحكم</option>
                  <option value="floating">عائمة</option>
                  <option value="hidden">مخفية</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon={Timer} color="bg-cyan-500" title="خيارات العرض" sub="ما يظهر مع الساعة" />
            <div className="space-y-1">
              <ToggleRow label="إظهار التاريخ" sub="يوم / شهر / سنة تحت الوقت" on={showDate} onToggle={() => setShowDate(s => !s)} />
              <ToggleRow label="إظهار الثواني" sub="hh:mm:ss بدل hh:mm" on={showSeconds} onToggle={() => setShowSeconds(s => !s)} />
              <ToggleRow label="اليوم بالعربي" sub="الإثنين، الثلاثاء..." on={true} onToggle={() => {}} />
              <ToggleRow label="الوقت بصيغة 12h" sub="AM / PM بدل 24 ساعة" on={false} onToggle={() => {}} />
              <ToggleRow label="ساعة الحضور" sub="وقت تسجيل الدخول بجانب الساعة" on={true} onToggle={() => {}} />
            </div>

            {/* Preview */}
            <div className="mt-5 rounded-xl border border-border bg-white/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-2 font-bold uppercase tracking-wider">معاينة</p>
              <div className="font-mono font-black text-4xl" style={{ color: clockColor }}>
                {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: showSeconds ? '2-digit' : undefined })}
              </div>
              {showDate && (
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Smart Assistant ───────────────────────────────────────── */}
      {tab === 'assistant' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader icon={Bot} color="bg-pink-500" title="المساعد الذكي" sub="تخصيص مساعد الذكاء الاصطناعي" />
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">تشغيل المساعد الذكي</p>
                    <p className="text-[11px] text-muted-foreground">يظهر في أسفل الشاشة</p>
                  </div>
                </div>
                <Toggle on={assistantOn} onToggle={() => setAssistantOn(s => !s)} />
              </div>

              <Field label="اسم المساعد">
                <Input value={assistantName} onChange={e => setAssistantName(e.target.value)} placeholder="WorkBot" />
              </Field>

              <Field label="الرسالة الترحيبية">
                <textarea
                  value={assistantMsg}
                  onChange={e => setAssistantMsg(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition"
                />
              </Field>

              <Field label="صورة المساعد" sub="PNG دائري — حجم موصى به 256×256">
                <label className="flex items-center justify-center gap-3 w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-pink-500/50 cursor-pointer transition group">
                  <input type="file" className="hidden" accept="image/*" />
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-pink-400 transition" />
                    <p className="text-xs text-muted-foreground">انقر لرفع صورة المساعد</p>
                  </div>
                </label>
              </Field>

              <Field label="شخصية المساعد">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'professional', label: 'رسمي' },
                    { v: 'friendly', label: 'ودود' },
                    { v: 'concise', label: 'مختصر' },
                    { v: 'detailed', label: 'تفصيلي' },
                  ].map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => setAssistantPersonality(v)}
                      className={`py-2.5 rounded-xl border font-bold text-sm transition ${assistantPersonality === v ? 'border-pink-500 bg-pink-500/10 text-pink-300' : 'border-border hover:border-pink-500/30'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="لغة المساعد">
                <Select value={assistantLang} onChange={e => setAssistantLang(e.target.value)}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="bilingual">عربي + English</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon={Key} color="bg-rose-500" title="مفاتيح الذكاء الاصطناعي" sub="ربط المساعد بمزودي الـ AI" />
            <div className="space-y-4">
              {[
                { id: 'openai',  label: 'OpenAI (ChatGPT)', placeholder: 'sk-...' },
                { id: 'gemini',  label: 'Google Gemini',    placeholder: 'AIza...' },
                { id: 'claude',  label: 'Anthropic Claude', placeholder: 'sk-ant-...' },
              ].map(({ id, label, placeholder }) => (
                <Field key={id} label={label}>
                  <div className="relative">
                    <input
                      type={showKeys[id] ? 'text' : 'password'}
                      value={apiKeys[id]}
                      onChange={e => setApiKeys(k => ({ ...k, [id]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 pr-10 font-mono transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys(s => ({ ...s, [id]: !s[id] }))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showKeys[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── API Keys ──────────────────────────────────────────────── */}
      {tab === 'apikeys' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader icon={Key} color="bg-amber-500" title="مفاتيح الخدمات" sub="ربط التطبيق بالخدمات الخارجية" />
            <div className="space-y-4">
              {[
                { id: 'firebase', label: 'Firebase', placeholder: 'AIza...' },
                { id: 'maps',     label: 'Google Maps API', placeholder: 'AIza...' },
                { id: 'smtp',     label: 'SMTP Email', placeholder: 'smtp://...' },
                { id: 'whatsapp', label: 'WhatsApp API', placeholder: 'token...' },
              ].map(({ id, label, placeholder }) => (
                <Field key={id} label={label}>
                  <div className="relative">
                    <input
                      type={showKeys[id] ? 'text' : 'password'}
                      value={apiKeys[id]}
                      onChange={e => setApiKeys(k => ({ ...k, [id]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500/50 pr-10 font-mono transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys(s => ({ ...s, [id]: !s[id] }))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showKeys[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader icon={Zap} color="bg-orange-500" title="مفاتيح إضافية" sub="مفاتيح مخصصة لخدمات أخرى" />
            <div className="space-y-3">
              <Field label="مفتاح مخصص 1">
                <Input placeholder="اسم الخدمة: المفتاح" />
              </Field>
              <Field label="مفتاح مخصص 2">
                <Input placeholder="اسم الخدمة: المفتاح" />
              </Field>
              <Field label="مفتاح مخصص 3">
                <Input placeholder="اسم الخدمة: المفتاح" />
              </Field>
              <button className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/40 text-amber-400 text-sm font-bold hover:bg-amber-500/5 transition">
                + إضافة مفتاح جديد
              </button>
            </div>

            {/* Warning box */}
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 shrink-0" /> المفاتيح مشفرة ومخزنة بأمان
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">لا تشارك هذه المفاتيح مع أحد. يتم تشفيرها قبل الحفظ.</p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Notifications ─────────────────────────────────────────── */}
      {tab === 'notif' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader icon={Bell} color="bg-orange-500" title="قنوات الإشعارات" sub="كيف تصلك التنبيهات" />
            <div>
              <ToggleRow label="إشعارات التطبيق" sub="تنبيهات داخل النظام" on={notif.app} onToggle={() => toggleNotif('app')} />
              <ToggleRow label="إشعارات البريد الإلكتروني" sub="ترسل على إيميلك" on={notif.email} onToggle={() => toggleNotif('email')} />
              <ToggleRow label="إشعارات واتساب" sub="رسائل WhatsApp تلقائية" on={notif.whatsapp} onToggle={() => toggleNotif('whatsapp')} />
              <ToggleRow label="أصوات التنبيه" sub="صوت عند كل إشعار" on={notif.sound} onToggle={() => toggleNotif('sound')} />
            </div>

            <div className="mt-4">
              <Field label="نبرة صوت التنبيه">
                <Select>
                  <option>افتراضي</option>
                  <option>ناعم</option>
                  <option>قوي</option>
                  <option>صامت</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon={AlarmClock} color="bg-red-500" title="المنبهات والتذكيرات" sub="تنبيهات الدوام والرواتب" />
            <div>
              <ToggleRow label="منبه بداية الدوام" sub="تنبيه قبل بداية وقت العمل" on={notif.shiftStart} onToggle={() => toggleNotif('shiftStart')} />
              <ToggleRow label="منبه نهاية الدوام" sub="تنبيه عند انتهاء وقت العمل" on={notif.shiftEnd} onToggle={() => toggleNotif('shiftEnd')} />
              <ToggleRow label="تذكير الرواتب" sub="إشعار يوم صرف الراتب" on={notif.salary} onToggle={() => toggleNotif('salary')} />
              <ToggleRow label="تذكير الإجازات" sub="إشعار عند اعتماد أو رفض إجازة" on={notif.leaves} onToggle={() => toggleNotif('leaves')} />
            </div>

            <div className="mt-4 space-y-3">
              <Field label="وقت منبه بداية الدوام">
                <Input type="time" defaultValue="08:45" />
              </Field>
              <Field label="وقت منبه نهاية الدوام">
                <Input type="time" defaultValue="17:00" />
              </Field>
            </div>
          </Card>
        </div>
      )}

      {/* ── Security ──────────────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader icon={Shield} color="bg-rose-500" title="أمان الحساب" sub="تغيير بيانات الدخول" />
            <div className="space-y-4">
              <Field label="تغيير البريد الإلكتروني">
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition"
                  />
                </div>
              </Field>

              <PasswordInput label="كلمة المرور الحالية" placeholder="كلمة المرور الحالية" />
              <PasswordInput label="كلمة المرور الجديدة" placeholder="كلمة مرور قوية" />
              <PasswordInput label="تأكيد كلمة المرور الجديدة" placeholder="أعد الكتابة" />

              <button className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> تحديث بيانات الدخول
              </button>
            </div>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader icon={Fingerprint} color="bg-violet-500" title="التحقق البيومتري" sub="Face ID & بصمة الإصبع" />
              <div>
                <ToggleRow label="Face ID" sub="الدخول بالتعرف على الوجه" on={false} onToggle={() => {}} />
                <ToggleRow label="بصمة الإصبع" sub="الدخول ببصمة الإصبع" on={false} onToggle={() => {}} />
                <ToggleRow label="PIN Code" sub="رمز سري مكون من 6 أرقام" on={true} onToggle={() => {}} />
              </div>
            </Card>

            <Card>
              <CardHeader icon={Database} color="bg-green-500" title="النسخ الاحتياطي" sub="حفظ واستعادة بيانات النظام" />
              <div className="space-y-2 text-xs text-muted-foreground mb-4">
                <p>آخر نسخة احتياطية: منذ ساعتين</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={createBackup}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition"
                >
                  <Download className="w-4 h-4" /> نسخ احتياطي
                </button>
                <button
                  onClick={restoreBackup}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:border-indigo-500/40 hover:bg-indigo-500/5 font-bold text-sm transition"
                >
                  <RefreshCw className="w-4 h-4" /> استعادة
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Attendance Settings ───────────────────────────────────── */}
      {tab === 'attendance' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader icon={Clock} color="bg-teal-500" title="ساعات العمل" sub="ضبط جدول الدوام الرسمي" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="بداية الدوام">
                  <Input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} />
                </Field>
                <Field label="نهاية الدوام">
                  <Input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} />
                </Field>
              </div>

              <Field label="مدة الاستراحة (دقائق)">
                <Input type="number" value={breakMin} onChange={e => setBreakMin(e.target.value)} min="0" max="120" />
              </Field>

              <Field label="بداية الأسبوع">
                <Select value={weekStart} onChange={e => setWeekStart(e.target.value)}>
                  <option value="sunday">الأحد</option>
                  <option value="monday">الإثنين</option>
                  <option value="saturday">السبت</option>
                </Select>
              </Field>

              <Field label="أيام العطل الأسبوعية">
                <div className="flex flex-wrap gap-2 mt-1">
                  {['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'].map(d => (
                    <button
                      key={d}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                        ['الجمعة','السبت'].includes(d)
                          ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                          : 'border-border hover:border-teal-500/30'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon={CalendarClock} color="bg-emerald-500" title="قواعد الحضور" sub="التأخير والإضافي والخصومات" />
            <div className="space-y-4">
              <Field label="فترة السماح للتأخير (دقائق)" sub="لا يُحتسب تأخيراً إذا دخل خلالها">
                <Input type="number" value={lateGrace} onChange={e => setLateGrace(e.target.value)} min="0" max="60" />
              </Field>

              <Field label="بداية احتساب الإضافي (دقائق بعد الانتهاء)" sub="يُحتسب إضافياً بعد هذه المدة">
                <Input type="number" value={otThreshold} onChange={e => setOtThreshold(e.target.value)} min="0" />
              </Field>

              <Field label="معدل الخصم عند الغياب">
                <Select value={deductRate} onChange={e => setDeductRate(e.target.value)}>
                  <option value="hour">خصم ساعة بساعة</option>
                  <option value="half">خصم نصف يوم</option>
                  <option value="full">خصم يوم كامل</option>
                </Select>
              </Field>

              <Field label="رصيد الإجازة السنوية (أيام)">
                <Input type="number" value={annualLeave} onChange={e => setAnnualLeave(e.target.value)} min="0" max="60" />
              </Field>

              <Field label="قواعد الإجازات">
                <Select>
                  <option>يُرحّل الرصيد للعام التالي</option>
                  <option>يسقط الرصيد غير المستخدم</option>
                  <option>يُصرف مقابل مالي</option>
                </Select>
              </Field>

              <button
                onClick={handleSave}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-sm shadow shadow-teal-500/20 hover:-translate-y-0.5 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> حفظ إعدادات الحضور
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
