import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { useGetEmployees, getGetEmployeesQueryKey } from '@workspace/api-client-react';
import {
  Trash2, Clock, CreditCard, Calendar, Bell, Activity,
  AlertTriangle, Users, FileText, Database, ShieldAlert,
  Search, User, CheckCircle2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ─── Report types ─────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    id: 'attendance',
    icon: Clock,
    label: { ar: 'سجلات الحضور',     en: 'Attendance Records',   sv: 'Närvaroregister' },
    sub:   { ar: 'جميع سجلات الدخول والخروج', en: 'All clock-in/out records', sv: 'Alla in-/utstämplingar' },
    color: 'orange',
    accent: '#f97316',
    grad:  'from-orange-500 to-amber-600',
  },
  {
    id: 'payroll',
    icon: CreditCard,
    label: { ar: 'سجلات الرواتب',    en: 'Payroll Records',      sv: 'Löneregister' },
    sub:   { ar: 'كشوف الرواتب والمدفوعات', en: 'Payslips and payments', sv: 'Lönespecifikationer och betalningar' },
    color: 'amber',
    accent: '#f59e0b',
    grad:  'from-amber-500 to-yellow-600',
  },
  {
    id: 'leaves',
    icon: Calendar,
    label: { ar: 'سجلات الإجازات',   en: 'Leave Records',        sv: 'Ledighetsregister' },
    sub:   { ar: 'طلبات الإجازات المؤرشفة', en: 'Archived leave requests', sv: 'Arkiverade ledighetsansökningar' },
    color: 'blue',
    accent: '#3b82f6',
    grad:  'from-blue-500 to-indigo-600',
  },
  {
    id: 'requests',
    icon: FileText,
    label: { ar: 'سجلات الطلبات',    en: 'Request Records',      sv: 'Förfrågningsregister' },
    sub:   { ar: 'السلف والطلبات المؤرشفة', en: 'Advances and archived requests', sv: 'Förskott och arkiverade förfrågningar' },
    color: 'violet',
    accent: '#8b5cf6',
    grad:  'from-violet-500 to-purple-600',
  },
  {
    id: 'notifications',
    icon: Bell,
    label: { ar: 'سجل الإشعارات',    en: 'Notification Log',     sv: 'Aviseringslogg' },
    sub:   { ar: 'التنبيهات والرسائل المحفوظة', en: 'Saved alerts and messages', sv: 'Sparade aviseringar och meddelanden' },
    color: 'purple',
    accent: '#a855f7',
    grad:  'from-purple-500 to-fuchsia-600',
  },
  {
    id: 'activity',
    icon: Activity,
    label: { ar: 'سجل النشاط',       en: 'Activity Log',         sv: 'Aktivitetslogg' },
    sub:   { ar: 'سجل عمليات المستخدمين', en: 'User operations log', sv: 'Användaroperationslogg' },
    color: 'cyan',
    accent: '#06b6d4',
    grad:  'from-cyan-500 to-sky-600',
  },
  {
    id: 'bonuses',
    icon: Database,
    label: { ar: 'المكافآت والخصومات', en: 'Bonuses & Deductions', sv: 'Bonusar & avdrag' },
    sub:   { ar: 'سجل المكافآت والخصومات المالية', en: 'Financial bonuses and deductions log', sv: 'Ekonomiska bonusar och avdragslogg' },
    color: 'green',
    accent: '#22c55e',
    grad:  'from-green-500 to-emerald-600',
  },
  {
    id: 'all',
    icon: ShieldAlert,
    label: { ar: 'مسح كامل',          en: 'Full Reset',           sv: 'Fullständig återställning' },
    sub:   { ar: '⚠️ مسح جميع البيانات — لا يمكن التراجع', en: '⚠️ Wipe all data — irreversible', sv: '⚠️ Radera all data — kan ej ångras' },
    color: 'red',
    accent: '#ef4444',
    grad:  'from-red-500 to-rose-600',
  },
];

