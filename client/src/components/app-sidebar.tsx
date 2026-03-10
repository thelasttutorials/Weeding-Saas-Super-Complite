import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Mail, CheckSquare, MessageSquare,
  Gift, BarChart3, CreditCard, Settings, Heart, LogOut, Crown,
  Images, Shield, Globe, Image,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navGroups = [
  {
    label: "Undangan",
    items: [
      { title: "Overview", url: "/dashboard", exact: true, icon: LayoutDashboard },
      { title: "Undangan", url: "/dashboard/invitations", icon: Mail },
      { title: "RSVP", url: "/dashboard/rsvp", icon: CheckSquare },
      { title: "Pesan Tamu", url: "/dashboard/messages", icon: MessageSquare },
      { title: "Digital Gift", url: "/dashboard/gifts", icon: Gift },
      { title: "Galeri", url: "/dashboard/gallery", icon: Images },
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Konten",
    items: [
      { title: "Media Library", url: "/dashboard/media", icon: Image },
    ],
  },
  {
    label: "Akun",
    items: [
      { title: "Domain", url: "/dashboard/domain", icon: Globe },
      { title: "Langganan", url: "/dashboard/subscription", icon: CreditCard },
      { title: "Pengaturan", url: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (url: string, exact?: boolean) => {
    if (exact) return location === url;
    if (url === "/dashboard") return location === "/dashboard";
    return location.startsWith(url);
  };

  const planColor =
    user?.plan === "premium"
      ? "text-amber-500"
      : user?.plan === "business"
        ? "text-violet-500"
        : "text-muted-foreground";

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Heart className="w-4 h-4 text-primary-foreground fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-foreground text-sm tracking-tight">WedSaaS</span>
            <span className="text-[10px] text-muted-foreground leading-none font-medium">Wedding Platform</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="pt-3 pb-2 gap-0">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="px-2 mb-1">
            <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.url, item.exact);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        data-active={active}
                        className={`h-9 rounded-md transition-all ${
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            : "text-sidebar-foreground/70 font-medium"
                        }`}
                      >
                        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                          <item.icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {user?.isAdmin && (
          <SidebarGroup className="px-2 mt-1">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-9 rounded-md transition-all text-violet-600 dark:text-violet-400 font-medium hover:bg-violet-50 dark:hover:bg-violet-500/10"
                  >
                    <Link href="/admin" data-testid="nav-admin-panel">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
              {(user?.fullName || user?.username || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              {user?.fullName || user?.username}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {user?.plan === "premium" && <Crown className={`w-3 h-3 ${planColor}`} />}
              <span className={`text-[11px] font-medium capitalize ${planColor}`}>
                {user?.plan || "Free"}
              </span>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="p-1.5 rounded-md text-muted-foreground hover-elevate shrink-0"
                data-testid="button-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Logout</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
