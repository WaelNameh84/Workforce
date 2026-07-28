import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
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
import { saveDetailAndNavigate } from '@/pages/detail';
import { CheckCircle2, XCircle, FileText, Plus, Trash2, CalendarHeart, Upload, Image, X, Paperclip } from 'lucide-react';

const ATTACHMENT_KEY = (id: number) => `leave-attachment-${id}`;

function saveAttachment(leaveId: number, dataUrl: string) {
  try { localStorage.setItem(ATTACHMENT_KEY(leaveId), dataUrl); } catch { /* storage full */ }
}

function getAttachment(leaveId: number): string | null {
  try { return localStorage.getItem(ATTACHMENT_KEY(leaveId)); } catch { return null; }
}

function removeAttachment(leaveId: number) {
  try { localStorage.removeItem(ATTACHMENT_KEY(leaveId)); } catch { /* silent */ }
}

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
  const [, setLocation] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewAttachment, setViewAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (file: File | null) => {
    if (!file) { setAttachment(null); setAttachmentPreview(null); return; }
    setAttachment(file);
    const dataUrl = await readFileAsDataUrl(file);
    setAttachmentPreview(dataUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const resetForm = () => {
    setShowForm(false);
    setAttachment(null);
    setAttachmentPreview(null);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startDate = String(form.get('startDate') || '');
    const endDate = String(form.get('endDate') || '');
    try {
      const result = await createMutation.mutateAsync({
        data: {
          employeeId: Number(form.get('employeeId') || user?.id || 0),
          type: String(form.get('type') || 'annual') as LeaveInputType,
          startDate,
          endDate,
          daysCount: dayCount(startDate, endDate),
          reason: String(form.get('reason') || ''),
        },
      });
      // Save attachment locally if provided
      if (attachment && attachmentPreview && (result as any)?.id) {
        saveAttachment((result as any).id, attachmentPreview);
      }
      toast({ title: t('savedSuccessfully') });
      resetForm();
      refresh();
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: 'Could not create the leave request.' });
    }
  };

  const updateStatus = async (leave: Leave, status: 'approved' | 'rejected', paymentStatus?: 'paid' | 'unpaid') => {
    if (!leave.id) return;
    try {
      await updateMutation.mutateAsync({ id: leave.id, data: { status, paymentStatus, approvedBy: user?.id || undefined } });
      toast({ title: status === 'approved' ? `تمت الموافقة — ${paymentStatus === 'unpaid' ? 'غير مدفوعة' : 'مدفوعة'}` : t(status) });
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
           <button key={leave.type} onClick={() => {
             const item = leaves.find((entry) => entry.type === leave.type);
             if (!item) return;
             saveDetailAndNavigate(setLocation, '/dashboard/detail', {
               title: `${t('leaveRequest')} #${item.id}`,
               badge: t('leaves'),
               items: [
                 { label: t('employee'), value: item.employeeName || item.employeeId },
                 { label: t('leaveType'), value: t((item.type || 'annual') as any) },
                 { label: t('from'), value: item.startDate },
                 { label: t('to'), value: item.endDate },
                 { label: t('days'), value: item.daysCount },
                 { label: t('reason'), value: item.reason },
                 { label: t('status'), value: t((item.status || 'pending') as any) },
               ],
             });
           }} className={`relative overflow-hidden rounded-2xl transition pressable animate-fadeIn stagger-${i + 1} flex flex-col justify-between items-center text-center`} style={{ background: `linear-gradient(135deg, color-mix(in srgb,${leave.hex} 18%, var(--card)), var(--card))`, border: `1px solid color-mix(in srgb,${leave.hex} 30%, transparent)` }}>
              {/* Wave */}
              <div className="nav-card-wave" style={{ animationDelay: `${i * 0.9}s` }} />
              <div className="card-orb w-16 h-16 absolute -right-3 -top-3" style={{ background: `color-mix(in srgb, ${leave.hex} 25%, transparent)` }} />
              <div className="relative z-10 pt-5 pb-4 px-3 flex flex-col items-center gap-2 w-full">
                <div className="w-16 h-16 rounded-full relative flex items-center justify-center card-icon-float" style={{ background: `conic-gradient(${leave.hex} ${percent}%, color-mix(in srgb,${leave.hex} 15%,var(--muted-bg)) ${percent}%)` }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg" style={{ background: 'var(--card)', color: leave.hex }}>{remaining}</div>
                </div>
                <div className="text-sm font-bold uppercase tracking-widest">{t(leave.type as any)}</div>
                <div className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `color-mix(in srgb,${leave.hex} 12%,var(--muted-bg))`, color: leave.hex }}>{leave.used} / {leave.total} {t('used')}</div>
              </div>
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
                <div key={leave.id} data-testid={`card-leave-${leave.id}`} onClick={() => saveDetailAndNavigate(setLocation, '/dashboard/detail', { title: `${t('leaveRequest')} #${leave.id}`, badge: t('leaves'), items: [{ label: t('employee'), value: leave.employeeName || leave.employeeId }, { label: t('leaveType'), value: t((leave.type || 'annual') as any) }, { label: t('from'), value: leave.startDate }, { label: t('to'), value: leave.endDate }, { label: t('days'), value: leave.daysCount }, { label: t('reason'), value: leave.reason }, { label: t('status'), value: t((leave.status || 'pending') as any) }] })} className={`rounded-xl overflow-hidden cursor-pointer pressable animate-fadeIn stagger-${(index % 4) + 1}`} style={{ background: 'var(--card)', border: `1px solid color-mix(in srgb, ${config.hex} 30%, var(--border))` }}>
                  {/* Coloured top banner */}
                  <div className={`h-12 bg-gradient-to-r ${config.color} relative overflow-hidden flex items-center px-4 gap-3`}>
                    <div className="nav-card-wave" />
                    <div className="card-orb w-14 h-14 absolute -right-3 -top-3" />
                    <div className="relative z-10 w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center card-icon-pulse">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="relative z-10 text-white font-bold text-sm truncate">{leave.employeeName || `#${leave.employeeId}`}</span>
                    <span className={`relative z-10 ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${leave.status === 'approved' ? 'bg-green-400/30 text-green-100' : leave.status === 'rejected' ? 'bg-red-400/30 text-red-100' : 'bg-amber-400/30 text-amber-100'}`}>{t((leave.status || 'pending') as any)}</span>
                  </div>
                  <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-lg truncate">{leave.employeeName || `#${leave.employeeId}`}</div>
                        <div className="text-xs font-medium mt-1 flex items-center gap-2 flex-wrap">
                          <span className="bg-muted-bg px-2 py-0.5 rounded-md text-foreground capitalize">{t((leave.type || 'annual') as any)}</span>
                          <span className="text-muted-foreground">{leave.daysCount || 0} {t('days')}</span>
                          {leave.id && getAttachment(leave.id) && (
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setViewAttachment(getAttachment(leave.id!)); }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>مرفق</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:items-end gap-2 border-t border-border sm:border-0 pt-3 sm:pt-0">
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full">
                        <span className="font-data text-sm opacity-80">{leave.startDate || '—'} → {leave.endDate || '—'}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColor(leave.status)}`}>{t((leave.status || 'pending') as any)}</span>
                            {leave.status === 'approved' && (
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${leave.paymentStatus === 'unpaid' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}>
                                {leave.paymentStatus === 'unpaid' ? 'غير مدفوعة' : 'مدفوعة'}
                              </span>
                            )}
                          </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end" onClick={(event) => event.stopPropagation()}>
                        {leave.status === 'pending' && (
                          <>
                            <button data-testid={`button-approve-leave-paid-${leave.id}`} aria-label="موافقة مدفوعة" onClick={() => updateStatus(leave, 'approved', 'paid')} className="h-8 px-2 flex items-center justify-center gap-1 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors text-[10px] font-bold"><CheckCircle2 className="w-4 h-4" /> مدفوعة</button>
                            <button data-testid={`button-approve-leave-unpaid-${leave.id}`} aria-label="موافقة غير مدفوعة" onClick={() => updateStatus(leave, 'approved', 'unpaid')} className="h-8 px-2 flex items-center justify-center gap-1 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white transition-colors text-[10px] font-bold"><CheckCircle2 className="w-4 h-4" /> غير مدفوعة</button>
                            <button data-testid={`button-reject-leave-${leave.id}`} aria-label={t('rejected')} onClick={() => updateStatus(leave, 'rejected')} className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
                          </>
                        )}
                        <button data-testid={`button-delete-leave-${leave.id}`} aria-label={t('delete')} onClick={() => setDeleteId(leave.id || null)} className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  </div>{/* /p-4 */}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div className="rounded-3xl w-full max-w-md shadow-2xl card-3d max-h-[90dvh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            {/* Colorful wave header */}
            <div className="relative h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-t-3xl overflow-hidden flex items-center px-5 gap-3 flex-shrink-0">
              <div className="nav-card-wave" />
              <div className="card-orb w-20 h-20 absolute -right-4 -top-4" />
              <div className="relative z-10 w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg card-icon-pulse">
                <CalendarHeart className="h-5 w-5 text-white" />
              </div>
              <div className="relative z-10">
                <h2 className="font-display text-lg font-bold text-white">{t('newLeaveRequest')}</h2>
                <p className="text-white/65 text-xs">{t('leaveType')} · {t('startDate')}</p>
              </div>
            </div>
            <form onSubmit={handleCreate} className="space-y-5 p-6">
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

              {/* ── File Upload ── */}
              <div className="space-y-2">
                <span className="block text-sm font-bold">المستند الداعم <span className="text-muted-foreground font-normal text-xs">(اختياري)</span></span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => handleFileChange(e.target.files?.[0] || null)}
                />
                {!attachmentPreview ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-7 cursor-pointer transition-all ${isDragging ? 'border-emerald-400 bg-emerald-500/10' : 'border-border hover:border-emerald-400/60 hover:bg-emerald-500/5'}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">اضغط لرفع الملف أو اسحبه هنا</p>
                      <p className="text-xs text-muted-foreground mt-1">صورة، PDF، أو مستند Word</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                        <Image className="h-3.5 w-3.5" /> صورة
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" /> PDF / Doc
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-emerald-400/40 bg-emerald-500/5 p-3">
                    <div className="flex items-center gap-3">
                      {attachment?.type.startsWith('image/') ? (
                        <img src={attachmentPreview} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-7 w-7 text-emerald-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate">{attachment?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{((attachment?.size || 0) / 1024).toFixed(1)} KB</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-1 text-xs text-emerald-500 hover:text-emerald-400 font-bold transition-colors"
                        >
                          تغيير الملف
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAttachment(null); setAttachmentPreview(null); }}
                        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-3 rounded-xl font-bold bg-muted hover:bg-muted/80 transition-colors">{t('cancel')}</button>
                <button disabled={createMutation.isPending} type="submit" className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-teal-500/25">{createMutation.isPending ? t('loading') : t('submit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
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

      {/* ── Attachment Viewer ── */}
      {viewAttachment && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={() => setViewAttachment(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl card-3d overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-emerald-500" />
                <span className="font-bold text-sm">المستند المرفق</span>
              </div>
              <button
                onClick={() => setViewAttachment(null)}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 flex items-center justify-center min-h-[300px] bg-black/20">
              {viewAttachment.startsWith('data:image/') ? (
                <img
                  src={viewAttachment}
                  alt="المستند المرفق"
                  className="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-2xl"
                />
              ) : viewAttachment.startsWith('data:application/pdf') ? (
                <iframe
                  src={viewAttachment}
                  className="w-full h-[70vh] rounded-xl border border-border"
                  title="PDF مرفق"
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-emerald-500 mb-4 opacity-60" />
                  <p className="font-bold text-lg">مستند مرفق</p>
                  <p className="text-muted-foreground text-sm mt-1">لا يمكن معاينة هذا النوع من الملفات</p>
                  <a
                    href={viewAttachment}
                    download="attachment"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition-colors"
                  >
                    تحميل الملف
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            {viewAttachment.startsWith('data:image/') && (
              <div className="px-5 py-3 border-t border-border flex justify-end">
                <a
                  href={viewAttachment}
                  download="attachment"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-sm font-bold transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 rotate-180" />
                  تحميل
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
