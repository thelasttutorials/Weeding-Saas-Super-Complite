import { ReactNode, useState } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Users, Mail, LogOut, Heart, Shield,
  Star, HelpCircle, CreditCard, Receipt, Settings, Globe,
  FileText, Menu, X, Palette
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    label: "Tema",
    items: [
      { title: "Library Tema", url: "/admin/themes", icon: Palette },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.isAdmin) return <Redirect to="/dashboard" />;

  const isActive = (url: string) => {
    if (url === "/admin") return location === "/admin";
    return location.startsWith(url);
  };

  const SidebarContent = () => (
    <>
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
                  <Link key={item.url} href={item.url} onClick={() => setIsMobileMenuOpen(false)}>
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
        <div className="px-2.5 py-2 mb-2 bg-muted/50 rounded-lg">
          <p className="text-xs font-semibold text-foreground truncate">{user.fullName || user.username}</p>
          <Badge variant="secondary" className="mt-1 text-[10px] h-4 px-1">Admin</Badge>
        </div>
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
    </>
  );

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden relative">
      {/* Mobile Sticky Header */}
      <header className="lg:hidden sticky top-0 left-0 right-0 h-14 bg-background border-b border-border flex items-center justify-between px-4 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            data-testid="button-admin-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 bg-background border-r border-border flex-col shrink-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-background z-50 lg:hidden flex flex-col shadow-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-end p-2 border-b">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col">
              <SidebarContent />
            </div>
          </aside>
        </>
      )}

      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
