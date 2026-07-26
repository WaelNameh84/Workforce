import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Key, Smartphone, Activity } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Security() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('security')}</h1>
        <p className="text-muted-foreground">Manage your organization's security settings and policies.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Global Security Policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enforce Two-Factor Authentication (2FA)</Label>
                <p className="text-sm text-muted-foreground">Require all users to setup 2FA to access the platform.</p>
              </div>
              <Switch checked={true} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Complex Passwords</Label>
                <p className="text-sm text-muted-foreground">Require uppercase, lowercase, numbers, and symbols.</p>
              </div>
              <Switch checked={true} />
            </div>
            <div className="grid gap-2">
              <Label>Session Timeout (Minutes)</Label>
              <div className="flex gap-2 max-w-xs">
                <Input type="number" defaultValue="60" />
                <Button variant="outline">Update</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Audit Log</CardTitle>
            <CardDescription>Recent security and administrative events.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-emerald-500">Successful Login</TableCell>
                  <TableCell>admin@company.com</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">192.168.1.100</TableCell>
                  <TableCell>Just now</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-amber-500">Settings Updated</TableCell>
                  <TableCell>admin@company.com</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">192.168.1.100</TableCell>
                  <TableCell>2 hours ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-destructive">Failed Login Attempt</TableCell>
                  <TableCell>unknown</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">45.22.10.1</TableCell>
                  <TableCell>Yesterday, 14:22</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}