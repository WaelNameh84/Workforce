import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Copy, Key } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Developers() {
  const { t } = useLanguage();

  const endpoints = [
    { method: 'GET', path: '/api/v1/employees', desc: 'List all employees' },
    { method: 'POST', path: '/api/v1/attendance/clock-in', desc: 'Clock in an employee via API' },
    { method: 'GET', path: '/api/v1/leaves', desc: 'Retrieve leave requests' },
    { method: 'POST', path: '/api/v1/webhooks', desc: 'Register a new webhook' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('developers')}</h1>
          <p className="text-muted-foreground">API documentation and developer tools.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Base URL: https://api.workforceos.com</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {endpoints.map((ep, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-4 mb-2 sm:mb-0">
                    <Badge variant={ep.method === 'GET' ? 'default' : 'secondary'} className="w-16 justify-center">
                      {ep.method}
                    </Badge>
                    <code className="text-sm font-bold text-primary">{ep.path}</code>
                  </div>
                  <div className="text-sm text-muted-foreground">{ep.desc}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-slate-950 text-slate-50">
            <CardHeader>
              <CardTitle className="text-slate-50">Authentication Example</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 w-full rounded-md bg-slate-900 border border-slate-800 p-4">
                <pre className="text-sm font-mono text-slate-300">
{`curl -X GET "https://api.workforceos.com/api/v1/employees" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-md bg-muted flex items-center justify-between border">
                <div className="truncate font-mono text-sm opacity-50">sk_live_123*******************</div>
                <Button size="icon" variant="ghost" className="h-8 w-8"><Copy className="h-4 w-4" /></Button>
              </div>
              <Button className="w-full" variant="outline">Generate New Key</Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>Join our developer community or read the full docs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2"><Code className="h-4 w-4" /> Full Documentation</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}