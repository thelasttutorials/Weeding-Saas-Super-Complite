import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Eye, Users, MessageSquare, Gift, TrendingUp } from "lucide-react";
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

const COLORS = ["hsl(340,75%,45%)", "hsl(280,65%,45%)", "hsl(200,70%,40%)", "hsl(25,75%,50%)"];

export default function Analytics() {
  const [selectedInvId, setSelectedInvId] = useState<string>("");

  const { data: invitations } = useQuery<Invitation[]>({ queryKey: ["/api/invitations"] });
  const currentInvId = selectedInvId || invitations?.[0]?.id || "";

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/invitations", currentInvId, "analytics"],
    enabled: !!currentInvId,
  });

  const rsvpData = analytics ? [
    { name: "Hadir", value: analytics.attending },
    { name: "Tidak Hadir", value: analytics.notAttending },
    { name: "Pending", value: analytics.pending },
  ] : [];

  const summaryData = analytics ? [
    { name: "Views", value: analytics.views, icon: Eye, color: "text-primary" },
    { name: "Total RSVP", value: analytics.totalRsvp, icon: Users, color: "text-green-600 dark:text-green-400" },
    { name: "Pesan Tamu", value: analytics.messages, icon: MessageSquare, color: "text-blue-600 dark:text-blue-400" },
    { name: "Konfirmasi Gift", value: analytics.giftConfirmations, icon: Gift, color: "text-amber-600 dark:text-amber-400" },
  ] : [];

  const conversionRate = analytics && analytics.views > 0
    ? Math.round((analytics.totalRsvp / analytics.views) * 100)
    : 0;

  const barData = analytics ? [
    { name: "Views", value: analytics.views },
    { name: "Total RSVP", value: analytics.totalRsvp },
    { name: "Hadir", value: analytics.attending },
    { name: "Pesan", value: analytics.messages },
  ] : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Pantau performa undangan pernikahanmu</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summaryData.map((s) => (
              <Card key={s.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs text-muted-foreground">{s.name}</p>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground" data-testid={`analytics-${s.name.toLowerCase().replace(/\s+/g, "-")}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Conversion Rate */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium text-sm text-foreground">Tingkat Konversi RSVP</p>
                  <p className="text-xs text-muted-foreground">Dari total pengunjung yang mengisi RSVP</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-xl font-bold text-primary" data-testid="analytics-conversion-rate">{conversionRate}%</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(conversionRate, 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Ringkasan Statistik</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }}
                  />
                  <Bar dataKey="value" fill="hsl(340,75%,45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - RSVP Breakdown */}
          {analytics && analytics.totalRsvp > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Status RSVP</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={rsvpData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {rsvpData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
