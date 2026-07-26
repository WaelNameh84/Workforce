import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useGetPayroll, useUpdatePayroll, getGetPayrollQueryKey } from '@workspace/api-client-react';
import type { Payroll } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import DetailDialog from '@/components/detail-dialog';
import { DollarSign, TrendingUp, Download, FileText, Check, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { downloadCsv, downloadTextFile } from '@/lib/download';

const money = (value?: string | number | null) => Number(value || 0);

export default function PayrollPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [selected, setSelected] = useState<Payroll | null>(null);
  const params = { companyId: user?.companyId || 0, period: '2026-01' };
  const { data, isLoading } = useGetPayroll(params, { query: { enabled: !!user?.companyId, queryKey: getGetPayrollQueryKey(params) } });
  const updateMutation = useUpdatePayroll();
  const rows = data?.payroll || [];
  const visibleRows = filter === 'all' ? rows : rows.filter((row) => row.status === filter);
  const totals = useMemo(() => ({ gross: rows.reduce((sum, row) => sum + money(row.basicSalary) + money(row.overtime) + money(row.bonus), 0), net: rows.reduce((sum, row) => sum + money(row.netSalary), 0), overtime: rows.reduce((sum, row) => sum + money(row.overtime), 0), tax: rows.reduce((sum, row) => sum + money(row.tax), 0) }), [rows]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetPayrollQueryKey() });

  const exportRows = () => {
    downloadCsv('workforce-payroll-2026-01.csv', ['Employee', 'Period', 'Basic', 'Overtime', 'Bonus', 'Deductions', 'Tax', 'Net', 'Status'], rows.map((row) => [row.employeeName, row.period, row.basicSalary, row.overtime, row.bonus, row.deductions, row.tax, row.netSalary, row.status]));
    toast({ title: t('exportExcel') });
  };
  const payslip = (row: Payroll) => {
    const content = [`${t('payslip')} - ${row.employeeName || row.employeeId}`, `${t('payPeriod')}: ${row.period || '—'}`, '', `${t('basicSalary')}: $${money(row.basicSalary).toLocaleString()}`, `${t('overtime')}: $${money(row.overtime).toLocaleString()}`, `${t('bonus')}: $${money(row.bonus).toLocaleString()}`, `${t('deductions')}: $${money(row.deductions).toLocaleString()}`, `${t('tax')}: $${money(row.tax).toLocaleString()}`, `${t('netSalary')}: $${money(row.netSalary).toLocaleString()}`].join('\n');
    downloadTextFile(`payslip-${row.employeeName || row.employeeId}-${row.period || 'period'}.txt`, content);
    toast({ title: t('payslip') });
  };
  const generatePayslip = () => rows.length ? payslip(rows[0]) : toast({ variant: 'destructive', title: t('noData') });
  const markPaid = async (row: Payroll) => {
    if (!row.id) return;
    try { await updateMutation.mutateAsync({ id: row.id, data: { status: 'paid' } }); toast({ title: t('paid') }); refresh(); } catch { toast({ variant: 'destructive', title: t('actions'), description: 'Could not update payroll.' }); }
  };
  
  const stats = [
    { label: t('monthlyPayroll'), value: `$${totals.net.toLocaleString()}`, icon: DollarSign, color: 'from-green-500 to-emerald-500' },
    { label: t('averageSalary'), value: `$${(rows.length ? totals.net / rows.length : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
    { label: t('overtime'), value: `$${totals.overtime.toLocaleString()}`, icon: Clock, color: 'from-amber-500 to-orange-500' },
    { label: t('tax'), value: `$${totals.tax.toLocaleString()}`, icon: FileText, color: 'from-red-500 to-rose-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('payroll')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t('managePayrollDesc')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportRows} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm hover:opacity-80 card-3d border-0 shadow-sm transition-transform hover:-translate-y-1">
            <Download className="w-4 h-4" />{t('exportExcel')}
          </button>
          <button onClick={generatePayslip} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-transform hover:-translate-y-1">
            <FileText className="w-4 h-4" /> {t('generatePayslip')}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button key={stat.label} onClick={() => setSelected(rows[0] || null)} className={`text-left p-6 rounded-2xl transition pressable card-3d animate-fadeIn stagger-${i + 1}`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-md`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold font-data mb-1">{stat.value}</div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="p-6 rounded-2xl card-3d">
        <h3 className="font-display text-lg font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" /> {t('payrollTrends')}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={[{ month: params.period, amount: totals.net }]}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, t('payroll')]} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} cursor={{ fill: 'var(--muted-bg)' }} />
            <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* List */}
      <div className="card-3d p-4 sm:p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
          <h3 className="font-display text-lg font-bold">{t('payPeriod')}: <span className="font-data text-indigo-500">{params.period}</span></h3>
          <div className="flex gap-2 p-1 bg-muted-bg rounded-xl">
            {(['all', 'paid', 'pending'] as const).map((value) => (
              <button 
                data-testid={`button-filter-payroll-${value}`} 
                key={value} 
                onClick={() => setFilter(value)} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${filter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} 
              >
                {t(value as any)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--muted-bg)' }} />
        ) : !visibleRows.length ? (
          <div className="py-10 text-center text-muted-foreground font-medium">{t('noData')}</div>
        ) : (
          <div className="space-y-4">
            {visibleRows.map((row, index) => (
              <div key={row.id} data-testid={`card-payroll-${row.id}`} onClick={() => setSelected(row)} className={`rounded-xl p-5 cursor-pointer pressable card-3d animate-fadeIn stagger-${(index % 4) + 1} !border-0 bg-gradient-to-r from-card to-muted-bg/50`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg font-display">
                      {row.employeeName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{row.employeeName || row.employeeId}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">
                        <span className="bg-muted-bg px-2 py-0.5 rounded-md mr-2">{t('basic')}: ${money(row.basicSalary).toLocaleString()}</span> 
                        <span className="bg-muted-bg px-2 py-0.5 rounded-md">{t('overtime')}: ${money(row.overtime).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t border-border sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                    <div className="text-left sm:text-right">
                      <div className="font-data font-bold text-xl">${money(row.netSalary).toLocaleString()}</div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${row.status === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>{t((row.status || 'pending') as any)}</span>
                    </div>
                    
                    <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
                      <button data-testid={`button-payslip-${row.id}`} onClick={() => payslip(row)} className="px-3 py-2 rounded-lg text-xs font-bold bg-card border border-border shadow-sm hover:bg-muted-bg transition-colors">
                        {t('payslip')}
                      </button>
                      {row.status !== 'paid' && (
                        <button data-testid={`button-mark-paid-${row.id}`} onClick={() => markPaid(row)} className="px-3 py-2 rounded-lg text-xs font-bold bg-green-500 text-white shadow-md shadow-green-500/20 hover:bg-green-600 transition-colors">
                          {t('paid')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DetailDialog 
        open={!!selected} 
        onOpenChange={(open) => !open && setSelected(null)} 
        title={`${t('payslip')} — ${selected?.employeeName || selected?.employeeId || ''}`} 
        items={selected ? [
          { label: t('payPeriod'), value: selected.period }, 
          { label: t('basicSalary'), value: `$${money(selected.basicSalary).toLocaleString()}` }, 
          { label: t('overtime'), value: `$${money(selected.overtime).toLocaleString()}` }, 
          { label: t('bonus'), value: `$${money(selected.bonus).toLocaleString()}` }, 
          { label: t('deductions'), value: `$${money(selected.deductions).toLocaleString()}` }, 
          { label: t('tax'), value: `$${money(selected.tax).toLocaleString()}` }, 
          { label: t('netSalary'), value: `$${money(selected.netSalary).toLocaleString()}` }, 
          { label: t('status'), value: selected.status }
        ] : []} 
      />
    </div>
  );
}
