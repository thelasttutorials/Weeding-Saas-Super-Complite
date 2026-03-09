import { ReactNode } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Users, Mail, LogOut, Heart, Shield,
  Star, HelpCircle, CreditCard, Receipt, Settings, Globe,
  FileText
} from "lucide-react";

const navGroups = [
  {
    label: "Data",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Pengguna", url: "/admin/users", icon: Users },
      { title: "Undangan", url: "/admin/invitations", icon: Mail },
      { title: "Pembayaran", url: "/admin/payments", icon: Receipt },
    ],
  },
  {
    label: "Konten",
    items: [
      { title: "Testimoni", url: "/admin/testimonials", icon: Star },
      { title: "FAQ", url: "/admin/faqs", icon: HelpCircle },
      { title: "Paket Harga", url: "/admin/pricing", icon: CreditCard },
    ],
  },
  {
    label: "Konfigurasi",
    items: [
      { title: "Pengaturan", url: "/admin/settings", icon: Settings },
      { title: "SEO", url: "/admin/seo", icon: Globe },
      { title: "Audit Log", url: "/admin/logs", icon: FileText },
    ],
  },
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
      <aside className="w-56 bg-background border-r border-border flex flex-col shrink-0 overflow-y-auto">
        <div className="px-4 py-4 border-b border-border shrink-0">
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

        <nav className="flex-1 px-3 py-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-2.5 mb-1">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <Link key={item.url} href={item.url}>
                      <div
                        className={`flex items-center gap-2.5 h-8 px-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                          active
                            ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"
                            : "text-foreground/60 hover:text-foreground hover:bg-muted"
                        }`}
                        data-testid={`admin-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <item.icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-violet-600" : ""}`} />
                        {item.title}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3 space-y-0.5 shrink-0">
          <Link href="/dashboard">
            <div className="flex items-center gap-2.5 h-8 px-2.5 rounded-md text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-muted cursor-pointer transition-colors">
              <Heart className="w-3.5 h-3.5 shrink-0" />
              Dashboard User
            </div>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 h-8 px-2.5 rounded-md text-sm font-medium text-foreground/60 hover:text-destructive hover:bg-destructive/10 w-full transition-colors"
            data-testid="admin-button-logout"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
