import { useLanguage } from '@/i18n/LanguageProvider';
import { FileText, Download, BarChart3, TrendingUp, PieChart } from 'lucide-react';

const reports = [
  { title: 'Attendance Report',  icon: '📊', format: 'PDF, Excel', size: '2.4 MB', date: 'Jan 20, 2026' },
  { title: 'Payroll Report',     icon: '💰', format: 'PDF, Excel', size: '3.1 MB', date: 'Jan 15, 2026' },
  { title: 'Performance Review', icon: '⭐', format: 'PDF',        size: '1.8 MB', date: 'Jan 10, 2026' },
  { title: 'Leave Analysis',     icon: '🏖️', format: 'PDF, Excel', size: '1.2 MB', date: 'Jan 05, 2026' },
  { title: 'Overtime Report',    icon: '⏱️', format: 'PDF',        size: '980 KB', date: 'Jan 01, 2026' },
  { title: 'Cost Analysis',      icon: '💵', format: 'PDF, Excel', size: '4.2 MB', date: 'Dec 28, 2025' },
];

export default function Reports() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">{t('reports')}</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Generate and analyze business reports</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: '128', icon: FileText,   color: 'from-blue-500 to-cyan-500' },
          { label: 'Generated',     value: '24',  icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
          { label: 'Scheduled',     value: '12',  icon: BarChart3,  color: 'from-purple-500 to-pink-500' },
          { label: 'Shared',        value: '56',  icon: PieChart,   color: 'from-amber-500 to-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl cursor-pointer transition hover:shadow-lg"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="text-4xl mb-4">{report.icon}</div>
            <h3 className="font-bold mb-2">{report.title}</h3>
            <div className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              Format: {report.format} • Size: {report.size}
            </div>
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{report.date}</span>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition text-white text-xs font-medium">
                <Download className="w-3 h-3" />
                Export PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
