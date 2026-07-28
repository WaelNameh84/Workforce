import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
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
import { Building2, Plus, Trash2, Users, Search, ImageOff } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';

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
  const { t } = useLanguage();
  const fmt = (key: Parameters<typeof t>[0], count?: number) => t(key).replace('{count}', String(count ?? 0));
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
    <div className="space-y-6 animate-fadeIn">
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
