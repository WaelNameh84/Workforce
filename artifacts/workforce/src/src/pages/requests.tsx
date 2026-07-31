import { useState } from 'react';
import { useLocation } from 'wouter';
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
import { saveDetailAndNavigate } from '@/pages/detail';
import { CheckCircle2, XCircle, Clock, Plus, DollarSign, Calendar, TrendingUp, Briefcase, Wrench, Inbox } from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = { 
  overtime: { icon: <TrendingUp className="w-5 h-5" />, color: 'from-amber-400 to-orange-500' }, 
  shift_change: { icon: <Briefcase className="w-5 h-5" />, color: 'from-blue-400 to-indigo-500' }, 
  expense: { icon: <DollarSign className="w-5 h-5" />, color: 'from-emerald-400 to-teal-500' }, 
  leave: { icon: <Calendar className="w-5 h-5" />, color: 'from-rose-400 to-red-500' }, 
  equipment: { icon: <Wrench className="w-5 h-5" />, color: 'from-slate-400 to-gray-500' } 
};

const statusColor = (status?: string) => status === 'approved' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : status === 'rejected' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20';

export default function Requests() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showNew, setShowNew] = useState(false);
  const params = { companyId: user?.companyId || 0 };
  const { data, isLoading } = useGetRequests(params, { query: { enabled: !!user?.companyId, queryKey: getGetRequestsQueryKey(params) } });
  const createMutation = useCreateRequest();
  const updateMutation = useUpdateRequest();
  const requests = data?.requests || [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey() });
  const openRequest = (request: WorkRequest | undefined) => {
    if (!request) return;
    saveDetailAndNavigate(setLocation, '/dashboard/detail', {
      title: request.title || t('requests'),
      badge: t('requests'),
      items: [
        { label: t('employee'), value: request.employeeName || request.employeeId },
        { label: t('requestType'), value: request.type },
        { label: t('description'), value: request.description },
        { label: t('status'), value: request.status },
        { label: t('date'), value: request.createdAt ? new Date(request.createdAt).toLocaleString() : '—' },
      ],
    });
  };

  const updateStatus = async (request: WorkRequest, status: 'approved' | 'rejected', paymentStatus?: 'paid' | 'unpaid') => {
    if (!request.id) return;
    try {
      await updateMutation.mutateAsync({ id: request.id, data: { status, paymentStatus, approvedBy: user?.id || undefined } });
      toast({ title: status === 'approved' ? `تمت الموافقة — ${paymentStatus === 'unpaid' ? 'غير مدفوع' : 'مدفوع'}` : t(status) });
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('requests')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t('manageRequestsDesc')}</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-transform hover:-translate-y-1">
          <Plus className="w-5 h-5" />{t('newRequest')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const colors = [
            'from-indigo-500 to-purple-600',
            'from-amber-500 to-orange-600',
            'from-emerald-500 to-teal-600',
            'from-rose-500 to-red-600',
          ];
          const clr = colors[i % colors.length];
            return (
            <button key={stat.label} onClick={() => openRequest(stat.key ? requests.find((item) => item.status === stat.key) : requests[0])} className={`relative overflow-hidden rounded-2xl transition pressable animate-fadeIn stagger-${i + 1} text-left`} style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {/* Coloured header */}
              <div className={`h-12 bg-gradient-to-br ${clr} relative overflow-hidden flex items-center px-4`}>
                <div className="nav-card-wave" style={{ animationDelay: `${i * 0.8}s` }} />
                <div className="card-orb w-14 h-14 absolute -right-3 -top-3" />
              </div>
              <div className="p-4">
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{stat.label}</div>
                <div className="text-4xl font-bold mt-1 font-data">{stat.value}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="h-32 rounded-2xl animate-pulse card-3d bg-muted-bg" />
        ) : !requests.length ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-muted-foreground card-3d">
            <Inbox className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium text-lg">{t('noData')}</p>
          </div>
        ) : requests.map((request, index) => {
          const config = typeConfig[request.type || 'equipment'] || typeConfig['equipment'];
          return (
            <div key={request.id} onClick={() => openRequest(request)} className={`overflow-hidden rounded-2xl cursor-pointer pressable animate-fadeIn stagger-${(index % 6) + 1}`} style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {/* Coloured banner */}
              <div className={`h-12 bg-gradient-to-br ${config.color} relative overflow-hidden flex items-center px-4 gap-3`}>
                <div className="nav-card-wave" />
                <div className="card-orb w-14 h-14 absolute -right-3 -top-3" />
                <div className="relative z-10 w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white card-icon-float">
                  {config.icon}
                </div>
                <span className="relative z-10 text-white font-bold text-sm truncate">{request.title}</span>
              </div>
              <div className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                  {config.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1.5">
                    <span className="font-bold text-lg">{request.title}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-muted-bg text-foreground">
                      {(request.type || 'equipment').replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm font-medium line-clamp-1" style={{ color: 'var(--muted)' }}>{request.description || '—'}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider mt-2 opacity-60">
                    {t('by')} {request.employeeName || request.employeeId} <span className="mx-2">•</span> {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 border-t border-border pt-4 md:pt-0 md:border-0" onClick={(event) => event.stopPropagation()}>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${statusColor(request.status)}`}>
                    {request.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : request.status === 'rejected' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {t((request.status || 'pending') as any)}
                  </span>
                  {request.status === 'approved' && <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${request.paymentStatus === 'unpaid' ? 'bg-orange-500/10 text-orange-600' : 'bg-green-500/10 text-green-600'}`}>{request.paymentStatus === 'unpaid' ? 'غير مدفوع' : 'مدفوع'}</span>}
                  
                  {user?.role !== 'employee' && request.status === 'pending' && (
                    <div className="flex gap-2 ml-2">
                      <button aria-label="موافقة مدفوعة" onClick={() => updateStatus(request, 'approved', 'paid')} className="h-9 px-2 flex items-center gap-1 rounded-xl bg-card border border-green-500/30 shadow-sm text-green-500 hover:bg-green-500 hover:text-white transition-colors text-[10px] font-bold">
                        <CheckCircle2 className="w-4 h-4" /> مدفوع
                      </button>
                      <button aria-label="موافقة غير مدفوعة" onClick={() => updateStatus(request, 'approved', 'unpaid')} className="h-9 px-2 flex items-center gap-1 rounded-xl bg-card border border-orange-500/30 shadow-sm text-orange-500 hover:bg-orange-500 hover:text-white transition-colors text-[10px] font-bold">
                        <CheckCircle2 className="w-4 h-4" /> غير مدفوع
                      </button>
                      <button aria-label={t('rejected')} onClick={() => updateStatus(request, 'rejected')} className="h-9 w-9 flex items-center justify-center rounded-xl bg-card border border-border shadow-sm text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              </div>{/* /p-5 */}
            </div>
          )
        })}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}>
          <div className="rounded-3xl w-full max-w-md shadow-2xl card-3d overflow-hidden" onClick={(event) => event.stopPropagation()}>
            {/* Colorful wave header */}
            <div className="relative h-20 bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700 overflow-hidden flex items-center px-5 gap-3">
              <div className="nav-card-wave" />
              <div className="card-orb w-24 h-24 absolute -right-5 -top-5" />
              <div className="relative z-10 w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg card-icon-pulse">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div className="relative z-10">
                <h2 className="font-display text-lg font-bold text-white">{t('newRequest')}</h2>
                <p className="text-white/65 text-xs">{t('requestType')} · {t('title')}</p>
              </div>
            </div>
            <form onSubmit={create} className="space-y-5 p-6">
              <label className="block text-sm font-bold">{t('requestType')}
                <select name="type" defaultValue="leave" className="mt-2 w-full rounded-xl px-4 py-3 text-sm bg-background border border-border">
                  <option value="leave">{t('leaveRequest')}</option>
                  <option value="overtime">{t('overtimeReq')}</option>
                  <option value="shift_change">{t('shiftChange')}</option>
                  <option value="expense">{t('expenseClaim')}</option>
                  <option value="equipment">Equipment</option>
                </select>
              </label>
              <label className="block text-sm font-bold">{t('title')}
                <input required name="title" className="mt-2 w-full rounded-xl px-4 py-3 text-sm bg-background border border-border" />
              </label>
              <label className="block text-sm font-bold">{t('description')}
                <textarea name="description" rows={4} className="mt-2 w-full rounded-xl px-4 py-3 text-sm resize-none bg-background border border-border" />
              </label>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 px-4 py-3 rounded-xl font-bold bg-muted hover:bg-muted/80 transition-colors">{t('cancel')}</button>
                <button disabled={createMutation.isPending} type="submit" className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25">{t('submit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
