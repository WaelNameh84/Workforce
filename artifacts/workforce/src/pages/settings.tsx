import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import {
  Building2, Clock, Bell, Globe, Shield, Key, Database,
  Moon, Sun, User, Save, Check, RefreshCw
} from 'lucide-react';

const inputStyle: React.CSSProperties = {
  background: 'var(--background)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SectionCard({ icon: Icon, iconColor, title, children }: {
  icon: React.ElementType; iconColor: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-5">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h3 className="text-base font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { t, locale, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true, push: true, sms: false, slack: false,
  });

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const languages = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'ar', flag: '🇸🇦', name: 'العربية' },
    { code: 'sv', flag: '🇸🇪', name: 'Svenska' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('settings')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Customize your workspace</p>
        </div>
        <button
          onClick={save}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
          style={
            saved
              ? { background: 'rgb(34 197 94)', color: '#fff' }
              : { background: 'linear-gradient(to right, #6366f1, #a855f7)', color: '#fff' }
          }
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? t('savedSuccessfully') : t('save')}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile */}
          <SectionCard icon={User} iconColor="text-indigo-500" title="My Profile">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="font-semibold text-lg">{user?.fullName}</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>{user?.email}</div>
                <div className="text-xs mt-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 inline-block capitalize">
                  {user?.role}
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name">
                <input defaultValue={user?.fullName || ''} className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
              <Field label="Email">
                <input defaultValue={user?.email || ''} className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
              <Field label="Phone">
                <input defaultValue="+1 (555) 000-0000" className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
              <Field label="Position">
                <input defaultValue={user?.role || ''} readOnly className="w-full rounded-lg px-4 py-2.5 text-sm opacity-60" style={inputStyle} />
              </Field>
            </div>
          </SectionCard>

          {/* Company Info */}
          <SectionCard icon={Building2} iconColor="text-blue-500" title={t('companyInfo')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company Name">
                <input defaultValue="Global Tech Solutions" className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
              <Field label="Industry">
                <input defaultValue="Technology" className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
              <Field label="Registration No.">
                <input defaultValue="RC-123456789" className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
              <Field label="Contact Email">
                <input defaultValue="hr@globaltech.com" className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
              <Field label="Country">
                <select className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle}>
                  <option>🇸🇪 Sweden</option>
                  <option>🇸🇦 Saudi Arabia</option>
                  <option>🇺🇸 United States</option>
                  <option>🇦🇪 UAE</option>
                  <option>🇬🇧 United Kingdom</option>
                </select>
              </Field>
              <Field label="Currency">
                <select className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle}>
                  <option>SEK - Swedish Krona</option>
                  <option>USD - US Dollar</option>
                  <option>SAR - Saudi Riyal</option>
                  <option>EUR - Euro</option>
                  <option>GBP - British Pound</option>
                </select>
              </Field>
              <Field label="Address">
                <input defaultValue="123 Tech Boulevard, Innovation District" className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
              <Field label="Timezone">
                <select className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle}>
                  <option>UTC — Coordinated Universal Time</option>
                  <option>EST — Eastern Standard Time</option>
                  <option>AST — Arabia Standard Time</option>
                  <option>CET — Central European Time</option>
                </select>
              </Field>
            </div>
          </SectionCard>

          {/* Working Hours */}
          <SectionCard icon={Clock} iconColor="text-green-500" title={t('workingHours')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Start Time">
                <input type="time" defaultValue="09:00" className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
              <Field label="End Time">
                <input type="time" defaultValue="17:00" className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
              <Field label="Work Days">
                <select className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle}>
                  <option>Mon – Fri</option>
                  <option>Sun – Thu</option>
                  <option>Mon – Sat</option>
                </select>
              </Field>
              <Field label="Break Duration (minutes)">
                <input type="number" defaultValue="60" className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" style={inputStyle} />
              </Field>
            </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard icon={Bell} iconColor="text-amber-500" title={t('notifications')}>
            <div className="space-y-3">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Get notified via email' },
                { key: 'push',  label: 'Push Notifications',  desc: 'Browser push alerts' },
                { key: 'sms',   label: 'SMS Notifications',   desc: 'Text message alerts' },
                { key: 'slack', label: 'Slack Notifications', desc: 'Send to Slack channel' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                    className={`relative w-12 h-6 rounded-full transition-all ${notifications[item.key as keyof typeof notifications] ? 'bg-indigo-500' : 'bg-gray-400'}`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications[item.key as keyof typeof notifications] ? (locale === 'ar' ? 'right-1' : 'left-7') : (locale === 'ar' ? 'right-7' : 'left-1')}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          {/* Language */}
          <SectionCard icon={Globe} iconColor="text-cyan-500" title={t('language')}>
            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLocale(lang.code as any)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
                  style={
                    locale === lang.code
                      ? { background: 'linear-gradient(to right, #6366f1, #a855f7)', color: '#fff' }
                      : { background: 'var(--background)', border: '1px solid var(--border)' }
                  }
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {locale === lang.code && <Check className="w-4 h-4 ms-auto" />}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Appearance */}
          <SectionCard icon={theme === 'dark' ? Moon : Sun} iconColor="text-purple-500" title="Appearance">
            <div className="space-y-2">
              {[
                { value: 'light', icon: Sun,  label: 'Light Mode' },
                { value: 'dark',  icon: Moon, label: 'Dark Mode' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value as 'light' | 'dark')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
                  style={
                    theme === value
                      ? { background: 'linear-gradient(to right, #6366f1, #a855f7)', color: '#fff' }
                      : { background: 'var(--background)', border: '1px solid var(--border)' }
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {theme === value && <Check className="w-4 h-4 ms-auto" />}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Security */}
          <SectionCard icon={Shield} iconColor="text-red-500" title={t('security')}>
            <div className="space-y-2.5">
              {[
                ['AES-256 Encryption', true],
                ['JWT Tokens',         true],
                ['MFA Enabled',        true],
                ['GDPR Compliance',    true],
                ['ISO 27001',          true],
                ['SOC 2',              false],
              ].map(([label, active]) => (
                <div key={label as string} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--foreground)' }}>{label as string}</span>
                  <span className={active ? 'text-green-500' : 'text-gray-400'}>{active ? '✓' : '○'}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* API Keys */}
          <SectionCard icon={Key} iconColor="text-amber-500" title={t('apiKeys')}>
            <div className="space-y-2 font-mono text-xs">
              {['pk_live_••••••••••••••••', 'sk_live_••••••••••••••••'].map((key, i) => (
                <div key={i} className="p-3 rounded-lg break-all" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  {key}
                </div>
              ))}
              <button className="w-full mt-2 py-2 rounded-lg text-xs font-medium text-indigo-500 transition" style={{ border: '1px dashed var(--border)' }}>
                + Generate New Key
              </button>
            </div>
          </SectionCard>

          {/* Backup */}
          <SectionCard icon={Database} iconColor="text-green-500" title="Backup & Data">
            <div className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Last backup: 2 hours ago</div>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition">
                <Database className="w-4 h-4" />
                Backup Now
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                <RefreshCw className="w-4 h-4" />
                Restore
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
