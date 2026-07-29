import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { AuthContext, useAuthState, useAuth } from '@/hooks/use-auth';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { useEffect } from 'react';

// API and frontend are on the same origin — relative URLs work, no base URL needed.

import Login from '@/pages/login';
import Register from '@/pages/register';
import DashboardLayout from '@/components/layout';
import PageTransition from '@/components/page-transition';
import SplashScreen from '@/components/splash-screen';

import {
  ActionCenter,
  Dashboard,
  Employees,
  Departments,
  Locations,
  Attendance,
  Schedule,
  Leaves,
  Payroll,
  Requests,
  Reports,
  Settings,
  AI,
  Communication,
  Performance,
  Assets as Purchases,
  Automation,
  Integrations,
  Security,
  Developers,
  Documentation,
  Notifications,
} from '@/pages';
import Profile from '@/pages/profile';
import DetailPage from '@/pages/detail';
import AttendanceCorrection from '@/pages/attendance-correction';
import Bonuses from '@/pages/bonuses';
import Advances from '@/pages/advances';
import Holidays from '@/pages/holidays';
import ClearReports from '@/pages/clear-reports';

const queryClient = new QueryClient();

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
              <Component />
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

      <Route component={NotFound} />
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
