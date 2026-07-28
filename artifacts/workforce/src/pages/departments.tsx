import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import {
  useGetDepartments, useCreateDepartment, useDeleteDepartment,
  getGetDepartmentsQueryKey, DepartmentInput
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Plus, Trash2, Users, Search, ImageOff, Clock, Gift, Banknote, CalendarDays, FileX, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';

/* ── Manager Modules (sub-sections of departments) ── */
const managerModules = [
  {
    href: '/dashboard/attendance-correction',
    icon: Clock,
    accent: '#f59e0b',
    grad: 'from-amber-500 to-orange-600',
    label: { ar: 'تصحيح الحضور', en: 'Attendance Correction', sv: 'Närvaro­korrigering' },
    desc:  { ar: 'تصحيح سجلات الحضور المتأخرة والإشعارات المرفوعة', en: 'Fix late arrivals and justification requests', sv: 'Korrigera sena ankomster och motiveringsförfrågningar' },
    badge: { ar: 'إشعارات المدير', en: 'Manager Alerts', sv: 'Chefsaviseringar' },
  },
  {
    href: '/dashboard/bonuses',
    icon: Gift,
    accent: '#22c55e',
    grad: 'from-green-500 to-emerald-600',
    label: { ar: 'المكافآت والخصومات', en: 'Bonuses & Deductions', sv: 'Bonusar & avdrag' },
    desc:  { ar: 'إضافة مكافآت أو خصومات على الموظفين', en: 'Add bonuses or deductions for employees', sv: 'Lägg till bonusar eller avdrag för anställda' },
    badge: { ar: 'خاص بالمدير', en: 'Manager Only', sv: 'Endast chef' },
  },
  {
    href: '/dashboard/advances',
    icon: Banknote,
    accent: '#3b82f6',
    grad: 'from-blue-500 to-indigo-600',
    label: { ar: 'السلف', en: 'Advances', sv: 'Förskott' },
    desc:  { ar: 'طلبات السلفة وتقسيمها إلى أقساط', en: 'Advance requests and installment plans', sv: 'Förskottsansökningar och avbetalningsplaner' },
    badge: { ar: 'موافقة + تقسيط', en: 'Approve + Split', sv: 'Godkänn + Dela' },
  },
  {
    href: '/dashboard/holidays',
    icon: CalendarDays,
    accent: '#8b5cf6',
    grad: 'from-violet-500 to-purple-600',
    label: { ar: 'العطل الرسمية', en: 'Official Holidays', sv: 'Officiella helgdagar' },
    desc:  { ar: 'تقويم العطل الرسمية السويدية المرتبط بالهاتف', en: 'Swedish public holidays synced with device calendar', sv: 'Svenska allmänna helgdagar synkade med kalender' },
    badge: { ar: 'تقويم السويد', en: 'SE Calendar', sv: 'SE Kalender' },
  },
  {
    href: '/dashboard/clear-reports',
    icon: FileX,
    accent: '#ef4444',
    grad: 'from-red-500 to-rose-600',
    label: { ar: 'مسح التقارير', en: 'Clear Reports', sv: 'Rensa rapporter' },
    desc:  { ar: 'حذف سجلات الحضور والرواتب والتقارير بحسب الموظف', en: 'Delete records by type or employee', sv: 'Radera poster efter typ eller anställd' },
    badge: { ar: 'بيانات حساسة', en: 'Sensitive', sv: 'Känsligt' },
  },
] as const;

function getDeptImageUrl(name: string): string {
  return `/api/images/dept?name=${encodeURIComponent(name)}`;
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
        referrerPolicy="no-referrer"
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
function PreviewBanner({ name, emptyLabel }: { name: string; emptyLabel: string }) {
  const [imgError, setImgError] = useState(false);
  const url = name.trim() ? getDeptImageUrl(name) : '';

  if (!name.trim()) {
    return (
      <div className="h-28 rounded-xl bg-muted/50 border border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground text-sm">
        <ImageOff className="h-4 w-4" />
         {emptyLabel}
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
  const { t, locale } = useLanguage();
  const [, setLocation] = useLocation();
  const fmt = (key: Parameters<typeof t>[0], count?: number) => t(key).replace('{count}', String(count ?? 0));
  const cid = user?.companyId || 0;
  const l = (obj: { ar: string; en: string; sv: string }) => obj[locale as 'ar' | 'en' | 'sv'] || obj.ar;
  const isRTL = locale === 'ar';

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
      toast({ title: t('departmentCreated') });
      setIsAddOpen(false);
      setName(''); setDescription('');
      invalidate();
    } catch {
      toast({ variant: 'destructive', title: t('error'), description: t('departmentCreateFailed') });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: t('departmentDeleted') });
      setDeleteId(null);
      invalidate();
    } catch {
      toast({ variant: 'destructive', title: t('error'), description: t('departmentDeleteFailed') });
    }
  };

  const departments = (data?.departments || []).filter(d =>
    !search || (d.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
             <h1 className="font-display text-3xl font-bold tracking-tight">{t('departments')}</h1>
             <p className="text-sm mt-1 text-muted-foreground">{fmt('departmentsRegistered', data?.departments?.length || 0)}</p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white border-0"
        >
           <Plus className="h-4 w-4" /> {t('addDepartment')}
        </Button>
      </div>

      {/* ── Manager Modules ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {locale === 'ar' ? 'أدوات المدير' : locale === 'sv' ? 'Chefsverktyg' : 'Manager Tools'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {managerModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.href}
                type="button"
                onClick={() => setLocation(mod.href)}
                className="living-card px-5 py-4 flex items-center gap-4 text-start group transition hover:scale-[1.01] active:scale-[.98]"
                style={{ '--card-accent': mod.accent } as React.CSSProperties}
              >
                <span className="living-card-orb" style={{ top: '-1rem', insetInlineEnd: '-0.5rem' }} />
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.grad} flex items-center justify-center shrink-0 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight">{l(mod.label)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{l(mod.desc)}</p>
                  <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black border"
                    style={{ color: mod.accent, borderColor: `${mod.accent}40`, background: `${mod.accent}15` }}>
                    {l(mod.badge)}
                  </span>
                </div>
                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground transition" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Departments List ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          {locale === 'ar' ? 'الأقسام المسجلة' : locale === 'sv' ? 'Registrerade avdelningar' : 'Registered Departments'}
        </h2>
      </div>

      {/* Search */}
      <div className="card-3d p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
             placeholder={t('searchDepartments')}
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
             {search ? t('noSearchResults') : t('noDepartmentsYet')}
          </p>
          {!search && (
             <p className="text-sm text-muted-foreground mt-1">{t('addDepartmentToStart')}</p>
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
                       <span className="text-xs font-bold text-white">{t('activeDepartment')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteId(dept.id ?? null)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                       {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Drawer */}
      <Drawer open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) { setName(''); setDescription(''); } }}>
        <DrawerContent className="max-h-[92dvh] flex flex-col">
          <DrawerHeader className="flex-shrink-0 pb-3 border-b border-border/50">
            <DrawerTitle className="font-display text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              {t('addDepartment')}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <form id="add-dept-form" onSubmit={handleAdd} className="space-y-4">
              {/* Live image preview */}
              <PreviewBanner name={name} emptyLabel={t('exampleDepartment')} />

              {/* Fields card */}
              <div
                className="living-card p-4 space-y-4"
                style={{ '--card-accent': '#6366f1' } as React.CSSProperties}
              >
                <span className="living-card-orb" style={{ top: '-1.5rem', right: '-1rem' }} />
                <span className="living-card-orb living-card-orb--small" style={{ bottom: '0.5rem', left: '1rem' }} />
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('departmentNameRequired')}</Label>
                  <Input
                    value={name}
                    onChange={e => { setName(e.target.value); }}
                    placeholder={t('exampleDepartment')}
                    required
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('departmentDescriptionOptional')}</Label>
                  <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t('shortDepartmentDescription')}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
            </form>
          </div>
          <div className="flex-shrink-0 px-4 py-3 border-t border-border/50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
            <Button
              type="submit"
              form="add-dept-form"
              className="w-full rounded-xl h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white border-0 font-bold"
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending ? t('saving') : t('save')}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="rounded-3xl border-0 card-3d">
          <AlertDialogHeader>
             <AlertDialogTitle className="font-display">{t('confirmDelete')}</AlertDialogTitle>
             <AlertDialogDescription>{t('confirmDeleteDepartment')}</AlertDialogDescription>
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
