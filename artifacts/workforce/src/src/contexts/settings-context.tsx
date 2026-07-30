import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AppSettings {
  // General
  appName: string;
  welcomeMsg: string;
  companyName: string;
  companyAddr: string;
  companyPhone: string;
  companyEmail: string;

  // Uploaded images (base64)
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;
  logoRadius: number;
  iconUrl: string;
  splashUrl: string;
  assistantAvatarUrl: string;

  // Appearance
  appColor: string;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: string;
  iconStyle: 'rounded' | 'square' | 'circle';
  clockStyle: 'digital' | 'analog' | 'minimal';
  cardColors: string;
  buttonColor: string;
  background: string;
  fontShape: string;

  // Live Clock
  clockType: 'digital' | 'analog' | 'flip' | 'neon';
  clockColor: string;
  clockSize: 'small' | 'medium' | 'large';
  clockPos: 'header' | 'sidebar' | 'dashboard' | 'floating' | 'hidden';
  showDate: boolean;
  showSeconds: boolean;
  show12h: boolean;
  showArabicDay: boolean;
  showShiftClock: boolean;

  // Smart Assistant
  assistantOn: boolean;
  assistantName: string;
  assistantMsg: string;
  assistantPersonality: string;
  assistantLang: string;

  // API Keys
  apiKeys: Record<string, string>;
  customKeys: Array<{ name: string; value: string }>;

  // Notifications
  notif: {
    app: boolean;
    email: boolean;
    whatsapp: boolean;
    sound: boolean;
    shiftStart: boolean;
    shiftEnd: boolean;
    salary: boolean;
    leaves: boolean;
  };
  notifSoundTone: string;
  shiftStartAlarm: string;
  shiftEndAlarm: string;

  // Security / Biometric
  biometric: {
    faceId: boolean;
    fingerprint: boolean;
    pin: boolean;
  };

  // Attendance
  workStart: string;
  workEnd: string;
  breakMin: string;
  weekStart: string;
  lateGrace: string;
  otThreshold: string;
  workDays: string;
  deductRate: string;
  // Payroll rate multipliers (manager-configurable)
  otMultiplier: string;
  otWeekendMultiplier: string;
  nightDifferential: string;
  lateDeductMultiplier: string;
  weekendDays: string; // comma-separated day numbers e.g. "5,6"
  nightStartHour: string;
  nightEndHour: string;
  annualLeave: string;
  holidays: string[];
  leavePolicy: string;

  // Language
  language: 'ar' | 'en' | 'sv';
  calendarType: 'gregorian' | 'hijri' | 'both';
  currencyCode: string;
  timezone: string;
  dateFormat: string;
  numberFormat: 'western' | 'arabic';

  // Location / Geofence
  locationMode: 'gps' | 'manual' | 'both';
  locationRadius: string;
  locationLat: string;
  locationLng: string;
  locationAddress: string;
  locationProvider: string;
  requireLocationOnClock: boolean;
  showMapOnAttendance: boolean;

  // Splash / Welcome Screen
  splashTheme: 'cosmic' | 'aurora' | 'neon' | 'crystal' | 'fire' | 'ocean' | 'rings' | 'glass' | 'premium' | 'holo' | 'particles' | 'space' | 'golden' | 'smoke';
  splashDuration: string;
  splashEffect: 'fade' | 'slide' | 'zoom' | 'none';
  splashShowLogo: boolean;
  splashShowName: boolean;
  splashShowProgress: boolean;
  splashBgColor: string;

  // Dashboard / Home layout
  dashboardLayout: 'default' | 'compact' | 'detailed';
  dashboardWidgets: string[];
  dashboardGreeting: boolean;
  dashboardClock: boolean;
  dashboardQuickActions: boolean;

  // Font extras
  fontWeight: 'normal' | 'medium' | 'bold';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  letterSpacing: 'tight' | 'normal' | 'wide';

  // Login page design
  loginCardStyle: 'glass' | 'solid' | 'gradient' | 'minimal' | 'neon';
  loginCardGradientFrom: string;
  loginCardGradientTo: string;
  loginCardRadius: number;
  loginBgType: 'default' | 'gradient' | 'mesh' | 'grid' | 'solid';
  loginBgColor: string;
  loginAccentColor: string;
  loginShowLogo: boolean;
  loginShowClock: boolean;
  loginShowStats: boolean;
  loginPanelGradientFrom: string;
  loginPanelGradientTo: string;

  // Auto-backup
  autoBackup: boolean;
  autoBackupInterval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  autoBackupTime: string;
}

