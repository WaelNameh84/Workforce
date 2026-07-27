import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  useGetPayroll, useUpdatePayroll, getGetPayrollQueryKey,
  useGetEmployees, getGetEmployeesQueryKey,
  useGetAttendance, getGetAttendanceQueryKey,
  useGetLeaves, getGetLeavesQueryKey,
} from '@workspace/api-client-react';
import type { Payroll } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useAppSettings } from '@/contexts/settings-context';
import {
  DollarSign, TrendingUp, Download, FileText, Clock, Users, ChevronDown,
  Share2, Mail, Printer, AlertCircle, CheckCircle2, XCircle, Timer,
  CalendarRange, UserCheck, Banknote, TrendingDown, CreditCard, ShieldCheck,
  Building, ArrowUpRight, ArrowDownRight, Minus, X, ChevronRight, Settings2,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const money = (v?: string | number | null) => Number(v || 0);
const fmt = (n: number, currency = 'SAR') =>
  new Intl.NumberFormat('ar-SA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

function parseTime(hhmm: string, baseDate: Date) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

// Schedule config passed from settings
interface ScheduleConfig {
  workStart: string;    // 'HH:mm'
  workEnd: string;      // 'HH:mm'
  breakMin: number;     // minutes
  lateGraceMin: number; // minutes tolerated before counting as late
  otThresholdMin: number; // minutes after end before counting overtime
  deductRate: string;   // 'hour' | 'half' | 'full'
}

function calcAttendanceDay(
  clockIn: Date | null,
  clockOut: Date | null,
  empOverride: { workStart?: string; workEnd?: string },
  cfg: ScheduleConfig,
) {
  const start = empOverride.workStart || cfg.workStart;
  const end   = empOverride.workEnd   || cfg.workEnd;

  if (!clockIn || !clockOut) return { workedHours: 0, overtime: 0, late: 0, early: 0 };

  const scheduledStart = parseTime(start, clockIn);
  const scheduledEnd   = parseTime(end, clockIn);

  // Effective clock-in: if arrived early, count from scheduled start
  const effectiveIn = clockIn < scheduledStart ? scheduledStart : clockIn;

  // Late arrival in minutes — only counts if beyond grace period
  const rawLateMin = clockIn > scheduledStart
    ? (clockIn.getTime() - scheduledStart.getTime()) / 60000
    : 0;
  const lateMin = rawLateMin > cfg.lateGraceMin ? rawLateMin : 0;

  // Overtime: only after threshold past scheduled end
  const rawOtMin = clockOut > scheduledEnd
    ? (clockOut.getTime() - scheduledEnd.getTime()) / 60000
    : 0;
  const otMin = rawOtMin >= cfg.otThresholdMin ? rawOtMin : 0;
  const earlyMin = clockOut < scheduledEnd
    ? (scheduledEnd.getTime() - clockOut.getTime()) / 60000
    : 0;

  // Raw worked minutes (excluding break)
  const rawMin = (clockOut.getTime() - effectiveIn.getTime()) / 60000;
  const netMin = Math.max(0, rawMin - cfg.breakMin);

  return {
    workedHours: netMin / 60,
    overtime:    otMin / 60,
    late:        lateMin / 60,
    early:       earlyMin / 60,
  };
}

type LeaveCalc = {
  paidDays: number;
  unpaidDays: number;
  sickPaidDays: number;
  sickUnpaidDays: number;
};

function calcLeaves(leaves: any[], from: string, to: string): LeaveCalc {
  const result: LeaveCalc = { paidDays: 0, unpaidDays: 0, sickPaidDays: 0, sickUnpaidDays: 0 };
  for (const lv of leaves) {
    if (lv.status !== 'approved') continue;
    const overlap = !(lv.endDate < from || lv.startDate > to);
    if (!overlap) continue;
    const days = lv.daysCount || 0;
    const type: string = lv.type || '';
    const isPaid = lv.paymentStatus === 'paid';
    if (type === 'sick') {
      if (!isPaid) result.sickUnpaidDays += days;
      else result.sickPaidDays += days;
    } else if (!isPaid) {
      result.unpaidDays += days;
    } else {
      result.paidDays += days;
    }
  }
  return result;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmployeePaySummary {
  employeeId: number;
  employeeName: string;
  position: string;
  contractType: string;
  basicSalary: number;
  dailyRate: number;
  hourlyRate: number;
  // Time
  workedDays: number;
  workedHours: number;
  overtimeHours: number;
  lateHours: number;
  earlyHours: number;
  // Additions
  overtimePay: number;
  bonus: number;
  additions: number;
  // Deductions
  lateDeduction: number;
  earlyDeduction: number;
  unpaidLeaveDeduction: number;
  sickUnpaidDeduction: number;
  advances: number;
  purchases: number;
  otherDeductions: number;
  // Leave info
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  sickPaidDays: number;
  sickUnpaidDays: number;
  // Totals
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  // Status
  status: string;
  payrollId?: number;
}

// ─── Clock-out popup ──────────────────────────────────────────────────────────
function ClockOutPopup({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = [
    { id: 'overtime',   label: 'إضافي', icon: TrendingUp,   color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { id: 'forgot',     label: 'نسيت تسجيل الدخول', icon: AlertCircle, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { id: 'other',      label: 'أخرى', icon: Minus,          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 p-6 space-y-4" style={{ background: 'var(--card)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg font-display">تسجيل الخروج بعد وقت الدوام</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground">الساعة 16:01 — الرجاء تحديد سبب التسجيل المتأخر</p>
        <div className="space-y-2">
          {options.map(o => (
            <button
              key={o.id}
              onClick={() => setSelected(o.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition pressable ${selected === o.id ? o.color : 'border-border hover:border-white/20'}`}
            >
              <o.icon className="w-5 h-5" />
              <span className="font-medium">{o.label}</span>
              {selected === o.id && <CheckCircle2 className="w-4 h-4 ml-auto text-green-400" />}
            </button>
          ))}
        </div>
        <button
          disabled={!selected}
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold disabled:opacity-50 transition"
        >
          تأكيد
        </button>
      </div>
    </div>
  );
}

// ─── Payroll Card ─────────────────────────────────────────────────────────────
function PayrollCard({ emp, onView, onMarkPaid, currency, dailyHours }: { emp: EmployeePaySummary; onView: () => void; onMarkPaid: () => void; currency: string; dailyHours: number }) {
  const netPositive = emp.netSalary > 0;
  return (
    <div
      onClick={onView}
      className="rounded-2xl border border-border p-5 cursor-pointer pressable hover:border-indigo-500/40 transition-all group animate-fadeIn"
      style={{ background: 'var(--card)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-indigo-500/20">
          {emp.employeeName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base truncate">{emp.employeeName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{emp.position}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {emp.contractType === 'daily' ? 'عقد يومي' : 'موظف دائم'}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${emp.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              {emp.status === 'paid' ? 'مدفوع' : 'معلق'}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold font-data text-xl">{fmt(emp.netSalary, currency)}</div>
          <div className="text-xs text-muted-foreground">صافي الراتب</div>
        </div>
      </div>

      {/* Mini stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'var(--muted-bg)' }}>
          <div className="font-data font-bold text-sm text-green-400">{fmt(emp.basicSalary, currency)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">الأساسي</div>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'var(--muted-bg)' }}>
          <div className="font-data font-bold text-sm text-amber-400">+{fmt(emp.overtimePay + emp.bonus + emp.additions, currency)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">الإضافات</div>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'var(--muted-bg)' }}>
          <div className="font-data font-bold text-sm text-red-400">-{fmt(emp.totalDeductions, currency)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">الخصومات</div>
        </div>
      </div>

      {/* Hours bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">ساعات العمل</span>
          <span className="font-data font-bold">{emp.workedHours.toFixed(1)}h / {emp.workedDays * dailyHours}h</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted-bg)' }}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
            style={{ width: `${Math.min(100, (emp.workedHours / (emp.workedDays * dailyHours || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Leave tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {emp.paidLeaveDays > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">إجازة مدفوعة {emp.paidLeaveDays}ي</span>}
        {emp.unpaidLeaveDays > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">إجازة غير مدفوعة {emp.unpaidLeaveDays}ي</span>}
        {emp.sickPaidDays > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">مرضي مدفوع {emp.sickPaidDays}ي</span>}
        {emp.sickUnpaidDays > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">مرضي غير مدفوع {emp.sickUnpaidDays}ي</span>}
        {emp.overtimeHours > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">إضافي {emp.overtimeHours.toFixed(1)}h</span>}
        {emp.lateHours > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">تأخير {(emp.lateHours * 60).toFixed(0)}د</span>}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-border" onClick={e => e.stopPropagation()}>
        <button
          onClick={onView}
          className="flex-1 py-2 rounded-xl text-xs font-bold border border-border hover:border-indigo-500/40 transition flex items-center justify-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" /> كشف راتب
        </button>
        {emp.status !== 'paid' && (
          <button
            onClick={onMarkPaid}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-green-500 text-white shadow-md shadow-green-500/20 hover:bg-green-600 transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> تأكيد الدفع
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Detailed Payslip Modal ───────────────────────────────────────────────────
function PayslipModal({ emp, onClose, currency, cfg }: { emp: EmployeePaySummary; onClose: () => void; currency: string; cfg: ScheduleConfig }) {
  const handlePrint = () => window.print();
  const handleShare = async () => {
    const text = `كشف راتب - ${emp.employeeName}\nالراتب الأساسي: ${fmt(emp.basicSalary, currency)}\nالصافي: ${fmt(emp.netSalary, currency)}`;
    if (navigator.share) await navigator.share({ title: 'كشف راتب', text });
    else navigator.clipboard?.writeText(text);
  };

  const dailyHours = (cfg.breakMin > 0)
    ? (parseFloat(cfg.workEnd.split(':')[0]) - parseFloat(cfg.workStart.split(':')[0])) - cfg.breakMin / 60
    : (parseFloat(cfg.workEnd.split(':')[0]) - parseFloat(cfg.workStart.split(':')[0]));

  const deductRateLabel: Record<string, string> = {
    hour: 'خصم ساعة بساعة',
    half: 'خصم نصف يوم',
    full: 'خصم يوم كامل',
  };

  const Row = ({ label, value, color = '', sign = '' }: { label: string; value: number; color?: string; sign?: string }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-data font-bold text-sm ${color}`}>{sign}{fmt(value, currency)}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border shadow-2xl" style={{ background: 'var(--card)' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border" style={{ background: 'var(--card)' }}>
          <div>
            <h2 className="font-display font-bold text-lg">كشف الراتب التفصيلي</h2>
            <p className="text-xs text-muted-foreground">{emp.employeeName} — {emp.position}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="p-2 rounded-xl hover:bg-white/10 transition border border-border">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={handlePrint} className="p-2 rounded-xl hover:bg-white/10 transition border border-border">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition border border-border">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Net salary hero */}
          <div className="rounded-2xl p-6 text-center bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">الراتب الصافي</p>
            <p className="font-data font-bold text-4xl text-white">{fmt(emp.netSalary, currency)}</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="text-xs text-muted-foreground">{emp.workedDays} يوم عمل</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{emp.workedHours.toFixed(1)} ساعة</span>
            </div>
          </div>

          {/* Work time info — from attendance settings */}
          <div className="rounded-xl p-4 border border-indigo-500/20 bg-indigo-500/5">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-400" /> قواعد الدوام المطبّقة
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'دوام الدخول',         v: cfg.workStart },
                { l: 'دوام الخروج',          v: cfg.workEnd },
                { l: 'ساعات العمل الصافية',  v: `${dailyHours.toFixed(1)} ساعة` },
                { l: 'مدة الاستراحة',        v: `${cfg.breakMin} دقيقة (غير محسوبة)` },
                { l: 'فترة السماح للتأخير',   v: `${cfg.lateGraceMin} دقيقة` },
                { l: 'حد احتساب الإضافي',    v: `بعد ${cfg.otThresholdMin} د من نهاية الدوام` },
                { l: 'طريقة خصم الغياب',     v: deductRateLabel[cfg.deductRate] || cfg.deductRate },
                { l: 'أيام العمل المسجّلة',   v: `${emp.workedDays} يوم` },
                { l: 'ساعات إضافية',         v: `${emp.overtimeHours.toFixed(2)} ساعة` },
                { l: 'دقائق تأخير محتسبة',   v: `${(emp.lateHours * 60).toFixed(0)} دقيقة` },
              ].map(({ l, v }) => (
                <div key={l} className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{l}</span>
                  <span className="font-bold text-sm font-data">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Income */}
          <div className="rounded-xl p-4 border border-border">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-green-400" /> الإيرادات</h4>
            <Row label="الراتب الأساسي" value={emp.basicSalary} color="text-green-400" />
            <Row label="بدل العمل الإضافي (×1.5)" value={emp.overtimePay} color="text-amber-400" sign="+" />
            <Row label="المكافآت والحوافز" value={emp.bonus} color="text-amber-400" sign="+" />
            <Row label="إضافات أخرى" value={emp.additions} color="text-amber-400" sign="+" />
            <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-border">
              <span className="font-bold text-sm">إجمالي الإيرادات</span>
              <span className="font-data font-bold text-base text-green-400">{fmt(emp.grossSalary, currency)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="rounded-xl p-4 border border-border">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-red-400" /> الخصومات</h4>
            {emp.lateDeduction > 0 && <Row label="خصم التأخير" value={emp.lateDeduction} color="text-red-400" sign="-" />}
            {emp.earlyDeduction > 0 && <Row label="خصم الخروج المبكر" value={emp.earlyDeduction} color="text-red-400" sign="-" />}
            {emp.unpaidLeaveDeduction > 0 && <Row label="خصم الإجازات غير المدفوعة" value={emp.unpaidLeaveDeduction} color="text-red-400" sign="-" />}
            {emp.sickUnpaidDeduction > 0 && <Row label="خصم الإجازة المرضية غير المدفوعة" value={emp.sickUnpaidDeduction} color="text-red-400" sign="-" />}
            {emp.advances > 0 && <Row label="السلف" value={emp.advances} color="text-red-400" sign="-" />}
            {emp.purchases > 0 && <Row label="المشتريات" value={emp.purchases} color="text-red-400" sign="-" />}
            {emp.otherDeductions > 0 && <Row label="خصومات أخرى" value={emp.otherDeductions} color="text-red-400" sign="-" />}
            {emp.totalDeductions === 0 && <p className="text-xs text-muted-foreground py-2">لا توجد خصومات</p>}
            <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-border">
              <span className="font-bold text-sm">إجمالي الخصومات</span>
              <span className="font-data font-bold text-base text-red-400">-{fmt(emp.totalDeductions, currency)}</span>
            </div>
          </div>

          {/* Leaves */}
          <div className="rounded-xl p-4 border border-border">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><CalendarRange className="w-4 h-4 text-teal-400" /> تفاصيل الإجازات</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'إجازة مدفوعة', v: emp.paidLeaveDays, color: 'text-teal-400' },
                { l: 'إجازة غير مدفوعة', v: emp.unpaidLeaveDays, color: 'text-red-400' },
                { l: 'مرضية مدفوعة', v: emp.sickPaidDays, color: 'text-blue-400' },
                { l: 'مرضية غير مدفوعة', v: emp.sickUnpaidDays, color: 'text-orange-400' },
              ].map(({ l, v, color }) => (
                <div key={l} className="p-3 rounded-xl text-center" style={{ background: 'var(--muted-bg)' }}>
                  <div className={`font-bold text-xl font-data ${color}`}>{v}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Net result */}
          <div className="rounded-2xl p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">الراتب الصافي للصرف</p>
                <p className="font-display font-bold text-3xl mt-1">{fmt(emp.netSalary, currency)}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <Banknote className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PayrollPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const appSettings = useAppSettings();

  // ── Build schedule config from attendance settings ──────────────────────────
  const cfg: ScheduleConfig = useMemo(() => {
    const breakMin = parseInt(appSettings.breakMin) || 60;
    const [sh, sm] = appSettings.workStart.split(':').map(Number);
    const [eh, em] = appSettings.workEnd.split(':').map(Number);
    const totalWorkMin = (eh * 60 + em) - (sh * 60 + sm);
    const netMin = Math.max(totalWorkMin - breakMin, 0);
    return {
      workStart:     appSettings.workStart,
      workEnd:       appSettings.workEnd,
      breakMin,
      lateGraceMin:  parseInt(appSettings.lateGrace) || 0,
      otThresholdMin: parseInt(appSettings.otThreshold) || 0,
      deductRate:    appSettings.deductRate,
      _dailyHours:   netMin / 60,
    } as ScheduleConfig & { _dailyHours: number };
  }, [appSettings.workStart, appSettings.workEnd, appSettings.breakMin, appSettings.lateGrace, appSettings.otThreshold, appSettings.deductRate]);

  const dailyHours = (() => {
    const breakMin = parseInt(appSettings.breakMin) || 60;
    const [sh, sm] = appSettings.workStart.split(':').map(Number);
    const [eh, em] = appSettings.workEnd.split(':').map(Number);
    return Math.max(((eh * 60 + em) - (sh * 60 + sm) - breakMin) / 60, 1);
  })();

  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [selectedEmpId, setSelectedEmpId] = useState<number | 'all'>('all');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [viewPayslip, setViewPayslip] = useState<EmployeePaySummary | null>(null);
  const [showClockOutPopup, setShowClockOutPopup] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const cid = user?.companyId || 0;
  const period = dateFrom.slice(0, 7);

  const { data: payrollData, isLoading: payrollLoading } = useGetPayroll(
    { companyId: cid, period },
    { query: { enabled: !!cid, queryKey: getGetPayrollQueryKey({ companyId: cid, period }) } }
  );
  const { data: empData } = useGetEmployees(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetEmployeesQueryKey({ companyId: cid }) } }
  );
  const { data: attData } = useGetAttendance(
    { companyId: cid, startDate: dateFrom, endDate: dateTo },
    { query: { enabled: !!cid, queryKey: getGetAttendanceQueryKey({ companyId: cid, startDate: dateFrom, endDate: dateTo }) } }
  );
  const { data: leaveData } = useGetLeaves(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetLeavesQueryKey({ companyId: cid }) } }
  );

  const updateMutation = useUpdatePayroll();

  const employees = empData?.employees || [];
  const payrollRows = payrollData?.payroll || [];
  const attendanceRows: any[] = (attData as any)?.attendance || [];
  const leaveRows: any[] = leaveData?.leaves || [];

  // Build per-employee summaries — all rules come from attendance settings
  const summaries: EmployeePaySummary[] = useMemo(() => {
    return employees
      .filter(e => selectedEmpId === 'all' || e.id === selectedEmpId)
      .map(emp => {
        const pr = payrollRows.find(p => p.employeeId === emp.id);
        const empAtt = attendanceRows.filter(a => a.employeeId === emp.id);
        const empLeaves = leaveRows.filter(l => l.employeeId === emp.id);

        const basicSalary = money(emp.salary) || money(pr?.basicSalary);
        const dailyRate   = basicSalary / 30;
        const hourlyRate  = Math.max(dailyRate / dailyHours, 0.01);

        // Attendance calculations using settings
        let workedDays    = 0;
        let workedHours   = 0;
        let overtimeHours = 0;
        let lateHours     = 0;
        let earlyHours    = 0;

        for (const a of empAtt) {
          const ci = a.clockIn  ? new Date(a.clockIn)  : null;
          const co = a.clockOut ? new Date(a.clockOut) : null;
          const calc = calcAttendanceDay(ci, co, { workStart: (emp as any).workStart, workEnd: (emp as any).workEnd }, cfg);
          const justificationPaid = a.justificationStatus === 'approved' && a.paymentStatus === 'paid';
          if (calc.workedHours > 0) workedDays++;
          workedHours   += calc.workedHours;
          if (a.justificationType === 'overtime' && justificationPaid) {
            overtimeHours += calc.overtime;
          }
          if (!(a.justificationType === 'late' || a.justificationType === 'early') || !justificationPaid) {
            lateHours += calc.late;
          }
          if (a.justificationType === 'early' && !justificationPaid) {
            earlyHours += calc.early;
          }
        }

        // If no attendance records, fall back to payroll data
        if (workedDays === 0) {
          const daysInPeriod = new Date(new Date(dateFrom).getFullYear(), new Date(dateFrom).getMonth() + 1, 0).getDate();
          workedDays = daysInPeriod;
          workedHours = workedDays * dailyHours;
        }

        // Leave calculations
        const lvCalc = calcLeaves(empLeaves, dateFrom, dateTo);

        // ── Financials ──────────────────────────────────────────────────────
        const overtimePay  = overtimeHours * hourlyRate * 1.5; // 1.5x legal multiplier
        const bonus        = money(pr?.bonus);
        const additions    = 0;
        const grossSalary  = basicSalary + overtimePay + bonus + additions;

        // Late deduction — always by hour (late minutes are already exact)
        const lateDeduction = lateHours * hourlyRate;
        const earlyDeduction = earlyHours * hourlyRate;

        // Absence/unpaid-leave deduction — method from settings
        const unpaidDeductPerDay = cfg.deductRate === 'full'
          ? dailyRate
          : cfg.deductRate === 'half'
          ? dailyRate / 2
          : hourlyRate * dailyHours; // 'hour' → full day's worth but still by hour

        const unpaidLeaveDeduction = lvCalc.unpaidDays     * unpaidDeductPerDay;
        const sickUnpaidDeduction  = lvCalc.sickUnpaidDays * unpaidDeductPerDay;
        const advances             = 0;
        const purchases            = 0;
        const otherDeductions      = money(pr?.deductions);
        const totalDeductions      = lateDeduction + earlyDeduction + unpaidLeaveDeduction + sickUnpaidDeduction + advances + purchases + otherDeductions;

        const netSalary = Math.max(0, grossSalary - totalDeductions);

        return {
          employeeId:   emp.id ?? 0,
          employeeName: emp.fullName ?? '—',
          position:     emp.position || '—',
          contractType: emp.contractType || 'permanent',
          basicSalary,
          dailyRate,
          hourlyRate,
          workedDays,
          workedHours,
          overtimeHours,
          lateHours,
          earlyHours,
          overtimePay,
          bonus,
          additions,
          lateDeduction,
          earlyDeduction,
          unpaidLeaveDeduction,
          sickUnpaidDeduction,
          advances,
          purchases,
          otherDeductions,
          paidLeaveDays:   lvCalc.paidDays,
          unpaidLeaveDays: lvCalc.unpaidDays,
          sickPaidDays:    lvCalc.sickPaidDays,
          sickUnpaidDays:  lvCalc.sickUnpaidDays,
          grossSalary,
          totalDeductions,
          netSalary,
          status:    pr?.status || 'pending',
          payrollId: pr?.id,
        };
      });
  }, [employees, payrollRows, attendanceRows, leaveRows, dateFrom, dateTo, selectedEmpId, cfg, dailyHours]);

  const visibleSummaries = filter === 'all' ? summaries : summaries.filter(s => s.status === filter);

  const totals = useMemo(() => ({
    gross: summaries.reduce((a, s) => a + s.grossSalary, 0),
    net:   summaries.reduce((a, s) => a + s.netSalary, 0),
    deductions: summaries.reduce((a, s) => a + s.totalDeductions, 0),
    overtime: summaries.reduce((a, s) => a + s.overtimePay, 0),
    headcount: summaries.length,
  }), [summaries]);

  const markPaid = async (emp: EmployeePaySummary) => {
    if (!emp.payrollId) { toast({ variant: 'destructive', title: 'لا يوجد سجل راتب' }); return; }
    try {
      await updateMutation.mutateAsync({ id: emp.payrollId, data: { status: 'paid' } });
      toast({ title: 'تم تأكيد الدفع بنجاح ✓' });
      queryClient.invalidateQueries({ queryKey: getGetPayrollQueryKey() });
    } catch {
      toast({ variant: 'destructive', title: 'فشل في التحديث' });
    }
  };

  const exportPDF = () => {
    toast({ title: 'جار تصدير PDF...' });
    setTimeout(() => window.print(), 300);
  };

  const exportEmail = () => {
    const subject = `تقرير الرواتب — ${dateFrom} إلى ${dateTo}`;
    const body = summaries.map(s => `${s.employeeName}: ${fmt(s.netSalary, 'SAR')}`).join('\n');
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShare = async () => {
    const text = `تقرير الرواتب\nمن ${dateFrom} إلى ${dateTo}\nإجمالي الرواتب: ${fmt(totals.net, 'SAR')}`;
    if (navigator.share) await navigator.share({ title: 'تقرير الرواتب', text });
    else { navigator.clipboard?.writeText(text); toast({ title: 'تم نسخ التقرير' }); }
  };

  const generateReport = () => {
    setReportGenerated(true);
    toast({ title: 'تم إنشاء التقرير بنجاح' });
  };

  const isLoading = payrollLoading;

  return (
    <div className="space-y-6 animate-fadeIn" dir={useLanguage().locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">إدارة الرواتب</h1>
          <p className="text-sm mt-1 text-muted-foreground">تقارير تفصيلية شاملة للرواتب والخصومات والإضافات</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowClockOutPopup(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition"
          >
            <Timer className="w-4 h-4" /> تسجيل خروج إضافي
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-white/5 transition">
            <Printer className="w-4 h-4" /> PDF
          </button>
          <button onClick={exportEmail} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-white/5 transition">
            <Mail className="w-4 h-4" /> إيميل
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-white/5 transition">
            <Share2 className="w-4 h-4" /> مشاركة
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border p-4" style={{ background: 'var(--card)' }}>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          {/* Employee select */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-bold text-muted-foreground block mb-1.5">تحديد الموظف</label>
            <div className="relative">
              <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-border text-sm font-medium appearance-none"
                style={{ background: 'var(--muted-bg)' }}
              >
                <option value="all">جميع الموظفين</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date from */}
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-data"
              style={{ background: 'var(--muted-bg)' }}
            />
          </div>

          {/* Date to */}
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-data"
              style={{ background: 'var(--muted-bg)' }}
            />
          </div>

          {/* Generate */}
          <button
            onClick={generateReport}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 shrink-0"
          >
            <FileText className="w-4 h-4" /> إنشاء التقرير
          </button>
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الرواتب الصافية', value: fmt(totals.net, 'SAR'), icon: Banknote, color: 'from-green-500 to-emerald-500', sub: `${totals.headcount} موظف` },
          { label: 'إجمالي الإيرادات', value: fmt(totals.gross, 'SAR'), icon: TrendingUp, color: 'from-blue-500 to-cyan-500', sub: 'قبل الخصومات' },
          { label: 'إجمالي الخصومات', value: fmt(totals.deductions, 'SAR'), icon: TrendingDown, color: 'from-red-500 to-rose-500', sub: 'خصومات وسلف' },
          { label: 'بدل الإضافي', value: fmt(totals.overtime, 'SAR'), icon: Clock, color: 'from-amber-500 to-orange-500', sub: `${summaries.reduce((a, s) => a + s.overtimeHours, 0).toFixed(1)} ساعة` },
        ].map((stat, i) => (
          <div key={stat.label} className={`rounded-2xl p-5 border border-border animate-fadeIn stagger-${i + 1}`} style={{ background: 'var(--card)' }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-md`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="font-data font-bold text-xl mb-0.5">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1 rounded-xl border border-border" style={{ background: 'var(--card)' }}>
          {(['all', 'paid', 'pending'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${filter === v ? 'bg-indigo-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v === 'all' ? 'الكل' : v === 'paid' ? 'مدفوع' : 'معلق'} ({v === 'all' ? summaries.length : summaries.filter(s => s.status === v).length})
            </button>
          ))}
        </div>
        {reportGenerated && (
          <div className="flex items-center gap-2 text-xs text-green-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> تم إنشاء التقرير
          </div>
        )}
      </div>

      {/* ── Work Schedule Info Card — from attendance settings ───── */}
      <div className="rounded-2xl border border-indigo-500/20 p-4 bg-indigo-500/5">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-indigo-400">
          <Settings2 className="w-4 h-4" /> قواعد حساب الدوام (من إعدادات الحضور)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { l: 'بداية الدوام',         v: cfg.workStart },
            { l: 'نهاية الدوام',          v: cfg.workEnd },
            { l: 'مدة الاستراحة',         v: `${cfg.breakMin} دقيقة (غير محسوبة)` },
            { l: 'ساعات العمل الصافية',   v: `${dailyHours.toFixed(1)} ساعة/يوم` },
            { l: 'فترة السماح للتأخير',   v: `${cfg.lateGraceMin} دقيقة` },
            { l: 'حد احتساب الإضافي',    v: `بعد ${cfg.otThresholdMin} دقيقة` },
            { l: 'طريقة خصم الغياب',     v: cfg.deductRate === 'full' ? 'يوم كامل' : cfg.deductRate === 'half' ? 'نصف يوم' : 'ساعة بساعة' },
            { l: 'مضاعف الإضافي',        v: '1.5×' },
          ].map(({ l, v }) => (
            <div key={l} className="p-2.5 rounded-lg border border-indigo-500/10 bg-indigo-500/5">
              <p className="text-muted-foreground">{l}</p>
              <p className="font-bold text-white mt-0.5">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <span className="text-amber-400 font-bold">تلميح: </span>
          يمكنك تعديل هذه القواعد من صفحة <span className="text-indigo-400 font-bold">الإعدادات ← إعدادات الحضور</span>، وتنعكس فوراً على الحسابات.
        </p>
      </div>

      {/* ── Payroll Cards Grid ───────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'var(--card)' }} />
          ))}
        </div>
      ) : visibleSummaries.length === 0 ? (
        <div className="rounded-2xl border border-border p-16 text-center" style={{ background: 'var(--card)' }}>
          <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-bold text-lg">لا توجد سجلات رواتب</p>
          <p className="text-sm text-muted-foreground mt-1">اختر فترة مختلفة أو أضف موظفين</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleSummaries.map(emp => (
            <PayrollCard
              key={emp.employeeId}
              emp={emp}
              currency="SAR"
              dailyHours={dailyHours}
              onView={() => setViewPayslip(emp)}
              onMarkPaid={() => markPaid(emp)}
            />
          ))}
        </div>
      )}

      {/* ── Daily Contracts Info ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border p-5" style={{ background: 'var(--card)' }}>
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-purple-400" /> العقود اليومية
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { l: 'طريقة الحساب', v: 'الأجر اليومي × عدد أيام العمل', color: 'text-purple-400' },
            { l: 'ساعات العمل', v: '8 ساعات صافي (باستثناء ساعة الاستراحة)', color: 'text-blue-400' },
            { l: 'يُحدد بواسطة', v: 'المدير المباشر', color: 'text-green-400' },
          ].map(({ l, v, color }) => (
            <div key={l} className="p-4 rounded-xl border border-border" style={{ background: 'var(--muted-bg)' }}>
              <p className="text-xs text-muted-foreground mb-1">{l}</p>
              <p className={`font-bold text-sm ${color}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      {viewPayslip && (
        <PayslipModal emp={viewPayslip} onClose={() => setViewPayslip(null)} currency="SAR" cfg={cfg} />
      )}
      {showClockOutPopup && (
        <ClockOutPopup onClose={() => setShowClockOutPopup(false)} />
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .bottom-nav, header, aside, nav, button { display: none !important; }
          body { background: white; color: black; }
          .rounded-2xl { border: 1px solid #ddd !important; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
