import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  useCreateLeave,
  useGetEmployees,
  useGetLeaves,
  useUpdateLeave,
  useDeleteLeave,
  getGetEmployeesQueryKey,
  getGetLeavesQueryKey,
  Leave,
  LeaveInputType,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import DetailDialog from '@/components/detail-dialog';
import { CheckCircle2, XCircle, Clock, FileText, Plus, Trash2, CalendarHeart } from 'lucide-react';

const leaveTypes: Array<{ type: LeaveInputType; color: string; hex: string }> = [
  { type: 'annual', color: 'from-blue-500 to-cyan-500', hex: '#06b6d4' },
  { type: 'sick', color: 'from-red-500 to-rose-500', hex: '#f43f5e' },
  { type: 'emergency', color: 'from-amber-500 to-orange-500', hex: '#f59e0b' },
  { type: 'maternity', color: 'from-pink-500 to-rose-500', hex: '#ec4899' },
  { type: 'paternity', color: 'from-purple-500 to-indigo-500', hex: '#8b5cf6' },
  { type: 'unpaid', color: 'from-gray-500 to-slate-500', hex: '#64748b' },
];

const statusColor = (status?: string) =>
  status === 'approved'
    ? 'bg-green-500/10 text-green-500'
    : status === 'rejected'
      ? 'bg-red-500/10 text-red-500'
      : 'bg-amber-500/10 text-amber-500';

function dayCount(start: string, end: string) {
  if (!start || !end) return 1;
  const from = new Date(`${start}T00:00:00`).getTime();
  const to = new Date(`${end}T00:00:00`).getTime();
  return Math.max(1, Math.floor((to - from) / 86400000) + 1);
}

