import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  useGetLeaves,    getGetLeavesQueryKey,    useUpdateLeave,
  useGetRequests,  getGetRequestsQueryKey,  useUpdateRequest,
  useGetAttendance, getGetAttendanceQueryKey, useUpdateAttendance,
  useGetPayroll,   getGetPayrollQueryKey,
  useGetEmployees, getGetEmployeesQueryKey,
} from '@workspace/api-client-react';
import {
  Bell, CheckCircle2, XCircle, Clock, CalendarX, AlertCircle,
  Timer, Users, CreditCard, Inbox, ChevronDown, ChevronUp,
  Filter, RefreshCw, Eye, UserX, Zap, TrendingDown,
  CalendarCheck, BadgeCheck, AlertTriangle, Activity,
  ArrowRight, User, CalendarDays, MessageSquare, X, ExternalLink,
  UserPlus, UserCheck,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────
// locale-aware relDate and fmt are defined inside the component where t() is available.
// fmtDate is a module-level fallback for sub-components that lack locale context.
const fmtDate = (s?: string | null, intlLocale = 'en-US') =>
  s ? new Date(s).toLocaleDateString(intlLocale as string, { day: 'numeric', month: 'short' }) : '—';

// ─── Types ────────────────────────────────────────────────────────────────────
type ActionKind = 'leave' | 'request' | 'late' | 'absent' | 'payroll';
type Priority = 'critical' | 'high' | 'medium' | 'low';

interface ActionItem {
  id: string;
  kind: ActionKind;
  priority: Priority;
  title: string;
  subtitle: string;
  meta: string;
  employeeName?: string;
  rawId?: number;
  raw?: any;
}

const priorityMeta: Record<Priority, { color: string; bg: string; label: string; dot: string }> = {
  critical: { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',     label: 'عاجل',    dot: 'bg-red-400' },
  high:     { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30', label: 'مهم',     dot: 'bg-amber-400' },
  medium:   { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30',   label: 'عادي',    dot: 'bg-blue-400' },
  low:      { color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-600/30', label: 'منخفض',   dot: 'bg-slate-500' },
};

const kindMeta: Record<ActionKind, { icon: typeof Bell; iconColor: string; label: string }> = {
  leave:   { icon: CalendarX,     iconColor: 'text-teal-400 bg-teal-500/15',     label: 'طلب إجازة' },
  request: { icon: Inbox,         iconColor: 'text-amber-400 bg-amber-500/15',   label: 'طلب عمل' },
  late:    { icon: Timer,         iconColor: 'text-violet-400 bg-violet-500/15', label: 'تأخير حضور' },
  absent:  { icon: UserX,         iconColor: 'text-red-400 bg-red-500/15',       label: 'غياب' },
  payroll: { icon: CreditCard,    iconColor: 'text-green-400 bg-green-500/15',   label: 'راتب معلق' },
};

type StatKey = 'leaves' | 'requests' | 'attendance' | 'absent' | 'payroll' | 'newregs' | 'employees';

const detailValue = (value: unknown) =>
  value === undefined || value === null || value === '' ? '—' : String(value);

function itemDetails(item: ActionItem) {
  const raw = item.raw || {};
  const rows: { label: string; value: string }[] = [
    { label: 'الموظف', value: detailValue(item.employeeName || item.title) },
    { label: 'نوع الإجراء', value: kindMeta[item.kind].label },
  ];

  if (item.kind === 'leave') {
    rows.push(
      { label: 'نوع الإجازة', value: detailValue(raw.type || raw.leaveType) },
      { label: 'من', value: detailValue(raw.startDate) },
      { label: 'إلى', value: detailValue(raw.endDate) },
      { label: 'عدد الأيام', value: detailValue(raw.daysCount) },
      { label: 'السبب', value: detailValue(raw.reason) },
      { label: 'الحالة', value: detailValue(raw.status) },
      { label: 'حالة الدفع', value: detailValue(raw.paymentStatus) },
    );
  } else if (item.kind === 'request') {
    rows.push(
      { label: 'نوع الطلب', value: detailValue(raw.type || raw.category) },
      { label: 'العنوان', value: detailValue(raw.title) },
      { label: 'الوصف', value: detailValue(raw.description) },
      { label: 'الحالة', value: detailValue(raw.status) },
      { label: 'حالة الدفع', value: detailValue(raw.paymentStatus) },
    );
  } else if (item.kind === 'late') {
    const typeLabel: Record<string, string> = {
      late: 'دخول متأخر',
      early: 'خروج مبكر',
      overtime: 'عمل إضافي',
      other: 'تبرير حضور آخر',
    };
    rows.push(
      { label: 'نوع التبرير', value: typeLabel[raw.justificationType] || detailValue(raw.justificationType) },
      { label: 'التاريخ', value: detailValue(raw.date) },
      { label: 'وقت الدخول', value: detailValue(raw.clockIn) },
      { label: 'وقت الخروج', value: detailValue(raw.clockOut) },
      { label: 'الساعات', value: detailValue(raw.totalHours) },
      { label: 'الملاحظات', value: detailValue(raw.notes) },
      { label: 'حالة التبرير', value: detailValue(raw.justificationStatus) },
      { label: 'حالة الدفع', value: detailValue(raw.paymentStatus) },
    );
  } else if (item.kind === 'absent') {
    rows.push(
      { label: 'المسمى الوظيفي', value: detailValue(raw.position) },
      { label: 'القسم', value: detailValue(raw.department) },
      { label: 'التاريخ', value: detailValue(raw.date) },
      { label: 'الحالة', value: 'لم يسجل الحضور اليوم' },
    );
  } else if (item.kind === 'payroll') {
    rows.push(
      { label: 'الفترة', value: detailValue(raw.period) },
      { label: 'الراتب الأساسي', value: detailValue(raw.basicSalary) },
      { label: 'الإضافي', value: detailValue(raw.overtime) },
      { label: 'الخصومات', value: detailValue(raw.deductions) },
      { label: 'الصافي', value: detailValue(raw.netSalary || raw.basicSalary) },
      { label: 'الحالة', value: detailValue(raw.status) },
    );
  }

  return rows;
}

const sectionRouteByKind: Record<ActionKind, { href: string; label: string }> = {
  leave: { href: '/dashboard/leaves', label: 'فتح سجل الإجازات' },
  request: { href: '/dashboard/requests', label: 'فتح سجل الطلبات' },
  late: { href: '/dashboard/attendance', label: 'فتح سجل الحضور' },
  absent: { href: '/dashboard/attendance', label: 'فتح سجل الحضور' },
  payroll: { href: '/dashboard/payroll', label: 'فتح صفحة الرواتب' },
};

function DetailsModal({ item, onClose }: { item: ActionItem | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;
  const km = kindMeta[item.kind];
  const Icon = km.icon;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`تفاصيل ${item.title}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border shadow-2xl animate-fadeIn"
        style={{ background: 'var(--card)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-border p-5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${km.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black">{item.title}</h2>
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[10px] font-bold text-indigo-400">
                {km.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق التفاصيل"
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-2 p-5 sm:grid-cols-2">
          {itemDetails(item).map((row) => (
            <div key={row.label} className="rounded-2xl border border-border bg-white/[0.03] p-3">
              <div className="text-[11px] text-muted-foreground">{row.label}</div>
              <div className="mt-1 break-words text-sm font-bold">{row.value}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border p-5">
          <span className="text-xs text-muted-foreground">{item.meta}</span>
          <div className="flex items-center gap-2">
            <Link
              href={sectionRouteByKind[item.kind].href}
              onClick={onClose}
              className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/20"
            >
              {sectionRouteByKind[item.kind].label}
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-600"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatDetailsModal({
  statKey,
  onClose,
  items,
}: {
  statKey: StatKey | null;
  onClose: () => void;
  items: Record<StatKey, { title: string; subtitle: string; meta: string }[]>;
}) {
  useEffect(() => {
    if (!statKey) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [statKey, onClose]);

  if (!statKey) return null;
  const titles: Record<StatKey, string> = {
    leaves: 'تفاصيل الإجازات المعلقة',
    requests: 'تفاصيل طلبات العمل المعلقة',
    attendance: 'تفاصيل تبريرات الحضور',
    absent: 'الموظفون الذين لم يسجلوا الحضور',
    payroll: 'تفاصيل الرواتب المعلقة',
    newregs: 'طلبات انضمام موظفين جديدة',
    employees: 'قائمة الموظفين',
  };
  const sectionRoute: Record<StatKey, string> = {
    leaves: '/dashboard/leaves',
    requests: '/dashboard/requests',
    attendance: '/dashboard/attendance',
    absent: '/dashboard/attendance',
    payroll: '/dashboard/payroll',
    newregs: '/dashboard/action-center',
    employees: '/dashboard/employees',
  };
  const sectionLabel: Record<StatKey, string> = {
    leaves: 'فتح الإجازات',
    requests: 'فتح الطلبات',
    attendance: 'فتح الحضور',
    absent: 'فتح الحضور',
    payroll: 'فتح الرواتب',
    newregs: 'مركز الإجراءات',
    employees: 'فتح الموظفين',
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={titles[statKey]}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border shadow-2xl animate-fadeIn"
        style={{ background: 'var(--card)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-lg font-black">{titles[statKey]}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{items[statKey].length} بند</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق القائمة" className="rounded-xl p-2 text-muted-foreground hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2 p-5">
          {items[statKey].length === 0 ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-center text-sm text-green-400">
              لا توجد بيانات حالياً
            </div>
          ) : (
            items[statKey].map((entry, index) => (
              <div key={`${entry.title}-${index}`} className="rounded-2xl border border-border p-4">
                <div className="font-bold">{entry.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{entry.subtitle}</div>
                <div className="mt-1 text-xs text-muted-foreground">{entry.meta}</div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border p-5">
          <Link
            href={sectionRoute[statKey]}
            onClick={onClose}
            className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20"
          >
            {sectionLabel[statKey]}
          </Link>
          <button type="button" onClick={onClose} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-600">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, onClick }: {
  icon: typeof Bell; label: string; value: number | string; sub?: string; color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-border p-4 text-start transition hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-white/[0.03] animate-fadeIn"
      style={{ background: 'var(--card)' }}
      aria-label={`عرض تفاصيل ${label}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="font-data font-bold text-2xl leading-none">{value}</div>
        <div className="text-xs font-bold mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      <Eye className="ms-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}

// ─── Action Row ───────────────────────────────────────────────────────────────
function ActionRow({
  item, onApprovePaid, onApproveUnpaid, onReject, onOpenDetails, loading,
}: {
  item: ActionItem;
  onApprovePaid?: () => void;
  onApproveUnpaid?: () => void;
  onReject?: () => void;
  onOpenDetails: () => void;
  loading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef<HTMLDivElement>(null);

  // Scroll the expanded action buttons into view so the user doesn't have to scroll manually
  useEffect(() => {
    if (expanded && expandedRef.current) {
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [expanded]);
  const km = kindMeta[item.kind];
  const pm = priorityMeta[item.priority];
  const canAct = !!onApprovePaid || !!onApproveUnpaid || !!onReject;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all animate-fadeIn ${pm.bg}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${km.iconColor}`}>
          <km.icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <button
          type="button"
          onClick={onOpenDetails}
          className="flex-1 min-w-0 text-start"
          aria-label={`عرض تفاصيل ${item.title}`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{item.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black border ${pm.color} ${pm.bg}`}>
              {pm.label}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
              {km.label}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{item.meta}</div>
        </button>

        {/* Expand toggle + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onOpenDetails}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-indigo-400 transition hover:bg-indigo-500/10"
              title="عرض التفاصيل"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">تفاصيل</span>
            </button>
            {canAct && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition text-muted-foreground"
              title="تفاصيل"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded actions */}
      {canAct && expanded && (
        <div ref={expandedRef} className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap">
          {item.raw && (
            <div className="flex-1 min-w-0 text-xs text-muted-foreground space-y-0.5">
              {item.raw.startDate  && <div>من: <span className="text-foreground font-bold">{fmtDate(item.raw.startDate)}</span></div>}
              {item.raw.endDate    && <div>إلى: <span className="text-foreground font-bold">{fmtDate(item.raw.endDate)}</span></div>}
              {item.raw.daysCount  && <div>الأيام: <span className="text-foreground font-bold">{item.raw.daysCount}</span></div>}
              {item.raw.leaveType  && <div>النوع: <span className="text-foreground font-bold">{item.raw.leaveType}</span></div>}
              {item.raw.reason     && <div>السبب: <span className="text-foreground font-bold">{item.raw.reason}</span></div>}
              {item.raw.title      && <div>الطلب: <span className="text-foreground font-bold">{item.raw.title}</span></div>}
              {item.raw.description && <div>الوصف: <span className="text-foreground font-bold">{item.raw.description}</span></div>}
            </div>
          )}
          <div className="flex items-center gap-2 ms-auto">
            {onReject && (
              <button
                disabled={loading}
                onClick={onReject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" /> رفض
              </button>
            )}
            {onApprovePaid && (
              <button
                disabled={loading}
                onClick={onApprovePaid}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-500 text-white shadow-md shadow-green-500/20 hover:bg-green-600 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> موافقة مدفوعة
              </button>
            )}
            {onApproveUnpaid && (
              <button
                disabled={loading}
                onClick={onApproveUnpaid}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> موافقة غير مدفوعة
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, color, count, children }: {
  title: string; icon: typeof Bell; color: string; count: number; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition"
      >
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-bold text-sm flex-1 text-start">{title}</span>
        {count > 0 && (
          <span className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-red-500/15 text-red-400 text-xs font-black border border-red-500/25 px-1.5">
            {count}
          </span>
        )}
        {count === 0 && (
          <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> مكتمل
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
          {count === 0 ? (
            <div className="flex items-center gap-2 py-4 text-green-400 text-sm justify-center">
              <CheckCircle2 className="w-4 h-4" />
              <span>لا توجد بنود معلقة</span>
            </div>
          ) : children}
        </div>
      )}
    </div>
  );
}

// ─── Pending Employee Row ──────────────────────────────────────────────────────
interface PendingUser {
  userId: number;
  employeeId: number | null;
  fullName: string;
  email: string;
  position: string | null;
  createdAt: string | null;
}

function PendingEmployeeRow({
  row,
  onApprove,
  onReject,
  loading,
}: {
  row: PendingUser;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const initials = row.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'EMP';
  const since = row.createdAt
    ? new Date(row.createdAt).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{row.fullName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-black">
              انتظار موافقة
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{row.email}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {row.position || 'موظف'} · طلب الانضمام: {since}
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-amber-500/15 flex items-center gap-2 justify-end">
        <button
          disabled={loading}
          onClick={onReject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" /> رفض
        </button>
        <button
          disabled={loading}
          onClick={onApprove}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-500 text-white shadow-md shadow-green-500/20 hover:bg-green-600 transition disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> موافقة وتفعيل
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ActionCenterPage() {
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const { toast } = useToast();

  // ── Locale-aware helpers ───────────────────────────────────────────────────
  const relDate = (d?: string | null) => {
    if (!d) return '—';
    const diff = Math.round((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1) return t('acNow');
    if (diff < 60) return t('acMinAgo').replace('{n}', String(diff));
    if (diff < 1440) return t('acHourAgo').replace('{n}', String(Math.round(diff / 60)));
    return t('acDayAgo').replace('{n}', String(Math.round(diff / 1440)));
  };

  const fmt = (s?: string | null) =>
    s ? new Date(s).toLocaleDateString(
      locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US',
      { day: 'numeric', month: 'short' }
    ) : '—';
  const queryClient = useQueryClient();
  const [filterKind, setFilterKind] = useState<ActionKind | 'all'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ActionItem | null>(null);
  const [selectedStat, setSelectedStat] = useState<StatKey | null>(null);

  // ── Pending employee registrations ────────────────────────────────────────
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingUsersLoading, setPendingUsersLoading] = useState(false);
  const [pendingUserActionId, setPendingUserActionId] = useState<number | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    if (!user?.companyId) return;
    setPendingUsersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/pending-users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        // Map from auth endpoint shape { id, fullName, email, role, createdAt }
        setPendingUsers((data.users || []).map((u: any) => ({
          userId: u.id,
          employeeId: null,
          fullName: u.fullName,
          email: u.email,
          position: u.role || 'موظف',
          createdAt: u.createdAt,
        })));
      }
    } catch { /* ignore */ } finally {
      setPendingUsersLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => { fetchPendingUsers(); }, [fetchPendingUsers]);

  const handleApproveUser = async (userId: number) => {
    setPendingUserActionId(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/approve-user/${userId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast({ title: 'تم تفعيل الحساب وقبول الموظف' });
        setPendingUsers(prev => prev.filter(u => u.userId !== userId));
        queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
      } else {
        toast({ variant: 'destructive', title: 'فشلت العملية' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ في الاتصال' });
    } finally {
      setPendingUserActionId(null);
    }
  };

  const handleRejectUser = async (userId: number) => {
    setPendingUserActionId(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/reject-user/${userId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast({ title: 'تم رفض طلب الانضمام وحذف الحساب' });
        setPendingUsers(prev => prev.filter(u => u.userId !== userId));
      } else {
        toast({ variant: 'destructive', title: 'فشلت العملية' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ في الاتصال' });
    } finally {
      setPendingUserActionId(null);
    }
  };

  const cid = user?.companyId || 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const monthStart = `${todayStr.slice(0, 7)}-01`;

  // ── Data fetching ────────────────────────────────────────────────────────
  const { data: leaveData,    isLoading: lLoading,   refetch: rLeave }   = useGetLeaves(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetLeavesQueryKey({ companyId: cid }) } }
  );
  const { data: reqData,     isLoading: rLoading,   refetch: rReq }     = useGetRequests(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetRequestsQueryKey({ companyId: cid }) } }
  );
  const { data: attData,     isLoading: aLoading,   refetch: rAtt }     = useGetAttendance(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetAttendanceQueryKey({ companyId: cid }) } }
  );
  const { data: payData,     isLoading: pLoading }                       = useGetPayroll(
    { companyId: cid, period: todayStr.slice(0, 7) },
    { query: { enabled: !!cid, queryKey: getGetPayrollQueryKey({ companyId: cid, period: todayStr.slice(0, 7) }) } }
  );
  const { data: empData }                                                 = useGetEmployees(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetEmployeesQueryKey({ companyId: cid }) } }
  );

  const updateLeave   = useUpdateLeave();
  const updateRequest = useUpdateRequest();
  const updateAttendance = useUpdateAttendance();

  const isLoading = lLoading || rLoading || aLoading || pLoading;

  const leaves    = leaveData?.leaves                       || [];
  const requests  = (reqData  as any)?.requests             || [];
  const attendance = (attData  as any)?.attendance          || [];
  const payroll   = (payData  as any)?.payroll              || [];
  const employees = empData?.employees                      || [];

  // ── Derived data ─────────────────────────────────────────────────────────
  const pendingLeaves  = leaves.filter((l: any) => l.status === 'pending');
  const pendingReqs    = requests.filter((r: any) => r.status === 'pending');
  const todayAttendance = attendance.filter((a: any) => a.date === todayStr);
  const pendingAttendance = attendance.filter((a: any) => a.justificationStatus === 'pending');
  const notClockedIn   = employees.filter((e: any) => {
    const found = todayAttendance.find((a: any) => a.employeeId === e.id && a.clockIn);
    return !found;
  });
  const pendingPayroll = payroll.filter((p: any) => p.status === 'pending' || p.status === 'draft');

  const totalPending = pendingLeaves.length + pendingReqs.length + pendingAttendance.length + pendingPayroll.length + pendingUsers.length;

  // ── Build unified action items ────────────────────────────────────────────
  const allItems: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = [];

    pendingLeaves.forEach((l: any) => items.push({
      id: `leave-${l.id}`,
      kind: 'leave',
      priority: l.daysCount >= 5 ? 'high' : 'medium',
      title: l.employeeName || 'موظف',
      subtitle: `طلب إجازة ${l.leaveType === 'sick' ? 'مرضية' : l.leaveType === 'annual' ? 'سنوية' : l.leaveType === 'unpaid' ? 'غير مدفوعة' : l.leaveType || ''} · ${l.daysCount || '—'} يوم`,
      meta: `${fmt(l.startDate)} → ${fmt(l.endDate)} · ${relDate(l.createdAt ?? undefined)}`,
      employeeName: l.employeeName,
      rawId: l.id,
      raw: l,
    }));

    pendingReqs.forEach((r: any) => items.push({
      id: `req-${r.id}`,
      kind: 'request',
      priority: r.priority === 'urgent' ? 'critical' : r.priority === 'high' ? 'high' : 'medium',
      title: r.employeeName || 'موظف',
      subtitle: r.title || 'طلب جديد',
      meta: `${r.category || ''} · ${relDate(r.createdAt)}`,
      employeeName: r.employeeName,
      rawId: r.id,
      raw: r,
    }));

    pendingAttendance.forEach((a: any) => items.push({
      id: `late-${a.id}`,
      kind: 'late',
      priority: 'medium',
      title: a.employeeName || 'موظف',
      subtitle: a.justificationType === 'early'
        ? 'تبرير خروج مبكر'
        : a.justificationType === 'overtime'
          ? 'طلب احتساب عمل إضافي'
          : 'تبرير دخول متأخر',
      meta: a.clockIn
        ? `وقت الحضور: ${new Date(a.clockIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`
        : 'اليوم',
      employeeName: a.employeeName,
      rawId: a.id,
      raw: a,
    }));

    pendingPayroll.forEach((p: any) => {
      const emp = employees.find((e: any) => e.id === p.employeeId);
      items.push({
        id: `pay-${p.id}`,
        kind: 'payroll',
        priority: 'high',
        title: emp?.fullName || `موظف #${p.employeeId}`,
        subtitle: `راتب شهر ${p.period || todayStr.slice(0, 7)} معلق`,
        meta: p.basicSalary ? `الأساسي: ${Number(p.basicSalary).toLocaleString()} ريال` : '—',
        rawId: p.id,
        raw: p,
      });
    });

    return items.sort((a, b) => {
      const order: Priority[] = ['critical', 'high', 'medium', 'low'];
      return order.indexOf(a.priority) - order.indexOf(b.priority);
    });
  }, [pendingLeaves, pendingReqs, pendingAttendance, pendingPayroll, employees, locale]);

  const filtered = filterKind === 'all' ? allItems : allItems.filter(i => i.kind === filterKind);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleLeave = async (id: number, status: 'approved' | 'rejected', paymentStatus?: 'paid' | 'unpaid') => {
    const key = `leave-${id}`;
    setLoadingId(key);
    try {
      await updateLeave.mutateAsync({ id, data: { status, paymentStatus } });
      toast({ title: status === 'approved' ? (paymentStatus === 'unpaid' ? t('acLeaveApprovedUnpaid') : t('acLeaveApprovedPaid')) : t('acLeaveRejected') });
      queryClient.invalidateQueries({ queryKey: getGetLeavesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPayrollQueryKey() });
    } catch {
      toast({ variant: 'destructive', title: t('acOperationFailed') });
    } finally {
      setLoadingId(null);
    }
  };

  const handleRequest = async (id: number, status: 'approved' | 'rejected', paymentStatus?: 'paid' | 'unpaid') => {
    const key = `req-${id}`;
    setLoadingId(key);
    try {
      await updateRequest.mutateAsync({ id, data: { status, paymentStatus } });
      toast({ title: status === 'approved' ? (paymentStatus === 'unpaid' ? t('acRequestApprovedUnpaid') : t('acRequestApprovedPaid')) : t('acRequestRejected') });
      queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPayrollQueryKey() });
    } catch {
      toast({ variant: 'destructive', title: t('acOperationFailed') });
    } finally {
      setLoadingId(null);
    }
  };

  const handleAttendance = async (id: number, justificationStatus: 'approved' | 'rejected', paymentStatus?: 'paid' | 'unpaid') => {
    const key = `late-${id}`;
    setLoadingId(key);
    try {
      await updateAttendance.mutateAsync({ id, data: { justificationStatus, paymentStatus } });
      toast({ title: justificationStatus === 'approved' ? (paymentStatus === 'unpaid' ? t('acJustApprovedUnpaid') : t('acJustApprovedPaid')) : t('acJustRejected') });
      queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPayrollQueryKey() });
    } catch {
      toast({ variant: 'destructive', title: t('acOperationFailed') });
    } finally {
      setLoadingId(null);
    }
  };

  const refetchAll = () => {
    rLeave(); rReq(); rAtt();
    fetchPendingUsers();
    toast({ title: t('acRefreshing') });
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { key: 'leaves' as StatKey, icon: CalendarX,  label: 'إجازات معلقة',         value: pendingLeaves.length,    sub: 'تنتظر قرارك',       color: 'text-teal-400 bg-teal-500/10 border border-teal-500/20' },
    { key: 'requests' as StatKey, icon: Inbox,     label: 'طلبات عمل معلقة',      value: pendingReqs.length,      sub: 'تحتاج مراجعة',      color: 'text-amber-400 bg-amber-500/10 border border-amber-500/20' },
    { key: 'attendance' as StatKey, icon: Timer,   label: 'تبريرات معلقة',        value: pendingAttendance.length,sub: 'تحتاج قراراً',       color: 'text-violet-400 bg-violet-500/10 border border-violet-500/20' },
    { key: 'absent' as StatKey, icon: UserX,       label: 'لم يسجلوا بعد',       value: notClockedIn.length,     sub: 'من المتوقع حضورهم', color: 'text-red-400 bg-red-500/10 border border-red-500/20' },
    { key: 'payroll' as StatKey, icon: CreditCard, label: 'رواتب معلقة',          value: pendingPayroll.length,   sub: 'هذا الشهر',          color: 'text-green-400 bg-green-500/10 border border-green-500/20' },
    { key: 'newregs' as StatKey, icon: UserPlus,   label: 'طلبات انضمام جديدة',   value: pendingUsers.length,     sub: 'تنتظر موافقتك',     color: 'text-amber-400 bg-amber-500/10 border border-amber-500/20' },
    { key: 'employees' as StatKey, icon: Users,    label: 'إجمالي الموظفين',      value: employees.length,        sub: 'موظف مسجّل',         color: 'text-blue-400 bg-blue-500/10 border border-blue-500/20' },
  ];

  const statItems: Record<StatKey, { title: string; subtitle: string; meta: string }[]> = {
    leaves: pendingLeaves.map((leave: any) => ({
      title: leave.employeeName || 'موظف',
      subtitle: `${leave.leaveType || leave.type || 'إجازة'} · ${leave.daysCount || '—'} يوم`,
      meta: `${fmt(leave.startDate)} → ${fmt(leave.endDate)} · ${leave.reason || 'بدون سبب'}`,
    })),
    requests: pendingReqs.map((request: any) => ({
      title: request.employeeName || 'موظف',
      subtitle: request.title || 'طلب جديد',
      meta: `${request.description || 'بدون وصف'} · ${relDate(request.createdAt)}`,
    })),
    attendance: pendingAttendance.map((record: any) => ({
      title: record.employeeName || 'موظف',
      subtitle: record.justificationType || 'تبرير حضور',
      meta: `${record.date || todayStr} · ${record.notes || 'بدون ملاحظات'}`,
    })),
    absent: notClockedIn.map((employee: any) => ({
      title: employee.fullName || 'موظف',
      subtitle: employee.position || employee.departmentName || 'موظف',
      meta: `لم يسجل الحضور اليوم · ${todayStr}`,
    })),
    payroll: pendingPayroll.map((entry: any) => ({
      title: employees.find((employee: any) => employee.id === entry.employeeId)?.fullName || `موظف #${entry.employeeId}`,
      subtitle: `راتب ${entry.period || todayStr.slice(0, 7)}`,
      meta: `الصافي: ${Number(entry.netSalary || entry.basicSalary || 0).toLocaleString('ar-SA')} ريال`,
    })),
    newregs: pendingUsers.map((u) => ({
      title: u.fullName || 'موظف',
      subtitle: u.position || 'موظف',
      meta: `${u.email} · طلب انضمام معلق`,
    })),
    employees: employees.map((employee: any) => ({
      title: employee.fullName || 'موظف',
      subtitle: employee.position || employee.departmentName || 'موظف',
      meta: `${employee.email || 'بدون بريد'} · ${employee.status || 'نشط'}`,
    })),
  };

  const filterOptions: { value: ActionKind | 'all'; label: string }[] = [
    { value: 'all',     label: 'الكل' },
    { value: 'leave',   label: 'إجازات' },
    { value: 'request', label: 'طلبات' },
    { value: 'late',    label: 'تأخيرات' },
    { value: 'payroll', label: 'رواتب' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            مركز إجراءات المدير
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            جميع الإشعارات والإجراءات المعلقة من كل أقسام النظام في مكان واحد
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalPending > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-black">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              {totalPending} بند معلق
            </div>
          )}
          <button
            onClick={refetchAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border text-sm hover:bg-white/5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* ── Stats Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            sub={s.sub}
            color={s.color}
            onClick={() => setSelectedStat(s.key)}
          />
        ))}
      </div>

      {/* ── Alert banner when everything is clear ────────────────────── */}
      {totalPending === 0 && !isLoading && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
            <BadgeCheck className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <div className="font-bold text-base text-green-400">كل شيء تحت السيطرة 👌</div>
            <div className="text-sm text-muted-foreground mt-0.5">لا توجد إجراءات معلقة في الوقت الحالي.</div>
          </div>
        </div>
      )}

      {/* ── Unified feed with filter ──────────────────────────────────── */}
      {allItems.length > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
          {/* Feed header + filter */}
          <div className="flex items-center justify-between p-4 border-b border-border flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-sm">التغذية الموحدة</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black">
                {filtered.length} بند
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {filterOptions.map(o => (
                <button
                  key={o.value}
                  onClick={() => setFilterKind(o.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    filterKind === o.value
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'border-border text-muted-foreground hover:border-indigo-500/40'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                لا توجد بنود من هذا النوع
              </div>
            ) : (
              filtered.map(item => {
                let onApprovePaid: (() => void) | undefined;
                let onApproveUnpaid: (() => void) | undefined;
                let onReject:  (() => void) | undefined;
                if (item.kind === 'leave' && item.rawId) {
                  onApprovePaid = () => handleLeave(item.rawId!, 'approved', 'paid');
                  onApproveUnpaid = () => handleLeave(item.rawId!, 'approved', 'unpaid');
                  onReject  = () => handleLeave(item.rawId!, 'rejected');
                }
                if (item.kind === 'request' && item.rawId) {
                  onApprovePaid = () => handleRequest(item.rawId!, 'approved', 'paid');
                  onApproveUnpaid = () => handleRequest(item.rawId!, 'approved', 'unpaid');
                  onReject  = () => handleRequest(item.rawId!, 'rejected');
                }
                if (item.kind === 'late' && item.rawId) {
                  onApprovePaid = () => handleAttendance(item.rawId!, 'approved', 'paid');
                  onApproveUnpaid = () => handleAttendance(item.rawId!, 'approved', 'unpaid');
                  onReject = () => handleAttendance(item.rawId!, 'rejected');
                }
                return (
                  <ActionRow
                    key={item.id}
                    item={item}
                    onApprovePaid={onApprovePaid}
                    onApproveUnpaid={onApproveUnpaid}
                    onReject={onReject}
                    onOpenDetails={() => setSelectedItem(item)}
                    loading={loadingId === item.id}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Pending Employee Registrations ─────────────────────────── */}
      {pendingUsers.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 overflow-hidden" style={{ background: 'var(--card)' }}>
          <div className="flex items-center gap-3 p-4 border-b border-amber-500/20 bg-amber-500/5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-amber-400 bg-amber-500/15">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm flex-1">طلبات انضمام موظفين جديدة</span>
            <span className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-black border border-amber-500/30 px-1.5 animate-pulse">
              {pendingUsers.length}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {pendingUsers.map(row => (
              <PendingEmployeeRow
                key={row.userId}
                row={row}
                onApprove={() => handleApproveUser(row.userId)}
                onReject={() => handleRejectUser(row.userId)}
                loading={pendingUserActionId === row.userId}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Sections ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Leaves */}
        <Section title="طلبات الإجازة المعلقة" icon={CalendarX} color="text-teal-400 bg-teal-500/15" count={pendingLeaves.length}>
          {pendingLeaves.map((l: any) => (
            <ActionRow
              key={`ls-${l.id}`}
              item={{
                id: `ls-${l.id}`, kind: 'leave',
                priority: l.daysCount >= 5 ? 'high' : 'medium',
                title: l.employeeName || 'موظف',
                subtitle: `${l.leaveType || 'إجازة'} · ${l.daysCount || '—'} يوم`,
                meta: `${fmt(l.startDate)} → ${fmt(l.endDate)}`,
                rawId: l.id, raw: l,
              }}
              onApprovePaid={() => handleLeave(l.id, 'approved', 'paid')}
              onApproveUnpaid={() => handleLeave(l.id, 'approved', 'unpaid')}
              onReject={() => handleLeave(l.id, 'rejected')}
                onOpenDetails={() => setSelectedItem({
                  id: `ls-${l.id}`, kind: 'leave',
                  priority: l.daysCount >= 5 ? 'high' : 'medium',
                  title: l.employeeName || 'موظف',
                  subtitle: `${l.leaveType || 'إجازة'} · ${l.daysCount || '—'} يوم`,
                  meta: `${fmt(l.startDate)} → ${fmt(l.endDate)}`,
                  rawId: l.id, raw: l,
                })}
                loading={loadingId === `leave-${l.id}`}
            />
          ))}
        </Section>

        {/* Requests */}
        <Section title="طلبات العمل المعلقة" icon={Inbox} color="text-amber-400 bg-amber-500/15" count={pendingReqs.length}>
          {pendingReqs.map((r: any) => (
            <ActionRow
              key={`rs-${r.id}`}
              item={{
                id: `rs-${r.id}`, kind: 'request',
                priority: r.priority === 'urgent' ? 'critical' : r.priority === 'high' ? 'high' : 'medium',
                title: r.employeeName || 'موظف',
                subtitle: r.title || 'طلب جديد',
                meta: `${r.category || ''} · ${relDate(r.createdAt)}`,
                rawId: r.id, raw: r,
              }}
              onApprovePaid={() => handleRequest(r.id, 'approved', 'paid')}
              onApproveUnpaid={() => handleRequest(r.id, 'approved', 'unpaid')}
              onReject={() => handleRequest(r.id, 'rejected')}
                onOpenDetails={() => setSelectedItem({
                  id: `rs-${r.id}`, kind: 'request',
                  priority: r.priority === 'urgent' ? 'critical' : r.priority === 'high' ? 'high' : 'medium',
                  title: r.employeeName || 'موظف',
                  subtitle: r.title || 'طلب جديد',
                  meta: `${r.category || ''} · ${relDate(r.createdAt)}`,
                  rawId: r.id, raw: r,
                })}
                loading={loadingId === `req-${r.id}`}
            />
          ))}
        </Section>

        {/* Late today */}
        <Section title="تبريرات الحضور المعلقة" icon={Timer} color="text-violet-400 bg-violet-500/15" count={pendingAttendance.length}>
          {pendingAttendance.map((a: any) => (
            <ActionRow
              key={`lat-${a.id}`}
              item={{
                id: `lat-${a.id}`, kind: 'late', priority: 'medium',
                title: a.employeeName || 'موظف',
                subtitle: a.justificationType === 'early' ? 'تبرير خروج مبكر' : a.justificationType === 'overtime' ? 'طلب احتساب عمل إضافي' : 'تبرير دخول متأخر',
                meta: a.clockIn
                  ? `وقت الوصول: ${new Date(a.clockIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`
                  : 'لم يُسجّل وقت الدخول',
                rawId: a.id, raw: a,
              }}
              onApprovePaid={() => handleAttendance(a.id, 'approved', 'paid')}
              onApproveUnpaid={() => handleAttendance(a.id, 'approved', 'unpaid')}
              onReject={() => handleAttendance(a.id, 'rejected')}
                onOpenDetails={() => setSelectedItem({
                  id: `lat-${a.id}`, kind: 'late', priority: 'medium',
                  title: a.employeeName || 'موظف',
                  subtitle: a.justificationType === 'early' ? 'تبرير خروج مبكر' : a.justificationType === 'overtime' ? 'طلب احتساب عمل إضافي' : 'تبرير دخول متأخر',
                  meta: a.clockIn ? `وقت الوصول: ${new Date(a.clockIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}` : 'لم يُسجّل وقت الدخول',
                  rawId: a.id, raw: a,
                })}
                loading={loadingId === `late-${a.id}`}
            />
          ))}
        </Section>

        {/* Not clocked in */}
        <Section title="لم يسجلوا الحضور بعد" icon={UserX} color="text-red-400 bg-red-500/15" count={notClockedIn.length}>
          {notClockedIn.map((e: any) => (
            <ActionRow
              key={`nc-${e.id}`}
              item={{
                id: `nc-${e.id}`, kind: 'absent', priority: 'high',
                title: e.fullName || 'موظف',
                subtitle: e.position || e.department || '—',
                meta: `لم يُسجّل الحضور بعد اليوم — ${todayStr}`,
                rawId: e.id,
                raw: e,
              }}
              onOpenDetails={() => setSelectedItem({
                id: `nc-${e.id}`, kind: 'absent', priority: 'high',
                title: e.fullName || 'موظف',
                subtitle: e.position || e.department || '—',
                meta: `لم يُسجّل الحضور بعد اليوم — ${todayStr}`,
                rawId: e.id, raw: e,
              })}
            />
          ))}
        </Section>

        {/* Pending payroll */}
        <Section title="رواتب تنتظر التأكيد" icon={CreditCard} color="text-green-400 bg-green-500/15" count={pendingPayroll.length}>
          {pendingPayroll.map((p: any) => {
            const emp = employees.find((e: any) => e.id === p.employeeId);
            return (
              <ActionRow
                key={`ps-${p.id}`}
                item={{
                  id: `ps-${p.id}`, kind: 'payroll', priority: 'high',
                  title: emp?.fullName || `موظف #${p.employeeId}`,
                  subtitle: `راتب ${p.period || todayStr.slice(0, 7)}`,
                  meta: p.basicSalary
                    ? `الأساسي: ${Number(p.basicSalary).toLocaleString()} · الصافي: ${Number(p.netSalary || p.basicSalary).toLocaleString()}`
                    : 'انتقل لصفحة الرواتب لإتمام الدفع',
                  rawId: p.id, raw: p,
                }}
                 onOpenDetails={() => setSelectedItem({
                   id: `ps-${p.id}`, kind: 'payroll', priority: 'high',
                   title: emp?.fullName || `موظف #${p.employeeId}`,
                   subtitle: `راتب ${p.period || todayStr.slice(0, 7)}`,
                   meta: p.basicSalary
                     ? `الأساسي: ${Number(p.basicSalary).toLocaleString()} · الصافي: ${Number(p.netSalary || p.basicSalary).toLocaleString()}`
                     : 'انتقل لصفحة الرواتب لإتمام الدفع',
                   rawId: p.id, raw: p,
                 })}
              />
            );
          })}
        </Section>
      </div>

      {/* ── Quick links ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border p-4" style={{ background: 'var(--card)' }}>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-indigo-400" /> روابط سريعة
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'الموظفون',   href: '/dashboard/employees',   icon: Users,         color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
            { label: 'الحضور',     href: '/dashboard/attendance',  icon: Clock,         color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { label: 'الإجازات',   href: '/dashboard/leaves',      icon: CalendarCheck, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
            { label: 'الرواتب',    href: '/dashboard/payroll',     icon: CreditCard,    color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            { label: 'الطلبات',    href: '/dashboard/requests',    icon: Inbox,         color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'التقارير',   href: '/dashboard/reports',     icon: Activity,      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
            { label: 'الاتصالات',  href: '/dashboard/communication', icon: MessageSquare, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
            { label: 'الأداء',     href: '/dashboard/performance', icon: TrendingDown,  color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
          ].map(({ label, href, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold hover:opacity-80 transition ${color}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <DetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      <StatDetailsModal statKey={selectedStat} onClose={() => setSelectedStat(null)} items={statItems} />
    </div>
  );
}
