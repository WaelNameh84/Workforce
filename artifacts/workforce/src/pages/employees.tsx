import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
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
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create employee' });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedEmployee.id) return;
    
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
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update employee' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: 'Employee deleted successfully' });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete employee' });
    }
  };

  const getStatusColor = (s?: string) => {
    switch(s) {
      case 'active': return 'success';
      case 'on-leave': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('employees')}</h1>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> {t('addEmployee')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addEmployee')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input name="fullName" required />
                </div>
                <div className="space-y-2">
                  <Label>Employee Code</Label>
                  <Input name="employeeCode" required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" name="email" required />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input name="position" />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select name="departmentId">
                    <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                    <SelectContent>
                      {deptsData?.departments?.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Salary</Label>
                  <Input type="number" name="salary" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {t('save')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setSelectedEmployee(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input name="fullName" defaultValue={selectedEmployee.fullName} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" name="email" defaultValue={selectedEmployee.email} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input name="position" defaultValue={selectedEmployee.position || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select name="departmentId" defaultValue={selectedEmployee.departmentId ? String(selectedEmployee.departmentId) : undefined}>
                      <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                      <SelectContent>
                        {deptsData?.departments?.map(d => (
                          <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Salary</Label>
                    <Input type="number" name="salary" defaultValue={selectedEmployee.salary || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select name="status" defaultValue={selectedEmployee.status}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on-leave">On Leave</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                  {t('save')}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the employee record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center bg-muted/20">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('search')} 
                className="pl-9 bg-background" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-[150px] bg-background">
                  <SelectValue placeholder={t('department')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {deptsData?.departments?.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[120px] bg-background">
                  <SelectValue placeholder={t('status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="on-leave">{t('onLeave')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : employeesData?.employees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No employees found</TableCell>
                </TableRow>
              ) : (
                employeesData?.employees?.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {emp.fullName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{emp.fullName}</div>
                          <div className="text-xs text-muted-foreground">{emp.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{emp.position || '-'}</TableCell>
                    <TableCell>{emp.departmentName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(emp.status)} className="capitalize">
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            // View profile logic here
                            toast({ title: 'Profile viewing', description: 'Not fully implemented yet' });
                          }}>
                            <Eye className="h-4 w-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedEmployee(emp);
                            setIsEditOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(emp.id as number)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
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
    </div>
  );
}
