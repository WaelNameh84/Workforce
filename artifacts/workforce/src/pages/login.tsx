import { useState, useEffect, useRef } from 'react';
import { useLogin } from '@workspace/api-client-react';
import { useAuth, type ExtendedAuthUser } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useLocation } from 'wouter';
import { Globe, Moon, Sun, ShieldCheck, Users, Activity, Fingerprint, Eye, EyeOff, UserPlus, ImagePlus } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

const BIOMETRIC_KEY = 'biometric_saved_email';

// ── Read settings from localStorage (login page has no SettingsProvider) ──────
function useLoginSettings() {
  const [cfg, setCfg] = useState(() => {
    try {
      const raw = localStorage.getItem('workforce-settings');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const saveLogoUrl = (dataUrl: string) => {
    try {
      const raw = localStorage.getItem('workforce-settings');
      const parsed = raw ? JSON.parse(raw) : {};
      const next = { ...parsed, logoUrl: dataUrl };
      localStorage.setItem('workforce-settings', JSON.stringify(next));
      setCfg(next);
    } catch { /* ignore */ }
  };

  return {
    logoUrl:    (cfg.logoUrl    || '') as string,
    logoWidth:  Number(cfg.logoWidth  || 112),
    logoHeight: Number(cfg.logoHeight || 112),
    logoRadius: Number(cfg.logoRadius ?? 24),
    appName:    (cfg.appName    || 'WorkforceOS') as string,
    clockColor: (cfg.clockColor || '#6366f1') as string,
    show12h:    Boolean(cfg.show12h),
    showSec:    cfg.showSeconds !== false,
    showDate:   cfg.showDate    !== false,
    clockSize:  (cfg.clockSize  || 'medium') as 'small' | 'medium' | 'large',
    saveLogoUrl,
  };
}

// ── Digital-only clock for login page ─────────────────────────────────────────
function LoginDigitalClock({ now, locale, color, show12h, showSec, showDate }: {
  now: Date; locale: string; color: string; show12h: boolean; showSec: boolean; showDate: boolean;
}) {
  const intl = locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US';
  const timeStr = now.toLocaleTimeString(intl, {
    hour: '2-digit', minute: '2-digit',
    second: showSec ? '2-digit' : undefined,
    hour12: show12h,
  });
  const dateStr = now.toLocaleDateString(intl, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="text-center leading-none">
      <div
        className="font-mono text-3xl font-black tracking-widest"
        style={{ color, fontVariantNumeric: 'tabular-nums' }}
      >
        {timeStr}
      </div>
      {showDate && (
        <div className="text-sm font-semibold text-muted-foreground mt-1">{dateStr}</div>
      )}
    </div>
  );
}

export default function Login() {
  const { t, locale, setLocale, dir } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const loginMutation = useLogin();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [error, setError]               = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading]     = useState(false);
  const [biometricSaved, setBiometricSaved]         = useState(false);

  // Live clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Settings from localStorage
  const settings = useLoginSettings();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => settings.saveLogoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Load remembered email on mount
  useEffect(() => {
    const saved = localStorage.getItem('remembered_email');
    if (saved) { setEmail(saved); setRememberMe(true); }
    const savedBiometric = localStorage.getItem(BIOMETRIC_KEY);
    if (savedBiometric) setBiometricSaved(true);
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(ok => setBiometricAvailable(ok)).catch(() => {});
    }
  }, []);

  const doLogin = async (emailVal: string, passwordVal: string) => {
    const result = await loginMutation.mutateAsync({ data: { email: emailVal, password: passwordVal } });
    if (result.token && result.user) {
      if (rememberMe) localStorage.setItem('remembered_email', emailVal);
      else localStorage.removeItem('remembered_email');
      login(result.user as ExtendedAuthUser, result.token);
      setLocation('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await doLogin(email, password);
      if (biometricAvailable && !biometricSaved) await registerBiometric(email);
    } catch (err: any) {
      setError(err?.error || err?.message || 'فشل تسجيل الدخول');
    }
  };

  const registerBiometric = async (userEmail: string) => {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'WorkforceOS', id: window.location.hostname },
          user: { id: new TextEncoder().encode(userEmail), name: userEmail, displayName: userEmail },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
        },
      });
      if (credential) { localStorage.setItem(BIOMETRIC_KEY, userEmail); setBiometricSaved(true); }
    } catch { /* silent */ }
  };

  const handleBiometric = async () => {
    const savedEmail = localStorage.getItem(BIOMETRIC_KEY);
    if (!savedEmail) return;
    setBiometricLoading(true);
    setError('');
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const assertion = await navigator.credentials.get({
        publicKey: { challenge, rpId: window.location.hostname, userVerification: 'required', timeout: 60000 },
      });
      if (assertion) {
        setEmail(savedEmail);
        const savedToken = localStorage.getItem('token');
        const savedUser  = localStorage.getItem('user');
        if (savedToken && savedUser) {
          try { login(JSON.parse(savedUser) as ExtendedAuthUser, savedToken); setLocation('/dashboard'); return; } catch { /* fall */ }
        }
        setTimeout(() => document.getElementById('password')?.focus(), 100);
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') setError('فشل التحقق بالبصمة');
    } finally {
      setBiometricLoading(false);
    }
  };

  const toggleLanguage = () => {
    const order: typeof locale[] = ['en', 'ar', 'sv'];
    setLocale(order[(order.indexOf(locale) + 1) % order.length]);
  };

  // Large logo for header — size driven by settings
  const logoStyle: React.CSSProperties = {
    width:        `${settings.logoWidth}px`,
    height:       `${settings.logoHeight}px`,
    borderRadius: `${settings.logoRadius}px`,
    maxWidth:     '80vw',
  };

  const BigLogoArea = () => (
    <>
      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      <button
        type="button"
        onClick={() => logoInputRef.current?.click()}
        title="اضغط لرفع الشعار"
        className="relative group shrink-0"
      >
        {settings.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt={settings.appName}
            style={logoStyle}
            className="object-contain border border-white/10 bg-white/5 p-2 shadow-2xl group-hover:opacity-75 transition-opacity"
          />
        ) : (
          <div
            style={logoStyle}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center gap-1 shadow-2xl group-hover:opacity-80 transition-opacity"
          >
            <ImagePlus className="h-9 w-9 text-white/70" />
            <span className="text-[11px] font-black text-white/60 leading-none">شعار</span>
          </div>
        )}
        {settings.logoUrl && (
          <span
            style={logoStyle}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            <ImagePlus className="h-6 w-6 text-white" />
          </span>
        )}
      </button>
    </>
  );

  // Small logo used in desktop panel
  const SmallLogo = () => settings.logoUrl ? (
    <img src={settings.logoUrl} alt="logo" className="h-12 w-12 rounded-xl object-contain bg-white/10 p-1 shadow-lg" />
  ) : (
    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
      <ShieldCheck className="h-6 w-6 text-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background relative overflow-hidden" dir={dir}>
      <div className="absolute inset-0 z-0 lg:hidden bg-animated-gradient opacity-10" />
      <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full z-0 lg:hidden" />

      {/* ── Desktop Brand Panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden text-white bg-animated-gradient z-10">
        <div className="absolute inset-0 bg-black/10" />
        {/* Floating stat cards */}
        <div className="absolute -right-12 top-1/4 w-80 h-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl animate-float p-6 flex flex-col justify-between" style={{ transform: 'rotate(-5deg)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
            <div><div className="text-white/70 text-sm">Active Workforce</div><div className="text-2xl font-bold font-data">1,248</div></div>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><div className="w-3/4 h-full bg-purple-500 rounded-full" /></div>
        </div>
        <div className="absolute right-20 bottom-1/4 w-72 h-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl animate-float-delayed p-6 flex flex-col justify-between" style={{ transform: 'rotate(5deg)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Activity className="w-6 h-6 text-white" /></div>
            <div><div className="text-white/70 text-sm">System Health</div><div className="text-2xl font-bold text-purple-400">Optimal</div></div>
          </div>
          <div className="flex gap-2"><div className="h-6 w-full bg-white/20 rounded-md" /><div className="h-6 w-2/3 bg-white/20 rounded-md" /><div className="h-6 w-1/3 bg-white/20 rounded-md" /></div>
        </div>

        {/* Top: logo + name */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <SmallLogo />
            <span className="text-3xl font-display font-bold tracking-tight">{settings.appName}</span>
          </div>
          <h1 className="text-5xl font-display font-bold leading-tight mb-6 max-w-lg">{t('heroTitle')}</h1>
          <p className="text-white/80 text-xl max-w-md leading-relaxed">{t('heroSubtitle')}</p>
        </div>

        {/* Bottom: stats */}
        <div className="relative z-10 space-y-8">
          <div className="flex gap-12">
            <div><div className="text-4xl font-bold font-data mb-2">99.9%</div><div className="text-sm font-bold uppercase tracking-widest text-white/60">Uptime</div></div>
            <div><div className="text-4xl font-bold font-data mb-2">2M+</div><div className="text-sm font-bold uppercase tracking-widest text-white/60">Schedules</div></div>
          </div>
          <p className="text-sm text-white/50 font-medium">{t('trustedBy')}</p>
        </div>
      </div>

      {/* ── Form Panel ─────────────────────────────────────────────── */}
      <div className="flex flex-col p-6 lg:p-12 relative z-10">
        {/* Top-right controls */}
        <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
          <button
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            className="h-10 px-4 rounded-full bg-card border border-border flex items-center gap-2 shadow-sm font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
            onClick={toggleLanguage}
          >
            <Globe className="h-4 w-4" />{locale}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[420px] glass p-8 sm:p-10 rounded-[2rem]">

            {/* ── Logo + Digital Clock header ── */}
            <div className="flex flex-col items-center gap-3 mb-8">
              {/* Big logo */}
              <BigLogoArea />

              {/* App name */}
              <span className="text-xl font-display font-bold">{settings.appName}</span>

              {/* Digital clock below logo */}
              <LoginDigitalClock
                now={now}
                locale={locale}
                color={settings.clockColor}
                show12h={settings.show12h}
                showSec={settings.showSec}
                showDate={settings.showDate}
              />
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-2xl font-display font-bold mb-1">{t('loginTitle')}</h2>
              <p className="text-muted-foreground text-sm font-medium">{t('loginSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold ml-1">{t('email')}</Label>
                <Input
                  id="email" name="email" type="email" autoComplete="email"
                  placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required
                  className="h-14 rounded-xl bg-background/50 backdrop-blur-sm border-border focus:bg-background"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold ml-1">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="password" name="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="h-14 rounded-xl bg-background/50 backdrop-blur-sm border-border focus:bg-background pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div
                    onClick={() => setRememberMe(p => !p)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-500 border-indigo-500' : 'border-border group-hover:border-indigo-400'}`}
                  >
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">تذكرني</span>
                </label>
              </div>

              {error && (
                <div className="p-4 text-sm font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full h-14 rounded-xl text-base font-bold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-transform mt-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending
                  ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : t('login')}
              </Button>
            </form>

            {/* Biometric */}
            {biometricAvailable && (
              <div className="mt-4">
                <div className="relative flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">أو</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <button
                  type="button" onClick={handleBiometric} disabled={biometricLoading}
                  className={`w-full h-14 rounded-xl border-2 flex items-center justify-center gap-3 font-bold text-sm transition-all hover:-translate-y-0.5 ${biometricSaved ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' : 'border-border bg-card/50 text-muted-foreground hover:border-indigo-500/30 hover:text-foreground'}`}
                >
                  {biometricLoading
                    ? <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    : <Fingerprint className={`w-6 h-6 ${biometricSaved ? 'text-indigo-400' : 'text-muted-foreground'}`} />}
                  {biometricSaved ? 'الدخول بالبصمة' : 'تفعيل بصمة الهاتف'}
                </button>
                {!biometricSaved && (
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    سجّل دخولك مرة بكلمة المرور وستُحفظ البصمة تلقائياً
                  </p>
                )}
              </div>
            )}

            {/* Create account */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <Link href="/register">
                <button
                  type="button"
                  className="w-full h-12 rounded-xl border border-border/80 bg-card/50 hover:bg-card flex items-center justify-center gap-2.5 font-bold text-sm text-foreground hover:-translate-y-0.5 transition-all"
                >
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  إنشاء حساب جديد
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
