import { useAuth } from '@/hooks/use-auth';
import { useGetDashboardStats, getGetDashboardStatsQueryKey } from '@workspace/api-client-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Users, Clock, CalendarDays, CalendarCheck,
  CreditCard, Inbox, FileText, Bot, MessageSquare, TrendingUp,
  Shield, Settings, Download, Printer, DollarSign
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location] = useLocation();

  const { data: stats, isLoading } = useGetDashboardStats(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetDashboardStatsQueryKey({ companyId: user?.companyId || 0 }) } }
  );

  const modules = [
    { id: 1, name: 'لوحة التحكم', badge: 'Live', badgeColor: 'bg-green-500/10 text-green-500 border-green-500/20', icon: LayoutDashboard, iconColor: 'bg-green-500', href: '/dashboard' },
    { id: 2, name: 'الموظفون', badge: `+${stats?.totalEmployees || 110}`, badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Users, iconColor: 'bg-blue-500', href: '/dashboard/employees' },
    { id: 3, name: 'الحضور', badge: 'Today', badgeColor: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', icon: Clock, iconColor: 'bg-cyan-500', href: '/dashboard/attendance' },
    { id: 4, name: 'الجداول', badge: 'Shifts', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: CalendarDays, iconColor: 'bg-indigo-500', href: '/dashboard/schedule' },
    { id: 5, name: 'الإجازات', badge: 'Days 21', badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: CalendarCheck, iconColor: 'bg-amber-500', href: '/dashboard/leaves' },
    { id: 6, name: 'الرواتب', badge: 'SAR', badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CreditCard, iconColor: 'bg-emerald-500', href: '/dashboard/payroll' },
    { id: 7, name: 'الطلبات', badge: `${stats?.pendingRequests || 12}`, badgeColor: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Inbox, iconColor: 'bg-orange-500', href: '/dashboard/requests' },
    { id: 8, name: 'التقارير', badge: 'CSV/PDF', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: FileText, iconColor: 'bg-purple-500', href: '/dashboard/reports' },
    { id: 9, name: 'المساعد الذكي', badge: 'GPT-4o', badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: Bot, iconColor: 'bg-violet-500', href: '/dashboard/ai' },
    { id: 10, name: 'الاتصالات', badge: 'Channels', badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20', icon: MessageSquare, iconColor: 'bg-sky-500', href: '/dashboard/communication' },
    { id: 11, name: 'الأداء', badge: 'KPIs', badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20', icon: TrendingUp, iconColor: 'bg-teal-500', href: '/dashboard/performance' },
    { id: 12, name: 'الأمن', badge: 'AES-256', badgeColor: 'bg-red-500/10 text-red-500 border-red-500/20', icon: Shield, iconColor: 'bg-red-500', href: '/dashboard/security' },
    { id: 13, name: 'الإعدادات', badge: 'Config', badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Settings, iconColor: 'bg-slate-500', href: '/dashboard/settings' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-20">
      
      {/* Welcome Banner */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 text-white">{t('welcome')}, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/20">
          <span className="text-white font-bold text-lg">{user?.fullName?.charAt(0) || 'U'}</span>
        </div>
      </div>

      {/* Module List */}
      <div className="space-y-3">
        {modules.map((module, i) => {
          const isActive = location === module.href;
          return (
            <Link
              key={module.id}
              href={module.href}
              className={`card-module flex items-center justify-between p-4 pressable stagger-${(i % 6) + 1} ${isActive ? 'active' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${module.iconColor}`}>
                  <module.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-data text-sm font-bold w-5 text-center opacity-50">{module.id}</span>
                  <span className="font-bold text-lg text-foreground">{module.name}</span>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border font-data tracking-wide uppercase ${module.badgeColor}`}>
                {module.badge}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Featured Detail Card (Reference 2) */}
      <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#141424] to-[#1a1a2e] border border-white/5 p-6 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[60px]" />
        
        <h3 className="font-display text-2xl font-bold mb-3 text-white relative z-10">التقارير الإدارية، مؤشرات الأداء وتصدير البيانات</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6 relative z-10 max-w-[90%]">
          نظام متكامل لاستخراج تقارير الحضور والانصراف، الرواتب، وتقييم الأداء بضغطة زر. يدعم التصدير بصيغ متعددة مع إمكانية جدولة التقارير التلقائية.
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

        {/* Tab Chips */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-6 relative z-10">
          <span className="px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold">تقارير شهرية</span>
          <span className="px-4 py-1.5 rounded-full text-muted-foreground text-xs font-bold">أسبوعية</span>
          <span className="px-4 py-1.5 rounded-full text-muted-foreground text-xs font-bold">يومية</span>
        </div>

        {/* Stat Cards inside Featured */}
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
