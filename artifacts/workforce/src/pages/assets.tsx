import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  useCreateAsset,
  useDeleteAsset,
  useGetAssets,
  useGetEmployees,
  useUpdateAsset,
  getGetAssetsQueryKey,
  getGetEmployeesQueryKey,
  Asset,
  AssetInputStatus,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DetailDialog from '@/components/detail-dialog';
import { Plus, Laptop, Smartphone, Monitor, Trash2, Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';

const statuses: AssetInputStatus[] = ['available', 'assigned', 'maintenance', 'retired'];

export default function Purchases() {
  const { user } = useAuth();
  const { t, translateText, formatDate } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const params = { companyId: user?.companyId || 0 };
  const { data: assetsData, isLoading } = useGetAssets(params, { query: { enabled: !!user?.companyId, queryKey: getGetAssetsQueryKey(params) } });
  const { data: employeesData } = useGetEmployees({ companyId: user?.companyId || 0 }, { query: { enabled: !!user?.companyId, queryKey: getGetEmployeesQueryKey({ companyId: user?.companyId || 0 }) } });
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();
  const assets = assetsData?.assets || [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });

  const getAssetIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'phone': return <Smartphone className="h-5 w-5" />;
      case 'monitor': return <Monitor className="h-5 w-5" />;
      default: return <Laptop className="h-5 w-5" />;
    }
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get('name') || ''),
      type: String(form.get('type') || 'laptop'),
      serialNumber: String(form.get('serialNumber') || ''),
      status: String(form.get('status') || 'available') as AssetInputStatus,
      purchaseDate: String(form.get('purchaseDate') || ''),
      assignedTo: form.get('assignedTo') ? Number(form.get('assignedTo')) : undefined,
    };
    try {
      if (editing?.id) await updateMutation.mutateAsync({ id: editing.id, data: values });
      else await createMutation.mutateAsync({ data: { companyId: user?.companyId || 0, ...values } });
      toast({ title: t('savedSuccessfully') });
      setShowForm(false);
      setEditing(null);
      refresh();
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: 'Could not save this purchase.' });
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: t('delete') });
      setDeleteId(null);
      refresh();
    } catch {
      toast({ variant: 'destructive', title: t('actions'), description: 'Could not delete this purchase.' });
    }
  };

  const summaryCards = [
    { label: t('totalPurchases'), value: assets.length, primary: true },
    { label: t('assigned'), value: assets.filter((asset) => asset.status === 'assigned').length },
    { label: t('available'), value: assets.filter((asset) => asset.status === 'available').length },
    { label: t('maintenance'), value: assets.filter((asset) => asset.status === 'maintenance').length, amber: true },
  ];

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div><h1 className="text-2xl font-bold tracking-tight">{t('purchases')}</h1><p className="text-sm text-muted-foreground">{translateText('Manage purchased items, ownership, and procurement dates.')}</p></div>
        <Button className="gap-2" onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" /> {t('addPurchase')}</Button>
      </div>
      <div className="grid sm:grid-cols-4 gap-4">
        {summaryCards.map((card) => <button key={card.label} onClick={() => setSelected(assets.find((asset) => asset.status === card.label.toLowerCase()) || null)} className={`text-left transition hover:-translate-y-0.5 ${card.primary ? 'bg-primary text-primary-foreground' : ''}`}><Card className={card.primary ? 'bg-primary text-primary-foreground border-none' : 'border-border/50'}><CardContent className="p-4 flex flex-col justify-center"><div className={`text-sm mb-1 ${card.primary ? 'opacity-80' : 'text-muted-foreground'}`}>{card.label}</div><div className={`text-3xl font-bold ${card.amber ? 'text-amber-500' : ''}`}>{card.value}</div></CardContent></Card></button>)}
      </div>
       <div className="space-y-3">{isLoading ? <div className="surface h-24 rounded-2xl animate-pulse" /> : !assets.length ? <div className="surface rounded-2xl py-10 text-center text-muted-foreground">{t('noPurchasesFound')}</div> : assets.map((asset, index) => <div key={asset.id} data-testid={`card-asset-${asset.id}`} onClick={() => setSelected(asset)} className={`surface rounded-2xl p-4 pressable animate-fadeIn stagger-${(index % 4) + 1}`}><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">{getAssetIcon(asset.type || '')}</div><div className="min-w-0 flex-1"><div className="font-semibold truncate">{asset.name}</div><div className="text-xs text-muted-foreground capitalize">{translateText(asset.type || 'other')} · {asset.assignedToName || t('unassigned')}</div></div><Badge variant={asset.status === 'assigned' ? 'default' : asset.status === 'available' ? 'success' : asset.status === 'maintenance' ? 'warning' : 'secondary'} className="capitalize">{translateText(asset.status || 'available')}</Badge></div><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span className="font-mono">{asset.serialNumber || '—'}</span><span>{asset.purchaseDate ? formatDate(asset.purchaseDate, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span></div><div className="mt-3 flex justify-end gap-1" onClick={(event) => event.stopPropagation()}><Button data-testid={`button-view-asset-${asset.id}`} aria-label={t('viewProfile')} size="icon" variant="ghost" onClick={() => setSelected(asset)}><Eye className="h-4 w-4" /></Button><Button data-testid={`button-edit-asset-${asset.id}`} aria-label={t('edit')} size="icon" variant="ghost" onClick={() => { setEditing(asset); setShowForm(true); }}><Edit className="h-4 w-4" /></Button><Button data-testid={`button-delete-asset-${asset.id}`} aria-label={t('delete')} size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(asset.id || null)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>
       {showForm && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}><div className="rounded-2xl p-6 w-full max-w-lg shadow-2xl" style={{ background: 'var(--card)' }} onClick={(event) => event.stopPropagation()}><h2 className="text-xl font-bold mb-6">{editing ? t('edit') : t('addAsset')}</h2><form onSubmit={save} className="space-y-4"><div className="grid sm:grid-cols-2 gap-4"><label className="block text-sm font-medium">{t('title')}<input required name="name" defaultValue={editing?.name || ''} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} /></label><label className="block text-sm font-medium">{translateText('Type')}<select name="type" defaultValue={editing?.type || 'laptop'} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}><option value="laptop">{translateText('Laptop')}</option><option value="phone">{translateText('Phone')}</option><option value="monitor">{translateText('Monitor')}</option><option value="other">{translateText('Other')}</option></select></label><label className="block text-sm font-medium">{t('serialNumber')}<input name="serialNumber" defaultValue={editing?.serialNumber || ''} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} /></label><label className="block text-sm font-medium">{t('purchaseDate')}<input type="date" name="purchaseDate" defaultValue={editing?.purchaseDate || ''} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }} /></label><label className="block text-sm font-medium">{t('status')}<select name="status" defaultValue={editing?.status || 'available'} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>{statuses.map((status) => <option key={status} value={status}>{translateText(status)}</option>)}</select></label><label className="block text-sm font-medium">{t('assignedTo')}<select name="assignedTo" defaultValue={editing?.assignedTo ? String(editing.assignedTo) : ''} className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}><option value="">—</option>{employeesData?.employees?.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select></label></div><div className="flex gap-3 pt-2"><Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>{t('cancel')}</Button><Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>{t('save')}</Button></div></form></div></div>}
       <DetailDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={selected?.name || t('purchases')} items={selected ? [{ label: t('serialNumber'), value: selected.serialNumber }, { label: translateText('Type'), value: translateText(selected.type || 'other') }, { label: t('assignedTo'), value: selected.assignedToName || t('unassigned') }, { label: t('status'), value: translateText(selected.status || 'available') }, { label: t('purchaseDate'), value: selected.purchaseDate ? formatDate(selected.purchaseDate) : '—' }] : []} />
      {deleteId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: 'var(--card)' }}><h2 className="text-lg font-bold">{t('confirmDelete')}</h2><p className="text-sm text-muted-foreground mt-2">{t('confirmDeleteDesc')}</p><div className="flex gap-3 mt-6"><Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>{t('cancel')}</Button><Button variant="destructive" className="flex-1" onClick={remove} disabled={deleteMutation.isPending}>{t('delete')}</Button></div></div></div>}
    </div>
  );
}