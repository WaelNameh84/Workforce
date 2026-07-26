import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { FileText, Download, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import DetailDialog from '@/components/detail-dialog';
import { downloadTextFile } from '@/lib/download';
import { useToast } from '@/components/ui/use-toast';

export default function Reports() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selected, setSelected] = useState<(typeof reports)[number] | null>(null);

  const exportReport = (report: (typeof reports)[number]) => {
    const content = [
      `${t(report.titleKey as any)}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Format: ${report.format}`,
      '',
      'WorkforceOS report export',
      'Use the dashboard filters and source modules for the latest live records.',
    ].join('\n');
    downloadTextFile(`${report.titleKey}-report.txt`, content);
    toast({ title: t('exportPDF'), description: `${t(report.titleKey as any)} exported.` });
  };

  const reports = [
    { titleKey: 'attendanceReport', icon: '📊', format: 'PDF, Excel', size: '2.4 MB', date: 'Jan 20, 2026', description: 'Attendance and punctuality overview.' },
    { titleKey: 'payrollReport', icon: '💰', format: 'PDF, Excel', size: '3.1 MB', date: 'Jan 15, 2026', description: 'Payroll totals, deductions, and payment status.' },
    { titleKey: 'productivity', icon: '⭐', format: 'PDF', size: '1.8 MB', date: 'Jan 10, 2026', description: 'Productivity and performance summary.' },
    { titleKey: 'leaveBalance', icon: '🏖️', format: 'PDF, Excel', size: '1.2 MB', date: 'Jan 05, 2026', description: 'Leave balances and approved requests.' },
    { titleKey: 'overtime', icon: '⏱️', format: 'PDF', size: '980 KB', date: 'Jan 01, 2026', description: 'Overtime hours and approvals.' },
    { titleKey: 'monthlyPayroll', icon: '💵', format: 'PDF, Excel', size: '4.2 MB', date: 'Dec 28, 2025', description: 'Monthly payroll report.' },
  ];

  const stats = [
    { label: t('totalReports'), value: reports.length, icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: t('generated'), value: reports.length, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { label: t('scheduled'), value: 0, icon: BarChart3, color: 'from-purple-500 to-pink-500' },
    { label: t('shared'), value: 0, icon: PieChart, color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">{t('reports')}</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('generateReportsDesc')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button key={stat.label} onClick={() => setSelected(reports[0])} className="text-left p-5 rounded-2xl transition hover:-translate-y-0.5 hover:shadow-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}><stat.icon className="w-5 h-5 text-white" /></div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report.titleKey} onClick={() => setSelected(report)} className="p-6 rounded-2xl cursor-pointer transition hover:shadow-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-4xl mb-4">{report.icon}</div>
            <h3 className="font-bold mb-2">{t(report.titleKey as any)}</h3>
            <div className="text-xs mb-4" style={{ color: 'var(--muted)' }}>{t('format')}: {report.format} • {t('size')}: {report.size}</div>
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{report.date}</span>
              <button onClick={(event) => { event.stopPropagation(); exportReport(report); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition text-white text-xs font-medium"><Download className="w-3 h-3" />{t('exportPDF')}</button>
            </div>
          </div>
        ))}
      </div>
      <DetailDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={selected ? t(selected.titleKey as any) : t('reports')} items={selected ? [{ label: t('format'), value: selected.format }, { label: t('size'), value: selected.size }, { label: t('date'), value: selected.date }, { label: t('description'), value: selected.description }] : []} />
    </div>
  );
}