export const DEFAULTS: AppSettings = {
  appName: 'WorkforceOS',
  welcomeMsg: 'أهلاً وسهلاً في نظام إدارة القوى العاملة',
  companyName: '',
  companyAddr: '',
  companyPhone: '',
  companyEmail: '',

  logoUrl: '',
  logoWidth: 112,
  logoHeight: 112,
  logoRadius: 24,
  iconUrl: '',
  splashUrl: '',
  assistantAvatarUrl: '',

  appColor: '#6366f1',
  fontSize: 'medium',
  fontFamily: 'system',
  iconStyle: 'rounded',
  clockStyle: 'digital',
  cardColors: 'auto',
  buttonColor: 'auto',
  background: 'default',
  fontShape: 'normal',

  clockType: 'digital',
  clockColor: '#6366f1',
  clockSize: 'medium',
  clockPos: 'header',
  showDate: true,
  showSeconds: true,
  show12h: false,
  showArabicDay: true,
  showShiftClock: true,

  assistantOn: true,
  assistantName: 'WorkBot',
  assistantMsg: 'مرحباً! كيف يمكنني مساعدتك؟',
  assistantPersonality: 'professional',
  assistantLang: 'ar',

  apiKeys: {
    openai: '', gemini: '', claude: '',
    firebase: '', maps: '', smtp: '', whatsapp: '',
  },
  customKeys: [{ name: '', value: '' }, { name: '', value: '' }, { name: '', value: '' }],

  notif: {
    app: true, email: true, whatsapp: false,
    sound: true, shiftStart: true, shiftEnd: true, salary: true, leaves: true,
  },
  notifSoundTone: 'default',
  shiftStartAlarm: '08:45',
  shiftEndAlarm: '17:00',

  biometric: {
    faceId: false,
    fingerprint: false,
    pin: true,
  },

  workStart: '09:00',
  workEnd: '17:00',
  breakMin: '60',
  weekStart: 'sunday',
  lateGrace: '15',
  otThreshold: '60',
  workDays: '22',
  deductRate: 'hour',
  otMultiplier: '1.5',
  otWeekendMultiplier: '2.0',
  nightDifferential: '0.25',
  lateDeductMultiplier: '1.0',
  weekendDays: '5,6',
  nightStartHour: '22',
  nightEndHour: '6',
  annualLeave: '21',
  holidays: ['الجمعة', 'السبت'],
  leavePolicy: 'carryover',

  language: 'ar',
  calendarType: 'gregorian',
  currencyCode: 'SEK',
  timezone: 'Asia/Riyadh',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'western',

  locationMode: 'gps',
  locationRadius: '200',
  locationLat: '',
  locationLng: '',
  locationAddress: '',
  locationProvider: 'google',
  requireLocationOnClock: true,
  showMapOnAttendance: true,

  splashTheme: 'cosmic',
  splashDuration: '2500',
  splashEffect: 'fade',
  splashShowLogo: true,
  splashShowName: true,
  splashShowProgress: true,
  splashBgColor: '#0f172a',

  dashboardLayout: 'default',
  dashboardWidgets: ['stats', 'clock', 'attendance', 'leaves', 'payroll', 'activity'],
  dashboardGreeting: true,
  dashboardClock: true,
  dashboardQuickActions: true,

  fontWeight: 'normal',
  lineHeight: 'normal',
  letterSpacing: 'normal',

  // Login page design
  loginCardStyle: 'glass',
  loginCardGradientFrom: '#6366f1',
  loginCardGradientTo: '#8b5cf6',
  loginCardRadius: 32,
  loginBgType: 'default',
  loginBgColor: '#0f172a',
  loginAccentColor: '#6366f1',
  loginShowLogo: true,
  loginShowClock: true,
  loginShowStats: true,
  loginPanelGradientFrom: '#6366f1',
  loginPanelGradientTo: '#8b5cf6',

  // Auto-backup
  autoBackup: false,
  autoBackupInterval: 'daily',
  autoBackupTime: '08:00',
};

// ─── Helper: parse hex → rgb string ──────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return `${r} ${g} ${b}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface SettingsCtx {
  s: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
  save: (next?: AppSettings) => void;
  /** True once the initial server-settings fetch has resolved (success or fail) */
  serverSynced: boolean;
  /** Re-fetch settings from the server (call after login so token is available) */
  refetchSettings: () => Promise<void>;
}

const Ctx = createContext<SettingsCtx | null>(null);

// ─── Server sync helpers ──────────────────────────────────────────────────────

/** Fetch public display settings (no auth needed — logo, appName, welcomeMsg, splash config) */
async function fetchPublicSettings(): Promise<Partial<AppSettings> | null> {
  try {
    const res = await fetch('/api/settings/public');
    if (!res.ok) return null;
    const data = await res.json() as { settings: Partial<AppSettings> | null };
    return data.settings ?? null;
  } catch {
    return null;
  }
}

