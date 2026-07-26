import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { MessageSquare, Send, Bell, Mail, Phone, Video, Users, Plus } from 'lucide-react';
import DetailDialog from '@/components/detail-dialog';
import { useToast } from '@/components/ui/use-toast';

type Announcement = { title: string; date: string; preview: string };

export default function Communication() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { title: 'New Year Celebration', date: 'Jan 15, 2026', preview: 'Join us for the annual celebration and team gathering…' },
    { title: 'Policy Update', date: 'Jan 12, 2026', preview: 'Updated remote work policy effective from Feb 1…' },
    { title: 'Team Building Event', date: 'Jan 10, 2026', preview: 'Annual team building event scheduled for March…' },
  ]);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [showForm, setShowForm] = useState(false);

  const channels = [
    { icon: MessageSquare, name: t('internalChat'), status: t('active'), users: 145 },
    { icon: Mail, name: t('email'), status: t('active'), users: 248 },
    { icon: Phone, name: t('sms'), status: t('active'), users: 89 },
    { icon: Send, name: 'WhatsApp', status: t('active'), users: 67 },
    { icon: Video, name: t('videoCalls'), status: t('available'), users: 23 },
  ];

  const createAnnouncement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setAnnouncements((current) => [{ title: String(form.get('title') || ''), date: new Date().toLocaleDateString(), preview: String(form.get('preview') || '') }, ...current]);
    setShowForm(false);
    toast({ title: t('savedSuccessfully') });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-2xl font-bold">{t('communication')}</h1><p className="text-sm" style={{ color: 'var(--muted)' }}>{t('connectWithTeamDesc')}</p></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{[
        { label: t('messages'), value: '1,247', icon: MessageSquare, color: 'from-blue-500 to-cyan-500' },
        { label: t('announcements'), value: announcements.length, icon: Bell, color: 'from-green-500 to-emerald-500' },
        { label: t('emailsSent'), value: '456', icon: Mail, color: 'from-purple-500 to-pink-500' },
        { label: t('activeChats'), value: '89', icon: Users, color: 'from-amber-500 to-orange-500' },
      ].map((stat) => <button key={stat.label} onClick={() => stat.label === t('announcements') && setSelected(announcements[0])} className="text-left p-5 rounded-2xl transition hover:-translate-y-0.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}><stat.icon className="w-5 h-5 text-white" /></div><div className="text-2xl font-bold">{stat.value}</div><div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div></button>)}</div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><h3 className="text-lg font-bold mb-4">{t('communicationChannels')}</h3><div className="space-y-3">{channels.map((channel) => <button key={channel.name} onClick={() => toast({ title: channel.name, description: `${channel.users} ${t('users')}` })} className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:opacity-80" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center"><channel.icon className="w-5 h-5 text-indigo-500" /></div><div><div className="font-medium text-sm">{channel.name}</div><div className="text-xs" style={{ color: 'var(--muted)' }}>{channel.users} {t('users')}</div></div></div><span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">{channel.status}</span></button>)}</div></div>
        <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{t('recentAnnouncements')}</h3><button onClick={() => setShowForm(true)} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white font-medium flex items-center gap-1"><Plus className="w-3 h-3" />{t('newAnnouncement')}</button></div><div className="space-y-4">{announcements.map((ann) => <button key={`${ann.title}-${ann.date}`} onClick={() => setSelected(ann)} className="w-full text-left p-4 rounded-xl hover:opacity-90 transition" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}><div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{ann.title}</span><span className="text-xs" style={{ color: 'var(--muted)' }}>{ann.date}</span></div><p className="text-xs" style={{ color: 'var(--muted)' }}>{ann.preview}</p></button>)}</div></div>
      </div>
      {showForm && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}><div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'var(--card)' }} onClick={(event) => event.stopPropagation()}><h2 className="text-xl font-bold mb-5">{t('newAnnouncement')}</h2><form onSubmit={createAnnouncement} className="space-y-4"><input required name="title" placeholder={t('title')} className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)' }} /><textarea required name="preview" placeholder={t('description')} rows={4} className="w-full rounded-xl px-4 py-2.5 text-sm resize-none" style={{ background: 'var(--background)', border: '1px solid var(--border)' }} /><div className="flex gap-3"><button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl py-2" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>{t('cancel')}</button><button type="submit" className="flex-1 rounded-xl py-2 bg-indigo-500 text-white">{t('save')}</button></div></form></div></div>}
      <DetailDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={selected?.title || t('announcements')} items={selected ? [{ label: t('date'), value: selected.date }, { label: t('description'), value: selected.preview }] : []} />
    </div>
  );
}