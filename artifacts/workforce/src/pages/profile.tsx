import { useLocation } from 'wouter';
import { ArrowRight, ArrowLeft, Mail, Shield, UserRound, Building2, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { locale } = useLanguage();
  const isArabic = locale === 'ar';

  if (!user) return null;

  const role = user.role === 'admin'
    ? (isArabic ? 'مدير النظام' : 'Administrator')
    : user.role === 'manager'
      ? (isArabic ? 'مدير' : 'Manager')
      : (isArabic ? 'موظف' : 'Employee');

  return (
    <div className="mx-auto max-w-2xl animate-fadeIn space-y-5" dir={isArabic ? 'rtl' : 'ltr'}>
      <button
        type="button"
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground transition hover:bg-muted"
      >
        {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        {isArabic ? 'رجوع' : 'Back'}
      </button>

      <section className="overflow-hidden rounded-3xl border border-indigo-400/25 bg-gradient-to-br from-indigo-950/80 via-slate-950/95 to-purple-950/80 shadow-xl">
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 text-4xl font-black text-white shadow-2xl shadow-indigo-500/30">
            {user.fullName?.charAt(0) || 'U'}
          </div>
          <h1 className="text-2xl font-black text-white">{user.fullName}</h1>
          <span className="rounded-full border border-indigo-300/30 bg-indigo-400/10 px-3 py-1 text-xs font-bold text-indigo-200">{role}</span>
        </div>

        <div className="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-2 sm:p-7">
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Mail className="h-4 w-4" />{isArabic ? 'البريد الإلكتروني' : 'Email'}</div>
            <div className="mt-2 break-words text-sm font-bold text-white">{user.email || '—'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Shield className="h-4 w-4" />{isArabic ? 'الصلاحية' : 'Role'}</div>
            <div className="mt-2 text-sm font-bold text-white">{role}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Building2 className="h-4 w-4" />{isArabic ? 'الشركة' : 'Company'}</div>
            <div className="mt-2 text-sm font-bold text-white">#{user.companyId || '—'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><UserRound className="h-4 w-4" />{isArabic ? 'معرّف المستخدم' : 'User ID'}</div>
            <div className="mt-2 text-sm font-bold text-white">#{user.id || '—'}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 p-5 sm:flex-row sm:p-7">
          <button type="button" onClick={() => setLocation('/dashboard/settings')} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10">
            {isArabic ? 'إعدادات الحساب' : 'Account settings'}
          </button>
          <button type="button" onClick={logout} className="flex items-center justify-center gap-2 rounded-xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/25">
            <LogOut className="h-4 w-4" />
            {isArabic ? 'تسجيل الخروج' : 'Log out'}
          </button>
        </div>
      </section>
    </div>
  );
}