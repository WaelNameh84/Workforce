import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  useCreateSchedule,
  useGetEmployees,
  useGetSchedules,
  getGetEmployeesQueryKey,
  getGetSchedulesQueryKey,
  Schedule,
  ScheduleInputShiftType,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import DetailDialog from '@/components/detail-dialog';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  UserRound,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, addDays, startOfWeek } from 'date-fns';

const shiftTimes: Record<ScheduleInputShiftType, { time: string; color: string }> = {
  morning: {
    time: '09:00–17:00',
    color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30',
  },
  evening: {
    time: '16:00–00:00',
    color: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/30',
  },
  night: {
    time: '00:00–08:00',
    color: 'bg-slate-700/10 text-foreground border-slate-600/30',
  },
  off: {
    time: '',
    color: 'bg-muted/40 text-muted-foreground border-dashed',
  },
};

export default function ScheduleCards() {
  const { user } = useAuth();
  const { t, translateText } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Schedule | null>(null);

  const days = Array.from({ length: 7 }).map((_, index) => addDays(currentWeek, index));
  const params = {
    companyId: user?.companyId || 0,
    startDate: format(days[0], 'yyyy-MM-dd'),
    endDate: format(days[6], 'yyyy-MM-dd'),
  };
  const { data: scheduleData, isLoading } = useGetSchedules(params, {
    query: { enabled: !!user?.companyId, queryKey: getGetSchedulesQueryKey(params) },
  });
  const { data: employeesData } = useGetEmployees(
    { companyId: user?.companyId || 0 },
    {
      query: {
        enabled: !!user?.companyId,
        queryKey: getGetEmployeesQueryKey({ companyId: user?.companyId || 0 }),
      },
    },
  );
  const createMutation = useCreateSchedule();
  const schedules = scheduleData?.schedules || [];
  const employees = employeesData?.employees || [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetSchedulesQueryKey() });
  const shiftLabel = (type: ScheduleInputShiftType) => t(type as any);
  const scheduleMap = useMemo(
    () => new Map(schedules.map((schedule) => [`${schedule.employeeId}-${schedule.date}`, schedule])),
    [schedules],
  );

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const shiftType = String(form.get('shiftType') || 'morning') as ScheduleInputShiftType;
    try {
      await createMutation.mutateAsync({
        data: {
          employeeId: Number(form.get('employeeId')),
          date: String(form.get('date')),
          shiftType,
          startTime: shiftTimes[shiftType].time.split('–')[0],
          endTime: shiftTimes[shiftType].time.split('–')[1],
        },
      });
      toast({ title: t('savedSuccessfully') });
      setShowForm(false);
      refresh();
    } catch {
       toast({ variant: 'destructive', title: t('actions'), description: translateText('Could not create this shift.') });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            <CalendarClock className="h-4 w-4" />
            {t('schedule')}
          </div>
          <h1 className="font-display text-3xl font-bold">{t('schedule')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {t('weeklyShiftDesc')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-card border border-border shadow-sm">
            <button
               aria-label={translateText('Previous week')}
              onClick={() => setCurrentWeek((week) => addDays(week, -7))}
              className="rounded-lg p-2 transition hover:bg-muted-bg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-foreground">
              {format(currentWeek, 'MMM d')} – {format(addDays(currentWeek, 6), 'MMM d')}
            </span>
            <button
               aria-label={translateText('Next week')}
              onClick={() => setCurrentWeek((week) => addDays(week, 7))}
              className="rounded-lg p-2 transition hover:bg-muted-bg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 h-12 text-sm font-bold text-white shadow-lg shadow-teal-500/25 hover:-translate-y-1 transition-transform"
          >
            <Plus className="h-5 w-5" />
            {t('addShift')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {(Object.keys(shiftTimes) as ScheduleInputShiftType[]).map((key) => (
          <div key={key} className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider ${shiftTimes[key].color}`}>
            {shiftLabel(key)}
            {shiftTimes[key].time && <span className="ms-2 opacity-60 font-data">{shiftTimes[key].time}</span>}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <div key={item} className="card-3d h-[320px] animate-pulse bg-muted-bg" />)}
        </div>
      ) : !employees.length ? (
        <div className="card-3d rounded-2xl p-16 text-center text-muted-foreground font-medium">{t('noEmployeesFound')}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {employees.map((employee, employeeIndex) => (
            <section
              key={employee.id}
              className={`card-3d p-5 animate-fadeIn stagger-${(employeeIndex % 4) + 1}`}
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 font-bold text-foreground text-lg shadow-sm">
                  {employee.fullName?.split(' ').map((name) => name[0]).join('').slice(0, 2) || <UserRound className="h-6 w-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold text-lg">{employee.fullName}</h2>
                  <p className="truncate text-xs font-medium text-muted-foreground mt-0.5">{employee.position || employee.departmentName || t('employee')}</p>
                </div>
                <span className="rounded-lg bg-teal-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  {schedules.filter((item) => item.employeeId === employee.id).length} {t('total')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {days.map((day) => {
                  const date = format(day, 'yyyy-MM-dd');
                  const record = scheduleMap.get(`${employee.id}-${date}`);
                  const type = record?.shiftType || 'off';
                  const isToday = date === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <button
                      key={date}
                      onClick={() => record && setSelected(record)}
                      disabled={!record}
                      className={`min-h-[96px] rounded-xl border-2 p-3 text-start transition-all duration-200 ${shiftTimes[type].color} ${record ? 'hover:-translate-y-1 hover:shadow-md cursor-pointer' : 'opacity-70'} ${isToday ? '!border-primary relative overflow-hidden' : ''}`}
                    >
                      {isToday && <div className="absolute inset-0 bg-primary/5" />}
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-primary' : 'opacity-60'}`}>
                        {format(day, 'EEE')}
                      </div>
                      <div className={`mt-0.5 text-xs font-bold ${isToday ? 'text-primary' : 'opacity-80'}`}>{format(day, 'MMM d')}</div>
                      <div className="mt-3 text-sm font-bold">{shiftLabel(type)}</div>
                      {record && shiftTimes[type].time && (
                        <div className="mt-1 text-[10px] font-data opacity-70 font-medium">
                          {record.startTime || shiftTimes[type].time.split('–')[0]}–{record.endTime || shiftTimes[type].time.split('–')[1]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('schedule')} · {format(currentWeek, 'MMM d')}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={`${t('actions')} ${employee.fullName}`}
                      className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted-bg transition"
                    >
                      {t('actions')}
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setShowForm(true)} className="gap-2 rounded-lg">
                      <Plus className="h-4 w-4" /> {t('addShift')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelected(schedules.find((item) => item.employeeId === employee.id) || null)} className="gap-2 rounded-lg">
                      <CalendarClock className="h-4 w-4" /> {t('viewProfile')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </section>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl card-3d" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-6 font-display text-2xl font-bold">{t('addShift')}</h2>
            <form onSubmit={create} className="space-y-5">
              <label className="block text-sm font-bold">
                {t('employee')}
                <select required name="employeeId" defaultValue={String(employees[0]?.id || '')} className="mt-2 w-full rounded-xl px-4 py-3 text-sm bg-background border border-border">
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold">
                {t('date')}
                <input required type="date" name="date" defaultValue={format(currentWeek, 'yyyy-MM-dd')} className="mt-2 w-full rounded-xl px-4 py-3 text-sm bg-background border border-border font-data" />
              </label>
              <label className="block text-sm font-bold">
                {t('shiftType')}
                <select name="shiftType" defaultValue="morning" className="mt-2 w-full rounded-xl px-4 py-3 text-sm bg-background border border-border">
                  {(Object.keys(shiftTimes) as ScheduleInputShiftType[]).map((key) => <option key={key} value={key}>{shiftLabel(key)}</option>)}
                </select>
              </label>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl px-4 py-3 font-bold bg-muted hover:bg-muted/80 transition-colors">{t('cancel')}</button>
                <button type="submit" disabled={createMutation.isPending || !employees.length} className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-3 font-bold text-white shadow-lg shadow-teal-500/25">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        title={`${t('schedule')} — ${selected?.employeeName || ''}`}
        items={selected ? [
          { label: t('employee'), value: selected.employeeName || selected.employeeId },
          { label: t('date'), value: selected.date },
          { label: t('shiftType'), value: selected.shiftType },
          { label: t('startTime'), value: selected.startTime },
          { label: t('endTime'), value: selected.endTime },
          { label: t('location'), value: selected.isRemote ? 'Remote' : 'Office' },
          { label: t('reason'), value: selected.notes },
        ] : []}
      />
    </div>
  );
}
