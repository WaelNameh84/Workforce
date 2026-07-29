import { useState, useEffect } from 'react';
import { useRegister } from '@workspace/api-client-react';
import { useAuth, type ExtendedAuthUser } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useLocation } from 'wouter';
import { Globe, Moon, Sun, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

// Ping the server as soon as the page loads so Render wakes up before the
// user finishes filling the form (free-tier services sleep after 15 min).
function useServerWarmup() {
  const [ready, setReady] = useState(false);
  const [warming, setWarming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await fetch('/api/healthz', { method: 'GET' });
        if (!cancelled && res.ok) { setReady(true); setWarming(false); }
      } catch {
        // Server still sleeping — retry once after 5 s
        if (!cancelled) {
          setTimeout(async () => {
            try {
              const res = await fetch('/api/healthz', { method: 'GET' });
              if (!cancelled && res.ok) { setReady(true); setWarming(false); }
            } catch { if (!cancelled) setReady(true); } // allow submit even if ping keeps failing
          }, 5000);
        }
      }
    };

    // Short delay lets the page paint first
    const t = setTimeout(() => { setWarming(true); ping(); }, 300);
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // If the server hasn't responded to the warmup ping yet, wait briefly
    if (!ready) {
      try {
        await fetch('/api/healthz');
      } catch { /* proceed anyway */ }
    }
    
    try {
      const result = await registerMutation.mutateAsync({ 
        data: { email, password, fullName, company } 
      });
      if (result.token && result.user) {
        login(result.user as ExtendedAuthUser, result.token);
        setLocation('/dashboard');
      }
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to register';
      // If still a network error, give a friendlier hint
      setError(msg === 'Load failed' || msg === 'Failed to fetch'
        ? 'Server is starting up, please try again in a moment.'
        : msg);
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('fullName')}</Label>
                  <Input 
                    id="fullName" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{t('company')}</Label>
                  <Input 
                    id="company" 
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={registerMutation.isPending || warming}>
                  {registerMutation.isPending ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t('register')}...</span>
                  ) : warming ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</span>
                  ) : t('register')}
                </Button>
              </form>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                {t('hasAccount')}{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  {t('login')}
                </Link>
              </div>
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