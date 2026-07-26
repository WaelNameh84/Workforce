import { useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/settings-context';
import {
  Settings2, Palette, Clock4, Bot, Key, Bell, Shield, CalendarClock,
  Sun, Moon, Upload, Eye, EyeOff, Save, Check,
  Fingerprint, Database, RefreshCw, Download,
  Building2, Phone, Mail, MapPin, Image, Type, Layers,
  Zap, Lock, AlarmClock, Clock, Timer, User,
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

function Sel({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
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
        <Icon className="w-[18px] h-[18px] text-white" />
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
        <button type="button" onClick={() => setShow(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
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

const TABS = [
  { id: 'general',    label: 'عام',             icon: Settings2,     color: 'bg-indigo-500' },
  { id: 'appearance', label: 'المظهر',           icon: Palette,       color: 'bg-purple-500' },
  { id: 'clock',      label: 'الساعة',           icon: Clock4,        color: 'bg-sky-500' },
  { id: 'assistant',  label: 'المساعد',          icon: Bot,           color: 'bg-pink-500' },
  { id: 'apikeys',    label: 'API Keys',         icon: Key,           color: 'bg-amber-500' },
  { id: 'notif',      label: 'الإشعارات',        icon: Bell,          color: 'bg-orange-500' },
  { id: 'security',   label: 'الأمان',           icon: Shield,        color: 'bg-rose-500' },
  { id: 'attendance', label: 'إعدادات الحضور',  icon: CalendarClock, color: 'bg-teal-500' },
];

const APP_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f97316','#10b981','#06b6d4','#f59e0b','#ef4444','#64748b'];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast }           = useToast();
  const { s, update, save } = useSettings();
  const [tab, setTab]       = useState('general');
  const [saved, setSaved]   = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleSave = () => {
    save();
    setSaved(true);
    toast({ title: 'تم حفظ الإعدادات ✓' });
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleNotif = (k: keyof typeof s.notif) =>
    update({ notif: { ...s.notif, [k]: !s.notif[k] } });

  const createBackup = () => {
    const content = JSON.stringify(s, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'workforce-backup.json'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'تم حفظ النسخة الاحتياطية ✓' });
  };

  const restoreBackup = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
    inp.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      file.text().then(text => {
        try {
          const parsed = JSON.parse(text);
          update(parsed);
          save();
          toast({ title: 'تم استعادة النسخة الاحتياطية ✓' });
        } catch {
          toast({ title: 'خطأ في الملف', description: 'تأكد أن الملف صحيح' });
        }
      });
    };
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
              tab === t.id ? 'text-white border-transparent shadow-lg' : 'border-border text-muted-foreground hover:text-foreground hover:border-indigo-500/30 hover:bg-indigo-500/5'
            }`}
            style={tab === t.id ? { background: `linear-gradient(135deg, ${s.appColor}, ${s.appColor}cc)` } : {}}
          >
            <t.icon className="w-4 h-4 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── General ───────────────────────────────────────────── */}
      {tab === 'general' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader icon={Settings2} color="bg-indigo-500" title="هوية التطبيق" sub="اسم وصور التطبيق" />
            <div className="space-y-4">
              <Field label="اسم التطبيق">
                <Input value={s.appName} onChange={e => update({ appName: e.target.value })} />
              </Field>
              <Field label="الرسالة الترحيبية">
                <Input value={s.welcomeMsg} onChange={e => update({ welcomeMsg: e.target.value })} />
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
              <Field label="أيقونة التطبيق" sub="PNG مربع — 192×192">
                <label className="flex items-center justify-center gap-3 w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-indigo-500/50 cursor-pointer transition group">
                  <input type="file" className="hidden" accept="image/*" />
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-indigo-400 mx-auto mb-1 transition" />
                    <p className="text-xs text-muted-foreground">انقر لرفع الأيقونة</p>
                  </div>
                </label>
              </Field>
              <Field label="شاشة البداية">
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

          <Card>
            <CardHeader icon={Building2} color="bg-blue-500" title="معلومات الشركة" sub="بيانات الشركة الأساسية" />
            <div className="space-y-4">
              <Field label="اسم الشركة">
                <Input value={s.companyName} onChange={e => update({ companyName: e.target.value })} placeholder="اسم شركتك" />
              </Field>
              <Field label="عنوان الشركة">
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={s.companyAddr} onChange={e => update({ companyAddr: e.target.value })} placeholder="المدينة، الدولة"
                    className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                </div>
              </Field>
              <Field label="رقم الهاتف">
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={s.companyPhone} onChange={e => update({ companyPhone: e.target.value })} placeholder="+966 5x xxx xxxx" type="tel"
                    className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                </div>
              </Field>
              <Field label="البريد الإلكتروني">
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={s.companyEmail} onChange={e => update({ companyEmail: e.target.value })} placeholder="info@company.com" type="email"
                    className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                </div>
              </Field>

              {/* preview chip */}
              {s.companyName && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                  <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-sm font-bold text-indigo-300">{s.companyName}</span>
                  <span className="text-[11px] text-muted-foreground mr-auto">سيظهر في كل أقسام النظام</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Appearance ──────────────────────────────────────────── */}
      {tab === 'appearance' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader icon={Palette} color="bg-purple-500" title="الوضع والألوان" sub="تخصيص الشكل العام للتطبيق" />
            <div className="space-y-5">
              <Field label="وضع العرض">
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: 'light', icon: Sun, label: 'فاتح' }, { v: 'dark', icon: Moon, label: 'داكن' }].map(({ v, icon: Icon, label }) => (
                    <button key={v} onClick={() => setTheme(v as 'light' | 'dark')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition ${theme === v ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-border hover:border-indigo-500/30'}`}>
                      <Icon className="w-4 h-4" /> {label}
                      {theme === v && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="لون التطبيق الرئيسي" sub="يطبق فوراً على كامل التطبيق">
                <div className="flex flex-wrap gap-2 mt-1">
                  {APP_COLORS.map(c => (
                    <ColorSwatch key={c} color={c} selected={s.appColor === c} onClick={() => update({ appColor: c })} />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">مخصص:</span>
                  <input type="color" value={s.appColor} onChange={e => update({ appColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border border-border" />
                  <span className="font-mono text-xs text-muted-foreground">{s.appColor}</span>
                </div>
              </Field>

              <Field label="ألوان الكروت">
                <Sel value={s.cardColors} onChange={e => update({ cardColors: e.target.value })}>
                  <option value="auto">تلقائي (من الثيم)</option>
                  <option value="glass">شفاف زجاجي</option>
                  <option value="solid-dark">داكن صلب</option>
                  <option value="solid-light">فاتح صلب</option>
                </Sel>
              </Field>

              <Field label="لون الأزرار">
                <Sel value={s.buttonColor} onChange={e => update({ buttonColor: e.target.value })}>
                  <option value="auto">تلقائي (لون التطبيق)</option>
                  <option value="gradient">متدرج بنفسجي</option>
                  <option value="green">أخضر</option>
                  <option value="blue">أزرق</option>
                </Sel>
              </Field>

              <Field label="الخلفية">
                <Sel value={s.background} onChange={e => update({ background: e.target.value })}>
                  <option value="default">افتراضي</option>
                  <option value="gradient">تدرج لوني</option>
                  <option value="dotted">نقطي ناعم</option>
                  <option value="grid">شبكي</option>
                </Sel>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon={Type} color="bg-violet-500" title="الخط والأيقونات" sub="شكل وحجم العناصر" />
            <div className="space-y-5">
              <Field label="نوع الخط">
                <Sel value={s.fontFamily} onChange={e => update({ fontFamily: e.target.value })}>
                  <option value="system">System Default</option>
                  <option value="inter">Inter</option>
                  <option value="cairo">Cairo (عربي)</option>
                  <option value="tajawal">Tajawal (عربي)</option>
                  <option value="poppins">Poppins</option>
                  <option value="mono">Monospace</option>
                </Sel>
              </Field>

              <Field label="حجم الخط">
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'small', label: 'صغير' }, { v: 'medium', label: 'متوسط' }, { v: 'large', label: 'كبير' }].map(({ v, label }) => (
                    <button key={v} onClick={() => update({ fontSize: v as any })}
                      className={`py-2.5 rounded-xl border font-bold text-xs transition ${s.fontSize === v ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-border hover:border-indigo-500/30'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="شكل الخط">
                <Sel value={s.fontShape} onChange={e => update({ fontShape: e.target.value })}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                  <option value="italic">مائل</option>
                </Sel>
              </Field>

              <Field label="شكل الأيقونات">
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'rounded', label: 'مدور' }, { v: 'square', label: 'مربع' }, { v: 'circle', label: 'دائري' }].map(({ v, label }) => (
                    <button key={v} onClick={() => update({ iconStyle: v as any })}
                      className={`py-2.5 rounded-xl border font-bold text-xs transition ${s.iconStyle === v ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-border hover:border-indigo-500/30'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="شكل الساعة في التطبيق">
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'digital', label: 'رقمي' }, { v: 'analog', label: 'تناظري' }, { v: 'minimal', label: 'مبسط' }].map(({ v, label }) => (
                    <button key={v} onClick={() => update({ clockStyle: v as any })}
                      className={`py-2.5 rounded-xl border font-bold text-xs transition ${s.clockStyle === v ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-border hover:border-indigo-500/30'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Card>
        </div>
      )}

      {/* ── Live Clock ──────────────────────────────────────────── */}
      {tab === 'clock' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader icon={Clock4} color="bg-sky-500" title="شكل الساعة المباشرة" sub="تخصيص ساعة الوقت الفعلي" />
            <div className="space-y-5">
              <Field label="نوع العرض">
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'digital', label: 'رقمي' }, { v: 'analog', label: 'تناظري' }, { v: 'flip', label: 'انقلاب' }].map(({ v, label }) => (
                    <button key={v} onClick={() => update({ clockType: v as any })}
                      className={`py-3 rounded-xl border font-bold text-sm transition ${s.clockType === v ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-border hover:border-sky-500/30'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="لون الساعة">
                <div className="flex flex-wrap gap-2 mt-1">
                  {APP_COLORS.map(c => (
                    <ColorSwatch key={c} color={c} selected={s.clockColor === c} onClick={() => update({ clockColor: c })} />
                  ))}
                </div>
                <input type="color" value={s.clockColor} onChange={e => update({ clockColor: e.target.value })}
                  className="mt-2 w-8 h-8 rounded cursor-pointer border border-border" />
              </Field>

              <Field label="حجم الساعة">
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'small', label: 'صغير' }, { v: 'medium', label: 'متوسط' }, { v: 'large', label: 'كبير' }].map(({ v, label }) => (
                    <button key={v} onClick={() => update({ clockSize: v as any })}
                      className={`py-2.5 rounded-xl border font-bold text-sm transition ${s.clockSize === v ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-border hover:border-sky-500/30'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="مكان الساعة">
                <Sel value={s.clockPos} onChange={e => update({ clockPos: e.target.value as any })}>
                  <option value="header">الهيدر العلوي</option>
                  <option value="sidebar">القائمة الجانبية</option>
                  <option value="dashboard">لوحة التحكم</option>
                  <option value="floating">عائمة</option>
                  <option value="hidden">مخفية</option>
                </Sel>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon={Timer} color="bg-cyan-500" title="خيارات العرض" sub="ما يظهر مع الساعة" />
            <div>
              <ToggleRow label="إظهار التاريخ" sub="يوم / شهر / سنة تحت الوقت" on={s.showDate} onToggle={() => update({ showDate: !s.showDate })} />
              <ToggleRow label="إظهار الثواني" sub="hh:mm:ss بدل hh:mm" on={s.showSeconds} onToggle={() => update({ showSeconds: !s.showSeconds })} />
              <ToggleRow label="اليوم بالعربي" sub="الإثنين، الثلاثاء..." on={s.showArabicDay} onToggle={() => update({ showArabicDay: !s.showArabicDay })} />
              <ToggleRow label="الوقت بصيغة 12h" sub="AM / PM بدل 24 ساعة" on={s.show12h} onToggle={() => update({ show12h: !s.show12h })} />
              <ToggleRow label="ساعة الحضور" sub="وقت تسجيل الدخول بجانب الساعة" on={s.showShiftClock} onToggle={() => update({ showShiftClock: !s.showShiftClock })} />
            </div>

            {/* Live preview */}
            <div className="mt-5 rounded-xl border border-border bg-white/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-2 font-bold uppercase tracking-wider">معاينة مباشرة</p>
              <div className={`font-mono font-black ${s.clockSize === 'small' ? 'text-2xl' : s.clockSize === 'large' ? 'text-5xl' : 'text-4xl'}`} style={{ color: s.clockColor }}>
                {new Date().toLocaleTimeString(s.showArabicDay ? 'ar-SA' : 'en-US', {
                  hour: '2-digit', minute: '2-digit',
                  second: s.showSeconds ? '2-digit' : undefined,
                  hour12: s.show12h,
                })}
              </div>
              {s.showDate && (
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date().toLocaleDateString(s.showArabicDay ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Smart Assistant ──────────────────────────────────────── */}
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
                    <p className="text-[11px] text-muted-foreground">يظهر في صفحة المساعد وكزر عائم</p>
                  </div>
                </div>
                <Toggle on={s.assistantOn} onToggle={() => update({ assistantOn: !s.assistantOn })} />
              </div>

              <Field label="اسم المساعد">
                <Input value={s.assistantName} onChange={e => update({ assistantName: e.target.value })} placeholder="WorkBot" />
              </Field>

              <Field label="الرسالة الترحيبية">
                <textarea value={s.assistantMsg} onChange={e => update({ assistantMsg: e.target.value })} rows={2}
                  className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition" />
              </Field>

              <Field label="صورة المساعد" sub="PNG دائري — 256×256">
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
                  {[{ v: 'professional', label: 'رسمي' }, { v: 'friendly', label: 'ودود' }, { v: 'concise', label: 'مختصر' }, { v: 'detailed', label: 'تفصيلي' }].map(({ v, label }) => (
                    <button key={v} onClick={() => update({ assistantPersonality: v })}
                      className={`py-2.5 rounded-xl border font-bold text-sm transition ${s.assistantPersonality === v ? 'border-pink-500 bg-pink-500/10 text-pink-300' : 'border-border hover:border-pink-500/30'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="لغة المساعد">
                <Sel value={s.assistantLang} onChange={e => update({ assistantLang: e.target.value })}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="bilingual">عربي + English</option>
                </Sel>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon={Key} color="bg-rose-500" title="مفاتيح الذكاء الاصطناعي" sub="ربط المساعد بمزودي الـ AI" />
            <div className="space-y-4">
              {[
                { id: 'openai', label: 'OpenAI (ChatGPT)', placeholder: 'sk-...' },
                { id: 'gemini', label: 'Google Gemini',    placeholder: 'AIza...' },
                { id: 'claude', label: 'Anthropic Claude', placeholder: 'sk-ant-...' },
              ].map(({ id, label, placeholder }) => (
                <Field key={id} label={label}>
                  <div className="relative">
                    <input type={showKeys[id] ? 'text' : 'password'}
                      value={s.apiKeys[id] || ''}
                      onChange={e => update({ apiKeys: { ...s.apiKeys, [id]: e.target.value } })}
                      placeholder={placeholder}
                      className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 pr-10 font-mono transition" />
                    <button type="button" onClick={() => setShowKeys(v => ({ ...v, [id]: !v[id] }))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
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
                { id: 'firebase',  label: 'Firebase',       placeholder: 'AIza...' },
                { id: 'maps',      label: 'Google Maps API', placeholder: 'AIza...' },
                { id: 'smtp',      label: 'SMTP Email',      placeholder: 'smtp://...' },
                { id: 'whatsapp',  label: 'WhatsApp API',    placeholder: 'token...' },
              ].map(({ id, label, placeholder }) => (
                <Field key={id} label={label}>
                  <div className="relative">
                    <input type={showKeys[id] ? 'text' : 'password'}
                      value={s.apiKeys[id] || ''}
                      onChange={e => update({ apiKeys: { ...s.apiKeys, [id]: e.target.value } })}
                      placeholder={placeholder}
                      className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500/50 pr-10 font-mono transition" />
                    <button type="button" onClick={() => setShowKeys(v => ({ ...v, [id]: !v[id] }))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
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
              <Field label="مفتاح مخصص 1"><Input placeholder="اسم الخدمة: المفتاح" /></Field>
              <Field label="مفتاح مخصص 2"><Input placeholder="اسم الخدمة: المفتاح" /></Field>
              <Field label="مفتاح مخصص 3"><Input placeholder="اسم الخدمة: المفتاح" /></Field>
              <button className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/40 text-amber-400 text-sm font-bold hover:bg-amber-500/5 transition">
                + إضافة مفتاح جديد
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
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
              <ToggleRow label="إشعارات التطبيق" sub="تنبيهات داخل النظام" on={s.notif.app} onToggle={() => toggleNotif('app')} />
              <ToggleRow label="إشعارات البريد الإلكتروني" sub="ترسل على إيميلك" on={s.notif.email} onToggle={() => toggleNotif('email')} />
              <ToggleRow label="إشعارات واتساب" sub="رسائل WhatsApp تلقائية" on={s.notif.whatsapp} onToggle={() => toggleNotif('whatsapp')} />
              <ToggleRow label="أصوات التنبيه" sub="صوت عند كل إشعار" on={s.notif.sound} onToggle={() => toggleNotif('sound')} />
            </div>
            <div className="mt-4">
              <Field label="نبرة صوت التنبيه">
                <Sel><option>افتراضي</option><option>ناعم</option><option>قوي</option><option>صامت</option></Sel>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon={AlarmClock} color="bg-red-500" title="المنبهات والتذكيرات" sub="تنبيهات الدوام والرواتب" />
            <div>
              <ToggleRow label="منبه بداية الدوام" on={s.notif.shiftStart} onToggle={() => toggleNotif('shiftStart')} />
              <ToggleRow label="منبه نهاية الدوام" on={s.notif.shiftEnd} onToggle={() => toggleNotif('shiftEnd')} />
              <ToggleRow label="تذكير الرواتب" sub="إشعار يوم صرف الراتب" on={s.notif.salary} onToggle={() => toggleNotif('salary')} />
              <ToggleRow label="تذكير الإجازات" sub="إشعار عند اعتماد أو رفض إجازة" on={s.notif.leaves} onToggle={() => toggleNotif('leaves')} />
            </div>
            <div className="mt-4 space-y-3">
              <Field label="وقت منبه بداية الدوام">
                <Input type="time" value={s.shiftStartAlarm} onChange={e => update({ shiftStartAlarm: e.target.value })} />
              </Field>
              <Field label="وقت منبه نهاية الدوام">
                <Input type="time" value={s.shiftEndAlarm} onChange={e => update({ shiftEndAlarm: e.target.value })} />
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
                  <input type="email" placeholder="البريد الجديد"
                    className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition" />
                </div>
              </Field>
              <PasswordInput label="كلمة المرور الحالية" />
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
                <ToggleRow label="بصمة الإصبع" on={false} onToggle={() => {}} />
                <ToggleRow label="PIN Code" sub="رمز سري مكون من 6 أرقام" on={true} onToggle={() => {}} />
              </div>
            </Card>

            <Card>
              <CardHeader icon={Database} color="bg-green-500" title="النسخ الاحتياطي" sub="حفظ واستعادة كامل إعدادات النظام" />
              <p className="text-xs text-muted-foreground mb-4">يشمل الملف: جميع الإعدادات، الألوان، ساعات العمل، وبيانات الشركة.</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={createBackup} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition">
                  <Download className="w-4 h-4" /> نسخ احتياطي
                </button>
                <button onClick={restoreBackup} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:border-indigo-500/40 hover:bg-indigo-500/5 font-bold text-sm transition">
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
                  <Input type="time" value={s.workStart} onChange={e => update({ workStart: e.target.value })} />
                </Field>
                <Field label="نهاية الدوام">
                  <Input type="time" value={s.workEnd} onChange={e => update({ workEnd: e.target.value })} />
                </Field>
              </div>

              <Field label="مدة الاستراحة (دقائق)">
                <Input type="number" value={s.breakMin} onChange={e => update({ breakMin: e.target.value })} min="0" max="120" />
              </Field>

              <Field label="بداية الأسبوع">
                <Sel value={s.weekStart} onChange={e => update({ weekStart: e.target.value })}>
                  <option value="sunday">الأحد</option>
                  <option value="monday">الإثنين</option>
                  <option value="saturday">السبت</option>
                </Sel>
              </Field>

              <Field label="أيام العطل الأسبوعية">
                <div className="flex flex-wrap gap-2 mt-1">
                  {['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'].map(d => (
                    <button key={d}
                      onClick={() => {
                        const curr = s.holidays;
                        update({ holidays: curr.includes(d) ? curr.filter(x => x !== d) : [...curr, d] });
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${s.holidays.includes(d) ? 'border-teal-500 bg-teal-500/10 text-teal-300' : 'border-border hover:border-teal-500/30'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Summary chip */}
              <div className="p-3 rounded-xl border border-teal-500/20 bg-teal-500/5 text-xs text-teal-300 font-bold space-y-1">
                <p>⏰ الدوام: {s.workStart} → {s.workEnd}</p>
                <p>☕ الاستراحة: {s.breakMin} دقيقة</p>
                <p>🗓 العطل: {s.holidays.join('، ') || 'لا يوجد'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader icon={CalendarClock} color="bg-emerald-500" title="قواعد الحضور" sub="التأخير والإضافي والخصومات" />
            <div className="space-y-4">
              <Field label="فترة السماح للتأخير (دقائق)" sub="لا يُحتسب تأخيراً إذا دخل خلالها">
                <Input type="number" value={s.lateGrace} onChange={e => update({ lateGrace: e.target.value })} min="0" max="60" />
              </Field>

              <Field label="بداية احتساب الإضافي (دقائق)" sub="يُحتسب إضافياً بعد انتهاء الدوام بهذه المدة">
                <Input type="number" value={s.otThreshold} onChange={e => update({ otThreshold: e.target.value })} min="0" />
              </Field>

              <Field label="معدل الخصم عند الغياب">
                <Sel value={s.deductRate} onChange={e => update({ deductRate: e.target.value })}>
                  <option value="hour">خصم ساعة بساعة</option>
                  <option value="half">خصم نصف يوم</option>
                  <option value="full">خصم يوم كامل</option>
                </Sel>
              </Field>

              <Field label="رصيد الإجازة السنوية (أيام)">
                <Input type="number" value={s.annualLeave} onChange={e => update({ annualLeave: e.target.value })} min="0" max="60" />
              </Field>

              <Field label="سياسة الإجازات">
                <Sel value={s.leavePolicy} onChange={e => update({ leavePolicy: e.target.value })}>
                  <option value="carryover">يُرحّل الرصيد للعام التالي</option>
                  <option value="expire">يسقط الرصيد غير المستخدم</option>
                  <option value="payout">يُصرف مقابل مالي</option>
                </Sel>
              </Field>

              <button onClick={handleSave}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-sm shadow shadow-teal-500/20 hover:-translate-y-0.5 transition flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> حفظ إعدادات الحضور
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
