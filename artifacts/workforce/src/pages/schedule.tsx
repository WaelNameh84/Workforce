import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

const employees = ['John Smith', 'Sarah Johnson', 'Mohammed Ali', 'Emma Wilson', 'Lars Svensson'];

const shifts: Record<string, { label: string; time: string; color: string }> = {
  morning:  { label: 'Morning',  time: '09:00–17:00', color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30' },
  evening:  { label: 'Evening',  time: '16:00–00:00', color: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/30' },
  night:    { label: 'Night',    time: '00:00–08:00', color: 'bg-slate-700/10 text-slate-400 border-slate-600/30' },
  off:      { label: 'Off',      time: '',            color: 'bg-gray-100 dark:bg-gray-800/30 text-gray-400 border-dashed' },
};

// Deterministic "random" based on employee + day index
const getShift = (empIdx: number, dayIdx: number) => {
  const seed = (empIdx * 7 + dayIdx * 3) % 10;
  if (seed > 8) return 'off';
  if (seed > 6) return 'night';
  if (seed > 3) return 'evening';
  return 'morning';
};

export default function Schedule() {
  const { t } = useLanguage();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeek, i));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('schedule')}</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Weekly shift scheduling</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentWeek(w => addDays(w, -7))}
            className="p-2 rounded-xl hover:opacity-80 transition"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium px-3 py-2 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {format(currentWeek, 'MMM d')} – {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setCurrentWeek(w => addDays(w, 7))}
            className="p-2 rounded-xl hover:opacity-80 transition"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm">
            <Plus className="w-4 h-4" /> Add Shift
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(shifts).map(([key, s]) => (
          <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${s.color}`}>
            {s.label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="min-w-[780px]">
          {/* Header */}
          <div className="grid border-b" style={{ gridTemplateColumns: '180px repeat(7, 1fr)', borderColor: 'var(--border)' }}>
            <div className="p-4 text-sm font-medium" style={{ color: 'var(--muted)' }}>Employee</div>
            {days.map((day, i) => {
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div key={i} className={`p-4 text-center border-l text-sm`} style={{ borderColor: 'var(--border)' }}>
                  <div className={`font-semibold ${isToday ? 'text-indigo-500' : ''}`}>{format(day, 'EEE')}</div>
                  <div className={`text-xs mt-0.5 ${isToday ? 'text-indigo-500' : ''}`} style={isToday ? {} : { color: 'var(--muted)' }}>
                    {format(day, 'MMM d')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {employees.map((emp, empIdx) => (
            <div key={empIdx} className="grid border-t" style={{ gridTemplateColumns: '180px repeat(7, 1fr)', borderColor: 'var(--border)' }}>
              <div className="p-4 flex items-center gap-3 border-r" style={{ borderColor: 'var(--border)' }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {emp.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm font-medium truncate">{emp}</span>
              </div>
              {days.map((_, dayIdx) => {
                const key = getShift(empIdx, dayIdx);
                const shift = shifts[key];
                return (
                  <div key={dayIdx} className="p-2 border-l" style={{ borderColor: 'var(--border)' }}>
                    <div className={`rounded-lg border p-2 text-xs font-medium text-center ${shift.color}`}>
                      <div>{shift.label}</div>
                      {shift.time && <div className="opacity-60 mt-0.5 text-[10px]">{shift.time}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
