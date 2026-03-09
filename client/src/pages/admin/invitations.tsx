import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Mail, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface AdminInvitation {
  id: string;
  userId: string;
  title: string;
  slug: string;
  theme: string;
  status: string;
  views: number;
  ownerUsername: string;
  publishedAt: string | null;
  createdAt: string;
}

export default function AdminInvitations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invitations, isLoading } = useQuery<AdminInvitation[]>({
    queryKey: ["/api/admin/invitations"],
  });

  const filtered = (invitations || []).filter(inv => {
    const matchSearch =
      inv.title.toLowerCase().includes(search.toLowerCase()) ||
      inv.slug.toLowerCase().includes(search.toLowerCase()) ||
      inv.ownerUsername.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (status: string) => {
    if (status === "published") return <Badge className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-200">Aktif</Badge>;
    if (status === "archived") return <Badge variant="secondary" className="text-xs">Arsip</Badge>;
    return <Badge variant="outline" className="text-xs">Draft</Badge>;
  };

  const themeLabel: Record<string, string> = {
    classic_elegant: "Classic",
    minimal_modern: "Minimal",
    romantic_floral: "Floral",
    luxury_gold: "Luxury",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">Semua Undangan</h1>
        <p className="text-sm text-muted-foreground">
          {invitations ? `${invitations.length} undangan terdaftar di platform` : "Memuat data..."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul, slug, atau pemilik..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="admin-input-search-invitations"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="admin-select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="published">Aktif</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Arsip</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Tidak ada undangan ditemukan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => (
            <Card key={inv.id} className="border border-card-border" data-testid={`admin-inv-row-${inv.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{inv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          /invite/{inv.slug} · @{inv.ownerUsername} · {themeLabel[inv.theme] || inv.theme}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{inv.views} views</span>
                        {statusBadge(inv.status)}
                        {inv.status === "published" && (
                          <a
                            href={`/invite/${inv.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="icon" variant="ghost" className="w-6 h-6" data-testid={`admin-button-view-inv-${inv.id}`}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
