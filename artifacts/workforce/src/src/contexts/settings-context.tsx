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

  // Security / Session
  sessionTimeout: string;   // minutes; '0' = never
  maxLoginAttempts: string; // '3' | '5' | '10'
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

  // Security / Session
  sessionTimeout: '30',
  maxLoginAttempts: '5',
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

/**
 * Per-session timestamp of the last time `save()` was called locally.
 * Uses sessionStorage (not localStorage) so the grace period is isolated
 * to this browser tab/session and does NOT bleed into the PWA session or
 * vice-versa (iOS keeps PWA and Safari storage partitions separate).
 */
const LAST_SAVE_KEY = 'workforce-settings-saved-at';

function getLastLocalSaveTime(): number {
  try { return Number(sessionStorage.getItem(LAST_SAVE_KEY) ?? '0'); } catch { return 0; }
}
function setLastLocalSaveTime(): void {
  try { sessionStorage.setItem(LAST_SAVE_KEY, String(Date.now())); } catch { /* ignore */ }
}

/** How long (ms) to protect local settings from server overwrites after a local save */
const LOCAL_SAVE_GRACE_MS = 30_000; // 30 seconds

/** Image field keys that should never be overwritten with empty-string server values */
const IMAGE_FIELDS: ReadonlyArray<keyof AppSettings> = [
  'logoUrl', 'iconUrl', 'splashUrl', 'assistantAvatarUrl',
];

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

function stripImagesForServer(settings: AppSettings): Partial<AppSettings> & Omit<AppSettings, 'logoUrl' | 'iconUrl' | 'splashUrl' | 'assistantAvatarUrl'> {
  // Images that exceed the limit are OMITTED entirely (not set to '') so the
  // server DB never stores an empty string that would later overwrite a good
  // local copy on another device.
  const maybeImage = (v: string): string | undefined =>
    v.startsWith('data:') && v.length > SERVER_IMAGE_LIMIT ? undefined : v;

  const result: Record<string, unknown> = { ...settings };
  for (const key of IMAGE_FIELDS) {
    const val = settings[key] as string;
    const stripped = maybeImage(val);
    if (stripped === undefined) {
      delete result[key]; // omit — don't send to server at all
    }
  }
  return result as Partial<AppSettings> & Omit<AppSettings, 'logoUrl' | 'iconUrl' | 'splashUrl' | 'assistantAvatarUrl'>;
}

