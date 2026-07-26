import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Activity } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';

export default function Security() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [mfa, setMfa] = useState(true);
  const [complex, setComplex] = useState(true);
  const [timeout, setTimeoutValue] = useState('60');
  const updateTimeout = () => toast({ title: t('savedSuccessfully'), description: `${t('sessionTimeout')}: ${timeout} minutes` });
  return <div className="space-y-6 max-w-5xl mx-auto"><div><h1 className="text-2xl font-bold tracking-tight">{t('security')}</h1><p className="text-muted-foreground">{t('manageSecurityDesc')}</p></div><div className="grid gap-6"><Card className="border-border/50"><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> {t('globalSecurityPolicies')}</CardTitle></CardHeader><CardContent className="space-y-6"><div className="flex items-center justify-between"><div><Label className="text-base">{t('enforceMFA')}</Label><p className="text-sm text-muted-foreground">{t('enforceMFADesc')}</p></div><Switch checked={mfa} onCheckedChange={(value) => { setMfa(value); toast({ title: value ? 'Enabled' : 'Disabled' }); }} /></div><div className="flex items-center justify-between"><div><Label className="text-base">{t('complexPasswords')}</Label><p className="text-sm text-muted-foreground">{t('complexPasswordsDesc')}</p></div><Switch checked={complex} onCheckedChange={(value) => { setComplex(value); toast({ title: value ? 'Enabled' : 'Disabled' }); }} /></div><div className="grid gap-2"><Label>{t('sessionTimeout')}</Label><div className="flex gap-2 max-w-xs"><Input type="number" min="5" value={timeout} onChange={(event) => setTimeoutValue(event.target.value)} /><Button variant="outline" onClick={updateTimeout}>{t('update')}</Button></div></div></CardContent></Card><Card className="border-border/50"><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> {t('auditLog')}</CardTitle><CardDescription>{t('recentSecurityEvents')}</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-muted/50"><TableHead>{t('event')}</TableHead><TableHead>{t('users')}</TableHead><TableHead>{t('ipAddress')}</TableHead><TableHead>{t('dateTime')}</TableHead></TableRow></TableHeader><TableBody>{[['successfulLogin', 'admin@company.com', '192.168.1.100', t('justNow')], ['settingsUpdated', 'admin@company.com', '192.168.1.100', `2 ${t('hoursAgo')}`], ['failedLogin', 'unknown', '45.22.10.1', 'Yesterday, 14:22']].map(([event, email, ip, date]) => <TableRow key={event}><TableCell className="font-medium">{t(event as any)}</TableCell><TableCell>{email}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{ip}</TableCell><TableCell>{date}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div></div>;
}