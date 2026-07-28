import React, { useState, useMemo } from 'react';
import { 
  useGetEmployees, 
  useGetPayroll, 
  useGetAttendance, 
  useGetLeaves, 
  useGetRequests,
  useGetDepartments,
  useCreatePayroll,
  useUpdatePayroll,
  useApprovePayroll,
  useLockPayroll,
  useGetPayrollStats,
  getGetPayrollQueryKey,
  getGetPayrollStatsQueryKey,
  getGetDashboardStatsQueryKey,
  getGetAttendanceQueryKey,
  Employee,
  Payroll
} from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSettings } from '@/contexts/settings-context';
import { useToast } from '@/components/ui/use-toast';
import { buildPayrollSummary, EmployeePaySummary } from '@/lib/payroll-engine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format, subMonths } from 'date-fns';
import { downloadExcel } from '@/lib/download';
import { ar } from 'date-fns/locale';
import { 
  Calculator, 
  FileText, 
  Download, 
  Printer, 
  Lock, 
  CheckCircle2, 
  Coins, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  Share2,
  RefreshCw,
  Save,
  Briefcase,
  Moon,
  Sun,
  Calendar
} from 'lucide-react';

export default function PayrollPage() {
  const { user } = useAuth();
  const settings = useAppSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const cid = user?.companyId || 0;
  
  const today = new Date();
  const [period, setPeriod] = useState(format(today, 'yyyy-MM'));
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [contractTypeFilter, setContractTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedPayslip, setSelectedPayslip] = useState<EmployeePaySummary | null>(null);
  const [recalculating, setRecalculating] = useState<number | null>(null);

  // Data Fetching
  const { data: employeesData } = useGetEmployees({ companyId: cid });
  const { data: deptData } = useGetDepartments({ companyId: cid });
  const { data: payrollData, refetch: refetchPayroll } = useGetPayroll({ companyId: cid, period });
  
  const startDate = `${period}-01`;
  const endDate = `${period}-31`;
  const { data: attendanceData } = useGetAttendance({ companyId: cid, startDate, endDate });
  const { data: leavesData } = useGetLeaves({ companyId: cid });
  const { data: requestsData } = useGetRequests({ companyId: cid });
  const { data: statsData } = useGetPayrollStats({ companyId: cid, period });

  // Mutations
  const createPayroll = useCreatePayroll();
  const updatePayroll = useUpdatePayroll();
  const approvePayroll = useApprovePayroll();
  const lockPayroll = useLockPayroll();

  const buildCfg = () => ({
    workDaysPerMonth: parseInt(settings.workDays || '22', 10),
    dailyHoursScheduled: parseInt(settings.workEnd) - parseInt(settings.workStart) || 8,
    workStart: settings.workStart || '09:00',
    workEnd: settings.workEnd || '17:00',
    breakMin: parseInt(settings.breakMin || '60', 10),
    lateGrace: parseInt(settings.lateGrace || '15', 10),
    otThreshold: parseInt(settings.otThreshold || '60', 10),
    overtimeMultiplier: parseFloat(settings.otMultiplier || '1.5'),
    overtimeWeekendMultiplier: parseFloat(settings.otWeekendMultiplier || '2.0'),
    nightDifferential: parseFloat(settings.nightDifferential || '0.25'),
    lateDeductMultiplier: parseFloat(settings.lateDeductMultiplier || '1.0'),
    weekendDays: (settings.weekendDays || '5,6').split(',').map(Number).filter(n => !isNaN(n)),
    nightStartHour: parseInt(settings.nightStartHour || '22', 10),
    nightEndHour: parseInt(settings.nightEndHour || '6', 10),
    installmentAmount: 0,
  });

  // Process data into summaries
  const summaries = useMemo(() => {
    if (!employeesData?.employees) return [];
    
    let filteredEmployees = employeesData.employees;
    
    if (employeeFilter !== 'all') {
      filteredEmployees = filteredEmployees.filter(e => e.id?.toString() === employeeFilter);
    }
    if (deptFilter !== 'all') {
      filteredEmployees = filteredEmployees.filter(e => e.departmentId?.toString() === deptFilter);
    }
    if (contractTypeFilter !== 'all') {
      filteredEmployees = filteredEmployees.filter(e => (e.contractType || 'monthly') === contractTypeFilter);
    }

    const attendanceRows = attendanceData?.attendance || [];
    const leaveRows = leavesData?.leaves || [];
    const requestRows = requestsData?.requests || [];
    const payrollRecords = payrollData?.payroll || [];

    const cfg = buildCfg();

    let results = filteredEmployees.map(emp => {
      const existing = payrollRecords.find(p => p.employeeId === emp.id) || null;
      const empAttendance = attendanceRows.filter(a => a.employeeId === emp.id);
      const empLeaves = leaveRows.filter(l => l.employeeId === emp.id);
      const empReqs = requestRows.filter(r => r.employeeId === emp.id);

      return buildPayrollSummary(emp, empAttendance, empLeaves, empReqs, existing as Payroll, period, cfg);
    });

    if (statusFilter !== 'all') {
      results = results.filter(r => r.status === statusFilter);
    }

    return results;
  }, [employeesData, attendanceData, leavesData, requestsData, payrollData, settings, period, employeeFilter, deptFilter, contractTypeFilter, statusFilter]);

  const saveOneSummary = async (sum: EmployeePaySummary) => {
    if (sum.status === 'locked') return;
    const payloadBase = {
      employeeId: sum.employeeId,
      basicSalary: sum.basicSalary ?? undefined,
      contractType: sum.contractType as any,
      workedDays: sum.workedDays ?? undefined,
      workedHours: sum.workedHours ?? undefined,
      workedMinutes: sum.workedMinutes ?? undefined,
      workedSeconds: sum.workedSeconds ?? undefined,
      netSalary: sum.netSalary ?? undefined,
      grossSalary: sum.grossSalary ?? undefined,
      totalEarnings: sum.totalEarnings ?? undefined,
      totalDeductions: sum.totalDeductions ?? undefined,
      overtime: sum.overtime ?? undefined,
      deductions: sum.deductions ?? undefined,
      status: 'draft' as any,
    };
    const existing = payrollData?.payroll?.find(p => p.employeeId === sum.employeeId);
    if (existing && existing.id) {
      await updatePayroll.mutateAsync({ id: existing.id, data: payloadBase });
    } else {
      await createPayroll.mutateAsync({ data: { ...payloadBase, period: sum.period!, basicSalary: payloadBase.basicSalary ?? '0' } });
    }
  };

  const refreshConnectedSections = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetPayrollQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetPayrollStatsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey() }),
    ]);
  };

  const handleCalculateAll = async () => {
    toast({ title: 'جاري احتساب الرواتب...', description: 'يرجى الانتظار.' });
    for (const sum of summaries) {
      await saveOneSummary(sum);
    }
    await refreshConnectedSections();
    toast({ title: 'تم', description: 'تم تحديث كافة المسودات بنجاح.', variant: 'default' });
  };

  const handleRecalculateOne = async (sum: EmployeePaySummary) => {
    setRecalculating(sum.employeeId);
    try {
      await saveOneSummary(sum);
      refetchPayroll();
      toast({ title: 'تم الاحتساب', description: `تم تحديث راتب ${sum.employeeName}.` });
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setRecalculating(null);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      'الاسم', 'القسم', 'نوع العقد', 'أيام الحضور', 'أيام الغياب',
      'ساعات العمل', 'إضافي عادي (س)', 'إضافي عطلة (س)', 'تأخير (د)', 'مبكر (د)',
      'الراتب الأساسي', 'أجر الإضافي', 'المكافآت', 'البدلات', 'الاستحقاقات',
      'خصم التأخير', 'خصم الغياب', 'السلف المستردة', 'أقساط السلف', 'الغرامات', 'الخصومات',
      'الصافي', 'الحالة'
    ];
    const rows = summaries.map(s => [
      s.employeeName, s.departmentName,
      s.contractType === 'monthly' ? 'شهري' : s.contractType === 'daily' ? 'يومي' : 'بالساعة',
      parseFloat(s.workedDays || '0'),
      parseFloat(s.absentDays || '0'),
      parseFloat(s.workedHours || '0'),
      s.weekdayOvertimeHours ?? 0,
      s.weekendOvertimeHours ?? 0,
      parseFloat(s.lateMinutes || '0'),
      parseFloat(s.earlyMinutes || '0'),
      parseFloat(s.basicSalary || '0'),
      parseFloat(s.overtime || '0'),
      parseFloat(s.bonus || '0'),
      parseFloat(s.allowances || '0'),
      parseFloat(s.totalEarnings || '0'),
      parseFloat(s.lateDeduction || '0'),
      parseFloat(s.absenceDeduction || '0'),
      parseFloat(s.advances || '0'),
      s.installmentAmount ?? 0,
      parseFloat(s.fines || '0'),
      parseFloat(s.totalDeductions || '0'),
      parseFloat(s.netSalary || '0'),
      s.status || 'draft',
    ]);
    downloadExcel(`مسير_رواتب_${period}.xls`, headers, rows as any);
  };

  const formatMoney = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) || 0 : val;
    const code = settings.currencyCode || 'SEK';
    if (code === 'LOY') return `${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(num)} نق.`;
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary" className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">مسودة</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">قيد المراجعة</Badge>;
      case 'approved': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">معتمد</Badge>;
      case 'paid': return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">مدفوع</Badge>;
      case 'locked': return <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"><Lock className="w-3 h-3 ml-1 inline" /> مقفل</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">الرواتب والأجور</h1>
          <p className="text-muted-foreground mt-1">إدارة رواتب الموظفين، البدلات، الخصومات واعتماد المسيرات الشهرية</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={() => setPeriod(format(subMonths(today, 1), 'yyyy-MM'))}>الشهر الماضي</Button>
          <Button variant="outline" onClick={() => setPeriod(format(today, 'yyyy-MM'))} className={period === format(today, 'yyyy-MM') ? 'border-primary text-primary' : ''}>هذا الشهر</Button>
          <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40 text-left" dir="ltr" />
          <Button variant="outline" onClick={handleExportExcel} className="gap-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </Button>
          <Button onClick={handleCalculateAll} disabled={createPayroll.isPending || updatePayroll.isPending} className="gap-2">
            <Calculator className="w-4 h-4" />
            احتساب الكل
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 p-4 rounded-xl glass">
        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="flex-1 min-w-[180px]"><SelectValue placeholder="كل الموظفين" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الموظفين</SelectItem>
            {employeesData?.employees?.map(e => (
              <SelectItem key={e.id} value={e.id!.toString()}>
                {e.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="القسم" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأقسام</SelectItem>
            {deptData?.departments?.map(d => (
              <SelectItem key={d.id} value={d.id!.toString()}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="نوع العقد" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل العقود</SelectItem>
            <SelectItem value="monthly">شهري</SelectItem>
            <SelectItem value="daily">يومي</SelectItem>
            <SelectItem value="hourly">بالساعة</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="pending">قيد المراجعة</SelectItem>
            <SelectItem value="approved">معتمد</SelectItem>
            <SelectItem value="paid">مدفوع</SelectItem>
            <SelectItem value="locked">مقفل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="إجمالي الرواتب الصافية" value={formatMoney(statsData?.totalNet || 0)} icon={<Coins className="w-5 h-5" />} color="emerald" />
        <StatCard title="إجمالي الاستحقاقات" value={formatMoney(statsData?.totalGross || 0)} icon={<CheckCircle2 className="w-5 h-5" />} color="indigo" />
        <StatCard title="إجمالي الخصومات" value={formatMoney(statsData?.totalDeductions || 0)} icon={<AlertTriangle className="w-5 h-5" />} color="rose" />
        <StatCard title="ساعات العمل" value={statsData?.totalWorkedHours?.toString() || '0'} icon={<Clock className="w-5 h-5" />} color="blue" />
        <StatCard title="ساعات الإضافي" value={statsData?.totalOvertimeHours?.toString() || '0'} icon={<Clock className="w-5 h-5" />} color="amber" />
      </div>

      {/* WORK SCHEDULE INFO */}
      <Card className="border border-border/50 bg-muted/20">
        <CardContent className="p-4 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><Briefcase className="w-4 h-4" /> سياسة العمل الحالية:</div>
          <div><strong>الدوام:</strong> {settings.workStart} - {settings.workEnd}</div>
          <div><strong>أيام العمل:</strong> {settings.workDays || '22'} يوم / الشهر</div>
          <div><strong>فترة راحة:</strong> {settings.breakMin} دقيقة</div>
          <div><strong>سماحية التأخير:</strong> {settings.lateGrace} دقيقة</div>
          <div><strong>حساب الإضافي بعد:</strong> {settings.otThreshold} دقيقة</div>
          <div className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-amber-500" /><strong>إضافي عادي:</strong> 150%</div>
          <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-purple-500" /><strong>إضافي عطلة:</strong> 200%</div>
          <div className="flex items-center gap-1"><Moon className="w-3.5 h-3.5 text-blue-400" /><strong>بدل ليلي:</strong> 25%</div>
        </CardContent>
      </Card>

      {/* PAYROLL CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {summaries.map(sum => (
          <PayrollCard 
            key={sum.employeeId} 
            summary={sum} 
            onClick={() => setSelectedPayslip(sum)} 
            formatMoney={formatMoney} 
            getStatusBadge={getStatusBadge}
            onRecalculate={() => handleRecalculateOne(sum)}
            isRecalculating={recalculating === sum.employeeId}
          />
        ))}
        {summaries.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>لا يوجد سجلات رواتب تطابق الفلاتر المحددة.</p>
          </div>
        )}
      </div>

      {/* PAYSLIP MODAL */}
      <PayslipModal 
        summary={selectedPayslip} 
        open={!!selectedPayslip} 
        onClose={() => setSelectedPayslip(null)} 
        formatMoney={formatMoney}
        getStatusBadge={getStatusBadge}
        onSave={refreshConnectedSections}
      />
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  };
  
  return (
    <div className="stat-card-dark p-5 flex flex-col justify-center">
      <div className="stat-wave" />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className={`p-2.5 rounded-xl border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-white/75 text-sm font-medium mb-1 relative z-10">{title}</div>
      <div className="text-2xl font-bold font-data relative z-10 text-white">{value}</div>
    </div>
  );
}

function PayrollCard({ summary, onClick, formatMoney, getStatusBadge, onRecalculate, isRecalculating }: { 
  summary: EmployeePaySummary, 
  onClick: () => void, 
  formatMoney: (v: string|number)=>string, 
  getStatusBadge: (s:string)=>React.ReactNode,
  onRecalculate: () => void,
  isRecalculating: boolean
}) {
  const isLocked = summary.status === 'locked';
  return (
    <Card className="living-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <CardContent className="p-0">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-secondary" />
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg leading-tight">{summary.employeeName}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{summary.departmentName || 'بدون قسم'}</p>
            </div>
            {getStatusBadge(summary.status || 'draft')}
          </div>
          
          <div className="bg-muted/30 rounded-xl p-3 mb-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">الراتب الصافي</div>
            <div className="text-xl font-bold font-data text-emerald-600 dark:text-emerald-400">{formatMoney(summary.netSalary || '0')}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div className="bg-background border border-border/50 rounded-lg p-2 text-center">
              <span className="block text-xs text-muted-foreground mb-0.5">الأساسي</span>
              <span className="font-data font-semibold">{formatMoney(summary.basicSalary || '0')}</span>
            </div>
            <div className="bg-background border border-border/50 rounded-lg p-2 text-center">
              <span className="block text-xs text-muted-foreground mb-0.5">ساعات العمل</span>
              <span className="font-data font-semibold">{summary.workedHours}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {parseFloat(summary.lateMinutes || '0') > 0 && <Badge variant="outline" className="text-[10px] text-rose-500 border-rose-200">تأخير: {summary.lateMinutes}د</Badge>}
            {parseFloat(summary.earlyMinutes || '0') > 0 && <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-200">مبكر: {summary.earlyMinutes}د</Badge>}
            {parseFloat(summary.absentDays || '0') > 0 && <Badge variant="outline" className="text-[10px] text-rose-500 border-rose-200">غياب: {summary.absentDays}ي</Badge>}
            {parseFloat(summary.overtimeHours || '0') > 0 && <Badge variant="outline" className="text-[10px] text-indigo-500 border-indigo-200">إضافي: {summary.overtimeHours}س</Badge>}
            {(summary.weekendOvertimeHours ?? 0) > 0 && <Badge variant="outline" className="text-[10px] text-purple-500 border-purple-200">عطلة: {summary.weekendOvertimeHours}س</Badge>}
          </div>

          {!isLocked && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-primary gap-1.5 h-7"
              onClick={e => { e.stopPropagation(); onRecalculate(); }}
              disabled={isRecalculating}
            >
              <RefreshCw className={`w-3 h-3 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'جاري الاحتساب...' : 'إعادة احتساب'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PayslipModal({ summary, open, onClose, formatMoney, getStatusBadge, onSave }: any) {
  const { user } = useAuth();
  const { toast } = useToast();
  const settings = useAppSettings();
  const updatePayroll = useUpdatePayroll();
  const createPayroll = useCreatePayroll();
  const approvePayroll = useApprovePayroll();
  const lockPayroll = useLockPayroll();
  const { data: existingRecords } = useGetPayroll({ companyId: user?.companyId || 0, period: summary?.period });
  
  const [edits, setEdits] = useState({
    bonus: '0', allowances: '0', commissions: '0',
    advances: '0', installment: '0', fines: '0', tax: '0', insurance: '0', notes: ''
  });

  React.useEffect(() => {
    if (summary) {
      setEdits({
        bonus: summary.bonus || '0',
        allowances: summary.allowances || '0',
        commissions: summary.commissions || '0',
        advances: summary.advances || '0',
        installment: (summary.installmentAmount ?? 0).toString(),
        fines: summary.fines || '0',
        tax: summary.tax || '0',
        insurance: summary.insurance || '0',
        notes: summary.notes || ''
      });
    }
  }, [summary]);

  if (!summary) return null;

  const isLocked = summary.status === 'locked';
  const existing = existingRecords?.payroll?.find((p: any) => p.employeeId === summary.employeeId);
  const pid = existing?.id;

  const gross = parseFloat(summary.basicSalary || '0') 
    + parseFloat(summary.overtime || '0') 
    + parseFloat(edits.bonus || '0') 
    + parseFloat(edits.allowances || '0') 
    + parseFloat(edits.commissions || '0')
    + (summary.nightDifferentialPay ?? 0);
  const taxVal = gross * (parseFloat(edits.tax || '0') / 100);
  const insVal = gross * (parseFloat(edits.insurance || '0') / 100);
  const installmentVal = parseFloat(edits.installment || '0');
  const manualDed = parseFloat(edits.advances || '0') + parseFloat(edits.fines || '0') + installmentVal + taxVal + insVal;
  const totDed = parseFloat(summary.deductions || '0') + manualDed;
  const computedNet = Math.max(0, gross - totDed);

  const handleSave = async (newStatus?: string) => {
    try {
      const payload = {
        employeeId: summary.employeeId,
        period: summary.period,
        basicSalary: summary.basicSalary,
        contractType: summary.contractType,
        workedDays: summary.workedDays,
        workedHours: summary.workedHours,
        workedMinutes: summary.workedMinutes,
        workedSeconds: summary.workedSeconds,
        bonus: edits.bonus,
        allowances: edits.allowances,
        commissions: edits.commissions,
        advances: edits.advances,
        fines: edits.fines,
        tax: edits.tax,
        insurance: edits.insurance,
        notes: edits.notes,
        netSalary: computedNet.toFixed(2),
        grossSalary: gross.toFixed(2),
        totalEarnings: gross.toFixed(2),
        totalDeductions: totDed.toFixed(2),
        overtime: summary.overtime,
        deductions: summary.deductions,
        status: newStatus || summary.status || 'draft',
        metadata: { installmentAmount: installmentVal },
      };

      if (pid) {
        await updatePayroll.mutateAsync({ id: pid, data: payload as any });
      } else {
        await createPayroll.mutateAsync({ data: payload as any });
      }
      toast({ title: 'تم الحفظ', description: 'تم حفظ تفاصيل الراتب بنجاح.' });
      onSave();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    }
  };

  const handleApprove = async () => {
    if (!pid) return handleSave('approved');
    try {
      await approvePayroll.mutateAsync({ id: pid, data: { approvedBy: user?.id } });
      toast({ title: 'تم الاعتماد', description: 'تم اعتماد الراتب.' });
      onSave();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    }
  };

  const handleLock = async () => {
    if (!pid) return;
    try {
      await lockPayroll.mutateAsync({ id: pid });
      toast({ title: 'تم القفل', description: 'تم قفل الراتب نهائياً ولا يمكن تعديله.' });
      onSave();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    }
  };

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden p-0 border border-white/[0.06] custom-scrollbar payslip-dialog w-full" style={{ background: 'linear-gradient(160deg,#07091a 0%,#0a0d20 50%,#06080f 100%)' }}>
        <style>{`[data-radix-dialog-content]{max-width:min(720px,100vw)!important;overflow-x:hidden!important;} .ps-row{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:10px;font-size:14px;} .ps-row-em{background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);} .ps-row-de{background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);} .ps-row-neu{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);}`}</style>

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-20 backdrop-blur-2xl border-b border-white/[0.07] p-3 flex items-center justify-between print:hidden" style={{ background: 'rgba(7,9,26,0.88)' }}>
          <DialogTitle className="text-base font-bold font-display flex items-center gap-2 text-white">
            <FileText className="w-4 h-4 text-emerald-400" />
            كشف راتب موظف
          </DialogTitle>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" onClick={handlePrint} className="text-white/60 hover:text-white h-8 px-2 text-xs"><Printer className="w-3.5 h-3.5 ml-1" /> طباعة</Button>
            <Button variant="ghost" size="sm" onClick={handlePrint} className="text-white/60 hover:text-white h-8 px-2 text-xs"><Download className="w-3.5 h-3.5 ml-1" /> PDF</Button>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white h-8 px-2 text-xs"><Share2 className="w-3.5 h-3.5 ml-1" /> مشاركة</Button>
          </div>
        </div>

        {/* ── Hero: Net salary banner with waves ── */}
        <div className="relative overflow-hidden print-section">
          {/* wave layers */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.18) 0%,rgba(16,185,129,0.04) 60%,transparent 100%)' }} />
          <div className="stat-wave" style={{ animationDelay: '0s', background: 'linear-gradient(100deg,transparent 0%,rgba(16,185,129,0.06) 44%,rgba(16,185,129,0.14) 50%,rgba(16,185,129,0.06) 56%,transparent 100%)' }} />
          <div className="stat-wave" style={{ animationDelay: '2.5s', background: 'linear-gradient(100deg,transparent 0%,rgba(99,102,241,0.04) 44%,rgba(99,102,241,0.09) 50%,rgba(99,102,241,0.04) 56%,transparent 100%)' }} />
          <div className="absolute inset-0 border-b border-emerald-500/10 pointer-events-none" />

          <div className="relative z-10 px-5 pt-6 pb-5">
            {/* Company + period */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs text-white/40 font-medium mb-0.5">الشركة</p>
                <h2 className="text-xl font-bold font-display text-white">{settings.companyName || 'اسم الشركة'}</h2>
                <p className="text-white/50 text-xs mt-1">مسير الرواتب · {summary.period}</p>
              </div>
              <div className="mt-1">{getStatusBadge(summary.status)}</div>
            </div>

            {/* Net salary hero */}
            <div className="rounded-2xl p-4 mb-4 border border-emerald-500/20" style={{ background: 'rgba(16,185,129,0.07)' }}>
              <p className="text-emerald-400/70 text-xs font-semibold mb-1">صافي الراتب</p>
              <p className="text-4xl font-bold font-data text-emerald-400">{formatMoney(computedNet.toFixed(2))}</p>
              <div className="flex gap-4 mt-3 text-xs">
                <span className="text-white/50">الاستحقاقات: <span className="text-emerald-400 font-data font-semibold">{formatMoney(gross.toFixed(2))}</span></span>
                <span className="text-white/50">الخصومات: <span className="text-rose-400 font-data font-semibold">{formatMoney(totDed.toFixed(2))}</span></span>
              </div>
            </div>

            {/* Emp info chips */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'الاسم',          val: summary.employeeName },
                { label: 'القسم',          val: summary.departmentName || '—' },
                { label: 'نوع العقد',      val: summary.contractType === 'monthly' ? 'شهري' : summary.contractType === 'daily' ? 'يومي' : 'بالساعة' },
                { label: 'الراتب الأساسي', val: formatMoney(summary.basicSalary), data: true },
              ].map(({ label, val, data }) => (
                <div key={label} className="rounded-xl p-3 border border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-[10px] text-white/40 font-medium mb-0.5">{label}</p>
                  <p className={`font-semibold text-white text-sm ${data ? 'font-data' : ''}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-5 overflow-x-hidden print:p-0">

          {/* ── Attendance metrics ── */}
          <section>
            <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2 pt-4">
              <span className="inline-block w-1 h-4 rounded-full bg-sky-400" />
              ملخص الدوام
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <MetricBox label="أيام الحضور"     val={summary.workedDays} />
              <MetricBox label="أيام الغياب"      val={summary.absentDays}  color="text-rose-500" />
              <MetricBox label="ساعات العمل"      val={summary.workedHours} />
              <MetricBox label="إضافي عادي (س)"  val={summary.weekdayOvertimeHours ?? summary.overtimeHours} color="text-indigo-500" />
              <MetricBox label="إضافي عطلة (س)"  val={summary.weekendOvertimeHours ?? 0}  color="text-purple-500" />
              <MetricBox label="ساعات ليلية (س)" val={summary.nightHours ?? 0}             color="text-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="دقائق التأخير"         val={summary.lateMinutes}    color="text-amber-500" />
              <MetricBox label="خروج مبكر (د)"         val={summary.earlyMinutes}   color="text-amber-500" />
              <MetricBox label="إجازات مدفوعة (ي)"    val={summary.paidLeaveDays} />
              <MetricBox label="إجازات غ.مدفوعة (ي)"  val={summary.unpaidLeaveDays} color="text-rose-400" />
            </div>

            {/* Rate strip */}
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              {[
                { label: 'أجر اليوم',    val: formatMoney(summary.dailyRate) },
                { label: 'أجر الساعة',   val: formatMoney(summary.hourlyRate) },
                { label: 'أجر الدقيقة',  val: formatMoney(summary.minuteRate) },
                { label: 'ثواني العمل',  val: summary.workedSeconds },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-lg p-2 border border-white/[0.07] text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-white/50">{label}: </span>
                  <span className="font-data font-bold text-primary">{val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Earnings ── */}
          <section className="rounded-2xl border border-emerald-500/15 overflow-hidden" style={{ background: 'rgba(16,185,129,0.04)' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-emerald-400 text-sm">الاستحقاقات</h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="ps-row ps-row-em"><span className="text-white/80">الراتب الأساسي المحتسب</span><span className="font-data font-semibold text-emerald-300">{formatMoney(summary.basicSalary)}</span></div>
              <div className="ps-row ps-row-neu"><span className="text-white/70 text-xs">إضافي عادي ({summary.overtimeRate}×)</span><span className="font-data text-emerald-300 text-sm">{formatMoney(summary.overtime)}</span></div>
              {(summary.weekendOvertimeHours ?? 0) > 0 && (
                <div className="ps-row" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <span className="text-white/70 text-xs flex items-center gap-1"><Calendar className="w-3 h-3 text-purple-400" /> إضافي عطلة × {summary.weekendOvertimeHours}س</span>
                  <span className="font-data text-purple-300 text-sm">{formatMoney(summary.weekendOvertimePay ?? 0)}</span>
                </div>
              )}
              {(summary.nightDifferentialPay ?? 0) > 0 && (
                <div className="ps-row" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
                  <span className="text-white/70 text-xs flex items-center gap-1"><Moon className="w-3 h-3 text-blue-400" /> بدل ليلي × {summary.nightHours}س</span>
                  <span className="font-data text-blue-300 text-sm">{formatMoney(summary.nightDifferentialPay ?? 0)}</span>
                </div>
              )}
              {/* Editable inputs */}
              {[
                { label: 'مكافآت إضافية', key: 'bonus' as const },
                { label: 'بدلات',          key: 'allowances' as const },
                { label: 'عمولات',         key: 'commissions' as const },
              ].map(({ label, key }) => (
                <div key={key} className="rounded-xl px-3 py-2 border border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Label className="text-[10px] text-white/40 mb-1 block">{label}</Label>
                  <Input disabled={isLocked} type="number" dir="ltr" className="text-right h-7 text-sm bg-white/5 border-white/10 text-white" value={edits[key]} onChange={e=>setEdits({...edits,[key]:e.target.value})} />
                </div>
              ))}
              <div className="flex justify-between items-center font-bold pt-2 border-t border-emerald-500/20 mt-2 px-1">
                <span className="text-white">إجمالي الاستحقاقات</span>
                <span className="font-data text-emerald-400 text-lg">{formatMoney(gross.toFixed(2))}</span>
              </div>
            </div>
          </section>

          {/* ── Deductions ── */}
          <section className="rounded-2xl border border-rose-500/15 overflow-hidden" style={{ background: 'rgba(239,68,68,0.04)' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-rose-500/10">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-rose-400 text-sm">الخصومات</h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="ps-row ps-row-de text-xs"><span className="text-white/70">خصم التأخير ({summary.lateMinutes}د)</span><span className="font-data text-amber-400">{formatMoney(parseFloat(summary.lateDeduction||'0').toString())}</span></div>
              <div className="ps-row ps-row-de text-xs"><span className="text-white/70">خصم الخروج المبكر ({summary.earlyMinutes}د)</span><span className="font-data text-amber-400">{formatMoney(parseFloat(summary.earlyDeduction||'0').toString())}</span></div>
              <div className="ps-row ps-row-de text-xs"><span className="text-white/70">خصم الغياب والإجازات</span><span className="font-data text-rose-400">{formatMoney(summary.absenceDeduction)}</span></div>
              {[
                { label: 'سلف مستردة (دفعة واحدة)', key: 'advances' as const },
                { label: 'قسط السلف الشهري',        key: 'installment' as const },
                { label: 'غرامات وجزاءات',           key: 'fines' as const },
              ].map(({ label, key }) => (
                <div key={key} className="rounded-xl px-3 py-2 border border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Label className="text-[10px] text-white/40 mb-1 block">{label}</Label>
                  <Input disabled={isLocked} type="number" dir="ltr" className="text-right h-7 text-sm bg-white/5 border-white/10 text-white" value={edits[key]} onChange={e=>setEdits({...edits,[key]:e.target.value})} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'ضريبة (%)', key: 'tax' as const }, { label: 'تأمينات (%)', key: 'insurance' as const }].map(({ label, key }) => (
                  <div key={key} className="rounded-xl px-3 py-2 border border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <Label className="text-[10px] text-white/40 mb-1 block">{label}</Label>
                    <Input disabled={isLocked} type="number" dir="ltr" className="text-right h-7 text-sm bg-white/5 border-white/10 text-white" value={edits[key]} onChange={e=>setEdits({...edits,[key]:e.target.value})} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center font-bold pt-2 border-t border-rose-500/20 mt-2 px-1">
                <span className="text-white">إجمالي الخصومات</span>
                <span className="font-data text-rose-400 text-lg">{formatMoney(totDed.toFixed(2))}</span>
              </div>
            </div>
          </section>

          {/* ── Notes ── */}
          <div className="rounded-xl px-3 py-2.5 border border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Label className="text-xs text-white/40 font-medium mb-1 block">ملاحظات المسير</Label>
            <Input disabled={isLocked} value={edits.notes} onChange={e=>setEdits({...edits,notes:e.target.value})} placeholder="أضف ملاحظات إدارية..." className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
          </div>

          {/* Signatures — print only */}
          <div className="hidden print:flex justify-between mt-24 pt-8 border-t border-border">
            {['توقيع الموظف','توقيع المحاسب','اعتماد المدير'].map(t => (
              <div key={t} className="text-center w-40"><p className="font-bold mb-8">{t}</p><div className="border-b border-black" /></div>
            ))}
          </div>

          <div className="h-2" />
        </div>

        {/* ── Actions ── */}
        <div className="sticky bottom-0 p-3 backdrop-blur-xl border-t border-white/[0.07] flex flex-wrap justify-end gap-2 print:hidden" style={{ background: 'rgba(7,9,26,0.92)' }}>
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white border border-white/10">إغلاق</Button>
          {!isLocked && (
            <>
              <Button variant="secondary" onClick={() => handleSave()} disabled={updatePayroll.isPending || createPayroll.isPending} className="gap-1.5 text-sm">
                <Save className="w-3.5 h-3.5" /> حفظ التعديلات
              </Button>
              {summary.status !== 'approved' && pid && (
                <Button onClick={handleApprove} disabled={approvePayroll.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" /> اعتماد الراتب
                </Button>
              )}
              {summary.status === 'approved' && pid && (
                <Button onClick={handleLock} disabled={lockPayroll.isPending} className="bg-slate-700 hover:bg-slate-800 text-white gap-1.5 text-sm">
                  <Lock className="w-3.5 h-3.5" /> قفل نهائي
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricBox({ label, val, color="text-emerald-400" }: any) {
  const themeMap: Record<string, { bg: string; border: string; glow: string }> = {
    'text-rose-500':   { bg: 'bg-rose-950/60',   border: 'border-rose-500/40',   glow: 'shadow-rose-900/40' },
    'text-indigo-500': { bg: 'bg-indigo-950/60', border: 'border-indigo-500/40', glow: 'shadow-indigo-900/40' },
    'text-purple-500': { bg: 'bg-purple-950/60', border: 'border-purple-500/40', glow: 'shadow-purple-900/40' },
    'text-blue-400':   { bg: 'bg-blue-950/60',   border: 'border-blue-500/40',   glow: 'shadow-blue-900/40' },
    'text-amber-500':  { bg: 'bg-amber-950/60',  border: 'border-amber-500/40',  glow: 'shadow-amber-900/40' },
    'text-rose-400':   { bg: 'bg-rose-950/60',   border: 'border-rose-400/40',   glow: 'shadow-rose-900/40' },
    'text-emerald-400':{ bg: 'bg-emerald-950/60',border: 'border-emerald-500/40',glow: 'shadow-emerald-900/40' },
  };
  const t = themeMap[color] ?? { bg: 'bg-white/5', border: 'border-white/10', glow: 'shadow-black/20' };
  return (
    <div className={`relative overflow-hidden p-3 rounded-xl border text-center shadow-lg ${t.bg} ${t.border} ${t.glow} transition-all`}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
      <div className="text-[10px] font-semibold text-white/70 mb-1 leading-tight relative z-10">{label}</div>
      <div className={`text-xl font-bold font-data relative z-10 ${color}`}>{val}</div>
    </div>
  );
}
