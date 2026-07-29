import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Zap, Mail, Calendar, Calculator } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import DetailDialog from '@/components/detail-dialog';

export default function Automation() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedRule, setSelectedRule] = useState<(typeof rules)[number] | null>(null);

  const [rules, setRules] = useState([
    { id: 1, titleKey: 'autoApproveSick',   title: 'Auto-approve Sick Leaves', desc: 'Automatically approve sick leaves up to 2 days if balance allows.', icon: Calendar, active: true },
    { id: 2, titleKey: 'payslipDelivery',   title: 'Payslip Delivery',         desc: 'Email payslips to all active employees on the last working day.',    icon: Mail,     active: true },
    { id: 3, titleKey: 'lateArrivalAlert',  title: 'Late Arrival Alert',        desc: 'Send warning email to manager if employee is >30m late.',            icon: Zap,      active: false },
    { id: 4, titleKey: 'overtimeCalc',      title: 'Overtime Calculation',      desc: 'Automatically convert extra clocked hours into overtime requests.',   icon: Calculator,active: true },
  ]);

  const toggleRule = (id: number, newValue: boolean) => {
    setRules(current => current.map(r => r.id === id ? { ...r, active: newValue } : r));
    toast({
      title: newValue ? t('ruleEnabled') : t('ruleDisabled'),
      description: t('automationUpdated'),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('automation')}</h1>
          <p className="text-muted-foreground">{t('configureWorkflowsDesc')}</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> {t('createRule')}</Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} onClick={() => setSelectedRule(rule)} className={`border-border/50 transition-colors cursor-pointer hover:shadow-md ${rule.active ? 'border-primary/20 bg-primary/5' : ''}`}>
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${rule.active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <rule.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{rule.title}</h3>
                  <p className="text-muted-foreground text-sm">{rule.desc}</p>
                </div>
              </div>
               <div onClick={(event) => event.stopPropagation()}><Switch
                checked={rule.active}
                onCheckedChange={(checked) => toggleRule(rule.id, checked)}
               /></div>
            </CardContent>
          </Card>
        ))}
      </div>
      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}><div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--card)' }} onClick={(event) => event.stopPropagation()}><h2 className="mb-5 text-xl font-bold">{t('createRule')}</h2><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const title = String(form.get('title') || ''); const desc = String(form.get('description') || ''); setRules((current) => [...current, { id: Date.now(), titleKey: 'title', title, desc, icon: Zap, active: true }]); setShowForm(false); toast({ title: t('savedSuccessfully') }); }} className="space-y-4"><input required name="title" placeholder={t('title')} className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ background: 'var(--background)', borderColor: 'var(--border)' }} /><textarea required name="description" placeholder={t('description')} rows={4} className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ background: 'var(--background)', borderColor: 'var(--border)' }} /><div className="flex gap-3"><Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>{t('cancel')}</Button><Button type="submit" className="flex-1">{t('save')}</Button></div></form></div></div>}
      <DetailDialog open={!!selectedRule} onOpenChange={(open) => !open && setSelectedRule(null)} title={selectedRule?.title || t('automation')} items={selectedRule ? [{ label: t('description'), value: selectedRule.desc }, { label: t('status'), value: selectedRule.active ? t('active') : t('inactive') }] : []} />
    </div>
  );
}
