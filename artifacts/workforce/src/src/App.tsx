import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { AuthContext, useAuthState, useAuth } from '@/hooks/use-auth';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { useEffect, lazy, Suspense } from 'react';

// API and frontend are on the same origin — relative URLs work, no base URL needed.

import Login from '@/pages/login';
import Register from '@/pages/register';
import DashboardLayout from '@/components/layout';
import PageTransition from '@/components/page-transition';
import SplashScreen from '@/components/splash-screen';

// Lazy-load all pages so the initial bundle stays small (faster first paint on mobile)
const Dashboard           = lazy(() => import('@/pages/dashboard'));
const ActionCenter        = lazy(() => import('@/pages/action-center'));
const Employees           = lazy(() => import('@/pages/employees'));
const Departments         = lazy(() => import('@/pages/departments'));
const Locations           = lazy(() => import('@/pages/locations'));
const Attendance          = lazy(() => import('@/pages/attendance'));
const Schedule            = lazy(() => import('@/pages/schedule'));
const Leaves              = lazy(() => import('@/pages/leaves'));
const Payroll             = lazy(() => import('@/pages/payroll'));
const Requests            = lazy(() => import('@/pages/requests'));
const Reports             = lazy(() => import('@/pages/reports'));
const Settings            = lazy(() => import('@/pages/settings'));
const AI                  = lazy(() => import('@/pages/ai'));
const Communication       = lazy(() => import('@/pages/communication'));
const Performance         = lazy(() => import('@/pages/performance'));
const Purchases           = lazy(() => import('@/pages/assets'));
const Automation          = lazy(() => import('@/pages/automation'));
const Integrations        = lazy(() => import('@/pages/integrations'));
const Security            = lazy(() => import('@/pages/security'));
const Developers          = lazy(() => import('@/pages/developers'));
const Documentation       = lazy(() => import('@/pages/documentation'));
const Notifications       = lazy(() => import('@/pages/notifications'));
const Profile             = lazy(() => import('@/pages/profile'));
const DetailPage          = lazy(() => import('@/pages/detail'));
const AttendanceCorrection = lazy(() => import('@/pages/attendance-correction'));
const Bonuses             = lazy(() => import('@/pages/bonuses'));
const Advances            = lazy(() => import('@/pages/advances'));
const Holidays            = lazy(() => import('@/pages/holidays'));
const ClearReports        = lazy(() => import('@/pages/clear-reports'));
const NotFound            = lazy(() => import('@/pages/not-found'));

// Optimised QueryClient: cache data for 2 min, retry once, no refetch on window focus
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,   // treat data fresh for 2 min → fewer network calls
      gcTime:    5 * 60 * 1000,   // keep in cache for 5 min
      retry: 1,
      refetchOnWindowFocus: false, // avoid surprise refetches when user switches tabs
    },
  },
});

// The generated API client reads the current token before every request. Keeping
// this getter live avoids stale auth headers after login/logout or a page reload.
setAuthTokenGetter(() => localStorage.getItem('token'));

/** Scroll to top of page whenever the route changes */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Also reset any scrollable container with the page-shell class
    const shell = document.querySelector('.page-shell');
    if (shell) shell.scrollTop = 0;
  }, [location]);
  return null;
}

/** Minimal loading spinner shown while a lazy page chunk is downloading */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: { component: React.ComponentType; adminOnly?: boolean; path?: string }) {
  const { user, isLoading } = useAuth();

  return (
    <Route {...rest}>
      {() => {
        if (isLoading) return null;
        if (!user) return <Redirect to="/login" />;
        if (adminOnly && user.role === 'employee') return <Redirect to="/dashboard" />;
        return (
          <DashboardLayout>
            <PageTransition>
              <Suspense fallback={<PageLoader />}>
                <Component />
              </Suspense>
            </PageTransition>
          </DashboardLayout>
        );
      }}
    </Route>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
    <Switch>
      <Route path="/"><Redirect to="/dashboard" /></Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Shared routes — employee sees their own data, admin sees all */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/dashboard/attendance" component={Attendance} />
      <ProtectedRoute path="/dashboard/schedule" component={Schedule} />
      <ProtectedRoute path="/dashboard/leaves" component={Leaves} />
      <ProtectedRoute path="/dashboard/payroll" component={Payroll} />
      <ProtectedRoute path="/dashboard/requests" component={Requests} />
      <ProtectedRoute path="/dashboard/settings" component={Settings} />
      <ProtectedRoute path="/dashboard/profile" component={Profile} />
      <ProtectedRoute path="/dashboard/notifications" component={Notifications} />
      <ProtectedRoute path="/dashboard/detail" component={DetailPage} />

      {/* Admin / Manager only routes */}
      <ProtectedRoute path="/dashboard/action-center" component={ActionCenter} adminOnly />
      <ProtectedRoute path="/dashboard/employees" component={Employees} adminOnly />
      <ProtectedRoute path="/dashboard/departments" component={Departments} adminOnly />
      <ProtectedRoute path="/dashboard/locations" component={Locations} adminOnly />
      <ProtectedRoute path="/dashboard/documentation" component={Documentation} adminOnly />
      <ProtectedRoute path="/dashboard/reports" component={Reports} adminOnly />
      <ProtectedRoute path="/dashboard/ai" component={AI} adminOnly />
      <ProtectedRoute path="/dashboard/communication" component={Communication} adminOnly />
      <ProtectedRoute path="/dashboard/performance" component={Performance} adminOnly />
      <ProtectedRoute path="/dashboard/purchases" component={Purchases} adminOnly />
      <ProtectedRoute path="/dashboard/automation" component={Automation} adminOnly />
      <ProtectedRoute path="/dashboard/integrations" component={Integrations} adminOnly />
      <ProtectedRoute path="/dashboard/security" component={Security} adminOnly />
      <ProtectedRoute path="/dashboard/developers" component={Developers} adminOnly />

      {/* Department sub-sections — admin only */}
      <ProtectedRoute path="/dashboard/attendance-correction" component={AttendanceCorrection} adminOnly />
      <ProtectedRoute path="/dashboard/bonuses" component={Bonuses} adminOnly />
      <ProtectedRoute path="/dashboard/advances" component={Advances} adminOnly />
      <ProtectedRoute path="/dashboard/holidays" component={Holidays} adminOnly />
      <ProtectedRoute path="/dashboard/clear-reports" component={ClearReports} adminOnly />

      <Route><Suspense fallback={<PageLoader />}><NotFound /></Suspense></Route>
    </Switch>
    </>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="workforce-theme">
          <LanguageProvider>
            <TooltipProvider>
              <SplashScreen />
              <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
                <AuthProvider>
                  <ErrorBoundary>
                    <Router />
                  </ErrorBoundary>
                </AuthProvider>
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
