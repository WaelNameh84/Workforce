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
import { Building2, Plus, Trash2, Users, Search, ImageOff } from 'lucide-react';

/* ── Keyword map: Arabic department names → English Unsplash search terms ── */
const KEYWORD_MAP: Array<[string | RegExp, string]> = [
  [/نجار|نجارة|خشب/,           'carpenter woodworking workshop'],
  [/حداد|حدادة|لحام/,          'blacksmith metalwork forge'],
  [/كهرباء|كهربائي/,           'electrician electrical wiring'],
  [/سباك|سباكة|مياه/,          'plumber plumbing pipe'],
  [/بناء|مقاول|إنشاء/,         'construction building site'],
  [/محاسب|محاسبة|مالي|مال/,    'accounting finance office'],
  [/مبيعات|بيع/,               'sales business meeting'],
  [/تسويق|ماركتنج/,            'marketing creative advertising'],
  [/هندسة|مهندس/,              'engineering technology blueprint'],
  [/تقنية|برمجة|حاسوب|آي تي|it/i, 'technology computer programming'],
  [/طبي|طب|صحة|مستشفى/,       'medical healthcare hospital'],
  [/أمن|حراسة|حراس/,           'security guard patrol'],
  [/نظافة|تنظيف|جلي/,          'cleaning service janitor'],
  [/مطبخ|طعام|وجبات/,          'kitchen restaurant food'],
  [/طباخ|طهي|شيف/,             'chef cooking restaurant'],
  [/زراع|مزارع|زراعة/,         'agriculture farm crops'],
  [/نقل|توصيل|شحن|سائق/,       'transportation truck logistics'],
  [/موارد بشرية|hr|إدارة/,      'human resources management office'],
  [/مستودع|مخزن|تخزين/,        'warehouse storage shelves'],
  [/تصميم|ديزاين|جرافيك/,      'design creative studio'],
  [/قانون|محامي|قضاء/,         'law legal justice'],
  [/خدمة عملاء|كول سنتر/,      'customer service call center'],
  [/صيانة|ميكانيك|تصليح/,      'mechanic maintenance workshop'],
  [/طيران|مطار/,               'aviation airport plane'],
  [/فندق|ضيافة|سياحة/,         'hotel hospitality tourism'],
  [/تعليم|مدرسة|معلم/,         'education school teaching'],
  [/إعلام|صحافة|تصوير/,        'media journalism photography'],
  [/رياضة|جيم|لياقة/,          'sports gym fitness'],
  [/موسيقى|فن|إبداع/,          'music art creative'],
];

function getDeptImageUrl(name: string): string {
  const lower = name.toLowerCase();
  for (const [pattern, keyword] of KEYWORD_MAP) {
    const match = typeof pattern === 'string'
      ? lower.includes(pattern)
      : pattern.test(lower);
    if (match) {
      return `https://loremflickr.com/600/240/${encodeURIComponent(keyword)}`;
    }
  }
  // Fallback: use the name itself as search keyword
  return `https://loremflickr.com/600/240/${encodeURIComponent('office,work,team')}`;
}

/* ── Placeholder colours for fallback banner ── */
const deptColors = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-sky-600',
];

/* ── Dept Card Banner ── */
function DeptBanner({ name, index }: { name: string; index: number }) {
  const [imgError, setImgError] = useState(false);
  const url = getDeptImageUrl(name);

  if (imgError) {
    return (
      <div className={`h-32 bg-gradient-to-br ${deptColors[index % deptColors.length]} relative overflow-hidden flex items-center justify-center`}>
        <Building2 className="h-10 w-10 text-white/60" />
      </div>
    );
  }

  return (
    <div className="h-32 relative overflow-hidden bg-muted">
      <img
        src={url}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
        loading="lazy"
      />
      {/* Overlay so card text is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-3 left-4">
        <span className="text-white font-bold text-lg drop-shadow-sm leading-tight line-clamp-1">{name}</span>
      </div>
    </div>
  );
}

/* ── Preview banner (shown while typing in the Add dialog) ── */
function PreviewBanner({ name }: { name: string }) {
  const [imgError, setImgError] = useState(false);
  const url = name.trim() ? getDeptImageUrl(name) : '';

  if (!name.trim()) {
    return (
      <div className="h-28 rounded-xl bg-muted/50 border border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground text-sm">
        <ImageOff className="h-4 w-4" />
        اكتب اسم القسم لمعاينة الصورة
      </div>
    );
  }

  if (imgError) {
    return (
      <div className={`h-28 rounded-xl bg-gradient-to-br ${deptColors[0]} flex items-center justify-center`}>
        <Building2 className="h-8 w-8 text-white/70" />
      </div>
    );
  }

  return (
    <div className="h-28 rounded-xl overflow-hidden relative bg-muted">
      <img
        key={url}
        src={url}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-2 left-3 text-white text-sm font-bold drop-shadow">{name}</div>
    </div>
  );
}

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
    !search || (d.name || '').toLowerCase().includes(search.toLowerCase())
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
            <div key={i} className="card-3d h-52 animate-pulse" />
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
            const colorClass = deptColors[index % deptColors.length];
            return (
              <div
                key={dept.id}
                className="card-3d flex flex-col overflow-hidden animate-fadeIn group"
              >
                {/* Image Banner */}
                <DeptBanner name={dept.name || ''} index={index} />

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {/* Title is in banner overlay now; show description + controls */}
                  {dept.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{dept.description}</p>
                  )}
                  <div className={`mt-auto flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r ${colorClass} bg-opacity-10`}>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-white" />
                      <span className="text-xs font-bold text-white">قسم نشط</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteId(dept.id ?? null)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/20 transition-colors"
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
      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) { setName(''); setDescription(''); } }}>
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
            {/* Live image preview */}
            <PreviewBanner name={name} />

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">اسم القسم *</Label>
              <Input
                value={name}
                onChange={e => { setName(e.target.value); }}
                placeholder="مثال: نجار، محاسبة، هندسة"
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
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
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
