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

export default function Payroll() {
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

  return <div className="space-y-6 animate-fadeIn">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><h1 className="text-2xl font-bold">{t('payroll')}</h1><p className="text-sm" style={{ color: 'var(--muted)' }}>{t('managePayrollDesc')}</p></div><div className="flex gap-2"><button onClick={exportRows} className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm hover:opacity-80" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><Download className="w-4 h-4" />{t('exportExcel')}</button><button onClick={generatePayslip} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm">{t('generatePayslip')}</button></div></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{stats.map((stat) => <button key={stat.label} onClick={() => setSelected(rows[0] || null)} className="text-left p-6 rounded-2xl transition hover:-translate-y-0.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><div className="flex items-center justify-between mb-4"><div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}><stat.icon className="w-6 h-6 text-white" /></div></div><div className="text-3xl font-bold mb-1">{stat.value}</div><div className="text-sm" style={{ color: 'var(--muted)' }}>{stat.label}</div></button>)}</div>
    <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><h3 className="text-lg font-bold mb-4">{t('payrollTrends')}</h3><ResponsiveContainer width="100%" height={280}><BarChart data={[{ month: params.period, amount: totals.net }]}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} /><Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, t('payroll')]} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} /><Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
    <div className="p-6 rounded-2xl overflow-x-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{t('payPeriod')}: {params.period}</h3><div className="flex gap-2">{(['all', 'paid', 'pending'] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === value ? 'bg-indigo-500 text-white' : ''}`} style={filter === value ? {} : { background: 'var(--background)', border: '1px solid var(--border)' }}>{t(value as any)}</button>)}</div></div><table className="w-full min-w-[900px]"><thead><tr className="text-sm" style={{ color: 'var(--muted)' }}>{[t('employee'), t('basic'), t('overtime'), t('bonus'), t('deductions'), t('tax'), t('net'), t('status'), ''].map((head, index) => <th key={index} className="text-left py-3 px-2 font-medium">{head}</th>)}</tr></thead><tbody>{isLoading ? <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">{t('loading')}</td></tr> : !visibleRows.length ? <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">{t('noData')}</td></tr> : visibleRows.map((row) => <tr key={row.id} onClick={() => setSelected(row)} className="text-sm border-t cursor-pointer hover:bg-muted/30" style={{ borderColor: 'var(--border)' }}><td className="py-3 px-2 font-medium">{row.employeeName || row.employeeId}</td><td className="py-3 px-2">${money(row.basicSalary).toLocaleString()}</td><td className="py-3 px-2 text-green-500">+${money(row.overtime).toLocaleString()}</td><td className="py-3 px-2 text-green-500">+${money(row.bonus).toLocaleString()}</td><td className="py-3 px-2 text-red-500">-${money(row.deductions).toLocaleString()}</td><td className="py-3 px-2 text-red-500">-${money(row.tax).toLocaleString()}</td><td className="py-3 px-2 font-bold">${money(row.netSalary).toLocaleString()}</td><td className="py-3 px-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>{row.status === 'paid' ? <Check className="w-3 h-3 inline me-1" /> : <Clock className="w-3 h-3 inline me-1" />}{t((row.status || 'pending') as any)}</span></td><td className="py-3 px-2" onClick={(event) => event.stopPropagation()}><div className="flex gap-2"><button onClick={() => payslip(row)} className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500 text-white">{t('payslip')}</button>{row.status !== 'paid' && <button onClick={() => markPaid(row)} className="px-3 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-500">{t('paid')}</button>}</div></td></tr>)}</tbody></table></div>
    <DetailDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={`${t('payslip')} — ${selected?.employeeName || selected?.employeeId || ''}`} items={selected ? [{ label: t('payPeriod'), value: selected.period }, { label: t('basicSalary'), value: `$${money(selected.basicSalary).toLocaleString()}` }, { label: t('overtime'), value: `$${money(selected.overtime).toLocaleString()}` }, { label: t('bonus'), value: `$${money(selected.bonus).toLocaleString()}` }, { label: t('deductions'), value: `$${money(selected.deductions).toLocaleString()}` }, { label: t('tax'), value: `$${money(selected.tax).toLocaleString()}` }, { label: t('netSalary'), value: `$${money(selected.netSalary).toLocaleString()}` }, { label: t('status'), value: selected.status }] : []} />
  </div>;
}