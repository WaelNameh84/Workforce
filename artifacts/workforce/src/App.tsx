import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/i18n/LanguageProvider';

import Login from '@/pages/login';
import Register from '@/pages/register';
import Landing from '@/pages/landing';
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
  Assets,
  Visitors,
  Automation,
  Integrations,
  Security,
  Developers
} from '@/pages';

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <Route {...rest}>
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/dashboard/employees" component={Employees} />
      <ProtectedRoute path="/dashboard/attendance" component={Attendance} />
      <ProtectedRoute path="/dashboard/schedule" component={Schedule} />
      <ProtectedRoute path="/dashboard/leaves" component={Leaves} />
      <ProtectedRoute path="/dashboard/payroll" component={Payroll} />
      <ProtectedRoute path="/dashboard/requests" component={Requests} />
      <ProtectedRoute path="/dashboard/reports" component={Reports} />
      <ProtectedRoute path="/dashboard/settings" component={Settings} />
      <ProtectedRoute path="/dashboard/ai" component={AI} />
      <ProtectedRoute path="/dashboard/communication" component={Communication} />
      <ProtectedRoute path="/dashboard/performance" component={Performance} />
      <ProtectedRoute path="/dashboard/assets" component={Assets} />
      <ProtectedRoute path="/dashboard/visitors" component={Visitors} />
      <ProtectedRoute path="/dashboard/automation" component={Automation} />
      <ProtectedRoute path="/dashboard/integrations" component={Integrations} />
      <ProtectedRoute path="/dashboard/security" component={Security} />
      <ProtectedRoute path="/dashboard/developers" component={Developers} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="workforce-theme">
        <LanguageProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;