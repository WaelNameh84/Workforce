import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetAttendance, getGetAttendanceQueryKey, useUpdateAttendance,
  useGetEmployees, getGetEmployeesQueryKey,
} from '@workspace/api-client-react';

import {
  Clock, CheckCircle2, XCircle, Search, Filter, Edit3,
  Timer, AlertTriangle, User, Calendar, ChevronDown, RefreshCw,
} from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const toInputTime = (s?: string | null) => {
  if (!s) return '';
  const d = new Date(s);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

type ATRow = { id?: number; employeeId?: number; date?: string; clockIn?: string; clockOut?: string; totalHours?: number; justificationType?: string; justificationStatus?: string; notes?: string; [k: string]: unknown };

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    late:      { label: 'متأخر', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    early:     { label: 'مبكر', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    overtime:  { label: 'إضافي', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
    approved:  { label: 'معتمد', cls: 'bg-green-500/15 text-green-300 border-green-500/30' },
    rejected:  { label: 'مرفوض', cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
    pending:   { label: 'معلق', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
    other:     { label: 'آخر', cls: 'bg-slate-500/15 text-slate-300 border-slate-600/30' },
  };
  const m = map[status || ''] || { label: status || '—', cls: 'bg-slate-500/15 text-slate-400 border-slate-600/30' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold ${m.cls}`}>{m.label}</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AttendanceCorrection() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cid = user?.companyId || 0;
  const isRTL = locale === 'ar';

  const [search, setSearch] = useState('');
  const [filterEmp, setFilterEmp] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [editing, setEditing] = useState<ATRow | null>(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: attData, isLoading, refetch } = useGetAttendance(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetAttendanceQueryKey({ companyId: cid }) } },
  );
  const { data: empData } = useGetEmployees(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetEmployeesQueryKey({ companyId: cid }) } },
  );
  const updateAtt = useUpdateAttendance();

  const employees = empData?.employees || [];
  const empMap = useMemo(() => {
    const m: Record<number, string> = {};
    employees.forEach(e => { if (e.id) m[e.id] = e.fullName || '—'; });
    return m;
  }, [employees]);

  const rows: ATRow[] = useMemo(() => {
    const all = (attData?.attendance || []) as ATRow[];
    return all.filter(r => {
      const empName = empMap[r.employeeId || 0] || '';
      const matchEmp  = filterEmp  === 'all' || String(r.employeeId) === filterEmp;
      const matchType = filterType === 'all' || r.justificationType === filterType || r.justificationStatus === filterType;
      const matchSearch = !search || empName.toLowerCase().includes(search.toLowerCase());
      return matchEmp && matchType && matchSearch;
    }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [attData, filterEmp, filterType, search, empMap]);

  const lateRows = rows.filter(r => r.justificationType === 'late' || r.justificationStatus === 'pending');

  function openEdit(r: ATRow) {
    setEditing(r);
    setEditClockIn(toInputTime(r.clockIn));
    setEditClockOut(toInputTime(r.clockOut));
    setEditNotes((r.notes as string) || '');
  }

  async function handleSave() {
    if (!editing?.id) return;
    setSaving(true);
    try {
      const base = editing.date ? editing.date.split('T')[0] : new Date().toISOString().split('T')[0];
      const toISO = (t: string) => t ? `${base}T${t}:00.000Z` : undefined;
      await updateAtt.mutateAsync({
        id: editing.id,
        data: { clockIn: toISO(editClockIn), clockOut: toISO(editClockOut), notes: editNotes, justificationStatus: 'approved' } as any,
      });
      toast({ title: t('attendanceCorrected') });
      queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey({ companyId: cid }) });
      setEditing(null);
    } catch {
      toast({ variant: 'destructive', title: t('error') });
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(r: ATRow) {
    if (!r.id) return;
    try {
      await updateAtt.mutateAsync({ id: r.id, data: { justificationStatus: 'approved' } as any });
      toast({ title: t('approved') });
      queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey({ companyId: cid }) });
    } catch { toast({ variant: 'destructive', title: t('error') }); }
  }

  async function handleReject(r: ATRow) {
    if (!r.id) return;
    try {
      await updateAtt.mutateAsync({ id: r.id, data: { justificationStatus: 'rejected' } as any });
      toast({ title: t('rejected') });
      queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey({ companyId: cid }) });
    } catch { toast({ variant: 'destructive', title: t('error') }); }
  }

  const pendingCount = rows.filter(r => r.justificationStatus === 'pending').length;

  return (
    <div className="space-y-6 animate-fadeIn" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('attendanceCorrection')}</h1>
          <p className="text-sm mt-1 text-muted-foreground">{t('attendanceCorrectionDesc')}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:border-amber-500/40 text-sm font-bold transition"
        >
          <RefreshCw className="w-4 h-4" /> {t('refresh') || 'تحديث'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('totalRecords') || 'إجمالي السجلات', val: rows.length, color: 'amber', icon: Clock },
          { label: t('pendingCorrections') || 'بانتظار التصحيح', val: pendingCount, color: 'orange', icon: AlertTriangle },
          { label: t('lateArrivals'), val: rows.filter(r => r.justificationType === 'late').length, color: 'rose', icon: Timer },
          { label: t('approved'), val: rows.filter(r => r.justificationStatus === 'approved').length, color: 'green', icon: CheckCircle2 },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label}
            className="living-card p-4 text-center"
            style={{ '--card-accent': color === 'amber' ? '#f59e0b' : color === 'orange' ? '#f97316' : color === 'rose' ? '#fb7185' : '#22c55e' } as React.CSSProperties}
          >
            <span className="living-card-orb" style={{ top: '-1rem', right: '-0.5rem' }} />
            <Icon className={`w-5 h-5 mx-auto mb-1.5 text-${color}-400`} />
            <p className={`text-2xl font-black text-${color}-300`}>{val}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-3d p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('searchEmployee')}
            className="w-full rounded-xl border border-border bg-background h-10 ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
          />
        </div>
        <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 h-10 text-sm focus:outline-none">
          <option value="all">{t('allEmployees')}</option>
          {employees.map(e => <option key={e.id} value={String(e.id)}>{e.fullName}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 h-10 text-sm focus:outline-none">
          <option value="all">{t('allTypes') || 'كل الأنواع'}</option>
          <option value="late">{t('lateArrival')}</option>
          <option value="early">{t('earlyDeparture')}</option>
          <option value="overtime">{t('overtime')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="approved">{t('approved')}</option>
        </select>
      </div>

      {/* Records */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card-3d h-20 animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <div className="card-3d p-16 text-center">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
          <p className="font-bold text-muted-foreground">{t('noRecordsFound')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => {
            const empName = empMap[r.employeeId || 0] || `#${r.employeeId}`;
            const isPending = r.justificationStatus === 'pending';
            return (
              <div key={r.id}
                className="living-card px-5 py-4 flex items-center gap-4 group"
                style={{ '--card-accent': isPending ? '#f97316' : '#6366f1' } as React.CSSProperties}
              >
                <span className="living-card-orb" style={{ top: '-1rem', right: '-0.5rem' }} />
                {/* Employee avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{empName}</span>
                    {r.justificationType && <StatusBadge status={r.justificationType} />}
                    {r.justificationStatus && <StatusBadge status={r.justificationStatus} />}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {fmtDate(r.date)} · {t('clockIn')}: {fmtTime(r.clockIn)} · {t('clockOut')}: {fmtTime(r.clockOut)}
                    {r.totalHours ? ` · ${Number(r.totalHours).toFixed(1)}h` : ''}
                  </p>
                  {r.notes && <p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-1">{String(r.notes)}</p>}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(r)}
                    className="p-2 rounded-xl hover:bg-amber-500/15 text-amber-400 transition">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {isPending && <>
                    <button onClick={() => handleApprove(r)}
                      className="p-2 rounded-xl hover:bg-green-500/15 text-green-400 transition">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReject(r)}
                      className="p-2 rounded-xl hover:bg-red-500/15 text-red-400 transition">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Drawer */}
      <Drawer open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="border-b border-border/50 pb-3">
            <DrawerTitle className="flex items-center gap-2.5 font-display text-xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-white" />
              </div>
              {t('editAttendance') || 'تصحيح الحضور'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {editing && (
              <>
                <div className="living-card p-4 space-y-1"
                  style={{ '--card-accent': '#f59e0b' } as React.CSSProperties}>
                  <span className="living-card-orb" style={{ top: '-1rem', right: '-0.5rem' }} />
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">{t('employee')}</p>
                  <p className="font-bold">{empMap[editing.employeeId || 0] || '—'}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(editing.date)}</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('clockIn')}</label>
                    <input type="time" value={editClockIn} onChange={e => setEditClockIn(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 h-11 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('clockOut')}</label>
                    <input type="time" value={editClockOut} onChange={e => setEditClockOut(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 h-11 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('notes') || 'ملاحظات التصحيح'}</label>
                    <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
                      placeholder={t('correctionReason') || 'سبب التصحيح...'}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition resize-none" />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="px-4 py-3 border-t border-border/50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
            <button onClick={handleSave} disabled={saving}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm disabled:opacity-50 transition">
              {saving ? t('saving') : (t('saveCorrection') || 'حفظ التصحيح ✓')}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
