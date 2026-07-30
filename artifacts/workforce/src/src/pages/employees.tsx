import { useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useLocation } from 'wouter';
import {
  useGetEmployees, useGetDepartments, useCreateEmployee, useUpdateEmployee, useDeleteEmployee,
  useGetAttendance,
  getGetEmployeesQueryKey, getGetDepartmentsQueryKey, getGetAttendanceQueryKey,
  EmployeeInput, Employee
} from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BottomSheet } from '@/components/bottom-sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Copy, Share2, Clock3,
  Mail, Phone, MapPin, Calendar, Clock, Building2,
  User, Briefcase, DollarSign, FileText, Users, Shield,
  ClipboardList, UserCheck, CalendarDays, CheckCircle2, XCircle, KeyRound, RefreshCw, Camera, AlertTriangle
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

interface PendingUser {
  userId: number;
  employeeId: number | null;
  fullName: string;
  email: string;
  position: string | null;
  createdAt: string | null;
}

const deptGradients = [
  { from: 'from-violet-500', to: 'to-purple-600', light: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  { from: 'from-emerald-500', to: 'to-teal-600', light: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  { from: 'from-amber-500', to: 'to-orange-600', light: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  { from: 'from-blue-500', to: 'to-indigo-600', light: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  { from: 'from-rose-500', to: 'to-red-600', light: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  { from: 'from-cyan-500', to: 'to-sky-600', light: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
];

const WORK_DAYS_OPTIONS = [
  { en: 'Sun', ar: 'أحد', sv: 'Sön' },
  { en: 'Mon', ar: 'إثنين', sv: 'Mån' },
  { en: 'Tue', ar: 'ثلاثاء', sv: 'Tis' },
  { en: 'Wed', ar: 'أربعاء', sv: 'Ons' },
  { en: 'Thu', ar: 'خميس', sv: 'Tor' },
  { en: 'Fri', ar: 'جمعة', sv: 'Fre' },
  { en: 'Sat', ar: 'سبت', sv: 'Lör' },
];

const generateEmployeeCode = () => `EMP-${Date.now().toString(36).toUpperCase()}`;

function WorkDaysPicker({ value, onChange, locale }: { value: string; onChange: (v: string) => void; locale: string }) {
  const selected = value ? value.split(',').map(s => s.trim()) : [];
  const toggle = (day: string) => {
    const idx = selected.indexOf(day);
    const next = idx >= 0 ? selected.filter(d => d !== day) : [...selected, day];
    onChange(next.join(', '));
  };
  return (
    <div className="flex flex-wrap gap-2">
      {WORK_DAYS_OPTIONS.map(d => {
        const label = locale === 'ar' ? d.ar : locale === 'sv' ? d.sv : d.en;
        const isSelected = selected.includes(d.en) || selected.includes(d.ar);
        return (
          <button
            key={d.en}
            type="button"
            onClick={() => toggle(d.en)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isSelected
              ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:scale-105'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function AvatarCircle({ name, color, size = 'md', avatarUrl, onUpload }: {
  name: string;
  color: typeof deptGradients[0];
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  avatarUrl?: string | null;
  onUpload?: (file: File) => void;
}) {
  const sizes = {
    sm:  'w-10 h-10 text-sm',
    md:  'w-14 h-14 text-lg',
    lg:  'w-20 h-20 text-2xl',
    xl:  'w-28 h-28 text-4xl',
    '2xl': 'w-36 h-36 text-5xl',
  };
  const radii = {
    sm: 'rounded-2xl', md: 'rounded-2xl', lg: 'rounded-2xl', xl: 'rounded-3xl', '2xl': 'rounded-3xl',
  };
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'EMP';
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
    e.target.value = '';
  };

  return (
    <div className="relative inline-block flex-shrink-0">
      <div className={`${sizes[size]} ${radii[size]} bg-gradient-to-br ${color.from} ${color.to} flex items-center justify-center font-bold font-display text-white shadow-lg select-none overflow-hidden`}>
        {avatarUrl
          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          : initials}
      </div>
      {onUpload && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 border-2 border-white/20"
            title="تغيير الصورة"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
}

function StatBadge({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${color} border`}>
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-medium opacity-60 leading-none">{label}</div>
        <div className="text-xs font-bold truncate mt-0.5">{value || '—'}</div>
      </div>
    </div>
  );
}

export default function Employees() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/employees/pending', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data.pending || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPendingUsers(); }, [fetchPendingUsers]);

  const handleApproveUser = async (userId: number) => {
    setPendingActionId(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/employees/pending/${userId}/approve`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast({ title: locale === 'ar' ? 'تم تفعيل الحساب وقبول الموظف' : 'Employee approved and activated' });
        setPendingUsers(prev => prev.filter(u => u.userId !== userId));
        invalidate();
      } else {
        toast({ variant: 'destructive', title: locale === 'ar' ? 'فشلت العملية' : 'Operation failed' });
      }
    } catch {
      toast({ variant: 'destructive', title: locale === 'ar' ? 'خطأ في الاتصال' : 'Connection error' });
    } finally {
      setPendingActionId(null);
    }
  };

  const handleRejectUser = async (userId: number) => {
    setPendingActionId(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/employees/pending/${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast({ title: locale === 'ar' ? 'تم رفض طلب الانضمام وحذف الحساب' : 'Registration request rejected' });
        setPendingUsers(prev => prev.filter(u => u.userId !== userId));
      } else {
        toast({ variant: 'destructive', title: locale === 'ar' ? 'فشلت العملية' : 'Operation failed' });
      }
    } catch {
      toast({ variant: 'destructive', title: locale === 'ar' ? 'خطأ في الاتصال' : 'Connection error' });
    } finally {
      setPendingActionId(null);
    }
  };

  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [workDaysAdd, setWorkDaysAdd] = useState('Sun, Mon, Tue, Wed, Thu');
  const [workDaysEdit, setWorkDaysEdit] = useState('Sun, Mon, Tue, Wed, Thu');
  const [longPressEmployee, setLongPressEmployee] = useState<Employee | null>(null);
  const [lateMode, setLateMode] = useState(false);
  const longPressTimers = useRef(new Map<number, number>());
  const longPressFired = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  const cid = user?.companyId || 0;

  // Today's date for late detection
  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch ALL employees (no status filter) for stats cards counts
  const { data: allEmployeesData } = useGetEmployees(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetEmployeesQueryKey({ companyId: cid }) } }
  );

  const { data: employeesData, isLoading } = useGetEmployees(
    { companyId: cid, ...(search && { search }), ...(departmentId !== 'all' && { departmentId: parseInt(departmentId) }), ...(!lateMode && status !== 'all' && { status }) },
    { query: { enabled: !!cid, queryKey: getGetEmployeesQueryKey({ companyId: cid, search, departmentId: departmentId !== 'all' ? parseInt(departmentId) : undefined, status: !lateMode && status !== 'all' ? status : undefined }) } }
  );

  // Fetch today's attendance to detect late employees
  const { data: todayAttendanceData } = useGetAttendance(
    { companyId: cid, startDate: todayStr, endDate: todayStr },
    { query: { enabled: !!cid, queryKey: getGetAttendanceQueryKey({ companyId: cid, startDate: todayStr, endDate: todayStr }) } }
  );

  const lateEmployeeIds = new Set(
    (todayAttendanceData?.attendance || [])
      .filter((a: any) => a.isLate)
      .map((a: any) => a.employeeId)
  );

  const { data: deptsData } = useGetDepartments(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetDepartmentsQueryKey({ companyId: cid }) } }
  );

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });

  const handleAvatarUpload = async (emp: Employee, file: File) => {
    setAvatarUploading(true);
    try {
      // Compress image via canvas before uploading (max 400×400, JPEG 80%)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const MAX = 400;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
        img.src = objectUrl;
      });
      await updateMutation.mutateAsync({ id: emp.id!, data: { avatar: dataUrl } as any });
      await invalidate();
      setProfileEmployee(prev => prev?.id === emp.id ? { ...prev, avatar: dataUrl } : prev);
      toast({ title: 'تم تحديث الصورة الشخصية' });
    } catch {
      toast({ variant: 'destructive', title: 'فشل رفع الصورة' });
    } finally {
      setAvatarUploading(false);
    }
  };


  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: EmployeeInput = {
      fullName: fd.get('fullName') as string,
      email: fd.get('email') as string,
      employeeCode: String(fd.get('employeeCode') || '').trim() || generateEmployeeCode(),
      departmentId: Number(fd.get('departmentId')) || undefined,
      position: fd.get('position') as string || undefined,
      phone: fd.get('phone') as string || undefined,
      gender: fd.get('gender') as string || undefined,
      address: fd.get('address') as string || undefined,
      managerName: fd.get('managerName') as string || undefined,
      joinDate: fd.get('joinDate') as string || undefined,
      contractType: fd.get('contractType') as string || undefined,
      salary: fd.get('salary') as string || undefined,
      workStart: fd.get('workStart') as string || '09:00',
      workEnd: fd.get('workEnd') as string || '17:00',
      breakMin: fd.get('breakMin') ? Number(fd.get('breakMin')) : undefined,
      workDays: workDaysAdd || undefined,
      notes: fd.get('notes') as string || undefined,
      status: 'active',
    };
    try {
      await createMutation.mutateAsync({ data: payload });
      toast({ title: t('savedSuccessfully') });
      setIsAddOpen(false);
      setWorkDaysAdd('Sun, Mon, Tue, Wed, Thu');
      invalidate();
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: t('failedCreateEmployee') });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editEmployee?.id) return;
    const fd = new FormData(e.currentTarget);
    const payload: EmployeeInput = {
      fullName: fd.get('fullName') as string,
      email: fd.get('email') as string,
      employeeCode: (fd.get('employeeCode') as string) || editEmployee.employeeCode || '',
      departmentId: Number(fd.get('departmentId')) || undefined,
      position: fd.get('position') as string || undefined,
      phone: fd.get('phone') as string || undefined,
      gender: fd.get('gender') as string || undefined,
      address: fd.get('address') as string || undefined,
      managerName: fd.get('managerName') as string || undefined,
      joinDate: fd.get('joinDate') as string || undefined,
      contractType: fd.get('contractType') as string || undefined,
      salary: fd.get('salary') as string || undefined,
      workStart: fd.get('workStart') as string || '09:00',
      workEnd: fd.get('workEnd') as string || '17:00',
      breakMin: fd.get('breakMin') ? Number(fd.get('breakMin')) : undefined,
      workDays: workDaysEdit || undefined,
      notes: fd.get('notes') as string || undefined,
      status: fd.get('status') as EmployeeInput['status'] || 'active',
    };
    try {
      await updateMutation.mutateAsync({ id: editEmployee.id, data: payload });
      toast({ title: t('savedSuccessfully') });
      setEditEmployee(null);
      invalidate();
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: t('failedUpdateEmployee') });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: t('employeeDeleted') });
      setDeleteId(null);
      invalidate();
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: t('failedDeleteEmployee') });
    }
  };

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setWorkDaysEdit(emp.workDays || 'Sun, Mon, Tue, Wed, Thu');
  };

  const copyEmployee = async (emp: Employee) => {
    const text = `${emp.fullName} — ${emp.position || 'Employee'}${emp.email ? ` — ${emp.email}` : ''}${emp.phone ? ` — ${emp.phone}` : ''}`;
    try {
      await navigator.clipboard?.writeText(text);
      toast({ title: locale === 'ar' ? 'تم نسخ بيانات الموظف' : 'Employee details copied' });
    } catch {
      toast({ variant: 'destructive', title: locale === 'ar' ? 'تعذر النسخ' : 'Could not copy details' });
    }
  };

  const shareEmployee = async (emp: Employee) => {
    const text = `${emp.fullName} — ${emp.position || 'Employee'}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: emp.fullName || 'Employee', text });
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          toast({ variant: 'destructive', title: locale === 'ar' ? 'تعذرت المشاركة' : 'Could not share' });
        }
      }
      return;
    }
    await copyEmployee(emp);
  };

  const startLongPress = (emp: Employee) => {
    if (!emp.id) return;
    longPressFired.current = false;
    const timer = window.setTimeout(() => {
      longPressFired.current = true;
      setLongPressEmployee(emp);
      navigator.vibrate?.(12);
    }, 520);
    longPressTimers.current.set(emp.id, timer);
  };

  const cancelLongPress = (emp: Employee) => {
    if (!emp.id) return;
    const timer = longPressTimers.current.get(emp.id);
    if (timer !== undefined) window.clearTimeout(timer);
    longPressTimers.current.delete(emp.id);
  };

  const employees = (employeesData?.employees || []).filter(e =>
    !lateMode || lateEmployeeIds.has(e.id as number)
  );
  const allEmployees = allEmployeesData?.employees || [];
  const total = allEmployeesData?.total || employeesData?.total || 0;
  const activeCount = allEmployees.filter(e => e.status === 'active').length;
  const onLeaveCount = allEmployees.filter(e => e.status === 'on-leave').length;
  const inactiveCount = allEmployees.filter(e => e.status === 'inactive').length;
  const lateCount = lateEmployeeIds.size;

  // Employee Form Fields
  const employeeFormFields = (defaultValues?: Employee, isEdit = false) => (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-3 rounded-xl mb-4 h-10">
        <TabsTrigger value="personal" className="rounded-lg text-xs font-bold">{locale === 'ar' ? 'البيانات الشخصية' : locale === 'sv' ? 'Personuppgifter' : 'Personal'}</TabsTrigger>
        <TabsTrigger value="work" className="rounded-lg text-xs font-bold">{locale === 'ar' ? 'بيانات العمل' : locale === 'sv' ? 'Arbetsdata' : 'Work Data'}</TabsTrigger>
        <TabsTrigger value="schedule" className="rounded-lg text-xs font-bold">{locale === 'ar' ? 'الجدول' : locale === 'sv' ? 'Schema' : 'Schedule'}</TabsTrigger>
      </TabsList>

      {/* Personal Data Tab */}
      <TabsContent value="personal" forceMount className="mt-0 data-[state=inactive]:hidden">
        <div
          className="living-card p-4"
          style={{ '--card-accent': '#8b5cf6' } as React.CSSProperties}
        >
          <span className="living-card-orb" style={{ top: '-1.5rem', right: '-1rem' }} />
          <span className="living-card-orb living-card-orb--small" style={{ bottom: '0.5rem', left: '1rem' }} />
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('fullName')}</Label>
            <Input name="fullName" defaultValue={defaultValues?.fullName} required className="rounded-xl h-10" />
          </div>
          <div className="space-y-1.5">
             <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
               {t('employeeCode')} <span className="normal-case font-normal opacity-60">({locale === 'ar' ? 'اختياري' : locale === 'sv' ? 'valfritt' : 'optional'})</span>
             </Label>
             <Input
               name="employeeCode"
               defaultValue={defaultValues?.employeeCode || ''}
               placeholder={locale === 'ar' ? 'يُنشأ تلقائياً إذا تُرك فارغاً' : 'Generated automatically if left blank'}
               className="rounded-xl h-10"
             />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{locale === 'ar' ? 'الجنس' : locale === 'sv' ? 'Kön' : 'Gender'}</Label>
            <Select name="gender" defaultValue={defaultValues?.gender || ''}>
              <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder={locale === 'ar' ? 'اختر الجنس' : locale === 'sv' ? 'Välj kön' : 'Select gender'} /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="male">{locale === 'ar' ? 'ذكر' : locale === 'sv' ? 'Man' : 'Male'}</SelectItem>
                <SelectItem value="female">{locale === 'ar' ? 'أنثى' : locale === 'sv' ? 'Kvinna' : 'Female'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('email')}</Label>
            <Input type="email" name="email" defaultValue={defaultValues?.email} required className="rounded-xl h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('phone')}</Label>
            <Input name="phone" defaultValue={defaultValues?.phone || ''} className="rounded-xl h-10" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('address')}</Label>
            <Input name="address" defaultValue={defaultValues?.address || ''} className="rounded-xl h-10" />
          </div>
          </div>{/* end grid */}
        </div>{/* end living-card */}
      </TabsContent>

      {/* Work Data Tab */}
      <TabsContent value="work" forceMount className="mt-0 data-[state=inactive]:hidden">
        <div
          className="living-card p-4"
          style={{ '--card-accent': '#6366f1' } as React.CSSProperties}
        >
          <span className="living-card-orb" style={{ top: '-1.5rem', left: '-1rem' }} />
          <span className="living-card-orb living-card-orb--small" style={{ bottom: '0.5rem', right: '1rem' }} />
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('department')}</Label>
            <Select name="departmentId" defaultValue={defaultValues?.departmentId ? String(defaultValues.departmentId) : undefined}>
              <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder={t('selectDept')} /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {deptsData?.departments?.map(d => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('position')}</Label>
            <Input name="position" defaultValue={defaultValues?.position || ''} className="rounded-xl h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{locale === 'ar' ? 'المدير المباشر' : locale === 'sv' ? 'Chef' : 'Manager'}</Label>
            <Input name="managerName" defaultValue={defaultValues?.managerName || ''} className="rounded-xl h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('joinDate')}</Label>
            <Input type="date" name="joinDate" defaultValue={defaultValues?.joinDate || ''} className="rounded-xl h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{locale === 'ar' ? 'نوع العقد' : locale === 'sv' ? 'Kontraktstyp' : 'Contract Type'}</Label>
            <Select name="contractType" defaultValue={defaultValues?.contractType || ''}>
              <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder={locale === 'ar' ? 'نوع العقد' : locale === 'sv' ? 'Välj typ' : 'Select type'} /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="monthly">{locale === 'ar' ? 'شهري' : locale === 'sv' ? 'Månadsvis' : 'Monthly'}</SelectItem>
                <SelectItem value="daily">{locale === 'ar' ? 'يومي' : locale === 'sv' ? 'Daglig' : 'Daily'}</SelectItem>
                <SelectItem value="hourly">{locale === 'ar' ? 'ساعي' : locale === 'sv' ? 'Timvis' : 'Hourly'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('salary')}</Label>
            <Input type="number" name="salary" defaultValue={defaultValues?.salary || ''} className="rounded-xl h-10 font-data" />
          </div>
          {isEdit && (
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('status')}</Label>
              <Select name="status" defaultValue={defaultValues?.status || 'active'}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder={t('selectStatus')} /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="on-leave">{t('onLeaveStatus')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          </div>{/* end grid */}
        </div>{/* end living-card */}
      </TabsContent>

      {/* Schedule Tab */}
      <TabsContent value="schedule" forceMount className="mt-0 data-[state=inactive]:hidden">
        <div
          className="living-card p-4"
          style={{ '--card-accent': '#10b981' } as React.CSSProperties}
        >
          <span className="living-card-orb" style={{ top: '-1rem', right: '-0.5rem' }} />
          <span className="living-card-orb living-card-orb--small" style={{ bottom: '1rem', left: '0.5rem' }} />
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{locale === 'ar' ? 'بداية الدوام' : locale === 'sv' ? 'Arbetstid start' : 'Work Start'}</Label>
            <Input type="time" name="workStart" defaultValue={defaultValues?.workStart || '09:00'} className="rounded-xl h-10 font-data" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{locale === 'ar' ? 'نهاية الدوام' : locale === 'sv' ? 'Arbetstid slut' : 'Work End'}</Label>
            <Input type="time" name="workEnd" defaultValue={defaultValues?.workEnd || '17:00'} className="rounded-xl h-10 font-data" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {locale === 'ar' ? 'وقت الاستراحة (دقيقة — غير مدفوع)' : locale === 'sv' ? 'Rast (minuter — obetald)' : 'Break (minutes — unpaid)'}
            </Label>
            <div className="relative">
              <Input
                type="number"
                name="breakMin"
                min={0}
                max={240}
                step={5}
                defaultValue={(defaultValues as any)?.breakMin ?? 60}
                className="rounded-xl h-10 font-data pl-16"
                dir="ltr"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                {locale === 'ar' ? 'دقيقة' : locale === 'sv' ? 'min' : 'min'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {locale === 'ar'
                ? 'تُخصم من إجمالي ساعات العمل اليومية عند احتساب الراتب'
                : locale === 'sv'
                ? 'Dras av från dagliga arbetstimmar vid löneberäkning'
                : 'Deducted from daily worked hours in payroll calculation'}
            </p>
          </div>
          <div className="space-y-2 col-span-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{locale === 'ar' ? 'أيام العمل' : locale === 'sv' ? 'Arbetsdagar' : 'Work Days'}</Label>
            <WorkDaysPicker
              value={isEdit ? workDaysEdit : workDaysAdd}
              onChange={isEdit ? setWorkDaysEdit : setWorkDaysAdd}
              locale={locale}
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{locale === 'ar' ? 'ملاحظات' : locale === 'sv' ? 'Anteckningar' : 'Notes'}</Label>
            <Textarea name="notes" defaultValue={defaultValues?.notes || ''} className="rounded-xl resize-none" rows={3} />
          </div>
          </div>{/* end grid */}
        </div>{/* end living-card */}
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('employees')}</h1>
          <p className="text-sm mt-1 text-muted-foreground">{total} {locale === 'ar' ? 'موظف إجمالاً' : locale === 'sv' ? 'anställda totalt' : 'employees total'}</p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white border-0"
        >
          <Plus className="h-4 w-4" /> {t('addEmployee')}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { key: 'all',       label: locale === 'ar' ? 'الكل' : locale === 'sv' ? 'Totalt' : 'Total',           value: total,        color: 'from-violet-500 to-purple-600',  icon: Users,       delay: 0   },
          { key: 'active',    label: t('active'),                                                                  value: activeCount,   color: 'from-emerald-500 to-teal-600',  icon: UserCheck,   delay: 1.5 },
          { key: 'on-leave',  label: t('onLeaveStatus'),                                                          value: onLeaveCount,  color: 'from-amber-500 to-orange-600',  icon: CalendarDays, delay: 3  },
          { key: 'inactive',  label: t('inactive'),                                                                value: inactiveCount, color: 'from-slate-500 to-gray-600',    icon: Shield,      delay: 4.5 },
          { key: 'late',      label: locale === 'ar' ? 'المتأخرون' : locale === 'sv' ? 'Sena' : 'Late Today',   value: lateCount,     color: 'from-rose-500 to-red-600',      icon: Clock,       delay: 6   },
        ].map(stat => {
          const isActive = stat.key === 'late'
            ? lateMode
            : !lateMode && (status === stat.key || (stat.key === 'all' && status === 'all'));
          return (
            <button
              key={stat.key}
              type="button"
              onClick={() => {
                if (stat.key === 'late') {
                  setLateMode(true);
                  setStatus('all');
                } else {
                  setLateMode(false);
                  setStatus(stat.key === 'all' ? 'all' : stat.key);
                }
              }}
              className={`stat-card-dark p-4 flex items-center gap-3 text-left w-full transition-all ${
                isActive ? 'ring-2 ring-white/30 scale-[1.03]' : 'hover:scale-[1.02]'
              }`}
            >
              <span className="stat-wave" aria-hidden="true" style={{ animationDelay: `${-stat.delay}s` } as React.CSSProperties} />
              <span className={`absolute -right-3 -top-3 h-14 w-14 rounded-full blur-2xl opacity-25 bg-gradient-to-br ${stat.color}`} aria-hidden="true" />
              <div className={`relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-bold font-display text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pending Employee Registrations */}
      {pendingUsers.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 overflow-hidden bg-card">
          <div className="flex items-center justify-between p-4 border-b border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock3 className="w-4 h-4 text-amber-400" />
              </div>
              <span className="font-bold text-sm">{locale === 'ar' ? 'طلبات انضمام تنتظر موافقتك' : 'Pending Registration Requests'}</span>
              <span className="min-w-[22px] h-5 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-black border border-amber-500/30 px-1.5 animate-pulse">
                {pendingUsers.length}
              </span>
            </div>
            <Button size="sm" variant="ghost" onClick={fetchPendingUsers} className="h-8 text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> {locale === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
          <div className="p-4 space-y-3">
            {pendingUsers.map(row => {
              const initials = row.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'EMP';
              const since = row.createdAt
                ? new Date(row.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—';
              return (
                <div key={row.userId} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{row.fullName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-black">
                          {locale === 'ar' ? 'قيد المعالجة' : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{row.email}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {row.position || (locale === 'ar' ? 'موظف' : 'Employee')} · {locale === 'ar' ? 'طلب الانضمام:' : 'Joined:'} {since}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-amber-500/15 flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingActionId === row.userId}
                      onClick={() => handleRejectUser(row.userId)}
                      className="h-8 text-xs border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      {locale === 'ar' ? 'رفض' : 'Reject'}
                    </Button>
                    <Button
                      size="sm"
                      disabled={pendingActionId === row.userId}
                      onClick={() => handleApproveUser(row.userId)}
                      className="h-8 text-xs bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      {locale === 'ar' ? 'قبول وتفعيل' : 'Approve'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card-3d p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`${t('search')} ${t('employees').toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border bg-background h-11"
            />
          </div>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger className="w-full sm:w-[190px] rounded-xl border-border bg-background h-11">
              <SelectValue placeholder={t('allDepartments')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t('allDepartments')}</SelectItem>
              {deptsData?.departments?.map(d => (
                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lateMode ? 'late' : status} onValueChange={v => { if (v === 'late') { setLateMode(true); setStatus('all'); } else { setLateMode(false); setStatus(v); } }}>
            <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-border bg-background h-11">
              <SelectValue placeholder={t('allStatus')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="on-leave">{t('onLeaveStatus')}</SelectItem>
              <SelectItem value="inactive">{t('inactive')}</SelectItem>
              <SelectItem value="late">{locale === 'ar' ? 'المتأخرون اليوم' : locale === 'sv' ? 'Sena idag' : 'Late Today'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-3d h-[340px] animate-pulse bg-muted-bg rounded-3xl" />
          ))
        ) : !employees.length ? (
          <div className="col-span-full card-3d p-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-muted-foreground opacity-40" />
            </div>
            <p className="font-bold text-lg text-muted-foreground">{t('noEmployeesFound')}</p>
          </div>
          ) : employees.map((emp, index) => {
          const color = deptGradients[(emp.departmentId || index) % deptGradients.length];
          const statusVariant = emp.status === 'active' ? 'success' : emp.status === 'on-leave' ? 'warning' : 'secondary';
          const statusLabel = emp.status === 'active' ? t('active') : emp.status === 'on-leave' ? t('onLeaveStatus') : t('inactive');
          return (
            <div
              key={emp.id}
              data-testid={`card-employee-${emp.id}`}
              onPointerDown={() => startLongPress(emp)}
              onPointerUp={() => cancelLongPress(emp)}
              onPointerLeave={() => cancelLongPress(emp)}
              onContextMenu={(event) => {
                event.preventDefault();
                cancelLongPress(emp);
                setLongPressEmployee(emp);
              }}
              onClick={() => {
                if (longPressFired.current) {
                  longPressFired.current = false;
                  return;
                }
                setProfileEmployee(emp);
              }}
              className={`card-3d flex flex-col overflow-hidden animate-fadeIn stagger-${(index % 6) + 1} group`}
            >
              {/* Gradient Banner */}
              <div className={`h-20 w-full bg-gradient-to-br ${color.from} ${color.to} relative overflow-hidden flex-shrink-0`}>
                <div className="nav-card-wave" />
                <div className="card-orb w-20 h-20 absolute -right-4 -top-4" />
                <div className="card-orb card-orb-sm w-14 h-14 absolute -left-2 -bottom-2" />
                {/* Status Badge */}
                <Badge
                  variant={statusVariant}
                  className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg"
                >
                  {statusLabel}
                </Badge>
                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      data-testid={`button-employee-actions-${emp.id}`}
                      variant="ghost"
                      size="icon"
                      className="absolute top-2.5 left-3 h-7 w-7 rounded-full bg-white/20 hover:bg-white/40 text-white border-0"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl border-border w-44">
                    <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" onClick={() => setProfileEmployee(emp)}>
                      <Eye className="h-4 w-4 text-violet-500" /> {t('viewProfile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" onClick={() => openEdit(emp)}>
                      <Edit className="h-4 w-4 text-amber-500" /> {t('edit')}
                    </DropdownMenuItem>
                    <Separator className="my-1" />
                    <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer text-red-500" onClick={() => setDeleteId(emp.id || null)}>
                      <Trash2 className="h-4 w-4" /> {t('delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col -mt-7">
                {/* Avatar */}
                <div className="mb-3">
                  <AvatarCircle name={emp.fullName || ''} color={color} size="md" avatarUrl={emp.avatar} />
                </div>

                {/* Name & Position */}
                <button
                  data-testid={`button-view-employee-${emp.id}`}
                  onClick={() => setProfileEmployee(emp)}
                  className="text-left w-full hover:opacity-80 transition-opacity mb-3"
                >
                  <h3 className="font-bold text-base leading-tight truncate">{emp.fullName}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {emp.position || (locale === 'ar' ? 'موظف' : locale === 'sv' ? 'Anställd' : 'Employee')}
                  </p>
                </button>

                {/* Info Pills */}
                <div className="space-y-1.5 flex-1">
                  {emp.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                      <span className="truncate font-data">{emp.phone}</span>
                    </div>
                  )}
                  {emp.departmentName && (
                    <div className="flex items-center gap-2 text-xs">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground opacity-60" />
                      <span className={`font-semibold truncate ${color.text}`}>{emp.departmentName}</span>
                    </div>
                  )}
                  {(emp.workStart || emp.workEnd) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                      <span className="font-data font-semibold">{emp.workStart || '09:00'} — {emp.workEnd || '17:00'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className={`px-4 py-2.5 border-t border-border ${color.light} flex justify-between items-center`}>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t('salary')}</span>
                <span className="text-sm font-bold font-data">
                  {emp.salary ? `$${Number(emp.salary).toLocaleString()}` : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <BottomSheet
        open={!!longPressEmployee}
        onClose={() => setLongPressEmployee(null)}
        title={longPressEmployee ? `${longPressEmployee.fullName}` : undefined}
      >
        {longPressEmployee && (
          <div className="grid grid-cols-2 gap-2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <button
              type="button"
              onClick={() => { setLongPressEmployee(null); setProfileEmployee(longPressEmployee); }}
              className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm font-bold transition hover:bg-accent"
            >
              <Eye className="h-4 w-4 text-violet-500" /> {t('viewProfile')}
            </button>
            <button
              type="button"
              onClick={() => { setLongPressEmployee(null); setLocation('/dashboard/attendance'); }}
              className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm font-bold transition hover:bg-accent"
            >
              <Clock3 className="h-4 w-4 text-emerald-500" /> {locale === 'ar' ? 'سجل حضور' : 'Attendance'}
            </button>
            <button
              type="button"
              onClick={() => { const employee = longPressEmployee; setLongPressEmployee(null); void copyEmployee(employee); }}
              className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm font-bold transition hover:bg-accent"
            >
              <Copy className="h-4 w-4 text-blue-500" /> {locale === 'ar' ? 'نسخ' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => { const employee = longPressEmployee; setLongPressEmployee(null); void shareEmployee(employee); }}
              className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm font-bold transition hover:bg-accent"
            >
              <Share2 className="h-4 w-4 text-indigo-500" /> {locale === 'ar' ? 'مشاركة' : 'Share'}
            </button>
            <button
              type="button"
              onClick={() => { const employee = longPressEmployee; setLongPressEmployee(null); openEdit(employee); }}
              className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm font-bold transition hover:bg-accent"
            >
              <Edit className="h-4 w-4 text-amber-500" /> {t('edit')}
            </button>
            <button
              type="button"
              onClick={() => { setDeleteId(longPressEmployee.id || null); setLongPressEmployee(null); }}
              className="flex items-center gap-3 rounded-2xl border border-red-500/20 p-4 text-sm font-bold text-red-500 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" /> {t('delete')}
            </button>
          </div>
        )}
      </BottomSheet>

      {/* ===================== ADD DRAWER ===================== */}
      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DrawerContent className="max-h-[92dvh] flex flex-col">
          <DrawerHeader className="border-b border-border/50 pb-3 flex-shrink-0">
            <DrawerTitle className="font-display text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              {t('addEmployee')}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <form id="add-emp-form" onSubmit={handleAddSubmit} className="space-y-5">
              {employeeFormFields(undefined, false)}
            </form>
          </div>
          <div className="flex-shrink-0 px-4 py-3 border-t border-border/50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
            <Button
              type="submit"
              form="add-emp-form"
              className="w-full rounded-xl h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white border-0 font-bold"
              disabled={createMutation.isPending}
            >
              {t('save')}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ===================== EDIT DRAWER ===================== */}
      <Drawer open={!!editEmployee} onOpenChange={(open) => { if (!open) setEditEmployee(null); }}>
        <DrawerContent className="max-h-[92dvh] flex flex-col">
          <DrawerHeader className="border-b border-border/50 pb-3 flex-shrink-0">
            <DrawerTitle className="font-display text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Edit className="h-4 w-4 text-white" />
              </div>
              {t('editEmployee')}
            </DrawerTitle>
          </DrawerHeader>
          {editEmployee && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <form id="edit-emp-form" onSubmit={handleEditSubmit} className="space-y-5">
                  {employeeFormFields(editEmployee, true)}
                </form>
              </div>
              <div className="flex-shrink-0 px-4 py-3 border-t border-border/50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
                <Button
                  type="submit"
                  form="edit-emp-form"
                  className="w-full rounded-xl h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-0 font-bold"
                  disabled={updateMutation.isPending}
                >
                  {t('save')}
                </Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* ===================== EMPLOYEE PROFILE SHEET ===================== */}
      <Sheet open={!!profileEmployee} onOpenChange={(open) => !open && setProfileEmployee(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          {profileEmployee && (() => {
            const color = deptGradients[(profileEmployee.departmentId || 0) % deptGradients.length];
            const statusVariant = profileEmployee.status === 'active' ? 'success' : profileEmployee.status === 'on-leave' ? 'warning' : 'secondary';
            const statusLabel = profileEmployee.status === 'active' ? t('active') : profileEmployee.status === 'on-leave' ? t('onLeaveStatus') : t('inactive');

            return (
              <>
                {/* Profile Header Banner */}
                <div className={`h-44 w-full bg-gradient-to-br ${color.from} ${color.to} relative overflow-hidden flex-shrink-0`}>
                  <div className="absolute inset-0">
                    <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10" />
                    <div className="absolute -left-6 bottom-0 w-36 h-36 rounded-full bg-white/5" />
                    <div className="absolute right-1/3 top-1/4 w-20 h-20 rounded-full bg-white/5" />
                  </div>
                </div>

                <div className="px-6 pb-6">
                  {/* Avatar + Name */}
                  <div className="flex items-end gap-5 -mt-16 mb-5">
                    <div className={`ring-4 ring-background rounded-3xl shadow-2xl ${avatarUploading ? 'opacity-60' : ''}`}>
                      <AvatarCircle
                        name={profileEmployee.fullName || ''}
                        color={color}
                        size="2xl"
                        avatarUrl={profileEmployee.avatar}
                        onUpload={(file) => handleAvatarUpload(profileEmployee, file)}
                      />
                    </div>
                    <div className="pb-2 min-w-0 flex-1">
                      <h2 className="font-display font-bold text-2xl leading-tight">{profileEmployee.fullName}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{profileEmployee.position || '—'}</p>
                      <Badge variant={statusVariant} className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {statusLabel}
                      </Badge>
                    </div>
                  </div>

                  {/* Employee Code */}
                  {profileEmployee.employeeCode && (
                    <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg mb-4 ${color.light} ${color.text} border ${color.border}`}>
                      <ClipboardList className="h-3.5 w-3.5" />
                      #{profileEmployee.employeeCode}
                    </div>
                  )}

                  {/* Tabs */}
                  <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 rounded-xl mb-4 h-9">
                      <TabsTrigger value="personal" className="rounded-lg text-[10px] font-bold px-1">{locale === 'ar' ? 'شخصي' : locale === 'sv' ? 'Personlig' : 'Personal'}</TabsTrigger>
                      <TabsTrigger value="work" className="rounded-lg text-[10px] font-bold px-1">{locale === 'ar' ? 'العمل' : locale === 'sv' ? 'Arbete' : 'Work'}</TabsTrigger>
                      <TabsTrigger value="schedule" className="rounded-lg text-[10px] font-bold px-1">{locale === 'ar' ? 'الجدول' : locale === 'sv' ? 'Schema' : 'Schedule'}</TabsTrigger>
                      <TabsTrigger value="notes" className="rounded-lg text-[10px] font-bold px-1">{locale === 'ar' ? 'ملاحظات' : locale === 'sv' ? 'Anteckn.' : 'Notes'}</TabsTrigger>
                    </TabsList>

                    {/* Personal Tab */}
                    <TabsContent value="personal" className="space-y-3 mt-0">
                      <h3 className={`text-xs font-bold uppercase tracking-widest ${color.text} mb-2`}>
                        {locale === 'ar' ? 'البيانات الشخصية' : locale === 'sv' ? 'Personuppgifter' : 'Personal Data'}
                      </h3>
                      {[
                        { icon: Mail, label: t('email'), value: profileEmployee.email },
                        { icon: Phone, label: t('phone'), value: profileEmployee.phone },
                        { icon: MapPin, label: t('address'), value: profileEmployee.address },
                        { icon: User, label: locale === 'ar' ? 'الجنس' : locale === 'sv' ? 'Kön' : 'Gender', value: profileEmployee.gender === 'male' ? (locale === 'ar' ? 'ذكر' : locale === 'sv' ? 'Man' : 'Male') : profileEmployee.gender === 'female' ? (locale === 'ar' ? 'أنثى' : locale === 'sv' ? 'Kvinna' : 'Female') : profileEmployee.gender },
                      ].filter(item => item.value).map(item => (
                        <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color.from} ${color.to} flex items-center justify-center flex-shrink-0`}>
                            <item.icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{item.label}</div>
                            <div className="text-sm font-medium mt-0.5">{item.value}</div>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    {/* Work Tab */}
                    <TabsContent value="work" className="space-y-3 mt-0">
                      <h3 className={`text-xs font-bold uppercase tracking-widest ${color.text} mb-2`}>
                        {locale === 'ar' ? 'بيانات العمل' : locale === 'sv' ? 'Arbetsdata' : 'Work Data'}
                      </h3>
                      {[
                        { icon: Building2, label: t('department'), value: profileEmployee.departmentName },
                        { icon: Briefcase, label: t('position'), value: profileEmployee.position },
                        { icon: User, label: locale === 'ar' ? 'المدير المباشر' : locale === 'sv' ? 'Chef' : 'Manager', value: profileEmployee.managerName },
                        { icon: Calendar, label: t('joinDate'), value: profileEmployee.joinDate ? new Date(profileEmployee.joinDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US') : undefined },
                        { icon: FileText, label: locale === 'ar' ? 'نوع العقد' : locale === 'sv' ? 'Kontraktstyp' : 'Contract Type', value: profileEmployee.contractType },
                        { icon: DollarSign, label: t('salary'), value: profileEmployee.salary ? `$${Number(profileEmployee.salary).toLocaleString()}` : undefined },
                      ].filter(item => item.value).map(item => (
                        <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color.from} ${color.to} flex items-center justify-center flex-shrink-0`}>
                            <item.icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{item.label}</div>
                            <div className="text-sm font-medium mt-0.5">{item.value}</div>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule" className="space-y-3 mt-0">
                      <h3 className={`text-xs font-bold uppercase tracking-widest ${color.text} mb-2`}>
                        {locale === 'ar' ? 'جدول الدوام' : locale === 'sv' ? 'Arbetsschema' : 'Work Schedule'}
                      </h3>

                      {/* Time Range Card */}
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${color.from} ${color.to} text-white`}>
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-wide">
                            {locale === 'ar' ? 'ساعات الدوام' : locale === 'sv' ? 'Arbetstider' : 'Working Hours'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-3xl font-bold font-data">{profileEmployee.workStart || '09:00'}</div>
                            <div className="text-xs opacity-70 mt-0.5">{locale === 'ar' ? 'بداية' : locale === 'sv' ? 'Start' : 'Start'}</div>
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            <div className="h-px w-full bg-white/40 relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white/60" />
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold font-data">{profileEmployee.workEnd || '17:00'}</div>
                            <div className="text-xs opacity-70 mt-0.5">{locale === 'ar' ? 'نهاية' : locale === 'sv' ? 'Slut' : 'End'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Work Days */}
                      {profileEmployee.workDays && (
                        <div className="p-3 rounded-xl bg-muted/40">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {locale === 'ar' ? 'أيام العمل' : locale === 'sv' ? 'Arbetsdagar' : 'Work Days'}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {profileEmployee.workDays.split(',').map(day => (
                              <span key={day} className={`text-xs font-bold px-2.5 py-1 rounded-lg ${color.light} ${color.text} border ${color.border}`}>
                                {day.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Notes Tab */}
                    <TabsContent value="notes" className="space-y-3 mt-0">
                      <h3 className={`text-xs font-bold uppercase tracking-widest ${color.text} mb-2`}>
                        {locale === 'ar' ? 'الملاحظات والمستندات' : locale === 'sv' ? 'Anteckningar & Dokument' : 'Notes & Documents'}
                      </h3>
                      {profileEmployee.notes ? (
                        <div className="p-4 rounded-xl bg-muted/40 text-sm leading-relaxed whitespace-pre-wrap">
                          {profileEmployee.notes}
                        </div>
                      ) : (
                        <div className="p-8 rounded-xl bg-muted/20 text-center">
                          <FileText className="h-8 w-8 mx-auto text-muted-foreground opacity-30 mb-2" />
                          <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'لا توجد ملاحظات' : locale === 'sv' ? 'Inga anteckningar' : 'No notes added'}</p>
                        </div>
                      )}

                      {/* Record Info */}
                      <div className="p-3 rounded-xl bg-muted/30 mt-4">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <ClipboardList className="h-3.5 w-3.5" />
                          {locale === 'ar' ? 'سجل الموظف' : locale === 'sv' ? 'Anställdpost' : 'Employee Record'}
                        </div>
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>{locale === 'ar' ? 'تاريخ الإضافة' : locale === 'sv' ? 'Tillagd' : 'Added on'}</span>
                            <span className="font-medium">{profileEmployee.createdAt ? new Date(profileEmployee.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US') : '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('employeeCode')}</span>
                            <span className="font-bold font-data">#{profileEmployee.employeeCode}</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-11 border-2"
                      onClick={() => { setProfileEmployee(null); openEdit(profileEmployee); }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> {t('edit')}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 border-2 border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                      onClick={() => { setProfileEmployee(null); setDeleteId(profileEmployee.id || null); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ===================== DELETE CONFIRM ===================== */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="rounded-3xl border-0 card-3d">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl h-11">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl h-11 bg-red-500 hover:bg-red-600 text-white border-0"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
