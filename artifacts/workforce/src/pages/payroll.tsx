import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  useGetPayroll, useUpdatePayroll, getGetPayrollQueryKey,
  useGetEmployees, getGetEmployeesQueryKey,
  useGetAttendance, getGetAttendanceQueryKey,
  useGetLeaves, getGetLeavesQueryKey,
  useGetRequests, getGetRequestsQueryKey,
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
  absentDays: number;
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
  purchasesCount: number;
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

// ─── Payroll Card colour palette ──────────────────────────────────────────────
const payCardColors = [
  { from: 'from-indigo-500', to: 'to-purple-600',  glow: 'shadow-indigo-500/30' },
  { from: 'from-emerald-500', to: 'to-teal-600',   glow: 'shadow-emerald-500/30' },
  { from: 'from-rose-500',   to: 'to-red-600',     glow: 'shadow-rose-500/30' },
  { from: 'from-amber-500',  to: 'to-orange-600',  glow: 'shadow-amber-500/30' },
  { from: 'from-violet-500', to: 'to-fuchsia-600', glow: 'shadow-violet-500/30' },
  { from: 'from-cyan-500',   to: 'to-sky-600',     glow: 'shadow-cyan-500/30' },
];

// ─── Payroll Card ─────────────────────────────────────────────────────────────
function PayrollCard({ emp, onView, onMarkPaid, currency, dailyHours, colorIdx = 0 }: { emp: EmployeePaySummary; onView: () => void; onMarkPaid: () => void; currency: string; dailyHours: number; colorIdx?: number }) {
  const clr = payCardColors[colorIdx % payCardColors.length];
  return (
    <div
      onClick={onView}
      className="rounded-2xl overflow-hidden cursor-pointer pressable transition-all group animate-fadeIn border border-border"
      style={{ background: 'var(--card)' }}
    >
      {/* ── Coloured gradient header with wave ── */}
      <div className={`h-16 bg-gradient-to-br ${clr.from} ${clr.to} relative overflow-hidden flex items-center px-5 gap-4`}>
        <div className="nav-card-wave" />
        <div className="card-orb w-20 h-20 absolute -right-4 -top-4" />
        <div className="card-orb card-orb-sm w-14 h-14 absolute -left-2 -bottom-2" />
        <div className={`relative z-10 w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-xl shadow-lg ${clr.glow} card-icon-pulse`}>
          {emp.employeeName.charAt(0)}
        </div>
        <div className="relative z-10 flex-1 min-w-0">
          <div className="font-bold text-white truncate">{emp.employeeName}</div>
          <div className="text-white/65 text-xs truncate">{emp.position}</div>
        </div>
        <div className="relative z-10 text-right shrink-0">
          <div className="font-bold font-data text-white text-lg leading-tight">{fmt(emp.netSalary, currency)}</div>
          <div className="text-white/65 text-[10px]">صافي الراتب</div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5">
      {/* Contract + status badges */}
      <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {emp.contractType === 'daily' ? 'عقد يومي' : 'موظف دائم'}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${emp.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              {emp.status === 'paid' ? 'مدفوع' : 'معلق'}
            </span>
      </div>

      {/* Mini stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'var(--muted-bg)' }}>
          <div className="font-data font-bold text-sm text-green-700 dark:text-green-400">{fmt(emp.basicSalary, currency)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">الأساسي</div>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'var(--muted-bg)' }}>
          <div className="font-data font-bold text-sm text-amber-700 dark:text-amber-400">+{fmt(emp.overtimePay + emp.bonus + emp.additions, currency)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">الإضافات</div>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'var(--muted-bg)' }}>
          <div className="font-data font-bold text-sm text-red-700 dark:text-red-400">-{fmt(emp.totalDeductions, currency)}</div>
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
      </div>{/* /body */}
    </div>
  );
}

// ─── Detailed Payslip Modal ───────────────────────────────────────────────────
function PayslipModal({
  emp,
  onClose,
  currency,
  cfg,
  dateFrom,
  dateTo,
  onEmail,
}: {
  emp: EmployeePaySummary;
  onClose: () => void;
  currency: string;
  cfg: ScheduleConfig;
  dateFrom: string;
  dateTo: string;
  onEmail: () => void;
}) {
  const handlePrint = () => {
    document.body.classList.add('printing-payslip');
    window.print();
    window.setTimeout(() => document.body.classList.remove('printing-payslip'), 500);
  };
  const handleShare = async () => {
    const text = `كشف راتب - ${emp.employeeName}\nالراتب الأساسي: ${fmt(emp.basicSalary, currency)}\nالصافي: ${fmt(emp.netSalary, currency)}`;
    if (navigator.share) await navigator.share({ title: 'كشف راتب', text });
    else navigator.clipboard?.writeText(text);
  };

  // Format date for display
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return d; }
  };

  const totalAdditions = emp.overtimePay + emp.bonus + emp.additions;

  return (
    <div className="payslip-wrapper min-h-[calc(100vh-5rem)] animate-fadeIn pb-8" dir="rtl">
      {/* ── Action bar (screen only) ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b border-border print:hidden" style={{ background: 'var(--background)' }}>
        <button
          onClick={onClose}
          className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold transition hover:bg-white/5"
        >
          <ArrowDownRight className="h-4 w-4 rotate-45" /> العودة للرواتب
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onEmail} title="إرسال بالبريد الإلكتروني"
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-white/5 transition">
            <Mail className="w-3.5 h-3.5" /> إيميل
          </button>
          <button onClick={handleShare} title="مشاركة"
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-white/5 transition">
            <Share2 className="w-3.5 h-3.5" /> مشاركة
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90">
            <Download className="w-3.5 h-3.5" /> تصدير PDF
          </button>
        </div>
      </div>

      {/* ── Payslip Document ── */}
      <div className="payslip-doc mx-auto mt-6 w-full max-w-3xl rounded-2xl border border-border shadow-2xl overflow-hidden" style={{ background: 'var(--card)' }}>

        {/* === TOP GRADIENT HEADER === */}
        <div className="payslip-header bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-8 text-white relative overflow-hidden">
          <div className="nav-card-wave" />
          <div className="card-orb w-56 h-56 absolute -left-10 -top-10 opacity-30" />
          <div className="card-orb w-40 h-40 absolute -right-8 -bottom-8 opacity-20" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            {/* Company info placeholder */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white/70 text-xs uppercase tracking-wider">كشف الراتب</p>
                  <h1 className="font-display text-xl font-bold text-white">Payslip</h1>
                </div>
              </div>
              <div className="space-y-1 text-white/80 text-sm">
                <p>الفترة: <span className="font-bold text-white">{formatDate(dateFrom)}</span></p>
                <p>إلى: <span className="font-bold text-white">{formatDate(dateTo)}</span></p>
              </div>
            </div>

            {/* Net salary badge */}
            <div className="sm:text-left text-right">
              <p className="text-white/70 text-xs uppercase tracking-widest mb-1">صافي الراتب المستحق</p>
              <p className="font-data text-4xl sm:text-5xl font-bold text-white drop-shadow">{fmt(emp.netSalary, currency)}</p>
              <div className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold border ${
                emp.status === 'paid' ? 'bg-green-500/20 text-green-200 border-green-400/40' : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
              }`}>
                {emp.status === 'paid' ? '✓ تم الصرف' : '⏳ بانتظار الصرف'}
              </div>
            </div>
          </div>
        </div>

        {/* === EMPLOYEE INFO ROW === */}
        <div className="px-6 py-5 border-b border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'اسم الموظف', value: emp.employeeName, icon: Users },
            { label: 'المسمى الوظيفي', value: emp.position || '—', icon: Building },
            { label: 'نوع العقد', value: emp.contractType === 'daily' ? 'عقد يومي' : 'موظف دائم', icon: FileText },
            { label: 'الراتب الأساسي', value: fmt(emp.basicSalary, currency), icon: Banknote },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Icon className="w-3 h-3" /> {label}
              </p>
              <p className="font-bold text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* === ATTENDANCE SUMMARY === */}
        <div className="px-6 py-5 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> ملخص الحضور والدوام
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: 'أيام الحضور', value: `${emp.workedDays}`, unit: 'يوم', color: 'text-green-500 dark:text-green-400', bg: 'bg-green-500/8 border-green-500/20' },
              { label: 'أيام الغياب', value: `${emp.absentDays}`, unit: 'يوم', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/8 border-red-500/20' },
              { label: 'ساعات العمل', value: emp.workedHours.toFixed(1), unit: 'ساعة', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/8 border-blue-500/20' },
              { label: 'ساعات إضافي', value: emp.overtimeHours.toFixed(1), unit: 'ساعة', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/8 border-amber-500/20' },
              { label: 'دقائق التأخير', value: (emp.lateHours * 60).toFixed(0), unit: 'د', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/8 border-orange-500/20' },
              { label: 'إجازة (أيام)', value: `${emp.paidLeaveDays + emp.unpaidLeaveDays + emp.sickPaidDays + emp.sickUnpaidDays}`, unit: 'يوم', color: 'text-teal-500 dark:text-teal-400', bg: 'bg-teal-500/8 border-teal-500/20' },
            ].map(({ label, value, unit, color, bg }) => (
              <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
                <p className={`font-data text-2xl font-bold leading-tight ${color}`}>{value}<span className="text-xs font-normal ml-0.5">{unit}</span></p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Leaves detail */}
          {(emp.paidLeaveDays > 0 || emp.unpaidLeaveDays > 0 || emp.sickPaidDays > 0 || emp.sickUnpaidDays > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {emp.paidLeaveDays > 0 && <span className="text-[10px] px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-500 border border-teal-500/20 font-bold">إجازة مدفوعة {emp.paidLeaveDays} يوم</span>}
              {emp.unpaidLeaveDays > 0 && <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">إجازة غير مدفوعة {emp.unpaidLeaveDays} يوم</span>}
              {emp.sickPaidDays > 0 && <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">مرضي مدفوع {emp.sickPaidDays} يوم</span>}
              {emp.sickUnpaidDays > 0 && <span className="text-[10px] px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">مرضي غير مدفوع {emp.sickUnpaidDays} يوم</span>}
            </div>
          )}
        </div>

        {/* === EARNINGS & DEDUCTIONS TABLE === */}
        <div className="px-6 py-5 border-b border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Earnings */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-green-500 mb-3 flex items-center gap-2">
                <ArrowUpRight className="w-3.5 h-3.5" /> الإيرادات والإضافات
              </h3>
              <div className="rounded-xl overflow-hidden border border-green-500/15">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { label: 'الراتب الأساسي', value: emp.basicSalary, main: true },
                      ...(emp.overtimePay > 0 ? [{ label: `إضافي ×1.5 (${emp.overtimeHours.toFixed(1)}س)`, value: emp.overtimePay, main: false }] : []),
                      ...(emp.bonus > 0 ? [{ label: 'مكافآت وحوافز', value: emp.bonus, main: false }] : []),
                      ...(emp.additions > 0 ? [{ label: 'إضافات أخرى', value: emp.additions, main: false }] : []),
                    ].map(({ label, value, main }, i) => (
                      <tr key={i} className={`border-b border-green-500/10 last:border-0 ${main ? 'font-bold' : ''}`}
                        style={{ background: i % 2 === 0 ? 'var(--muted-bg)' : 'transparent' }}>
                        <td className="px-3 py-2.5 text-muted-foreground text-xs">{label}</td>
                        <td className="px-3 py-2.5 text-right font-data font-bold text-green-600 dark:text-green-400 text-xs whitespace-nowrap">{fmt(value, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-green-500/30 bg-green-500/8">
                      <td className="px-3 py-2.5 font-bold text-xs">إجمالي الإيرادات</td>
                      <td className="px-3 py-2.5 text-right font-data font-bold text-green-600 dark:text-green-400 whitespace-nowrap">{fmt(emp.grossSalary, currency)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3 flex items-center gap-2">
                <ArrowDownRight className="w-3.5 h-3.5" /> الخصومات
              </h3>
              <div className="rounded-xl overflow-hidden border border-red-500/15">
                <table className="w-full text-sm">
                  <tbody>
                    {((): { label: string; value: number }[] => {
                      const rows = [
                        ...(emp.lateDeduction > 0 ? [{ label: 'خصم التأخير', value: emp.lateDeduction }] : []),
                        ...(emp.earlyDeduction > 0 ? [{ label: 'خروج مبكر', value: emp.earlyDeduction }] : []),
                        ...(emp.unpaidLeaveDeduction > 0 ? [{ label: 'إجازة غير مدفوعة', value: emp.unpaidLeaveDeduction }] : []),
                        ...(emp.sickUnpaidDeduction > 0 ? [{ label: 'مرضي غير مدفوع', value: emp.sickUnpaidDeduction }] : []),
                        ...(emp.purchases > 0 ? [{ label: `مشتريات (${emp.purchasesCount} عملية)`, value: emp.purchases }] : []),
                        ...(emp.advances > 0 ? [{ label: 'سلف', value: emp.advances }] : []),
                        ...(emp.otherDeductions > 0 ? [{ label: 'خصومات أخرى', value: emp.otherDeductions }] : []),
                      ];
                      return rows.length === 0 ? [{ label: 'لا توجد خصومات', value: 0 }] : rows;
                    })().map(({ label, value }, i) => (
                      <tr key={i} className="border-b border-red-500/10 last:border-0"
                        style={{ background: i % 2 === 0 ? 'var(--muted-bg)' : 'transparent' }}>
                        <td className="px-3 py-2.5 text-muted-foreground text-xs">{label}</td>
                        <td className="px-3 py-2.5 text-right font-data font-bold text-red-500 dark:text-red-400 text-xs whitespace-nowrap">
                          {value > 0 ? `-${fmt(value, currency)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-red-500/30 bg-red-500/8">
                      <td className="px-3 py-2.5 font-bold text-xs">إجمالي الخصومات</td>
                      <td className="px-3 py-2.5 text-right font-data font-bold text-red-500 dark:text-red-400 whitespace-nowrap">-{fmt(emp.totalDeductions, currency)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* === NET SALARY RESULT === */}
        <div className="px-6 py-6">
          <div className="rounded-2xl p-5 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/25 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">الراتب الصافي للصرف</p>
              <p className="font-display font-bold text-3xl sm:text-4xl">{fmt(emp.netSalary, currency)}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>الإيرادات: <span className="text-green-500 font-bold">{fmt(emp.grossSalary, currency)}</span></span>
                <span className="text-border">−</span>
                <span>الخصومات: <span className="text-red-500 font-bold">{fmt(emp.totalDeductions, currency)}</span></span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0">
              <Banknote className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* === SIGNATURE AREA (for print) === */}
        <div className="px-6 pb-6 border-t border-border pt-5 hidden print:grid grid-cols-3 gap-6 text-center text-xs text-gray-500">
          <div>
            <div className="h-10 border-b border-gray-300 mb-2" />
            <p>توقيع الموظف</p>
          </div>
          <div>
            <div className="h-10 border-b border-gray-300 mb-2" />
            <p>توقيع المدير المباشر</p>
          </div>
          <div>
            <div className="h-10 border-b border-gray-300 mb-2" />
            <p>ختم الشركة</p>
          </div>
        </div>

        {/* === BOTTOM ACTION BAR (screen only) === */}
        <div className="px-6 pb-6 grid grid-cols-3 gap-2 print:hidden">
          <button onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-bold hover:bg-white/5 transition">
            <Printer className="h-3.5 w-3.5" /> PDF / طباعة
          </button>
          <button onClick={onEmail}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-bold hover:bg-white/5 transition">
            <Mail className="h-3.5 w-3.5" /> إيميل
          </button>
          <button onClick={handleShare}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-bold hover:bg-white/5 transition">
            <Share2 className="h-3.5 w-3.5" /> مشاركة
          </button>
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
  const [reportRecipient, setReportRecipient] = useState<number | 'all'>('all');

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
  const { data: requestData } = useGetRequests(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetRequestsQueryKey({ companyId: cid }) } }
  );

  const updateMutation = useUpdatePayroll();

  const employees = empData?.employees || [];
  const payrollRows = payrollData?.payroll || [];
  const attendanceRows: any[] = (attData as any)?.attendance || [];
  const leaveRows: any[] = leaveData?.leaves || [];
  const requestRows: any[] = requestData?.requests || [];

  // Build per-employee summaries — all rules come from attendance settings
  const summaries: EmployeePaySummary[] = useMemo(() => {
    return employees
      .filter(e => selectedEmpId === 'all' || e.id === selectedEmpId)
      .map(emp => {
        const pr = payrollRows.find(p => p.employeeId === emp.id);
        const empAtt = attendanceRows.filter(a => a.employeeId === emp.id);
        const empLeaves = leaveRows.filter(l => l.employeeId === emp.id);
         const empRequests = requestRows.filter(r => r.employeeId === emp.id);

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
         const periodDays = Math.max(
           1,
           Math.floor((new Date(`${dateTo}T00:00:00`).getTime() - new Date(`${dateFrom}T00:00:00`).getTime()) / 86400000) + 1,
         );
         const leaveDays = lvCalc.paidDays + lvCalc.unpaidDays + lvCalc.sickPaidDays + lvCalc.sickUnpaidDays;
         const absentDays = Math.max(0, periodDays - workedDays - leaveDays);

         const expenseRequests = empRequests.filter((request) => {
           if (request.type !== 'expense' || request.status !== 'approved' || request.paymentStatus !== 'paid') return false;
           const requestDate = String(request.approvedAt || request.createdAt || '').slice(0, 10);
           return !requestDate || (requestDate >= dateFrom && requestDate <= dateTo);
         });
         const extractAmount = (value: unknown) => {
           const match = String(value || '').replace(/,/g, '').match(/(?:SAR|ر\.س|ريال)?\s*(\d+(?:\.\d+)?)/i);
           return match ? Number(match[1]) : 0;
         };
         const purchases = expenseRequests.reduce(
           (total, request) => total + extractAmount(`${request.title} ${request.description}`),
           0,
         );

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
           absentDays,
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
           purchasesCount: expenseRequests.length,
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
   }, [employees, payrollRows, attendanceRows, leaveRows, requestRows, dateFrom, dateTo, selectedEmpId, cfg, dailyHours]);

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
    if (viewPayslip) {
      document.body.classList.add('printing-payslip');
      toast({ title: 'جار تجهيز كشف الراتب PDF...' });
      setTimeout(() => window.print(), 300);
      return;
    }
    toast({ title: 'جار تصدير تقرير الرواتب...' });
    setTimeout(() => window.print(), 300);
  };

  const exportEmail = (employee?: EmployeePaySummary) => {
    const subject = employee
      ? `كشف راتب — ${employee.employeeName} — ${period}`
      : `تقرير الرواتب — ${dateFrom} إلى ${dateTo}`;
    const body = employee
      ? [
          `كشف راتب الموظف: ${employee.employeeName}`,
          `الفترة: ${dateFrom} إلى ${dateTo}`,
          `الراتب الأساسي: ${fmt(employee.basicSalary, 'SAR')}`,
          `الإضافات: ${fmt(employee.overtimePay + employee.bonus + employee.additions, 'SAR')}`,
          `الخصومات: ${fmt(employee.totalDeductions, 'SAR')}`,
          `صافي الراتب: ${fmt(employee.netSalary, 'SAR')}`,
        ].join('\n')
      : summaries.map(s => `${s.employeeName}: ${fmt(s.netSalary, 'SAR')}`).join('\n');
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const sendMonthlyReports = () => {
    if (reportRecipient === 'all') {
      exportEmail();
      return;
    }
    const employee = summaries.find((summary) => summary.employeeId === reportRecipient);
    if (employee) exportEmail(employee);
  };

  const handleShare = async () => {
    const text = `تقرير الرواتب\nمن ${dateFrom} إلى ${dateTo}\nإجمالي الرواتب: ${fmt(totals.net, 'SAR')}`;
    if (navigator.share) await navigator.share({ title: 'تقرير الرواتب', text });
    else { navigator.clipboard?.writeText(text); toast({ title: 'تم نسخ التقرير' }); }
  };

  const generateReport = () => {
    if (selectedEmpId === 'all') {
      toast({ variant: 'destructive', title: 'اختر موظفاً أولاً لإنشاء كشف الراتب' });
      return;
    }
    const employee = summaries.find((summary) => summary.employeeId === selectedEmpId);
    if (!employee) {
      toast({ variant: 'destructive', title: 'تعذر العثور على بيانات الموظف' });
      return;
    }
    setViewPayslip(employee);
    setReportGenerated(true);
    toast({ title: 'تم احتساب الراتب وإنشاء الكشف بنجاح' });
  };

  const isLoading = payrollLoading;

  if (viewPayslip) {
    return (
      <PayslipModal
        emp={viewPayslip}
        currency="SAR"
        cfg={cfg}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onClose={() => setViewPayslip(null)}
        onEmail={() => exportEmail(viewPayslip)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" dir={useLanguage().locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">إدارة الرواتب</h1>
          <p className="text-sm mt-1 text-muted-foreground">تقارير تفصيلية شاملة للرواتب والخصومات والإضافات</p>
        </div>
      </div>

      {/* ── Monthly reports card ───────────────────────────────── */}
      <div className="rounded-2xl border border-indigo-500/25 p-4 sm:p-5" style={{ background: 'var(--card)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/25">
            <Mail className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base">إرسال التقارير الشهرية للموظفين</h2>
            <p className="mt-1 text-xs text-muted-foreground">إرسال تقرير حضور وراتب شامل عبر البريد الإلكتروني</p>
          </div>
          <button
            onClick={sendMonthlyReports}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600 shrink-0"
          >
            <Mail className="h-4 w-4" /> إرسال الآن
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="relative block">
            <span className="mb-1.5 block text-xs font-bold text-muted-foreground">الشهر</span>
            <CalendarRange className="pointer-events-none absolute right-3 bottom-3 h-4 w-4 text-muted-foreground" />
            <input
              type="month"
              value={period}
              onChange={(event) => {
                const nextPeriod = event.target.value;
                if (!nextPeriod) return;
                setDateFrom(`${nextPeriod}-01`);
                const [year, month] = nextPeriod.split('-').map(Number);
                setDateTo(`${nextPeriod}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`);
              }}
              className="w-full rounded-xl border border-border px-4 py-2.5 pr-10 text-sm font-data"
              style={{ background: 'var(--muted-bg)' }}
            />
          </label>
          <label className="relative block">
            <span className="mb-1.5 block text-xs font-bold text-muted-foreground">المستلمون</span>
            <Users className="pointer-events-none absolute right-3 bottom-3 h-4 w-4 text-muted-foreground" />
            <select
              value={reportRecipient}
              onChange={(event) => setReportRecipient(event.target.value === 'all' ? 'all' : Number(event.target.value))}
              className="w-full appearance-none rounded-xl border border-border px-4 py-2.5 pr-10 text-sm font-medium"
              style={{ background: 'var(--muted-bg)' }}
            >
              <option value="all">جميع الموظفين</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* ── Report filters card ────────────────────────────────── */}
      <div className="rounded-2xl border border-border p-4 sm:p-5" style={{ background: 'var(--card)' }}>
        <div className="space-y-4">
          <label className="relative block">
            <span className="mb-1.5 block text-xs font-bold text-muted-foreground">الموظف</span>
            <Users className="pointer-events-none absolute right-3 bottom-3 h-4 w-4 text-muted-foreground" />
            <select
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full appearance-none rounded-xl border border-border px-4 py-2.5 pr-10 text-sm font-medium"
              style={{ background: 'var(--muted-bg)' }}
            >
              <option value="all">اختر موظفًا / جميع الموظفين</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted-foreground">من تاريخ</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-data"
                style={{ background: 'var(--muted-bg)' }}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted-foreground">إلى تاريخ</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-data"
                style={{ background: 'var(--muted-bg)' }}
              />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={generateReport}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5"
            >
              <FileText className="w-4 h-4" /> احسب
            </button>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportPDF} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-white/5 transition">
                <Printer className="w-4 h-4" /> PDF
              </button>
              <button onClick={() => exportEmail()} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-white/5 transition">
                <Mail className="w-4 h-4" /> إيميل
              </button>
              <button onClick={handleShare} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-white/5 transition">
                <Share2 className="w-4 h-4" /> مشاركة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الرواتب الصافية', value: fmt(totals.net, 'SAR'), icon: Banknote, color: 'from-green-500 to-emerald-600', sub: `${totals.headcount} موظف` },
          { label: 'إجمالي الإيرادات', value: fmt(totals.gross, 'SAR'), icon: TrendingUp, color: 'from-blue-500 to-cyan-600', sub: 'قبل الخصومات' },
          { label: 'إجمالي الخصومات', value: fmt(totals.deductions, 'SAR'), icon: TrendingDown, color: 'from-rose-500 to-red-600', sub: 'خصومات وسلف' },
          { label: 'بدل الإضافي', value: fmt(totals.overtime, 'SAR'), icon: Clock, color: 'from-amber-500 to-orange-600', sub: `${summaries.reduce((a, s) => a + s.overtimeHours, 0).toFixed(1)} ساعة` },
        ].map((stat, i) => (
          <div key={stat.label} className={`rounded-2xl overflow-hidden border border-border animate-fadeIn stagger-${i + 1}`} style={{ background: 'var(--card)' }}>
            {/* Coloured header strip */}
            <div className={`h-14 bg-gradient-to-br ${stat.color} relative overflow-hidden flex items-center px-4 gap-3`}>
              <div className="nav-card-wave" />
              <div className="card-orb w-16 h-16 absolute -right-3 -top-3" />
              <div className={`relative z-10 w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-md card-icon-float`}>
                <stat.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="relative z-10 text-white/80 text-xs font-bold uppercase tracking-wider leading-tight">{stat.label}</div>
            </div>
            <div className="p-4">
              <div className="font-data font-bold text-xl mb-0.5">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
            </div>
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
              <p className="font-bold text-slate-800 dark:text-white mt-0.5">{v}</p>
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
          {visibleSummaries.map((emp, idx) => (
            <PayrollCard
              key={emp.employeeId}
              emp={emp}
              currency="SAR"
              dailyHours={dailyHours}
              colorIdx={idx}
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

      {/* ── Supporting interaction ─────────────────────────────────── */}
      {showClockOutPopup && <ClockOutPopup onClose={() => setShowClockOutPopup(false)} />}

      {/* Print styles */}
      <style>{`
        @media print {
          .bottom-nav, header, aside, nav, button { display: none !important; }
          body { background: white !important; color: black !important; }
          .rounded-2xl { border: 1px solid #ddd !important; page-break-inside: avoid; }
        }
        /* When payslip modal is open and printing */
        @media print {
          body.printing-payslip > *:not(#root) { display: none !important; }
          body.printing-payslip #root > *:not(:has(.payslip-wrapper)) { display: none !important; }
          body.printing-payslip .payslip-wrapper { min-height: auto !important; padding: 0 !important; }
          body.printing-payslip .payslip-wrapper > *:not(.payslip-doc) { display: none !important; }
          body.printing-payslip .payslip-doc {
            max-width: 100% !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            border-radius: 8px !important;
            margin: 0 !important;
          }
          body.printing-payslip .payslip-header {
            background: linear-gradient(135deg, #4f46e5, #7c3aed, #a21caf) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: white !important;
          }
          body.printing-payslip .payslip-header * { color: white !important; }
          body.printing-payslip [class*="print:hidden"] { display: none !important; }
          body.printing-payslip [class*="print:grid"] { display: grid !important; }
          body.printing-payslip table { break-inside: avoid; }
          body.printing-payslip .living-card { break-inside: avoid; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
    </div>
  );
}
