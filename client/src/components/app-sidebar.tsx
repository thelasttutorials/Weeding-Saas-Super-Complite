import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Mail, CheckSquare, MessageSquare,
  Gift, BarChart3, CreditCard, Settings, Heart, LogOut, Crown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Invitations", url: "/dashboard/invitations", icon: Mail },
  { title: "RSVP", url: "/dashboard/rsvp", icon: CheckSquare },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Digital Gift", url: "/dashboard/gifts", icon: Gift },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
];

const bottomItems = [
  { title: "Subscription", url: "/dashboard/subscription", icon: CreditCard },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (url: string) => {
    if (url === "/dashboard") return location === "/dashboard";
    return location.startsWith(url);
  };

  const planColor = user?.plan === "premium" ? "text-amber-500" : user?.plan === "business" ? "text-violet-500" : "text-muted-foreground";

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
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 mb-1">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const active = isActive(item.url);
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

        <SidebarGroup className="px-2 mt-2">
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 mb-1">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {bottomItems.map((item) => {
                const active = isActive(item.url);
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
            <TooltipContent side="top">Sign out</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
