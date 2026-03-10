import { ReactNode } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/error-boundary";
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
import GalleryPage from "@/pages/dashboard/gallery";
import Analytics from "@/pages/dashboard/analytics";
import Subscription from "@/pages/dashboard/subscription";
import PaymentInvoice from "@/pages/dashboard/payment-invoice";
import AccountSettings from "@/pages/dashboard/settings";
import InvitePage from "@/pages/invite";
import PreviewPage from "@/pages/preview";
import AdminLayout from "@/pages/admin/layout";
import AdminDashboard from "@/pages/admin/index";
import AdminUsers from "@/pages/admin/users";
import AdminInvitations from "@/pages/admin/invitations";
import AdminTestimonials from "@/pages/admin/testimonials";
import AdminFaqs from "@/pages/admin/faqs";
import AdminPricing from "@/pages/admin/pricing";
import AdminPayments from "@/pages/admin/payments";
import AdminSettings from "@/pages/admin/settings";
import AdminSeo from "@/pages/admin/seo";
import AdminLogs from "@/pages/admin/logs";
import AdminThemes from "@/pages/admin/themes";
import AdminThemeBuilder from "@/pages/admin/theme-builder";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Memuat...</p>
      </div>
    </div>
  );
}

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AuthRequired({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/invite/:slug" component={InvitePage} />
      <Route path="/preview/:id">
        {() => <AuthRequired><PreviewPage /></AuthRequired>}
      </Route>

      {/* User Dashboard */}
      <Route path="/dashboard">
        {() => <ProtectedLayout><Overview /></ProtectedLayout>}
      </Route>
      <Route path="/dashboard/invitations">
        {() => <ProtectedLayout><Invitations /></ProtectedLayout>}
      </Route>
      <Route path="/dashboard/builder/:id">
        {() => <ProtectedLayout><Builder /></ProtectedLayout>}
      </Route>
      <Route path="/dashboard/rsvp">
        {() => <ProtectedLayout><RsvpManagement /></ProtectedLayout>}
      </Route>
      <Route path="/dashboard/messages">
        {() => <ProtectedLayout><GuestMessages /></ProtectedLayout>}
      </Route>
      <Route path="/dashboard/gifts">
        {() => <ProtectedLayout><GiftSettings /></ProtectedLayout>}
      </Route>
      <Route path="/dashboard/gallery">
        {() => <ProtectedLayout><GalleryPage /></ProtectedLayout>}
      </Route>
      <Route path="/dashboard/analytics">
        {() => <ProtectedLayout><Analytics /></ProtectedLayout>}
      </Route>
      <Route path="/dashboard/subscription">
        {() => <ProtectedLayout><Subscription /></ProtectedLayout>}
      </Route>
      <Route path="/dashboard/billing/:id">
        {() => <ProtectedLayout><PaymentInvoice /></ProtectedLayout>}
      </Route>
      <Route path="/dashboard/settings">
        {() => <ProtectedLayout><AccountSettings /></ProtectedLayout>}
      </Route>

      {/* Admin Panel */}
      <Route path="/admin">
        {() => <AdminLayout><AdminDashboard /></AdminLayout>}
      </Route>
      <Route path="/admin/users">
        {() => <AdminLayout><AdminUsers /></AdminLayout>}
      </Route>
      <Route path="/admin/invitations">
        {() => <AdminLayout><AdminInvitations /></AdminLayout>}
      </Route>
      <Route path="/admin/testimonials">
        {() => <AdminLayout><AdminTestimonials /></AdminLayout>}
      </Route>
      <Route path="/admin/faqs">
        {() => <AdminLayout><AdminFaqs /></AdminLayout>}
      </Route>
      <Route path="/admin/pricing">
        {() => <AdminLayout><AdminPricing /></AdminLayout>}
      </Route>
      <Route path="/admin/payments">
        {() => <AdminLayout><AdminPayments /></AdminLayout>}
      </Route>
      <Route path="/admin/settings">
        {() => <AdminLayout><AdminSettings /></AdminLayout>}
      </Route>
      <Route path="/admin/seo">
        {() => <AdminLayout><AdminSeo /></AdminLayout>}
      </Route>
      <Route path="/admin/logs">
        {() => <AdminLayout><AdminLogs /></AdminLayout>}
      </Route>
      <Route path="/admin/themes">
        {() => <AdminLayout><AdminThemes /></AdminLayout>}
      </Route>
      <Route path="/admin/themes/:id/builder" component={AdminThemeBuilder} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