// ─── EmployeeSelector ─────────────────────────────────────────────────────────
function EmployeeSelector({ employees, selectedId, onSelect, locale }: {
  employees: { id?: number; fullName?: string }[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  locale: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = employees.filter(e => !search || (e.fullName || '').toLowerCase().includes(search.toLowerCase()));

  const labels = {
    all:    { ar: 'كل الموظفين', en: 'All Employees', sv: 'Alla anställda' },
    search: { ar: 'بحث عن موظف...', en: 'Search employee...', sv: 'Sök anställd...' },
    sel:    { ar: 'تحديد الموظف (اختياري)', en: 'Select Employee (optional)', sv: 'Välj anställd (valfritt)' },
  };
  const l = (obj: { ar: string; en: string; sv: string }) => obj[locale as 'ar' | 'en' | 'sv'] || obj.ar;

  return (
    <div className="living-card p-4 space-y-3" style={{ '--card-accent': '#ef4444' } as React.CSSProperties}>
      <span className="living-card-orb" style={{ top: '-1rem', right: '-0.75rem' }} />
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{l(labels.sel)}</label>
      </div>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={l(labels.search)}
          className="w-full rounded-xl border border-border bg-background h-9 ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition" />
      </div>
      <div className="max-h-36 overflow-y-auto space-y-1.5">
        {/* All employees option */}
        <button onClick={() => onSelect('all', l(labels.all))}
          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-sm font-bold transition text-start
            ${selectedId === 'all' ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-border hover:border-border/60 text-muted-foreground'}`}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 text-white" />
          </div>
          <span>{l(labels.all)}</span>
          {selectedId === 'all' && <CheckCircle2 className="w-3.5 h-3.5 ms-auto text-red-400" />}
        </button>
        {/* Individual employees */}
        {filtered.map(e => (
          <button key={e.id} onClick={() => onSelect(String(e.id), e.fullName || '—')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-sm font-medium transition text-start
              ${selectedId === String(e.id) ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-border hover:border-border/60'}`}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="truncate">{e.fullName}</span>
            {selectedId === String(e.id) && <CheckCircle2 className="w-3.5 h-3.5 ms-auto text-red-400" />}
          </button>
        ))}
      </div>
      {selectedId !== 'all' && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
          <AlertTriangle className="w-3 h-3" />
          {locale === 'ar' ? 'سيتم مسح سجلات هذا الموظف فقط' : locale === 'sv' ? 'Endast denna anställdas poster raderas' : "Only this employee's records will be deleted"}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ClearReports() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const cid = user?.companyId || 0;
  const isRTL = locale === 'ar';

  const [selEmployee, setSelEmployee] = useState('all');
  const [empName, setEmpName] = useState('');
  const [confirmType, setConfirmType] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState<string[]>([]);

  const { data: empData } = useGetEmployees({ companyId: cid }, { query: { enabled: !!cid, queryKey: getGetEmployeesQueryKey({ companyId: cid }) } });
  const employees = empData?.employees || [];

  const l = (obj: { ar: string; en: string; sv: string }) => obj[locale as 'ar' | 'en' | 'sv'] || obj.ar;

  const confirmItem = REPORT_TYPES.find(r => r.id === confirmType);

  async function handleClear() {
    if (!confirmType) return;
    setClearing(true);
    try {
      // Store clear record in localStorage (in production: call delete API)
      const key = selEmployee !== 'all'
        ? `workforce-cleared-${confirmType}-emp-${selEmployee}-${Date.now()}`
        : `workforce-cleared-${confirmType}-${Date.now()}`;
      localStorage.setItem(key, new Date().toISOString());
      setCleared(prev => [...prev, confirmType]);
      const typeLabel = confirmItem ? l(confirmItem.label) : confirmType;
      const empLabel = selEmployee !== 'all' ? ` — ${empName}` : '';
      toast({ title: `✅ ${locale === 'ar' ? 'تم مسح' : locale === 'sv' ? 'Raderade' : 'Cleared'} ${typeLabel}${empLabel}` });
    } finally {
      setClearing(false);
      setConfirmType(null);
    }
  }

  const isAllClear = confirmType === 'all';

  return (
    <div className="space-y-6 animate-fadeIn" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t('clearReports')}</h1>
        <p className="text-sm mt-1 text-muted-foreground">{t('clearReportsDesc')}</p>
      </div>

      {/* Warning banner */}
      <div className="living-card px-5 py-4 flex items-start gap-3"
        style={{ '--card-accent': '#ef4444' } as React.CSSProperties}>
        <span className="living-card-orb" style={{ top: '-1rem', right: '-0.75rem' }} />
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          {locale === 'ar'
            ? 'تحذير: عملية الحذف لا يمكن التراجع عنها. تأكد من وجود نسخة احتياطية قبل المتابعة.'
            : locale === 'sv'
              ? 'Varning: Raderingsoperationen kan inte ångras. Se till att du har en säkerhetskopia innan du fortsätter.'
              : 'Warning: Deletion is irreversible. Make sure you have a backup before proceeding.'}
        </p>
      </div>

      {/* Employee selector */}
      <EmployeeSelector employees={employees} selectedId={selEmployee} onSelect={(id, name) => { setSelEmployee(id); setEmpName(name); }} locale={locale} />

      {/* Report types grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          const wasCleared = cleared.includes(rt.id);
          return (
            <button key={rt.id} onClick={() => setConfirmType(rt.id)}
              className={`living-card px-5 py-4 flex items-center gap-4 text-start group transition
                ${rt.id === 'all' ? 'sm:col-span-2' : ''}
                ${wasCleared ? 'opacity-60' : ''}`}
              style={{ '--card-accent': rt.accent } as React.CSSProperties}>
              <span className="living-card-orb" style={{ top: '-1rem', right: '-0.75rem' }} />
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${rt.grad} flex items-center justify-center shrink-0 shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{l(rt.label)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{l(rt.sub)}</p>
                {selEmployee !== 'all' && rt.id !== 'all' && (
                  <p className="text-[10px] text-amber-400 font-bold mt-1">👤 {empName}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {wasCleared && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                <Trash2 className={`w-4 h-4 text-${rt.color}-400 opacity-60 group-hover:opacity-100 transition`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmType !== null} onOpenChange={open => !open && setConfirmType(null)}>
        <AlertDialogContent className="rounded-3xl border-0 card-3d">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              {locale === 'ar' ? 'تأكيد المسح' : locale === 'sv' ? 'Bekräfta radering' : 'Confirm Deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-1.5">
              <span className="block">
                {locale === 'ar'
                  ? `هل أنت متأكد من مسح ${confirmItem ? l(confirmItem.label) : ''}؟`
                  : locale === 'sv'
                    ? `Är du säker på att du vill radera ${confirmItem ? l(confirmItem.label) : ''}?`
                    : `Are you sure you want to delete ${confirmItem ? l(confirmItem.label) : ''}?`}
              </span>
              {selEmployee !== 'all' && (
                <span className="block font-bold text-amber-400">
                  {locale === 'ar' ? `الموظف: ${empName}` : locale === 'sv' ? `Anställd: ${empName}` : `Employee: ${empName}`}
                </span>
              )}
              {isAllClear && (
                <span className="block font-bold text-red-400">
                  {locale === 'ar' ? '⚠️ سيتم مسح جميع البيانات!' : locale === 'sv' ? '⚠️ All data raderas!' : '⚠️ All data will be wiped!'}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl h-11">
              {locale === 'ar' ? 'إلغاء' : locale === 'sv' ? 'Avbryt' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className={`rounded-xl h-11 text-white border-0 ${isAllClear ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
              disabled={clearing}
            >
              {clearing
                ? (locale === 'ar' ? 'جاري المسح...' : locale === 'sv' ? 'Raderar...' : 'Deleting...')
                : (locale === 'ar' ? 'مسح الآن' : locale === 'sv' ? 'Radera nu' : 'Delete now')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
