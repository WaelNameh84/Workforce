import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Reorder, motion, useDragControls } from 'framer-motion';
import PullToRefresh from '@/components/pull-to-refresh';
import { useAuth } from '@/hooks/use-auth';
import { useSwipeBack } from '@/hooks/use-swipe-back';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTheme } from '@/components/theme-provider';
import { useAppSettings } from '@/contexts/settings-context';
import { useAlarm } from '@/hooks/use-alarm';
import { ClockWidget } from '@/components/clock-widget';
import {
  LayoutDashboard, Users, Clock, CalendarDays, CalendarCheck,
  CreditCard, Inbox, FileText, Settings, Bot, MessageSquare,
  TrendingUp, ShoppingCart, Workflow, Link2, Shield, Code,
  LogOut, Menu, Bell, Search, Globe, Moon, Sun, X, ChevronDown, User, ArrowLeft, ArrowRight, Download,
  Building2, MapPin, AlertCircle, Timer, CalendarX, CheckCircle2, Zap, FolderOpen, GripVertical,
  Gift, Banknote, FileX,
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
  '/dashboard/profile': {
    icon: 'text-cyan-200 bg-cyan-950/70 border-cyan-300/40',
    border: 'border-cyan-400/30',
    badge: 'text-cyan-100 bg-cyan-950/80',
    badgeBorder: 'border-cyan-300/30',
    glow: 'shadow-cyan-400/20',
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
  '/dashboard/attendance-correction': {
    icon: 'text-amber-300 bg-amber-950/70 border-amber-400/40',
    border: 'border-amber-500/30',
    badge: 'text-amber-200 bg-amber-950/80',
    badgeBorder: 'border-amber-400/30',
    glow: 'shadow-amber-500/20',
  },
  '/dashboard/bonuses': {
    icon: 'text-green-300 bg-green-950/70 border-green-400/40',
    border: 'border-green-500/30',
    badge: 'text-green-200 bg-green-950/80',
    badgeBorder: 'border-green-400/30',
    glow: 'shadow-green-500/20',
  },
  '/dashboard/advances': {
    icon: 'text-blue-300 bg-blue-950/70 border-blue-400/40',
    border: 'border-blue-500/30',
    badge: 'text-blue-200 bg-blue-950/80',
    badgeBorder: 'border-blue-400/30',
    glow: 'shadow-blue-500/20',
  },
  '/dashboard/holidays': {
    icon: 'text-violet-300 bg-violet-950/70 border-violet-400/40',
    border: 'border-violet-500/30',
    badge: 'text-violet-200 bg-violet-950/80',
    badgeBorder: 'border-violet-400/30',
    glow: 'shadow-violet-500/20',
  },
  '/dashboard/clear-reports': {
    icon: 'text-rose-300 bg-rose-950/70 border-rose-400/40',
    border: 'border-rose-500/30',
    badge: 'text-rose-200 bg-rose-950/80',
    badgeBorder: 'border-rose-400/30',
    glow: 'shadow-rose-500/20',
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
  '/dashboard/profile': 'ACCOUNT',
  '/dashboard/departments': 'DEPTS',
  '/dashboard/locations': 'SITES',
  '/dashboard/documentation': 'DOCS',
  '/dashboard/attendance-correction': 'FIX',
  '/dashboard/bonuses': 'BONUS',
  '/dashboard/advances': 'LOAN',
  '/dashboard/holidays': 'SE 🇸🇪',
  '/dashboard/clear-reports': 'RESET',
};

// ─── Nav item drag + animation ───────────────────────────────────────────────
type NavItemType = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

function NavItemCard({
  item, active, visual, badge, onNavigate, waveDelay = 0,
}: {
  item: NavItemType;
  active: boolean;
  visual: { icon: string; border: string; badge: string; badgeBorder: string; glow: string };
  badge?: string;
  onNavigate: (href: string) => void;
  waveDelay?: number;
}) {
  const dragControls = useDragControls();
  const isDraggingRef = useRef(false);

  const badgeAnimClass =
    badge === 'LIVE' ? 'badge-live' :
    badge === 'HOT'  ? 'badge-hot'  :
    badge === 'AI'   ? 'badge-ai'   : '';

  return (
    <Reorder.Item
      value={item}
      dragControls={dragControls}
      dragListener={false}
      onDragStart={() => { isDraggingRef.current = true; }}
      onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 100); }}
      className={`nav-card group relative flex items-center rounded-2xl border text-sm font-black ${visual.border} ${visual.glow} ${active ? 'nav-card-active text-white' : 'text-slate-200'}`}
      whileDrag={{ scale: 1.04, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', zIndex: 60, opacity: 0.96 }}
      layout="position"
      transition={{ layout: { duration: 0.15, ease: 'easeOut' } }}
      style={{ listStyle: 'none', userSelect: 'none' } as React.CSSProperties}
    >
      {/* ── Wave shimmer layer ── */}
      {!active && (
        <span
          aria-hidden="true"
          className="nav-card-wave"
          style={{ animationDelay: `${waveDelay}s` } as React.CSSProperties}
        />
      )}

      {/* ── Drag handle — big touch target, overrides global CSS ── */}
      <div
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragControls.start(e);
        }}
        style={{ touchAction: 'none', cursor: 'grab' } as React.CSSProperties}
        className="flex items-center justify-center w-8 h-full min-h-[44px] text-slate-600 hover:text-slate-300 shrink-0 active:text-slate-200 transition-colors"
        aria-label="drag to reorder"
      >
        <GripVertical className="w-4 h-4 pointer-events-none" />
      </div>

      {/* ── Clickable card body ── */}
      <div
        className="flex-1 flex items-center justify-between gap-3 pr-3 py-2.5 min-w-0"
        style={{ cursor: 'pointer' }}
        onClick={() => { if (!isDraggingRef.current) onNavigate(item.href); }}
      >
        <span className="relative flex min-w-0 items-center gap-3">
          {/* Icon — always animated */}
          <span className={`nav-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-lg ${visual.icon} ${active ? 'nav-icon-active' : 'nav-icon-idle'}`}>
            <item.icon className="h-4 w-4" />
          </span>
          <span className="truncate">{item.label}</span>
        </span>

        {/* Badge */}
        {badge && (
          <span className={`relative shrink-0 rounded-lg border px-2 py-1 text-[9px] font-black tracking-wide ${visual.badge} ${visual.badgeBorder} ${badgeAnimClass}`}>
            {/* Live / Hot dot indicator */}
            {(badge === 'LIVE' || badge === 'HOT') && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${badge === 'LIVE' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${badge === 'LIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </span>
            )}
            {badge}
          </span>
        )}
      </div>
    </Reorder.Item>
  );
}

