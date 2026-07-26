import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useAppSettings } from '@/contexts/settings-context';
import { Bot, Sparkles, Send, TrendingUp, AlertCircle, Lightbulb, Activity, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const insights = [
  { icon: TrendingUp,   title: 'Productivity +12%',      desc: 'Team productivity increased this month. Key contributors: Engineering & Marketing', color: 'bg-green-500' },
  { icon: AlertCircle,  title: 'High Absenteeism',        desc: 'Sales dept. has 18% absence rate — 3× company avg. Recommend investigation.',      color: 'bg-red-500' },
  { icon: Lightbulb,    title: 'Cost Optimization',       desc: 'Potential $12,400 savings identified in overtime allocation',                        color: 'bg-blue-500' },
  { icon: Activity,     title: 'Predicted Turnover',      desc: 'AI identifies 5 employees at high risk of leaving. Recommend retention actions.',    color: 'bg-amber-500' },
  { icon: Zap,          title: 'Fraud Detection',         desc: 'No suspicious clock-in patterns detected this month',                                 color: 'bg-purple-500' },
  { icon: Sparkles,     title: 'Auto Report Ready',       desc: 'Monthly performance report generated — 47 pages',                                   color: 'bg-indigo-500' },
];

const predictions = [
  { month: 'Feb', predicted: 225 },
  { month: 'Mar', predicted: 230 },
  { month: 'Apr', predicted: 235 },
  { month: 'May', predicted: 240 },
];

const quickQuestions = ['Analyze attendance', 'Predict turnover', 'Generate report', 'Detect anomalies'];

export default function AI() {
  const { t } = useLanguage();
  const s = useAppSettings();
  const [messages, setMessages] = useState(() => [
    { role: 'ai', content: s.assistantMsg || "مرحباً! كيف يمكنني مساعدتك؟" },
    { role: 'user', content: 'أعطني ملخص الحضور هذا الشهر' },
    { role: 'ai', content: 'بناءً على تحليل بيانات 248 موظفاً، تحسّن الحضور بنسبة 12% مقارنة بالشهر الماضي. متوسط وقت تسجيل الدخول: 9:03 صباحاً. قسم الهندسة سجّل أعلى نسبة حضور 94%.' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { role: 'user', content: input },
      { role: 'ai', content: `Analyzing your request… Based on current data, I can provide detailed insights about "${input}". Would you like me to generate a report?` },
    ]);
    setInput('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{s.assistantName || t('aiAssistant')}</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {s.assistantLang === 'ar' ? 'مساعد ذكي لإدارة القوى العاملة' : 'AI-powered workforce intelligence'}
          </p>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((ins, i) => (
          <div key={i} className="p-6 rounded-2xl cursor-pointer transition hover:shadow-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className={`w-10 h-10 rounded-xl ${ins.color} flex items-center justify-center mb-3`}>
              <ins.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold mb-2">{ins.title}</h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{ins.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chat */}
        <div className="p-6 rounded-2xl flex flex-col" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold">AI Chat</h3>
          </div>

          <div className="flex-1 space-y-4 h-80 overflow-y-auto mb-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : ''}`}
                  style={msg.role === 'ai' ? { background: 'var(--background)', border: '1px solid var(--border)' } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask AI anything…"
              className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            <button onClick={handleSend} className="px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition">
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="px-3 py-1 rounded-full text-xs font-medium hover:bg-indigo-500 hover:text-white transition"
                style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Predictions Chart */}
        <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold mb-1">AI Predictions</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Forecasted attendance for next 4 months</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={predictions}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6, fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-500 mb-1">
              <Sparkles className="w-4 h-4" />
              AI Insight
            </div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              Based on historical data, we predict an 8% increase in attendance next quarter with 92% confidence.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
