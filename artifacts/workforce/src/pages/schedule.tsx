import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useCreateSchedule, useGetEmployees, useGetSchedules, getGetEmployeesQueryKey, getGetSchedulesQueryKey, Schedule, ScheduleInputShiftType } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import DetailDialog from '@/components/detail-dialog';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

const shiftTimes: Record<ScheduleInputShiftType, { time: string; color: string }> = { morning: { time: '09:00–17:00', color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30' }, evening: { time: '16:00–00:00', color: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/30' }, night: { time: '00:00–08:00', color: 'bg-slate-700/10 text-slate-400 border-slate-600/30' }, off: { time: '', color: 'bg-gray-100 dark:bg-gray-800/30 text-gray-400 border-dashed' } };

export default function SchedulePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Schedule | null>(null);
  const days = Array.from({ length: 7 }).map((_, index) => addDays(currentWeek, index));
  const params = { companyId: user?.companyId || 0, startDate: format(days[0], 'yyyy-MM-dd'), endDate: format(days[6], 'yyyy-MM-dd') };
  const { data: scheduleData, isLoading } = useGetSchedules(params, { query: { enabled: !!user?.companyId, queryKey: getGetSchedulesQueryKey(params) } });
  const { data: employeesData } = useGetEmployees({ companyId: user?.companyId || 0 }, { query: { enabled: !!user?.companyId, queryKey: getGetEmployeesQueryKey({ companyId: user?.companyId || 0 }) } });
  const createMutation = useCreateSchedule();
  const schedules = scheduleData?.schedules || [];
  const employees = employeesData?.employees || [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetSchedulesQueryKey() });
  const shiftLabel = (type: ScheduleInputShiftType) => t(type as any);
  const map = useMemo(() => new Map(schedules.map((schedule) => [`${schedule.employeeId}-${schedule.date}`, schedule])), [schedules]);

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const shiftType = String(form.get('shiftType') || 'morning') as ScheduleInputShiftType;
    try {
      await createMutation.mutateAsync({ data: { employeeId: Number(form.get('employeeId')), date: String(form.get('date')), shiftType, startTime: shiftTimes[shiftType].time.split('–')[0], endTime: shiftTimes[shiftType].time.split('–')[1] } });
      toast({ title: t('savedSuccessfully') }); setShowForm(false); refresh();
    } catch { toast({ variant: 'destructive', title: t('actions'), description: 'Could not create this shift.' }); }
  };

  return <div className="space-y-6 animate-fadeIn">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl font-bold">{t('schedule')}</h1><p className="text-sm" style={{ color: 'var(--muted)' }}>{t('weeklyShiftDesc')}</p></div><div className="flex items-center gap-3"><button aria-label="Previous week" onClick={() => setCurrentWeek((week) => addDays(week, -7))} className="p-2 rounded-xl hover:opacity-80" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><ChevronLeft className="w-5 h-5" /></button><span className="text-sm font-medium px-3 py-2 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>{format(currentWeek, 'MMM d')} – {format(addDays(currentWeek, 6), 'MMM d, yyyy')}</span><button aria-label="Next week" onClick={() => setCurrentWeek((week) => addDays(week, 7))} className="p-2 rounded-xl hover:opacity-80" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><ChevronRight className="w-5 h-5" /></button><button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm"><Plus className="w-4 h-4" />{t('addShift')}</button></div></div>
    <div className="flex flex-wrap gap-3">{(Object.keys(shiftTimes) as ScheduleInputShiftType[]).map((key) => <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${shiftTimes[key].color}`}>{shiftLabel(key)}</div>)}</div>
    <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><div className="min-w-[900px]"><div className="grid border-b" style={{ gridTemplateColumns: '180px repeat(7, 1fr)', borderColor: 'var(--border)' }}><div className="p-4 text-sm font-medium text-muted-foreground">{t('employee')}</div>{days.map((day) => <div key={day.toISOString()} className="p-4 text-center border-l text-sm" style={{ borderColor: 'var(--border)' }}><div className={`font-semibold ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-indigo-500' : ''}`}>{format(day, 'EEE')}</div><div className="text-xs mt-0.5 text-muted-foreground">{format(day, 'MMM d')}</div></div>)}</div>{isLoading ? <div className="p-10 text-center text-muted-foreground">{t('loading')}</div> : employees.map((employee) => <div key={employee.id} className="grid border-t" style={{ gridTemplateColumns: '180px repeat(7, 1fr)', borderColor: 'var(--border)' }}><div className="p-4 flex items-center gap-3 border-r" style={{ borderColor: 'var(--border)' }}><div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{employee.fullName?.split(' ').map((name) => name[0]).join('')}</div><span className="text-sm font-medium truncate">{employee.fullName}</span></div>{days.map((day) => { const record = map.get(`${employee.id}-${format(day, 'yyyy-MM-dd')}`); const type = record?.shiftType || 'off'; return <div key={day.toISOString()} className="p-2 border-l" style={{ borderColor: 'var(--border)' }}><button onClick={() => record && setSelected(record)} className={`w-full rounded-lg border p-2 text-xs font-medium text-center ${shiftTimes[type].color} ${record ? 'hover:shadow-md' : 'cursor-default'}`}><div>{shiftLabel(type)}</div>{shiftTimes[type].time && <div className="opacity-60 mt-0.5 text-[10px]">{record?.startTime || shiftTimes[type].time.split('–')[0]}–{record?.endTime || shiftTimes[type].time.split('–')[1]}</div>}</button></div>; })}</div>)}</div></div>
    {showForm && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}><div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'var(--card)' }} onClick={(event) => event.stopPropagation()}><h2 className="text-xl font-bold mb-6">{t('addShift')}</h2><form onSubmit={create} className="space-y-4"><label className="block text-sm font-medium">{t('employee')}<select required name="employeeId" defaultValue={String(employees[0]?.id || '')} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select></label><label className="block text-sm font-medium">{t('date')}<input required type="date" name="date" defaultValue={format(currentWeek, 'yyyy-MM-dd')} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} /></label><label className="block text-sm font-medium">{t('shiftType')}<select name="shiftType" defaultValue="morning" className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>{(Object.keys(shiftTimes) as ScheduleInputShiftType[]).map((key) => <option key={key} value={key}>{shiftLabel(key)}</option>)}</select></label><div className="flex gap-3"><button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl px-4 py-2" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>{t('cancel')}</button><button type="submit" disabled={createMutation.isPending || !employees.length} className="flex-1 rounded-xl px-4 py-2 bg-indigo-500 text-white">{t('save')}</button></div></form></div></div>}
    <DetailDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={`${t('schedule')} — ${selected?.employeeName || ''}`} items={selected ? [{ label: t('employee'), value: selected.employeeName || selected.employeeId }, { label: t('date'), value: selected.date }, { label: t('shiftType'), value: selected.shiftType }, { label: t('startTime'), value: selected.startTime }, { label: t('endTime'), value: selected.endTime }, { label: t('location'), value: selected.isRemote ? 'Remote' : 'Office' }, { label: t('reason'), value: selected.notes }] : []} />
  </div>;
}