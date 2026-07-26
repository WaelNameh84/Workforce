import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import DetailDialog from '@/components/detail-dialog';
import { useGetEmployees, useGetDepartments, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, getGetEmployeesQueryKey, getGetDepartmentsQueryKey, EmployeeInput, Employee } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

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
        <Input name="fullName" defaultValue={defaultValues?.fullName} required />
      </div>
      <div className="space-y-2">
        <Label>{t('employeeCode')}</Label>
        <Input name="employeeCode" defaultValue={defaultValues?.employeeCode || ''} required={!defaultValues} />
      </div>
      <div className="space-y-2">
        <Label>{t('email')}</Label>
        <Input type="email" name="email" defaultValue={defaultValues?.email} required />
      </div>
      <div className="space-y-2">
        <Label>{t('position')}</Label>
        <Input name="position" defaultValue={defaultValues?.position || ''} />
      </div>
      <div className="space-y-2">
        <Label>{t('department')}</Label>
        <Select name="departmentId" defaultValue={defaultValues?.departmentId ? String(defaultValues.departmentId) : undefined}>
          <SelectTrigger><SelectValue placeholder={t('selectDept')} /></SelectTrigger>
          <SelectContent>
            {deptsData?.departments?.map(d => (
              <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('salary')}</Label>
        <Input type="number" name="salary" defaultValue={defaultValues?.salary || ''} />
      </div>
      {defaultValues && (
        <div className="space-y-2">
          <Label>{t('status')}</Label>
          <Select name="status" defaultValue={defaultValues.status}>
            <SelectTrigger><SelectValue placeholder={t('selectStatus')} /></SelectTrigger>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('employees')}</h1>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> {t('addEmployee')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('addEmployee')}</DialogTitle></DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {employeeForm()}
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>{t('save')}</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setSelectedEmployee(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('editEmployee')}</DialogTitle></DialogHeader>
            {selectedEmployee && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {employeeForm(selectedEmployee)}
                <Button type="submit" className="w-full" disabled={updateMutation.isPending}>{t('save')}</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>{t('confirmDeleteDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${t('search')} ${t('employees').toLowerCase()}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('allDepartments')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allDepartments')}</SelectItem>
                {deptsData?.departments?.map(d => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t('allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="on-leave">{t('onLeaveStatus')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>{t('employee')}</TableHead>
                <TableHead>{t('position')}</TableHead>
                <TableHead>{t('department')}</TableHead>
                <TableHead>{t('salary')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t('loading')}</TableCell></TableRow>
              ) : !employeesData?.employees?.length ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t('noEmployeesFound')}</TableCell></TableRow>
              ) : (
                employeesData.employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {emp.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-medium">{emp.fullName}</div>
                          <div className="text-xs text-muted-foreground">{emp.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{emp.position || '-'}</TableCell>
                    <TableCell>{emp.departmentName || '-'}</TableCell>
                    <TableCell>{emp.salary ? `$${Number(emp.salary).toLocaleString()}` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={emp.status === 'active' ? 'success' : emp.status === 'on-leave' ? 'warning' : 'secondary'} className="capitalize">
                        {emp.status === 'active' ? t('active') : emp.status === 'on-leave' ? t('onLeaveStatus') : t('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => setProfileEmployee(emp)}><Eye className="h-4 w-4" /> {t('viewProfile')}</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => { setSelectedEmployee(emp); setIsEditOpen(true); }}>
                            <Edit className="h-4 w-4" /> {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => setDeleteId(emp.id || null)}>
                            <Trash2 className="h-4 w-4" /> {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
