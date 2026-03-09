import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Users, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import type { Invitation, Rsvp } from "@shared/schema";

export default function RsvpManagement() {
  const [selectedInvId, setSelectedInvId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invitations } = useQuery<Invitation[]>({ queryKey: ["/api/invitations"] });

  const currentInvId = selectedInvId || invitations?.[0]?.id || "";

  const { data: rsvps, isLoading } = useQuery<Rsvp[]>({
    queryKey: ["/api/invitations", currentInvId, "rsvps"],
    enabled: !!currentInvId,
  });

  const filtered = (rsvps || []).filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: rsvps?.length || 0,
    attending: rsvps?.filter(r => r.status === "attending").length || 0,
    notAttending: rsvps?.filter(r => r.status === "not_attending").length || 0,
    pending: rsvps?.filter(r => r.status === "pending").length || 0,
    totalGuests: rsvps?.filter(r => r.status === "attending").reduce((s, r) => s + r.guestCount, 0) || 0,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">RSVP Management</h1>
        <p className="text-sm text-muted-foreground">Pantau konfirmasi kehadiran tamu undangan</p>
      </div>

      {/* Invitation Selector */}
      {invitations && invitations.length > 1 && (
        <Select value={currentInvId} onValueChange={setSelectedInvId}>
          <SelectTrigger className="w-full sm:w-72" data-testid="select-invitation-rsvp">
            <SelectValue placeholder="Pilih undangan" />
          </SelectTrigger>
          <SelectContent>
            {invitations.map(inv => (
              <SelectItem key={inv.id} value={inv.id}>{inv.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total RSVP", value: stats.total, icon: Users, color: "text-primary" },
          { label: "Hadir", value: stats.attending, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
          { label: "Tidak Hadir", value: stats.notAttending, icon: XCircle, color: "text-destructive" },
          { label: "Belum Konfirmasi", value: stats.pending, icon: Clock, color: "text-amber-600 dark:text-amber-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground" data-testid={`rsvp-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>{s.value}</p>
                </div>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.attending > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-foreground font-medium">
              Estimasi total tamu hadir: <span className="text-primary font-bold">{stats.totalGuests} orang</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama tamu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-rsvp"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-rsvp-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="attending">Hadir</SelectItem>
            <SelectItem value="not_attending">Tidak Hadir</SelectItem>
            <SelectItem value="pending">Belum Konfirmasi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {!currentInvId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><p>Belum ada undangan. Buat undangan terlebih dahulu.</p></CardContent></Card>
      ) : isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground text-sm">Belum ada data RSVP</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((rsvp) => (
            <Card key={rsvp.id} data-testid={`rsvp-row-${rsvp.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-foreground">{rsvp.name}</p>
                      <Badge
                        variant={rsvp.status === "attending" ? "default" : rsvp.status === "not_attending" ? "destructive" : "secondary"}
                        className="text-xs"
                        data-testid={`badge-rsvp-status-${rsvp.id}`}
                      >
                        {rsvp.status === "attending" ? "Hadir" : rsvp.status === "not_attending" ? "Tidak Hadir" : "Pending"}
                      </Badge>
                      {rsvp.status === "attending" && (
                        <Badge variant="outline" className="text-xs">{rsvp.guestCount} orang</Badge>
                      )}
                    </div>
                    {rsvp.whatsapp && <p className="text-xs text-muted-foreground">WhatsApp: {rsvp.whatsapp}</p>}
                    {rsvp.message && <p className="text-xs text-muted-foreground italic">"{rsvp.message}"</p>}
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(rsvp.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
