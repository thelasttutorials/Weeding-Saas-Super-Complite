import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mail, CheckSquare, MessageSquare, Gift, TrendingUp } from "lucide-react";

interface PlatformStats {
  totalUsers: number;
  totalInvitations: number;
  publishedInvitations: number;
  totalRsvp: number;
  totalMessages: number;
  totalGiftConfirmations: number;
}

const statConfig = [
  { key: "totalUsers", label: "Total Pengguna", icon: Users, color: "bg-violet-500/10 text-violet-600" },
  { key: "totalInvitations", label: "Total Undangan", icon: Mail, color: "bg-rose-500/10 text-rose-600" },
  { key: "publishedInvitations", label: "Undangan Aktif", icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-600" },
  { key: "totalRsvp", label: "Total RSVP", icon: CheckSquare, color: "bg-blue-500/10 text-blue-600" },
  { key: "totalMessages", label: "Pesan Tamu", icon: MessageSquare, color: "bg-amber-500/10 text-amber-600" },
  { key: "totalGiftConfirmations", label: "Konfirmasi Gift", icon: Gift, color: "bg-pink-500/10 text-pink-600" },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Statistik keseluruhan platform WedSaaS</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statConfig.map((s) => (
          <Card key={s.key} className="border border-card-border">
            <CardContent className="p-5">
              <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-4 h-4" />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-extrabold text-foreground tracking-tight" data-testid={`admin-stat-${s.key}`}>
                  {stats?.[s.key as keyof PlatformStats] ?? 0}
                </p>
              )}
              <p className="text-sm text-muted-foreground font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && (
        <Card className="border border-card-border">
          <CardContent className="p-5">
            <p className="font-semibold text-foreground mb-1">Tingkat Publikasi</p>
            <p className="text-sm text-muted-foreground mb-3">
              {stats.publishedInvitations} dari {stats.totalInvitations} undangan dipublikasikan
            </p>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${stats.totalInvitations > 0 ? Math.round((stats.publishedInvitations / stats.totalInvitations) * 100) : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
