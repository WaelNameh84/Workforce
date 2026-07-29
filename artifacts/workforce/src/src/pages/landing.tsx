import { Link } from 'wouter';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTheme } from '@/components/theme-provider';
import {
  Globe, Users, Calendar, Clock, DollarSign, BarChart3, Shield, Cpu,
  MessageSquare, Award, Package, Workflow, Plug, Settings,
  Code2, ArrowRight, Moon, Sun, Check, Sparkles, Building2,
  Fingerprint, QrCode, Wifi, Smartphone, Mail, KeyRound,
  Bot, Bell, Database
} from 'lucide-react';

export default function LandingPage() {
  const { t, locale, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  ];

  const modules = [
    { icon: Users,        title: t('employees'),     color: 'from-blue-500 to-cyan-500',     desc: 'Profiles • Documents • Contracts • Skills' },
    { icon: Clock,        title: t('attendance'),    color: 'from-green-500 to-emerald-500', desc: 'Clock In/Out • GPS • Face ID • Biometric' },
    { icon: Calendar,     title: t('schedule'),      color: 'from-purple-500 to-pink-500',   desc: 'Daily • Weekly • Rotating • Auto Scheduler' },
    { icon: DollarSign,   title: t('payroll'),       color: 'from-amber-500 to-orange-500',  desc: 'Salary • Overtime • Tax • Payslips' },
    { icon: Calendar,     title: t('leaves'),        color: 'from-rose-500 to-red-500',      desc: 'Annual • Sick • Emergency • Balance' },
    { icon: BarChart3,    title: t('reports'),       color: 'from-indigo-500 to-blue-500',   desc: 'Analytics • AI Insights • PDF • Excel' },
    { icon: Bot,          title: t('aiAssistant'),   color: 'from-fuchsia-500 to-purple-500',desc: 'Chat AI • Predict • Detect Fraud' },
    { icon: MessageSquare,title: t('communication'), color: 'from-sky-500 to-blue-500',      desc: 'Chat • Email • SMS • WhatsApp' },
    { icon: Award,        title: t('performance'),   color: 'from-yellow-500 to-amber-500',  desc: 'KPI • Goals • Evaluations • Rewards' },
    { icon: Package,      title: t('purchases'),     color: 'from-teal-500 to-cyan-500',     desc: 'Orders • Suppliers • Purchase dates' },
    { icon: Workflow,     title: t('automation'),    color: 'from-violet-500 to-purple-500', desc: 'IF/THEN • Auto Approval • Webhooks' },
    { icon: Plug,         title: t('integrations'),  color: 'from-slate-500 to-gray-500',    desc: 'Google • Microsoft • Slack • SAP' },
    { icon: Shield,       title: t('security'),      color: 'from-red-500 to-rose-500',      desc: 'AES-256 • JWT • MFA • GDPR' },
    { icon: Settings,     title: t('settings'),      color: 'from-gray-500 to-slate-500',    desc: 'Theme • Languages • API Keys' },
    { icon: Code2,        title: t('developers'),    color: 'from-emerald-500 to-teal-500',  desc: 'REST • GraphQL • SDK • OAuth' },
  ];

  const loginMethods = [
    { icon: KeyRound,    name: 'Password' },
    { icon: Fingerprint, name: t('faceId') },
    { icon: Smartphone,  name: t('fingerprint') },
    { icon: QrCode,      name: t('qrCode') },
    { icon: Wifi,        name: t('nfc') },
    { icon: Mail,        name: 'SSO' },
  ];

  const stats = [
    { value: '10K+', label: t('company') },
    { value: '2M+',  label: t('employees') },
    { value: '150+', label: 'Countries' },
    { value: '99.9%',label: 'Uptime' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-lg border-b"
        style={{ background: 'color-mix(in srgb, var(--background) 80%, transparent)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">{t('appName')}</span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features"  className="text-sm font-medium hover:text-indigo-500 transition">{t('features')}</a>
              <a href="#modules"   className="text-sm font-medium hover:text-indigo-500 transition">Modules</a>
              <a href="#security"  className="text-sm font-medium hover:text-indigo-500 transition">{t('security')}</a>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Language flags */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--card)' }}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLocale(lang.code as any)}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      locale === lang.code ? 'bg-indigo-500 text-white' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {lang.flag}
                  </button>
                ))}
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg transition"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium rounded-lg transition"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition"
              >
                {t('getStarted')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>{t('tagline')}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-10" style={{ color: 'var(--muted)' }}>
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              {t('startFree')}
              <ArrowRight className={`w-5 h-5 ${locale === 'ar' ? 'rotate-180' : ''}`} />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {t('login')}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Methods Banner */}
      <section id="features" className="py-12 border-y" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium mb-6" style={{ color: 'var(--muted)' }}>
            Multiple Authentication Methods
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {loginMethods.map((method, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
              >
                <method.icon className="w-4 h-4 text-indigo-500" />
                {method.name}
              </div>
            ))}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500" />
              {t('google')}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              <div className="w-4 h-4 bg-blue-600 rounded" />
              {t('microsoft')}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              🍎 {t('apple')}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              <Shield className="w-4 h-4 text-green-500" />
              MFA
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              🔑 Passkeys
            </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">{t('landingTitle')}</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>{t('landingDesc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl transition-all hover:scale-105 hover:shadow-2xl cursor-pointer"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{module.title}</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{module.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Company */}
      <section className="py-20" style={{ background: 'var(--card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-sm font-medium mb-4">
                <Building2 className="w-4 h-4" />
                Multi-Company
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">One Platform, Unlimited Companies</h2>
              <div className="space-y-4">
                {[
                  'Unlimited Companies & Branches',
                  'Multi-Country & Multi-Currency',
                  'Multi-Timezone Support',
                  'Multi-Language (EN, AR, SV + more)',
                  'Consolidated Reporting',
                  'Centralized Management',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['🇺🇸 USA', '🇸🇦 Saudi', '🇸🇪 Sweden', '🇬🇧 UK', '🇩🇪 Germany', '🇫🇷 France', '🇯🇵 Japan', '🇦🇪 UAE'].map((country, i) => (
                <div key={i} className="p-6 rounded-2xl text-center font-semibold" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  <div className="text-3xl mb-2">{country.split(' ')[0]}</div>
                  <div className="text-sm">{country.split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Enterprise Security
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Bank-Grade Security & Compliance</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['AES-256', 'JWT', 'MFA', 'GDPR', 'ISO 27001', 'SOC 2', 'SSO', 'OAuth 2.0'].map((badge, i) => (
              <div key={i} className="p-6 rounded-xl text-center font-bold" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <Shield className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20" style={{ background: 'var(--card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('integrations')}</h2>
            <p style={{ color: 'var(--muted)' }}>Connect with your favorite tools</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {['Google Workspace', 'Microsoft 365', 'Outlook', 'Slack', 'Teams', 'Zoom', 'Google Maps', 'Stripe', 'PayPal', 'SAP', 'Oracle', 'QuickBooks', 'Xero', 'Zapier'].map((int, i) => (
              <div key={i} className="px-5 py-3 rounded-xl font-medium" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                {int}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium mb-4">
              <Database className="w-4 h-4" />
              Technology Stack
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for Scale</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Frontend', icon: '⚛️', items: ['React + TypeScript', 'Vite', 'Tailwind CSS', 'Recharts'] },
              { title: 'Backend',  icon: '🚀', items: ['Node.js + Express', 'PostgreSQL', 'Drizzle ORM', 'WebSocket'] },
              { title: 'DevOps',   icon: '☁️', items: ['Replit Hosting', 'Docker', 'CDN', 'Object Storage'] },
            ].map((stack, i) => (
              <div key={i} className="p-6 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="text-4xl mb-4">{stack.icon}</div>
                <h3 className="text-xl font-bold mb-4">{stack.title}</h3>
                <div className="space-y-2">
                  {stack.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-12 text-center text-white bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to transform your HR operations?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of companies managing their workforce with {t('appName')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="px-8 py-4 rounded-xl bg-white text-indigo-600 font-semibold hover:scale-105 transition">
                {t('startFree')}
              </Link>
              <Link href="/login" className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur text-white font-semibold hover:bg-white/20 transition">
                {t('login')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">{t('appName')}</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('tagline')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
                <li><a href="#features" className="hover:text-indigo-500 transition">{t('features')}</a></li>
                <li><span>{t('pricing')}</span></li>
                <li><a href="#security" className="hover:text-indigo-500 transition">{t('security')}</a></li>
                <li><a href="#modules" className="hover:text-indigo-500 transition">{t('integrations')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
                <li>About</li>
                <li>Careers</li>
                <li>Blog</li>
                <li>{t('contact')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('developers')}</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
                <li>API Docs</li>
                <li>SDK</li>
                <li>GraphQL</li>
                <li>Webhooks</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            © 2026 {t('appName')}. All rights reserved. Built with ❤️ for global teams.
          </div>
        </div>
      </footer>
    </div>
  );
}
