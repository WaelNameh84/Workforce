import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useGetLocations, useCreateLocation, useDeleteLocation,
  getGetLocationsQueryKey, LocationInput
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Trash2, Search, Navigation, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { BottomSheet } from '@/components/bottom-sheet';

const locColors = [
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-600 dark:text-cyan-400' },
  { bg: 'from-teal-500 to-green-600', light: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-600 dark:text-teal-400' },
  { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-600 dark:text-violet-400' },
  { bg: 'from-lime-500 to-green-600', light: 'bg-lime-50 dark:bg-lime-950/30', border: 'border-lime-200 dark:border-lime-800', text: 'text-lime-600 dark:text-lime-400' },
];

export default function Locations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const fmt = (key: Parameters<typeof t>[0], count?: number) => t(key).replace('{count}', String(count ?? 0));
  const cid = user?.companyId || 0;

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [locName, setLocName] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locCity, setLocCity] = useState('');

  const { data, isLoading } = useGetLocations(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetLocationsQueryKey({ companyId: cid }) } }
  );
  const createMutation = useCreateLocation();
  const deleteMutation = useDeleteLocation();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetLocationsQueryKey({ companyId: cid }) });

  const handleAdd = async () => {
    if (!locName.trim()) return;
    try {
      await createMutation.mutateAsync({ data: { name: locName.trim(), companyId: cid, address: locAddress.trim() || undefined, city: locCity.trim() || undefined } as LocationInput });
       toast({ title: t('locationCreated') });
      setIsAddOpen(false);
      setLocName(''); setLocAddress(''); setLocCity('');
      invalidate();
    } catch {
       toast({ variant: 'destructive', title: t('error'), description: t('locationCreateFailed') });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
       toast({ title: t('locationDeleted') });
      setDeleteId(null);
      invalidate();
    } catch {
       toast({ variant: 'destructive', title: t('error'), description: t('locationDeleteFailed') });
    }
  };

  const locations = (data?.locations || []).filter(l =>
    !search || (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="font-display text-3xl font-bold tracking-tight">{t('workLocations')}</h1>
           <p className="text-sm mt-1 text-muted-foreground">{fmt('locationsRegistered', data?.locations?.length || 0)}</p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border-0"
        >
           <Plus className="h-4 w-4" /> {t('addLocation')}
        </Button>
      </div>

      {/* Search */}
      <div className="card-3d p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
             placeholder={t('searchLocations')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-border bg-background h-11"
          />
        </div>
      </div>

      {/* Locations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-3d h-44 animate-pulse" />
          ))}
        </div>
      ) : !locations.length ? (
        <div className="card-3d p-16 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <MapPin className="w-10 h-10 text-muted-foreground opacity-40" />
          </div>
          <p className="font-bold text-lg text-muted-foreground">
             {search ? t('noSearchResults') : t('noLocationsYet')}
          </p>
          {!search && (
             <p className="text-sm text-muted-foreground mt-1">{t('addLocationToStart')}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc, index) => {
            const color = locColors[index % locColors.length];
            return (
              <div
                key={loc.id}
                className={`card-3d flex flex-col overflow-hidden animate-fadeIn stagger-${(index % 6) + 1} group`}
              >
                {/* Banner */}
                <div className={`h-20 bg-gradient-to-br ${color.bg} relative overflow-hidden`}>
                  <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
                  <div className="absolute -left-2 bottom-0 w-14 h-14 rounded-full bg-white/5" />
                  <div className="absolute inset-0 flex items-center px-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{loc.name}</h3>
                    {loc.city && (
                      <p className="text-sm text-muted-foreground mt-0.5 font-medium">{loc.city}</p>
                    )}
                    {loc.address && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{loc.address}</p>
                    )}
                  </div>
                  <div className={`mt-auto flex items-center justify-between px-3 py-2 rounded-xl ${color.light} border ${color.border}`}>
                    <div className="flex items-center gap-2">
                      <Navigation className={`h-3.5 w-3.5 ${color.text}`} />
                       <span className={`text-xs font-bold ${color.text}`}>{t('activeLocation')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteId(loc.id ?? null)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
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

      {/* Add BottomSheet */}
      <BottomSheet
        open={isAddOpen}
        onClose={() => { setIsAddOpen(false); setLocName(''); setLocAddress(''); setLocCity(''); }}
        title={
          <div className="relative -mx-5 -mt-4 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-t-3xl overflow-hidden flex items-center px-5 gap-3 mb-4">
            <div className="nav-card-wave" />
            <div className="card-orb w-20 h-20 absolute -right-4 -top-4" />
            <div className="relative z-10 w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg card-icon-pulse">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div className="relative z-10">
              <span className="font-display text-lg font-bold text-white">{t('addLocation')}</span>
              <p className="text-white/65 text-xs">{t('locationNameRequired')}</p>
            </div>
          </div>
        }
        footer={
          <Button
            type="button"
            onClick={handleAdd}
            className="w-full rounded-2xl h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border-0 font-bold text-base"
            disabled={createMutation.isPending || !locName.trim()}
          >
            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : t('save')}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('locationNameRequired')}</Label>
            <Input
              value={locName}
              onChange={e => setLocName(e.target.value)}
              placeholder={t('exampleLocation')}
              className="rounded-xl h-11"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('cityOptional')}</Label>
            <Input
              value={locCity}
              onChange={e => setLocCity(e.target.value)}
              placeholder={t('exampleCity')}
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('detailedAddressOptional')}</Label>
            <Input
              value={locAddress}
              onChange={e => setLocAddress(e.target.value)}
              placeholder={t('exampleAddress')}
              className="rounded-xl h-11"
            />
          </div>
        </div>
      </BottomSheet>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="rounded-3xl border-0 card-3d">
          <AlertDialogHeader>
             <AlertDialogTitle className="font-display">{t('confirmDelete')}</AlertDialogTitle>
             <AlertDialogDescription>{t('confirmDeleteLocation')}</AlertDialogDescription>
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
