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
  clockType: 'digital' | 'analog' | 'flip';
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
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('workforce-settings');
      if (stored) return { ...DEFAULTS, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return DEFAULTS;
  });

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
    setS(prev => {
      const value = next ?? prev;
      localStorage.setItem('workforce-settings', JSON.stringify(value));
      return value;
    });
  }, []);

  return <Ctx.Provider value={{ s, update, save }}>{children}</Ctx.Provider>;
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
