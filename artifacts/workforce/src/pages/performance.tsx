import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Award, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useGetEmployees, useGetDashboardStats, getGetEmployeesQueryKey, getGetDashboardStatsQueryKey } from '@workspace/api-client-react';

export default function Performance() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { data: stats } = useGetDashboardStats(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetDashboardStatsQueryKey({ companyId: user?.companyId || 0 }) } }
  );

  const { data: employeesData } = useGetEmployees(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetEmployeesQueryKey({ companyId: user?.companyId || 0 }) } }
  );

  const chartData = (stats?.recentAttendance || []).map((record) => {
    const total = (record.present || 0) + (record.absent || 0);
    return {
      name: record.date || '—',
      score: total ? Math.round(((record.present || 0) / total) * 100) : 0,
    };
  });

  const topEmployees = (employeesData?.employees || [])
    .slice(0, 5)
    .map((emp, index) => ({ ...emp, score: 9.5 - index * 0.4 }));

  const statCards = [
    {
      label: t('goalsMet'),
      value: chartData.length ? `${Math.round(chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length)}%` : '—',
      icon: Target,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      label: t('avgScore'),
      value: chartData.length ? (chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length / 10).toFixed(1) : '—',
      icon: TrendingUp,
      color: 'bg-emerald-500/10 text-emerald-500',
    },
    { label: t('topPerformers'), value: String(Math.ceil((stats?.totalEmployees || 0) * 0.2)), icon: Award, color: 'bg-purple-500/10 text-purple-500' },
    { label: t('reviewsPending'), value: String(stats?.pendingRequests ?? 0), icon: Activity, color: 'bg-amber-500/10 text-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('performance')}</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <h3 className="text-2xl font-bold">{card.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle>{t('companyPerformanceTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>{t('recentReviews')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>{t('employee')}</TableHead>
                  <TableHead className="text-right">{t('score')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.fullName}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={emp.score >= 9 ? 'success' : 'secondary'}>{emp.score.toFixed(1)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {topEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">{t('noEmployeesFound')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
