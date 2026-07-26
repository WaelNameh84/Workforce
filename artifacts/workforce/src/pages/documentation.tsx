import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useGetWorkDocs, useCreateWorkDoc, useDeleteWorkDoc,
  useGetDepartments, useGetEmployees,
  getGetWorkDocsQueryKey,
  getGetDepartmentsQueryKey,
  getGetEmployeesQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileImage, Plus, Trash2, Search, Building2, User, Calendar, Filter, Upload, Eye, X } from 'lucide-react';

const deptColors = [
  { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', icon: 'bg-blue-500' },
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-600 dark:text-violet-400', icon: 'bg-violet-500' },
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400', icon: 'bg-emerald-500' },
  { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400', icon: 'bg-amber-500' },
  { bg: 'from-rose-500 to-red-600', light: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-600 dark:text-rose-400', icon: 'bg-rose-500' },
  { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-600 dark:text-cyan-400', icon: 'bg-cyan-500' },
];

export default function Documentation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const cid = user?.companyId || 0;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterEmp, setFilterEmp] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Upload form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [caption, setCaption] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [photoData, setPhotoData] = useState('');
  const [previewImage, setPreviewImage] = useState<string>('');

  const deptParam = filterDept !== 'all' ? parseInt(filterDept) : undefined;
  const empParam = filterEmp !== 'all' ? parseInt(filterEmp) : undefined;

  const { data, isLoading } = useGetWorkDocs(
    { companyId: cid, ...(deptParam ? { departmentId: deptParam } : {}), ...(empParam ? { employeeId: empParam } : {}) },
    { query: { enabled: !!cid, queryKey: getGetWorkDocsQueryKey({ companyId: cid }) } }
  );

  const { data: deptsData } = useGetDepartments(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetDepartmentsQueryKey({ companyId: cid }) } }
  );

  const { data: empsData } = useGetEmployees(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetEmployeesQueryKey({ companyId: cid }) } }
  );

  const createMutation = useCreateWorkDoc();
  const deleteMutation = useDeleteWorkDoc();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetWorkDocsQueryKey({ companyId: cid }) });

  const docs = ((data as any)?.docs || []).filter((d: any) =>
    !search ||
    (d.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.photoName || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.caption || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.departmentName || '').toLowerCase().includes(search.toLowerCase())
  );

  const departments = deptsData?.departments || [];
  const employees = (empsData as any)?.employees || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoData(result);
      setPreviewImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !photoData) return;
    try {
      await createMutation.mutateAsync({
        data: {
          companyId: cid,
          employeeId: parseInt(selectedEmployeeId),
          photoData,
          photoName: photoName || undefined,
          caption: caption || undefined,
        }
      });
      toast({ title: 'تم رفع الملف بنجاح' });
      setIsAddOpen(false);
      setSelectedEmployeeId('');
      setCaption('');
      setPhotoName('');
      setPhotoData('');
      setPreviewImage('');
      invalidate();
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في رفع الملف' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: 'تم حذف الملف' });
      setDeleteId(null);
      invalidate();
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في حذف الملف' });
    }
  };

  const resetAddForm = () => {
    setIsAddOpen(false);
    setSelectedEmployeeId('');
    setCaption('');
    setPhotoName('');
    setPhotoData('');
    setPreviewImage('');
  };

  const getDeptColorByName = (deptName: string | null | undefined) => {
    if (!deptName) return deptColors[0];
    const idx = departments.findIndex((d: any) => d.name === deptName);
    return deptColors[(idx >= 0 ? idx : 0) % deptColors.length];
  };

  const isImage = (data: string) => data?.startsWith('data:image') || false;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">التوثيق</h1>
          <p className="text-sm mt-1 text-muted-foreground">{docs.length} ملف موثّق</p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white border-0"
        >
          <Plus className="h-4 w-4" /> رفع ملف جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="card-3d p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الملفات..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border bg-background h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-40 rounded-xl h-10">
                <SelectValue placeholder="كل الأقسام" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام</SelectItem>
                {departments.map((d: any) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEmp} onValueChange={setFilterEmp}>
              <SelectTrigger className="w-44 rounded-xl h-10">
                <SelectValue placeholder="كل الموظفين" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الموظفين</SelectItem>
                {employees.map((e: any) => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats summary by department */}
      {!isLoading && departments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {departments.map((dept: any, idx: number) => {
            const color = deptColors[idx % deptColors.length];
            const count = (data as any)?.docs?.filter((d: any) => d.departmentName === dept.name).length || 0;
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => setFilterDept(filterDept === String(dept.id) ? 'all' : String(dept.id))}
                className={`card-3d p-4 text-right transition-all hover:-translate-y-0.5 cursor-pointer ${filterDept === String(dept.id) ? `ring-2 ring-offset-2 ring-offset-background ${color.border}` : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center mb-2`}>
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-bold text-muted-foreground truncate">{dept.name}</p>
                <p className={`text-2xl font-black mt-1 ${color.text}`}>{count}</p>
                <p className="text-[10px] text-muted-foreground">ملف</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Docs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-3d h-56 animate-pulse" />
          ))}
        </div>
      ) : !docs.length ? (
        <div className="card-3d p-16 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <FileImage className="w-10 h-10 text-muted-foreground opacity-40" />
          </div>
          <p className="font-bold text-lg text-muted-foreground">
            {search || filterDept !== 'all' || filterEmp !== 'all' ? 'لا توجد نتائج' : 'لا توجد ملفات موثّقة بعد'}
          </p>
          {!search && filterDept === 'all' && filterEmp === 'all' && (
            <p className="text-sm text-muted-foreground mt-1">ارفع ملفاً جديداً للبدء</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docs.map((doc: any, index: number) => {
            const color = getDeptColorByName(doc.departmentName);
            return (
              <div
                key={doc.id}
                className={`card-3d flex flex-col overflow-hidden animate-fadeIn stagger-${(index % 6) + 1} group`}
              >
                {/* Preview area */}
                <div
                  className={`relative h-36 bg-gradient-to-br ${color.bg} overflow-hidden cursor-pointer`}
                  onClick={() => setPreviewDoc(doc)}
                >
                  {isImage(doc.photoData) ? (
                    <img
                      src={doc.photoData}
                      alt={doc.photoName || 'صورة'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <FileImage className="w-10 h-10 text-white/80" />
                      <span className="text-white/80 text-xs font-medium">انقر للعرض</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 flex-1 flex flex-col gap-2">
                  {doc.photoName && (
                    <p className="font-bold text-sm truncate">{doc.photoName}</p>
                  )}
                  {doc.caption && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{doc.caption}</p>
                  )}

                  <div className="mt-auto space-y-1.5">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${color.light} ${color.text}`}>
                      <User className="w-3 h-3 shrink-0" />
                      <span className="truncate">{doc.employeeName || '—'}</span>
                    </div>
                    {doc.departmentName && (
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${color.light} ${color.text}`}>
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{doc.departmentName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ar-SA') : '—'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteId(doc.id ?? null)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) resetAddForm(); }}>
        <DialogContent className="rounded-3xl border-0 card-3d max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Upload className="h-4 w-4 text-white" />
              </div>
              رفع ملف جديد
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الموظف *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} required>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.fullName} {e.departmentName ? `· ${e.departmentName}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الملف / الصورة *</Label>
              <div
                className="relative border-2 border-dashed border-border rounded-xl h-32 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 transition-colors overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <>
                    <img src={previewImage} alt="معاينة" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">انقر لتغيير الملف</span>
                    </div>
                  </>
                ) : (
                  <>
                    <FileImage className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">انقر لاختيار صورة أو ملف</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {photoName && (
                <p className="text-xs text-muted-foreground truncate">{photoName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الوصف (اختياري)</Label>
              <Input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="وصف مختصر للملف"
                className="rounded-xl h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-11 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white border-0 font-bold"
              disabled={createMutation.isPending || !selectedEmployeeId || !photoData}
            >
              {createMutation.isPending ? 'جارٍ الرفع...' : 'رفع الملف'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="rounded-3xl border-0 card-3d max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="font-display text-lg">
                  {previewDoc.photoName || 'معاينة الملف'}
                </DialogTitle>
                <button onClick={() => setPreviewDoc(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </DialogHeader>
            <div className="space-y-3">
              {isImage(previewDoc.photoData) ? (
                <img
                  src={previewDoc.photoData}
                  alt={previewDoc.photoName || 'صورة'}
                  className="w-full rounded-xl max-h-80 object-contain"
                />
              ) : (
                <div className="w-full h-40 rounded-xl bg-muted flex flex-col items-center justify-center gap-2">
                  <FileImage className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">لا يمكن معاينة هذا النوع من الملفات</p>
                </div>
              )}
              <div className="space-y-2 text-sm">
                {previewDoc.caption && (
                  <p className="text-muted-foreground">{previewDoc.caption}</p>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span>{previewDoc.employeeName || '—'}</span>
                  {previewDoc.departmentName && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{previewDoc.departmentName}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{previewDoc.createdAt ? new Date(previewDoc.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="rounded-3xl border-0 card-3d">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
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