export default function Leaves() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Leave | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const params = { companyId: user?.companyId || 0 };
  const { data, isLoading } = useGetLeaves(params, {
    query: { enabled: !!user?.companyId, queryKey: getGetLeavesQueryKey(params) },
  });
  const { data: employeesData } = useGetEmployees(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetEmployeesQueryKey({ companyId: user?.companyId || 0 }) } },
  );
  const createMutation = useCreateLeave();
  const updateMutation = useUpdateLeave();
  const deleteMutation = useDeleteLeave();
  const leaves = data?.leaves || [];

  const balances = useMemo(
    () =>
      leaveTypes.map((item) => {
        const used = leaves
          .filter((leave) => leave.type === item.type && leave.status === 'approved')
          .reduce((total, leave) => total + (leave.daysCount || 0), 0);
        const total = item.type === 'maternity' ? 90 : item.type === 'paternity' ? 30 : item.type === 'sick' ? 10 : item.type === 'emergency' ? 5 : 21;
        return { ...item, used, total };
      }),
    [leaves],
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetLeavesQueryKey() });

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startDate = String(form.get('startDate') || '');
    const endDate = String(form.get('endDate') || '');
    try {
      await createMutation.mutateAsync({
        data: {
          employeeId: Number(form.get('employeeId') || user?.id || 0),
          type: String(form.get('type') || 'annual') as LeaveInputType,
          startDate,
          endDate,
          daysCount: dayCount(startDate, endDate),
          reason: String(form.get('reason') || ''),
        },
      });
      toast({ title: t('savedSuccessfully') });
      setShowForm(false);
      refresh();
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: 'Could not create the leave request.' });
    }
  };

  const updateStatus = async (leave: Leave, status: 'approved' | 'rejected') => {
    if (!leave.id) return;
    try {
      await updateMutation.mutateAsync({ id: leave.id, data: { status, approvedBy: user?.id || undefined } });
      toast({ title: t(status) });
      refresh();
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: 'Could not update this request.' });
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: t('delete') });
      setDeleteId(null);
      refresh();
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: 'Could not delete this request.' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('leaves')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t('manageLeavesDesc')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-teal-500/25 transition-transform hover:-translate-y-1">
          <Plus className="w-5 h-5" /> {t('leaveRequest')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {balances.map((leave, i) => {
          const remaining = Math.max(0, leave.total - leave.used);
          const percent = Math.min(100, Math.round((leave.used / leave.total) * 100));
          return (
            <button key={leave.type} onClick={() => setSelected(leaves.find((item) => item.type === leave.type) || null)} className={`text-left p-5 rounded-2xl transition pressable card-3d animate-fadeIn stagger-${i + 1} flex flex-col justify-between items-center text-center`}>
              <div className="w-16 h-16 rounded-full relative flex items-center justify-center mb-3" style={{ background: `conic-gradient(${leave.hex} ${percent}%, var(--muted-bg) ${percent}%)` }}>
                <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center font-display font-bold text-lg">{remaining}</div>
              </div>
              <div className="text-sm font-bold uppercase tracking-widest">{t(leave.type as any)}</div>
              <div className="text-[10px] mt-1 font-medium bg-muted-bg px-2 py-0.5 rounded" style={{ color: 'var(--muted)' }}>{leave.used} / {leave.total} {t('used')}</div>
            </button>
          )
        })}
      </div>

      <div className="card-3d p-4 sm:p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <CalendarHeart className="w-5 h-5 text-teal-600" /> {t('leaveRequests')}
          </h3>
          <span className="text-xs font-bold uppercase tracking-widest bg-muted-bg px-3 py-1 rounded-lg text-muted-foreground">{leaves.length} {t('total')}</span>
        </div>

        {isLoading ? (
          <div className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--muted-bg)' }} />
        ) : !leaves.length ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <CalendarHeart className="w-10 h-10 opacity-20" />
            <p className="font-medium">{t('noData')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaves.map((leave, index) => {
              const config = leaveTypes.find((item) => item.type === leave.type) || leaveTypes[0];
              return (
                <div key={leave.id} data-testid={`card-leave-${leave.id}`} onClick={() => setSelected(leave)} className={`rounded-xl p-5 cursor-pointer pressable animate-fadeIn stagger-${(index % 4) + 1} card-3d !border-0 border-l-[6px]`} style={{ borderLeftColor: config.hex, background: 'var(--card)' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-lg truncate">{leave.employeeName || `#${leave.employeeId}`}</div>
                        <div className="text-xs font-medium mt-1 flex items-center gap-2">
                          <span className="bg-muted-bg px-2 py-0.5 rounded-md text-foreground capitalize">{t((leave.type || 'annual') as any)}</span>
                          <span className="text-muted-foreground">{leave.daysCount || 0} {t('days')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:items-end gap-2 border-t border-border sm:border-0 pt-3 sm:pt-0">
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full">
                        <span className="font-data text-sm opacity-80">{leave.startDate || '—'} → {leave.endDate || '—'}</span>
                        <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColor(leave.status)}`}>{t((leave.status || 'pending') as any)}</span>
                      </div>
                      
                      <div className="flex gap-2 justify-end" onClick={(event) => event.stopPropagation()}>
                        {leave.status === 'pending' && (
                          <>
                            <button data-testid={`button-approve-leave-${leave.id}`} aria-label={t('approved')} onClick={() => updateStatus(leave, 'approved')} className="h-8 w-8 flex items-center justify-center rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors"><CheckCircle2 className="w-5 h-5" /></button>
                            <button data-testid={`button-reject-leave-${leave.id}`} aria-label={t('rejected')} onClick={() => updateStatus(leave, 'rejected')} className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
                          </>
                        )}
                        <button data-testid={`button-delete-leave-${leave.id}`} aria-label={t('delete')} onClick={() => setDeleteId(leave.id || null)} className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="rounded-3xl p-8 w-full max-w-md shadow-2xl card-3d" onClick={(event) => event.stopPropagation()}>
            <h2 className="font-display text-2xl font-bold mb-6">{t('newLeaveRequest')}</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              {employeesData?.employees?.length ? (
                <label className="block text-sm font-bold">{t('employee')}
                  <select name="employeeId" defaultValue={String(user?.id || employeesData.employees[0].id || '')} className="mt-2 w-full rounded-xl px-4 py-3 text-sm bg-background border border-border">
                    {employeesData.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
                  </select>
                </label>
              ) : null}
              <label className="block text-sm font-bold">{t('leaveType')}
                <select name="type" defaultValue="annual" className="mt-2 w-full rounded-xl px-4 py-3 text-sm bg-background border border-border">
                  {leaveTypes.map((leave) => <option key={leave.type} value={leave.type}>{t(leave.type as any)}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-bold">{t('startDate')}
                  <input required name="startDate" type="date" className="mt-2 w-full rounded-xl px-3 py-3 text-sm bg-background border border-border font-data" />
                </label>
                <label className="block text-sm font-bold">{t('endDate')}
                  <input required name="endDate" type="date" className="mt-2 w-full rounded-xl px-3 py-3 text-sm bg-background border border-border font-data" />
                </label>
              </div>
              <label className="block text-sm font-bold">{t('reason')}
                <textarea name="reason" rows={3} className="mt-2 w-full rounded-xl px-4 py-3 text-sm resize-none bg-background border border-border" />
              </label>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 rounded-xl font-bold bg-muted hover:bg-muted/80 transition-colors">{t('cancel')}</button>
                <button disabled={createMutation.isPending} type="submit" className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-teal-500/25">{createMutation.isPending ? t('loading') : t('submit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={selected ? `${t('leaveRequest')} #${selected.id}` : t('leaveRequest')} items={selected ? [{ label: t('employee'), value: selected.employeeName || selected.employeeId }, { label: t('leaveType'), value: t((selected.type || 'annual') as any) }, { label: t('from'), value: selected.startDate }, { label: t('to'), value: selected.endDate }, { label: t('days'), value: selected.daysCount }, { label: t('reason'), value: selected.reason }, { label: t('status'), value: t((selected.status || 'pending') as any) }] : []} />
      
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="rounded-3xl p-8 max-w-sm w-full card-3d">
            <h2 className="font-display text-xl font-bold">{t('confirmDelete')}</h2>
            <p className="text-sm text-muted-foreground mt-3">{t('confirmDeleteDesc')}</p>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl px-4 py-3 font-bold bg-muted hover:bg-muted/80">{t('cancel')}</button>
              <button disabled={deleteMutation.isPending} onClick={remove} className="flex-1 rounded-xl px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold">{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
