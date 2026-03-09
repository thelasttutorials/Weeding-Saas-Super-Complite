import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import DashboardLayout from "@/pages/dashboard/layout";
import Overview from "@/pages/dashboard/overview";
import Invitations from "@/pages/dashboard/invitations";
import Builder from "@/pages/dashboard/builder";
import RsvpManagement from "@/pages/dashboard/rsvp";
import GuestMessages from "@/pages/dashboard/messages";
import GiftSettings from "@/pages/dashboard/gifts";
import Analytics from "@/pages/dashboard/analytics";
import Subscription from "@/pages/dashboard/subscription";
import AccountSettings from "@/pages/dashboard/settings";
import InvitePage from "@/pages/invite";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/invite/:slug" component={InvitePage} />
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute component={() => (
            <DashboardLayout>
              <Overview />
            </DashboardLayout>
          )} />
        )}
      </Route>
      <Route path="/dashboard/invitations">
        {() => (
          <ProtectedRoute component={() => (
            <DashboardLayout>
              <Invitations />
            </DashboardLayout>
          )} />
        )}
      </Route>
      <Route path="/dashboard/builder/:id">
        {() => (
          <ProtectedRoute component={() => (
            <DashboardLayout>
              <Builder />
            </DashboardLayout>
          )} />
        )}
      </Route>
      <Route path="/dashboard/rsvp">
        {() => (
          <ProtectedRoute component={() => (
            <DashboardLayout>
              <RsvpManagement />
            </DashboardLayout>
          )} />
        )}
      </Route>
      <Route path="/dashboard/messages">
        {() => (
          <ProtectedRoute component={() => (
            <DashboardLayout>
              <GuestMessages />
            </DashboardLayout>
          )} />
        )}
      </Route>
      <Route path="/dashboard/gifts">
        {() => (
          <ProtectedRoute component={() => (
            <DashboardLayout>
              <GiftSettings />
            </DashboardLayout>
          )} />
        )}
      </Route>
      <Route path="/dashboard/analytics">
        {() => (
          <ProtectedRoute component={() => (
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          )} />
        )}
      </Route>
      <Route path="/dashboard/subscription">
        {() => (
          <ProtectedRoute component={() => (
            <DashboardLayout>
              <Subscription />
            </DashboardLayout>
          )} />
        )}
      </Route>
      <Route path="/dashboard/settings">
        {() => (
          <ProtectedRoute component={() => (
            <DashboardLayout>
              <AccountSettings />
            </DashboardLayout>
          )} />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
