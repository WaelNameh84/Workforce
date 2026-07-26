import { useState } from 'react';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useLocation } from 'wouter';
import { Globe, Moon, Sun, ShieldCheck, Users, Activity } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export default function Login() {
  const { t, locale, setLocale, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const loginMutation = useLogin();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await loginMutation.mutateAsync({ data: { email, password } });
      if (result.token && result.user) {
        login(result.user, result.token);
        setLocation('/dashboard');
      }
    } catch (err: any) {
      setError(err?.error || 'Failed to login');
    }
  };

  const toggleLanguage = () => {
    const order: typeof locale[] = ['en', 'ar', 'sv'];
    const next = order[(order.indexOf(locale) + 1) % order.length];
    setLocale(next);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background relative overflow-hidden" dir={dir}>
      {/* Dynamic Background elements for mobile */}
      <div className="absolute inset-0 z-0 lg:hidden bg-animated-gradient opacity-10" />
      <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[50%] bg-teal-500/20 blur-[120px] rounded-full z-0 lg:hidden" />
      
      {/* Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden text-white bg-animated-gradient z-10">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        
        {/* Floating Mockups */}
        <div className="absolute -right-12 top-1/4 w-80 h-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl animate-float p-6 flex flex-col justify-between" style={{ transform: 'rotate(-5deg)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
            <div><div className="text-white/70 text-sm">Active Workforce</div><div className="text-2xl font-bold font-data">1,248</div></div>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><div className="w-3/4 h-full bg-emerald-400 rounded-full" /></div>
        </div>

        <div className="absolute right-20 bottom-1/4 w-72 h-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl animate-float-delayed p-6 flex flex-col justify-between" style={{ transform: 'rotate(5deg)' }}>
           <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Activity className="w-6 h-6 text-white" /></div>
            <div><div className="text-white/70 text-sm">System Health</div><div className="text-2xl font-bold text-emerald-400">Optimal</div></div>
          </div>
          <div className="flex gap-2"><div className="h-6 w-full bg-white/20 rounded-md" /><div className="h-6 w-2/3 bg-white/20 rounded-md" /><div className="h-6 w-1/3 bg-white/20 rounded-md" /></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <ShieldCheck className="h-6 w-6 text-teal-700" />
            </div>
            <span className="text-3xl font-display font-bold tracking-tight">{t('appName')}</span>
          </div>
          
          <h1 className="text-5xl font-display font-bold leading-tight mb-6 max-w-lg">
            {t('heroTitle')}
          </h1>
          <p className="text-white/80 text-xl max-w-md leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex gap-12">
            <div>
              <div className="text-4xl font-bold font-data mb-2">99.9%</div>
              <div className="text-sm font-bold uppercase tracking-widest text-white/60">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-data mb-2">2M+</div>
              <div className="text-sm font-bold uppercase tracking-widest text-white/60">Schedules</div>
            </div>
          </div>
          <p className="text-sm text-white/50 font-medium">
            {t('trustedBy')}
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-col p-6 lg:p-12 relative z-10">
        <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
          <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:scale-105 transition-transform" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className="h-10 px-4 rounded-full bg-card border border-border flex items-center gap-2 shadow-sm font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform" onClick={toggleLanguage}>
            <Globe className="h-4 w-4" />
            {locale}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[420px] glass p-8 sm:p-10 rounded-[2rem]">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-display font-bold">{t('appName')}</span>
            </div>
            
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-display font-bold mb-3">{t('loginTitle')}</h2>
              <p className="text-muted-foreground font-medium">{t('loginSubtitle')}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold ml-1">{t('email')}</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email" 
                  autoComplete="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-xl bg-background/50 backdrop-blur-sm border-border focus:bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold ml-1">{t('password')}</Label>
                <Input 
                  id="password"
                  name="password"
                  type="password" 
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-14 rounded-xl bg-background/50 backdrop-blur-sm border-border focus:bg-background"
                />
              </div>
              
              {error && (
                <div className="p-4 text-sm font-bold text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-14 rounded-xl text-base font-bold shadow-lg shadow-primary/25 hover:-translate-y-1 transition-transform" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('login')}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground font-medium">
              {t('noAccount')}{' '}
              <Link href="/register" className="text-primary hover:underline font-bold">
                {t('register')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
