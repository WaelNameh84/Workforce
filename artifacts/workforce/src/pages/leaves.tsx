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
import { CheckCircle2, XCircle, Clock, FileText, Plus, Trash2 } from 'lucide-react';

const leaveTypes: Array<{ type: LeaveInputType; color: string }> = [
  { type: 'annual', color: 'from-blue-500 to-cyan-500' },
  { type: 'sick', color: 'from-red-500 to-rose-500' },
  { type: 'emergency', color: 'from-amber-500 to-orange-500' },
  { type: 'maternity', color: 'from-pink-500 to-rose-500' },
  { type: 'paternity', color: 'from-purple-500 to-indigo-500' },
  { type: 'unpaid', color: 'from-gray-500 to-slate-500' },
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
          <h1 className="text-2xl font-bold">{t('leaves')}</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('manageLeavesDesc')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm">
          <Plus className="w-4 h-4" /> {t('leaveRequest')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {balances.map((leave) => (
          <button key={leave.type} onClick={() => setSelected(leaves.find((item) => item.type === leave.type) || null)} className="text-left p-5 rounded-2xl transition hover:-translate-y-0.5 hover:shadow-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className={`w-12 h-2 rounded-full bg-gradient-to-r ${leave.color} mb-4`} />
            <div className="text-sm font-medium mb-1">{t(leave.type as any)}</div>
            <div className="text-2xl font-bold">{Math.max(0, leave.total - leave.used)}<span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>/{leave.total}</span></div>
            <div className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{leave.used} {t('used')}</div>
          </button>
        ))}
      </div>

      <div className="p-6 rounded-2xl overflow-x-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t('leaveRequests')}</h3>
          <span className="text-sm text-muted-foreground">{leaves.length} {t('total').toLowerCase()}</span>
        </div>
        <table className="w-full min-w-[850px]">
          <thead><tr className="text-sm" style={{ color: 'var(--muted)' }}>{[t('employee'), t('leaveType'), t('from'), t('to'), t('days'), t('reason'), t('status'), t('actions')].map((head) => <th key={head} className="text-left py-3 px-2 font-medium">{head}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">{t('loading')}</td></tr> : !leaves.length ? <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">{t('noData')}</td></tr> : leaves.map((leave) => (
              <tr key={leave.id} onClick={() => setSelected(leave)} className="text-sm border-t cursor-pointer hover:bg-muted/30" style={{ borderColor: 'var(--border)' }}>
                <td className="py-3 px-2 font-medium">{leave.employeeName || `#${leave.employeeId}`}</td>
                <td className="py-3 px-2">{t((leave.type || 'annual') as any)}</td>
                <td className="py-3 px-2">{leave.startDate || '—'}</td>
                <td className="py-3 px-2">{leave.endDate || '—'}</td>
                <td className="py-3 px-2 font-medium">{leave.daysCount || 0}</td>
                <td className="py-3 px-2 max-w-[180px] truncate" style={{ color: 'var(--muted)' }}>{leave.reason || '—'}</td>
                <td className="py-3 px-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(leave.status)}`}>{leave.status === 'approved' ? <CheckCircle2 className="w-3 h-3 inline me-1" /> : leave.status === 'rejected' ? <XCircle className="w-3 h-3 inline me-1" /> : <Clock className="w-3 h-3 inline me-1" />}{t((leave.status || 'pending') as any)}</span></td>
                <td className="py-3 px-2" onClick={(event) => event.stopPropagation()}>
                  <div className="flex gap-1">
                    {leave.status === 'pending' && <><button aria-label={t('approved')} onClick={() => updateStatus(leave, 'approved')} className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"><CheckCircle2 className="w-4 h-4" /></button><button aria-label={t('rejected')} onClick={() => updateStatus(leave, 'rejected')} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"><XCircle className="w-4 h-4" /></button></>}
                    <button aria-label={t('delete')} onClick={() => setDeleteId(leave.id || null)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <button aria-label={t('viewProfile')} onClick={() => setSelected(leave)} className="p-1.5 rounded-lg hover:bg-muted"><FileText className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
        <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: 'var(--card)' }} onClick={(event) => event.stopPropagation()}>
          <h2 className="text-xl font-bold mb-6">{t('newLeaveRequest')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {employeesData?.employees?.length ? <label className="block text-sm font-medium">{t('employee')}<select name="employeeId" defaultValue={String(user?.id || employeesData.employees[0].id || '')} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>{employeesData.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select></label> : null}
            <label className="block text-sm font-medium">{t('leaveType')}<select name="type" defaultValue="annual" className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>{leaveTypes.map((leave) => <option key={leave.type} value={leave.type}>{t(leave.type as any)}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-4"><label className="block text-sm font-medium">{t('startDate')}<input required name="startDate" type="date" className="mt-2 w-full rounded-xl px-3 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} /></label><label className="block text-sm font-medium">{t('endDate')}<input required name="endDate" type="date" className="mt-2 w-full rounded-xl px-3 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} /></label></div>
            <label className="block text-sm font-medium">{t('reason')}<textarea name="reason" rows={3} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm resize-none" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} /></label>
            <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>{t('cancel')}</button><button disabled={createMutation.isPending} type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium">{createMutation.isPending ? t('loading') : t('submit')}</button></div>
          </form>
        </div>
      </div>}

      <DetailDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={selected ? `${t('leaveRequest')} #${selected.id}` : t('leaveRequest')} items={selected ? [{ label: t('employee'), value: selected.employeeName || selected.employeeId }, { label: t('leaveType'), value: t((selected.type || 'annual') as any) }, { label: t('from'), value: selected.startDate }, { label: t('to'), value: selected.endDate }, { label: t('days'), value: selected.daysCount }, { label: t('reason'), value: selected.reason }, { label: t('status'), value: t((selected.status || 'pending') as any) }] : []} />
      {deleteId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: 'var(--card)' }}><h2 className="text-lg font-bold">{t('confirmDelete')}</h2><p className="text-sm text-muted-foreground mt-2">{t('confirmDeleteDesc')}</p><div className="flex gap-3 mt-6"><button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl px-4 py-2" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>{t('cancel')}</button><button disabled={deleteMutation.isPending} onClick={remove} className="flex-1 rounded-xl px-4 py-2 bg-red-500 text-white">{t('delete')}</button></div></div></div>}
    </div>
  );
}