// ─── Live Clock widget ────────────────────────────────────────────────────────
function LiveClock() {
  const s = useAppSettings();
  if (s.clockPos !== 'header') return null;
  return (
    <div className="hidden sm:flex items-center justify-center px-2 py-1 rounded-xl border border-border bg-white/5 overflow-hidden">
      <ClockWidget />
    </div>
  );
}

// ─── Floating AI assistant button ────────────────────────────────────────────
function FloatingAIButton() {
  const s = useAppSettings();
  const [location, setLocation] = useLocation();
  const { locale } = useLanguage();
  if (!s.assistantOn) return null;
  if (location === '/dashboard/ai') return null;
  return (
    <button
      onClick={() => setLocation('/dashboard/ai')}
      title={locale === 'ar' ? 'المساعد الذكي' : locale === 'sv' ? 'AI-assistent' : 'AI Assistant'}
      className="fixed z-50 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 pressable"
      style={{
        bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        insetInlineEnd: '1.25rem',
        width: 56,
        height: 56,
        background: `linear-gradient(135deg, ${s.appColor}, ${s.appColor}cc)`,
        boxShadow: `0 0 24px ${s.appColor}88, 0 8px 24px rgba(0,0,0,0.4)`,
      }}
      aria-label="AI Assistant"
    >
      <style>{`
        @keyframes ai-fab-pulse {
          0%,100%{box-shadow:0 0 24px ${s.appColor}88,0 8px 24px rgba(0,0,0,0.4)}
          50%{box-shadow:0 0 36px ${s.appColor}cc,0 8px 32px rgba(0,0,0,0.5)}
        }
        .ai-fab-btn { animation: ai-fab-pulse 3s ease-in-out infinite; }
        @keyframes ai-fab-ring {
          0%{transform:scale(1);opacity:0.6}
          100%{transform:scale(1.8);opacity:0}
        }
        .ai-fab-ring {
          position:absolute;inset:0;border-radius:50%;
          border:2px solid currentColor;
          animation:ai-fab-ring 2s ease-out infinite;
        }
      `}</style>
      <span className="ai-fab-ring" style={{ color: s.appColor }} />
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17l-4 4-4-4v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const s = useAppSettings();
  const { user, isLoading, logout } = useAuth();
  useAlarm(); // activate shift alarms globally
  const [location, setLocation] = useLocation();
  const { t, locale, setLocale, dir } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const { canInstall, install } = useInstallPrompt();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
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
  const nAtt: any[] = (nAttData as any)?.attendance || [];
  const nReqs: any[] = (nReqData as any)?.requests || [];
  const nLeaves: any[] = nLeaveData?.leaves || [];
  const totalNotifs = nAtt.filter((item: any) => item.isLate).length
    + nReqs.filter((item: any) => item.status === 'pending').length
    + nLeaves.filter((item: any) => item.status === 'pending').length;

  const isEmployee = user?.role === 'employee';
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const goBack = useCallback(() => {
    // Never delegate app navigation to the browser history. A page opened
    // directly on the preview can otherwise leave the app and render blank.
    if (location !== '/dashboard') setLocation('/dashboard');
  }, [location, setLocation]);
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

  // Add a tiny native-feeling haptic response to every actionable button.
  // Browsers that do not expose Vibration API simply keep the visual press state.
  useEffect(() => {
    let lastHapticAt = 0;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest('button, [role="button"]')
        : null;
      if (!(target instanceof HTMLElement) || target.hasAttribute('disabled') || target.getAttribute('aria-disabled') === 'true') return;

      const now = performance.now();
      if (now - lastHapticAt < 45) return;
      lastHapticAt = now;
      if ('vibrate' in navigator) navigator.vibrate(8);
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onPointerDown);
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
        { href: '/dashboard/profile', label: locale === 'ar' ? 'الملف الشخصي' : locale === 'sv' ? 'Profil' : 'Profile', icon: User },
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
      id: 'dept-tools',
      title: locale === 'ar' ? 'أدوات المدير' : locale === 'sv' ? 'Chefsverktyg' : 'Manager Tools',
      items: [
        { href: '/dashboard/attendance-correction', label: locale === 'ar' ? 'تصحيح الحضور' : locale === 'sv' ? 'Närvaro­korrigering' : 'Attendance Correction', icon: Clock },
        { href: '/dashboard/bonuses',               label: locale === 'ar' ? 'المكافآت والخصومات' : locale === 'sv' ? 'Bonusar & avdrag' : 'Bonuses & Deductions', icon: Gift },
        { href: '/dashboard/advances',              label: locale === 'ar' ? 'السلف' : locale === 'sv' ? 'Förskott' : 'Advances', icon: Banknote },
        { href: '/dashboard/holidays',              label: locale === 'ar' ? 'العطل الرسمية' : locale === 'sv' ? 'Helgdagar' : 'Official Holidays', icon: CalendarDays },
        { href: '/dashboard/clear-reports',         label: locale === 'ar' ? 'مسح التقارير' : locale === 'sv' ? 'Rensa rapporter' : 'Clear Reports', icon: FileX },
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
        { href: '/dashboard/profile', label: locale === 'ar' ? 'الملف الشخصي' : locale === 'sv' ? 'Profil' : 'Profile', icon: User },
        { href: '/dashboard/settings', label: t('settings'), icon: Settings },
      ],
    },
  ];

  const navGroups = isEmployee ? employeeNavGroups : adminNavGroups;

  // ── Persistent nav order (saved to localStorage) ──────────────
  const [savedOrder, setSavedOrder] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem('nav-order') || '{}'); }
    catch { return {}; }
  });

  const orderedNavGroups = useMemo(() => navGroups.map(group => {
    const order = savedOrder[group.id];
    if (!order) return group;
    const byHref = Object.fromEntries(group.items.map(i => [i.href, i]));
    const sorted = [
      ...order.map(h => byHref[h]).filter(Boolean) as typeof group.items,
      ...group.items.filter(i => !order.includes(i.href)),
    ];
    return { ...group, items: sorted };
  }), [navGroups, savedOrder]);

  const handleReorder = useCallback((groupId: string, newItems: NavItemType[]) => {
    setSavedOrder(prev => {
      const next = { ...prev, [groupId]: newItems.map(i => i.href) };
      localStorage.setItem('nav-order', JSON.stringify(next));
      return next;
    });
  }, []);

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
      {/* Role badge */}
      <div className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleBadge.color}`}>
          {isEmployee ? <User className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
          {roleBadge.label}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto scrollbar-thin" aria-label={t('dashboardSections')}>
        {orderedNavGroups.map(group => (
          <div key={group.id} className="mb-3">
            <div className="flex items-center px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {group.title}
              </span>
            </div>
            <Reorder.Group
              as="div"
              axis="y"
              values={group.items}
              onReorder={(newItems) => handleReorder(group.id, newItems as NavItemType[])}
              className="mt-1.5 space-y-1.5"
            >
              {group.items.map((item, idx) => (
                <NavItemCard
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  visual={navVisuals[item.href] || navVisuals['/dashboard']}
                  badge={navBadges[item.href]}
                  onNavigate={(href) => setLocation(href)}
                  waveDelay={-(idx * 1.3)}
                />
              ))}
            </Reorder.Group>
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
        <header className="app-topbar sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6 py-3"
          style={{ backdropFilter: 'blur(18px)', paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-1 lg:hidden">
            {isSubpage && (
              <button
                onClick={goBack}
                aria-label={t('goBack')}
                className="topbar-icon-button flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-90"
              >
                {dir === 'rtl' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label={t('openMenu')}
              aria-expanded={sidebarOpen}
              className="topbar-icon-button flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-90"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="min-w-0 flex-1 lg:hidden">
            <p className="topbar-title truncate text-sm font-black">{currentNavItem?.label || s.appName}</p>
            <p className="topbar-subtitle truncate text-[10px]">{s.appName}</p>
          </div>

          {/* Search */}
          <div className="topbar-search flex-1 max-w-sm hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm">
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
            <button onClick={toggleLanguage} className="topbar-icon-button p-2 rounded-lg transition">
              <Globe className="w-4 h-4" />
            </button>
            <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="topbar-icon-button p-2 rounded-lg transition">
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* Bell button — panel rendered outside <header> below */}
            <button
              onClick={() => { setUserMenuOpen(false); setNotifOpen(v => !v); }}
              className="topbar-icon-button relative p-2 rounded-lg transition"
              aria-label={locale === 'ar' ? 'الإشعارات' : 'Notifications'}
            >
              <Bell className="w-4 h-4" />
              {totalNotifs > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white px-1">
                  {totalNotifs > 9 ? '9+' : totalNotifs}
                </span>
              )}
            </button>

            {/* User menu button — panel rendered outside <header> below */}
            <button
              onClick={() => { setNotifOpen(false); setUserMenuOpen(v => !v); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium">{user?.fullName?.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* ── Notification panel — OUTSIDE <header> to escape backdrop-filter stacking context ── */}
        {notifOpen && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setNotifOpen(false)} />
            <div
              className="fixed top-[3.5rem] right-2 z-[9999] w-[min(22rem,calc(100vw-1rem))] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
              style={{ background: 'var(--card)', maxHeight: '75vh' }}
              dir={dir}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/20">
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-black text-white">
                    {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
                  </span>
                  {totalNotifs > 0 && (
                    <span className="rounded-full bg-red-500/90 px-1.5 py-0.5 text-[9px] font-black text-white">
                      {totalNotifs}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 divide-y divide-white/5">
                {totalNotifs === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                      <CheckCircle2 className="h-6 w-6" />
                    </span>
                    <p className="text-sm font-black text-white">
                      {locale === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {locale === 'ar' ? 'كل شيء هادئ الآن.' : 'Everything looks good.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {nAtt.filter((item: any) => item.isLate).map((item: any, i: number) => (
                      <button key={`late-${i}`} type="button"
                        onClick={() => { setNotifOpen(false); setLocation('/dashboard/attendance'); }}
                        className="group flex w-full items-start gap-3 px-4 py-3 text-start transition hover:bg-white/[.045] active:bg-white/[.08]"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-violet-300 bg-violet-500/15 border-violet-400/20">
                          <Timer className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-extrabold text-white leading-5">
                            {item.employeeName || (locale === 'ar' ? 'موظف' : 'Employee')} — {locale === 'ar' ? 'حضور متأخر' : 'Late arrival'}
                          </span>
                          <span className="mt-0.5 block text-[10px] font-bold text-slate-500">
                            {item.clockIn ? new Date(item.clockIn).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        </span>
                      </button>
                    ))}
                    {nReqs.filter((item: any) => item.status === 'pending').map((item: any, i: number) => (
                      <button key={`req-${i}`} type="button"
                        onClick={() => { setNotifOpen(false); setLocation('/dashboard/requests'); }}
                        className="group flex w-full items-start gap-3 px-4 py-3 text-start transition hover:bg-white/[.045] active:bg-white/[.08]"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-amber-300 bg-amber-500/15 border-amber-400/20">
                          <AlertCircle className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-extrabold text-white leading-5">
                            {item.title || (locale === 'ar' ? 'طلب جديد بانتظار المراجعة' : 'New request pending review')}
                          </span>
                          <span className="mt-0.5 block text-[10px] font-bold text-slate-500">
                            {item.employeeName || '—'}
                          </span>
                        </span>
                      </button>
                    ))}
                    {nLeaves.filter((item: any) => item.status === 'pending').map((item: any, i: number) => (
                      <button key={`leave-${i}`} type="button"
                        onClick={() => { setNotifOpen(false); setLocation('/dashboard/leaves'); }}
                        className="group flex w-full items-start gap-3 px-4 py-3 text-start transition hover:bg-white/[.045] active:bg-white/[.08]"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-blue-300 bg-blue-500/15 border-blue-400/20">
                          <CalendarX className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-extrabold text-white leading-5">
                            {locale === 'ar' ? 'طلب إجازة' : 'Leave request'} — {item.employeeName || (locale === 'ar' ? 'موظف' : 'Employee')}
                          </span>
                          <span className="mt-0.5 block text-[10px] font-bold text-slate-500">
                            {item.startDate ? new Date(item.startDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                          </span>
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-white/10 p-3 bg-gradient-to-r from-rose-950/60 to-orange-950/60">
                <button
                  type="button"
                  onClick={() => { setNotifOpen(false); setLocation('/dashboard/action-center'); }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/15 border border-rose-400/25 px-4 py-2.5 text-xs font-black text-rose-300 transition hover:bg-rose-500/25 active:scale-[.98]"
                >
                  <Zap className="h-3.5 w-3.5" />
                  {locale === 'ar' ? 'فتح مركز إجراءات المدير' : 'Open Manager Action Center'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── User menu panel — OUTSIDE <header> to escape backdrop-filter stacking context ── */}
        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setUserMenuOpen(false)} />
            <div className="fixed top-[3.5rem] right-2 z-[9999] w-[min(13rem,calc(100vw-1rem))] rounded-xl border border-white/10 shadow-xl py-1" style={{ background: 'var(--card)' }}>
              <div className="px-4 py-2 border-b border-white/5">
                <div className="text-sm font-medium truncate">{user?.fullName}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                <span className={`inline-flex mt-1 items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <User className="w-4 h-4" />
                {locale === 'ar' ? 'الملف الشخصي' : locale === 'sv' ? 'Profil' : 'Profile'}
              </Link>
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

         {isOffline && <div className="sticky top-0 z-20 flex items-center justify-center gap-2 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 animate-fadeIn"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />{locale === 'ar' ? 'لا يوجد اتصال بالإنترنت — بعض البيانات قد لا تكون محدثة' : locale === 'sv' ? 'Ingen internetanslutning — vissa data kan vara inaktuella' : 'No internet connection — some data may be outdated'}</div>}

        {/* Page content — Pull-to-refresh wraps the scrollable area */}
        <PullToRefresh>
          <main className="page-shell w-full min-w-0 p-3 sm:p-4 lg:p-6 max-w-[1800px] mx-auto"
                style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
            {children}
          </main>
        </PullToRefresh>
      </div>
      {/* Floating AI assistant button */}
      <FloatingAIButton />
    </div>
  );
}