async function pushServerSettings(settings: AppSettings): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    // Large base64 images are omitted (not sent as empty strings) so the
    // server DB never stores a blank value that would overwrite a good copy.
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

  // Helper: apply server settings into state + localStorage.
  // Skips the merge if the user saved locally within the grace period to avoid
  // overwriting a fresh local save with stale server settings (race condition).
  const applyServerSettings = useCallback((serverSettings: Partial<AppSettings>, force = false) => {
    if (!force && Date.now() - getLastLocalSaveTime() < LOCAL_SAVE_GRACE_MS) {
      // Local save is very recent — protect it from server overwrite
      return;
    }
    setS(prev => {
      const merged = { ...prev, ...serverSettings };
      // Merge nested objects so server partial updates don't wipe local-only sub-keys
      if (serverSettings.notif)    merged.notif    = { ...prev.notif,    ...serverSettings.notif };
      if (serverSettings.apiKeys)  merged.apiKeys  = { ...prev.apiKeys,  ...serverSettings.apiKeys };
      if (serverSettings.biometric) merged.biometric = { ...prev.biometric, ...serverSettings.biometric };
      try { localStorage.setItem('workforce-settings', JSON.stringify(merged)); } catch { /* ignore */ }
      return merged;
    });
  }, []);

  // On mount: fetch server settings and merge (server wins for shared keys
  // like logoUrl and welcomeMsg so all devices stay in sync).
  // Uses a short grace window so a page-refresh right after saving doesn't
  // overwrite the just-saved local settings.
  useEffect(() => {
    fetchServerSettings().then((serverSettings) => {
      if (serverSettings) applyServerSettings(serverSettings);
      setServerSynced(true);
    }).catch(() => {
      setServerSynced(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch settings from the server every time the tab/app becomes visible
  // (covers PWA on mobile returning from background, tab switching, etc.)
  // Respects the grace period so a quick background/foreground right after
  // pressing save does not overwrite the new settings with stale server values.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        // Guard: skip if the user just saved locally (push might still be in-flight)
        if (Date.now() - getLastLocalSaveTime() < LOCAL_SAVE_GRACE_MS) return;
        fetchServerSettings().then((serverSettings) => {
          if (serverSettings) applyServerSettings(serverSettings);
        }).catch(() => { /* ignore */ });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [applyServerSettings]);

  // Apply CSS variables & body classes whenever settings change
  useEffect(() => {
    const root = document.documentElement;

    // Primary color
    root.style.setProperty('--primary', s.appColor);
    root.style.setProperty('--ring', s.appColor);

    // Font size
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

    // Font weight / line-height / letter-spacing
    root.style.setProperty('--app-font-weight',     s.fontWeight     === 'bold'    ? '700' : s.fontWeight     === 'medium' ? '500' : '400');
    root.style.setProperty('--app-line-height',     s.lineHeight     === 'tight'   ? '1.2' : s.lineHeight     === 'relaxed' ? '1.8' : '1.5');
    root.style.setProperty('--app-letter-spacing',  s.letterSpacing  === 'tight'   ? '-0.05em' : s.letterSpacing === 'wide' ? '0.1em' : 'normal');

    // Card background
    if (s.cardColors === 'solid-light') {
      root.style.setProperty('--card', '#f8fafc');
      root.style.setProperty('--card-foreground', '#0f172a');
    } else if (s.cardColors === 'solid-dark') {
      root.style.setProperty('--card', '#111827');
      root.style.setProperty('--card-foreground', '#f1f5f9');
    } else {
      // glass / auto — let the theme stylesheet handle it
      root.style.removeProperty('--card');
      root.style.removeProperty('--card-foreground');
    }

    // Page background pattern — injected as a <style> tag on <head>
    const STYLE_ID = 'app-bg-pattern';
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    const color = s.appColor;
    const bgPatterns: Record<string, string> = {
      gradient: `linear-gradient(135deg, ${color}55 0%, #0f172a 100%)`,
      grid:     `linear-gradient(${color}18 1px, transparent 1px), linear-gradient(90deg, ${color}18 1px, transparent 1px)`,
      dotted:   `radial-gradient(${color}55 1px, transparent 1px)`,
    };
    if (s.background !== 'default' && bgPatterns[s.background]) {
      const bgSize = s.background === 'grid' || s.background === 'dotted' ? 'background-size: 18px 18px;' : '';
      styleEl.textContent = `body { background: ${bgPatterns[s.background]} !important; ${bgSize} }`;
    } else {
      styleEl.textContent = '';
    }
  }, [s.appColor, s.fontSize, s.fontFamily, s.fontWeight, s.lineHeight, s.letterSpacing, s.cardColors, s.background]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setS(prev => {
      const next = { ...prev, ...patch };
      // Merge nested objects so partial patches don't wipe unrelated sub-keys
      if (patch.notif)     next.notif     = { ...prev.notif,     ...patch.notif };
      if (patch.apiKeys)   next.apiKeys   = { ...prev.apiKeys,   ...patch.apiKeys };
      if (patch.biometric) next.biometric = { ...prev.biometric, ...patch.biometric };
      return next;
    });
  }, []);

  const save = useCallback((next?: AppSettings) => {
    // save() is always called with an explicit value at every call site.
    // Use `next` directly so we never need to extract it from a state updater
    // (which is unreliable in React 18 concurrent mode).

    // Mark the local save time BEFORE updating state so any concurrent
    // visibility-change fetch sees the timestamp and skips the overwrite.
    setLastLocalSaveTime();

    setS(prev => {
      const value = next ?? prev;
      try {
        localStorage.setItem('workforce-settings', JSON.stringify(value));
      } catch (e) {
        console.warn('[settings] localStorage quota exceeded, retrying without images', e);
        try {
          localStorage.setItem('workforce-settings', JSON.stringify(stripImagesForServer(value)));
        } catch { /* ignore */ }
      }
      return value;
    });

    // Push to server with the explicit value — safe to call outside setS.
    // `next` is always defined at every call site; the ?? fallback is a safety net.
    if (next !== undefined) {
      void pushServerSettings(next);
    }
  }, []);

  // Can be called from outside (e.g. after login) to pull latest settings.
  // Respects the grace period: if the user just saved locally we don't want
  // a refetch triggered by login to stomp fresh settings with server ones.
  const refetchSettings = useCallback(async () => {
    if (Date.now() - getLastLocalSaveTime() < LOCAL_SAVE_GRACE_MS) return;
    const serverSettings = await fetchServerSettings();
    if (serverSettings) {
      setS(prev => {
        const merged = { ...prev, ...serverSettings };
        if (serverSettings.notif)     merged.notif     = { ...prev.notif,     ...serverSettings.notif };
        if (serverSettings.apiKeys)   merged.apiKeys   = { ...prev.apiKeys,   ...serverSettings.apiKeys };
        if (serverSettings.biometric) merged.biometric = { ...prev.biometric, ...serverSettings.biometric };
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
