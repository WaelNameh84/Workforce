import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  useGetAttendance, useGetTodayAttendance, useClockIn, useClockOut,
  getGetAttendanceQueryKey, getGetTodayAttendanceQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, Wifi, Bluetooth, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Attendance() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkMethod, setCheckMethod] = useState<'gps' | 'wifi' | 'bluetooth'>('gps');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: attendanceData, isLoading } = useGetAttendance(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetAttendanceQueryKey({ companyId: user?.companyId || 0 }) } }
  );

  const { data: todayStatus, isLoading: todayLoading } = useGetTodayAttendance(
    { employeeId: user?.id || 0 },
    { query: { enabled: !!user?.id, queryKey: getGetTodayAttendanceQueryKey({ employeeId: user?.id || 0 }) } }
  );

  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const todayRecord = Array.isArray(todayStatus) ? todayStatus[0] : todayStatus;
  const isClockedIn = todayRecord?.clockIn && !todayRecord?.clockOut;

  const handleClockIn = async () => {
    try {
      await clockInMutation.mutateAsync({ data: { employeeId: user?.id || 0, location: 'Office', method: checkMethod } });
      queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTodayAttendanceQueryKey({ employeeId: user?.id || 0 }) });
    } catch {}
  };

  const handleClockOut = async () => {
    try {
      await clockOutMutation.mutateAsync({ data: { employeeId: user?.id || 0 } });
      queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTodayAttendanceQueryKey({ employeeId: user?.id || 0 }) });
    } catch {}
  };

  const statusColor = (s?: string) => {
    if (s === 'present') return 'bg-green-500/10 text-green-500';
    if (s === 'late') return 'bg-amber-500/10 text-amber-500';
    if (s === 'absent') return 'bg-red-500/10 text-red-500';
    return 'bg-gray-500/10 text-gray-500';
  };

  const methods = [
    { id: 'gps' as const, icon: MapPin, label: 'GPS' },
    { id: 'wifi' as const, icon: Wifi, label: 'WiFi' },
    { id: 'bluetooth' as const, icon: Bluetooth, label: 'BT' },
  ];

  const attendanceRows = attendanceData?.attendance || [];
  const totalHours = attendanceRows.reduce((sum, record) => sum + Number(record.totalHours || 0), 0);
  const lateArrivals = attendanceRows.filter((record) => record.isLate || record.status === 'late').length;
  const completedRecords = attendanceRows.filter((record) => record.clockOut).length;
  const openRecords = attendanceRows.filter((record) => !record.clockOut).length;
  const weekStats = [
    { label: t('totalHours'), value: `${totalHours.toFixed(1)}h`, color: 'from-blue-500 to-cyan-500' },
    { label: t('totalRecords'), value: String(attendanceRows.length), color: 'from-indigo-500 to-purple-500' },
    { label: t('lateArrivals'), value: String(lateArrivals), color: 'from-amber-500 to-orange-500' },
    { label: t('activeRecords'), value: String(openRecords || completedRecords), color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">{t('attendance')}</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('trackAttendanceDesc')}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Clock Widget */}
        <div className="lg:col-span-1 rounded-2xl p-6 text-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 0%, transparent 60%)' }} />
          <div className="relative space-y-4">
            <p className="text-white/70 text-sm">{format(currentTime, 'EEEE, MMMM d, yyyy')}</p>
            <h2 className="text-5xl font-bold font-mono tracking-tighter">{format(currentTime, 'HH:mm:ss')}</h2>

            {isClockedIn && todayRecord?.clockIn && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                {t('clockedIn')} {format(new Date(todayRecord.clockIn), 'HH:mm')}
              </div>
            )}

            <div className="flex gap-2 justify-center">
              {methods.map(m => (
                <button
                  key={m.id}
                  onClick={() => setCheckMethod(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    checkMethod === m.id ? 'bg-white text-indigo-600' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              ))}
            </div>

            {todayLoading ? (
              <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : isClockedIn ? (
              <button
                onClick={handleClockOut}
                disabled={clockOutMutation.isPending}
                className="w-full py-3 rounded-xl bg-red-500/90 hover:bg-red-500 text-white font-bold text-lg transition flex items-center justify-center gap-2"
              >
                {clockOutMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                {t('clockOut')}
              </button>
            ) : (
              <button
                onClick={handleClockIn}
                disabled={clockInMutation.isPending}
                className="w-full py-3 rounded-xl bg-white text-indigo-600 hover:bg-white/90 font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg"
              >
                {clockInMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                {t('clockIn')}
              </button>
            )}

            <p className="text-xs text-white/60 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> {t('officeDetected')}
            </p>
          </div>
        </div>

        {/* Week Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 content-start">
          {weekStats.map((s, i) => (
            <div key={i} className="p-5 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className={`h-1 rounded-full mb-3 bg-gradient-to-r ${s.color}`} />
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.label}</div>
            </div>
          ))}

          <div className="col-span-2 sm:col-span-4 p-5 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold mb-3">{t('todayStatus')}</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="font-medium">{user?.fullName}</div>
                <div className="text-sm flex items-center gap-2 mt-1">
                  {isClockedIn ? (
                    <span className="flex items-center gap-1.5 text-green-500"><CheckCircle2 className="w-4 h-4" /> {t('currentlyClockedIn')}</span>
                  ) : todayRecord?.clockOut ? (
                    <span className="flex items-center gap-1.5 text-blue-500"><CheckCircle2 className="w-4 h-4" /> {t('clockedOutStatus')}</span>
                  ) : (
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--muted)' }}><AlertCircle className="w-4 h-4" /> {t('notClockedInYet')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="surface p-4 sm:p-6 rounded-2xl" data-testid="section-recent-attendance">
        <h3 className="text-lg font-bold mb-4">{t('recentRecords')}</h3>
        {isLoading ? <div className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--muted-bg)' }} /> : !attendanceData?.attendance?.length ? (
          <div className="py-10 text-center text-muted-foreground">{t('noRecordsFound')}</div>
        ) : <div className="space-y-2">{attendanceRows.map((rec, index) => (
          <div key={rec.id} data-testid={`card-attendance-${rec.id}`} className={`rounded-xl p-3 sm:p-4 flex items-center gap-3 animate-fadeIn stagger-${(index % 4) + 1}`} style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-300 to-teal-600 flex items-center justify-center text-emerald-950 font-bold">{rec.employeeName?.charAt(0) || 'U'}</div>
            <div className="min-w-0 flex-1"><div className="font-semibold truncate">{rec.employeeName || '—'}</div><div className="text-xs text-muted-foreground">{rec.date ? format(new Date(rec.date), 'MMM d, yyyy') : '—'}</div></div>
            <div className="hidden sm:block text-right text-xs"><div className="font-data">{rec.clockIn ? format(new Date(rec.clockIn), 'HH:mm') : '—'} → {rec.clockOut ? format(new Date(rec.clockOut), 'HH:mm') : '—'}</div><div className="text-muted-foreground mt-1">{rec.totalHours || '—'} {t('total')}</div></div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(rec.status)}`}>{rec.status}</span>
          </div>
        ))}</div>}
      </div>
    </div>
  );
}
