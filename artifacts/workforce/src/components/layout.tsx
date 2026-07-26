import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTheme } from '@/components/theme-provider';
import {
  LayoutDashboard, Users, Clock, CalendarDays, CalendarCheck,
  CreditCard, Inbox, FileText, Settings, Bot, MessageSquare,
  TrendingUp, ShoppingCart, Workflow, Link2, Shield, Code,
  LogOut, Menu, Bell, Search, Globe, Moon, Sun, X, ChevronDown
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

  const navGroups = [
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

  const isActive = (href: string) =>
    href === '/dashboard' ? location === '/dashboard' : location.startsWith(href);

  useEffect(() => {
    const activeGroup = navGroups.find((group) => group.items.some((item) => isActive(item.href)));
    if (activeGroup) {
      setOpenGroups((groups) => ({ ...groups, [activeGroup.id]: true }));
    }
  }, [location]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight" style={{ color: 'var(--sidebar-fg)' }}>{t('appName')}</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition" style={{ color: 'var(--sidebar-fg)' }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => setOpenGroups((groups) => ({ ...groups, [group.id]: !groups[group.id] }))}
              className="mb-1.5 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-start text-xs font-bold uppercase tracking-wider opacity-50 transition hover:bg-white/5"
              style={{ color: 'var(--sidebar-fg)' }}
              aria-expanded={!!openGroups[group.id]}
            >
              <span>{group.title}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openGroups[group.id] ? '' : '-rotate-90'}`} />
            </button>
            {openGroups[group.id] && <div className="space-y-1">
              {group.items.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={i}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all pressable ${
                      active
                         ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/20'
                        : 'hover:bg-white/5'
                    }`}
                    style={active ? {} : { color: 'var(--sidebar-fg)', opacity: 0.75 }}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'opacity-70'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t flex flex-col gap-4" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
           <span className="text-xs font-bold text-indigo-400">نظام بدون جداول روتينية</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: 'var(--sidebar-fg)' }}>{user.fullName}</div>
            <div className="text-xs font-medium truncate opacity-50" style={{ color: 'var(--sidebar-fg)' }}>{user.email}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)', color: 'var(--foreground)' }} dir={dir}>
      {/* Sidebar — desktop */}
      <aside
        className="hidden lg:flex flex-col w-64 fixed inset-y-0 z-30"
        style={{
          background: 'var(--sidebar-bg)',
          [dir === 'rtl' ? 'right' : 'left']: 0,
          borderRight: dir === 'ltr' ? '1px solid var(--sidebar-border)' : 'none',
          borderLeft: dir === 'rtl' ? '1px solid var(--sidebar-border)' : 'none',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar — mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          {/* Drawer */}
          <aside
            className="absolute top-0 bottom-0 w-72 flex flex-col"
            style={{
              background: 'var(--sidebar-bg)',
              [dir === 'rtl' ? 'right' : 'left']: 0,
            }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-[100dvh] min-w-0 lg:ms-64">
        {/* Topbar */}
        <header
          className="sticky top-0 z-20 h-[4.5rem] flex items-center justify-between px-3 sm:px-4 lg:px-6 backdrop-blur-xl border-b"
          style={{ background: 'color-mix(in srgb, var(--background) 85%, transparent)', borderColor: 'var(--border)' }}
        >
          {/* Left: hamburger + search */}
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
               className="lg:hidden p-2.5 rounded-xl transition pressable"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block max-w-xs w-full">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3" style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' || !searchText.trim()) return;
                  const query = searchText.trim().toLowerCase();
                  const match = navGroups
                    .flatMap((group) => group.items)
                    .find((item) => item.label.toLowerCase().includes(query));
                  if (match) {
                    setLocation(match.href);
                    setSearchText('');
                  }
                }}
                placeholder={`${t('search')}...`}
                className="w-full ps-9 pe-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          {/* Right: theme + lang + bell + user */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
               data-testid="button-toggle-theme"
               className="p-2.5 rounded-xl hover:opacity-80 transition pressable"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleLanguage}
               data-testid="button-toggle-language"
               className="px-3 py-2 rounded-xl text-xs font-bold hover:opacity-80 transition uppercase"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {locale}
            </button>

            <div className="relative hidden sm:block">
              <button
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label={t('notifications')}
                 data-testid="button-notifications"
                 className="relative p-2.5 rounded-xl hover:opacity-80 transition pressable"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <Bell className="w-4 h-4" />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full status-live" />
              </button>
              {notificationsOpen && (
                <div
                  className="absolute right-0 top-12 z-30 w-72 rounded-2xl p-4 shadow-xl"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">{t('notifications')}</span>
                    <button className="text-xs text-indigo-500" onClick={() => setNotificationsOpen(false)}>Close</button>
                  </div>
                  <button
                    onClick={() => { setNotificationsOpen(false); setLocation('/dashboard/requests'); }}
                    className="w-full rounded-xl p-3 text-left text-sm hover:bg-muted/50"
                    style={{ background: 'var(--background)' }}
                  >
                    You have pending requests to review.
                  </button>
                  <button
                    onClick={() => { setNotificationsOpen(false); setLocation('/dashboard/attendance'); }}
                    className="w-full mt-2 rounded-xl p-3 text-left text-sm hover:bg-muted/50"
                    style={{ background: 'var(--background)' }}
                  >
                    Attendance activity was updated today.
                  </button>
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:opacity-80 transition"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium">{user.fullName?.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 hidden md:block" style={{ color: 'var(--muted)' }} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div
                    className="absolute top-full mt-2 w-56 rounded-2xl shadow-xl py-1 z-20"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      [dir === 'rtl' ? 'left' : 'right']: 0,
                    }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="font-medium text-sm">{user.fullName}</div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>{user.email}</div>
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
        <main className="flex-1 page-shell p-4 lg:p-8 max-w-[1600px] w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom Nav — mobile */}
      <nav className="bottom-nav lg:hidden" style={{ flexDirection: 'row' }}>
        {[
          { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
          { href: '/dashboard/attendance', label: t('attendance'), icon: Clock },
          { href: '/dashboard/employees', label: t('employees'), icon: Users },
          { href: '/dashboard/leaves', label: t('leaves'), icon: CalendarCheck },
          { href: '/dashboard/settings', label: t('settings'), icon: Settings },
        ].map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-full h-full relative transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {active && <div className="absolute top-0 w-12 h-[3px] bg-gradient-to-r from-indigo-500 to-purple-600 rounded-b-full shadow-[0_2px_8px_rgba(124,58,237,0.5)]" />}
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
