import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useGetEmployees, getGetEmployeesQueryKey,
} from '@workspace/api-client-react';
import {
  Send, Video, VideoOff, Mic, MicOff, PhoneOff,
  ArrowRight, ArrowLeft, ChevronDown, Users, Check, CheckCheck,
  Search,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';

/* ── Types ── */
type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  read: boolean;
};

type Contact = {
  id: string;          // 'all' | employee id as string
  name: string;
  avatar: string;      // initials
  color: string;
  isGroup: boolean;
  lastMsg?: string;
  lastTime?: string;
  unread?: number;
};

/* ── Helpers ── */
const COLORS = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-sky-600',
  'from-violet-500 to-pink-600',
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function nowTime(locale: 'en' | 'ar' | 'sv') {
  return new Date().toLocaleTimeString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

/* ── Video Call Overlay ── */
function VideoCallOverlay({ contact, onEnd, t }: { contact: Contact; onEnd: () => void; t: (key: any) => string }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-between py-12 px-6">
      {/* Remote video mock */}
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${contact.color} flex items-center justify-center text-white text-3xl font-bold shadow-2xl`}>
            {contact.avatar}
          </div>
          <div className="text-white text-xl font-bold">{contact.name}</div>
          <div className="text-slate-400 text-sm font-mono">{fmt(elapsed)}</div>
          <div className="flex gap-1 mt-1">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-1 rounded-full bg-indigo-400 animate-bounce" style={{ height: `${8 + Math.sin(i * 1.5) * 6}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Local cam (corner) */}
      <div className="absolute top-4 right-4 w-24 h-32 rounded-2xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center">
        {camOn
           ? <div className="text-2xl font-bold text-white/40">{t('you')}</div>
          : <VideoOff className="h-6 w-6 text-slate-500" />}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setMicOn(v => !v)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition ${micOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {micOn ? <Mic className="h-6 w-6 text-white" /> : <MicOff className="h-6 w-6 text-white" />}
        </button>
        <button
          onClick={onEnd}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/40 transition"
        >
          <PhoneOff className="h-7 w-7 text-white" />
        </button>
        <button
          onClick={() => setCamOn(v => !v)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition ${camOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {camOn ? <Video className="h-6 w-6 text-white" /> : <VideoOff className="h-6 w-6 text-white" />}
        </button>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Communication() {
  const { user } = useAuth();
  const { dir, locale, t } = useLanguage();
  const cid = user?.companyId || 0;

  const { data: empData } = useGetEmployees(
    { companyId: cid },
    { query: { enabled: !!cid, queryKey: getGetEmployeesQueryKey({ companyId: cid }) } }
  );

  /* build contacts list */
  const employees = empData?.employees || [];
  const contacts: Contact[] = [
    {
      id: 'all',
       name: t('allPeople'),
       avatar: t('allPeople').slice(0, 2),
      color: 'from-indigo-500 to-purple-600',
      isGroup: true,
       lastMsg: t('allWelcomeMessage'),
      lastTime: '09:00',
      unread: 0,
    },
    ...employees.map((emp, i) => ({
      id: String(emp.id),
       name: emp.fullName || t('employee'),
       avatar: initials(emp.fullName || t('employee')),
      color: COLORS[i % COLORS.length],
      isGroup: false,
       lastMsg: t('hello'),
      lastTime: '—',
      unread: 0,
    })),
  ];

  /* state */
  const [selected, setSelected] = useState<Contact | null>(null);
  const [msgMap, setMsgMap] = useState<Record<string, Message[]>>({
    all: [
       { id: '1', text: t('allWelcomeMessage'), sender: 'them', time: '09:00', read: true },
       { id: '2', text: `${t('weeklyShiftDesc')} — 10:00`, sender: 'them', time: '09:05', read: true },
    ],
  });
  const [input, setInput] = useState('');
  const [videoCall, setVideoCall] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected, msgMap]);

  const sendMsg = () => {
    if (!input.trim() || !selected) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'me',
       time: nowTime(locale),
      read: false,
    };
    setMsgMap(prev => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), msg] }));
    setInput('');

    /* simulate reply after 1.5s */
    setTimeout(() => {
      const replies = [
         t('receivedThanks'),
         t('willCheck'),
         t('agreed'),
         t('replySoon'),
         t('willDoIt'),
      ];
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: 'them',
         time: nowTime(locale),
        read: true,
      };
      setMsgMap(prev => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), reply] }));
    }, 1500);
  };

  const filteredContacts = contacts.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );
  const messages = selected ? (msgMap[selected.id] || []) : [];

  const BackIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  /* ══ CHAT VIEW ══ */
  if (selected) {
    return (
      <div className="flex flex-col h-full -mx-4 -my-4 sm:-mx-6 lg:-mx-8" style={{ height: 'calc(100vh - 80px)' }}>
         {videoCall && <VideoCallOverlay contact={selected} onEnd={() => setVideoCall(false)} t={t} />}

        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0" style={{ background: 'var(--background)' }}>
          <button
            onClick={() => setSelected(null)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition"
          >
            <BackIcon className="h-5 w-5" />
          </button>
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selected.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
            {selected.isGroup ? <Users className="h-4 w-4" /> : selected.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{selected.name}</div>
             <div className="text-[10px] text-muted-foreground">{selected.isGroup ? t('employeesCount').replace('{count}', String(employees.length)) : t('lastSeenRecently')}</div>
          </div>
          {/* Video call button */}
          <button
            onClick={() => setVideoCall(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition"
             aria-label={t('videoCall')}
          >
            <Video className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: 'var(--background)' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${selected.color} flex items-center justify-center text-white text-2xl font-bold`}>
                {selected.isGroup ? <Users className="h-7 w-7" /> : selected.avatar}
              </div>
               <p className="text-sm">{t('startConversationWith').replace('{name}', selected.name)}</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'me'
                    ? 'bg-indigo-500 text-white rounded-tl-sm'
                    : 'text-foreground rounded-tr-sm'
                }`}
                style={msg.sender !== 'me' ? { background: 'var(--card)', border: '1px solid var(--border)' } : {}}
              >
                <p>{msg.text}</p>
                <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
                  <span className={`text-[10px] ${msg.sender === 'me' ? 'text-indigo-200' : 'text-muted-foreground'}`}>{msg.time}</span>
                  {msg.sender === 'me' && (
                    msg.read
                      ? <CheckCheck className="h-3 w-3 text-indigo-200" />
                      : <Check className="h-3 w-3 text-indigo-200" />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border shrink-0 flex items-center gap-3" style={{ background: 'var(--background)' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
           placeholder={t('writeMessageTo').replace('{name}', selected.name)}
            className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          />
          <button
            onClick={sendMsg}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 flex items-center justify-center transition shrink-0"
          >
            <Send className="h-4 w-4 text-white" style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }} />
          </button>
        </div>
      </div>
    );
  }

  /* ══ CONTACTS LIST VIEW ══ */
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header with dropdown selector */}
      <div className="flex items-center justify-between gap-3">
        <div>
           <h1 className="font-display text-3xl font-bold tracking-tight">{t('communicationTitle')}</h1>
           <p className="text-sm text-muted-foreground mt-1">{t('connectEmployeesDirectly')}</p>
        </div>
        {/* Dropdown selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border text-sm font-bold transition hover:bg-white/5"
            style={{ background: 'var(--card)' }}
          >
            <Users className="h-4 w-4 text-indigo-400" />
             <span>{t('chooseRecipient')}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div
                className="absolute left-0 top-full mt-2 w-56 z-20 rounded-2xl border border-border shadow-2xl overflow-hidden"
                style={{ background: 'var(--card)' }}
              >
                <div className="p-2 max-h-64 overflow-y-auto">
                  {contacts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelected(c); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-white/10 transition text-right"
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {c.isGroup ? <Users className="h-3.5 w-3.5" /> : c.avatar}
                      </div>
                      <span className="font-medium truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
           placeholder={t('searchEmployee')}
          className="w-full rounded-2xl px-4 py-3 pr-10 text-sm outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        />
      </div>

      {/* Contacts */}
      <div className="space-y-2">
        {filteredContacts.map(contact => {
          const msgs = msgMap[contact.id] || [];
          const last = msgs[msgs.length - 1];
          return (
            <button
              key={contact.id}
              onClick={() => setSelected(contact)}
              className="living-card w-full flex items-center gap-4 p-4 text-right active:scale-[0.99]"
              style={{ '--card-accent': contact.id === 'all' ? '#6366f1' : contact.color.includes('emerald') ? '#10b981' : contact.color.includes('amber') ? '#f59e0b' : contact.color.includes('rose') ? '#f43f5e' : '#06b6d4' } as React.CSSProperties}
            >
              <span className="living-card-orb living-card-orb--small -left-2 -bottom-2" />
              {/* Avatar */}
              <div className={`living-icon w-12 h-12 rounded-full bg-gradient-to-br ${contact.color} flex items-center justify-center text-white font-bold text-sm shrink-0 relative shadow-lg`}>
                {contact.isGroup ? <Users className="h-5 w-5" /> : contact.avatar}
                {/* Online dot */}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground shrink-0">{last?.time || contact.lastTime || ''}</span>
                  <span className="font-bold text-sm truncate">{contact.name}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  {(contact.unread ?? 0) > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {contact.unread}
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground truncate text-right flex-1">
                     {last?.text || contact.lastMsg || t('startConversation')}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {filteredContacts.length === 0 && (
           <div className="text-center py-12 text-muted-foreground text-sm">{t('noSearchResultsShort')}</div>
        )}
      </div>
    </div>
  );
}
