import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Security() {
  const { t, translateText, formatDate } = useLanguage();
  const { toast } = useToast();
  const [mfa, setMfa] = useState(true);
  const [complex, setComplex] = useState(true);
  const [timeout, setTimeoutValue] = useState('60');
  const updateTimeout = () => toast({ title: t('savedSuccessfully'), description: `${t('sessionTimeout')}: ${timeout} ${translateText('minutes')}` });
  const events = [['successfulLogin', 'admin@company.com', '192.168.1.100', t('justNow')], ['settingsUpdated', 'admin@company.com', '192.168.1.100', `2 ${t('hoursAgo')}`], ['failedLogin', 'unknown', '45.22.10.1', translateText('Yesterday, 14:22')]];
  return <div className="space-y-6 max-w-5xl mx-auto">
    <div><h1 className="text-2xl font-bold tracking-tight">{t('security')}</h1><p className="text-muted-foreground">{t('manageSecurityDesc')}</p></div>
    <div className="grid gap-6">
      <Card className="surface border-none"><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> {t('globalSecurityPolicies')}</CardTitle></CardHeader><CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4"><div><Label className="text-base">{t('enforceMFA')}</Label><p className="text-sm text-muted-foreground">{t('enforceMFADesc')}</p></div><Switch data-testid="switch-mfa" checked={mfa} onCheckedChange={(value) => { setMfa(value); toast({ title: value ? translateText('Enabled') : translateText('Disabled') }); }} /></div>
        <div className="flex items-center justify-between gap-4"><div><Label className="text-base">{t('complexPasswords')}</Label><p className="text-sm text-muted-foreground">{t('complexPasswordsDesc')}</p></div><Switch data-testid="switch-password-complexity" checked={complex} onCheckedChange={(value) => { setComplex(value); toast({ title: value ? translateText('Enabled') : translateText('Disabled') }); }} /></div>
        <div className="grid gap-2"><Label>{t('sessionTimeout')}</Label><div className="flex gap-2 max-w-xs"><Input data-testid="input-session-timeout" type="number" min="5" value={timeout} onChange={(event) => setTimeoutValue(event.target.value)} /><Button data-testid="button-update-timeout" variant="outline" onClick={updateTimeout}>{t('update')}</Button></div></div>
      </CardContent></Card>
      <Card className="surface border-none"><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> {t('auditLog')}</CardTitle><CardDescription>{t('recentSecurityEvents')}</CardDescription></CardHeader><CardContent className="space-y-2">
        {events.map(([event, email, ip, date], index) => <div key={event} data-testid={`card-audit-event-${index}`} className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}><div className="w-9 h-9 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600"><Activity className="h-4 w-4" /></div><div className="flex-1 min-w-0"><div className="font-medium">{t(event as any)}</div><div className="text-xs text-muted-foreground truncate">{email} · {ip}</div></div><span className="text-xs text-muted-foreground whitespace-nowrap">{date}</span></div>)}
      </CardContent></Card>
    </div>
  </div>;
}