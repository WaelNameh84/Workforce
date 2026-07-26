import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useGetDashboardStats, useGetAttendance, useGetLeaves, useGetPayroll, getGetDashboardStatsQueryKey, getGetAttendanceQueryKey, getGetLeavesQueryKey, getGetPayrollQueryKey } from '@workspace/api-client-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Users, Clock, CalendarDays, CalendarCheck,
  CreditCard, Inbox, FileText, Bot, MessageSquare, TrendingUp,
  Shield, Settings, Download, Printer, DollarSign, User, CheckCircle2, AlertCircle,
  ChevronDown
} from 'lucide-react';

// Admin dashboard showing all modules + company stats
function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location] = useLocation();

  const { data: stats } = useGetDashboardStats(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetDashboardStatsQueryKey({ companyId: user?.companyId || 0 }) } }
  );

  const groups = [
    {
      id: 'hr',
      label: 'إدارة الموارد البشرية',
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
      dot: 'bg-blue-500',
      open: true,
      items: [
        { id: 2, name: 'الموظفون',  badge: `${stats?.totalEmployees || 0}`,       badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   icon: Users,        iconColor: 'bg-blue-500',    href: '/dashboard/employees' },
        { id: 3, name: 'الحضور',    badge: 'اليوم',                               badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',   icon: Clock,        iconColor: 'bg-cyan-500',    href: '/dashboard/attendance' },
        { id: 4, name: 'الجداول',   badge: 'Shifts',                              badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: CalendarDays, iconColor: 'bg-indigo-500', href: '/dashboard/schedule' },
        { id: 5, name: 'الإجازات',  badge: 'Days 21',                             badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: CalendarCheck, iconColor: 'bg-amber-500', href: '/dashboard/leaves' },
        { id: 6, name: 'الرواتب',   badge: 'SAR',                                 badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CreditCard, iconColor: 'bg-emerald-500', href: '/dashboard/payroll' },
        { id: 7, name: 'الطلبات',   badge: `${stats?.pendingRequests || 0} معلق`, badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Inbox,      iconColor: 'bg-orange-500',  href: '/dashboard/requests' },
      ],
    },
    {
      id: 'advanced',
      label: 'الأدوات المتقدمة',
      color: 'from-violet-500/20 to-purple-500/10 border-violet-500/20',
      dot: 'bg-violet-500',
      open: false,
      items: [
        { id: 8,  name: 'التقارير',      badge: 'CSV/PDF',   badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: FileText,     iconColor: 'bg-purple-500',  href: '/dashboard/reports' },
        { id: 9,  name: 'المساعد الذكي', badge: 'AI',        badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: Bot,          iconColor: 'bg-violet-500',  href: '/dashboard/ai' },
        { id: 10, name: 'الاتصالات',     badge: 'Channels',  badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',         icon: MessageSquare, iconColor: 'bg-sky-500',    href: '/dashboard/communication' },
        { id: 11, name: 'الأداء',        badge: 'KPIs',      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',      icon: TrendingUp,   iconColor: 'bg-teal-500',    href: '/dashboard/performance' },
      ],
    },
    {
      id: 'system',
      label: 'إعدادات النظام',
      color: 'from-slate-500/20 to-gray-500/10 border-slate-500/20',
      dot: 'bg-slate-400',
      open: false,
      items: [
        { id: 12, name: 'الأمن',      badge: 'AES-256', badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',       icon: Shield,   iconColor: 'bg-red-500',   href: '/dashboard/security' },
        { id: 13, name: 'الإعدادات', badge: 'Config',   badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Settings, iconColor: 'bg-slate-500', href: '/dashboard/settings' },
      ],
    },
  ];

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map(g => [g.id, g.open]))
  );
  const toggle = (id: string) => setOpenGroups(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn pb-20">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 text-white">{t('welcome')}, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/20">
          <span className="text-white font-bold text-lg">{user?.fullName?.charAt(0) || 'U'}</span>
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/5 p-4 text-center" style={{ background: 'var(--card)' }}>
            <div className="font-data font-bold text-2xl text-blue-400">{stats.totalEmployees || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">موظف</div>
          </div>
          <div className="rounded-xl border border-white/5 p-4 text-center" style={{ background: 'var(--card)' }}>
            <div className="font-data font-bold text-2xl text-green-400">{stats.presentToday || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">حاضر اليوم</div>
          </div>
          <div className="rounded-xl border border-white/5 p-4 text-center" style={{ background: 'var(--card)' }}>
            <div className="font-data font-bold text-2xl text-amber-400">{stats.pendingRequests || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">طلبات معلقة</div>
          </div>
        </div>
      )}

      {/* لوحة التحكم — always-visible single card */}
      <Link
        href="/dashboard"
        className={`card-module flex items-center justify-between p-4 pressable ${location === '/dashboard' ? 'active' : ''}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-green-500">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">لوحة التحكم</span>
        </div>
        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border font-data bg-green-500/10 text-green-400 border-green-500/20 uppercase tracking-wide">
          Live
        </span>
      </Link>

      {/* Collapsible groups */}
      {groups.map(group => {
        const isOpen = openGroups[group.id];
        return (
          <div key={group.id} className={`rounded-2xl border bg-gradient-to-br overflow-hidden transition-all ${group.color}`}>
            {/* Group header — tap to toggle */}
            <button
              onClick={() => toggle(group.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 items-center">
                  <span className={`w-2 h-2 rounded-full ${group.dot}`} />
                  <span className={`w-2 h-2 rounded-full ${group.dot} opacity-60`} />
                  <span className={`w-2 h-2 rounded-full ${group.dot} opacity-30`} />
                </div>
                <span className="font-bold text-base text-foreground">{group.label}</span>
                <span className="text-xs text-muted-foreground font-medium">({group.items.length})</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Items — animated slide */}
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: isOpen ? `${group.items.length * 72}px` : '0px' }}
            >
              <div className="px-3 pb-3 space-y-2">
                {group.items.map(item => {
                  const active = location.startsWith(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`card-module flex items-center justify-between p-3.5 pressable ${active ? 'active' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${item.iconColor}`}>
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-data text-xs font-bold w-4 text-center opacity-40">{item.id}</span>
                          <span className="font-bold text-base text-foreground">{item.name}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border font-data tracking-wide uppercase ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Reports Feature Card */}
      <div className="mt-2 rounded-2xl bg-gradient-to-br from-[#141424] to-[#1a1a2e] border border-white/5 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[60px]" />
        <h3 className="font-display text-2xl font-bold mb-3 text-white relative z-10">التقارير الإدارية ومؤشرات الأداء</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6 relative z-10 max-w-[90%]">
          نظام متكامل لاستخراج تقارير الحضور والانصراف، الرواتب، وتقييم الأداء بضغطة زر.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-8 relative z-10">
          <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
            <Download className="w-4 h-4" />
            تصدير Excel / CSV
          </button>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl border border-white/10 text-sm font-bold transition-colors">
            <Printer className="w-4 h-4" />
            طباعة PDF
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">متوسط التكلفة</div>
              <div className="font-data font-bold text-lg text-white">SAR 12,450</div>
            </div>
          </div>
          <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">ساعات العمل</div>
              <div className="font-data font-bold text-lg text-white">1,204 hrs</div>
            </div>
          </div>
        </div>
      </div>
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
