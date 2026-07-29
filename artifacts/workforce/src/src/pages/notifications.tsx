import { useMemo } from 'react';
import { useGetAttendance, useGetLeaves, useGetRequests, getGetAttendanceQueryKey, getGetLeavesQueryKey, getGetRequestsQueryKey } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { AlertCircle, ArrowLeft, ArrowRight, Bell, CalendarX, CheckCircle2, Timer } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { saveDetailAndNavigate } from '@/pages/detail';

type NotificationItem = {
  icon: typeof Timer;
  color: string;
  title: string;
  time: string;
  details: { label: string; value: string }[];
};

export default function Notifications() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const [, setLocation] = useLocation();
  const isArabic = locale === 'ar';
  const cid = user?.companyId || 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const intlLocale = locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US';

  const { data: attendanceData } = useGetAttendance(
    { companyId: cid, date: todayStr },
    { query: { enabled: !!cid, queryKey: getGetAttendanceQueryKey({ companyId: cid, date: todayStr }) } },
  );
  const { data: requestsData } = useGetRequests(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetRequestsQueryKey({ companyId: cid }) } },
  );
  const { data: leavesData } = useGetLeaves(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetLeavesQueryKey({ companyId: cid }) } },
  );

  const notifications = useMemo<NotificationItem[]>(() => {
    const attendance = (attendanceData as any)?.attendance || [];
    const requests = (requestsData as any)?.requests || [];
    const leaves = leavesData?.leaves || [];
    const lateToday = attendance.filter((item: any) => item.isLate);
    const pendingRequests = requests.filter((item: any) => item.status === 'pending');
    const pendingLeaves = leaves.filter((item: any) => item.status === 'pending');
    const date = (value: string | undefined) => value
      ? new Date(value).toLocaleDateString(intlLocale)
      : (isArabic ? 'اليوم' : locale === 'sv' ? 'Idag' : 'Today');
    const time = (value: string | undefined) => value
      ? new Date(value).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })
      : (isArabic ? 'اليوم' : locale === 'sv' ? 'Idag' : 'Today');

    return [
      ...lateToday.map((item: any) => ({
        icon: Timer,
        color: 'text-violet-300 bg-violet-500/15 border-violet-400/20',
        title: `${item.employeeName || (isArabic ? 'موظف' : 'Employee')} — ${isArabic ? 'حضور متأخر' : 'Late arrival'}`,
        time: time(item.clockIn),
        details: [
          { label: isArabic ? 'الموظف' : 'Employee', value: item.employeeName || '—' },
          { label: isArabic ? 'وقت الحضور' : 'Time in', value: time(item.clockIn) },
          { label: isArabic ? 'التاريخ' : 'Date', value: date(item.date) },
          { label: isArabic ? 'الموقع' : 'Location', value: item.location || '—' },
          { label: isArabic ? 'الطريقة' : 'Method', value: item.method || '—' },
        ],
      })),
      ...pendingRequests.map((item: any) => ({
        icon: AlertCircle,
        color: 'text-amber-300 bg-amber-500/15 border-amber-400/20',
        title: item.title || (isArabic ? 'طلب جديد بانتظار المراجعة' : 'New request pending review'),
        time: date(item.createdAt),
        details: [
          { label: isArabic ? 'نوع الطلب' : 'Request type', value: item.type || item.title || '—' },
          { label: isArabic ? 'الموظف' : 'Employee', value: item.employeeName || '—' },
          { label: isArabic ? 'الحالة' : 'Status', value: item.status || '—' },
          { label: isArabic ? 'التاريخ' : 'Date', value: date(item.createdAt) },
          { label: isArabic ? 'الوصف' : 'Description', value: item.description || item.notes || '—' },
        ],
      })),
      ...pendingLeaves.map((item: any) => ({
        icon: CalendarX,
        color: 'text-blue-300 bg-blue-500/15 border-blue-400/20',
        title: `${isArabic ? 'طلب إجازة' : 'Leave request'} — ${item.employeeName || (isArabic ? 'موظف' : 'Employee')}`,
        time: date(item.startDate),
        details: [
          { label: isArabic ? 'الموظف' : 'Employee', value: item.employeeName || '—' },
          { label: isArabic ? 'نوع الإجازة' : 'Leave type', value: item.type || '—' },
          { label: isArabic ? 'من' : 'From', value: date(item.startDate) },
          { label: isArabic ? 'إلى' : 'To', value: date(item.endDate) },
          { label: isArabic ? 'عدد الأيام' : 'Days', value: item.daysCount ? String(item.daysCount) : '—' },
          { label: isArabic ? 'السبب' : 'Reason', value: item.reason || '—' },
        ],
      })),
    ];
  }, [attendanceData, requestsData, leavesData, intlLocale, isArabic, locale]);

  const openNotification = (item: NotificationItem) => {
    saveDetailAndNavigate(setLocation, '/dashboard/detail', {
      title: item.title,
      subtitle: item.time,
      badge: isArabic ? 'الإشعارات' : 'Notifications',
      items: item.details,
    });
  };

  return (
    <div className="mx-auto max-w-3xl animate-fadeIn space-y-5" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">{isArabic ? 'مركز التنبيهات' : 'Alert center'}</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-white">
            <Bell className="h-6 w-6 text-amber-300" />
            {isArabic ? 'الإشعارات' : 'Notifications'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isArabic ? 'تابع الحالات التي تحتاج إلى انتباهك من مكان واحد.' : 'Keep track of the items that need your attention.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLocation('/dashboard')}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
        >
          {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {isArabic ? 'الرئيسية' : 'Dashboard'}
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950/70 via-slate-950/95 to-purple-950/70 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-black text-white">{isArabic ? 'آخر التنبيهات' : 'Recent alerts'}</h2>
            <p className="mt-1 text-[11px] font-bold text-slate-500">{notifications.length} {isArabic ? 'تنبيه' : 'alerts'}</p>
          </div>
          <span className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-300">
            <Bell className="h-4 w-4" />
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 className="text-base font-black text-white">{isArabic ? 'لا توجد إشعارات جديدة' : 'No new notifications'}</h2>
            <p className="max-w-sm text-xs font-bold leading-6 text-slate-500">
              {isArabic ? 'كل شيء هادئ الآن. ستظهر هنا طلبات المراجعة والتنبيهات الجديدة.' : 'Everything is quiet for now. New reviews and alerts will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  onClick={() => openNotification(item)}
                  className="group flex w-full items-start gap-3 px-5 py-4 text-start transition hover:bg-white/[.045] active:bg-white/[.08]"
                >
                  <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold leading-6 text-white">{item.title}</span>
                    <span className="mt-1 block text-xs font-bold text-slate-500">{item.time}</span>
                  </span>
                  <span className="mt-2 text-lg leading-none text-slate-600 transition group-hover:-translate-x-1 group-hover:text-indigo-300">
                    {isArabic ? '‹' : '›'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}