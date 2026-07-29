import { useState, useEffect } from 'react';
import { useRegister } from '@workspace/api-client-react';
import { useAuth, type ExtendedAuthUser } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useLocation, useSearch } from 'wouter';
import { Globe, Moon, Sun, Loader2, Building2, UserPlus, Clock, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

// Ping the server repeatedly until it wakes up (Render free-tier cold starts
// can take 30-60 s). Keeps retrying every 4 s for up to 90 s.
function useServerWarmup() {
  const [ready, setReady] = useState(false);
  const [warming, setWarming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 22; // ~90 s at 4 s intervals

    const ping = async () => {
      if (cancelled) return;
      attempts++;
      try {
        const res = await fetch('/api/healthz', { method: 'GET' });
        if (!cancelled && res.ok) {
          setReady(true);
          setWarming(false);
          return;
        }
      } catch { /* still sleeping */ }

      if (!cancelled && attempts < MAX_ATTEMPTS) {
        setTimeout(ping, 4000);
      } else if (!cancelled) {
        // Give up waiting — let the user try anyway
        setReady(true);
        setWarming(false);
      }
    };

    const t = setTimeout(() => { setWarming(true); ping(); }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  return { ready, warming };
}

export default function Register() {
  const { t, locale, setLocale, dir } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const registerMutation = useRegister();
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { ready, warming } = useServerWarmup();
  const search = useSearch();

  // mode: 'company' = create new company (admin), 'employee' = join existing company
  // Default to 'employee' when ?mode=employee is in the URL (e.g. from login page)
  const initialMode = new URLSearchParams(search).get('mode') === 'company' ? 'company' : 'employee';
  const [mode, setMode] = useState<'company' | 'employee'>(initialMode);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingCompanyName, setPendingCompanyName] = useState('');

  // Company owner fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');

  // Employee join fields
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empFullName, setEmpFullName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!ready) {
      for (let i = 0; i < 15; i++) {
        try { const res = await fetch('/api/healthz'); if (res.ok) break; } catch { /**/ }
        await new Promise(r => setTimeout(r, 4000));
      }
    }
    try {
      const result = await registerMutation.mutateAsync({ data: { email, password, fullName, company } });
      if (result.token && result.user) {
        login(result.user as ExtendedAuthUser, result.token);
        setLocation('/dashboard');
      }
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to register';
      setError(msg === 'Load failed' || msg === 'Failed to fetch'
        ? 'Server is starting up, please wait a moment and try again.'
        : msg);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: empEmail, password: empPassword, fullName: empFullName, joinCode: joinCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'invalid_join_code') {
          setError(locale === 'ar' ? 'رمز الانضمام غير صحيح. تحقق من الرمز مع المدير.' : 'Invalid join code. Check with your manager.');
        } else {
          setError(data.error || 'Registration failed');
        }
        return;
      }
      setPendingCompanyName(data.companyName || '');
      setPendingApproval(true);
    } catch {
      setError('Server error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const order: typeof locale[] = ['en', 'ar', 'sv'];
    const next = order[(order.indexOf(locale) + 1) % order.length];
    setLocale(next);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background" dir={dir}>
      {/* Form Panel */}
      <div className="flex flex-col p-6 lg:p-12 relative order-2 lg:order-1">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="uppercase">{locale}</span>
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <div className="lg:hidden flex items-center gap-2 mb-8">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <div className="h-4 w-4 bg-white rounded-sm" />
                </div>
                <span className="text-2xl font-bold">{t('appName')}</span>
              </div>
              <CardTitle className="text-3xl">{t('registerTitle')}</CardTitle>
              <CardDescription className="text-base">{t('registerSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="px-0">

              {/* ── Pending Approval Screen ── */}
              {pendingApproval ? (
                <div className="flex flex-col items-center text-center gap-4 py-8">
                  <div className="w-20 h-20 rounded-full bg-amber-500/15 flex items-center justify-center">
                    <Clock className="h-10 w-10 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {locale === 'ar' ? 'طلبك قيد المراجعة' : 'Request Pending Approval'}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {locale === 'ar'
                        ? `تم إرسال طلبك إلى ${pendingCompanyName || 'الشركة'}. سيتم تفعيل حسابك بعد موافقة المدير.`
                        : `Your request was sent to ${pendingCompanyName || 'the company'}. Your account will be activated after manager approval.`}
                    </p>
                  </div>
                  <div className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400 font-medium">
                    {locale === 'ar' ? 'بإمكانك تسجيل الدخول بعد موافقة المدير على طلبك' : 'You can log in once the manager approves your request'}
                  </div>
                  <Link href="/login" className="text-primary hover:underline font-medium text-sm mt-2">
                    {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                  </Link>
                </div>
              ) : (
                <>
                  {/* ── Mode Toggle ── */}
                  <div className="flex rounded-xl border border-border p-1 mb-6 bg-muted/30">
                    <button
                      type="button"
                      onClick={() => { setMode('company'); setError(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${mode === 'company' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Building2 className="h-4 w-4" />
                      {locale === 'ar' ? 'شركة جديدة' : 'New Company'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode('employee'); setError(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${mode === 'employee' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <UserPlus className="h-4 w-4" />
                      {locale === 'ar' ? 'انضمام كموظف' : 'Join as Employee'}
                    </button>
                  </div>

                  {/* ── Company Owner Form ── */}
                  {mode === 'company' && (
                    <form onSubmit={handleCompanySubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">{t('fullName')}</Label>
                        <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">{t('company')}</Label>
                        <Input id="company" value={company} onChange={e => setCompany(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">{t('password')}</Label>
                        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                      </div>
                      {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
                      <Button type="submit" className="w-full" size="lg" disabled={registerMutation.isPending || warming}>
                        {registerMutation.isPending || warming
                          ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {warming ? 'Connecting...' : `${t('register')}...`}</span>
                          : t('register')}
                      </Button>
                    </form>
                  )}

                  {/* ── Employee Join Form ── */}
                  {mode === 'employee' && (
                    <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="empFullName">{t('fullName')}</Label>
                        <Input id="empFullName" value={empFullName} onChange={e => setEmpFullName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="empEmail">{t('email')}</Label>
                        <Input id="empEmail" type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="empPassword">{t('password')}</Label>
                        <Input id="empPassword" type="password" value={empPassword} onChange={e => setEmpPassword(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="joinCode">{locale === 'ar' ? 'رمز الانضمام' : 'Join Code'}</Label>
                        <Input
                          id="joinCode"
                          value={joinCode}
                          onChange={e => setJoinCode(e.target.value.toUpperCase())}
                          placeholder={locale === 'ar' ? 'أدخل رمز الانضمام من المدير' : 'Enter the code from your manager'}
                          className="font-mono tracking-widest text-center text-lg uppercase"
                          maxLength={20}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          {locale === 'ar' ? 'اطلب رمز الانضمام من مدير شركتك' : 'Ask your company manager for the join code'}
                        </p>
                      </div>
                      {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading
                          ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}</span>
                          : locale === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                      </Button>
                    </form>
                  )}

                  <div className="mt-8 text-center text-sm text-muted-foreground">
                    {t('hasAccount')}{' '}
                    <Link href="/login" className="text-primary hover:underline font-medium">{t('login')}</Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground order-1 lg:order-2">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <div className="h-4 w-4 bg-white rounded-sm" />
            </div>
            <span className="text-2xl font-bold">{t('appName')}</span>
          </div>
          
          <h1 className="text-4xl font-bold leading-tight mb-6 max-w-md">
            {t('landingTitle')}
          </h1>
          <p className="text-sidebar-foreground/70 text-lg max-w-md">
            {t('landingDesc')}
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">✓</span>
              </div>
              <p className="text-sm font-medium">Full attendance tracking</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">✓</span>
              </div>
              <p className="text-sm font-medium">Automated payroll</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">✓</span>
              </div>
              <p className="text-sm font-medium">Global compliance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}