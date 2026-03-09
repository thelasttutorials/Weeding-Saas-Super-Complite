import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { Eye, Users, MessageSquare, Gift, TrendingUp, CheckCircle, XCircle, Clock, Info } from "lucide-react";
import type { Invitation } from "@shared/schema";

interface AnalyticsData {
  views: number;
  totalRsvp: number;
  attending: number;
  notAttending: number;
  pending: number;
  messages: number;
  giftConfirmations: number;
}

const PIE_COLORS = ["hsl(142,71%,45%)", "hsl(0,72%,51%)", "hsl(38,92%,50%)"];

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-muted rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function Analytics() {
  const [selectedInvId, setSelectedInvId] = useState<string>("");

  const { data: invitations } = useQuery<Invitation[]>({ queryKey: ["/api/invitations"] });
  const currentInvId = selectedInvId || invitations?.[0]?.id || "";
  const currentInv = invitations?.find(inv => inv.id === currentInvId);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/invitations", currentInvId, "analytics"],
    enabled: !!currentInvId,
  });

  const attendanceRate = analytics && analytics.totalRsvp > 0
    ? Math.round((analytics.attending / analytics.totalRsvp) * 100)
    : 0;

  const conversionRate = analytics && analytics.views > 0
    ? Math.round((analytics.totalRsvp / analytics.views) * 100)
    : null;

  const rsvpPieData = analytics && analytics.totalRsvp > 0 ? [
    { name: "Hadir", value: analytics.attending },
    { name: "Tidak Hadir", value: analytics.notAttending },
    { name: "Pending", value: analytics.pending },
  ].filter(d => d.value > 0) : [];

  const summaryCards = analytics ? [
    { label: "Kunjungan Halaman", value: analytics.views, icon: Eye, color: "text-primary", note: "total buka halaman undangan" },
    { label: "Total RSVP", value: analytics.totalRsvp, icon: Users, color: "text-violet-600 dark:text-violet-400", note: `${analytics.attending} hadir · ${analytics.notAttending} tidak · ${analytics.pending} pending` },
    { label: "Pesan Tamu", value: analytics.messages, icon: MessageSquare, color: "text-blue-600 dark:text-blue-400", note: "ucapan dari tamu" },
    { label: "Konfirmasi Hadiah", value: analytics.giftConfirmations, icon: Gift, color: "text-amber-600 dark:text-amber-400", note: "konfirmasi transfer/hadiah" },
  ] : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Data nyata aktivitas undangan pernikahanmu</p>
      </div>

      {invitations && invitations.length > 1 && (
        <Select value={currentInvId} onValueChange={setSelectedInvId}>
          <SelectTrigger className="w-full sm:w-72" data-testid="select-invitation-analytics">
            <SelectValue placeholder="Pilih undangan" />
          </SelectTrigger>
          <SelectContent>
            {invitations.map(inv => (
              <SelectItem key={inv.id} value={inv.id}>{inv.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!currentInvId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><p>Buat undangan untuk melihat analytics</p></CardContent></Card>
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Status undangan */}
          {currentInv && (
            <div className="flex items-center gap-2">
              <Badge
                className={currentInv.status === "published" ? "bg-emerald-600 text-white border-0 text-xs" : "text-xs"}
                variant={currentInv.status === "published" ? "default" : "outline"}
              >
                {currentInv.status === "published" ? "✓ Live" : "Draft"}
              </Badge>
              {currentInv.status !== "published" && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Data views & RSVP hanya masuk saat undangan berstatus Live
                </p>
              )}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summaryCards.map((s) => (
              <Card key={s.label} className="border border-card-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground" data-testid={`analytics-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">{s.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* RSVP Breakdown */}
          {analytics && analytics.totalRsvp > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Progress Bars */}
              <Card className="border border-card-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Rincian RSVP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Hadir
                      </span>
                      <span className="font-bold text-foreground">
                        {analytics.attending}
                        <span className="text-xs text-muted-foreground ml-1 font-normal">
                          ({analytics.totalRsvp > 0 ? Math.round(analytics.attending / analytics.totalRsvp * 100) : 0}%)
                        </span>
                      </span>
                    </div>
                    <ProgressBar value={analytics.attending} max={analytics.totalRsvp} color="bg-emerald-500" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-red-500 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Tidak Hadir
                      </span>
                      <span className="font-bold text-foreground">
                        {analytics.notAttending}
                        <span className="text-xs text-muted-foreground ml-1 font-normal">
                          ({analytics.totalRsvp > 0 ? Math.round(analytics.notAttending / analytics.totalRsvp * 100) : 0}%)
                        </span>
                      </span>
                    </div>
                    <ProgressBar value={analytics.notAttending} max={analytics.totalRsvp} color="bg-red-400" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                        <Clock className="w-3.5 h-3.5" /> Menunggu Konfirmasi
                      </span>
                      <span className="font-bold text-foreground">
                        {analytics.pending}
                        <span className="text-xs text-muted-foreground ml-1 font-normal">
                          ({analytics.totalRsvp > 0 ? Math.round(analytics.pending / analytics.totalRsvp * 100) : 0}%)
                        </span>
                      </span>
                    </div>
                    <ProgressBar value={analytics.pending} max={analytics.totalRsvp} color="bg-amber-400" />
                  </div>

                  <div className="pt-1 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Tingkat Kehadiran</span>
                      <span className="text-sm font-bold text-emerald-600" data-testid="analytics-attendance-rate">{attendanceRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              {rsvpPieData.length > 0 && (
                <Card className="border border-card-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Distribusi Status RSVP</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={rsvpPieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={45}
                          outerRadius={72}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {rsvpPieData.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border border-card-border">
              <CardContent className="py-8 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">Belum ada RSVP</p>
                <p className="text-xs text-muted-foreground mt-1">Data RSVP akan muncul setelah tamu mengisi formulir di halaman undangan.</p>
              </CardContent>
            </Card>
          )}

          {/* Conversion Rate */}
          {conversionRate !== null && analytics && analytics.views > 0 && (
            <Card className="border border-card-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="font-medium text-sm text-foreground">Rasio RSVP / Kunjungan</p>
                    <p className="text-xs text-muted-foreground">
                      {analytics.totalRsvp} RSVP dari {analytics.views} total kunjungan halaman
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xl font-bold text-primary" data-testid="analytics-conversion-rate">{conversionRate}%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(conversionRate, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  Kunjungan dihitung dari setiap kali halaman undangan dibuka (termasuk kunjungan berulang oleh tamu yang sama)
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
