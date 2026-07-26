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
    { text: 'Attendance improved 12% vs last month', color: 'border-l-green-500 bg-green-500/5 text-green-700 dark:text-green-400' },
    { text: 'Sales dept. has 18% absence rate — review recommended', color: 'border-l-red-500 bg-red-500/5 text-red-700 dark:text-red-400' },
    { text: 'Potential $12,400 savings in overtime allocation', color: 'border-l-blue-500 bg-blue-500/5 text-blue-700 dark:text-blue-400' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-animated-gradient text-white relative overflow-hidden shadow-2xl shadow-teal-950/20 card-3d border-0">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_50%,_white_0%,_transparent_50%)]" />
        {/* Animated Particles */}
        <div className="particle w-32 h-32" style={{ left: '70%', top: '60%', animationDelay: '0s' }} />
        <div className="particle w-16 h-16" style={{ left: '85%', top: '20%', animationDelay: '1.5s' }} />
        <div className="particle w-24 h-24" style={{ left: '50%', top: '80%', animationDelay: '3s' }} />

        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[.2em] text-emerald-200/75 mb-3 font-data">FIELD BRIEF / {new Date().toLocaleDateString()}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">{t('welcome')}, {user?.fullName}</h1>
          <p className="text-white/80 text-sm max-w-lg leading-relaxed">{t('workforceOverview')}.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Link
            key={i}
            href={['/dashboard/employees', '/dashboard/attendance', '/dashboard/leaves', '/dashboard/requests'][i]}
             data-testid={`card-dashboard-stat-${i}`}
             className={`block p-5 rounded-2xl transition pressable animate-fadeIn stagger-${i + 1} card-3d`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold mb-1">{isLoading ? '—' : stat.value}</div>
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{stat.title}</div>
            
            {/* Decorative progress bar */}
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-4 overflow-hidden">
               <div className={`h-full rounded-full bg-gradient-to-r ${stat.color} w-3/4`} />
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl card-3d">
           <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
             {t('attendanceOverview')}
           </h3>
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
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
              <Area type="monotone" dataKey="present" stroke="#6366f1" strokeWidth={3} fill="url(#grad1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dept Distribution */}
        <div className="p-6 rounded-2xl card-3d">
          <h3 className="font-display text-lg font-bold mb-4">{t('departmentDistribution')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats?.departmentStats || []}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={80}
                paddingAngle={4}
                dataKey="count" nameKey="department"
                stroke="none"
              >
                {(stats?.departmentStats || []).map((_, idx) => (
                  <Cell key={idx} fill={deptColors[idx % deptColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-4">
            {(stats?.departmentStats || []).map((d, idx) => (
              <Link key={idx} href="/dashboard/employees" className="flex items-center gap-2 text-xs font-medium hover:opacity-70 transition-opacity">
                <div className="w-3 h-3 rounded-full" style={{ background: deptColors[idx % deptColors.length] }} />
                <span style={{ color: 'var(--muted)' }}>{d.department}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Payroll + AI Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payroll Bar */}
        <div className="p-6 rounded-2xl card-3d">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-bold">{t('payrollTrend')}</h3>
            <span className="text-xs font-bold tracking-wide uppercase text-indigo-500 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
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
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                cursor={{ fill: 'var(--muted-bg)' }}
              />
              <Bar dataKey="amount" fill="url(#barGrad)" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div className="p-6 rounded-2xl card-3d bg-gradient-to-b from-[var(--card)] to-[var(--muted-bg)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-display text-lg font-bold">AI Insights</h3>
          </div>
          <div className="space-y-3 mb-6">
            {aiInsights.map((ins, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium border-l-4 card-3d !shadow-sm ${ins.color}`}>
                <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" />
                {ins.text}
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
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
                className="block p-4 rounded-xl transition card-3d pressable"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-indigo-500" />
                  </div>
                </div>
                <div className="text-xl font-bold font-data">{isLoading ? '—' : item.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{item.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
