import { useState } from 'react';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useLocation } from 'wouter';
import { Globe, Moon, Sun } from 'lucide-react';
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background" dir={dir}>
      {/* Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <div className="h-4 w-4 bg-white rounded-sm" />
            </div>
            <span className="text-2xl font-bold">{t('appName')}</span>
          </div>
          
          <h1 className="text-4xl font-bold leading-tight mb-6 max-w-md">
            {t('heroTitle')}
          </h1>
          <p className="text-sidebar-foreground/70 text-lg max-w-md">
            {t('heroSubtitle')}
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">10k+</div>
              <div className="text-sm text-sidebar-foreground/70">Companies</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">2M+</div>
              <div className="text-sm text-sidebar-foreground/70">Employees Managed</div>
            </div>
          </div>
          <p className="text-sm text-sidebar-foreground/50">
            {t('trustedBy')}
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-col p-6 lg:p-12 relative">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
              <CardTitle className="text-3xl">{t('loginTitle')}</CardTitle>
              <CardDescription className="text-base">{t('loginSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email" 
                    autoComplete="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input 
                    id="password"
                    name="password"
                    type="password" 
                    autoComplete="current-password"
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

                <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? '...' : t('login')}
                </Button>
              </form>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                {t('noAccount')}{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  {t('register')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}