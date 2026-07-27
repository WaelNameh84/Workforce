import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useGetDashboardStats, useGetAttendance, useGetEmployees, useGetLeaves, useGetPayroll, useGetRequests, getGetDashboardStatsQueryKey, getGetAttendanceQueryKey, getGetEmployeesQueryKey, getGetLeavesQueryKey, getGetPayrollQueryKey, getGetRequestsQueryKey } from '@workspace/api-client-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Users, Clock, CalendarDays, CalendarCheck,
  CreditCard, Inbox, FileText, Bot, MessageSquare, TrendingUp,
  Shield, Settings, Download, Printer, DollarSign, User, CheckCircle2, AlertCircle,
  ChevronDown, UserRound, UserX, Stethoscope, Timer, X, ChevronLeft,
  BarChart3, Banknote, TimerReset, Calendar, Activity, ArrowUpRight,
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
  const { t, intlLocale, formatDate, formatTime, formatCurrency, translateText } = useLanguage();
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
  const { data: payrollData } = useGetPayroll(
    { companyId },
    { query: { enabled: !!companyId, queryKey: getGetPayrollQueryKey({ companyId }) } }
  );
  const { data: requestsData } = useGetRequests(
    { companyId },
    { query: { enabled: !!companyId, queryKey: getGetRequestsQueryKey({ companyId }) } }
  );

  const employees = employeesData?.employees || [];
  const attendance = attendanceData?.attendance || [];
  const leaves = leavesData?.leaves || [];
  const payroll = payrollData?.payroll || [];
  const requests = requestsData?.requests || [];
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
  const hoursForRecord = (record: any) => {
    if (record.totalHours) return Number(record.totalHours) || 0;
    if (!record.clockIn) return 0;
    const end = record.clockOut ? new Date(record.clockOut).getTime() : now.getTime();
    return Math.max(0, (end - new Date(record.clockIn).getTime()) / 3_600_000);
  };
  const totalWorkHours = attendance.reduce((sum: number, record: any) => sum + hoursForRecord(record), 0);
  const overtimeHours = attendance.reduce((sum: number, record: any) => sum + Math.max(0, hoursForRecord(record) - 8), 0);
  const currentPeriod = now.toISOString().slice(0, 7);
  const currentPayroll = payroll.filter((entry: any) => entry.period === currentPeriod);
  const payrollTotal = currentPayroll.length
    ? currentPayroll.reduce((sum: number, entry: any) => sum + (Number(entry.netSalary) || 0), 0)
    : Number(stats?.monthlyPayroll || 0);
  const pendingRequests = requests.filter((request: any) => request.status === 'pending');
  const recentAttendance = stats?.recentAttendance || [];
  const maxChartValue = Math.max(
    1,
    ...recentAttendance.flatMap((entry: any) => [Number(entry.present) || 0, Number(entry.absent) || 0])
  );
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthOffset = monthStart.getDay();
  const calendarDays = Array.from({ length: monthOffset + daysInMonth }, (_, index) =>
    index < monthOffset ? null : index - monthOffset + 1
  );
  const isToday = (day: number | null) => day === now.getDate();

  const timeLabel = now.toLocaleTimeString(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateLabel = now.toLocaleDateString(intlLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const displayName = user?.fullName?.split(' ')[0] || t('roleManager');

  const detailItems = (records: any[], fallback = 'لا توجد سجلات حالياً') =>
    records.length
      ? records.map((record: any) => ({
          name: record.employeeName || record.fullName || t('employee'),
          meta: record.clockIn
            ? `${translateText('الحضور')} ${formatTime(record.clockIn)}`
            : record.reason || translateText(record.type || 'بدون تفاصيل'),
          status: record.isLate ? t('lateArrival') : undefined,
        }))
      : [{ name: translateText(fallback), meta: translateText('سيظهر هنا عند توفر البيانات') }];

  const cardDetails: AdminDetailCard[] = [
    {
      id: 'present',
       title: t('presentToday'),
      value: presentRecords.length,
       subtitle: translateText('مسجل حضور اليوم'),
      icon: UserRound,
      tone: 'from-emerald-500/25 to-teal-950/80 border-emerald-400/30',
      iconTone: 'bg-emerald-500 text-white shadow-emerald-500/40',
      items: detailItems(presentRecords),
    },
    {
      id: 'absent',
       title: translateText('الغائبون'),
      value: absentEmployees.length,
       subtitle: translateText('لم يسجلوا حضوراً'),
      icon: UserX,
      tone: 'from-rose-500/20 to-rose-950/80 border-rose-400/30',
      iconTone: 'bg-rose-500 text-white shadow-rose-500/40',
      items: detailItems(absentEmployees, 'لا يوجد غياب مسجل'),
    },
    {
      id: 'sick',
       title: translateText('إجازات مرضية'),
      value: sickLeaves.length,
       subtitle: translateText('إجازة فعالة اليوم'),
      icon: Stethoscope,
      tone: 'from-amber-500/20 to-orange-950/80 border-amber-400/30',
      iconTone: 'bg-amber-500 text-white shadow-amber-500/40',
      items: detailItems(sickLeaves, 'لا توجد إجازات مرضية'),
    },
    {
      id: 'late',
       title: t('lateArrivals'),
      value: lateRecords.length,
       subtitle: translateText('تسجيلات بعد الموعد'),
      icon: Timer,
      tone: 'from-violet-500/20 to-purple-950/80 border-violet-400/30',
      iconTone: 'bg-violet-500 text-white shadow-violet-500/40',
      items: detailItems(lateRecords, 'لا يوجد تأخير اليوم'),
    },
    {
      id: 'employees',
       title: t('totalEmployees'),
      value: stats?.totalEmployees || employees.length,
       subtitle: translateText('إجمالي فريق الشركة'),
      icon: Users,
      tone: 'from-blue-500/25 to-indigo-950/80 border-blue-400/30',
      iconTone: 'bg-blue-500 text-white shadow-blue-500/40',
      items: detailItems(employees, 'لا يوجد موظفون'),
    },
    {
      id: 'on-leave',
       title: t('onLeave'),
      value: activeLeaves.length,
       subtitle: translateText('إجازات فعالة اليوم'),
      icon: CalendarCheck,
      tone: 'from-orange-500/20 to-amber-950/80 border-orange-400/30',
      iconTone: 'bg-orange-500 text-white shadow-orange-500/40',
      items: detailItems(activeLeaves, 'لا توجد إجازات اليوم'),
    },
    {
      id: 'hours',
       title: translateText('ساعات العمل'),
      value: `${totalWorkHours.toFixed(1)}h`,
       subtitle: translateText('إجمالي ساعات اليوم'),
      icon: Activity,
      tone: 'from-cyan-500/20 to-sky-950/80 border-cyan-400/30',
      iconTone: 'bg-cyan-500 text-white shadow-cyan-500/40',
       items: [{ name: translateText('إجمالي ساعات الحضور'), meta: `${totalWorkHours.toFixed(2)} ${translateText('ساعة')} ${translateText('مسجلة اليوم')}` }],
    },
    {
      id: 'overtime',
       title: t('overtimeHours'),
      value: `${overtimeHours.toFixed(1)}h`,
       subtitle: translateText('فوق 8 ساعات يومياً'),
      icon: TimerReset,
      tone: 'from-fuchsia-500/20 to-purple-950/80 border-fuchsia-400/30',
      iconTone: 'bg-fuchsia-500 text-white shadow-fuchsia-500/40',
       items: [{ name: translateText('إجمالي الوقت الإضافي'), meta: `${overtimeHours.toFixed(2)} ${translateText('ساعة إضافية اليوم')}` }],
    },
    {
      id: 'payroll',
       title: t('payroll'),
       value: formatCurrency(payrollTotal),
       subtitle: `${t('payroll')} ${currentPeriod}`,
      icon: Banknote,
      tone: 'from-green-500/20 to-emerald-950/80 border-green-400/30',
      iconTone: 'bg-green-500 text-white shadow-green-500/40',
      items: currentPayroll.length
         ? currentPayroll.map((entry: any) => ({ name: entry.employeeName || t('employee'), meta: formatCurrency(entry.netSalary), status: entry.status === 'paid' ? t('paid') : t('pending') }))
        : [{ name: translateText('لا توجد رواتب لهذا الشهر'), meta: translateText('ستظهر هنا بعد إنشاء مسيرات الرواتب') }],
    },
  ];

  const attendanceCards = [...attendance]
    .sort((a: any, b: any) => Number(Boolean(b.isLate)) - Number(Boolean(a.isLate)))
    .slice(0, 8);
  const operationItems = [
    ...attendance.slice(0, 5).map((record: any) => ({
      icon: Clock,
      title: record.employeeName || 'موظف',
      text: record.isLate ? 'سجّل حضوراً متأخراً' : 'سجّل الحضور',
      time: record.clockIn ? new Date(record.clockIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'اليوم',
      tone: record.isLate ? 'text-violet-300 bg-violet-500/15' : 'text-emerald-300 bg-emerald-500/15',
    })),
    ...pendingRequests.slice(0, 3).map((request: any) => ({
      icon: Inbox,
      title: request.employeeName || 'طلب موظف',
      text: request.title || 'طلب جديد بانتظار المراجعة',
      time: request.createdAt ? new Date(request.createdAt).toLocaleDateString('ar-SA') : 'اليوم',
      tone: 'text-amber-300 bg-amber-500/15',
    })),
  ].slice(0, 6);

  const openAttendanceDetails = (record: any) => {
    setSelectedCard({
      id: `attendance-${record.id}`,
       title: record.employeeName || translateText('سجل الحضور'),
       value: record.isLate ? t('lateArrival') : translateText('حاضر'),
       subtitle: `${translateText('سجل بتاريخ')} ${record.date || todayStr}`,
      icon: Clock,
      tone: record.isLate
        ? 'from-violet-500/20 to-purple-950/80 border-violet-400/30'
        : 'from-cyan-500/20 to-blue-950/80 border-cyan-400/30',
      iconTone: record.isLate
        ? 'bg-violet-500 text-white shadow-violet-500/40'
        : 'bg-cyan-500 text-white shadow-cyan-500/40',
      items: [{
         name: record.employeeName || t('employee'),
         meta: `${translateText('الحضور')}: ${record.clockIn ? formatTime(record.clockIn) : '—'} • ${translateText('الانصراف')}: ${record.clockOut ? formatTime(record.clockOut) : translateText('لم يسجل')}`,
         status: record.isLate ? t('lateArrival') : translateText('في الموعد'),
      }],
    });
  };

  return (
    <div className="mobile-dashboard max-w-xl mx-auto space-y-4 animate-fadeIn pb-8">
      <div className="flex items-center justify-between px-1">
        <div>
           <p className="text-xs font-bold text-indigo-300 mb-1">{translateText('مركز المتابعة الحي')}</p>
           <h1 className="font-display text-2xl font-extrabold text-white">{translateText('مرحباً،')} {displayName}</h1>
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
           title: translateText('الساعة المباشرة'),
          value: timeLabel,
           subtitle: translateText('الوقت المحلي للنظام'),
          icon: Clock,
          tone: 'from-cyan-500/25 to-blue-950/90 border-cyan-400/35',
          iconTone: 'bg-cyan-500 text-white shadow-cyan-500/40',
           items: [{ name: translateText('حالة النظام'), meta: translateText('تتحدث كل ثانية'), status: translateText('LIVE') }],
        })}
        className="mobile-dashboard-card group w-full flex items-center justify-between rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 via-blue-950/70 to-indigo-950/90 p-5 text-right shadow-xl shadow-cyan-950/30"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 group-hover:scale-110 transition-transform">
            <Clock className="h-6 w-6 animate-pulse" />
          </span>
          <span>
             <span className="block text-xs font-bold text-cyan-200">{translateText('الساعة الآن')}</span>
            <span className="mt-1 block font-data text-2xl font-black text-white">{timeLabel}</span>
          </span>
        </span>
        <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-[10px] font-black text-emerald-300">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-300" />
           {translateText('LIVE')}
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
                 <span>{translateText('اضغط للتفاصيل')}</span>
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </span>
            </button>
          );
        })}
      </div>

      <section className="rounded-3xl border border-indigo-400/25 bg-gradient-to-br from-indigo-950/70 via-slate-950/90 to-purple-950/70 p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
             <h2 className="font-display text-lg font-extrabold text-white">{translateText('نظرة الحضور الأسبوعية')}</h2>
             <p className="text-[11px] font-bold text-slate-400">{translateText('مقارنة الحاضرين والغائبين لآخر 7 أيام')}</p>
          </div>
          <span className="rounded-xl border border-indigo-400/30 bg-indigo-500/15 p-2 text-indigo-300">
            <BarChart3 className="h-5 w-5" />
          </span>
        </div>
        <div className="flex h-40 items-end gap-2">
          {recentAttendance.length ? recentAttendance.map((entry: any) => {
            const presentHeight = `${Math.max(8, ((Number(entry.present) || 0) / maxChartValue) * 100)}%`;
            const absentHeight = `${Math.max(5, ((Number(entry.absent) || 0) / maxChartValue) * 100)}%`;
            return (
              <div key={entry.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <span className="w-2 rounded-t-full bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-lg shadow-cyan-500/20 transition-all" style={{ height: presentHeight }} title={`حاضر: ${entry.present || 0}`} />
                  <span className="w-2 rounded-t-full bg-gradient-to-t from-rose-500 to-orange-300 shadow-lg shadow-rose-500/20 transition-all" style={{ height: absentHeight }} title={`غائب: ${entry.absent || 0}`} />
                </div>
                   <span className="text-[9px] font-bold text-slate-500">{formatDate(entry.date, { month: '2-digit', day: '2-digit' })}</span>
              </div>
            );
          }) : (
            <div className="flex w-full items-center justify-center text-center">
              <div>
                <BarChart3 className="mx-auto mb-2 h-7 w-7 text-slate-600" />
                <p className="text-xs font-bold text-slate-400">لا توجد بيانات كافية للرسم بعد</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-slate-400">
           <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400" />{translateText('حاضرون')}</span>
           <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />{translateText('غائبون')}</span>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
             <h2 className="font-display text-lg font-extrabold text-white">{translateText('آخر العمليات')}</h2>
             <p className="text-[11px] font-bold text-slate-400">{translateText('آخر ما تم تسجيله في النظام')}</p>
          </div>
          <span className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-2 text-cyan-300"><ArrowUpRight className="h-4 w-4" /></span>
        </div>
        <div className="space-y-2">
          {operationItems.length ? operationItems.map((operation, index) => {
            const Icon = operation.icon;
            return (
              <div key={`${operation.title}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[.035] p-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${operation.tone}`}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold text-white">{operation.title}</p>
                  <p className="mt-1 truncate text-[10px] font-bold text-slate-400">{operation.text}</p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-slate-500">{operation.time}</span>
              </div>
            );
          }) : (
             <p className="rounded-2xl bg-white/[.035] p-4 text-center text-xs font-bold text-slate-500">{translateText('لا توجد عمليات حديثة')}</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3">
        <div className="rounded-3xl border border-purple-400/25 bg-gradient-to-br from-purple-950/60 to-slate-950 p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-extrabold text-white">التقويم</h2>
               <p className="text-[10px] font-bold text-slate-400">{formatDate(now, { month: 'long', year: 'numeric' })}</p>
            </div>
            <Calendar className="h-5 w-5 text-purple-300" />
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
             {Array.from({ length: 7 }, (_, index) => formatDate(new Date(2024, 0, 7 + index), { weekday: 'short' })).map((day) => <span key={day} className="py-1 text-[9px] font-black text-purple-300">{day}</span>)}
            {calendarDays.map((day, index) => (
              <span key={`${day}-${index}`} className={`flex h-6 items-center justify-center rounded-lg text-[10px] font-bold ${isToday(day) ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : day ? 'text-slate-300' : 'text-transparent'}`}>
                {day || '·'}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between px-1 pt-2">
        <div>
           <h2 className="font-display text-lg font-extrabold text-white">{translateText('سجل الحضور اليوم')}</h2>
           <p className="text-[11px] text-slate-400">{attendance.length} {translateText('سجل')} • {translateText('اضغط على أي بطاقة للتفاصيل')}</p>
        </div>
        <Link href="/dashboard/attendance" className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-[10px] font-black text-indigo-200">
           {translateText('السجل الكامل')}
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
                 <span className="block truncate text-sm font-extrabold text-white">{record.employeeName || t('employee')}</span>
                <span className="mt-1 block text-[11px] font-bold text-slate-400">
                   {record.clockIn ? `${translateText('دخول')} ${formatTime(record.clockIn)}` : translateText('لم يسجل الدخول')}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${record.isLate ? 'border-violet-400/30 bg-violet-500/15 text-violet-200' : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'}`}>
                 {record.isLate ? t('lateArrival') : translateText('حاضر')}
              </span>
              <ChevronLeft className="h-4 w-4 text-slate-500 transition-transform group-hover:-translate-x-1" />
            </span>
          </button>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
            <Clock className="mx-auto mb-2 h-7 w-7 text-slate-500" />
             <p className="text-sm font-bold text-slate-300">{translateText('لا توجد سجلات حضور اليوم')}</p>
             <p className="mt-1 text-xs text-slate-500">{translateText('ستظهر البطاقات عند تسجيل الحضور')}</p>
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
                 <p className="text-xs font-bold text-indigo-300">{translateText('تفاصيل البطاقة')}</p>
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
                 {translateText('فتح صفحة الحضور')}
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
