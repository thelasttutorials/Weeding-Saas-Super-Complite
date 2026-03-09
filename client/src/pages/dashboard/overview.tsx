import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Mail, Users, MessageSquare, Eye, TrendingUp, PlusCircle, ArrowRight, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Invitation } from "@shared/schema";

function StatCard({ title, value, icon: Icon, desc, loading }: { title: string; value: number | string; icon: any; desc?: string; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
            )}
            {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
          </div>
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Overview() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalInvitations: number;
    totalRsvp: number;
    totalMessages: number;
    totalViews: number;
    attendingCount: number;
  }>({ queryKey: ["/api/stats"] });

  const { data: invitations, isLoading: invLoading } = useQuery<Invitation[]>({
    queryKey: ["/api/invitations"],
  });

  const recentInvitations = invitations?.slice(0, 3) || [];

  const attendanceRate = stats && stats.totalRsvp > 0
    ? Math.round((stats.attendingCount / stats.totalRsvp) * 100)
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Selamat datang, {user?.fullName?.split(" ")[0] || user?.username}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Kelola semua undangan pernikahanmu di sini.</p>
        </div>
        <Link href="/dashboard/invitations">
          <Button className="gap-2" data-testid="button-create-invitation">
            <PlusCircle className="w-4 h-4" />
            Buat Undangan
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Undangan" value={stats?.totalInvitations || 0} icon={Mail} loading={statsLoading} />
        <StatCard title="Total RSVP" value={stats?.totalRsvp || 0} icon={Users} desc={`${stats?.attendingCount || 0} hadir`} loading={statsLoading} />
        <StatCard title="Pesan Tamu" value={stats?.totalMessages || 0} icon={MessageSquare} loading={statsLoading} />
        <StatCard title="Total Views" value={stats?.totalViews || 0} icon={Eye} loading={statsLoading} />
      </div>

      {/* Attendance Rate */}
      {(stats?.totalRsvp || 0) > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-sm font-medium text-foreground">Tingkat Kehadiran</p>
                <p className="text-xs text-muted-foreground">{stats?.attendingCount} dari {stats?.totalRsvp} tamu konfirmasi hadir</p>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold text-primary" data-testid="stat-attendance-rate">{attendanceRate}%</span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invitations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Undangan Terbaru</h2>
          <Link href="/dashboard/invitations">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        {invLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : recentInvitations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Belum ada undangan</h3>
              <p className="text-sm text-muted-foreground mb-4">Buat undangan pernikahan digitalmu yang pertama sekarang!</p>
              <Link href="/dashboard/invitations">
                <Button size="sm" data-testid="button-create-first-invitation">Buat Undangan Pertama</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentInvitations.map((inv) => (
              <Card key={inv.id} className="hover-elevate" data-testid={`card-invitation-${inv.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-primary fill-current" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{inv.title}</p>
                        <p className="text-xs text-muted-foreground">wedsaas.app/invite/{inv.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={inv.status === "published" ? "default" : inv.status === "archived" ? "secondary" : "outline"}>
                        {inv.status === "published" ? "Dipublish" : inv.status === "archived" ? "Diarsip" : "Draft"}
                      </Badge>
                      <Link href={`/dashboard/builder/${inv.id}`}>
                        <Button size="sm" variant="ghost" data-testid={`button-edit-${inv.id}`}>Edit</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Plan Banner */}
      {user?.plan === "free" && (
        <Card className="bg-gradient-to-r from-primary/5 to-rose-500/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">Upgrade ke Premium</p>
                <p className="text-sm text-muted-foreground mt-0.5">Akses semua tema, analytics, dan digital gift tanpa watermark.</p>
              </div>
              <Link href="/dashboard/subscription">
                <Button size="sm" data-testid="button-upgrade">Upgrade Sekarang</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
