import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { Globe, Moon, Sun, Loader2, Clock } from 'lucide-react';
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
  const { ready: _ready, warming } = useServerWarmup();

  const [pendingApproval, setPendingApproval] = useState(false);

  // Employee registration fields
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empFullName, setEmpFullName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: empEmail, password: empPassword, fullName: empFullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Show friendly message for known error codes
        if (data.error === 'Email already registered') {
          setError(locale === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل. إذا كنت قد سجلت مسبقاً حاول تسجيل الدخول.' : 'This email is already registered. If you already signed up, try logging in.');
        } else {
          setError(data.error || (locale === 'ar' ? 'فشل في التسجيل' : 'Registration failed'));
        }
        return;
      }
      // Both 201 (new registration) and 202 (already pending) show the pending screen
      setPendingApproval(true);
    } catch {
      setError(locale === 'ar' ? 'خطأ في الاتصال، حاول مرة أخرى' : 'Server error, please try again.');
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
                      {locale === 'ar' ? 'حسابك قيد المراجعة' : 'Account Pending Approval'}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {locale === 'ar'
                        ? 'تم إرسال طلبك إلى المدير. سيتم تفعيل حسابك بعد الموافقة.'
                        : 'Your request has been sent to the admin. Your account will be activated after approval.'}
                    </p>
                  </div>
                  <div className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400 font-medium">
                    {locale === 'ar' ? 'بإمكانك تسجيل الدخول بعد موافقة المدير على طلبك' : 'You can log in once the admin approves your request'}
                  </div>
                  <Link href="/login" className="text-primary hover:underline font-medium text-sm mt-2">
                    {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                  </Link>
                </div>
              ) : (
                <>
                  {/* ── Employee Registration Form ── */}
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
                    {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
                    {warming && (
                      <div className="p-3 text-sm text-muted-foreground bg-muted/30 rounded-md flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        {locale === 'ar' ? 'جاري الاتصال بالخادم...' : 'Connecting to server...'}
                      </div>
                    )}
                    <Button type="submit" className="w-full" size="lg" disabled={loading || warming}>
                      {loading
                        ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}</span>
                        : locale === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                    </Button>
                  </form>

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