/** Fetch full settings when the user is authenticated */
async function fetchAuthSettings(): Promise<Partial<AppSettings> | null> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const res = await fetch('/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { settings: Partial<AppSettings> | null };
    return data.settings ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch settings from server:
 * - If a token exists, use the authenticated endpoint (full settings)
 * - Otherwise use the public endpoint (display fields only, no auth)
 * The public endpoint ensures the splash screen always shows the latest
 * logo and welcome message even before the user logs in.
 */
async function fetchServerSettings(): Promise<Partial<AppSettings> | null> {
  const token = localStorage.getItem('token');
  if (token) {
    const full = await fetchAuthSettings();
    if (full) return full;
  }
  // Fall back to public endpoint (works without token)
  return fetchPublicSettings();
}

/** Max base64 length we'll send to the server (~200 KB decoded ≈ ~267 KB base64) */
const SERVER_IMAGE_LIMIT = 270_000;

function stripImagesForServer(settings: AppSettings): AppSettings {
  const strip = (v: string | undefined) =>
    v?.startsWith('data:') && v.length > SERVER_IMAGE_LIMIT ? '' : v;
  return {
    ...settings,
    logoUrl:            strip(settings.logoUrl)            ?? settings.logoUrl,
    iconUrl:            strip(settings.iconUrl)            ?? settings.iconUrl,
    splashUrl:          strip(settings.splashUrl)          ?? settings.splashUrl,
    assistantAvatarUrl: strip(settings.assistantAvatarUrl) ?? settings.assistantAvatarUrl,
  };
}

async function pushServerSettings(settings: AppSettings): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    // Strip large base64 images so the payload stays well under 10 MB
    const payload = stripImagesForServer(settings);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings: payload }),
    });
    if (!res.ok) {
      console.warn('[settings] server push failed', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.warn('[settings] server push error', err);
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('workforce-settings');
      if (stored) return { ...DEFAULTS, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return DEFAULTS;
  });

  // True once the initial server fetch has resolved (success or fail).
  // Used by SplashScreen so it always shows the latest server settings.
  const [serverSynced, setServerSynced] = useState(false);

  // On mount: fetch server settings and merge (server wins for shared keys
  // like logoUrl and welcomeMsg so all devices stay in sync)
  useEffect(() => {
    fetchServerSettings().then((serverSettings) => {
      if (serverSettings) {
        setS(prev => {
          const merged = { ...prev, ...serverSettings };
          try {
            localStorage.setItem('workforce-settings', JSON.stringify(merged));
          } catch { /* ignore */ }
          return merged;
        });
      }
      // Mark synced regardless — even if fetch failed, we have the best data we can get
      setServerSynced(true);
    }).catch(() => {
      setServerSynced(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply CSS variables & body classes whenever settings change
  useEffect(() => {
    const root = document.documentElement;

    // Primary color
    root.style.setProperty('--primary', s.appColor);
    root.style.setProperty('--ring', s.appColor);

    // Font size class
    root.classList.remove('text-sm-setting', 'text-base-setting', 'text-lg-setting');
    if (s.fontSize === 'small')  root.style.fontSize = '14px';
    if (s.fontSize === 'medium') root.style.fontSize = '16px';
    if (s.fontSize === 'large')  root.style.fontSize = '18px';

    // Font family
    const fontMap: Record<string, string> = {
      system:   'Almarai, sans-serif',
      inter:    'Inter, sans-serif',
      cairo:    'Cairo, sans-serif',
      tajawal:  'Tajawal, sans-serif',
      poppins:  'Poppins, sans-serif',
      mono:     'Space Mono, monospace',
    };
    if (s.fontFamily !== 'system' && fontMap[s.fontFamily]) {
      root.style.setProperty('--font-sans', fontMap[s.fontFamily]);
    }
  }, [s.appColor, s.fontSize, s.fontFamily]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setS(prev => {
      const next = { ...prev, ...patch };
      // Merge nested objects
      if (patch.notif) next.notif = { ...prev.notif, ...patch.notif };
      if (patch.apiKeys) next.apiKeys = { ...prev.apiKeys, ...patch.apiKeys };
      return next;
    });
  }, []);

  const save = useCallback((next?: AppSettings) => {
    // Capture the final value synchronously so we can push it to the server
    // outside the state updater (side effects must not live inside setS).
    let finalValue: AppSettings | null = null;

    setS(prev => {
      const value = next ?? prev;
      finalValue = value;
      try {
        localStorage.setItem('workforce-settings', JSON.stringify(value));
      } catch (e) {
        // localStorage quota exceeded — strip large base64 images and retry
        console.warn('[settings] localStorage quota exceeded, retrying without images', e);
        try {
          const slim = stripImagesForServer(value);
          localStorage.setItem('workforce-settings', JSON.stringify(slim));
        } catch {
          // still failing — ignore; settings are still live in memory until next reload
        }
      }
      return value;
    });

    // Push to server OUTSIDE the state updater so React batching can't
    // invoke this side-effect more than once per save call.
    if (finalValue) void pushServerSettings(finalValue);
  }, []);

  // Can be called from outside (e.g. after login) to pull latest settings
  const refetchSettings = useCallback(async () => {
    const serverSettings = await fetchServerSettings();
    if (serverSettings) {
      setS(prev => {
        const merged = { ...prev, ...serverSettings };
        try {
          localStorage.setItem('workforce-settings', JSON.stringify(merged));
        } catch { /* ignore */ }
        return merged;
      });
    }
  }, []);

  return <Ctx.Provider value={{ s, update, save, serverSynced, refetchSettings }}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
}

// ─── Convenience hook for read-only consumers ─────────────────────────────────
export function useAppSettings() {
  return useSettings().s;
}
