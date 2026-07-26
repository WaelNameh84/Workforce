import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Mail, MessageSquare, Video, LayoutGrid } from 'lucide-react';

export default function Integrations() {
  const { t } = useLanguage();

  const integrations = [
    {
      name: 'Google Workspace',
      description: 'Sync users, single sign-on (SSO), and calendar events.',
      icon: Mail,
      color: 'text-red-500',
      status: 'connected'
    },
    {
      name: 'Slack',
      description: 'Receive notifications and approve requests directly in Slack.',
      icon: MessageSquare,
      color: 'text-purple-500',
      status: 'available'
    },
    {
      name: 'Microsoft Teams',
      description: 'Teams integration for HR announcements and approvals.',
      icon: LayoutGrid,
      color: 'text-blue-500',
      status: 'available'
    },
    {
      name: 'Zoom',
      description: 'Auto-generate meeting links for interviews and 1-on-1s.',
      icon: Video,
      color: 'text-blue-400',
      status: 'available'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('integrations')}</h1>
        <p className="text-muted-foreground">Connect WorkforceOS with your favorite tools.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration, i) => (
          <Card key={i} className="border-border/50 flex flex-col h-full">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <div className={`p-3 rounded-xl bg-muted/50 ${integration.color}`}>
                  <integration.icon className="h-8 w-8" />
                </div>
                {integration.status === 'connected' && (
                  <Badge variant="success">Connected</Badge>
                )}
              </div>
              <CardTitle>{integration.name}</CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-4">
              <Button 
                variant={integration.status === 'connected' ? 'outline' : 'default'} 
                className="w-full gap-2"
              >
                <Link2 className="h-4 w-4" /> 
                {integration.status === 'connected' ? 'Manage' : 'Connect'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}