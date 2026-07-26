import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import DetailDialog from '@/components/detail-dialog';
import { useGetEmployees, useGetDepartments, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, getGetEmployeesQueryKey, getGetDepartmentsQueryKey, EmployeeInput, Employee } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Mail, Phone, MapPin } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

const deptColors = ['from-indigo-400 to-blue-500', 'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500', 'from-fuchsia-400 to-purple-500', 'from-rose-400 to-red-500'];

export default function Employees() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: employeesData, isLoading } = useGetEmployees(
    {
      companyId: user?.companyId || 0,
      ...(search && { search }),
      ...(departmentId !== 'all' && { departmentId: parseInt(departmentId) }),
      ...(status !== 'all' && { status })
    },
    { query: { enabled: !!user?.companyId, queryKey: getGetEmployeesQueryKey({ companyId: user?.companyId || 0, search, departmentId: departmentId !== 'all' ? parseInt(departmentId) : undefined, status: status !== 'all' ? status : undefined }) } }
  );

  const { data: deptsData } = useGetDepartments(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetDepartmentsQueryKey({ companyId: user?.companyId || 0 }) } }
  );

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: EmployeeInput = {
      fullName: fd.get('fullName') as string,
      email: fd.get('email') as string,
      employeeCode: fd.get('employeeCode') as string,
      departmentId: Number(fd.get('departmentId')),
      position: fd.get('position') as string,
      salary: fd.get('salary') as string,
      status: 'active',
    };
    try {
      await createMutation.mutateAsync({ data: payload });
      toast({ title: t('savedSuccessfully') });
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: t('failedCreateEmployee') });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployee?.id) return;
    const fd = new FormData(e.currentTarget);
    const payload: EmployeeInput = {
      fullName: fd.get('fullName') as string,
      email: fd.get('email') as string,
      employeeCode: fd.get('employeeCode') as string || selectedEmployee.employeeCode || '',
      departmentId: Number(fd.get('departmentId')),
      position: fd.get('position') as string,
      salary: fd.get('salary') as string,
      status: fd.get('status') as EmployeeInput['status'] || selectedEmployee.status || 'active',
    };
    try {
      await updateMutation.mutateAsync({ id: selectedEmployee.id, data: payload });
      toast({ title: t('savedSuccessfully') });
      setIsEditOpen(false);
      setSelectedEmployee(null);
      queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: t('failedDeleteEmployee') });
    }
  };

  const employeeForm = (defaultValues?: Employee) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>{t('fullName')}</Label>
        <Input name="fullName" defaultValue={defaultValues?.fullName} required className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>{t('employeeCode')}</Label>
        <Input name="employeeCode" defaultValue={defaultValues?.employeeCode || ''} required={!defaultValues} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>{t('email')}</Label>
        <Input type="email" name="email" defaultValue={defaultValues?.email} required className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>{t('position')}</Label>
        <Input name="position" defaultValue={defaultValues?.position || ''} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>{t('department')}</Label>
        <Select name="departmentId" defaultValue={defaultValues?.departmentId ? String(defaultValues.departmentId) : undefined}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('selectDept')} /></SelectTrigger>
          <SelectContent>
            {deptsData?.departments?.map(d => (
              <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('salary')}</Label>
        <Input type="number" name="salary" defaultValue={defaultValues?.salary || ''} className="rounded-xl font-data" />
      </div>
      {defaultValues && (
        <div className="space-y-2">
          <Label>{t('status')}</Label>
          <Select name="status" defaultValue={defaultValues.status}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('selectStatus')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="on-leave">{t('onLeaveStatus')}</SelectItem>
              <SelectItem value="inactive">{t('inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('employees')}</h1>
          <p className="text-sm mt-1 text-muted-foreground">{employeesData?.total || 0} total employees</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border-0"><Plus className="h-4 w-4" /> {t('addEmployee')}</Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-0 card-3d">
            <DialogHeader><DialogTitle className="font-display text-xl">{t('addEmployee')}</DialogTitle></DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-6 mt-2">
              {employeeForm()}
              <Button type="submit" className="w-full rounded-xl h-12 text-md" disabled={createMutation.isPending}>{t('save')}</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setSelectedEmployee(null); }}>
          <DialogContent className="rounded-3xl border-0 card-3d">
            <DialogHeader><DialogTitle className="font-display text-xl">{t('editEmployee')}</DialogTitle></DialogHeader>
            {selectedEmployee && (
              <form onSubmit={handleEditSubmit} className="space-y-6 mt-2">
                {employeeForm(selectedEmployee)}
                <Button type="submit" className="w-full rounded-xl h-12 text-md" disabled={updateMutation.isPending}>{t('save')}</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent className="rounded-3xl border-0 card-3d">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">{t('confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>{t('confirmDeleteDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className="rounded-xl h-11">{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="rounded-xl h-11 bg-red-500 hover:bg-red-600 text-white border-0">
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

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
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-border bg-background h-11">
              <SelectValue placeholder={t('allDepartments')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t('allDepartments')}</SelectItem>
              {deptsData?.departments?.map(d => (
                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[150px] rounded-xl border-border bg-background h-11">
              <SelectValue placeholder={t('allStatus')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="on-leave">{t('onLeaveStatus')}</SelectItem>
              <SelectItem value="inactive">{t('inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <div key={i} className="card-3d h-[240px] animate-pulse bg-muted-bg" />)
        ) : !employeesData?.employees?.length ? (
          <div className="col-span-full card-3d p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-muted-bg rounded-full flex items-center justify-center mb-4"><Search className="w-8 h-8 opacity-50" /></div>
            <p className="font-medium text-lg">{t('noEmployeesFound')}</p>
          </div>
        ) : employeesData.employees.map((emp, index) => {
          const deptColor = deptColors[(emp.departmentId || 0) % deptColors.length];
          return (
            <div key={emp.id} data-testid={`card-employee-${emp.id}`} className={`card-3d flex flex-col animate-fadeIn stagger-${(index % 6) + 1}`}>
              {/* Top Accent Bar */}
              <div className={`h-2 w-full bg-gradient-to-r ${deptColor}`} />
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${deptColor} p-0.5 shadow-lg`}>
                    <div className="w-full h-full bg-card rounded-[14px] flex items-center justify-center text-xl font-bold font-display text-foreground">
                      {emp.fullName?.charAt(0) || 'U'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button data-testid={`button-employee-actions-${emp.id}`} variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted-bg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-border">
                        <DropdownMenuItem className="gap-2 rounded-lg" onClick={() => setProfileEmployee(emp)}><Eye className="h-4 w-4 text-blue-500" /> {t('viewProfile')}</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 rounded-lg" onClick={() => { setSelectedEmployee(emp); setIsEditOpen(true); }}><Edit className="h-4 w-4 text-amber-500" /> {t('edit')}</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 rounded-lg text-red-500" onClick={() => setDeleteId(emp.id || null)}><Trash2 className="h-4 w-4" /> {t('delete')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Badge variant={emp.status === 'active' ? 'success' : emp.status === 'on-leave' ? 'warning' : 'secondary'} className="capitalize text-[10px] font-bold tracking-wider rounded-md">
                      {emp.status === 'active' ? t('active') : emp.status === 'on-leave' ? t('onLeaveStatus') : t('inactive')}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <button data-testid={`button-view-employee-${emp.id}`} onClick={() => setProfileEmployee(emp)} className="text-left w-full hover:opacity-80 transition-opacity">
                    <h3 className="font-bold text-lg leading-tight truncate">{emp.fullName}</h3>
                    <p className="text-sm text-muted-foreground truncate">{emp.position || 'Employee'}</p>
                  </button>
                </div>

                <div className="mt-auto space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 opacity-70" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 opacity-70" />
                    <span className="truncate font-medium">{emp.departmentName || '—'}</span>
                  </div>
                </div>
              </div>
              
              <div className="px-5 py-3 border-t border-border bg-muted/30 flex justify-between items-center text-xs">
                <span className="font-medium opacity-70">Salary</span>
                <span className="font-data font-bold">{emp.salary ? `$${Number(emp.salary).toLocaleString()}` : '—'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <DetailDialog
        open={!!profileEmployee}
        onOpenChange={(open) => !open && setProfileEmployee(null)}
        title={profileEmployee?.fullName || t('viewProfile')}
        items={profileEmployee ? [
          { label: t('email'), value: profileEmployee.email },
          { label: t('position'), value: profileEmployee.position },
          { label: t('department'), value: profileEmployee.departmentName },
          { label: t('salary'), value: profileEmployee.salary ? `$${Number(profileEmployee.salary).toLocaleString()}` : '—' },
          { label: t('status'), value: profileEmployee.status },
          { label: t('phone'), value: profileEmployee.phone },
          { label: t('address'), value: profileEmployee.address },
        ] : []}
      />
    </div>
  );
}
