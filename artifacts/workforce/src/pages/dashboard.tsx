import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useGetDashboardStats, useGetAttendance, useGetEmployees, useGetLeaves, useGetPayroll, getGetDashboardStatsQueryKey, getGetAttendanceQueryKey, getGetEmployeesQueryKey, getGetLeavesQueryKey, getGetPayrollQueryKey } from '@workspace/api-client-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Users, Clock, CalendarDays, CalendarCheck,
  CreditCard, Inbox, FileText, Bot, MessageSquare, TrendingUp,
  Shield, Settings, Download, Printer, DollarSign, User, CheckCircle2, AlertCircle,
  ChevronDown, UserRound, UserX, Stethoscope, Timer, X, ChevronLeft
} from 'lucide-react';

type AdminDetailCard = {
  id: string;
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
  tone: string;
  iconTone: string;
  items: Array<{ name: string; meta: string; status?: string }>;
};

// Admin dashboard — a touch-first live operations screen, not a navigation page.
function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const companyId = user?.companyId || 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const [now, setNow] = useState(() => new Date());
  const [selectedCard, setSelectedCard] = useState<AdminDetailCard | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: stats } = useGetDashboardStats(
    { companyId },
    { query: { enabled: !!companyId, queryKey: getGetDashboardStatsQueryKey({ companyId }) } }
  );
  const { data: employeesData } = useGetEmployees(
    { companyId },
    { query: { enabled: !!companyId, queryKey: getGetEmployeesQueryKey({ companyId }) } }
  );
  const { data: attendanceData } = useGetAttendance(
    { companyId, date: todayStr },
    { query: { enabled: !!companyId, queryKey: getGetAttendanceQueryKey({ companyId, date: todayStr }) } }
  );
  const { data: leavesData } = useGetLeaves(
    { companyId },
    { query: { enabled: !!companyId, queryKey: getGetLeavesQueryKey({ companyId }) } }
  );

  const employees = employeesData?.employees || [];
  const attendance = attendanceData?.attendance || [];
  const leaves = leavesData?.leaves || [];
  const today = new Date();
  const activeLeaves = leaves.filter((leave: any) =>
    leave.status === 'approved' &&
    leave.startDate <= todayStr &&
    leave.endDate >= todayStr
  );
  const sickLeaves = activeLeaves.filter((leave: any) => leave.type === 'sick');
  const presentRecords = attendance.filter((record: any) => record.clockIn && record.status !== 'absent');
  const lateRecords = attendance.filter((record: any) => record.isLate);
  const presentIds = new Set(presentRecords.map((record: any) => record.employeeId));
  const leaveIds = new Set(activeLeaves.map((leave: any) => leave.employeeId));
  const absentEmployees = employees.filter((employee: any) =>
    employee.status !== 'inactive' && !presentIds.has(employee.id) && !leaveIds.has(employee.id)
  );

  const timeLabel = now.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateLabel = now.toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const displayName = user?.fullName?.split(' ')[0] || 'مدير';

  const detailItems = (records: any[], fallback = 'لا توجد سجلات حالياً') =>
    records.length
      ? records.map((record: any) => ({
          name: record.employeeName || record.fullName || 'موظف',
          meta: record.clockIn
            ? `الحضور ${new Date(record.clockIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`
            : record.reason || record.type || 'بدون تفاصيل',
          status: record.isLate ? 'متأخر' : undefined,
        }))
      : [{ name: fallback, meta: 'سيظهر هنا عند توفر البيانات' }];

  const cardDetails: AdminDetailCard[] = [
    {
      id: 'present',
      title: 'الحاضرون',
      value: presentRecords.length,
      subtitle: 'مسجل حضور اليوم',
      icon: UserRound,
      tone: 'from-emerald-500/25 to-teal-950/80 border-emerald-400/30',
      iconTone: 'bg-emerald-500 text-white shadow-emerald-500/40',
      items: detailItems(presentRecords),
    },
    {
      id: 'absent',
      title: 'الغائبون',
      value: absentEmployees.length,
      subtitle: 'لم يسجلوا حضوراً',
      icon: UserX,
      tone: 'from-rose-500/20 to-rose-950/80 border-rose-400/30',
      iconTone: 'bg-rose-500 text-white shadow-rose-500/40',
      items: detailItems(absentEmployees, 'لا يوجد غياب مسجل'),
    },
    {
      id: 'sick',
      title: 'إجازات مرضية',
      value: sickLeaves.length,
      subtitle: 'إجازة فعالة اليوم',
      icon: Stethoscope,
      tone: 'from-amber-500/20 to-orange-950/80 border-amber-400/30',
      iconTone: 'bg-amber-500 text-white shadow-amber-500/40',
      items: detailItems(sickLeaves, 'لا توجد إجازات مرضية'),
    },
    {
      id: 'late',
      title: 'المتأخرون',
      value: lateRecords.length,
      subtitle: 'تسجيلات بعد الموعد',
      icon: Timer,
      tone: 'from-violet-500/20 to-purple-950/80 border-violet-400/30',
      iconTone: 'bg-violet-500 text-white shadow-violet-500/40',
      items: detailItems(lateRecords, 'لا يوجد تأخير اليوم'),
    },
  ];

  const attendanceCards = [...attendance]
    .sort((a: any, b: any) => Number(Boolean(b.isLate)) - Number(Boolean(a.isLate)))
    .slice(0, 8);

  const openAttendanceDetails = (record: any) => {
    setSelectedCard({
      id: `attendance-${record.id}`,
      title: record.employeeName || 'سجل الحضور',
      value: record.isLate ? 'متأخر' : 'حاضر',
      subtitle: `سجل بتاريخ ${record.date || todayStr}`,
      icon: Clock,
      tone: record.isLate
        ? 'from-violet-500/20 to-purple-950/80 border-violet-400/30'
        : 'from-cyan-500/20 to-blue-950/80 border-cyan-400/30',
      iconTone: record.isLate
        ? 'bg-violet-500 text-white shadow-violet-500/40'
        : 'bg-cyan-500 text-white shadow-cyan-500/40',
      items: [{
        name: record.employeeName || 'موظف',
        meta: `الحضور: ${record.clockIn ? new Date(record.clockIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '—'} • الانصراف: ${record.clockOut ? new Date(record.clockOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'لم يسجل'}`,
        status: record.isLate ? 'متأخر' : 'في الموعد',
      }],
    });
  };

  return (
    <div className="mobile-dashboard max-w-xl mx-auto space-y-4 animate-fadeIn pb-8">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs font-bold text-indigo-300 mb-1">مركز المتابعة الحي</p>
          <h1 className="font-display text-2xl font-extrabold text-white">مرحباً، {displayName}</h1>
          <p className="text-xs text-slate-400 mt-1">{dateLabel}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-white font-bold text-lg">{user?.fullName?.charAt(0) || 'U'}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSelectedCard({
          id: 'clock',
          title: 'الساعة المباشرة',
          value: timeLabel,
          subtitle: 'الوقت المحلي للنظام',
          icon: Clock,
          tone: 'from-cyan-500/25 to-blue-950/90 border-cyan-400/35',
          iconTone: 'bg-cyan-500 text-white shadow-cyan-500/40',
          items: [{ name: 'حالة النظام', meta: 'تتحدث كل ثانية', status: 'LIVE' }],
        })}
        className="mobile-dashboard-card group w-full flex items-center justify-between rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 via-blue-950/70 to-indigo-950/90 p-5 text-right shadow-xl shadow-cyan-950/30"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 group-hover:scale-110 transition-transform">
            <Clock className="h-6 w-6 animate-pulse" />
          </span>
          <span>
            <span className="block text-xs font-bold text-cyan-200">الساعة الآن</span>
            <span className="mt-1 block font-data text-2xl font-black text-white">{timeLabel}</span>
          </span>
        </span>
        <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-[10px] font-black text-emerald-300">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-300" />
          LIVE
        </span>
      </button>

      <div className="grid grid-cols-2 gap-3">
        {cardDetails.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedCard(card)}
              className={`mobile-dashboard-card group relative overflow-hidden rounded-3xl border bg-gradient-to-br ${card.tone} p-4 text-right shadow-lg`}
            >
              <span className="absolute -left-5 -top-6 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
              <span className={`relative flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconTone} shadow-lg transition-transform group-hover:scale-110`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="relative mt-4 block text-3xl font-black font-data text-white">{card.value}</span>
              <span className="relative mt-1 block text-sm font-extrabold text-white">{card.title}</span>
              <span className="relative mt-1 block text-[10px] font-bold text-slate-300">{card.subtitle}</span>
              <span className="relative mt-3 flex items-center justify-between text-[10px] font-bold text-white/60">
                <span>اضغط للتفاصيل</span>
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-1 pt-2">
        <div>
          <h2 className="font-display text-lg font-extrabold text-white">سجل الحضور اليوم</h2>
          <p className="text-[11px] text-slate-400">{attendance.length} سجل • اضغط على أي بطاقة للتفاصيل</p>
        </div>
        <Link href="/dashboard/attendance" className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-[10px] font-black text-indigo-200">
          السجل الكامل
        </Link>
      </div>

      <div className="space-y-3">
        {attendanceCards.length ? attendanceCards.map((record: any) => (
          <button
            key={record.id}
            type="button"
            onClick={() => openAttendanceDetails(record)}
            className="mobile-dashboard-card group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950 p-3.5 text-right shadow-lg"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${record.isLate ? 'bg-violet-500 shadow-violet-500/30' : 'bg-cyan-500 shadow-cyan-500/30'}`}>
                <UserRound className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-white">{record.employeeName || 'موظف'}</span>
                <span className="mt-1 block text-[11px] font-bold text-slate-400">
                  {record.clockIn ? `دخول ${new Date(record.clockIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}` : 'لم يسجل الدخول'}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${record.isLate ? 'border-violet-400/30 bg-violet-500/15 text-violet-200' : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'}`}>
                {record.isLate ? 'متأخر' : 'حاضر'}
              </span>
              <ChevronLeft className="h-4 w-4 text-slate-500 transition-transform group-hover:-translate-x-1" />
            </span>
          </button>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
            <Clock className="mx-auto mb-2 h-7 w-7 text-slate-500" />
            <p className="text-sm font-bold text-slate-300">لا توجد سجلات حضور اليوم</p>
            <p className="mt-1 text-xs text-slate-500">ستظهر البطاقات عند تسجيل الحضور</p>
          </div>
        )}
      </div>

      {selectedCard && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center" onClick={() => setSelectedCard(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selectedCard.title}
            className="w-full max-w-md rounded-[2rem] border border-white/15 bg-[#101021] p-5 shadow-2xl animate-scale-in"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-300">تفاصيل البطاقة</p>
                <h3 className="mt-1 font-display text-xl font-extrabold text-white">{selectedCard.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedCard(null)} aria-label="إغلاق" className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className={`mb-4 flex items-center justify-between rounded-2xl border bg-gradient-to-br ${selectedCard.tone} p-4`}>
              <span className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${selectedCard.iconTone}`}>
                  <selectedCard.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-slate-200">{selectedCard.subtitle}</span>
              </span>
              <span className="font-data text-2xl font-black text-white">{selectedCard.value}</span>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {selectedCard.items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-white">{item.name}</p>
                    <p className="mt-1 text-[11px] font-bold text-slate-400">{item.meta}</p>
                  </div>
                  {item.status && <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black text-indigo-200">{item.status}</span>}
                </div>
              ))}
            </div>
            {selectedCard.id === 'clock' && (
              <button type="button" onClick={() => { setSelectedCard(null); setLocation('/dashboard/attendance'); }} className="mt-4 w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400">
                فتح صفحة الحضور
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Employee dashboard — only shows their own quick stats
function EmployeeDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const empId = (user as any)?.employeeId;
  const companyId = user?.companyId || 0;

  const { data: attendanceData } = useGetAttendance(
    { companyId, employeeId: empId },
    { query: { enabled: !!companyId && !!empId, queryKey: getGetAttendanceQueryKey({ companyId, employeeId: empId }) } }
  );
  const { data: leavesData } = useGetLeaves(
    { companyId, employeeId: empId },
    { query: { enabled: !!companyId && !!empId, queryKey: getGetLeavesQueryKey({ companyId, employeeId: empId }) } }
  );
  const { data: payrollData } = useGetPayroll(
    { companyId, employeeId: empId },
    { query: { enabled: !!companyId && !!empId, queryKey: getGetPayrollQueryKey({ companyId, employeeId: empId }) } }
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceData?.attendance?.find((a: any) => a.date === todayStr);
  const pendingLeaves = leavesData?.leaves?.filter((l: any) => l.status === 'pending').length || 0;
  const approvedLeaves = leavesData?.leaves?.filter((l: any) => l.status === 'approved').length || 0;
  const latestPayroll = payrollData?.payroll?.[payrollData.payroll.length - 1];

  const quickLinks = [
    { href: '/dashboard/attendance', label: t('attendance'), icon: Clock, color: 'from-cyan-500 to-blue-500' },
    { href: '/dashboard/schedule', label: t('schedule'), icon: CalendarDays, color: 'from-indigo-500 to-purple-500' },
    { href: '/dashboard/leaves', label: t('leaves'), icon: CalendarCheck, color: 'from-amber-500 to-orange-500' },
    { href: '/dashboard/payroll', label: t('payroll'), icon: CreditCard, color: 'from-emerald-500 to-teal-500' },
    { href: '/dashboard/requests', label: t('requests'), icon: Inbox, color: 'from-orange-500 to-red-500' },
    { href: '/dashboard/settings', label: t('settings'), icon: Settings, color: 'from-slate-500 to-gray-500' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-24">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">مرحباً، {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">{user?.fullName?.charAt(0) || 'U'}</span>
        </div>
      </div>

      {/* Today Attendance Status */}
      <div className={`rounded-2xl p-5 border ${todayRecord?.clockIn ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
        <div className="flex items-center gap-3 mb-3">
          {todayRecord?.clockIn
            ? <CheckCircle2 className="w-5 h-5 text-green-400" />
            : <AlertCircle className="w-5 h-5 text-amber-400" />
          }
          <span className="font-bold text-white">حضور اليوم</span>
        </div>
        {todayRecord?.clockIn ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">وقت الحضور</div>
              <div className="font-data font-bold text-green-400">{new Date(todayRecord.clockIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            {todayRecord.clockOut && (
              <div>
                <div className="text-xs text-muted-foreground">وقت الانصراف</div>
                <div className="font-data font-bold text-blue-400">{new Date(todayRecord.clockOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">لم تسجّل حضورك بعد اليوم</div>
        )}
        <Link href="/dashboard/attendance" className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
          تسجيل الحضور ←
        </Link>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/5 p-4 text-center" style={{ background: 'var(--card)' }}>
          <div className="font-data font-bold text-2xl text-amber-400">{pendingLeaves}</div>
          <div className="text-xs text-muted-foreground mt-1">طلبات معلقة</div>
        </div>
        <div className="rounded-xl border border-white/5 p-4 text-center" style={{ background: 'var(--card)' }}>
          <div className="font-data font-bold text-2xl text-green-400">{approvedLeaves}</div>
          <div className="text-xs text-muted-foreground mt-1">إجازات موافق</div>
        </div>
        <div className="rounded-xl border border-white/5 p-4 text-center" style={{ background: 'var(--card)' }}>
          <div className="font-data font-bold text-2xl text-blue-400">{attendanceData?.attendance?.length || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">أيام حضور</div>
        </div>
      </div>

      {/* Latest Payroll */}
      {latestPayroll && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">آخر راتب — {latestPayroll.period}</span>
            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${latestPayroll.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {latestPayroll.status === 'paid' ? 'مدفوع' : 'معلق'}
            </span>
          </div>
          <div className="font-data font-bold text-3xl text-emerald-400">
            {parseFloat(latestPayroll.netSalary || '0').toLocaleString('ar-SA')} SAR
          </div>
          <Link href="/dashboard/payroll" className="mt-2 inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors">
            عرض تفاصيل الراتب ←
          </Link>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="font-bold text-white mb-3 text-sm uppercase tracking-wider opacity-60">الوصول السريع</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all hover:scale-[1.02]"
              style={{ background: 'var(--card)' }}
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg`}>
                <link.icon className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-sm text-foreground">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === 'employee' ? <EmployeeDashboard /> : <AdminDashboard />;
}
