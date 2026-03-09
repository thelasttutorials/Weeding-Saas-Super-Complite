import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Mail, ExternalLink, Globe, FileEdit, Archive, Eye } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  brideName?: string;
  groomName?: string;
}

export default function AdminInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invitations, isLoading } = useQuery<AdminInvitation[]>({
    queryKey: ["/api/admin/invitations"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiRequest("POST", `/api/admin/invitations/${id}/${action}`, {}),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
      toast({ title: `Undangan berhasil di-${variables.action}!` });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
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
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground truncate">{inv.title}</p>
                          {statusBadge(inv.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate font-medium">
                          Pemilik: <span className="text-foreground">@{inv.ownerUsername}</span> · Tema: {themeLabel[inv.theme] || inv.theme}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">
                          URL: <span className="underline">/invite/{inv.slug}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md mr-1">
                          <Eye className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[11px] font-semibold text-foreground">{inv.views}</span>
                        </div>

                        {inv.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                            onClick={() => updateStatusMutation.mutate({ id: inv.id, action: "publish" })}
                            data-testid={`admin-button-publish-inv-${inv.id}`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Publikasikan
                          </Button>
                        )}
                        {inv.status === "published" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1"
                              onClick={() => updateStatusMutation.mutate({ id: inv.id, action: "unpublish" })}
                              data-testid={`admin-button-unpublish-inv-${inv.id}`}
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              Ke Draft
                            </Button>
                            <a
                              href={`/invite/${inv.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="icon" variant="ghost" className="w-8 h-8" data-testid={`admin-button-view-inv-${inv.id}`}>
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          </>
                        )}
                        {inv.status !== "archived" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => updateStatusMutation.mutate({ id: inv.id, action: "archive" })}
                            data-testid={`admin-button-archive-inv-${inv.id}`}
                            title="Arsipkan"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
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
