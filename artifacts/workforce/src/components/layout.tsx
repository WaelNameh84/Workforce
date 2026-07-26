import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTheme } from '@/components/theme-provider';
import {
  LayoutDashboard, Users, Clock, CalendarDays, CalendarCheck,
  CreditCard, Inbox, FileText, Settings, Bot, MessageSquare,
  TrendingUp, ShoppingCart, Workflow, Link2, Shield, Code,
  LogOut, Menu, Bell, Search, Globe, Moon, Sun, X, ChevronDown, User
} from 'lucide-react';

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
    icon: 'text-lime-300 bg-lime-950/70 border-lime-400/40',
    border: 'border-lime-500/30',
    badge: 'text-lime-200 bg-lime-950/80',
    badgeBorder: 'border-lime-400/30',
    glow: 'shadow-lime-500/20',
  },
  '/dashboard/integrations': {
    icon: 'text-blue-300 bg-blue-950/70 border-blue-400/40',
    border: 'border-blue-500/30',
    badge: 'text-blue-200 bg-blue-950/80',
    badgeBorder: 'border-blue-400/30',
    glow: 'shadow-blue-500/20',
  },
  '/dashboard/security': {
    icon: 'text-rose-300 bg-rose-950/70 border-rose-400/40',
    border: 'border-rose-500/30',
    badge: 'text-rose-200 bg-rose-950/80',
    badgeBorder: 'border-rose-400/30',
    glow: 'shadow-rose-500/20',
  },
  '/dashboard/developers': {
    icon: 'text-slate-200 bg-slate-800/80 border-slate-400/40',
    border: 'border-slate-500/30',
    badge: 'text-slate-200 bg-slate-800/80',
    badgeBorder: 'border-slate-400/30',
    glow: 'shadow-slate-500/20',
  },
  '/dashboard/settings': {
    icon: 'text-purple-200 bg-purple-950/70 border-purple-300/40',
    border: 'border-purple-400/30',
    badge: 'text-purple-100 bg-purple-950/80',
    badgeBorder: 'border-purple-300/30',
    glow: 'shadow-purple-400/20',
  },
};

const navBadges: Record<string, string> = {
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
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { t, locale, setLocale, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    main: true,
    'hr-management': true,
    advanced: false,
    system: false,
  });

  const isEmployee = user?.role === 'employee';
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (!isLoading && !user) setLocation('/login');
  }, [user, isLoading, setLocation]);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-28 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
      </div>
    );
  }
  if (!user) return null;

  const toggleLanguage = () => {
    const order: typeof locale[] = ['en', 'ar', 'sv'];
    setLocale(order[(order.indexOf(locale) + 1) % order.length]);
  };

  // Employee nav — only their own data
  const employeeNavGroups = [
    {
      id: 'main',
      title: 'Main',
      items: [{ href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard }],
    },
    {
      id: 'my-info',
      title: 'My Info',
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
      title: 'Account',
      items: [
        { href: '/dashboard/settings', label: t('settings'), icon: Settings },
      ],
    },
  ];

  // Admin/Manager nav — full access
  const adminNavGroups = [
    {
      id: 'main',
      title: 'Main',
      items: [{ href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard }],
    },
    {
      id: 'hr-management',
      title: 'HR Management',
      items: [
        { href: '/dashboard/employees',  label: t('employees'),  icon: Users },
        { href: '/dashboard/attendance', label: t('attendance'), icon: Clock },
        { href: '/dashboard/leaves',     label: t('leaves'),     icon: CalendarCheck },
        { href: '/dashboard/payroll',    label: t('payroll'),    icon: CreditCard },
        { href: '/dashboard/requests',   label: t('requests'),   icon: Inbox },
      ],
    },
    {
      id: 'advanced',
      title: 'Advanced',
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
      title: 'System',
      items: [
        { href: '/dashboard/automation',   label: t('automation'),   icon: Workflow },
        { href: '/dashboard/integrations', label: t('integrations'), icon: Link2 },
        { href: '/dashboard/security',     label: t('security'),     icon: Shield },
        { href: '/dashboard/developers',   label: t('developers'),   icon: Code },
        { href: '/dashboard/settings',     label: t('settings'),     icon: Settings },
      ],
    },
  ];

  const navGroups = isEmployee ? employeeNavGroups : adminNavGroups;

  const isActive = (href: string) =>
    href === '/dashboard' ? location === '/dashboard' : location.startsWith(href);

  useEffect(() => {
    const activeGroup = navGroups.find(g => g.items.some(i => isActive(i.href)));
    if (activeGroup) {
      setOpenGroups(prev => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [location]);

  const roleBadge = isEmployee
    ? { label: 'موظف', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    : user?.role === 'manager'
      ? { label: 'مدير', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
      : { label: 'أدمن', color: 'bg-red-500/10 text-red-400 border-red-500/20' };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <div>
            <div className="font-display font-bold text-sm text-white">WorkforceOS</div>
            <div className="text-[10px] text-muted-foreground">HR Management</div>
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
      <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto scrollbar-thin" aria-label="Dashboard sections">
        {navGroups.map(group => (
          <div key={group.id} className="mb-3">
            <button
              onClick={() => setOpenGroups(p => ({ ...p, [group.id]: !p[group.id] }))}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${openGroups[group.id] ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {group.title}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${openGroups[group.id] ? 'rotate-180' : ''}`} />
            </button>
            {openGroups[group.id] && (
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
            )}
          </div>
        ))}
      </nav>

      {/* User info at bottom */}
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
    <div className={`min-h-screen flex ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`} style={{ background: 'var(--background)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/5 h-screen sticky top-0 overflow-hidden" style={{ background: 'var(--sidebar-bg)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
          <div
            className={`relative z-10 w-[min(86vw,20rem)] h-full flex flex-col shadow-2xl border-white/10 ${dir === 'rtl' ? 'mr-auto border-l' : 'ml-0 border-r'}`}
            style={{ background: 'var(--sidebar-bg)' }}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
              className={`absolute top-4 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6 py-3 border-b border-white/5" style={{ background: 'var(--background)', backdropFilter: 'blur(10px)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            className="lg:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-sm hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-muted-foreground">
            <Search className="w-4 h-4 shrink-0" />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search..."
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>

          <div className="flex-1 lg:hidden" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage} className="p-2 rounded-lg hover:bg-white/5 transition text-muted-foreground hover:text-foreground">
              <Globe className="w-4 h-4" />
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover:bg-white/5 transition text-muted-foreground hover:text-foreground">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-2 rounded-lg hover:bg-white/5 transition text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

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
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-white/10 shadow-xl py-1" style={{ background: 'var(--card)' }}>
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

        {/* Page content */}
        <main className="flex-1 page-shell p-4 lg:p-8 max-w-[1600px] w-full mx-auto pb-4 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
