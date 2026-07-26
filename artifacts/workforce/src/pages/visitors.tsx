import { useMemo, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import DetailDialog from '@/components/detail-dialog';
import { Search, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Visitor = { id: number; name: string; company: string; host: string; in: string | null; out: string | null; status: 'active' | 'departed' | 'expected' };

const initialVisitors: Visitor[] = [
  { id: 1, name: 'Alice Smith', company: 'TechCorp', host: 'John Doe', in: '09:15 AM', out: null, status: 'active' },
  { id: 2, name: 'Bob Jones', company: 'Vendor Inc', host: 'Jane Smith', in: '10:30 AM', out: '11:45 AM', status: 'departed' },
  { id: 3, name: 'Charlie Brown', company: 'Delivery', host: 'Reception', in: null, out: null, status: 'expected' },
];

export default function Visitors() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [visitors, setVisitors] = useState(initialVisitors);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Visitor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const filtered = useMemo(() => visitors.filter((visitor) => `${visitor.name} ${visitor.company} ${visitor.host}`.toLowerCase().includes(search.toLowerCase())), [visitors, search]);

  const updateStatus = (id: number, status: Visitor['status']) => {
    setVisitors((current) => current.map((visitor) => visitor.id === id ? { ...visitor, status, in: status === 'active' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : visitor.in, out: status === 'departed' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : visitor.out } : visitor));
    toast({ title: status === 'active' ? t('signIn') : t('signOut') });
  };

  const createVisitor = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setVisitors((current) => [...current, { id: Date.now(), name: String(form.get('name')), company: String(form.get('company')), host: String(form.get('host')), in: null, out: null, status: 'expected' }]);
    setShowForm(false);
    toast({ title: t('savedSuccessfully') });
  };

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h1 className="text-2xl font-bold tracking-tight">{t('visitors')}</h1><p className="text-sm text-muted-foreground">Manage visitor arrivals and departures.</p></div><Button className="gap-2" onClick={() => setShowForm(true)}><UserPlus className="h-4 w-4" /> {t('newVisitor')}</Button></div>
    <div className="grid sm:grid-cols-3 gap-4">{[
      { label: t('activeInside'), value: visitors.filter((visitor) => visitor.status === 'active').length, icon: LogIn, color: 'text-primary' },
      { label: t('departedToday'), value: visitors.filter((visitor) => visitor.status === 'departed').length, icon: LogOut, color: 'text-emerald-500' },
      { label: t('expected'), value: visitors.filter((visitor) => visitor.status === 'expected').length, icon: UserPlus, color: 'text-purple-500' },
    ].map((stat) => <button key={stat.label} onClick={() => setSearch(stat.label === t('activeInside') ? 'alice' : '')} className="text-left"><Card className="border-border/50 hover:shadow-md transition"><CardContent className="p-6"><div className="flex items-center gap-4"><div className={`p-3 rounded-full bg-primary/10 ${stat.color}`}><stat.icon className="h-6 w-6" /></div><div><p className="text-sm font-medium text-muted-foreground">{stat.label}</p><h3 className="text-3xl font-bold">{stat.value}</h3></div></div></CardContent></Card></button>)}</div>
    <Card className="border-none shadow-sm"><CardContent className="p-0"><div className="p-4 border-b"><div className="relative max-w-sm w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`${t('search')} ${t('visitors').toLowerCase()}...`} className="pl-9 bg-background" /></div></div><Table><TableHeader><TableRow className="bg-muted/50"><TableHead>{t('visitorName')}</TableHead><TableHead>{t('company')}</TableHead><TableHead>{t('hostEmployee')}</TableHead><TableHead>{t('timeIn')}</TableHead><TableHead>{t('timeOut')}</TableHead><TableHead>{t('status')}</TableHead><TableHead className="text-right">{t('actions')}</TableHead></TableRow></TableHeader><TableBody>{filtered.map((visitor) => <TableRow key={visitor.id} onClick={() => setSelected(visitor)} className="cursor-pointer hover:bg-muted/30"><TableCell className="font-medium">{visitor.name}</TableCell><TableCell>{visitor.company}</TableCell><TableCell>{visitor.host}</TableCell><TableCell>{visitor.in || '—'}</TableCell><TableCell>{visitor.out || '—'}</TableCell><TableCell><Badge variant={visitor.status === 'active' ? 'success' : visitor.status === 'expected' ? 'warning' : 'secondary'} className="capitalize">{visitor.status === 'active' ? t('active') : visitor.status === 'expected' ? t('expected') : t('inactive')}</Badge></TableCell><TableCell className="text-right" onClick={(event) => event.stopPropagation()}>{visitor.status === 'active' && <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus(visitor.id, 'departed')}>{t('signOut')}</Button>}{visitor.status === 'expected' && <Button size="sm" onClick={() => updateStatus(visitor.id, 'active')}>{t('signIn')}</Button>}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    {showForm && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}><div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'var(--card)' }} onClick={(event) => event.stopPropagation()}><h2 className="text-xl font-bold mb-5">{t('newVisitor')}</h2><form onSubmit={createVisitor} className="space-y-4">{['name', 'company', 'host'].map((field) => <Input key={field} required name={field} placeholder={field[0].toUpperCase() + field.slice(1)} />)}<div className="flex gap-3"><Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>{t('cancel')}</Button><Button type="submit" className="flex-1">{t('save')}</Button></div></form></div></div>}
    <DetailDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={selected?.name || t('visitors')} items={selected ? [{ label: t('company'), value: selected.company }, { label: t('hostEmployee'), value: selected.host }, { label: t('timeIn'), value: selected.in }, { label: t('timeOut'), value: selected.out }, { label: t('status'), value: selected.status }] : []} />
  </div>;
}