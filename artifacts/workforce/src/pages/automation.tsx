import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Workflow, Plus, Zap, Mail, Calendar, Calculator } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Automation() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [rules, setRules] = useState([
    {
      id: 1,
      title: 'Auto-approve Sick Leaves',
      description: 'Automatically approve sick leaves up to 2 days if balance allows.',
      icon: Calendar,
      active: true
    },
    {
      id: 2,
      title: 'Payslip Delivery',
      description: 'Email payslips to all active employees on the last working day.',
      icon: Mail,
      active: true
    },
    {
      id: 3,
      title: 'Late Arrival Alert',
      description: 'Send warning email to manager if employee is >30m late.',
      icon: Zap,
      active: false
    },
    {
      id: 4,
      title: 'Overtime Calculation',
      description: 'Automatically convert extra clocked hours into overtime requests.',
      icon: Calculator,
      active: true
    }
  ]);

  const toggleRule = (id: number, newValue: boolean) => {
    setRules(current => current.map(r => r.id === id ? { ...r, active: newValue } : r));
    toast({
      title: newValue ? 'Rule Enabled' : 'Rule Disabled',
      description: 'Automation settings updated successfully.'
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('automation')}</h1>
          <p className="text-muted-foreground">Configure system workflows and automatic actions.</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Create Rule</Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={`border-border/50 transition-colors ${rule.active ? 'border-primary/20 bg-primary/5' : ''}`}>
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${rule.active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <rule.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{rule.title}</h3>
                  <p className="text-muted-foreground text-sm">{rule.description}</p>
                </div>
              </div>
              <Switch 
                checked={rule.active} 
                onCheckedChange={(checked) => toggleRule(rule.id, checked)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
