import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { MessageSquare, Eye, EyeOff, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invitation, GuestMessage } from "@shared/schema";

export default function GuestMessages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedInvId, setSelectedInvId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [visFilter, setVisFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const { data: invitations } = useQuery<Invitation[]>({ queryKey: ["/api/invitations"] });
  const currentInvId = selectedInvId || invitations?.[0]?.id || "";

  const { data: messages, isLoading } = useQuery<GuestMessage[]>({
    queryKey: ["/api/invitations", currentInvId, "messages"],
    enabled: !!currentInvId,
  });

  const toggleVisibility = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      apiRequest("PATCH", `/api/messages/${id}/visibility`, { visible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", currentInvId, "messages"] });
      toast({ title: "Visibilitas diubah" });
    },
  });

  const filtered = (messages || [])
    .filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.message.toLowerCase().includes(search.toLowerCase());
      const matchVis = visFilter === "all" || (visFilter === "visible" && m.isVisible) || (visFilter === "hidden" && !m.isVisible);
      return matchSearch && matchVis;
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pesan Tamu</h1>
        <p className="text-sm text-muted-foreground">Kelola ucapan dan doa dari para tamu</p>
      </div>

      {invitations && invitations.length > 1 && (
        <Select value={currentInvId} onValueChange={setSelectedInvId}>
          <SelectTrigger className="w-full sm:w-72" data-testid="select-invitation-messages">
            <SelectValue placeholder="Pilih undangan" />
          </SelectTrigger>
          <SelectContent>
            {invitations.map(inv => (
              <SelectItem key={inv.id} value={inv.id}>{inv.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Pesan</p>
            <p className="text-2xl font-bold text-foreground" data-testid="stat-total-messages">{messages?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Tampil di Undangan</p>
            <p className="text-2xl font-bold text-foreground" data-testid="stat-visible-messages">{messages?.filter(m => m.isVisible).length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari nama atau isi pesan..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-messages" />
        </div>
        <Select value={visFilter} onValueChange={setVisFilter}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-visibility-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pesan</SelectItem>
            <SelectItem value="visible">Tampil</SelectItem>
            <SelectItem value="hidden">Disembunyikan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={v => setSortOrder(v as "newest" | "oldest")}>
          <SelectTrigger className="w-full sm:w-40" data-testid="select-sort-messages">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Terbaru</SelectItem>
            <SelectItem value="oldest">Terlama</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!currentInvId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><p>Belum ada undangan</p></CardContent></Card>
      ) : isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Belum ada pesan tamu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => (
            <Card key={msg.id} className={!msg.isVisible ? "opacity-60" : ""} data-testid={`message-row-${msg.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-foreground">{msg.name}</p>
                      {!msg.isVisible && <Badge variant="secondary" className="text-xs">Disembunyikan</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">"{msg.message}"</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(msg.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleVisibility.mutate({ id: msg.id, visible: !msg.isVisible })}
                    title={msg.isVisible ? "Sembunyikan" : "Tampilkan"}
                    data-testid={`button-toggle-visibility-${msg.id}`}
                  >
                    {msg.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
