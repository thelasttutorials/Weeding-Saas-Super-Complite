import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mail, CheckSquare, MessageSquare, Gift, TrendingUp, Star, HelpCircle, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface PlatformStats {
  totalUsers: number;
  totalInvitations: number;
  publishedInvitations: number;
  totalRsvp: number;
  totalMessages: number;
  totalGiftConfirmations: number;
  totalTestimonials: number;
  totalFaqs: number;
  recentUsers: any[];
  recentInvitations: any[];
}

const statConfig = [
  { key: "totalUsers", label: "Total Pengguna", icon: Users, color: "bg-violet-500/10 text-violet-600" },
  { key: "totalInvitations", label: "Total Undangan", icon: Mail, color: "bg-rose-500/10 text-rose-600" },
  { key: "publishedInvitations", label: "Undangan Aktif", icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-600" },
  { key: "totalRsvp", label: "Total RSVP", icon: CheckSquare, color: "bg-blue-500/10 text-blue-600" },
  { key: "totalMessages", label: "Pesan Tamu", icon: MessageSquare, color: "bg-amber-500/10 text-amber-600" },
  { key: "totalGiftConfirmations", label: "Konfirmasi Gift", icon: Gift, color: "bg-pink-500/10 text-pink-600" },
  { key: "totalTestimonials", label: "Testimoni", icon: Star, color: "bg-yellow-500/10 text-yellow-600" },
  { key: "totalFaqs", label: "FAQ", icon: HelpCircle, color: "bg-cyan-500/10 text-cyan-600" },
];

const QuickAction = ({ icon: Icon, label, href }: { icon: any; label: string; href: string }) => (
  <Link href={href}>
    <Button variant="outline" className="w-full justify-start gap-2 hover-elevate" data-testid={`button-quick-action-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Button>
  </Link>
);

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Platform Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Statistik keseluruhan platform WedSaaS</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statConfig.map((s) => (
          <Card key={s.key} className="border border-card-border overflow-hidden">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-4`}>
                <s.icon className="w-5 h-5" />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-extrabold text-foreground tracking-tight" data-testid={`admin-stat-${s.key}`}>
                  {stats?.[s.key as keyof PlatformStats] ?? 0}
                </p>
              )}
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-card-border">
          <CardContent className="p-0">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">Pengguna Terbaru</h2>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="text-xs">Lihat Semua</Button>
              </Link>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-5">User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="pr-5 text-right">Terdaftar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3} className="p-4"><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : stats?.recentUsers?.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/20">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px]">{user.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{user.fullName}</span>
                          <span className="text-[10px] text-muted-foreground">@{user.username}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px] font-bold">{user.plan}</Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-card-border">
            <CardContent className="p-5">
              <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-2">
                <QuickAction icon={Star} label="Tambah Testimoni" href="/admin/testimonials" />
                <QuickAction icon={HelpCircle} label="Tambah FAQ" href="/admin/faqs" />
                <QuickAction icon={CheckSquare} label="Tambah Paket" href="/admin/pricing" />
                <QuickAction icon={TrendingUp} label="Lihat Audit Log" href="/admin/logs" />
              </div>
            </CardContent>
          </Card>

          {stats && (
            <Card className="border border-card-border bg-emerald-500/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-emerald-700">Tingkat Publikasi</p>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {stats.totalInvitations > 0 ? Math.round((stats.publishedInvitations / stats.totalInvitations) * 100) : 0}%
                  </span>
                </div>
                <p className="text-xs text-emerald-600/80 mb-4 font-medium">
                  {stats.publishedInvitations} dari {stats.totalInvitations} undangan telah aktif di platform.
                </p>
                <div className="w-full bg-emerald-200/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${stats.totalInvitations > 0 ? Math.round((stats.publishedInvitations / stats.totalInvitations) * 100) : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="border border-card-border">
        <CardContent className="p-0">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-bold text-lg">Undangan Terbaru</h2>
            <Link href="/admin/invitations">
              <Button variant="ghost" size="sm" className="text-xs">Lihat Semua</Button>
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-5">Undangan</TableHead>
                <TableHead>Pemilik</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="p-4"><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : stats?.recentInvitations?.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/20">
                  <TableCell className="pl-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{inv.title}</span>
                      <span className="text-[10px] text-muted-foreground">/{inv.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium">@{inv.ownerUsername}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={inv.status === "published" ? "default" : "secondary"} className="text-[9px] uppercase font-bold px-1.5 h-4">
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-5 text-right text-xs text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
