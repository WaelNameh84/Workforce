import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { AuthContext, useAuthState, useAuth } from '@/hooks/use-auth';

import Login from '@/pages/login';
import Register from '@/pages/register';
import DashboardLayout from '@/components/layout';

import {
  Dashboard,
  Employees,
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
  Developers
} from '@/pages';

const queryClient = new QueryClient();

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
            <Component />
          </DashboardLayout>
        );
      }}
    </Route>
  );
}

function Router() {
  return (
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

      {/* Admin / Manager only routes */}
      <ProtectedRoute path="/dashboard/employees" component={Employees} adminOnly />
      <ProtectedRoute path="/dashboard/reports" component={Reports} adminOnly />
      <ProtectedRoute path="/dashboard/ai" component={AI} adminOnly />
      <ProtectedRoute path="/dashboard/communication" component={Communication} adminOnly />
      <ProtectedRoute path="/dashboard/performance" component={Performance} adminOnly />
      <ProtectedRoute path="/dashboard/purchases" component={Purchases} adminOnly />
      <ProtectedRoute path="/dashboard/automation" component={Automation} adminOnly />
      <ProtectedRoute path="/dashboard/integrations" component={Integrations} adminOnly />
      <ProtectedRoute path="/dashboard/security" component={Security} adminOnly />
      <ProtectedRoute path="/dashboard/developers" component={Developers} adminOnly />

      <Route component={NotFound} />
    </Switch>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="workforce-theme">
        <LanguageProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
              <AuthProvider>
                <Router />
              </AuthProvider>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
