import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useAppSettings } from '@/contexts/settings-context';
import {
  Bot, Sparkles, Send, TrendingUp, AlertCircle, Lightbulb,
  Activity, Zap, Mic, MicOff, StopCircle, Users, Clock, CreditCard, CalendarCheck,
} from 'lucide-react';

type Message = { role: 'user' | 'model'; text: string };

const QUICK = [
  { ar: 'ملخص الحضور اليوم', en: 'Summarize today\'s attendance' },
  { ar: 'من تأخر اليوم؟', en: 'Who was late today?' },
  { ar: 'الطلبات المعلقة', en: 'Pending requests' },
  { ar: 'توصيات لتحسين الإنتاجية', en: 'Productivity tips' },
  { ar: 'ملخص الرواتب', en: 'Payroll summary' },
  { ar: 'من في إجازة اليوم؟', en: 'Who is on leave today?' },
];

const FEATURE_CARDS = [
  { icon: TrendingUp,    color: '#10b981', bg: 'bg-emerald-500/15 border-emerald-400/30', ar: 'تحليل الأداء',     en: 'Performance Analysis',  descAr: 'اسألني عن أداء الفريق والحضور والإنتاجية', descEn: 'Ask me about team performance, attendance and productivity' },
  { icon: AlertCircle,   color: '#f59e0b', bg: 'bg-amber-500/15 border-amber-400/30',    ar: 'التنبيهات الذكية', en: 'Smart Alerts',           descAr: 'أكتشف التأخير والغياب والأنماط غير الطبيعية', descEn: 'Detect lateness, absences and unusual patterns' },
  { icon: Lightbulb,     color: '#6366f1', bg: 'bg-indigo-500/15 border-indigo-400/30',  ar: 'توصيات AI',        en: 'AI Recommendations',     descAr: 'احصل على توصيات ذكية لتحسين العمليات', descEn: 'Get smart recommendations to improve operations' },
  { icon: Activity,      color: '#a855f7', bg: 'bg-purple-500/15 border-purple-400/30',  ar: 'تحليل الرواتب',    en: 'Payroll Insights',       descAr: 'تحليل تكاليف الرواتب والمكافآت والخصومات', descEn: 'Analyze payroll costs, bonuses and deductions' },
  { icon: Users,         color: '#3b82f6', bg: 'bg-blue-500/15 border-blue-400/30',      ar: 'إدارة الفريق',     en: 'Team Management',       descAr: 'نظرة شاملة على فريقك ومستوى رضا الموظفين', descEn: 'Full overview of your team and employee satisfaction' },
  { icon: CalendarCheck, color: '#14b8a6', bg: 'bg-teal-500/15 border-teal-400/30',      ar: 'الإجازات والجداول', en: 'Leaves & Schedules',     descAr: 'تخطيط الإجازات وإدارة المناوبات بذكاء', descEn: 'Plan leaves and manage shifts intelligently' },
];

export default function AI() {
  const { locale } = useLanguage();
  const s = useAppSettings();
  const isAr = locale === 'ar';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // The user's Gemini key stored in settings
  const userGeminiKey = (s as any)?.apiKeys?.gemini as string | undefined;

  // check if key is configured (env var OR user-supplied key)
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ message: '__ping__', history: [], ...(userGeminiKey ? { apiKey: userGeminiKey } : {}) }),
    }).then(r => {
      setConfigured(r.status !== 503);
    }).catch(() => setConfigured(false));
  }, [userGeminiKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput('');

    const userMsg: Message = { role: 'user', text: msg };
    const history = messages.map(m => ({ role: m.role, text: m.text }));
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    const token = localStorage.getItem('token');
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // add placeholder AI message
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: msg, history }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال' }));
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'model', text: `⚠️ ${err.error || 'حدث خطأ'}` };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.done) break;
            if (json.error) {
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'model', text: `⚠️ ${json.error}` };
                return copy;
              });
              break;
            }
            if (json.content) {
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: 'model',
                  text: (copy[copy.length - 1]?.text ?? '') + json.content,
                };
                return copy;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'model', text: isAr ? '⚠️ تعذّر الاتصال بالمساعد' : '⚠️ Failed to connect to AI' };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  // ── Not configured banner ─────────────────────────────────────────────────
  if (configured === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fadeIn text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-xl">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground mb-2">{isAr ? 'المساعد الذكي غير مفعّل' : 'AI Assistant Not Configured'}</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {isAr
              ? 'أضف مفتاح GEMINI_API_KEY في إعدادات Replit Secrets لتفعيل المساعد الذكي.'
              : 'Add your GEMINI_API_KEY in Replit Secrets to activate the AI assistant.'}
          </p>
        </div>
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-500">
          {isAr ? 'المفتاح المطلوب: GEMINI_API_KEY' : 'Required secret: GEMINI_API_KEY'}
        </div>
      </div>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col gap-5 animate-fadeIn" style={{ minHeight: 'calc(100dvh - 8rem)' }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground">{s.assistantName || (isAr ? 'المساعد الذكي' : 'AI Assistant')}</h1>
          <p className="text-xs text-muted-foreground">{isAr ? 'مدعوم بـ Gemini · بيانات حية' : 'Powered by Gemini · Live data'}</p>
        </div>
        <div className="ms-auto flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {isAr ? 'متصل' : 'Live'}
        </div>
      </div>

      {/* Feature cards — shown only before first message */}
      {!hasMessages && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURE_CARDS.map((card, i) => (
            <button
              key={i}
              type="button"
              onClick={() => sendMessage(isAr ? card.ar : card.en)}
              className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-start transition hover:scale-[1.02] active:scale-[.98] ${card.bg}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${card.color}22` }}>
                <card.icon className="h-4 w-4" style={{ color: card.color }} />
              </span>
              <span className="text-xs font-black text-foreground leading-tight">{isAr ? card.ar : card.en}</span>
              <span className="text-[10px] text-muted-foreground leading-snug">{isAr ? card.descAr : card.descEn}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chat area */}
      {hasMessages && (
        <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/10 p-4 space-y-4" style={{ maxHeight: '55vh' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : 'bg-card border border-border text-foreground'
                }`}
              >
                {msg.text}
                {msg.role === 'model' && streaming && i === messages.length - 1 && msg.text === '' && (
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black text-indigo-300">
                  أ
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Quick questions — shown after first message */}
      {hasMessages && (
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q, i) => (
            <button
              key={i}
              type="button"
              disabled={streaming}
              onClick={() => sendMessage(isAr ? q.ar : q.en)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-foreground transition hover:border-indigo-400/50 hover:bg-indigo-500/10 disabled:opacity-40"
            >
              {isAr ? q.ar : q.en}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="sticky bottom-0 pt-2">
        <div className="flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={isAr ? 'اسأل عن أي شيء في شركتك…' : 'Ask anything about your company…'}
            disabled={streaming}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
            dir={isAr ? 'rtl' : 'ltr'}
          />
          {streaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 border border-red-400/30 text-red-400 transition hover:bg-red-500/25"
            >
              <StopCircle className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Quick prompts — shown before first message */}
        {!hasMessages && (
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK.slice(0, 4).map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(isAr ? q.ar : q.en)}
                className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] font-bold text-foreground transition hover:border-indigo-400/50 hover:bg-indigo-500/10"
              >
                {isAr ? q.ar : q.en}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
