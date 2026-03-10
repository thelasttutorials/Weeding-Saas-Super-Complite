import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CheckCircle, XCircle, ExternalLink, Eye, Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { Payment } from "@shared/schema";

type AdminPayment = Payment & { username: string; email: string };

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  waiting_confirmation: "Menunggu Verifikasi",
  paid: "Lunas",
  rejected: "Ditolak",
  expired: "Kadaluarsa",
  canceled: "Dibatalkan",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  waiting_confirmation: "secondary",
  paid: "default",
  rejected: "destructive",
  expired: "outline",
  canceled: "outline",
};

function formatRp(v: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
}

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<AdminPayment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  const { data: payments, isLoading } = useQuery<AdminPayment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const filtered = payments?.filter(p => {
    const matchSearch = !search || p.username.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()) || p.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/payments/${id}/approve`, { notes: approveNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      setApproveOpen(false);
      setSelected(null);
      setApproveNotes("");
      toast({ title: "Pembayaran disetujui!", description: "Plan user telah diupdate." });
    },
    onError: async (err: any) => {
      let msg = "Gagal menyetujui.";
      try { const d = await err.json(); msg = d.message || msg; } catch {}
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/payments/${id}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      setRejectOpen(false);
      setSelected(null);
      setRejectReason("");
      toast({ title: "Pembayaran ditolak." });
    },
    onError: async (err: any) => {
      let msg = "Gagal menolak.";
      try { const d = await err.json(); msg = d.message || msg; } catch {}
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} disalin!` });
  };

  const pendingCount = payments?.filter(p => p.status === "waiting_confirmation").length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Pembayaran</h1>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="gap-1.5" data-testid="badge-pending-count">
              {pendingCount} menunggu verifikasi
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">Kelola dan verifikasi pembayaran transfer bank pengguna.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari invoice, username, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-payments"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[220px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu Pembayaran</SelectItem>
                <SelectItem value="waiting_confirmation">Menunggu Verifikasi</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="expired">Kadaluarsa</SelectItem>
                <SelectItem value="canceled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Kode Unik</TableHead>
                  <TableHead>Total Transfer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      Tidak ada pembayaran ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered?.map(p => (
                    <TableRow key={p.id} data-testid={`payment-row-${p.id}`}>
                      <TableCell className="font-mono text-xs">{p.invoiceNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.username}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{p.plan}</Badge></TableCell>
                      <TableCell className="text-sm">{formatRp(p.amount)}</TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-primary" data-testid={`unique-code-${p.id}`}>
                          {String(p.uniqueCode).padStart(3, "0")}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-sm" data-testid={`final-amount-${p.id}`}>{formatRp(p.finalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[p.status] || "outline"} className="text-xs" data-testid={`status-${p.id}`}>
                          {STATUS_LABEL[p.status] || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(p.createdAt), "d MMM yyyy", { locale: localeId })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelected(p)}
                            data-testid={`button-detail-${p.id}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {p.status === "waiting_confirmation" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => { setSelected(p); setApproveOpen(true); }}
                                data-testid={`button-approve-${p.id}`}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => { setSelected(p); setRejectOpen(true); }}
                                data-testid={`button-reject-${p.id}`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected && !approveOpen && !rejectOpen} onOpenChange={o => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">Invoice</p><p className="font-mono font-medium">{selected.invoiceNumber}</p></div>
                <div><p className="text-muted-foreground">Status</p><Badge variant={STATUS_VARIANT[selected.status]}>{STATUS_LABEL[selected.status]}</Badge></div>
                <div><p className="text-muted-foreground">Pengguna</p><p className="font-medium">{selected.username}</p><p className="text-xs text-muted-foreground">{selected.email}</p></div>
                <div><p className="text-muted-foreground">Paket</p><p className="font-medium capitalize">{selected.plan}</p></div>
                <div><p className="text-muted-foreground">Nominal Asli</p><p className="font-medium">{formatRp(selected.amount)}</p></div>
                <div>
                  <p className="text-muted-foreground">Kode Unik</p>
                  <div className="flex items-center gap-1">
                    <p className="font-mono font-bold text-primary">{String(selected.uniqueCode).padStart(3, "0")}</p>
                    <button onClick={() => copyText(String(selected.uniqueCode), "Kode unik")} className="text-muted-foreground hover:text-foreground">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Transfer</p>
                  <p className="font-bold text-primary">{formatRp(selected.finalAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal</p>
                  <p>{format(new Date(selected.createdAt), "d MMM yyyy, HH:mm", { locale: localeId })}</p>
                </div>
                {selected.expiresAt && (
                  <div>
                    <p className="text-muted-foreground">Kadaluarsa</p>
                    <p>{format(new Date(selected.expiresAt), "d MMM yyyy, HH:mm", { locale: localeId })}</p>
                  </div>
                )}
                {selected.paidAt && (
                  <div>
                    <p className="text-muted-foreground">Lunas Pada</p>
                    <p>{format(new Date(selected.paidAt), "d MMM yyyy, HH:mm", { locale: localeId })}</p>
                  </div>
                )}
              </div>
              {selected.transferProofUrl && (
                <div>
                  <p className="text-muted-foreground mb-1">Bukti Transfer</p>
                  <a href={selected.transferProofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline text-sm">
                    <ExternalLink className="w-3.5 h-3.5" /> Lihat bukti transfer
                  </a>
                </div>
              )}
              {selected.rejectedReason && (
                <div>
                  <p className="text-muted-foreground mb-1">Alasan Penolakan</p>
                  <p className="text-destructive">{selected.rejectedReason}</p>
                </div>
              )}
              {selected.adminNotes && (
                <div>
                  <p className="text-muted-foreground mb-1">Catatan Admin</p>
                  <p>{selected.adminNotes}</p>
                </div>
              )}
              {selected.status === "waiting_confirmation" && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => setApproveOpen(true)} data-testid="button-open-approve">
                    <CheckCircle className="w-4 h-4" /> Setujui
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-2" onClick={() => setRejectOpen(true)} data-testid="button-open-reject">
                    <XCircle className="w-4 h-4" /> Tolak
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={o => { if (!o) { setApproveOpen(false); setApproveNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Pembayaran</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <p><span className="text-muted-foreground">Invoice:</span> <span className="font-mono">{selected.invoiceNumber}</span></p>
                <p><span className="text-muted-foreground">Pengguna:</span> {selected.username}</p>
                <p><span className="text-muted-foreground">Total Transfer:</span> <strong>{formatRp(selected.finalAmount)}</strong></p>
                <p><span className="text-muted-foreground">Paket:</span> <span className="capitalize">{selected.plan}</span></p>
              </div>
              <div className="space-y-2">
                <Label>Catatan Admin (Opsional)</Label>
                <Textarea
                  placeholder="Catatan verifikasi..."
                  value={approveNotes}
                  onChange={e => setApproveNotes(e.target.value)}
                  rows={2}
                  data-testid="input-approve-notes"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Batal</Button>
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => selected && approveMutation.mutate(selected.id)}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Setujui & Aktifkan Paket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={o => { if (!o) { setRejectOpen(false); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pembayaran</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-mono">{selected.invoiceNumber}</p>
                <p>{selected.username} — {formatRp(selected.finalAmount)}</p>
              </div>
              <div className="space-y-2">
                <Label>Alasan Penolakan <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Nominal transfer tidak sesuai / bukti tidak jelas / ..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  data-testid="input-reject-reason"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Batal</Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => selected && rejectMutation.mutate(selected.id)}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Tolak Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
