import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const { data: me, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const [preferences, setPreferences] = useState({
    currency: 'usd',
    timezone: 'utc',
    hours: '09:00 - 17:00',
    days: 'mon-fri'
  });

  useEffect(() => {
    const saved = localStorage.getItem('systemPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem('systemPreferences', JSON.stringify(preferences));
    toast({ title: t('savedSuccessfully') });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">{t('settings')}</h1>
        <Button onClick={savePreferences}>{t('save')}</Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={me?.fullName || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={me?.email || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={me?.role || ''} readOnly className="bg-muted capitalize" />
              </div>
              <div className="space-y-2">
                <Label>Company ID</Label>
                <Input value={me?.companyId || ''} readOnly className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{t('companyInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input defaultValue="Global Tech Inc." />
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input defaultValue="RC-123456789" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input defaultValue="123 Tech Boulevard, Innovation District" />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input defaultValue="hr@globaltech.com" />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input defaultValue="+1 (555) 123-4567" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>System Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Select value={preferences.currency} onValueChange={(v) => setPreferences(p => ({ ...p, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                    <SelectItem value="sar">SAR (ر.س)</SelectItem>
                    <SelectItem value="sek">SEK (kr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={preferences.timezone} onValueChange={(v) => setPreferences(p => ({ ...p, timezone: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                    <SelectItem value="ast">AST (Arabia Standard Time)</SelectItem>
                    <SelectItem value="cet">CET (Central European Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Standard Working Hours</Label>
                <Input value={preferences.hours} onChange={(e) => setPreferences(p => ({ ...p, hours: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Work Days</Label>
                <Select value={preferences.days} onValueChange={(v) => setPreferences(p => ({ ...p, days: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mon-fri">Mon - Fri</SelectItem>
                    <SelectItem value="sun-thu">Sun - Thu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
