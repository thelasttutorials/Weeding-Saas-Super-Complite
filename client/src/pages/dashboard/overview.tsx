import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Mail, Users, MessageSquare, Eye, TrendingUp, PlusCircle, ArrowRight, Heart, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Invitation } from "@shared/schema";

const statConfig = [
  { key: "totalInvitations", label: "Total Undangan", icon: Mail, color: "bg-rose-500/10 text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/10" },
  { key: "totalRsvp", label: "Total RSVP", icon: Users, color: "bg-violet-500/10 text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10" },
  { key: "totalMessages", label: "Pesan Tamu", icon: MessageSquare, color: "bg-blue-500/10 text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10" },
  { key: "totalViews", label: "Total Views", icon: Eye, color: "bg-emerald-500/10 text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
];

function StatCard({ title, value, icon: Icon, iconColor, subtext, loading }: {
  title: string; value: number | string; icon: any; iconColor: string; subtext?: string; loading?: boolean;
}) {
  return (
    <Card className="border border-card-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20 mb-1" />
        ) : (
          <p className="text-2xl font-extrabold text-foreground tracking-tight" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </p>
        )}
        <p className="text-sm text-muted-foreground font-medium mt-0.5">{title}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
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

  const recentInvitations = invitations?.slice(0, 4) || [];
  const firstName = user?.fullName?.split(" ")[0] || user?.username;

  const attendanceRate = stats && stats.totalRsvp > 0
    ? Math.round((stats.attendingCount / stats.totalRsvp) * 100)
    : 0;

  const statValues: Record<string, string | number> = {
    totalInvitations: stats?.totalInvitations || 0,
    totalRsvp: stats?.totalRsvp || 0,
    totalMessages: stats?.totalMessages || 0,
    totalViews: stats?.totalViews || 0,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-7 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">
              Halo, {firstName}! 👋
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Berikut ringkasan aktivitas undangan pernikahanmu.</p>
        </div>
        <Link href="/dashboard/invitations">
          <Button className="gap-2 font-semibold shadow-sm" data-testid="button-create-invitation">
            <PlusCircle className="w-4 h-4" />
            Buat Undangan
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statConfig.map((s) => (
          <StatCard
            key={s.key}
            title={s.label}
            value={statValues[s.key]}
            icon={s.icon}
            iconColor={s.color}
            subtext={s.key === "totalRsvp" ? `${stats?.attendingCount || 0} hadir` : undefined}
            loading={statsLoading}
          />
        ))}
      </div>

      {/* Attendance Rate */}
      {(stats?.totalRsvp || 0) > 0 && (
        <Card className="border border-card-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-bold text-foreground mb-0.5">Tingkat Kehadiran</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.attendingCount} dari {stats?.totalRsvp} tamu mengonfirmasi kehadiran
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-lg font-extrabold text-emerald-600" data-testid="stat-attendance-rate">{attendanceRate}%</span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invitations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground">Undangan Terbaru</h2>
          <Link href="/dashboard/invitations">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-sm font-medium">
              Lihat semua <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {invLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[72px] w-full rounded-xl" />)}
          </div>
        ) : recentInvitations.length === 0 ? (
          <Card className="border border-dashed border-border">
            <CardContent className="py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1.5">Belum ada undangan</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">Buat undangan pernikahan digitalmu yang pertama dan mulai bagikan ke semua tamu!</p>
              <Link href="/dashboard/invitations">
                <Button className="font-semibold" data-testid="button-create-first-invitation">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Buat Undangan Pertama
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {recentInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-4 p-4 bg-card border border-card-border rounded-xl hover-elevate-2 transition-all"
                data-testid={`card-invitation-${inv.id}`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{inv.title}</p>
                  <p className="text-xs text-muted-foreground truncate">/invite/{inv.slug}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant={inv.status === "published" ? "default" : inv.status === "archived" ? "secondary" : "outline"}
                    className="text-xs font-medium"
                  >
                    {inv.status === "published" ? "Aktif" : inv.status === "archived" ? "Arsip" : "Draft"}
                  </Badge>
                  <Link href={`/dashboard/builder/${inv.id}`}>
                    <Button size="sm" variant="ghost" className="text-xs h-7 font-medium" data-testid={`button-edit-${inv.id}`}>
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Banner */}
      {user?.plan === "free" && (
        <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/5 via-rose-500/5 to-pink-500/5 p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mt-0.5 flex-shrink-0">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">Upgrade ke Premium</p>
                <p className="text-sm text-muted-foreground mt-0.5">Buka semua tema, analytics lengkap, dan digital gift tanpa watermark.</p>
              </div>
            </div>
            <Link href="/dashboard/subscription">
              <Button size="sm" className="font-semibold shadow-sm shrink-0 gap-1.5" data-testid="button-upgrade">
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade Sekarang
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
