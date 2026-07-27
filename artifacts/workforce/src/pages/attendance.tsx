import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  useGetAttendance, useGetTodayAttendance, useClockIn, useClockOut, useUpdateAttendance,
  useGetLocations, getGetAttendanceQueryKey, getGetTodayAttendanceQueryKey, getGetLocationsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import {
  Clock, MapPin, Wifi, Bluetooth, Loader2, CheckCircle2, AlertCircle, Camera,
  Navigation, X, AlertTriangle, Timer, TrendingUp, QrCode,
  CalendarDays, LogIn, LogOut, ImagePlus, Send, FileImage, Hourglass, ExternalLink, Download
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ─── helpers ─────────────────────────────────────────────── */
const WORK_END_HOUR = 17;   // 17:00 = end of work day
const OVERTIME_THRESHOLD = 18; // 18:00+ counts as late clock-out

type LateOutReason = 'overtime' | 'forgot' | 'other';

function statusColors(s?: string | null) {
  if (s === 'present') return { row: 'border-l-emerald-500 bg-emerald-500/5', badge: 'bg-emerald-500/15 text-emerald-500', dot: 'bg-emerald-500' };
  if (s === 'late')    return { row: 'border-l-amber-500  bg-amber-500/5',   badge: 'bg-amber-500/15  text-amber-500',  dot: 'bg-amber-500'  };
  if (s === 'absent')  return { row: 'border-l-red-500    bg-red-500/5',     badge: 'bg-red-500/15    text-red-500',    dot: 'bg-red-500'    };
  if (s === 'half-day')return { row: 'border-l-blue-500   bg-blue-500/5',    badge: 'bg-blue-500/15   text-blue-500',   dot: 'bg-blue-500'   };
  return { row: 'border-l-gray-500 bg-gray-500/5', badge: 'bg-gray-500/15 text-gray-500', dot: 'bg-gray-500' };
}

function hoursLabel(h?: string | null, locale?: string) {
  const v = parseFloat(h || '0');
  return `${v.toFixed(1)}${locale === 'ar' ? 'س' : 'h'}`;
}

/* ─── component ───────────────────────────────────────────── */
export default function Attendance() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ar = locale === 'ar';
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docPhotoInputRef = useRef<HTMLInputElement>(null);

  /* ── check method ── */
  const [checkMethod, setCheckMethod] = useState<'gps' | 'wifi' | 'bluetooth' | 'qr'>('gps');
  const methods = [
    { id: 'gps'       as const, icon: Navigation, label: 'GPS'  },
    { id: 'wifi'      as const, icon: Wifi,       label: 'WiFi' },
    { id: 'bluetooth' as const, icon: Bluetooth,  label: 'BT'   },
    { id: 'qr'        as const, icon: QrCode,     label: 'QR'   },
  ];

  /* ── time ── */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ── location & GPS ── */
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
        { headers: { 'Accept-Language': 'ar' } },
      );
      const data = await res.json();
      const addr = data.address || {};
      const parts = [
        addr.road || addr.pedestrian || addr.footway || addr.path,
        addr.suburb || addr.neighbourhood || addr.quarter,
        addr.city || addr.town || addr.village || addr.county,
      ].filter(Boolean);
      setGpsAddress(parts.length ? parts.join('، ') : data.display_name || null);
    } catch {
      setGpsAddress(null);
    }
  };

  const detectGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    setGpsAddress(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGpsCoords({ lat, lng });
        setGpsLoading(false);
        reverseGeocode(lat, lng);
      },
      () => { setGpsLoading(false); },
      { timeout: 8000 },
    );
  };

  /* ── photo for clock-in card ── */
  const [clockPhoto, setClockPhoto] = useState<string | null>(null);
  const handleClockPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setClockPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  /* ── photo documentation card ── */
  const [docPhotos, setDocPhotos] = useState<{ id: number; src: string; name: string }[]>([]);
  const docPhotoCounter = useRef(0);
  const handleDocPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        docPhotoCounter.current += 1;
        setDocPhotos(prev => [...prev, { id: docPhotoCounter.current, src: ev.target?.result as string, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    // reset input so same file can be re-added
    e.target.value = '';
  };
  const removeDocPhoto = (id: number) => setDocPhotos(prev => prev.filter(p => p.id !== id));
  const downloadDocPhoto = (src: string, name: string) => {
    const a = document.createElement('a');
    a.href = src;
    a.download = name || `work-photo-${Date.now()}.jpg`;
    a.click();
  };

  /* ── API hooks ── */
  const { data: attendanceData, isLoading } = useGetAttendance(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetAttendanceQueryKey({ companyId: user?.companyId || 0 }) } },
  );
  const { data: todayStatus, isLoading: todayLoading } = useGetTodayAttendance(
    { employeeId: user?.employeeId || 0 },
    { query: { enabled: !!user?.employeeId, queryKey: getGetTodayAttendanceQueryKey({ employeeId: user?.employeeId || 0 }) } },
  );
  const { data: locationsData, isLoading: locationsLoading } = useGetLocations(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetLocationsQueryKey({ companyId: user?.companyId || 0 }) } },
  );
  const clockInMutation   = useClockIn();
  const clockOutMutation  = useClockOut();
  const updateMutation    = useUpdateAttendance();

  const todayRecord  = Array.isArray(todayStatus) ? todayStatus[0] : todayStatus;
  const isClockedIn  = !!(todayRecord?.clockIn && !todayRecord?.clockOut);
  const locations = locationsData?.locations || [];
  const selectedLocation = locations.find(location => String(location.id) === selectedLocationId);
  const attendanceEmployeeId = user?.employeeId || 0;

  useEffect(() => {
    if (!locations.length) {
      setSelectedLocationId('');
      return;
    }
    if (!selectedLocationId || !locations.some(location => String(location.id) === selectedLocationId)) {
      setSelectedLocationId(String(locations[0].id));
    }
  }, [locations, selectedLocationId]);

  useEffect(() => {
    if (checkMethod === 'gps') detectGPS();
    else setGpsCoords(null);
  }, [checkMethod]);

  /* ── justification dialogs ── */
  const [showLateIn,    setShowLateIn]    = useState(false);
  const [showEarlyOut,  setShowEarlyOut]  = useState(false);
  const [showLateOut,   setShowLateOut]   = useState(false);
  const [justText,      setJustText]      = useState('');
  const [lateOutReason, setLateOutReason] = useState<LateOutReason>('overtime');
  const [lateMinutes,   setLateMinutes]   = useState(0);
  const [pendingRecId,  setPendingRecId]  = useState<number | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTodayAttendanceQueryKey({ employeeId: attendanceEmployeeId }) });
  };

  const handleClockIn = async () => {
    if (!attendanceEmployeeId) {
      toast({
        variant: 'destructive',
        title: ar ? 'لا يوجد ملف موظف مرتبط' : 'No employee profile linked',
        description: ar ? 'سجّل الخروج ثم الدخول مجدداً لتحديث بيانات الحساب.' : 'Sign out and sign in again to refresh your account profile.',
      });
      return;
    }
    if (!selectedLocation) {
      toast({
        variant: 'destructive',
        title: ar ? 'اختر موقعاً أولاً' : 'Select a location first',
        description: ar ? 'أضف موقعاً من قسم مواقع العمل ثم اختره هنا.' : 'Add a work location, then select it here.',
      });
      return;
    }
    if (checkMethod === 'gps' && !gpsCoords) {
      toast({
        variant: 'destructive',
        title: ar ? 'يجب تحديد الموقع الجغرافي أولاً' : 'GPS location required',
        description: ar ? 'اضغط على زر "تحديد الموقع الجغرافي" للسماح بالتسجيل.' : 'Press the GPS detection button to continue.',
      });
      return;
    }
    try {
      const rec = await clockInMutation.mutateAsync({
        data: { employeeId: attendanceEmployeeId, location: selectedLocation.name, method: checkMethod },
      });
      queryClient.setQueryData(getGetTodayAttendanceQueryKey({ employeeId: attendanceEmployeeId }), rec);
      invalidate();
      toast({
        title: ar ? 'تم تسجيل الدخول بنجاح ✓' : 'Clock-in successful ✓',
        description: ar ? `الموقع: ${selectedLocation.name}` : `Location: ${selectedLocation.name}`,
      });
      if (rec?.isLate) {
        const work9 = new Date(); work9.setHours(9, 0, 0, 0);
        setLateMinutes(differenceInMinutes(new Date(rec.clockIn!), work9));
        setPendingRecId(rec.id ?? null);
        setJustText('');
        setShowLateIn(true);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: ar ? 'تعذر تسجيل الدخول' : 'Clock-in failed',
        description: error?.error || error?.message || (ar ? 'حاول مرة أخرى.' : 'Please try again.'),
      });
    }
  };

  const handleClockOut = async () => {
    if (!attendanceEmployeeId) {
      toast({
        variant: 'destructive',
        title: ar ? 'لا يوجد ملف موظف مرتبط' : 'No employee profile linked',
        description: ar ? 'سجّل الخروج ثم الدخول مجدداً لتحديث بيانات الحساب.' : 'Sign out and sign in again to refresh your account profile.',
      });
      return;
    }
    try {
      const rec = await clockOutMutation.mutateAsync({ data: { employeeId: attendanceEmployeeId } });
      queryClient.setQueryData(getGetTodayAttendanceQueryKey({ employeeId: attendanceEmployeeId }), rec);
      invalidate();
      toast({ title: ar ? 'تم تسجيل الخروج بنجاح ✓' : 'Clock-out successful ✓' });
      const outHour = new Date(rec.clockOut!).getHours();
      setPendingRecId(rec.id ?? null);
      setJustText('');
      if (outHour >= OVERTIME_THRESHOLD) {
        setLateOutReason('overtime');
        setShowLateOut(true);
      } else if (outHour < WORK_END_HOUR) {
        setShowEarlyOut(true);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: ar ? 'تعذر تسجيل الخروج' : 'Clock-out failed',
        description: error?.error || error?.message || (ar ? 'حاول مرة أخرى.' : 'Please try again.'),
      });
    }
  };

  const submitJustification = async (notes: string, justificationType: 'late' | 'early' | 'overtime' | 'other') => {
    if (!pendingRecId) return;
    try {
      await updateMutation.mutateAsync({
        id: pendingRecId,
        data: { notes, justificationType, justificationStatus: 'pending', paymentStatus: 'pending' },
      });
      invalidate();
    } catch {}
  };

  const handleLateInSubmit = async () => {
    await submitJustification(justText || (ar ? 'تأخير — بدون سبب' : 'Late — no reason given'), 'late');
    setShowLateIn(false); setJustText('');
  };
  const handleEarlyOutSubmit = async () => {
    await submitJustification(justText || (ar ? 'خروج مبكر — بدون سبب' : 'Early out — no reason given'), 'early');
    setShowEarlyOut(false); setJustText('');
  };
  const handleLateOutSubmit = async () => {
    let notes = '';
    if (lateOutReason === 'overtime')  notes = ar ? 'عمل إضافي' : 'Overtime work';
    if (lateOutReason === 'forgot')    notes = ar ? 'نسيت تسجيل الخروج — لا يُحتسب إضافي' : 'Forgot to clock out — not overtime';
    if (lateOutReason === 'other')     notes = justText || (ar ? 'خروج متأخر — بدون سبب' : 'Late out — no reason given');
    await submitJustification(notes, lateOutReason === 'overtime' ? 'overtime' : 'other');
    setShowLateOut(false); setJustText(''); setLateOutReason('overtime');
  };

  /* ── stats ── */
  const rows      = attendanceData?.attendance || [];
  const totalH    = rows.reduce((s, r) => s + Number(r.totalHours || 0), 0);
  const lateCount = rows.filter(r => r.isLate || r.status === 'late').length;
  const openCount = rows.filter(r => r.clockIn && !r.clockOut).length;

  const stats = [
    { label: ar ? 'إجمالي الساعات'  : 'Total Hours',   value: `${totalH.toFixed(1)}h`, gradient: 'from-blue-500 to-cyan-500',      icon: Timer        },
    { label: ar ? 'إجمالي السجلات'  : 'Total Records', value: String(rows.length),      gradient: 'from-indigo-500 to-purple-500',  icon: CalendarDays },
    { label: ar ? 'تأخيرات'          : 'Late Arrivals', value: String(lateCount),        gradient: 'from-amber-500 to-orange-500',   icon: AlertTriangle},
    { label: ar ? 'قيد الدوام'       : 'Active Now',    value: String(openCount),        gradient: 'from-emerald-500 to-teal-500',   icon: TrendingUp   },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header ── */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t('attendance')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t('trackAttendanceDesc')}</p>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* ════════════════ CARD 1 — CLOCK STATION ════════════════ */}
        <div className="lg:col-span-2 rounded-3xl text-center bg-gradient-to-br from-[#0d0d0d] to-[#1a1a2e] border border-white/10 text-white relative overflow-hidden shadow-2xl card-3d">
          {/* glow */}
          <div className="absolute inset-0 opacity-30 pointer-events-none"
               style={{ backgroundImage: `radial-gradient(circle at 50% -10%, ${isClockedIn ? '#22c55e' : '#6366f1'} 0%, transparent 65%)` }} />

          <div className="relative z-10 p-7 flex flex-col items-center gap-5">
            {/* Live / Off Duty badge */}
            {isClockedIn ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-white/40 text-xs font-bold tracking-widest uppercase border border-white/10">
                <span className="w-2 h-2 rounded-full bg-white/30" /> OFF DUTY
              </div>
            )}

            {/* Clock */}
            <div className="text-center">
              <h2 className="text-5xl font-bold font-mono tracking-tighter"
                  style={{ textShadow: '0 0 30px rgba(255,255,255,0.2)' }}>
                {format(now, 'HH:mm:ss')}
              </h2>
              <p className="text-white/45 text-sm mt-2 font-medium">{format(now, 'EEEE, MMMM d, yyyy')}</p>
            </div>

            {/* Clocked-in info */}
            {isClockedIn && todayRecord?.clockIn && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-data w-full justify-center">
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span className="text-white/70">{ar ? 'دخل الساعة' : 'Clocked in at'}</span>
                <span className="text-emerald-400 font-semibold">{format(new Date(todayRecord.clockIn), 'HH:mm')}</span>
                {todayRecord.isLate && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">{ar ? 'متأخر' : 'LATE'}</span>
                )}
              </div>
            )}

            {/* Location selector */}
            <div className="w-full">
              <label className="text-white/40 text-xs font-medium mb-1.5 block text-left">
                {ar ? 'اختر الموقع' : 'Select Location'}
              </label>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger className="bg-white/5 border-white/15 text-white rounded-xl h-10 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={String(location.id)}>
                      {location.name}
                      {location.city ? ` — ${location.city}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!locationsLoading && locations.length === 0 && (
                <p className="mt-2 text-xs text-amber-300">
                  {ar ? 'لا توجد مواقع مضافة. اطلب من المدير إضافة موقع من قسم مواقع العمل.' : 'No work locations are configured yet. Ask an administrator to add one.'}
                </p>
              )}
              {/* GPS detect button — always visible when GPS method is selected */}
              {checkMethod === 'gps' && (
                <button
                  type="button"
                  onClick={detectGPS}
                  disabled={gpsLoading}
                  className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold text-sm transition-all
                    ${gpsCoords
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {gpsLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{ar ? 'جارٍ تحديد الموقع…' : 'Detecting…'}</>
                    : gpsCoords
                      ? <><Navigation className="w-4 h-4" />{ar ? 'تم تحديد الموقع ✓' : 'Location detected ✓'}</>
                      : <><Navigation className="w-4 h-4" />{ar ? 'تحديد الموقع الجغرافي' : 'Detect GPS Location'}</>
                  }
                </button>
              )}
              {/* GPS status detail row */}
              {checkMethod === 'gps' && (
                <div className="mt-2 rounded-xl bg-white/5 border border-white/10 text-xs overflow-hidden">
                  <div className="px-3 py-2 flex items-center gap-2 flex-wrap">
                    {gpsLoading ? (
                      <><Loader2 className="w-3 h-3 animate-spin text-indigo-400 flex-shrink-0" /><span className="text-white/50">{ar ? 'جارٍ تحديد الموقع الجغرافي…' : 'Detecting location…'}</span></>
                    ) : gpsCoords ? (
                      <>
                        <Navigation className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-300 flex-1 leading-snug">
                          {gpsAddress ?? `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}`}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition-all text-[10px] font-semibold"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          Google Maps
                        </a>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span className="text-amber-300 flex-1">{ar ? 'تعذّر تحديد الموقع' : 'Could not detect location'}</span>
                      </>
                    )}
                  </div>
                  {/* GPS retry button — shown when not loading and no coords */}
                  {!gpsLoading && !gpsCoords && (
                    <button
                      type="button"
                      onClick={detectGPS}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/35 border-t border-indigo-500/25 text-indigo-300 hover:text-indigo-200 font-semibold transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {ar ? 'تحديد الموقع الجغرافي' : 'Detect GPS Location'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Check method selector */}
            <div className="w-full">
              <label className="text-white/40 text-xs font-medium mb-2 block text-left">
                {ar ? 'طريقة التسجيل' : 'Check-in Method'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setCheckMethod(m.id)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[11px] font-semibold transition-all
                      ${checkMethod === m.id
                        ? 'bg-indigo-500 text-white shadow-[0_0_16px_rgba(99,102,241,0.5)]'
                        : 'bg-white/5 text-white/45 hover:bg-white/10 border border-white/10'}`}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo capture */}
            <div className="w-full">
              <label className="text-white/40 text-xs font-medium mb-1.5 block text-left">
                {ar ? 'صورة توثيق (اختياري)' : 'Proof Photo (optional)'}
              </label>
              {clockPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-white/15">
                  <img src={clockPhoto} alt="proof" className="w-full h-24 object-cover" />
                  <button onClick={() => setClockPhoto(null)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-1">
                    <span className="text-[10px] text-white/70">{ar ? 'صورة مُرفقة ✓' : 'Photo attached ✓'}</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => photoInputRef.current?.click()}
                        className="w-full h-16 rounded-xl border border-dashed border-white/20 bg-white/3 hover:bg-white/7 flex items-center justify-center gap-2 text-white/40 hover:text-white/70 transition text-xs">
                  <Camera className="w-4 h-4" />
                  {ar ? 'التقط أو ارفع صورة' : 'Capture or upload photo'}
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
                     className="hidden" onChange={handleClockPhotoChange} />
            </div>

            {/* Clock-In / Clock-Out button */}
            <div className="w-full pt-1">
              {todayLoading ? (
                <div className="flex justify-center h-14 items-center"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
              ) : isClockedIn ? (
                <button onClick={handleClockOut}
                        disabled={clockOutMutation.isPending}
                        className="w-full h-14 rounded-2xl font-bold text-lg transition flex items-center justify-center gap-3 pressable
                                   bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500
                                   shadow-[0_0_30px_rgba(239,68,68,0.4)] text-white">
                  {clockOutMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                  {ar ? 'تسجيل الخروج' : 'Clock Out'}
                </button>
              ) : (
                <button onClick={handleClockIn}
                        disabled={clockInMutation.isPending}
                        className="w-full h-14 rounded-2xl font-bold text-lg transition flex items-center justify-center gap-3 pressable
                                   bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400
                                   shadow-[0_0_30px_rgba(16,185,129,0.4)] text-teal-950">
                  {clockInMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  {ar ? 'تسجيل الدخول' : 'Clock In'}
                </button>
              )}
            </div>

            <p className="text-xs text-white/30 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> {selectedLocation?.name || (ar ? 'لم يتم اختيار موقع' : 'No location selected')}
            </p>
          </div>
        </div>

        {/* ════════════════ RIGHT COLUMN ════════════════ */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* Today status mini-card */}
          <div className="card-3d rounded-2xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg truncate">{user?.fullName}</div>
              <div className="text-sm mt-1">
                {isClockedIn ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />{ar ? 'مسجّل الدخول' : 'Currently clocked in'}
                  </span>
                ) : todayRecord?.clockOut ? (
                  <span className="inline-flex items-center gap-1.5 text-blue-500 font-medium bg-blue-500/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />{ar ? 'مسجّل الخروج' : 'Clocked out'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium bg-gray-500/10 px-2 py-1 rounded-lg" style={{ color: 'var(--muted)' }}>
                    <AlertCircle className="w-4 h-4" />{ar ? 'لم يُسجَّل الدخول بعد' : 'Not clocked in yet'}
                  </span>
                )}
              </div>
            </div>
            {todayRecord && (
              <div className="text-right flex-shrink-0">
                {todayRecord.clockIn && (
                  <div className="text-xs text-muted-foreground">{ar ? 'دخول' : 'In'}: <span className="font-data font-bold text-foreground">{format(new Date(todayRecord.clockIn), 'HH:mm')}</span></div>
                )}
                {todayRecord.clockOut && (
                  <div className="text-xs text-muted-foreground mt-0.5">{ar ? 'خروج' : 'Out'}: <span className="font-data font-bold text-foreground">{format(new Date(todayRecord.clockOut), 'HH:mm')}</span></div>
                )}
                {todayRecord.totalHours && (
                  <div className="text-xs text-muted-foreground mt-0.5">{ar ? 'المجموع' : 'Total'}: <span className="font-data font-bold text-indigo-500">{hoursLabel(todayRecord.totalHours, locale)}</span></div>
                )}
              </div>
            )}
          </div>

          {/* ════ CARD 2 — PHOTO DOCUMENTATION ════ */}
          <div className="card-3d rounded-2xl overflow-hidden">
            {/* gradient header */}
            <div className="h-20 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 relative flex items-center px-5 gap-3">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #a78bfa, transparent 60%)' }} />
              <div className="relative z-10 w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                <FileImage className="w-5 h-5 text-white" />
              </div>
              <div className="relative z-10">
                <h3 className="font-display font-bold text-white">{ar ? 'توثيق العمل بالصورة' : 'Work Photo Documentation'}</h3>
                <p className="text-white/60 text-xs">{ar ? 'التقط أو ارفع صورة توثيق دوامك' : 'Capture or upload a photo as proof of attendance'}</p>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* hidden multi-file input */}
              <input
                ref={docPhotoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleDocPhotoChange}
              />

              {/* gallery of added photos */}
              {docPhotos.length > 0 && (
                <div className="flex flex-col gap-3">
                  {/* count badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-emerald-500 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      {ar
                        ? `${docPhotos.length} ${docPhotos.length === 1 ? 'صورة مضافة' : 'صور مضافة'}`
                        : `${docPhotos.length} photo${docPhotos.length > 1 ? 's' : ''} added`}
                    </div>
                    {docPhotos.length > 1 && (
                      <button
                        onClick={() => setDocPhotos([])}
                        className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
                      >
                        {ar ? 'حذف الكل' : 'Delete all'}
                      </button>
                    )}
                  </div>

                  {/* photo cards */}
                  <div className="flex flex-col gap-2">
                    {docPhotos.map((photo, idx) => (
                      <div key={photo.id} className="relative rounded-xl overflow-hidden border border-emerald-500/25 bg-black/10">
                        <img src={photo.src} alt={`work doc ${idx + 1}`} className="w-full h-44 object-cover" />
                        {/* overlay actions */}
                        <div className="absolute inset-x-0 bottom-0 flex gap-2 p-2 bg-gradient-to-t from-black/70 to-transparent">
                          {/* download */}
                          <button
                            onClick={() => downloadDocPhoto(photo.src, photo.name)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold transition-all backdrop-blur-sm"
                          >
                            <Download className="w-3 h-3" />
                            {ar ? 'تحميل' : 'Download'}
                          </button>
                          {/* delete */}
                          <button
                            onClick={() => removeDocPhoto(photo.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-600/70 hover:bg-red-600 border border-red-500/30 text-white text-xs font-semibold transition-all backdrop-blur-sm"
                          >
                            <X className="w-3 h-3" />
                            {ar ? 'حذف' : 'Delete'}
                          </button>
                        </div>
                        {/* index badge */}
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white text-[10px] font-bold backdrop-blur-sm">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* add photo button — always visible */}
              <button
                onClick={() => docPhotoInputRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center gap-2
                           border-purple-300/40 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-400/60 text-purple-400"
              >
                <div className="w-9 h-9 rounded-full bg-purple-500/15 flex items-center justify-center">
                  <ImagePlus className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">
                  {docPhotos.length > 0
                    ? (ar ? 'إضافة المزيد من الصور' : 'Add more photos')
                    : (ar ? 'اضغط للتقاط أو رفع صورة' : 'Tap to capture or upload')}
                </span>
                <span className="text-xs text-purple-400/60">
                  {ar ? 'يمكنك اختيار عدة صور دفعة واحدة' : 'You can pick multiple at once'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="relative rounded-2xl card-3d overflow-hidden p-6 flex flex-col justify-between gap-4">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-[0.07] pointer-events-none`} />
            <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${s.gradient}`} />
            <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <div className="relative">
              <div className="text-4xl font-bold font-data leading-none">{s.value}</div>
              <div className="text-xs mt-2 font-semibold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════ CARD 3 — ATTENDANCE LOG ════════════════ */}
      <div className="card-3d rounded-2xl overflow-hidden" data-testid="section-recent-attendance">
        {/* Header */}
        <div className="h-20 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 relative flex items-center px-5 gap-3">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #6366f1, transparent 60%)' }} />
          <div className="relative z-10 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="font-display font-bold text-white">{ar ? 'سجل الحضور' : 'Attendance Log'}</h3>
            <p className="text-white/50 text-xs">{rows.length} {ar ? 'سجل' : 'records'}</p>
          </div>
          {/* Legend */}
          <div className="relative z-10 hidden sm:flex items-center gap-3 text-[10px]">
            {[
              { label: ar ? 'حاضر' : 'Present', color: 'bg-emerald-500' },
              { label: ar ? 'متأخر'  : 'Late',    color: 'bg-amber-500'  },
              { label: ar ? 'غائب'   : 'Absent',  color: 'bg-red-500'    },
              { label: ar ? 'نصف يوم': 'Half',    color: 'bg-blue-500'   },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1 text-white/60">
                <span className={`w-2 h-2 rounded-full ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--muted-bg)' }} />
              ))}
            </div>
          ) : !rows.length ? (
            <div className="py-14 text-center">
              <Hourglass className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm">{ar ? 'لا توجد سجلات حضور حتى الآن' : 'No attendance records yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.slice().reverse().map((rec, idx) => {
                const col = statusColors(rec.status);
                const isLate = rec.isLate;
                const hasNotes = rec.notes;
                const outHour = rec.clockOut ? new Date(rec.clockOut).getHours() : null;
                const isEarlyOut = outHour !== null && outHour < WORK_END_HOUR;
                const isOT = outHour !== null && outHour >= OVERTIME_THRESHOLD;
                return (
                  <div key={rec.id}
                       data-testid={`card-attendance-${rec.id}`}
                       className={`rounded-xl border-l-4 p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fadeIn stagger-${(idx % 4) + 1} ${col.row}`}>

                    {/* Avatar + name + date */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${col.dot} bg-opacity-20 flex items-center justify-center flex-shrink-0 border border-current/20`}>
                        <span className="font-bold text-base leading-none" style={{ color: 'inherit' }}>
                          {rec.employeeName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate text-foreground">{rec.employeeName || '—'}</div>
                        <div className="text-xs text-muted-foreground">
                          {rec.date ? format(new Date(rec.date), 'EEEE, MMM d, yyyy') : '—'}
                        </div>
                        {/* Notes / justification */}
                        {hasNotes && (
                          <div className="text-[11px] mt-0.5 text-muted-foreground italic truncate max-w-[220px]">
                            💬 {rec.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Times + badges */}
                    <div className="flex items-center gap-3 sm:flex-shrink-0 justify-between sm:justify-end">
                      {/* Times */}
                      <div className="text-center">
                        <div className="font-data font-bold text-sm bg-muted/50 px-2.5 py-1.5 rounded-lg text-foreground whitespace-nowrap">
                          {rec.clockIn ? format(new Date(rec.clockIn), 'HH:mm') : '--:--'}
                          <span className="text-muted-foreground mx-1.5">→</span>
                          {rec.clockOut ? format(new Date(rec.clockOut), 'HH:mm') : '--:--'}
                        </div>
                        {rec.totalHours && (
                          <div className="text-[11px] text-muted-foreground mt-1 font-medium">{hoursLabel(rec.totalHours, locale)}</div>
                        )}
                      </div>

                      {/* Location */}
                      {rec.location && (
                        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="max-w-[80px] truncate">{rec.location}</span>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="flex flex-col gap-1 items-end">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${col.badge}`}>
                          {rec.status}
                        </span>
                        {isLate && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            {ar ? '⏰ متأخر' : '⏰ Late'}
                          </span>
                        )}
                        {isEarlyOut && !isOT && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-orange-500/15 text-orange-500">
                            {ar ? '↩ مبكر' : '↩ Early out'}
                          </span>
                        )}
                        {isOT && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-purple-500/15 text-purple-500">
                            {ar ? '➕ إضافي' : '➕ Overtime'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════ DIALOG — Late Arrival Justification ════════════════ */}
      <Dialog open={showLateIn} onOpenChange={setShowLateIn}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <DialogHeader className="space-y-0.5">
              <DialogTitle>{ar ? 'تبرير الدخول المتأخر' : 'Late Arrival Justification'}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {ar ? `تأخرت ${lateMinutes} دقيقة عن موعد الدوام` : `You are ${lateMinutes} minute(s) late`}
              </p>
            </DialogHeader>
          </div>
          <Textarea
            value={justText}
            onChange={e => setJustText(e.target.value)}
            placeholder={ar ? 'اكتب سبب التأخير…' : 'Enter your reason for being late…'}
            className="resize-none min-h-[100px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowLateIn(false); setJustText(''); }}>
              {ar ? 'تخطي' : 'Skip'}
            </Button>
            <Button onClick={handleLateInSubmit} disabled={updateMutation.isPending}
                    className="bg-amber-500 hover:bg-amber-600 text-white">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {ar ? 'إرسال التبرير' : 'Submit Justification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ DIALOG — Early Departure ════════════════ */}
      <Dialog open={showEarlyOut} onOpenChange={setShowEarlyOut}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-orange-500" />
            </div>
            <DialogHeader className="space-y-0.5">
              <DialogTitle>{ar ? 'مبرر الخروج المبكر' : 'Early Departure Justification'}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {ar ? 'خرجت قبل انتهاء وقت الدوام الرسمي' : `You clocked out before the end of the workday (${WORK_END_HOUR}:00)`}
              </p>
            </DialogHeader>
          </div>
          <Textarea
            value={justText}
            onChange={e => setJustText(e.target.value)}
            placeholder={ar ? 'اكتب سبب الخروج المبكر…' : 'Enter your reason for leaving early…'}
            className="resize-none min-h-[100px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowEarlyOut(false); setJustText(''); }}>
              {ar ? 'تخطي' : 'Skip'}
            </Button>
            <Button onClick={handleEarlyOutSubmit} disabled={updateMutation.isPending}
                    className="bg-orange-500 hover:bg-orange-600 text-white">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {ar ? 'إرسال المبرر' : 'Submit Reason'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ DIALOG — Late Clock-out ════════════════ */}
      <Dialog open={showLateOut} onOpenChange={setShowLateOut}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0">
              <Hourglass className="w-5 h-5 text-purple-500" />
            </div>
            <DialogHeader className="space-y-0.5">
              <DialogTitle>{ar ? 'سبب الخروج المتأخر' : 'Late Clock-out Reason'}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {ar ? 'سجّلت الخروج بعد الوقت الرسمي' : `You clocked out after ${OVERTIME_THRESHOLD}:00`}
              </p>
            </DialogHeader>
          </div>

          <div className="space-y-3">
            {/* Reason selector */}
            {([
              { value: 'overtime', labelEn: 'Overtime work (counts as overtime)', labelAr: 'عمل إضافي (يُحتسب)' },
              { value: 'forgot',   labelEn: 'Forgot to clock out (not overtime)',  labelAr: 'نسيت تسجيل الخروج (لا يُحتسب إضافياً)' },
              { value: 'other',    labelEn: 'Other reason…',                       labelAr: 'سبب آخر…' },
            ] as Array<{ value: LateOutReason; labelEn: string; labelAr: string }>).map(opt => (
              <button key={opt.value}
                      onClick={() => setLateOutReason(opt.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm font-medium flex items-center gap-3
                        ${lateOutReason === opt.value
                          ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : 'border-border bg-muted/30 text-foreground hover:bg-muted/60'}`}>
                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                  ${lateOutReason === opt.value ? 'border-purple-500' : 'border-muted-foreground/40'}`}>
                  {lateOutReason === opt.value && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                </span>
                {ar ? opt.labelAr : opt.labelEn}
              </button>
            ))}

            {/* Other textarea */}
            {lateOutReason === 'other' && (
              <Textarea
                value={justText}
                onChange={e => setJustText(e.target.value)}
                placeholder={ar ? 'اكتب سبب الخروج المتأخر…' : 'Describe your reason…'}
                className="resize-none min-h-[80px]"
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowLateOut(false); setJustText(''); setLateOutReason('overtime'); }}>
              {ar ? 'تخطي' : 'Skip'}
            </Button>
            <Button onClick={handleLateOutSubmit} disabled={updateMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700 text-white">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {ar ? 'تأكيد' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
