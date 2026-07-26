import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  useCreateRequest,
  useGetRequests,
  useUpdateRequest,
  getGetRequestsQueryKey,
  WorkRequest,
  WorkRequestInputType,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import DetailDialog from '@/components/detail-dialog';
import { CheckCircle2, XCircle, Clock, Plus, DollarSign, Calendar, TrendingUp, Briefcase, Wrench } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = { overtime: <TrendingUp className="w-4 h-4" />, shift_change: <Briefcase className="w-4 h-4" />, expense: <DollarSign className="w-4 h-4" />, leave: <Calendar className="w-4 h-4" />, equipment: <Wrench className="w-4 h-4" /> };
const statusColor = (status?: string) => status === 'approved' ? 'bg-green-500/10 text-green-500' : status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500';

export default function Requests() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<WorkRequest | null>(null);
  const params = { companyId: user?.companyId || 0 };
  const { data, isLoading } = useGetRequests(params, { query: { enabled: !!user?.companyId, queryKey: getGetRequestsQueryKey(params) } });
  const createMutation = useCreateRequest();
  const updateMutation = useUpdateRequest();
  const requests = data?.requests || [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey() });

  const updateStatus = async (request: WorkRequest, status: 'approved' | 'rejected') => {
    if (!request.id) return;
    try {
      await updateMutation.mutateAsync({ id: request.id, data: { status, approvedBy: user?.id || undefined } });
      toast({ title: t(status) });
      refresh();
    } catch { toast({ variant: 'destructive', title: t('actions'), description: 'Could not update this request.' }); }
  };

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createMutation.mutateAsync({ data: { employeeId: user?.id || 0, type: String(form.get('type') || 'leave') as WorkRequestInputType, title: String(form.get('title') || ''), description: String(form.get('description') || '') } });
      toast({ title: t('savedSuccessfully') });
      setShowNew(false);
      refresh();
    } catch { toast({ variant: 'destructive', title: t('actions'), description: 'Could not create this request.' }); }
  };

  const stats = [
    { key: null, label: t('total'), value: requests.length },
    { key: 'pending', label: t('pending'), value: requests.filter((item) => item.status === 'pending').length },
    { key: 'approved', label: t('approved'), value: requests.filter((item) => item.status === 'approved').length },
    { key: 'rejected', label: t('rejected'), value: requests.filter((item) => item.status === 'rejected').length },
  ];

  return <div className="space-y-6 animate-fadeIn">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><h1 className="text-2xl font-bold">{t('requests')}</h1><p className="text-sm" style={{ color: 'var(--muted)' }}>{t('manageRequestsDesc')}</p></div><button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm"><Plus className="w-4 h-4" />{t('newRequest')}</button></div>
     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.map((stat) => <button key={stat.label} onClick={() => setSelected((stat.key ? requests.find((item) => item.status === stat.key) : requests[0]) || null)} className="text-left p-5 rounded-2xl transition hover:-translate-y-0.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><div className="text-sm" style={{ color: 'var(--muted)' }}>{stat.label}</div><div className="text-3xl font-bold mt-2">{stat.value}</div><div className="h-1 rounded-full mt-3 bg-gradient-to-r from-indigo-500 to-purple-500" /></button>)}</div>
    <div className="space-y-3">{isLoading ? <div className="p-10 text-center text-muted-foreground">{t('loading')}</div> : !requests.length ? <div className="p-10 text-center text-muted-foreground rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>{t('noData')}</div> : requests.map((request) => <div key={request.id} onClick={() => setSelected(request)} className="p-5 rounded-2xl cursor-pointer transition hover:shadow-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><div className="flex flex-col md:flex-row md:items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">{typeIcons[request.type || 'equipment']}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap mb-1"><span className="font-bold">{request.title}</span><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500 capitalize">{(request.type || 'equipment').replace('_', ' ')}</span></div><div className="text-sm" style={{ color: 'var(--muted)' }}>{request.description || '—'}</div><div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{t('by')} {request.employeeName || request.employeeId} • {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}</div></div><div className="flex items-center gap-2 flex-shrink-0" onClick={(event) => event.stopPropagation()}><span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(request.status)}`}>{request.status === 'approved' ? <CheckCircle2 className="w-3 h-3 inline me-1" /> : request.status === 'rejected' ? <XCircle className="w-3 h-3 inline me-1" /> : <Clock className="w-3 h-3 inline me-1" />}{t((request.status || 'pending') as any)}</span>{request.status === 'pending' && <><button aria-label={t('approved')} onClick={() => updateStatus(request, 'approved')} className="p-2 rounded-lg bg-green-500/10 text-green-500"><CheckCircle2 className="w-4 h-4" /></button><button aria-label={t('rejected')} onClick={() => updateStatus(request, 'rejected')} className="p-2 rounded-lg bg-red-500/10 text-red-500"><XCircle className="w-4 h-4" /></button></>}</div></div></div>)}</div>
    {showNew && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}><div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: 'var(--card)' }} onClick={(event) => event.stopPropagation()}><h2 className="text-xl font-bold mb-6">{t('newRequest')}</h2><form onSubmit={create} className="space-y-4"><label className="block text-sm font-medium">{t('requestType')}<select name="type" defaultValue="leave" className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}><option value="leave">{t('leaveRequest')}</option><option value="overtime">{t('overtimeReq')}</option><option value="shift_change">{t('shiftChange')}</option><option value="expense">{t('expenseClaim')}</option><option value="equipment">Equipment</option></select></label><label className="block text-sm font-medium">{t('title')}<input required name="title" className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} /></label><label className="block text-sm font-medium">{t('description')}<textarea name="description" rows={4} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm resize-none" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} /></label><div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowNew(false)} className="flex-1 px-4 py-2.5 rounded-xl" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>{t('cancel')}</button><button disabled={createMutation.isPending} type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">{t('submit')}</button></div></form></div></div>}
    <DetailDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={selected?.title || t('requests')} items={selected ? [{ label: t('employee'), value: selected.employeeName || selected.employeeId }, { label: t('requestType'), value: selected.type }, { label: t('description'), value: selected.description }, { label: t('status'), value: selected.status }, { label: t('date'), value: selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—' }] : []} />
  </div>;
}