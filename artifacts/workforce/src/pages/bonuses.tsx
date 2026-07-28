import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetEmployees, getGetEmployeesQueryKey, useGetPayroll, getGetPayrollQueryKey, useUpdatePayroll,
} from '@workspace/api-client-react';
import {
  Gift, TrendingDown, Plus, User, CreditCard, Star, AlertCircle,
  ChevronDown, Search, CheckCircle2, Banknote,
} from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

type Mode = 'bonus' | 'deduction';

const BONUS_TYPES = [
  { id: 'performance', icon: '🏆', label: { ar: 'مكافأة أداء', en: 'Performance Bonus', sv: 'Prestandabonus' } },
  { id: 'attendance', icon: '📅', label: { ar: 'مكافأة حضور', en: 'Attendance Bonus', sv: 'Närvarobonus' } },
  { id: 'ramadan', icon: '🌙', label: { ar: 'مكافأة رمضان', en: 'Ramadan Bonus', sv: 'Ramadanbonus' } },
  { id: 'annual', icon: '🎁', label: { ar: 'مكافأة سنوية', en: 'Annual Bonus', sv: 'Årsbonus' } },
  { id: 'exceptional', icon: '⭐', label: { ar: 'مكافأة استثنائية', en: 'Exceptional Bonus', sv: 'Exceptionell bonus' } },
  { id: 'other', icon: '💰', label: { ar: 'أخرى', en: 'Other', sv: 'Övrigt' } },
];
const DEDUCTION_TYPES = [
  { id: 'late', icon: '⏰', label: { ar: 'خصم تأخير', en: 'Late Deduction', sv: 'Förseningsavdrag' } },
  { id: 'absence', icon: '🚫', label: { ar: 'خصم غياب', en: 'Absence Deduction', sv: 'Frånvaroavdrag' } },
  { id: 'damage', icon: '💔', label: { ar: 'خصم تلف', en: 'Damage Deduction', sv: 'Skadeavdrag' } },
  { id: 'loan', icon: '🏦', label: { ar: 'استقطاع قرض', en: 'Loan Deduction', sv: 'Lånavdrag' } },
  { id: 'penalty', icon: '⚠️', label: { ar: 'جزاء', en: 'Penalty', sv: 'Böter' } },
  { id: 'other', icon: '📋', label: { ar: 'أخرى', en: 'Other', sv: 'Övrigt' } },
];

