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
    if (s === 'present') return 'border-l-green-500 bg-green-500/5 text-green-600 dark:text-green-400';
    if (s === 'late') return 'border-l-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400';
    if (s === 'absent') return 'border-l-red-500 bg-red-500/5 text-red-600 dark:text-red-400';
    return 'border-l-gray-500 bg-gray-500/5 text-gray-500';
  };

  const badgeColor = (s?: string) => {
    if (s === 'present') return 'bg-green-500/10 text-green-500';
    if (s === 'late') return 'bg-amber-500/10 text-amber-500';
    if (s === 'absent') return 'bg-red-500/10 text-red-500';
    return 'bg-gray-500/10 text-gray-500';
  }

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
        <h1 className="font-display text-3xl font-bold tracking-tight">{t('attendance')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t('trackAttendanceDesc')}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Clock Widget */}
        <div className="lg:col-span-1 rounded-3xl p-8 text-center bg-gradient-to-br from-[#101010] to-[#1e1e1e] border border-white/10 text-white relative overflow-hidden shadow-2xl card-3d">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #6366f1 0%, transparent 70%)' }} />
          
          <div className="relative space-y-6 z-10 flex flex-col items-center">
            {isClockedIn ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold tracking-widest uppercase border border-red-500/30">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse-ring" />
                LIVE
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-white/50 text-xs font-bold tracking-widest uppercase border border-white/10">
                OFF DUTY
              </div>
            )}

            <div>
              <h2 className="text-6xl font-bold font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{format(currentTime, 'HH:mm:ss')}</h2>
              <p className="text-white/50 text-sm mt-2 font-medium">{format(currentTime, 'EEEE, MMMM d, yyyy')}</p>
            </div>

            {isClockedIn && todayRecord?.clockIn && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-data">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                IN: {format(new Date(todayRecord.clockIn), 'HH:mm')}
              </div>
            )}

            <div className="flex gap-2 justify-center w-full max-w-[240px]">
              {methods.map(m => (
                <button
                  key={m.id}
                  onClick={() => setCheckMethod(m.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl text-[10px] font-medium transition ${
                    checkMethod === m.id ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>

            <div className="w-full pt-4">
              {todayLoading ? (
                <div className="flex justify-center h-[60px] items-center"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>
              ) : isClockedIn ? (
                <button
                  onClick={handleClockOut}
                  disabled={clockOutMutation.isPending}
                  className="w-full h-[60px] rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-lg transition flex items-center justify-center gap-3 shadow-lg shadow-red-500/25 pressable"
                >
                  {clockOutMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                  {t('clockOut')}
                </button>
              ) : (
                <button
                  onClick={handleClockIn}
                  disabled={clockInMutation.isPending}
                  className="w-full h-[60px] rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-teal-950 font-bold text-lg transition flex items-center justify-center gap-3 shadow-lg shadow-teal-500/25 pressable"
                >
                  {clockInMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                  {t('clockIn')}
                </button>
              )}
            </div>

            <p className="text-xs text-white/40 flex items-center justify-center gap-1.5">
              <MapPin className="w-3 h-3" /> {t('officeDetected')}
            </p>
          </div>
        </div>

        {/* Week Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 content-start">
          {weekStats.map((s, i) => (
            <div key={i} className="p-5 rounded-2xl card-3d flex flex-col justify-between">
              <div className={`w-8 h-1 rounded-full mb-4 bg-gradient-to-r ${s.color}`} />
              <div>
                <div className="text-2xl font-bold font-data">{s.value}</div>
                <div className="text-xs mt-1 font-medium tracking-wide uppercase" style={{ color: 'var(--muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}

          <div className="col-span-2 sm:col-span-4 p-6 rounded-2xl card-3d mt-2">
            <h3 className="font-display text-lg font-bold mb-4">{t('todayStatus')}</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{user?.fullName}</div>
                <div className="text-sm flex items-center gap-2 mt-1">
                  {isClockedIn ? (
                    <span className="flex items-center gap-1.5 text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded-md"><CheckCircle2 className="w-4 h-4" /> {t('currentlyClockedIn')}</span>
                  ) : todayRecord?.clockOut ? (
                    <span className="flex items-center gap-1.5 text-blue-500 font-medium bg-blue-500/10 px-2 py-1 rounded-md"><CheckCircle2 className="w-4 h-4" /> {t('clockedOutStatus')}</span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-medium bg-gray-500/10 px-2 py-1 rounded-md" style={{ color: 'var(--muted)' }}><AlertCircle className="w-4 h-4" /> {t('notClockedInYet')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="card-3d p-4 sm:p-6 rounded-2xl" data-testid="section-recent-attendance">
        <h3 className="font-display text-lg font-bold mb-6">{t('recentRecords')}</h3>
        
        {/* Horizontal scroll container for mobile */}
        <div className="overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex sm:flex-col gap-4 min-w-max sm:min-w-0">
            {isLoading ? <div className="h-24 rounded-xl animate-pulse w-full min-w-[280px]" style={{ background: 'var(--muted-bg)' }} /> : !attendanceData?.attendance?.length ? (
              <div className="py-10 w-full text-center text-muted-foreground">{t('noRecordsFound')}</div>
            ) : attendanceRows.map((rec, index) => (
              <div 
                key={rec.id} 
                data-testid={`card-attendance-${rec.id}`} 
                className={`w-[280px] sm:w-auto rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 animate-fadeIn stagger-${(index % 4) + 1} card-3d border-l-4 ${statusColor(rec.status)}`} 
              >
                <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-foreground font-bold shadow-sm flex-shrink-0">
                    {rec.employeeName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate text-foreground">{rec.employeeName || '—'}</div>
                    <div className="text-xs text-muted-foreground">{rec.date ? format(new Date(rec.date), 'EEEE, MMM d, yyyy') : '—'}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center sm:w-auto sm:gap-6 pt-3 border-t border-border sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="font-data font-bold text-sm bg-muted/50 px-2 py-1 rounded-md text-foreground">
                      {rec.clockIn ? format(new Date(rec.clockIn), 'HH:mm') : '--:--'} <span className="text-muted-foreground font-normal mx-1">→</span> {rec.clockOut ? format(new Date(rec.clockOut), 'HH:mm') : '--:--'}
                    </div>
                    <div className="text-muted-foreground mt-1.5 text-xs font-medium">{rec.totalHours || '0'} {t('total')}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${badgeColor(rec.status)}`}>{rec.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
