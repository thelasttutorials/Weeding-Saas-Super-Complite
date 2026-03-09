import { ReactNode } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Users, Mail, LogOut, Heart, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Pengguna", url: "/admin/users", icon: Users },
  { title: "Undangan", url: "/admin/invitations", icon: Mail },
];

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.isAdmin) return <Redirect to="/dashboard" />;

  const isActive = (url: string) => {
    if (url === "/admin") return location === "/admin";
    return location.startsWith(url);
  };

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-56 bg-background border-r border-border flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm tracking-tight">Admin Panel</span>
              <p className="text-[10px] text-muted-foreground leading-none">WedSaaS Platform</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.url);
            return (
              <Link key={item.url} href={item.url}>
                <div
                  className={`flex items-center gap-2.5 h-9 px-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"
                      : "text-foreground/60 hover:text-foreground hover:bg-muted"
                  }`}
                  data-testid={`admin-nav-${item.title.toLowerCase()}`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-violet-600" : ""}`} />
                  {item.title}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          <Link href="/dashboard">
            <div className="flex items-center gap-2.5 h-9 px-2.5 rounded-md text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-muted cursor-pointer transition-colors">
              <Heart className="w-4 h-4 shrink-0" />
              Kembali ke Dashboard
            </div>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 h-9 px-2.5 rounded-md text-sm font-medium text-foreground/60 hover:text-destructive hover:bg-destructive/10 w-full transition-colors"
            data-testid="admin-button-logout"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
