import { useCallback, useEffect, useRef, useState } from 'react';
import PullToRefresh from '@/components/pull-to-refresh';
import { useAuth } from '@/hooks/use-auth';
import { useSwipeBack } from '@/hooks/use-swipe-back';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTheme } from '@/components/theme-provider';
import { useAppSettings } from '@/contexts/settings-context';
import {
  LayoutDashboard, Users, Clock, CalendarDays, CalendarCheck,
  CreditCard, Inbox, FileText, Settings, Bot, MessageSquare,
  TrendingUp, ShoppingCart, Workflow, Link2, Shield, Code,
  LogOut, Menu, Bell, Search, Globe, Moon, Sun, X, ChevronDown, User, ArrowLeft, ArrowRight, Download,
  Building2, MapPin, AlertCircle, Timer, CalendarX, CheckCircle2, Zap, FolderOpen,
} from 'lucide-react';
import {
  useGetAttendance, getGetAttendanceQueryKey,
  useGetRequests,  getGetRequestsQueryKey,
  useGetLeaves,    getGetLeavesQueryKey,
} from '@workspace/api-client-react';

const navVisuals: Record<string, {
  icon: string;
  border: string;
  badge: string;
  badgeBorder: string;
  glow: string;
}> = {
  '/dashboard': {
    icon: 'text-indigo-300 bg-indigo-950/70 border-indigo-400/40',
    border: 'border-indigo-500/30',
    badge: 'text-indigo-200 bg-indigo-950/80',
    badgeBorder: 'border-indigo-400/30',
    glow: 'shadow-indigo-500/20',
  },
  '/dashboard/employees': {
    icon: 'text-purple-300 bg-purple-950/70 border-purple-400/40',
    border: 'border-purple-500/30',
    badge: 'text-purple-200 bg-purple-950/80',
    badgeBorder: 'border-purple-400/30',
    glow: 'shadow-purple-500/20',
  },
  '/dashboard/attendance': {
    icon: 'text-emerald-300 bg-emerald-950/70 border-emerald-400/40',
    border: 'border-emerald-500/30',
    badge: 'text-emerald-200 bg-emerald-950/80',
    badgeBorder: 'border-emerald-400/30',
    glow: 'shadow-emerald-500/20',
  },
  '/dashboard/schedule': {
    icon: 'text-amber-300 bg-amber-950/70 border-amber-400/40',
    border: 'border-amber-500/30',
    badge: 'text-amber-200 bg-amber-950/80',
    badgeBorder: 'border-amber-400/30',
    glow: 'shadow-amber-500/20',
  },
  '/dashboard/leaves': {
    icon: 'text-teal-300 bg-teal-950/70 border-teal-400/40',
    border: 'border-teal-500/30',
    badge: 'text-teal-200 bg-teal-950/80',
    badgeBorder: 'border-teal-400/30',
    glow: 'shadow-teal-500/20',
  },
  '/dashboard/payroll': {
    icon: 'text-green-300 bg-green-950/70 border-green-400/40',
    border: 'border-green-500/30',
    badge: 'text-green-200 bg-green-950/80',
    badgeBorder: 'border-green-400/30',
    glow: 'shadow-green-500/20',
  },
  '/dashboard/requests': {
    icon: 'text-orange-300 bg-orange-950/70 border-orange-400/40',
    border: 'border-orange-500/30',
    badge: 'text-orange-200 bg-orange-950/80',
    badgeBorder: 'border-orange-400/30',
    glow: 'shadow-orange-500/20',
  },
  '/dashboard/reports': {
    icon: 'text-cyan-300 bg-cyan-950/70 border-cyan-400/40',
    border: 'border-cyan-500/30',
    badge: 'text-cyan-200 bg-cyan-950/80',
    badgeBorder: 'border-cyan-400/30',
    glow: 'shadow-cyan-500/20',
  },
  '/dashboard/ai': {
    icon: 'text-pink-300 bg-pink-950/70 border-pink-400/40',
    border: 'border-pink-500/30',
    badge: 'text-pink-200 bg-pink-950/80',
    badgeBorder: 'border-pink-400/30',
    glow: 'shadow-pink-500/20',
  },
  '/dashboard/communication': {
    icon: 'text-sky-300 bg-sky-950/70 border-sky-400/40',
    border: 'border-sky-500/30',
    badge: 'text-sky-200 bg-sky-950/80',
    badgeBorder: 'border-sky-400/30',
    glow: 'shadow-sky-500/20',
  },
  '/dashboard/performance': {
    icon: 'text-violet-300 bg-violet-950/70 border-violet-400/40',
    border: 'border-violet-500/30',
    badge: 'text-violet-200 bg-violet-950/80',
    badgeBorder: 'border-violet-400/30',
    glow: 'shadow-violet-500/20',
  },
  '/dashboard/purchases': {
    icon: 'text-fuchsia-300 bg-fuchsia-950/70 border-fuchsia-400/40',
    border: 'border-fuchsia-500/30',
    badge: 'text-fuchsia-200 bg-fuchsia-950/80',
    badgeBorder: 'border-fuchsia-400/30',
    glow: 'shadow-fuchsia-500/20',
  },
  '/dashboard/automation': {
    icon: 'text-slate-300 bg-slate-800/60 border-slate-600/30',
    border: 'border-slate-600/20',
    badge: 'text-slate-400 bg-slate-800/60',
    badgeBorder: 'border-slate-600/20',
    glow: 'shadow-slate-900/10',
  },
  '/dashboard/integrations': {
    icon: 'text-blue-300 bg-blue-950/70 border-blue-400/40',
    border: 'border-blue-500/30',
    badge: 'text-blue-200 bg-blue-950/80',
    badgeBorder: 'border-blue-400/30',
    glow: 'shadow-blue-500/20',
  },
  '/dashboard/security': {
    icon: 'text-slate-300 bg-slate-800/60 border-slate-600/30',
    border: 'border-slate-600/20',
    badge: 'text-slate-400 bg-slate-800/60',
    badgeBorder: 'border-slate-600/20',
    glow: 'shadow-slate-900/10',
  },
  '/dashboard/developers': {
    icon: 'text-slate-300 bg-slate-800/60 border-slate-600/30',
    border: 'border-slate-600/20',
    badge: 'text-slate-400 bg-slate-800/60',
    badgeBorder: 'border-slate-600/20',
    glow: 'shadow-slate-900/10',
  },
  '/dashboard/settings': {
    icon: 'text-purple-200 bg-purple-950/70 border-purple-300/40',
    border: 'border-purple-400/30',
    badge: 'text-purple-100 bg-purple-950/80',
    badgeBorder: 'border-purple-300/30',
    glow: 'shadow-purple-400/20',
  },
  '/dashboard/departments': {
    icon: 'text-blue-300 bg-blue-950/70 border-blue-400/40',
    border: 'border-blue-500/30',
    badge: 'text-blue-200 bg-blue-950/80',
    badgeBorder: 'border-blue-400/30',
    glow: 'shadow-blue-500/20',
  },
  '/dashboard/locations': {
    icon: 'text-emerald-300 bg-emerald-950/70 border-emerald-400/40',
    border: 'border-emerald-500/30',
    badge: 'text-emerald-200 bg-emerald-950/80',
    badgeBorder: 'border-emerald-400/30',
    glow: 'shadow-emerald-500/20',
  },
  '/dashboard/action-center': {
    icon: 'text-rose-300 bg-rose-950/70 border-rose-400/40',
    border: 'border-rose-500/30',
    badge: 'text-rose-200 bg-rose-950/80',
    badgeBorder: 'border-rose-400/30',
    glow: 'shadow-rose-500/20',
  },
  '/dashboard/documentation': {
    icon: 'text-indigo-300 bg-indigo-950/70 border-indigo-400/40',
    border: 'border-indigo-500/30',
    badge: 'text-indigo-200 bg-indigo-950/80',
    badgeBorder: 'border-indigo-400/30',
    glow: 'shadow-indigo-500/20',
  },
};