// ─── History row ──────────────────────────────────────────────────────────────
function HistoryRow({ mode, amount, type, empName, date }: { mode: Mode; amount: number; type: string; empName: string; date: string }) {
  const isBonus = mode === 'bonus';
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition
      ${isBonus ? 'border-green-500/20 bg-green-500/5 hover:border-green-500/40' : 'border-red-500/20 bg-red-500/5 hover:border-red-500/40'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg
        ${isBonus ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
        {isBonus ? '🎁' : '📋'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{empName}</p>
        <p className="text-[11px] text-muted-foreground">{type} · {date}</p>
      </div>
      <span className={`font-black text-base ${isBonus ? 'text-green-400' : 'text-red-400'}`}>
        {isBonus ? '+' : '-'}{amount.toLocaleString()}
      </span>
    </div>
  );
}

export default function Bonuses() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cid = user?.companyId || 0;
  const isRTL = locale === 'ar';

  const [mode, setMode] = useState<Mode>('bonus');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selEmp, setSelEmp] = useState<number | null>(null);
  const [selType, setSelType] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const { data: empData } = useGetEmployees({ companyId: cid }, { query: { enabled: !!cid, queryKey: getGetEmployeesQueryKey({ companyId: cid }) } });
  const { data: payrollData } = useGetPayroll({ companyId: cid }, { query: { enabled: !!cid, queryKey: getGetPayrollQueryKey({ companyId: cid }) } });
  const updatePayroll = useUpdatePayroll();

  const employees = useMemo(() =>
    (empData?.employees || []).filter(e => !search || (e.fullName || '').toLowerCase().includes(search.toLowerCase())),
    [empData, search]);

  const payrollRows = payrollData?.payroll || [];

  // Aggregate history from payroll
  const history = useMemo(() => {
    const empMap: Record<number, string> = {};
    (empData?.employees || []).forEach(e => { if (e.id) empMap[e.id] = e.fullName || '—'; });
    return payrollRows
      .flatMap(p => {
        const rows: { mode: Mode; amount: number; type: string; empName: string; date: string }[] = [];
        if ((p as any).bonus > 0) rows.push({ mode: 'bonus', amount: (p as any).bonus, type: 'مكافأة', empName: empMap[(p as any).employeeId] || '—', date: (p as any).payPeriod || '' });
        if ((p as any).deductions > 0) rows.push({ mode: 'deduction', amount: (p as any).deductions, type: 'خصم', empName: empMap[(p as any).employeeId] || '—', date: (p as any).payPeriod || '' });
        return rows;
      })
      .filter(r => r.mode === mode)
      .slice(0, 30);
  }, [payrollRows, empData, mode]);

  const totalBonus = payrollRows.reduce((s, p) => s + ((p as any).bonus || 0), 0);
  const totalDeductions = payrollRows.reduce((s, p) => s + ((p as any).deductions || 0), 0);

  async function handleSave() {
    if (!selEmp || !selType || !amount) return;
    setSaving(true);
    try {
      const payroll = payrollRows.find(p => (p as any).employeeId === selEmp);
      if (payroll?.id) {
        const patch = mode === 'bonus'
          ? { bonus: ((payroll as any).bonus || 0) + Number(amount) }
          : { deductions: ((payroll as any).deductions || 0) + Number(amount) };
        await updatePayroll.mutateAsync({ id: payroll.id, data: patch as any });
      }
      toast({ title: mode === 'bonus' ? (t('bonusAdded') || 'تمت إضافة المكافأة ✓') : (t('deductionAdded') || 'تم إضافة الخصم ✓') });
      queryClient.invalidateQueries({ queryKey: getGetPayrollQueryKey({ companyId: cid }) });
      setDrawerOpen(false);
      setSelEmp(null); setSelType(''); setAmount(''); setReason('');
    } catch {
      toast({ variant: 'destructive', title: t('error') });
    } finally {
      setSaving(false);
    }
  }

  const types = mode === 'bonus' ? BONUS_TYPES : DEDUCTION_TYPES;
  const l = (obj: { ar: string; en: string; sv: string }) => obj[locale as 'ar' | 'en' | 'sv'] || obj.ar;

  return (
    <div className="space-y-6 animate-fadeIn" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('bonusesDeductions')}</h1>
          <p className="text-sm mt-1 text-muted-foreground">{t('bonusesDeductionsDesc')}</p>
        </div>
        <button onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-green-500/20 hover:from-green-400 hover:to-emerald-500 transition">
          <Plus className="w-4 h-4" />
          {mode === 'bonus' ? (t('addBonus') || 'إضافة مكافأة') : (t('addDeduction') || 'إضافة خصم')}
        </button>
      </div>

      {/* Mode toggle */}
      <div className="card-3d p-1.5 flex gap-1.5 w-fit">
        {(['bonus', 'deduction'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${mode === m
              ? m === 'bonus'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground'}`}>
            {m === 'bonus' ? `🎁 ${t('bonuses') || 'المكافآت'}` : `📋 ${t('deductions')}`}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: t('totalBonuses') || 'إجمالي المكافآت', val: totalBonus, color: 'green', icon: Gift },
          { label: t('totalDeductions') || 'إجمالي الخصومات', val: totalDeductions, color: 'red', icon: TrendingDown },
          { label: t('netEffect') || 'الأثر الصافي', val: totalBonus - totalDeductions, color: totalBonus >= totalDeductions ? 'emerald' : 'rose', icon: Banknote },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="living-card p-4 text-center"
            style={{ '--card-accent': color === 'green' || color === 'emerald' ? '#22c55e' : '#f43f5e' } as React.CSSProperties}>
            <span className="living-card-orb" style={{ top: '-1rem', right: '-0.5rem' }} />
            <Icon className={`w-5 h-5 mx-auto mb-1.5 text-${color}-400`} />
            <p className={`text-2xl font-black ${val >= 0 ? `text-${color}-300` : 'text-red-300'}`}>{val >= 0 ? '' : ''}{Math.abs(val).toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="card-3d p-5 space-y-3">
        <h2 className="font-bold text-base">{mode === 'bonus' ? (t('bonusHistory') || 'سجل المكافآت') : (t('deductionHistory') || 'سجل الخصومات')}</h2>
        {history.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            {mode === 'bonus' ? (t('noBonusesYet') || 'لا توجد مكافآت بعد') : (t('noDeductionsYet') || 'لا توجد خصومات بعد')}
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => <HistoryRow key={i} {...h} />)}
          </div>
        )}
      </div>

      {/* Add Drawer */}
      <Drawer open={drawerOpen} onOpenChange={open => { setDrawerOpen(open); if (!open) { setSelEmp(null); setSelType(''); setAmount(''); setReason(''); } }}>
        <DrawerContent className="max-h-[96dvh]">
          <DrawerHeader className="border-b border-border/50 pb-3">
            <DrawerTitle className="flex items-center gap-2.5 font-display text-xl">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${mode === 'bonus' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                {mode === 'bonus' ? <Gift className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
              {mode === 'bonus' ? (t('addBonus') || 'إضافة مكافأة') : (t('addDeduction') || 'إضافة خصم')}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Employee selector */}
            <div className="living-card p-4 space-y-3"
              style={{ '--card-accent': mode === 'bonus' ? '#22c55e' : '#f43f5e' } as React.CSSProperties}>
              <span className="living-card-orb" style={{ top: '-1rem', right: '-0.5rem' }} />
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={t('searchEmployee')}
                  className="w-full rounded-xl border border-border bg-background h-10 ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {employees.map(e => (
                  <button key={e.id} onClick={() => setSelEmp(e.id || null)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition text-start
                      ${selEmp === e.id ? (mode === 'bonus' ? 'border-green-500 bg-green-500/10 text-green-300' : 'border-red-500 bg-red-500/10 text-red-300') : 'border-border hover:border-border/60'}`}>
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="truncate">{e.fullName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {mode === 'bonus' ? (t('bonusType') || 'نوع المكافأة') : (t('deductionType') || 'نوع الخصم')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {types.map(bt => (
                  <button key={bt.id} onClick={() => setSelType(bt.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-bold transition
                      ${selType === bt.id ? (mode === 'bonus' ? 'border-green-500 bg-green-500/10 text-green-300' : 'border-red-500 bg-red-500/10 text-red-300') : 'border-border hover:border-border/60 text-muted-foreground'}`}>
                    <span className="text-lg">{bt.icon}</span>
                    <span>{l(bt.label)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('amount') || 'المبلغ'}</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-border bg-background px-3 h-11 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition" />
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('reason')}</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                placeholder={mode === 'bonus' ? (t('bonusReason') || 'سبب المكافأة...') : (t('deductionReason') || 'سبب الخصم...')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition resize-none" />
            </div>
          </div>
          <div className="px-4 py-3 border-t border-border/50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
            <button onClick={handleSave} disabled={saving || !selEmp || !selType || !amount}
              className={`w-full h-11 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition
                ${mode === 'bonus' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              {saving ? t('saving') : mode === 'bonus' ? (t('addBonus') || 'إضافة المكافأة') : (t('addDeduction') || 'إضافة الخصم')}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
