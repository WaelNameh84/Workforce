import { useAuth } from '@/hooks/use-auth';
import { useGetDashboardStats, getGetDashboardStatsQueryKey } from '@workspace/api-client-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Users, UserCheck, CalendarCheck, Clock, DollarSign, Sparkles, TrendingUp, Building2 } from 'lucide-react';
import { Link } from 'wouter';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const deptColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: stats, isLoading } = useGetDashboardStats(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetDashboardStatsQueryKey({ companyId: user?.companyId || 0 }) } }
  );

  const statCards = [
    { title: t('totalEmployees'),  value: stats?.totalEmployees  ?? '—', icon: Users,        color: 'from-blue-500 to-cyan-500' },
    { title: t('presentToday'),    value: stats?.presentToday    ?? '—', icon: UserCheck,    color: 'from-green-500 to-emerald-500' },
    { title: t('onLeave'),         value: stats?.onLeave         ?? '—', icon: CalendarCheck, color: 'from-amber-500 to-orange-500' },
    { title: t('pendingRequests'), value: stats?.pendingRequests ?? '—', icon: Clock,        color: 'from-purple-500 to-pink-500' },
  ];

  const payrollData = [
    {
      month: new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      amount: stats?.monthlyPayroll ?? 0,
    },
  ];

  const aiInsights = [
    { text: 'Attendance improved 12% vs last month', color: 'text-green-500 bg-green-500/10' },
    { text: 'Sales dept. has 18% absence rate — review recommended', color: 'text-red-500 bg-red-500/10' },
    { text: 'Potential $12,400 savings in overtime allocation', color: 'text-blue-500 bg-blue-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="rounded-[1.75rem] p-5 sm:p-7 bg-gradient-to-br from-[#0f766e] via-[#166b62] to-[#173b36] text-white relative overflow-hidden shadow-xl shadow-teal-950/15">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 50%)' }} />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[.2em] text-emerald-200/75 mb-3 font-data">FIELD BRIEF / {new Date().toLocaleDateString()}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-1">{t('welcome')}, {user?.fullName}</h1>
          <p className="text-white/80 text-sm">{t('workforceOverview')}.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Link
            key={i}
            href={['/dashboard/employees', '/dashboard/attendance', '/dashboard/leaves', '/dashboard/requests'][i]}
             data-testid={`card-dashboard-stat-${i}`}
             className={`block p-5 rounded-2xl transition pressable animate-fadeIn stagger-${i + 1} surface`}
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
               <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold">{isLoading ? '—' : stat.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.title}</div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
           <h3 className="font-display text-lg font-bold mb-4">{t('attendanceOverview')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats?.recentAttendance || []}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="present" stroke="#6366f1" strokeWidth={3} fill="url(#grad1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dept Distribution */}
        <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-bold mb-4">{t('departmentDistribution')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats?.departmentStats || []}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={75}
                paddingAngle={4}
                dataKey="count" nameKey="department"
              >
                {(stats?.departmentStats || []).map((_, idx) => (
                  <Cell key={idx} fill={deptColors[idx % deptColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {(stats?.departmentStats || []).map((d, idx) => (
              <Link key={idx} href="/dashboard/employees" className="flex items-center gap-1.5 text-xs hover:opacity-70">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: deptColors[idx % deptColors.length] }} />
                <span style={{ color: 'var(--muted)' }}>{d.department}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Payroll + AI Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payroll Bar */}
        <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t('payrollTrend')}</h3>
            <span className="text-xs font-medium text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full">
              {t('currentPeriod')}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={payrollData}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Payroll']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
              />
              <Bar dataKey="amount" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold">AI Insights</h3>
          </div>
          <div className="space-y-3 mb-6">
            {aiInsights.map((ins, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm font-medium ${ins.color}`}>
                <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {ins.text}
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: t('avgSalary'),
                value: stats?.totalEmployees && stats.monthlyPayroll
                  ? `$${Math.round(stats.monthlyPayroll / stats.totalEmployees).toLocaleString()}`
                  : '—',
                icon: DollarSign,
              },
              { label: t('departments'), value: stats?.departmentStats?.length ?? '—', icon: Building2 },
            ].map((item, i) => (
              <Link
                key={i}
                href={i === 0 ? '/dashboard/payroll' : '/dashboard/employees'}
                className="block p-3 rounded-xl transition hover:-translate-y-0.5"
                style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{item.label}</span>
                </div>
                <div className="text-lg font-bold">{isLoading ? '—' : item.value}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
