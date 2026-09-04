import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link, useLocation } from 'wouter';
import {
  Globe,
  Moon,
  Sun,
  Loader2,
  Clock,
  ShieldCheck,
  Building2,
  UserPlus,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

/*
 * Render free-tier cold start protection.
 */
function useServerWarmup() {
  const [ready, setReady] = useState(false);
  const [warming, setWarming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 22;

    const ping = async () => {
      if (cancelled) return;

      attempts++;

      try {
        const res = await fetch('/api/healthz', {
          method: 'GET',
        });

        if (!cancelled && res.ok) {
          setReady(true);
          setWarming(false);
          return;
        }
      } catch {
        // Server may still be waking up.
      }

      if (!cancelled && attempts < MAX_ATTEMPTS) {
        setTimeout(ping, 4000);
      } else if (!cancelled) {
        setReady(true);
        setWarming(false);
      }
    };

    const timer = setTimeout(() => {
      setWarming(true);
      ping();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return { ready, warming };
}

export default function Register() {
  const { t, locale, setLocale, dir } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const { ready: _ready, warming } = useServerWarmup();
  const [, navigate] = useLocation();

  /*
   * Setup mode:
   * true  = create first company + first admin
   * false = normal employee registration
   */
  const [setupMode, setSetupMode] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  const [pendingApproval, setPendingApproval] =
    useState(false);

  /*
   * First Admin fields
   */
  const [companyName, setCompanyName] =
    useState('');

  const [adminFullName, setAdminFullName] =
    useState('');

  const [adminEmail, setAdminEmail] =
    useState('nemahwael3@gmail.com');

  const [adminPassword, setAdminPassword] =
    useState('');

  const [adminPasswordConfirm, setAdminPasswordConfirm] =
    useState('');

  /*
   * Employee fields
   */
  const [empEmail, setEmpEmail] =
    useState('');

  const [empPassword, setEmpPassword] =
    useState('');

  const [empFullName, setEmpFullName] =
    useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  /*
   * Check whether the first administrator already exists.
   *
   * We intentionally use the setup endpoint as the source of truth.
   * If an admin already exists, the endpoint returns 403.
   *
   * We also inspect the company endpoint when possible.
   */
  useEffect(() => {
    let cancelled = false;

    const checkFirstSetup = async () => {
      try {
        /*
         * Try the company endpoint without authentication.
         * An unauthenticated request means normal registration
         * should remain available.
         */
        const response = await fetch(
          '/api/auth/company',
          {
            method: 'GET',
            credentials: 'include',
          },
        );

        /*
         * If company endpoint is unauthorized, that does NOT
         * necessarily mean setup mode. We need a reliable
         * backend signal.
         *
         * We therefore default to normal employee registration
         * unless the server explicitly exposes the setup status.
         */
        if (!cancelled) {
          setSetupMode(false);
        }
      } catch {
        if (!cancelled) {
          setSetupMode(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingSetup(false);
        }
      }
    };

    checkFirstSetup();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * IMPORTANT:
   * Since the backend endpoint is protected against creating
   * a second admin, we provide a visible "First Administrator"
   * button. This lets the user explicitly enter setup mode.
   *
   * Normal registration remains the default.
   */

  const enterSetupMode = () => {
    setError('');
    setSuccess('');
    setSetupMode(true);
  };

  const leaveSetupMode = () => {
    setError('');
    setSuccess('');
    setSetupMode(false);
  };

  /*
   * First administrator creation
   */
  const handleAdminSetup = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!companyName.trim()) {
      setError(
        locale === 'ar'
          ? 'يرجى إدخال اسم الشركة'
          : locale === 'sv'
            ? 'Ange företagets namn'
            : 'Please enter the company name',
      );
      return;
    }

    if (!adminFullName.trim()) {
      setError(
        locale === 'ar'
          ? 'يرجى إدخال اسم المدير'
          : locale === 'sv'
            ? 'Ange administratörens namn'
            : 'Please enter the administrator name',
      );
      return;
    }

    if (!adminEmail.trim()) {
      setError(
        locale === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني'
          : locale === 'sv'
            ? 'Ange e-postadress'
            : 'Please enter an email address',
      );
      return;
    }

    if (adminPassword.length < 8) {
      setError(
        locale === 'ar'
          ? 'كلمة السر يجب أن تكون 8 أحرف على الأقل'
          : locale === 'sv'
            ? 'Lösenordet måste innehålla minst 8 tecken'
            : 'Password must be at least 8 characters',
      );
      return;
    }

    if (adminPassword !== adminPasswordConfirm) {
      setError(
        locale === 'ar'
          ? 'كلمتا السر غير متطابقتين'
          : locale === 'sv'
            ? 'Lösenorden matchar inte'
            : 'Passwords do not match',
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        '/api/auth/setup-admin',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            companyName: companyName.trim(),
            fullName: adminFullName.trim(),
            email: adminEmail.trim().toLowerCase(),
            password: adminPassword,
          }),
        },
      );

      let data: any = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        if (
          data.error ===
          'admin_already_exists'
        ) {
          setSetupMode(false);

          setError(
            locale === 'ar'
              ? 'يوجد مدير بالفعل. يمكنك الآن تسجيل الموظفين.'
              : locale === 'sv'
                ? 'En administratör finns redan. Du kan nu registrera anställda.'
                : 'An administrator already exists. You can now register employees.',
          );

          return;
        }

        if (
          data.error ===
          'email_already_registered'
        ) {
          setError(
            locale === 'ar'
              ? 'هذا البريد الإلكتروني مستخدم بالفعل'
              : locale === 'sv'
                ? 'E-postadressen används redan'
                : 'This email is already registered',
          );
          return;
        }

        setError(
          data.message ||
            data.error ||
            (locale === 'ar'
              ? 'فشل إنشاء حساب المدير'
              : locale === 'sv'
                ? 'Det gick inte att skapa administratörskontot'
                : 'Failed to create administrator account'),
        );

        return;
      }

      /*
       * Save token returned by backend.
       *
       * The existing login flow uses localStorage in the app,
       * so store the token under the common auth key.
       */
      if (data.token) {
        localStorage.setItem(
          'workforce_token',
          data.token,
        );

        localStorage.setItem(
          'token',
          data.token,
        );

        localStorage.setItem(
          'auth_token',
          data.token,
        );
      }

      /*
       * Save user/company information for clients that
       * read these values directly.
       */
      if (data.user) {
        localStorage.setItem(
          'workforce_user',
          JSON.stringify(data.user),
        );

        localStorage.setItem(
          'user',
          JSON.stringify(data.user),
        );
      }

      if (data.company) {
        localStorage.setItem(
          'workforce_company',
          JSON.stringify(data.company),
        );
      }

      setSuccess(
        locale === 'ar'
          ? 'تم إنشاء حساب المدير بنجاح. جارٍ فتح لوحة الإدارة...'
          : locale === 'sv'
            ? 'Administratörskontot har skapats. Öppnar administrationspanelen...'
            : 'Administrator account created successfully. Opening the admin dashboard...',
      );

      /*
       * Clear password values from React state.
       */
      setAdminPassword('');
      setAdminPasswordConfirm('');

      /*
       * Give the app a moment to persist authentication,
       * then navigate to the dashboard.
       */
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 700);
    } catch {
      setError(
        locale === 'ar'
          ? 'خطأ في الاتصال بالخادم، حاول مرة أخرى'
          : locale === 'sv'
            ? 'Serverfel. Försök igen.'
            : 'Server error. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Employee registration
   */
  const handleEmployeeSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(
        '/api/auth/register-employee',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: empEmail.trim().toLowerCase(),
            password: empPassword,
            fullName: empFullName.trim(),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        /*
         * Empty database / no company yet.
         * Instead of showing "company not found",
         * send the user to first administrator setup.
         */
        if (
          data.error ===
          'no_company_found'
        ) {
          setSetupMode(true);

          setError(
            locale === 'ar'
              ? 'لا توجد شركة بعد. أنشئ حساب المدير الأول أولاً.'
              : locale === 'sv'
                ? 'Inget företag finns ännu. Skapa den första administratören först.'
                : 'No company exists yet. Create the first administrator first.',
          );

          return;
        }

        if (
          data.error ===
          'Email already registered'
        ) {
          setError(
            locale === 'ar'
              ? 'هذا البريد الإلكتروني مسجل بالفعل. إذا كنت قد سجلت مسبقاً حاول تسجيل الدخول.'
              : locale === 'sv'
                ? 'E-postadressen är redan registrerad. Försök logga in.'
                : 'This email is already registered. If you already signed up, try logging in.',
          );
        } else {
          setError(
            data.error ||
              (locale === 'ar'
                ? 'فشل في التسجيل'
                : locale === 'sv'
                  ? 'Registreringen misslyckades'
                  : 'Registration failed'),
          );
        }

        return;
      }

      /*
       * Both 201 and 202 lead to pending approval.
       */
      setPendingApproval(true);
    } catch {
      setError(
        locale === 'ar'
          ? 'خطأ في الاتصال، حاول مرة أخرى'
          : locale === 'sv'
            ? 'Serverfel. Försök igen.'
            : 'Server error, please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const order: typeof locale[] = [
      'en',
      'ar',
      'sv',
    ];

    const next =
      order[
        (order.indexOf(locale) + 1) %
          order.length
      ];

    setLocale(next);
  };

  /*
   * Text helpers.
   */
  const setupTitle =
    locale === 'ar'
      ? 'إنشاء المدير الأول'
      : locale === 'sv'
        ? 'Skapa första administratören'
        : 'Create First Administrator';

  const setupSubtitle =
    locale === 'ar'
      ? 'قم بإعداد الشركة وحساب المدير الرئيسي لأول مرة.'
      : locale === 'sv'
        ? 'Konfigurera företaget och huvudadministratören första gången.'
        : 'Set up your company and primary administrator for the first time.';

  const companyLabel =
    locale === 'ar'
      ? 'اسم الشركة'
      : locale === 'sv'
        ? 'Företagsnamn'
        : 'Company Name';

  const adminNameLabel =
    locale === 'ar'
      ? 'اسم المدير'
      : locale === 'sv'
        ? 'Administratörens namn'
        : 'Administrator Name';

  const createAdminLabel =
    locale === 'ar'
      ? 'إنشاء حساب المدير'
      : locale === 'sv'
        ? 'Skapa administratör'
        : 'Create Administrator';

  const employeeSetupLabel =
    locale === 'ar'
      ? 'تسجيل موظف جديد'
      : locale === 'sv'
        ? 'Registrera anställd'
        : 'Register Employee';

  return (
    <div
      className="min-h-screen grid lg:grid-cols-2 bg-background"
      dir={dir}
    >
      {/* Form Panel */}
      <div className="flex flex-col p-6 lg:p-12 relative order-2 lg:order-1">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(
                resolvedTheme === 'dark'
                  ? 'light'
                  : 'dark',
              )
            }
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase">
              {locale}
            </span>
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <div className="lg:hidden flex items-center gap-2 mb-8">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <div className="h-4 w-4 bg-white rounded-sm" />
                </div>

                <span className="text-2xl font-bold">
                  {t('appName')}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  {setupMode ? (
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  ) : (
                    <UserPlus className="h-6 w-6 text-primary" />
                  )}
                </div>

                <div>
                  <CardTitle className="text-3xl">
                    {setupMode
                      ? setupTitle
                      : t('registerTitle')}
                  </CardTitle>
                </div>
              </div>

              <CardDescription className="text-base">
                {setupMode
                  ? setupSubtitle
                  : t('registerSubtitle')}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              {/* Server warming */}
              {warming && (
                <div className="mb-5 p-3 text-sm text-muted-foreground bg-muted/30 rounded-md flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />

                  {locale === 'ar'
                    ? 'جاري الاتصال بالخادم...'
                    : locale === 'sv'
                      ? 'Ansluter till servern...'
                      : 'Connecting to server...'}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="mb-5 p-3 text-sm rounded-md bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
                  {success}
                </div>
              )}

              {/* Pending Approval */}
              {pendingApproval ? (
                <div className="flex flex-col items-center text-center gap-4 py-8">
                  <div className="w-20 h-20 rounded-full bg-amber-500/15 flex items-center justify-center">
                    <Clock className="h-10 w-10 text-amber-500" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {locale === 'ar'
                        ? 'حسابك قيد المراجعة'
                        : locale === 'sv'
                          ? 'Kontot väntar på godkännande'
                          : 'Account Pending Approval'}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {locale === 'ar'
                        ? 'تم إرسال طلبك إلى المدير. سيتم تفعيل حسابك بعد الموافقة.'
                        : locale === 'sv'
                          ? 'Din förfrågan har skickats till administratören.'
                          : 'Your request has been sent to the admin. Your account will be activated after approval.'}
                    </p>
                  </div>

                  <div className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400 font-medium">
                    {locale === 'ar'
                      ? 'بإمكانك تسجيل الدخول بعد موافقة المدير على طلبك'
                      : locale === 'sv'
                        ? 'Du kan logga in när administratören har godkänt din ansökan'
                        : 'You can log in once the admin approves your request'}
                  </div>

                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium text-sm mt-2"
                  >
                    {locale === 'ar'
                      ? 'العودة لتسجيل الدخول'
                      : locale === 'sv'
                        ? 'Tillbaka till inloggning'
                        : 'Back to Login'}
                  </Link>
                </div>
              ) : setupMode ? (
                /*
                 * FIRST ADMIN SETUP FORM
                 */
                <form
                  onSubmit={handleAdminSetup}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-5">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />

                      <div>
                        <p className="font-semibold text-sm">
                          {locale === 'ar'
                            ? 'إعداد البرنامج لأول مرة'
                            : locale === 'sv'
                              ? 'Första installationen'
                              : 'First-time setup'}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {locale === 'ar'
                            ? 'سيتم إنشاء الشركة وحساب المدير الرئيسي. اختر كلمة السر بنفسك.'
                            : locale === 'sv'
                              ? 'Företaget och huvudadministratören skapas. Välj ditt eget lösenord.'
                              : 'Your company and primary administrator account will be created. Choose your own password.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      {companyLabel}
                    </Label>

                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) =>
                        setCompanyName(
                          e.target.value,
                        )
                      }
                      autoComplete="organization"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminFullName">
                      {adminNameLabel}
                    </Label>

                    <Input
                      id="adminFullName"
                      value={adminFullName}
                      onChange={(e) =>
                        setAdminFullName(
                          e.target.value,
                        )
                      }
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">
                      {t('email')}
                    </Label>

                    <Input
                      id="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) =>
                        setAdminEmail(
                          e.target.value,
                        )
                      }
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">
                      {t('password')}
                    </Label>

                    <Input
                      id="adminPassword"
                      type="password"
                      value={adminPassword}
                      onChange={(e) =>
                        setAdminPassword(
                          e.target.value,
                        )
                      }
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />

                    <p className="text-xs text-muted-foreground">
                      {locale === 'ar'
                        ? '8 أحرف على الأقل'
                        : locale === 'sv'
                          ? 'Minst 8 tecken'
                          : 'Minimum 8 characters'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPasswordConfirm">
                      {locale === 'ar'
                        ? 'تأكيد كلمة السر'
                        : locale === 'sv'
                          ? 'Bekräfta lösenord'
                          : 'Confirm Password'}
                    </Label>

                    <Input
                      id="adminPasswordConfirm"
                      type="password"
                      value={
                        adminPasswordConfirm
                      }
                      onChange={(e) =>
                        setAdminPasswordConfirm(
                          e.target.value,
                        )
                      }
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={
                      loading || warming
                    }
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />

                        {locale === 'ar'
                          ? 'جاري إنشاء المدير...'
                          : locale === 'sv'
                            ? 'Skapar administratör...'
                            : 'Creating administrator...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        {createAdminLabel}
                      </span>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={leaveSetupMode}
                    className="w-full text-sm text-muted-foreground hover:text-foreground hover:underline py-2"
                  >
                    {employeeSetupLabel}
                  </button>
                </form>
              ) : (
                /*
                 * NORMAL EMPLOYEE REGISTRATION
                 */
                <>
                  <form
                    onSubmit={
                      handleEmployeeSubmit
                    }
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="empFullName">
                        {t('fullName')}
                      </Label>

                      <Input
                        id="empFullName"
                        value={empFullName}
                        onChange={(e) =>
                          setEmpFullName(
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="empEmail">
                        {t('email')}
                      </Label>

                      <Input
                        id="empEmail"
                        type="email"
                        value={empEmail}
                        onChange={(e) =>
                          setEmpEmail(
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="empPassword">
                        {t('password')}
                      </Label>

                      <Input
                        id="empPassword"
                        type="password"
                        value={empPassword}
                        onChange={(e) =>
                          setEmpPassword(
                            e.target.value,
                          )
                        }
                        minLength={8}
                        required
                      />
                    </div>

                    {error && (
                      <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={
                        loading || warming
                      }
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />

                          {locale === 'ar'
                            ? 'جاري الإرسال...'
                            : locale === 'sv'
                              ? 'Skickar...'
                              : 'Submitting...'}
                        </span>
                      ) : locale === 'ar' ? (
                        'إرسال الطلب'
                      ) : locale === 'sv' ? (
                        'Skicka ansökan'
                      ) : (
                        'Submit Request'
                      )}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={
                        enterSetupMode
                      }
                    >
                      <ShieldCheck className="h-4 w-4" />

                      {locale === 'ar'
                        ? 'إنشاء المدير الأول'
                        : locale === 'sv'
                          ? 'Skapa första administratören'
                          : 'Create First Administrator'}
                    </Button>
                  </div>

                  <div className="mt-8 text-center text-sm text-muted-foreground">
                    {t('hasAccount')}{' '}

                    <Link
                      href="/login"
                      className="text-primary hover:underline font-medium"
                    >
                      {t('login')}
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground order-1 lg:order-2">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <div className="h-4 w-4 bg-white rounded-sm" />
            </div>

            <span className="text-2xl font-bold">
              {t('appName')}
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-6 max-w-md">
            {t('landingTitle')}
          </h1>

          <p className="text-sidebar-foreground/70 text-lg max-w-md">
            {t('landingDesc')}
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">
                  ✓
                </span>
              </div>

              <p className="text-sm font-medium">
                Full attendance tracking
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">
                  ✓
                </span>
              </div>

              <p className="text-sm font-medium">
                Automated payroll
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">
                  ✓
                </span>
              </div>

              <p className="text-sm font-medium">
                Global compliance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
