import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useGetDepartments, useCreateDepartment, useDeleteDepartment,
  getGetDepartmentsQueryKey, DepartmentInput
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Plus, Trash2, Users, Search } from 'lucide-react';

const deptColors = [
  { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-600 dark:text-violet-400' },
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'from-rose-500 to-red-600', light: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-600 dark:text-rose-400' },
  { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-600 dark:text-cyan-400' },
];

export default function Departments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const cid = user?.companyId || 0;

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useGetDepartments(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetDepartmentsQueryKey({ companyId: cid }) } }
  );
  const createMutation = useCreateDepartment();
  const deleteMutation = useDeleteDepartment();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetDepartmentsQueryKey({ companyId: cid }) });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({ data: { name: name.trim(), companyId: cid, description: description.trim() || undefined } as DepartmentInput });
      toast({ title: 'تم إضافة القسم بنجاح' });
      setIsAddOpen(false);
      setName(''); setDescription('');
      invalidate();
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إضافة القسم' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: 'تم حذف القسم' });
      setDeleteId(null);
      invalidate();
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في حذف القسم' });
    }
  };

  const departments = (data?.departments || []).filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">الأقسام</h1>
          <p className="text-sm mt-1 text-muted-foreground">{data?.departments?.length || 0} قسم مسجل</p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white border-0"
        >
          <Plus className="h-4 w-4" /> إضافة قسم
        </Button>
      </div>

      {/* Search */}
      <div className="card-3d p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الأقسام..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-border bg-background h-11"
          />
        </div>
      </div>

      {/* Departments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-3d h-44 animate-pulse" />
          ))}
        </div>
      ) : !departments.length ? (
        <div className="card-3d p-16 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-muted-foreground opacity-40" />
          </div>
          <p className="font-bold text-lg text-muted-foreground">
            {search ? 'لا توجد نتائج للبحث' : 'لا توجد أقسام بعد'}
          </p>
          {!search && (
            <p className="text-sm text-muted-foreground mt-1">أضف قسمًا جديدًا للبدء</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept, index) => {
            const color = deptColors[index % deptColors.length];
            return (
              <div
                key={dept.id}
                className={`card-3d flex flex-col overflow-hidden animate-fadeIn stagger-${(index % 6) + 1} group`}
              >
                {/* Banner */}
                <div className={`h-20 bg-gradient-to-br ${color.bg} relative overflow-hidden`}>
                  <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
                  <div className="absolute -left-2 bottom-0 w-14 h-14 rounded-full bg-white/5" />
                  <div className="absolute inset-0 flex items-center px-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{dept.description}</p>
                    )}
                  </div>
                  <div className={`mt-auto flex items-center justify-between px-3 py-2 rounded-xl ${color.light} border ${color.border}`}>
                    <div className="flex items-center gap-2">
                      <Users className={`h-3.5 w-3.5 ${color.text}`} />
                      <span className={`text-xs font-bold ${color.text}`}>قسم نشط</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteId(dept.id ?? null)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-3xl border-0 card-3d max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              إضافة قسم جديد
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">اسم القسم *</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثال: قسم الهندسة"
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الوصف (اختياري)</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="وصف مختصر للقسم"
                className="rounded-xl h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white border-0 font-bold"
              disabled={createMutation.isPending || !name.trim()}
            >
              حفظ
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="rounded-3xl border-0 card-3d">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl h-11">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl h-11 bg-red-500 hover:bg-red-600 text-white border-0"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
