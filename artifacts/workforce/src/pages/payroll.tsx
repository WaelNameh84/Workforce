import { useLanguage } from '@/i18n/LanguageProvider';
import { DollarSign, TrendingUp, Download, FileText, Check, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const demoPayroll = [
  { id: 1, employee: 'John Smith',     position: 'Senior Developer',    basic: 5000, overtime: 200, bonus: 100, deductions: 50, tax: 500, net: 4750, status: 'paid' },
  { id: 2, employee: 'Sarah Johnson',  position: 'HR Manager',          basic: 4500, overtime: 150, bonus: 100, deductions: 30, tax: 450, net: 4270, status: 'paid' },
  { id: 3, employee: 'Mohammed Ali',   position: 'Frontend Developer',   basic: 4000, overtime: 300, bonus: 50,  deductions: 40, tax: 400, net: 3910, status: 'pending' },
  { id: 4, employee: 'Emma Wilson',    position: 'Accountant',           basic: 3800, overtime: 0,   bonus: 100, deductions: 30, tax: 380, net: 3490, status: 'paid' },
  { id: 5, employee: 'Lars Svensson',  position: 'Marketing Specialist', basic: 3500, overtime: 100, bonus: 0,   deductions: 20, tax: 350, net: 3230, status: 'pending' },
];

const monthlyData = [
  { month: 'Aug', amount: 238000 },
  { month: 'Sep', amount: 241000 },
  { month: 'Oct', amount: 248000 },
  { month: 'Nov', amount: 255000 },
  { month: 'Dec', amount: 265000 },
  { month: 'Jan', amount: 284000 },
];

export default function Payroll() {
  const { t } = useLanguage();

  const stats = [
    { label: t('monthlyPayroll'), value: '$284,500', change: '+8.2%', icon: DollarSign, color: 'from-green-500 to-emerald-500' },
    { label: 'Average Salary',   value: '$3,920',   change: '+5.1%', icon: TrendingUp,  color: 'from-blue-500 to-cyan-500' },
    { label: t('overtime'),      value: '$12,350',  change: '+15%',  icon: Clock,       color: 'from-amber-500 to-orange-500' },
    { label: t('tax'),           value: '$45,200',  change: '+4%',   icon: FileText,    color: 'from-red-500 to-rose-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('payroll')}</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Manage salaries, bonuses, and deductions</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition hover:opacity-80" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <Download className="w-4 h-4" />
            {t('exportExcel')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm">
            {t('generatePayslip')}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">{stat.change}</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h3 className="text-lg font-bold mb-4">Payroll Trends</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData}>
            <defs>
              <linearGradient id="payrollGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Payroll']}
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
            />
            <Bar dataKey="amount" fill="url(#payrollGrad)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payroll Table */}
      <div className="p-6 rounded-2xl overflow-x-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Pay Period: January 2026</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 text-white">All</button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>Paid</button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>Pending</button>
          </div>
        </div>
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="text-sm" style={{ color: 'var(--muted)' }}>
              {['Employee', 'Basic', 'Overtime', 'Bonus', 'Deductions', 'Tax', 'Net', 'Status', ''].map(h => (
                <th key={h} className="text-left py-3 px-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {demoPayroll.map(p => (
              <tr key={p.id} className="text-sm border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-3 px-2">
                  <div className="font-medium">{p.employee}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{p.position}</div>
                </td>
                <td className="py-3 px-2">${p.basic.toLocaleString()}</td>
                <td className="py-3 px-2 text-green-500">+${p.overtime}</td>
                <td className="py-3 px-2 text-green-500">+${p.bonus}</td>
                <td className="py-3 px-2 text-red-500">-${p.deductions}</td>
                <td className="py-3 px-2 text-red-500">-${p.tax}</td>
                <td className="py-3 px-2 font-bold">${p.net.toLocaleString()}</td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {p.status === 'paid' ? <Check className="w-3 h-3 inline me-1" /> : <Clock className="w-3 h-3 inline me-1" />}
                    {p.status}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <button className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition">
                    Payslip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
