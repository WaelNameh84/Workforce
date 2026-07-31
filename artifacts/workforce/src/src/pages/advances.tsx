import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetRequests, getGetRequestsQueryKey, useCreateRequest, useUpdateRequest, useDeleteRequest,
  useGetEmployees, getGetEmployeesQueryKey,
} from '@workspace/api-client-react';
import {
  Banknote, CheckCircle2, XCircle, Clock, User, Plus, Search,
  Wallet, Trash2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

// ─── Advance categories ───────────────────────────────────────────────────────
const ADVANCE_CATS = [
  { id: 'salary',    icon: '💵', hex: '#3b82f6', grad: 'from-blue-500 to-indigo-600',    label: { ar: 'سلفة راتب', en: 'Salary Advance', sv: 'Löneförskott' },       desc: { ar: 'سلفة على الراتب الشهري', en: 'Advance on monthly salary', sv: 'Förskott på månadslön' } },
  { id: 'emergency', icon: '🚑', hex: '#ef4444', grad: 'from-red-500 to-rose-600',       label: { ar: 'طارئة',      en: 'Emergency',       sv: 'Nödsituation' },       desc: { ar: 'نفقات طارئة ومستعجلة',    en: 'Urgent emergency expenses', sv: 'Brådskande nödsituationsutgifter' } },
  { id: 'medical',   icon: '🏥', hex: '#22c55e', grad: 'from-green-500 to-emerald-600',  label: { ar: 'علاجية',     en: 'Medical',         sv: 'Medicinsk' },          desc: { ar: 'نفقات علاجية وصحية',      en: 'Medical and health expenses', sv: 'Medicinska och hälsoutgifter' } },
  { id: 'education', icon: '📚', hex: '#8b5cf6', grad: 'from-violet-500 to-purple-600',  label: { ar: 'تعليمية',    en: 'Educational',     sv: 'Utbildning' },         desc: { ar: 'رسوم دراسية وتعليمية',     en: 'Educational and tuition fees', sv: 'Utbildnings- och skolavgifter' } },
  { id: 'housing',   icon: '🏠', hex: '#f59e0b', grad: 'from-amber-500 to-orange-600',   label: { ar: 'سكنية',      en: 'Housing',         sv: 'Bostad' },             desc: { ar: 'إيجار وتكاليف السكن',      en: 'Rent and housing costs', sv: 'Hyra och bostadskostnader' } },
  { id: 'travel',    icon: '✈️', hex: '#0ea5e9', grad: 'from-sky-500 to-cyan-600',       label: { ar: 'سفر',        en: 'Travel',          sv: 'Resa' },               desc: { ar: 'تكاليف السفر والتنقل',     en: 'Travel and transportation costs', sv: 'Rese- och transportkostnader' } },
];

type AdvanceRequest = { id?: number; employeeId?: number; type?: string; status?: string; amount?: number; reason?: string; createdAt?: string; [k: string]: unknown };
type StatusKey = 'pending' | 'approved' | 'rejected';

const statusMap: Record<StatusKey, { label: { ar: string; en: string; sv: string }; cls: string }> = {
  pending:  { label: { ar: 'معلق',   en: 'Pending',   sv: 'Väntande'  }, cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  approved: { label: { ar: 'مقبول',  en: 'Approved',  sv: 'Godkänd'   }, cls: 'bg-green-500/15 text-green-300 border-green-500/30' },
  rejected: { label: { ar: 'مرفوض', en: 'Rejected',  sv: 'Avslagen'  }, cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
};

function StatusBadge({ status, locale }: { status?: string; locale: string }) {
  const s = (statusMap[status as StatusKey] || statusMap.pending);
  const l = s.label[locale as 'ar' | 'en' | 'sv'] || s.label.ar;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold ${s.cls}`}>{l}</span>;
}

export default function Advances() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cid = user?.companyId || 0;
  const isAdmin = user?.role !== 'employee';
  const isRTL = locale === 'ar';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selCat, setSelCat] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [installments, setInstallments] = useState('1');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [selEmpId, setSelEmpId] = useState<number | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [detailItem, setDetailItem] = useState<AdvanceRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdvanceRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: reqData, isLoading } = useGetRequests({ companyId: cid }, { query: { enabled: !!cid, queryKey: getGetRequestsQueryKey({ companyId: cid }) } });
  const { data: empData } = useGetEmployees({ companyId: cid }, { query: { enabled: !!cid && isAdmin, queryKey: getGetEmployeesQueryKey({ companyId: cid }) } });
  const createReq = useCreateRequest();
  const updateReq = useUpdateRequest();
  const deleteReq = useDeleteRequest();

  const empMap = useMemo(() => {
    const m: Record<number, string> = {};
    (empData?.employees || []).forEach(e => { if (e.id) m[e.id] = e.fullName || '—'; });
    return m;
  }, [empData]);

  const advances = useMemo(() => {
    const all = (reqData?.requests || []) as AdvanceRequest[];
    return all
      .filter(r => r.type === 'advance')
      .filter(r => filterStatus === 'all' || r.status === filterStatus)
      .filter(r => filterCat === 'all' || r.reason?.includes(filterCat))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [reqData, filterStatus, filterCat]);

  const pending = advances.filter(r => r.status === 'pending').length;
  const totalAdvances = advances.filter(r => r.status === 'approved').reduce((s, r) => s + (r.amount || 0), 0);

  const l = (obj: { ar: string; en: string; sv: string }) => obj[locale as 'ar' | 'en' | 'sv'] || obj.ar;

  async function handleCreate() {
    if (!selCat || !amount) return;
    setSaving(true);
    try {
      const cat = ADVANCE_CATS.find(c => c.id === selCat);
      await createReq.mutateAsync({
        data: {
          employeeId: isAdmin ? (selEmpId || user?.id || 0) : (user?.id || 0),
          type: 'advance' as any,
          title: cat ? l(cat.label) : selCat,
          reason: `[${selCat}] ${reason || ''}`,
          amount: Number(amount),
          installments: Number(installments),
          status: 'pending',
        } as any,
      });
      toast({ title: t('advanceRequested') || 'تم إرسال طلب السلفة ✓' });
      queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey({ companyId: cid }) });
      setDrawerOpen(false);
      setSelCat(''); setAmount(''); setReason(''); setInstallments('1'); setSelEmpId(null);
    } catch {
      toast({ variant: 'destructive', title: t('error') });
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(r: AdvanceRequest) {
    if (!r.id) return;
    try {
      await updateReq.mutateAsync({ id: r.id, data: { status: 'approved' } as any });
      toast({ title: t('advanceApproved') || 'تمت الموافقة على السلفة ✓' });
      queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey({ companyId: cid }) });
    } catch { toast({ variant: 'destructive', title: t('error') }); }
  }

  async function handleReject(r: AdvanceRequest) {
    if (!r.id) return;
    try {
      await updateReq.mutateAsync({ id: r.id, data: { status: 'rejected' } as any });
      toast({ title: t('advanceRejected') || 'تم رفض السلفة' });
      queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey({ companyId: cid }) });
    } catch { toast({ variant: 'destructive', title: t('error') }); }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteReq.mutateAsync({ id: deleteTarget.id });
      toast({ title: 'تم مسح السلفة ✓' });
      queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey({ companyId: cid }) });
      setDeleteTarget(null);
    } catch {
      toast({ variant: 'destructive', title: t('error') });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('advances')}</h1>
          <p className="text-sm mt-1 text-muted-foreground">{t('advancesDesc')}</p>
        </div>
        <button onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-500 transition">
          <Plus className="w-4 h-4" />
          {t('requestAdvance') || 'طلب سلفة'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: t('totalAdvances') || 'إجمالي السلف المعتمدة', val: totalAdvances.toLocaleString(), suffix: '', color: 'blue', icon: Banknote },
          { label: t('pendingAdvances') || 'طلبات بانتظار الموافقة', val: pending, suffix: '', color: 'orange', icon: Clock },
          { label: t('totalRequests') || 'جميع الطلبات', val: advances.length, suffix: '', color: 'indigo', icon: Wallet },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="living-card p-4 text-center"
            style={{ '--card-accent': color === 'blue' ? '#3b82f6' : color === 'orange' ? '#f97316' : '#6366f1' } as React.CSSProperties}>
            <span className="living-card-orb" style={{ top: '-1rem', right: '-0.5rem' }} />
            <Icon className={`w-5 h-5 mx-auto mb-1.5 text-${color}-400`} />
            <p className={`text-2xl font-black text-${color}-300`}>{val}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Categories overview */}
      <div>
        <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">{t('advanceCategories') || 'أقسام السلف'}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ADVANCE_CATS.map(cat => {
            const cnt = advances.filter(r => r.reason?.includes(cat.id)).length;
            const isActive = filterCat === cat.id;
            return (
              <button key={cat.id} onClick={() => setFilterCat(isActive ? 'all' : cat.id)}
                className="living-card p-4 text-start transition group active:scale-[.97]"
                style={{
                  '--card-accent': cat.hex,
                  boxShadow: isActive ? `0 0 0 2px ${cat.hex}60, 0 4px 24px ${cat.hex}30` : undefined,
                } as React.CSSProperties}>
                <span className="living-card-orb" style={{ top: '-0.75rem', insetInlineEnd: '-0.5rem' }} />
                {/* Icon circle */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.grad} flex items-center justify-center text-lg mb-2.5 shadow-md`}>
                  {cat.icon}
                </div>
                <p className="font-bold text-sm leading-tight">{l(cat.label)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{l(cat.desc)}</p>
                {/* count badge */}
                <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-black border"
                  style={{ color: cat.hex, borderColor: `${cat.hex}40`, background: `${cat.hex}18` }}>
                  {cnt} {t('requests') || 'طلب'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="card-3d p-4 flex flex-wrap gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 h-10 text-sm focus:outline-none">
          <option value="all">{t('allStatus') || 'كل الحالات'}</option>
          <option value="pending">{t('pending')}</option>
          <option value="approved">{t('approved')}</option>
          <option value="rejected">{t('rejected')}</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 h-10 text-sm focus:outline-none">
          <option value="all">{t('allCategories') || 'كل الأقسام'}</option>
          {ADVANCE_CATS.map(c => <option key={c.id} value={c.id}>{l(c.label)}</option>)}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card-3d h-20 animate-pulse" />)}</div>
      ) : advances.length === 0 ? (
        <div className="card-3d p-16 text-center">
          <Banknote className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
          <p className="font-bold text-muted-foreground">{t('noAdvancesYet') || 'لا توجد طلبات سلف بعد'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {advances.map(r => {
            const cat = ADVANCE_CATS.find(c => r.reason?.includes(c.id));
            const empName = isAdmin ? (empMap[r.employeeId || 0] || `#${r.employeeId}`) : (t('you') || 'أنا');
            const isPending = r.status === 'pending';
            return (
              <div key={r.id}
                className="living-card px-5 py-4 flex items-center gap-4"
                style={{ '--card-accent': isPending ? '#f97316' : r.status === 'approved' ? '#22c55e' : '#f43f5e' } as React.CSSProperties}>
                <span className="living-card-orb" style={{ top: '-1rem', right: '-0.5rem' }} />
                <div className="text-2xl shrink-0">{cat?.icon || '💵'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{empName}</span>
                    {cat && <span className="text-[11px] text-muted-foreground">{l(cat.label)}</span>}
                    <StatusBadge status={r.status} locale={locale} />
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {(r.amount || 0).toLocaleString()} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1.5 shrink-0">
                    {isPending && (
                      <>
                        <button onClick={() => handleApprove(r)}
                          className="p-2 rounded-xl hover:bg-green-500/15 text-green-400 transition">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReject(r)}
                          className="p-2 rounded-xl hover:bg-red-500/15 text-red-400 transition">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => setDeleteTarget(r)}
                      className="p-2 rounded-xl hover:bg-red-500/15 text-red-400/70 hover:text-red-400 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>مسح السلفة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من مسح هذه السلفة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('cancel') || 'إلغاء'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">
              {deleting ? 'جاري المسح...' : 'مسح'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Drawer */}
      <Drawer open={drawerOpen} onOpenChange={open => { setDrawerOpen(open); if (!open) { setSelCat(''); setAmount(''); setReason(''); setInstallments('1'); setSelEmpId(null); } }}>
        <DrawerContent className="max-h-[96dvh]">
          <DrawerHeader className="border-b border-border/50 pb-3">
            <DrawerTitle className="flex items-center gap-2.5 font-display text-xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-white" />
              </div>
              {t('requestAdvance') || 'طلب سلفة جديدة'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Admin: employee selector */}
            {isAdmin && (
              <div className="living-card p-4 space-y-3" style={{ '--card-accent': '#3b82f6' } as React.CSSProperties}>
                <span className="living-card-orb" style={{ top: '-1rem', right: '-0.5rem' }} />
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('selectEmployee')}</label>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={empSearch} onChange={e => setEmpSearch(e.target.value)}
                    placeholder={t('searchEmployee')}
                    className="w-full rounded-xl border border-border bg-background h-10 ps-9 pe-3 text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {(empData?.employees || []).filter(e => !empSearch || (e.fullName || '').toLowerCase().includes(empSearch.toLowerCase())).map(e => (
                    <button key={e.id} onClick={() => setSelEmpId(e.id || null)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition text-start
                        ${selEmpId === e.id ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-border hover:border-border/60'}`}>
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{e.fullName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('advanceCategory') || 'قسم السلفة'}</label>
              <div className="grid grid-cols-2 gap-2.5">
                {ADVANCE_CATS.map(c => {
                  const isSelected = selCat === c.id;
                  return (
                    <button key={c.id} onClick={() => setSelCat(c.id)}
                      className="living-card p-3.5 flex items-center gap-2.5 text-start transition active:scale-[.97]"
                      style={{
                        '--card-accent': c.hex,
                        boxShadow: isSelected ? `0 0 0 2px ${c.hex}70, 0 4px 20px ${c.hex}25` : undefined,
                      } as React.CSSProperties}>
                      <span className="living-card-orb" style={{ top: '-0.6rem', insetInlineEnd: '-0.4rem' }} />
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-base shrink-0 shadow`}>
                        {c.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm leading-tight truncate" style={{ color: isSelected ? c.hex : undefined }}>{l(c.label)}</p>
                        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">{l(c.desc)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount & installments */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('amount') || 'المبلغ'}</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                  className="w-full rounded-xl border border-border bg-background px-3 h-11 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('installments') || 'عدد الأقساط'}</label>
                <input type="number" min={1} max={24} value={installments} onChange={e => setInstallments(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 h-11 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('reason')}</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                placeholder={t('advanceReason') || 'تفاصيل طلب السلفة...'}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition resize-none" />
            </div>
          </div>
          <div className="px-4 py-3 border-t border-border/50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
            <button onClick={handleCreate} disabled={saving || !selCat || !amount || (isAdmin && !selEmpId)}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm disabled:opacity-40 transition">
              {saving ? t('saving') : (t('sendAdvanceRequest') || 'إرسال الطلب')}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
