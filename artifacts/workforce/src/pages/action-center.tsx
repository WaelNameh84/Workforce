import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
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
  ArrowRight, User, CalendarDays, MessageSquare,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────
const relDate = (d?: string | null) => {
  if (!d) return '—';
  const diff = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1) return 'الآن';
  if (diff < 60) return `منذ ${diff} دقيقة`;
  if (diff < 1440) return `منذ ${Math.round(diff / 60)} ساعة`;
  return `منذ ${Math.round(diff / 1440)} يوم`;
};

const fmt = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }) : '—';

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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Bell; label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border p-4 flex items-center gap-4 animate-fadeIn" style={{ background: 'var(--card)' }}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-data font-bold text-2xl leading-none">{value}</div>
        <div className="text-xs font-bold mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Action Row ───────────────────────────────────────────────────────────────
function ActionRow({
  item, onApprovePaid, onApproveUnpaid, onReject, loading,
}: {
  item: ActionItem;
  onApprovePaid?: () => void;
  onApproveUnpaid?: () => void;
  onReject?: () => void;
  loading?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
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
        <div className="flex-1 min-w-0">
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
        </div>

        {/* Expand toggle + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {canAct && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition text-muted-foreground"
              title="تفاصيل"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded actions */}
      {canAct && expanded && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap">
          {item.raw && (
            <div className="flex-1 min-w-0 text-xs text-muted-foreground space-y-0.5">
              {item.raw.startDate  && <div>من: <span className="text-foreground font-bold">{fmt(item.raw.startDate)}</span></div>}
              {item.raw.endDate    && <div>إلى: <span className="text-foreground font-bold">{fmt(item.raw.endDate)}</span></div>}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ActionCenterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterKind, setFilterKind] = useState<ActionKind | 'all'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  const totalPending = pendingLeaves.length + pendingReqs.length + pendingAttendance.length + pendingPayroll.length;

  // ── Build unified action items ────────────────────────────────────────────
  const allItems: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = [];

    pendingLeaves.forEach((l: any) => items.push({
      id: `leave-${l.id}`,
      kind: 'leave',
      priority: l.daysCount >= 5 ? 'high' : 'medium',
      title: l.employeeName || 'موظف',
      subtitle: `طلب إجازة ${l.leaveType === 'sick' ? 'مرضية' : l.leaveType === 'annual' ? 'سنوية' : l.leaveType === 'unpaid' ? 'غير مدفوعة' : l.leaveType || ''} · ${l.daysCount || '—'} يوم`,
      meta: `${fmt(l.startDate)} → ${fmt(l.endDate)} · ${relDate(l.createdAt)}`,
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
  }, [pendingLeaves, pendingReqs, pendingAttendance, pendingPayroll, employees]);

  const filtered = filterKind === 'all' ? allItems : allItems.filter(i => i.kind === filterKind);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleLeave = async (id: number, status: 'approved' | 'rejected', paymentStatus?: 'paid' | 'unpaid') => {
    const key = `leave-${id}`;
    setLoadingId(key);
    try {
      await updateLeave.mutateAsync({ id, data: { status, paymentStatus } });
      toast({ title: status === 'approved' ? `تمت الموافقة على الإجازة — ${paymentStatus === 'unpaid' ? 'غير مدفوعة' : 'مدفوعة'} ✓` : 'تم رفض الإجازة' });
      queryClient.invalidateQueries({ queryKey: getGetLeavesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPayrollQueryKey() });
    } catch {
      toast({ variant: 'destructive', title: 'فشلت العملية' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleRequest = async (id: number, status: 'approved' | 'rejected', paymentStatus?: 'paid' | 'unpaid') => {
    const key = `req-${id}`;
    setLoadingId(key);
    try {
      await updateRequest.mutateAsync({ id, data: { status, paymentStatus } });
      toast({ title: status === 'approved' ? `تمت الموافقة على الطلب — ${paymentStatus === 'unpaid' ? 'غير مدفوع' : 'مدفوع'} ✓` : 'تم رفض الطلب' });
      queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPayrollQueryKey() });
    } catch {
      toast({ variant: 'destructive', title: 'فشلت العملية' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleAttendance = async (id: number, justificationStatus: 'approved' | 'rejected', paymentStatus?: 'paid' | 'unpaid') => {
    const key = `late-${id}`;
    setLoadingId(key);
    try {
      await updateAttendance.mutateAsync({ id, data: { justificationStatus, paymentStatus } });
      toast({ title: justificationStatus === 'approved' ? `تم اعتماد التبرير — ${paymentStatus === 'unpaid' ? 'غير مدفوع' : 'مدفوع'} ✓` : 'تم رفض التبرير' });
      queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPayrollQueryKey() });
    } catch {
      toast({ variant: 'destructive', title: 'فشلت العملية' });
    } finally {
      setLoadingId(null);
    }
  };

  const refetchAll = () => {
    rLeave(); rReq(); rAtt();
    toast({ title: 'جاري تحديث البيانات...' });
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { icon: CalendarX,  label: 'إجازات معلقة',     value: pendingLeaves.length,   sub: 'تنتظر قرارك',      color: 'text-teal-400 bg-teal-500/10 border border-teal-500/20' },
    { icon: Inbox,      label: 'طلبات عمل معلقة',  value: pendingReqs.length,     sub: 'تحتاج مراجعة',     color: 'text-amber-400 bg-amber-500/10 border border-amber-500/20' },
    { icon: Timer,      label: 'تبريرات معلقة',   value: pendingAttendance.length, sub: 'تحتاج قراراً',      color: 'text-violet-400 bg-violet-500/10 border border-violet-500/20' },
    { icon: UserX,      label: 'لم يسجلوا بعد',   value: notClockedIn.length,    sub: 'من المتوقع حضورهم', color: 'text-red-400 bg-red-500/10 border border-red-500/20' },
    { icon: CreditCard, label: 'رواتب معلقة',      value: pendingPayroll.length,  sub: 'هذا الشهر',         color: 'text-green-400 bg-green-500/10 border border-green-500/20' },
    { icon: Users,      label: 'إجمالي الموظفين',  value: employees.length,       sub: 'موظف مسجّل',        color: 'text-blue-400 bg-blue-500/10 border border-blue-500/20' },
  ];

  const filterOptions: { value: ActionKind | 'all'; label: string }[] = [
    { value: 'all',     label: 'الكل' },
    { value: 'leave',   label: 'إجازات' },
    { value: 'request', label: 'طلبات' },
    { value: 'late',    label: 'تأخيرات' },
    { value: 'payroll', label: 'رواتب' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
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
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} sub={s.sub} color={s.color} />
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
          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
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
                    loading={loadingId === item.id}
                  />
                );
              })
            )}
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
              loading={loadingId === `ls-${l.id}`}
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
              loading={loadingId === `rs-${r.id}`}
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
              }}
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
            <a
              key={href}
              href={href}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold hover:opacity-80 transition ${color}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
