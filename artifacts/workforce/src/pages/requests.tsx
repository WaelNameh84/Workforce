import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { CheckCircle2, XCircle, Clock, Plus, DollarSign, Calendar, TrendingUp, Briefcase } from 'lucide-react';

const demoRequests = [
  { id: 1, employee: 'John Smith',    type: 'overtime',    title: 'Weekend Work',   desc: 'Project deadline',      date: '2026-01-18', status: 'pending' },
  { id: 2, employee: 'Sarah Johnson', type: 'shift_change',title: 'Shift Change',   desc: 'Need evening shift',    date: '2026-01-17', status: 'approved' },
  { id: 3, employee: 'Mohammed Ali',  type: 'expense',     title: 'Travel Expense', desc: 'Business trip',         date: '2026-01-16', status: 'pending' },
  { id: 4, employee: 'Emma Wilson',   type: 'leave',       title: 'Annual Leave',   desc: 'Family event',          date: '2026-01-15', status: 'rejected' },
  { id: 5, employee: 'Lars Svensson', type: 'advance',     title: 'Salary Advance', desc: 'Medical emergency',     date: '2026-01-14', status: 'pending' },
];

const typeIcons: Record<string, React.ReactNode> = {
  overtime:    <TrendingUp className="w-4 h-4" />,
  shift_change:<Briefcase className="w-4 h-4" />,
  expense:     <DollarSign className="w-4 h-4" />,
  leave:       <Calendar className="w-4 h-4" />,
  advance:     <DollarSign className="w-4 h-4" />,
};

const statusColor = (s: string) => {
  if (s === 'approved') return 'bg-green-500/10 text-green-500';
  if (s === 'rejected') return 'bg-red-500/10 text-red-500';
  return 'bg-amber-500/10 text-amber-500';
};

export default function Requests() {
  const { t } = useLanguage();
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('requests')}</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Manage all employee requests</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',     value: '47', color: 'from-blue-500 to-cyan-500' },
          { label: t('pending'),  value: '7',  color: 'from-amber-500 to-orange-500' },
          { label: t('approved'), value: '32', color: 'from-green-500 to-emerald-500' },
          { label: t('rejected'), value: '8',  color: 'from-red-500 to-rose-500' },
          { label: 'This Week', value: '12', color: 'from-purple-500 to-pink-500' },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>{stat.label}</div>
            <div className="text-3xl font-bold mt-2">{stat.value}</div>
            <div className={`h-1 rounded-full mt-3 bg-gradient-to-r ${stat.color}`} />
          </div>
        ))}
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {demoRequests.map(req => (
          <div key={req.id} className="p-5 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                {typeIcons[req.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold">{req.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500 capitalize">
                    {req.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>{req.desc}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  By {req.employee} • {req.date}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(req.status)}`}>
                  {req.status === 'approved' && <CheckCircle2 className="w-3 h-3 inline me-1" />}
                  {req.status === 'rejected' && <XCircle className="w-3 h-3 inline me-1" />}
                  {req.status === 'pending' && <Clock className="w-3 h-3 inline me-1" />}
                  {req.status}
                </span>
                {req.status === 'pending' && (
                  <>
                    <button className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: 'var(--card)' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">New Request</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Request Type</label>
                <select className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                  <option value="leave">Leave Request</option>
                  <option value="overtime">Overtime Request</option>
                  <option value="shift_change">Shift Change</option>
                  <option value="expense">Expense Claim</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input type="text" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea rows={4} className="w-full rounded-xl px-4 py-2.5 text-sm resize-none" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium hover:opacity-80 transition" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
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
