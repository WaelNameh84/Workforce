import { useLanguage } from '@/i18n/LanguageProvider';
import { MessageSquare, Send, Bell, Mail, Phone, Video, Users } from 'lucide-react';

export default function Communication() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">{t('communication')}</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Connect with your team</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Messages',      value: '1,247', icon: MessageSquare, color: 'from-blue-500 to-cyan-500' },
          { label: 'Announcements', value: '23',    icon: Bell,          color: 'from-green-500 to-emerald-500' },
          { label: 'Emails Sent',   value: '456',   icon: Mail,          color: 'from-purple-500 to-pink-500' },
          { label: 'Active Chats',  value: '89',    icon: Users,         color: 'from-amber-500 to-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Channels */}
        <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-bold mb-4">Communication Channels</h3>
          <div className="space-y-3">
            {[
              { icon: MessageSquare, name: 'Internal Chat', status: 'Active',     users: 145 },
              { icon: Mail,          name: 'Email',         status: 'Active',     users: 248 },
              { icon: Phone,         name: 'SMS',           status: 'Active',     users: 89  },
              { icon: Send,          name: 'WhatsApp',      status: 'Active',     users: 67  },
              { icon: Video,         name: 'Video Calls',   status: 'Available',  users: 23  },
            ].map((channel, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <channel.icon className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{channel.name}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{channel.users} users</div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                  {channel.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Recent Announcements</h3>
            <button className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white font-medium">New</button>
          </div>
          <div className="space-y-4">
            {[
              { title: 'New Year Celebration',  date: 'Jan 15, 2026', preview: 'Join us for the annual celebration and team gathering…' },
              { title: 'Policy Update',          date: 'Jan 12, 2026', preview: 'Updated remote work policy effective from Feb 1…' },
              { title: 'Team Building Event',    date: 'Jan 10, 2026', preview: 'Annual team building event scheduled for March…' },
            ].map((ann, i) => (
              <div key={i} className="p-4 rounded-xl cursor-pointer hover:opacity-90 transition" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{ann.title}</span>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{ann.date}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{ann.preview}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
