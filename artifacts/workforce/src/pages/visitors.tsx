import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, LogIn, LogOut, UserPlus } from 'lucide-react';

export default function Visitors() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('visitors')}</h1>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" /> New Visitor
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary"><LogIn className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Inside</p>
                <h3 className="text-3xl font-bold">14</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500"><LogOut className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departed Today</p>
                <h3 className="text-3xl font-bold">42</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10 text-purple-500"><UserPlus className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected</p>
                <h3 className="text-3xl font-bold">8</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search visitors..." className="pl-9 bg-background" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Visitor Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Host Employee</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: 'Alice Smith', company: 'TechCorp', host: 'John Doe', in: '09:15 AM', out: null, status: 'active' },
                { name: 'Bob Jones', company: 'Vendor Inc', host: 'Jane Smith', in: '10:30 AM', out: '11:45 AM', status: 'departed' },
                { name: 'Charlie Brown', company: 'Delivery', host: 'Reception', in: null, out: null, status: 'expected' },
              ].map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.company}</TableCell>
                  <TableCell>{v.host}</TableCell>
                  <TableCell>{v.in || '-'}</TableCell>
                  <TableCell>{v.out || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      v.status === 'active' ? 'success' :
                      v.status === 'expected' ? 'warning' : 'secondary'
                    } className="capitalize">
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {v.status === 'active' && <Button size="sm" variant="outline" className="text-destructive">Sign Out</Button>}
                    {v.status === 'expected' && <Button size="sm">Sign In</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}