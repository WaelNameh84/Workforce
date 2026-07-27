import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  useGetPayroll, getGetPayrollQueryKey,
  useGetEmployees, getGetEmployeesQueryKey,
  useGetAttendance, getGetAttendanceQueryKey,
  useGetLeaves, getGetLeavesQueryKey,
  useGetRequests, getGetRequestsQueryKey,
} from '@workspace/api-client-react';
import { downloadCsv, downloadTextFile } from '@/lib/download';
import { useToast } from '@/components/ui/use-toast';
import {
  FileText, Download, BarChart3, TrendingUp, Clock3, WalletCards,
  Mail, Share2, Printer, Users, CalendarCheck, Inbox,
  CheckCircle2, Send, HardDrive, X, ChevronDown, ChevronRight,
  User, Search, UserCheck,
} from 'lucide-react';

const money = (v?: string | number | null) => Number(v || 0);
const fmt = (n: number) =>
  new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(n);
const now = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
const period = new Date().toISOString().slice(0, 7);

// ─── Combined export modal ────────────────────────────────────────────────────
function CombinedExportModal({
  onClose, lines,
}: { onClose: () => void; lines: string[]; }) {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const body   = lines.join('\n');
  const subject = `تقرير WorkforceOS الشامل — ${now}`;

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    toast({ title: 'تم فتح تطبيق البريد الإلكتروني' });
  };

  const handleSave = () => {
    downloadTextFile(`workforce-report-${period}.txt`, body);
    toast({ title: 'تم حفظ التقرير على جهازك ✓' });
  };

  const handleCsv = () => {
    // Build quick CSV of all sections
    const headers = ['القسم', 'التفاصيل', 'القيمة'];
    const rows: [string, string, string][] = lines
      .filter(l => l.trim())
      .map(l => {
        const [label, ...rest] = l.split(':');
        return [label?.trim() || '', rest.join(':').trim(), ''];
      });
    downloadCsv(`workforce-report-${period}.csv`, headers, rows);
    toast({ title: 'تم تصدير CSV ✓' });
  };

  const handlePrint = () => { window.print(); };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: subject, text: body });
    } else {
      navigator.clipboard?.writeText(body);
      toast({ title: 'تم نسخ التقرير ✓' });
    }
  };

  const actions = [
    { icon: Mail,      label: 'إرسال بالإيميل',  sub: 'يفتح تطبيق البريد',     fn: handleEmail, color: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' },
    { icon: HardDrive, label: 'حفظ على الجهاز',   sub: 'ملف نصي .txt',           fn: handleSave,  color: 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' },
    { icon: Download,  label: 'تصدير CSV',         sub: 'جدول بيانات',            fn: handleCsv,   color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' },
    { icon: Printer,   label: 'طباعة / PDF',       sub: 'حفظ كـ PDF من المتصفح', fn: handlePrint, color: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20' },
    { icon: Share2,    label: 'مشاركة',            sub: 'نسخ أو تطبيق المشاركة', fn: handleShare, color: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-border shadow-2xl" style={{ background: 'var(--card)' }}>
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-lg">إرسال التقرير الشامل</h2>
            <p className="text-xs text-muted-foreground mt-0.5">جميع الأقسام في ملف واحد — {now}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition border border-border">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* preview snippet */}
        <div className="mx-5 mt-4 rounded-xl border border-border p-3 text-xs font-mono text-muted-foreground max-h-32 overflow-y-auto" style={{ background: 'var(--muted-bg)' }}>
          {lines.slice(0, 12).map((l, i) => <div key={i}>{l}</div>)}
          {lines.length > 12 && <div className="text-indigo-400 mt-1">... و {lines.length - 12} سطر إضافي</div>}
        </div>

        {/* actions */}
        <div className="p-5 space-y-2.5">
          {actions.map(a => (
            <button
              key={a.label}
              onClick={a.fn}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition pressable ${a.color}`}
            >
              <a.icon className="w-5 h-5 shrink-0" />
              <div className="text-right flex-1">
                <div className="font-bold text-sm">{a.label}</div>
                <div className="text-xs opacity-70">{a.sub}</div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          ))}
        </div>

        {sent && (
          <div className="mx-5 mb-5 flex items-center gap-2 text-green-400 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" /> تم تهيئة الإرسال
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section export modal ──────────────────────────────────────────────────────
function SectionExportModal({
  title, lines, onClose,
}: { title: string; lines: string[]; onClose: () => void }) {
  const { toast } = useToast();
  const body    = lines.join('\n');
  const subject = `${title} — ${now}`;

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast({ title: 'تم فتح البريد الإلكتروني' });
  };
  const handleSave = () => {
    downloadTextFile(`report-${Date.now()}.txt`, body);
    toast({ title: 'تم حفظ الملف ✓' });
  };
  const handlePrint = () => window.print();
  const handleShare = async () => {
    if (navigator.share) await navigator.share({ title: subject, text: body });
    else { navigator.clipboard?.writeText(body); toast({ title: 'تم النسخ ✓' }); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl border border-border shadow-2xl" style={{ background: 'var(--card)' }}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-2">
          {[
            { icon: Mail,      label: 'إرسال بالإيميل', fn: handleEmail },
            { icon: HardDrive, label: 'حفظ على الجهاز',  fn: handleSave  },
            { icon: Printer,   label: 'طباعة / PDF',      fn: handlePrint },
            { icon: Share2,    label: 'مشاركة',           fn: handleShare },
          ].map(a => (
            <button key={a.label} onClick={a.fn}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border hover:border-indigo-500/40 hover:bg-indigo-500/5 transition text-sm font-medium">
              <a.icon className="w-4 h-4 text-indigo-400" />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Employee picker dropdown ─────────────────────────────────────────────────
function EmployeePicker({
  employees, selectedId, onSelect, onClear,
}: {
  employees: any[];
  selectedId: number | null;
  onSelect: (id: number, name: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen]   = useState(false);
  const [q, setQ]         = useState('');
  const ref               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = employees.filter(e =>
    !q || (e.fullName || '').toLowerCase().includes(q.toLowerCase()) ||
    (e.position || '').toLowerCase().includes(q.toLowerCase())
  );

  const selected = employees.find(e => e.id === selectedId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition ${
          selectedId
            ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
            : 'border-border hover:border-indigo-500/30 hover:bg-indigo-500/5'
        }`}
      >
        {selectedId ? (
          <>
            <UserCheck className="w-4 h-4 shrink-0" />
            <span className="max-w-[120px] truncate">{selected?.fullName || 'موظف'}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={e => { e.stopPropagation(); onClear(); setOpen(false); }}
              onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), onClear(), setOpen(false))}
              className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/30 hover:bg-red-500/40 hover:text-red-300 transition"
            >
              <X className="w-2.5 h-2.5" />
            </span>
          </>
        ) : (
          <>
            <User className="w-4 h-4" />
            اختيار موظف
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {open && (
        <div
          dir="rtl"
          className="absolute left-0 top-full mt-2 z-30 w-64 rounded-2xl border border-border shadow-2xl overflow-hidden"
          style={{ background: 'var(--card)' }}
        >
          {/* search */}
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-white/5 text-sm">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="بحث عن موظف..."
                className="bg-transparent outline-none w-full text-sm"
              />
              {q && (
                <button onClick={() => setQ('')} className="text-muted-foreground hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* all employees option */}
          <button
            onClick={() => { onClear(); setOpen(false); setQ(''); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition hover:bg-white/5 border-b border-border ${!selectedId ? 'text-indigo-400' : ''}`}
          >
            <Users className="w-4 h-4 shrink-0 text-indigo-400" />
            كل الموظفين
            {!selectedId && <CheckCircle2 className="w-3.5 h-3.5 mr-auto text-indigo-400" />}
          </button>

          {/* list */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground text-center">لا نتائج</p>
            ) : filtered.map((emp: any) => (
              <button
                key={emp.id}
                onClick={() => { onSelect(emp.id, emp.fullName); setOpen(false); setQ(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-white/5 ${selectedId === emp.id ? 'text-indigo-300 bg-indigo-500/5' : ''}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                  {(emp.fullName || '?').charAt(0)}
                </span>
                <div className="text-right min-w-0">
                  <p className="font-bold truncate">{emp.fullName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{emp.position || emp.department || '—'}</p>
                </div>
                {selectedId === emp.id && <CheckCircle2 className="w-3.5 h-3.5 mr-auto text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Reports() {
  const { user } = useAuth();
  const { t }    = useLanguage();
  const { toast } = useToast();
  const [showCombined, setShowCombined]       = useState(false);
  const [sectionExport, setSectionExport]     = useState<{ title: string; lines: string[] } | null>(null);
  const [selectedEmpId, setSelectedEmpId]     = useState<number | null>(null);
  const [selectedEmpName, setSelectedEmpName] = useState<string>('');

  const cid = user?.companyId || 0;

  const { data: payrollData  } = useGetPayroll(   { companyId: cid, period }, { query: { enabled: !!cid, queryKey: getGetPayrollQueryKey({ companyId: cid, period }) } });
  const { data: empData      } = useGetEmployees(  { companyId: cid },         { query: { enabled: !!cid, queryKey: getGetEmployeesQueryKey({ companyId: cid }) } });
  const { data: attData      } = useGetAttendance( { companyId: cid },         { query: { enabled: !!cid, queryKey: getGetAttendanceQueryKey({ companyId: cid }) } });
  const { data: leaveData    } = useGetLeaves(     { companyId: cid },         { query: { enabled: !!cid, queryKey: getGetLeavesQueryKey({ companyId: cid }) } });
  const { data: requestsData } = useGetRequests(   { companyId: cid },         { query: { enabled: !!cid, queryKey: getGetRequestsQueryKey({ companyId: cid }) } });

  const allPayrollRows  = payrollData?.payroll   || [];
  const employees       = empData?.employees     || [];
  const allAttRows: any[]     = (attData as any)?.attendance  || [];
  const allLeaveRows: any[]   = leaveData?.leaves || [];
  const allRequestRows: any[] = (requestsData as any)?.requests || [];

  // ── Filter by selected employee ──
  const payrollRows  = selectedEmpId ? allPayrollRows.filter(r => r.employeeId === selectedEmpId) : allPayrollRows;
  const attRows      = selectedEmpId ? allAttRows.filter((r: any) => r.employeeId === selectedEmpId) : allAttRows;
  const leaveRows    = selectedEmpId ? allLeaveRows.filter((r: any) => r.employeeId === selectedEmpId) : allLeaveRows;
  const requestRows  = selectedEmpId ? allRequestRows.filter((r: any) => r.employeeId === selectedEmpId) : allRequestRows;

  // ── Aggregate stats ──
  const totalNet      = payrollRows.reduce((s, r) => s + money(r.netSalary), 0);
  const totalGross    = payrollRows.reduce((s, r) => s + money(r.basicSalary) + money(r.overtime) + money(r.bonus), 0);
  const totalOvertime = payrollRows.reduce((s, r) => s + money(r.overtime), 0);
  const paidCount     = payrollRows.filter(r => r.status === 'paid').length;
  const pendingCount  = payrollRows.filter(r => r.status !== 'paid').length;
  const activeEmp     = employees.filter(e => e.status === 'active').length;
  const presentToday  = attRows.filter((a: any) => a.clockIn && !a.clockOut).length;
  const approvedLeaves= leaveRows.filter(l => l.status === 'approved').length;
  const pendingLeaves = leaveRows.filter(l => l.status === 'pending').length;
  const pendingReqs   = requestRows.filter(r => r.status === 'pending').length;

  // ── Build section report lines ──
  const payrollLines = [
    `═══ تقرير الرواتب ═══`,
    `التاريخ: ${now}  |  الفترة: ${period}`,
    ``,
    `إجمالي الرواتب الصافية : ${fmt(totalNet)}`,
    `إجمالي الرواتب الإجمالية: ${fmt(totalGross)}`,
    `بدل العمل الإضافي       : ${fmt(totalOvertime)}`,
    `رواتب مدفوعة           : ${paidCount} موظف`,
    `رواتب معلقة            : ${pendingCount} موظف`,
    ``,
    ...payrollRows.map(r => `  • ${r.employeeName || r.employeeId} — صافي: ${fmt(money(r.netSalary))}  [${r.status === 'paid' ? 'مدفوع' : 'معلق'}]`),
  ];

  const attendanceLines = [
    `═══ تقرير الحضور ═══`,
    `التاريخ: ${now}`,
    ``,
    `إجمالي سجلات الحضور: ${attRows.length}`,
    `حاضرون الآن        : ${presentToday}`,
    `غائبون اليوم        : ${activeEmp - presentToday}`,
    ``,
    ...attRows.slice(0, 15).map((a: any) => `  • ${a.employeeName || a.employeeId} — ${a.date} — دخول: ${a.clockIn ? new Date(a.clockIn).toLocaleTimeString('ar') : '—'} خروج: ${a.clockOut ? new Date(a.clockOut).toLocaleTimeString('ar') : '—'}`),
  ];

  const leavesLines = [
    `═══ تقرير الإجازات ═══`,
    `التاريخ: ${now}`,
    ``,
    `إجمالي طلبات الإجازة: ${leaveRows.length}`,
    `موافق عليها         : ${approvedLeaves}`,
    `قيد الانتظار         : ${pendingLeaves}`,
    ``,
    ...leaveRows.map((l: any) => `  • ${l.employeeName || l.employeeId} — ${l.type} — ${l.startDate} → ${l.endDate} — ${l.daysCount} أيام [${l.status}]`),
  ];

  const employeesLines = [
    `═══ تقرير الموظفين ═══`,
    `التاريخ: ${now}`,
    ``,
    `إجمالي الموظفين: ${employees.length}`,
    `نشط             : ${activeEmp}`,
    ``,
    ...employees.map(e => `  • ${e.fullName} — ${e.position || '—'} — ${e.email}`),
  ];

  const requestsLines = [
    `═══ تقرير الطلبات ═══`,
    `التاريخ: ${now}`,
    ``,
    `إجمالي الطلبات: ${requestRows.length}`,
    `معلقة          : ${pendingReqs}`,
    ``,
    ...requestRows.map((r: any) => `  • ${r.employeeName || r.employeeId} — ${r.type} — ${r.title} [${r.status}]`),
  ];

  const combinedLines = [
    `WorkforceOS — التقرير الشامل`,
    `تاريخ الإصدار: ${now}`,
    `الشركة: ${user?.fullName || '—'}`,
    ``,
    ...payrollLines,
    ``,
    ...attendanceLines,
    ``,
    ...leavesLines,
    ``,
    ...employeesLines,
    ``,
    ...requestsLines,
  ];

  // ── Section cards ──
  const sections = [
    {
      key: 'payroll',
      title: 'تقرير الرواتب',
      icon: WalletCards,
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10 border-green-500/20',
      stats: [
        { label: 'صافي الرواتب', value: fmt(totalNet) },
        { label: 'مدفوع',        value: `${paidCount} موظف` },
        { label: 'معلق',         value: `${pendingCount} موظف` },
      ],
      lines: payrollLines,
    },
    {
      key: 'attendance',
      title: 'تقرير الحضور',
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10 border-blue-500/20',
      stats: [
        { label: 'إجمالي السجلات', value: String(attRows.length) },
        { label: 'حاضرون الآن',    value: String(presentToday) },
        { label: 'الموظفون النشطون', value: String(activeEmp) },
      ],
      lines: attendanceLines,
    },
    {
      key: 'leaves',
      title: 'تقرير الإجازات',
      icon: CalendarCheck,
      color: 'from-teal-500 to-cyan-500',
      bg: 'bg-teal-500/10 border-teal-500/20',
      stats: [
        { label: 'إجمالي الطلبات', value: String(leaveRows.length) },
        { label: 'موافق عليها',    value: String(approvedLeaves) },
        { label: 'قيد الانتظار',  value: String(pendingLeaves) },
      ],
      lines: leavesLines,
    },
    {
      key: 'employees',
      title: 'تقرير الموظفين',
      icon: Users,
      color: 'from-purple-500 to-violet-500',
      bg: 'bg-purple-500/10 border-purple-500/20',
      stats: [
        { label: 'إجمالي الموظفين', value: String(employees.length) },
        { label: 'نشط',             value: String(activeEmp) },
        { label: 'إضافي',          value: fmt(totalOvertime) },
      ],
      lines: employeesLines,
    },
    {
      key: 'overtime',
      title: 'تقرير الإضافي',
      icon: Clock3,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10 border-amber-500/20',
      stats: [
        { label: 'بدل الإضافي', value: fmt(totalOvertime) },
        { label: 'الموظفون',    value: String(payrollRows.filter(r => money(r.overtime) > 0).length) },
        { label: 'متوسط/موظف', value: fmt(payrollRows.length ? totalOvertime / payrollRows.length : 0) },
      ],
      lines: [
        `═══ تقرير العمل الإضافي ═══`,
        `التاريخ: ${now}  |  الفترة: ${period}`,
        ``,
        `إجمالي بدل الإضافي: ${fmt(totalOvertime)}`,
        ``,
        ...payrollRows.filter(r => money(r.overtime) > 0).map(r => `  • ${r.employeeName || r.employeeId} — ${fmt(money(r.overtime))}`),
      ],
    },
    {
      key: 'requests',
      title: 'تقرير الطلبات',
      icon: Inbox,
      color: 'from-orange-500 to-red-500',
      bg: 'bg-orange-500/10 border-orange-500/20',
      stats: [
        { label: 'إجمالي الطلبات', value: String(requestRows.length) },
        { label: 'معلقة',          value: String(pendingReqs) },
        { label: 'موافق عليها',   value: String(requestRows.filter((r: any) => r.status === 'approved').length) },
      ],
      lines: requestsLines,
    },
  ];

  const summaryStats = [
    { label: 'إجمالي الرواتب', value: fmt(totalNet),          icon: WalletCards, color: 'from-green-500 to-emerald-500' },
    { label: 'الموظفون النشطون', value: String(activeEmp),    icon: Users,       color: 'from-blue-500 to-cyan-500' },
    { label: 'طلبات معلقة',    value: String(pendingReqs),    icon: Inbox,       color: 'from-amber-500 to-orange-500' },
    { label: 'إجازات موافق عليها', value: String(approvedLeaves), icon: CalendarCheck, color: 'from-teal-500 to-cyan-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn" dir={useLanguage().locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">التقارير</h1>
          <p className="text-sm text-muted-foreground mt-1">
            تقارير مباشرة مربوطة بجميع أقسام النظام
            {selectedEmpId && (
              <span className="inline-flex items-center gap-1 mr-2 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                <UserCheck className="w-3 h-3" /> {selectedEmpName}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <EmployeePicker
            employees={employees}
            selectedId={selectedEmpId}
            onSelect={(id, name) => { setSelectedEmpId(id); setSelectedEmpName(name); }}
            onClear={() => { setSelectedEmpId(null); setSelectedEmpName(''); }}
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-white/5 transition"
          >
            <Printer className="w-4 h-4" /> طباعة
          </button>
        </div>
      </div>

      {/* ── COMBINED REPORT BANNER ────────────────────────────── */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Send className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-xl">إرسال تقرير شامل بكل الأقسام</h2>
            <p className="text-sm text-muted-foreground mt-1">
              رواتب + حضور + إجازات + موظفون + طلبات — في ملف واحد جاهز للإرسال
            </p>
          </div>
          <button
            onClick={() => setShowCombined(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 shrink-0"
          >
            <Send className="w-4 h-4" /> إرسال التقرير الكامل
          </button>
        </div>

        {/* quick export row */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-indigo-500/20">
          <span className="text-xs text-muted-foreground self-center ml-1">إرسال سريع:</span>
          <button
            onClick={() => {
              const body = combinedLines.join('\n');
              window.location.href = `mailto:?subject=${encodeURIComponent(`WorkforceOS — تقرير شامل — ${now}`)}&body=${encodeURIComponent(body)}`;
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition"
          >
            <Mail className="w-3.5 h-3.5" /> إيميل
          </button>
          <button
            onClick={() => { downloadTextFile(`workforce-report-${period}.txt`, combinedLines.join('\n')); toast({ title: 'تم الحفظ ✓' }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20 transition"
          >
            <HardDrive className="w-3.5 h-3.5" /> حفظ
          </button>
          <button
            onClick={() => { downloadCsv(`workforce-${period}.csv`, ['القسم','التفاصيل'], combinedLines.filter(l=>l.trim()).map(l=>{ const [a,...b]=l.split(':'); return [a.trim(), b.join(':').trim()]; })); toast({ title: 'تم التصدير CSV ✓' }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={async () => { if (navigator.share) await navigator.share({ title: 'تقرير WorkforceOS', text: combinedLines.join('\n') }); else { navigator.clipboard?.writeText(combinedLines.join('\n')); toast({ title: 'تم النسخ ✓' }); } }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition"
          >
            <Share2 className="w-3.5 h-3.5" /> مشاركة
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition"
          >
            <Printer className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* ── Summary stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => (
          <div key={s.label} className={`rounded-2xl border border-border p-5 animate-fadeIn stagger-${i + 1}`} style={{ background: 'var(--card)' }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-md`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div className="font-data font-bold text-xl mb-0.5">{s.value}</div>
            <div className="text-xs text-muted-foreground font-bold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Section label ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">تقارير الأقسام</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ── Section cards ──────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec, i) => (
          <div
            key={sec.key}
            className={`rounded-2xl border border-border p-5 animate-fadeIn stagger-${(i % 4) + 1} hover:border-indigo-500/30 transition-all`}
            style={{ background: 'var(--card)' }}
          >
            {/* section header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sec.color} flex items-center justify-center shadow-md shrink-0`}>
                <sec.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-base">{sec.title}</h3>
            </div>

            {/* mini stats */}
            <div className="space-y-2 mb-4">
              {sec.stats.map(st => (
                <div key={st.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{st.label}</span>
                  <span className="font-data font-bold">{st.value}</span>
                </div>
              ))}
            </div>

            {/* export row */}
            <div className="flex gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setSectionExport({ title: sec.title, lines: sec.lines })}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-bold hover:border-indigo-500/40 hover:bg-indigo-500/5 transition"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400" /> إرسال
              </button>
              <button
                onClick={() => { downloadTextFile(`${sec.key}-${period}.txt`, sec.lines.join('\n')); toast({ title: 'تم الحفظ ✓' }); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-bold hover:border-green-500/40 hover:bg-green-500/5 transition"
              >
                <Download className="w-3.5 h-3.5 text-green-400" /> حفظ
              </button>
              <button
                onClick={() => {
                  const body = sec.lines.join('\n');
                  window.location.href = `mailto:?subject=${encodeURIComponent(sec.title + ' — ' + now)}&body=${encodeURIComponent(body)}`;
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-bold hover:border-blue-500/40 hover:bg-blue-500/5 transition"
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" /> إيميل
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      {showCombined && (
        <CombinedExportModal lines={combinedLines} onClose={() => setShowCombined(false)} />
      )}
      {sectionExport && (
        <SectionExportModal
          title={sectionExport.title}
          lines={sectionExport.lines}
          onClose={() => setSectionExport(null)}
        />
      )}

      {/* print styles */}
      <style>{`
        @media print {
          header, aside, nav, button, .bottom-nav { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}
