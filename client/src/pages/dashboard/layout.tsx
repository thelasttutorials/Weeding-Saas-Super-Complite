import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "Overview", description: "Selamat datang kembali! Berikut ringkasan aktivitas Anda." },
  "/dashboard/invitations": { title: "Undangan", description: "Kelola semua undangan pernikahan digital Anda." },
  "/dashboard/rsvp": { title: "Manajemen RSVP", description: "Pantau konfirmasi kehadiran tamu undangan." },
  "/dashboard/messages": { title: "Pesan Tamu", description: "Baca ucapan dan pesan dari tamu undangan." },
  "/dashboard/gifts": { title: "Digital Gift", description: "Atur akun bank dan e-wallet untuk hadiah digital." },
  "/dashboard/analytics": { title: "Analitik", description: "Pantau performa dan statistik undangan Anda." },
  "/dashboard/subscription": { title: "Berlangganan", description: "Pilih paket yang sesuai dengan kebutuhan Anda." },
  "/dashboard/settings": { title: "Pengaturan Akun", description: "Kelola informasi dan keamanan akun Anda." },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isBuilder = location.startsWith("/dashboard/builder/");
  const currentKey = Object.keys(pageMeta).find(key => {
    if (key === "/dashboard") return location === "/dashboard";
    return location.startsWith(key);
  });
  const meta = currentKey ? pageMeta[currentKey] : { title: "Dashboard", description: "" };

  return (
    <SidebarProvider style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full bg-muted/20 overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {!isBuilder && (
            <header className="flex items-center justify-between h-14 px-5 border-b border-border bg-background shrink-0">
              <div className="flex items-center gap-3">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="-ml-1" />
                <div className="h-4 w-px bg-border" />
                <div>
                  <h1 className="text-sm font-semibold text-foreground leading-tight">{meta.title}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover-elevate">
                  <Bell className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {(user?.fullName || user?.username || "U").charAt(0).toUpperCase()}
                </div>
              </div>
            </header>
          )}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
