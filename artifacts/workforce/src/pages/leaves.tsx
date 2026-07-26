import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Plus, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

const demoLeaves = [
  { id: 1, employee: 'John Smith',     type: 'annual',    from: '2026-02-01', to: '2026-02-05', days: 5,  status: 'approved', reason: 'Family vacation' },
  { id: 2, employee: 'Sarah Johnson',  type: 'sick',      from: '2026-01-20', to: '2026-01-21', days: 2,  status: 'approved', reason: 'Flu' },
  { id: 3, employee: 'Mohammed Ali',   type: 'emergency', from: '2026-01-25', to: '2026-01-25', days: 1,  status: 'pending',  reason: 'Personal emergency' },
  { id: 4, employee: 'Emma Wilson',    type: 'annual',    from: '2026-03-10', to: '2026-03-20', days: 10, status: 'pending',  reason: 'Travel' },
  { id: 5, employee: 'Lars Svensson',  type: 'maternity', from: '2026-04-01', to: '2026-07-01', days: 90, status: 'approved', reason: 'Maternity leave' },
  { id: 6, employee: 'Fatima Hassan',  type: 'unpaid',    from: '2026-02-15', to: '2026-02-16', days: 2,  status: 'rejected', reason: 'Personal reasons' },
];

const leaveTypes = [
  { type: 'annual',    color: 'from-blue-500 to-cyan-500',    icon: '🏖️', used: 5, total: 21 },
  { type: 'sick',      color: 'from-red-500 to-rose-500',     icon: '🤒', used: 2, total: 10 },
  { type: 'emergency', color: 'from-amber-500 to-orange-500', icon: '⚡', used: 1, total: 5  },
  { type: 'maternity', color: 'from-pink-500 to-rose-500',    icon: '👶', used: 0, total: 90 },
  { type: 'paternity', color: 'from-purple-500 to-indigo-500',icon: '👨‍👧', used: 0, total: 30 },
  { type: 'unpaid',    color: 'from-gray-500 to-slate-500',   icon: '📝', used: 0, total: 30 },
];

const statusColor = (s: string) => {
  if (s === 'approved') return 'bg-green-500/10 text-green-500';
  if (s === 'rejected') return 'bg-red-500/10 text-red-500';
  return 'bg-amber-500/10 text-amber-500';
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'approved') return <CheckCircle2 className="w-3 h-3 inline me-1" />;
  if (status === 'rejected') return <XCircle className="w-3 h-3 inline me-1" />;
  return <Clock className="w-3 h-3 inline me-1" />;
};

export default function Leaves() {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('leaves')}</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Manage leave requests and balances</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          {t('leaveRequest')}
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {leaveTypes.map((leave, i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${leave.color} flex items-center justify-center text-2xl mb-3`}>
              {leave.icon}
            </div>
            <div className="text-sm font-medium mb-1 capitalize">{leave.type}</div>
            <div className="text-2xl font-bold">
              {leave.total - leave.used}
              <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>/{leave.total}</span>
            </div>
            <div className="mt-3 h-2 rounded-full" style={{ background: 'var(--background)' }}>
              <div
                className={`h-full rounded-full bg-gradient-to-r ${leave.color}`}
                style={{ width: `${(leave.used / leave.total) * 100}%` }}
              />
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{leave.used} used</div>
          </div>
        ))}
      </div>

      {/* Leave Table */}
      <div className="p-6 rounded-2xl overflow-x-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h3 className="text-lg font-bold mb-4">Leave Requests</h3>
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="text-sm" style={{ color: 'var(--muted)' }}>
              {['Employee', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left py-3 px-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {demoLeaves.map((leave) => (
              <tr key={leave.id} className="text-sm border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-3 px-2 font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {leave.employee.split(' ').map(n => n[0]).join('')}
                    </div>
                    {leave.employee}
                  </div>
                </td>
                <td className="py-3 px-2 capitalize">{leave.type}</td>
                <td className="py-3 px-2">{leave.from}</td>
                <td className="py-3 px-2">{leave.to}</td>
                <td className="py-3 px-2 font-medium">{leave.days}</td>
                <td className="py-3 px-2" style={{ color: 'var(--muted)' }}>{leave.reason}</td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(leave.status)}`}>
                    <StatusIcon status={leave.status} />
                    {leave.status}
                  </span>
                </td>
                <td className="py-3 px-2">
                  {leave.status === 'pending' ? (
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                      <FileText className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: 'var(--card)' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">New Leave Request</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Leave Type</label>
                <select className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                  {leaveTypes.map(l => <option key={l.type} value={l.type} className="capitalize">{l.type}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input type="date" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input type="date" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <textarea rows={3} className="w-full rounded-xl px-4 py-2.5 text-sm resize-none" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium transition hover:opacity-80" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
