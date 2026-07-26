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
        { href: '/dashboard/schedule',   label: t('schedule'),   icon: CalendarDays },
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
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin" aria-label="Dashboard sections">
        {navGroups.map(group => (
          <div key={group.id} className="mb-2">
            <button
              onClick={() => setOpenGroups(p => ({ ...p, [group.id]: !p[group.id] }))}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-300 hover:text-white transition-colors"
            >
              {group.title}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${openGroups[group.id] ? 'rotate-180' : ''}`} />
            </button>
            {openGroups[group.id] && (
              <div className="mt-1 space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'text-white'
                          : 'text-slate-200 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {active && (
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border border-indigo-500/20" />
                      )}
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full" />
                      )}
                      <item.icon className={`relative w-4 h-4 shrink-0 ${active ? 'text-indigo-300' : 'text-slate-300 group-hover:text-white'}`} />
                      <span className="relative">{item.label}</span>
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