const navBadges: Record<string, string> = {
  '/dashboard/action-center': 'HOT',
  '/dashboard': 'LIVE',
  '/dashboard/employees': 'TEAM',
  '/dashboard/attendance': '5G',
  '/dashboard/schedule': 'SHIFTS',
  '/dashboard/leaves': '21 DAYS',
  '/dashboard/payroll': 'SAR',
  '/dashboard/requests': 'PENDING',
  '/dashboard/reports': 'CSV/PDF',
  '/dashboard/ai': 'AI',
  '/dashboard/communication': 'CHANNELS',
  '/dashboard/performance': 'KPIs',
  '/dashboard/purchases': 'STORE',
  '/dashboard/automation': 'AUTO',
  '/dashboard/integrations': 'LINK',
  '/dashboard/security': 'AES-256',
  '/dashboard/developers': 'API',
  '/dashboard/settings': 'CONFIG',
  '/dashboard/departments': 'DEPTS',
  '/dashboard/locations': 'SITES',
  '/dashboard/documentation': 'DOCS',
};

// ─── Live Clock widget ────────────────────────────────────────────────────────
function LiveClock() {
  const s = useAppSettings();
  const { locale } = useLanguage();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (s.clockPos !== 'header') return null;

  const intlLocale = locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US';
  const timeStr = now.toLocaleTimeString(s.showArabicDay ? 'ar-SA' : intlLocale, {
    hour: '2-digit', minute: '2-digit',
    second: s.showSeconds ? '2-digit' : undefined,
    hour12: s.show12h,
  });
  const dateStr = s.showDate
    ? now.toLocaleDateString(s.showArabicDay ? 'ar-SA' : intlLocale, { weekday: 'short', month: 'short', day: 'numeric' })
    : null;

  const sizeClass = s.clockSize === 'small' ? 'text-xs' : s.clockSize === 'large' ? 'text-base' : 'text-sm';

  return (
    <div className="hidden sm:flex flex-col items-center leading-none px-3 py-1.5 rounded-xl border border-border bg-white/5">
      <span className={`font-mono font-black ${sizeClass}`} style={{ color: s.clockColor }}>{timeStr}</span>
      {dateStr && <span className="text-[10px] text-muted-foreground mt-0.5">{dateStr}</span>}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const s = useAppSettings();
  const { user, isLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { t, locale, setLocale, dir } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const { canInstall, install } = useInstallPrompt();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedNotifIdx, setSelectedNotifIdx] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const formatText = useCallback((key: Parameters<typeof t>[0], values: Record<string, string | number> = {}) => {
    return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), t(key));
  }, [t]);
  const drawerStartX = useRef<number | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const cid = user?.companyId || 0;
  const { data: nAttData } = useGetAttendance(
    { companyId: cid, date: todayStr },
    { query: { enabled: !!cid, queryKey: getGetAttendanceQueryKey({ companyId: cid, date: todayStr }) } }
  );
  const { data: nReqData } = useGetRequests(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetRequestsQueryKey({ companyId: cid }) } }
  );
  const { data: nLeaveData } = useGetLeaves(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetLeavesQueryKey({ companyId: cid }) } }
  );
  const nAtt: any[]    = (nAttData as any)?.attendance || [];
  const nReqs: any[]   = (nReqData as any)?.requests   || [];
  const nLeaves: any[] = nLeaveData?.leaves             || [];
  const lateToday    = nAtt.filter((a: any) => a.isLate);
  const pendingReqs  = nReqs.filter((r: any) => r.status === 'pending');
  const pendingLeaves= nLeaves.filter((l: any) => l.status === 'pending');
  const notifItems = [
    ...lateToday.map((a: any) => ({
      icon: Timer, color: 'text-violet-400 bg-violet-500/15',
       title: `${a.employeeName || t('employee')} — ${t('lateArrival')}`,
       time: a.clockIn ? new Date(a.clockIn).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : t('today'),
      details: [
         { label: t('employee'), value: a.employeeName || '—' },
         { label: t('timeIn'), value: a.clockIn ? new Date(a.clockIn).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—' },
         { label: t('date'), value: a.date ? new Date(a.date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US') : t('today') },
         { label: t('location'), value: a.location || '—' },
         { label: t('method'), value: a.method || '—' },
      ],
    })),
    ...pendingReqs.map((r: any) => ({
      icon: AlertCircle, color: 'text-amber-400 bg-amber-500/15',
       title: r.title || `${t('newRequest')} — ${t('pending')}`,
       time: r.createdAt ? new Date(r.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US') : t('today'),
      details: [
         { label: t('requestType'), value: r.type || r.title || '—' },
         { label: t('employee'), value: r.employeeName || '—' },
         { label: t('status'), value: r.status === 'pending' ? t('pending') : r.status },
         { label: t('date'), value: r.createdAt ? new Date(r.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US') : '—' },
         { label: t('description'), value: r.description || r.notes || '—' },
      ],
    })),
    ...pendingLeaves.map((l: any) => ({
      icon: CalendarX, color: 'text-blue-400 bg-blue-500/15',
       title: `${t('leaveRequest')} — ${l.employeeName || t('employee')} (${l.daysCount || '—'} ${t('days')})`,
       time: l.startDate ? new Date(l.startDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US') : t('today'),
      details: [
         { label: t('employee'), value: l.employeeName || '—' },
         { label: t('leaveType'), value: l.type || '—' },
         { label: t('from'), value: l.startDate ? new Date(l.startDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US') : '—' },
         { label: t('to'), value: l.endDate ? new Date(l.endDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US') : '—' },
         { label: t('days'), value: l.daysCount ? `${l.daysCount} ${t('days')}` : '—' },
         { label: t('reason'), value: l.reason || '—' },
      ],
    })),
  ];
  const totalNotifs = notifItems.length;

  const isEmployee = user?.role === 'employee';
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const goBack = useCallback(() => {
    if (location !== '/dashboard') window.history.back();
  }, [location]);
  useSwipeBack(goBack);

  useEffect(() => {
    if (!isLoading && !user) setLocation('/login');
  }, [user, isLoading, setLocation]);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location]);

  useEffect(() => {
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const onPopState = () => {
      if (sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [sidebarOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-28 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
      </div>
    );
  }
  if (!user) return null;

  const toggleLanguage = () => {
    setSidebarOpen(false);
    const order: typeof locale[] = ['en', 'ar', 'sv'];
    setLocale(order[(order.indexOf(locale) + 1) % order.length]);
  };

  // Employee nav — only their own data
  const employeeNavGroups = [
    {
      id: 'main',
       title: t('mainNav'),
      items: [{ href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard }],
    },
    {
      id: 'my-info',
       title: t('myInfo'),
      items: [
        { href: '/dashboard/attendance', label: t('attendance'), icon: Clock },
        { href: '/dashboard/schedule',   label: t('schedule'),   icon: CalendarDays },
        { href: '/dashboard/leaves',     label: t('leaves'),     icon: CalendarCheck },
        { href: '/dashboard/payroll',    label: t('payroll'),    icon: CreditCard },
        { href: '/dashboard/requests',   label: t('requests'),   icon: Inbox },
      ],
    },
    {
      id: 'account',
       title: t('account'),
      items: [
        { href: '/dashboard/settings', label: t('settings'), icon: Settings },
      ],
    },
  ];

  // Admin/Manager nav — full access
  const adminNavGroups = [
    {
      id: 'main',
       title: t('mainNav'),
      items: [
        { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/dashboard/action-center', label: t('actionCenter'), icon: Zap },
      ],
    },
    {
      id: 'hr-management',
       title: t('hrManagement'),
      items: [
        { href: '/dashboard/employees',     label: t('employees'),   icon: Users },
        { href: '/dashboard/departments',   label: t('departments'),        icon: Building2 },
        { href: '/dashboard/locations',     label: t('workLocations'),       icon: MapPin },
        { href: '/dashboard/documentation', label: t('documentation'),        icon: FolderOpen },
        { href: '/dashboard/attendance',    label: t('attendance'),  icon: Clock },
        { href: '/dashboard/leaves',        label: t('leaves'),      icon: CalendarCheck },
        { href: '/dashboard/payroll',       label: t('payroll'),     icon: CreditCard },
        { href: '/dashboard/requests',      label: t('requests'),    icon: Inbox },
      ],
    },
    {
      id: 'advanced',
       title: t('advanced'),
      items: [
        { href: '/dashboard/reports',       label: t('reports'),       icon: FileText },
        { href: '/dashboard/ai',            label: t('aiAssistant'),   icon: Bot },
        { href: '/dashboard/communication', label: t('communication'), icon: MessageSquare },
        { href: '/dashboard/performance',   label: t('performance'),   icon: TrendingUp },
        { href: '/dashboard/purchases',     label: t('purchases'),     icon: ShoppingCart },
      ],
    },
    {
      id: 'system',
       title: t('system'),
      items: [
        { href: '/dashboard/settings', label: t('settings'), icon: Settings },
      ],
    },
  ];

  const navGroups = isEmployee ? employeeNavGroups : adminNavGroups;
  const isActive = (href: string) =>
    href === '/dashboard' ? location === '/dashboard' : location.startsWith(href);

  const currentNavItem = navGroups
    .flatMap(group => group.items)
    .find(item => isActive(item.href));
  const isSubpage = location !== '/dashboard';

  const roleBadge = isEmployee
    ? { label: t('roleEmployee'), color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    : user?.role === 'manager'
      ? { label: t('roleManager'), color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
      : { label: t('roleAdmin'), color: 'bg-red-500/10 text-red-400 border-red-500/20' };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">{(s.appName || 'W')[0].toUpperCase()}</span>
          </div>
          <div>
            <div className="font-display font-bold text-sm text-white">{s.appName}</div>
                    <div className="text-[10px] text-muted-foreground">{t('company')}</div>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleBadge.color}`}>
          {isEmployee ? <User className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
          {roleBadge.label}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto scrollbar-thin" aria-label={t('dashboardSections')}>
        {navGroups.map(group => (
          <div key={group.id} className="mb-3">
            <div className="flex items-center px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {group.title}
              </span>
            </div>
            <div className="mt-1.5 space-y-1.5">
                {group.items.map(item => {
                  const active = isActive(item.href);
                  const visual = navVisuals[item.href] || navVisuals['/dashboard'];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`nav-card group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl border text-sm font-black transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${visual.border} ${visual.glow} ${
                        active ? 'nav-card-active text-white' : 'text-slate-200'
                      }`}
                    >
                      <span className="relative flex min-w-0 items-center gap-3">
                        <span className={`nav-card-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-lg ${visual.icon} ${active ? 'nav-card-icon-active' : ''}`}>
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className={`relative shrink-0 rounded-lg border px-2 py-1 text-[9px] font-black tracking-wide ${visual.badge} ${visual.badgeBorder}`}>
                        {navBadges[item.href]}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* User info at bottom */}
      {canInstall && (
        <div className="px-4 pb-3 lg:hidden">
          <button
            type="button"
            onClick={() => { void install(); setSidebarOpen(false); }}
            className="flex w-full items-center gap-3 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-3 text-sm font-bold text-indigo-200 transition hover:bg-indigo-500/20 active:scale-[.98]"
          >
            <Download className="h-4 w-4" />
             {t('installApp')}
          </button>
        </div>
      )}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.fullName}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`h-screen flex ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`} style={{ background: 'var(--background)', height: '100dvh' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/5 h-screen sticky top-0 overflow-hidden" style={{ background: 'var(--sidebar-bg)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div
            className={`absolute top-0 bottom-0 z-10 w-[min(72vw,17rem)] flex flex-col shadow-2xl ${dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'} border-white/10`}
            style={{ background: 'var(--sidebar-bg)' }}
            onTouchStart={(event) => { drawerStartX.current = event.touches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => {
              if (drawerStartX.current === null) return;
              const dx = event.changedTouches[0]?.clientX - drawerStartX.current;
              drawerStartX.current = null;
              if ((dir === 'rtl' && dx > 80) || (dir !== 'rtl' && dx < -80)) setSidebarOpen(false);
            }}
          >
            <button
              onClick={() => setSidebarOpen(false)}
               aria-label={t('closeMenu')}
              className={`absolute top-4 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6 py-3 border-b border-white/5"
          style={{ background: 'var(--background)', backdropFilter: 'blur(10px)', paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-1 lg:hidden">
            {isSubpage && (
              <button
                onClick={goBack}
                aria-label={t('goBack')}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-200 transition hover:bg-white/10 active:scale-90"
              >
                {dir === 'rtl' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label={t('openMenu')}
              aria-expanded={sidebarOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-200 transition hover:bg-white/10 active:scale-90"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-sm font-black">{currentNavItem?.label || s.appName}</p>
            <p className="truncate text-[10px] text-muted-foreground">{s.appName}</p>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-muted-foreground">
            <Search className="w-4 h-4 shrink-0" />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>

          <div className="flex-1 lg:hidden" />

          {/* Live clock */}
          <LiveClock />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage} className="p-2 rounded-lg hover:bg-white/5 transition text-muted-foreground hover:text-foreground">
              <Globe className="w-4 h-4" />
            </button>
            <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover:bg-white/5 transition text-muted-foreground hover:text-foreground">
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="relative">
              <button
                onClick={() => { setNotificationsOpen(!notificationsOpen); setUserMenuOpen(false); }}
                className="relative p-2 rounded-lg hover:bg-white/5 transition text-muted-foreground hover:text-foreground"
              >
                <Bell className="w-4 h-4" />
                {totalNotifs > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white px-1">
                    {totalNotifs > 9 ? '9+' : totalNotifs}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                  <div
                    dir={dir}
                    className="fixed top-[3.5rem] left-2 right-2 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 z-20 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                    style={{ background: 'var(--card)' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-sm">{t('notifications')}</span>
                        {totalNotifs > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black border border-red-500/30">
                            {totalNotifs}
                          </span>
                        )}
                      </div>
                      <button onClick={() => setNotificationsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition">
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Items */}
                    <div className="max-h-96 overflow-y-auto">
                      {notifItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <CheckCircle2 className="w-8 h-8 text-green-400" />
                          <p className="text-sm font-bold text-muted-foreground">{t('noNewNotifications')}</p>
                        </div>
                      ) : selectedNotifIdx !== null ? (
                        /* ── Detail view ── */
                        <div className="p-3">
                          <button
                            onClick={() => setSelectedNotifIdx(null)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-3"
                          >
                             <span className="text-base leading-none">{dir === 'rtl' ? '→' : '←'}</span> {t('backToNotifications')}
                          </button>
                          {(() => {
                            const n = notifItems[selectedNotifIdx];
                            return (
                              <div className="rounded-xl border border-white/10 overflow-hidden">
                                <div className={`flex items-center gap-3 px-4 py-3 ${n.color.replace('text-', 'border-b border-').split(' ')[0]}/20 border-b border-white/10`}>
                                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.color}`}>
                                    <n.icon className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <p className="text-xs font-bold leading-snug">{n.title}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                                  </div>
                                </div>
                                <div className="divide-y divide-white/5">
                                  {n.details.map((d, di) => (
                                    <div key={di} className="flex items-start justify-between gap-3 px-4 py-2.5">
                                      <span className="text-[11px] text-muted-foreground shrink-0">{d.label}</span>
                                      <span className="text-[11px] font-semibold text-right">{d.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        /* ── List view ── */
                        <div className="p-2 space-y-1">
                          {notifItems.map((n, i) => (
                            <div
                              key={i}
                              onClick={() => setSelectedNotifIdx(i)}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition cursor-pointer"
                            >
                              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${n.color}`}>
                                <n.icon className="w-3.5 h-3.5" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold leading-snug">{n.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                              </div>
                              <span className="text-muted-foreground/50 text-lg leading-none mt-0.5">‹</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-white/10">
                      {(lateToday.length > 0 || pendingReqs.length > 0 || pendingLeaves.length > 0) && (
                        <div className="flex items-center justify-between px-4 py-2 text-[11px] text-muted-foreground">
                           <span>{formatText('lateCount', { count: lateToday.length })} · {formatText('requestCount', { count: pendingReqs.length })} · {formatText('leaveCount', { count: pendingLeaves.length })}</span>
                          <button
                            onClick={() => setNotificationsOpen(false)}
                            className="text-indigo-400 font-bold hover:text-indigo-300 transition"
                          >
                             {t('close')}
                          </button>
                        </div>
                      )}
                      {isAdmin && (
                        <div className="px-3 pb-3 pt-2">
                          <button
                            onClick={() => { setNotificationsOpen(false); setLocation('/dashboard/action-center'); }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs
                              bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400
                              text-white shadow-md transition-all"
                          >
                            <Zap className="w-3.5 h-3.5" />
                             {t('openManagerActionCenter')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.fullName?.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="fixed top-[3.5rem] right-2 left-auto sm:absolute sm:top-full sm:mt-1 sm:right-0 z-20 w-[min(13rem,calc(100vw-1rem))] rounded-xl border border-white/10 shadow-xl py-1" style={{ background: 'var(--card)' }}>
                    <div className="px-4 py-2 border-b border-white/5">
                      <div className="text-sm font-medium truncate">{user?.fullName}</div>
                      <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                      <span className={`inline-flex mt-1 items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <Settings className="w-4 h-4" />
                      {t('settings')}
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

         {isOffline && <div className="sticky top-0 z-20 flex items-center justify-center gap-2 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 animate-fadeIn"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />{locale === 'ar' ? 'لا يوجد اتصال بالإنترنت — بعض البيانات قد لا تكون محدثة' : locale === 'sv' ? 'Ingen internetanslutning — vissa data kan vara inaktuella' : 'No internet connection — some data may be outdated'}</div>}

        {/* Page content — Pull-to-refresh wraps the scrollable area */}
        <PullToRefresh>
          <main className="page-shell w-full min-w-0 p-3 sm:p-4 lg:p-6 max-w-[1800px] mx-auto"
                style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
            {children}
          </main>
        </PullToRefresh>
      </div>
    </div>
  );
}
