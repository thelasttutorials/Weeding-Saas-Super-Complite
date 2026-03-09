import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Plus, Trash2, CreditCard, Wallet, Loader2, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invitation, GiftAccount } from "@shared/schema";

export default function GiftSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedInvId, setSelectedInvId] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({ type: "bank", bankName: "", accountNumber: "", accountHolder: "", walletName: "", walletNumber: "" });

  const { data: invitations } = useQuery<Invitation[]>({ queryKey: ["/api/invitations"] });
  const currentInvId = selectedInvId || invitations?.[0]?.id || "";

  const { data: gifts, isLoading } = useQuery<GiftAccount[]>({
    queryKey: ["/api/invitations", currentInvId, "gifts"],
    enabled: !!currentInvId,
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/invitations/${currentInvId}/gifts`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", currentInvId, "gifts"] });
      setAddOpen(false);
      setFormData({ type: "bank", bankName: "", accountNumber: "", accountHolder: "", walletName: "", walletNumber: "" });
      toast({ title: "Rekening ditambahkan!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/gifts/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", currentInvId, "gifts"] });
      toast({ title: "Rekening dihapus" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Disalin!" });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Digital Gift</h1>
          <p className="text-sm text-muted-foreground">Kelola informasi rekening untuk amplop digital</p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)} disabled={!currentInvId} data-testid="button-add-gift">
          <Plus className="w-4 h-4" />
          Tambah Rekening
        </Button>
      </div>

      {invitations && invitations.length > 1 && (
        <Select value={currentInvId} onValueChange={setSelectedInvId}>
          <SelectTrigger className="w-full sm:w-72">
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
        <Card><CardContent className="py-12 text-center text-muted-foreground"><p>Belum ada undangan</p></CardContent></Card>
      ) : isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : !gifts || gifts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Gift className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground mb-2">Belum ada rekening</h3>
            <p className="text-sm text-muted-foreground mb-4">Tambahkan rekening bank atau e-wallet untuk menerima amplop digital dari tamu.</p>
            <Button onClick={() => setAddOpen(true)} data-testid="button-add-first-gift">Tambah Rekening</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {gifts.map((gift) => (
            <Card key={gift.id} data-testid={`gift-card-${gift.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      {gift.type === "bank" ? <CreditCard className="w-5 h-5 text-primary" /> : <Wallet className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground">
                          {gift.type === "bank" ? gift.bankName : gift.walletName}
                        </p>
                        <Badge variant="outline" className="text-xs capitalize">{gift.type === "bank" ? "Bank" : "E-Wallet"}</Badge>
                      </div>
                      <p className="text-sm text-foreground font-mono">{gift.type === "bank" ? gift.accountNumber : gift.walletNumber}</p>
                      <p className="text-xs text-muted-foreground">{gift.type === "bank" ? gift.accountHolder : gift.accountHolder}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(gift.type === "bank" ? gift.accountNumber : gift.walletNumber)}
                      title="Salin nomor"
                      data-testid={`button-copy-gift-${gift.id}`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(gift.id)}
                      className="text-destructive"
                      data-testid={`button-delete-gift-${gift.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Rekening</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Rekening</Label>
              <Select value={formData.type} onValueChange={v => setFormData(p => ({ ...p, type: v }))}>
                <SelectTrigger data-testid="select-gift-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Rekening Bank</SelectItem>
                  <SelectItem value="wallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === "bank" ? (
              <>
                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input value={formData.bankName} onChange={e => setFormData(p => ({ ...p, bankName: e.target.value }))} placeholder="BCA, BNI, Mandiri, dll." data-testid="input-bank-name" />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Rekening</Label>
                  <Input value={formData.accountNumber} onChange={e => setFormData(p => ({ ...p, accountNumber: e.target.value }))} placeholder="1234567890" data-testid="input-account-number" />
                </div>
                <div className="space-y-2">
                  <Label>Nama Pemilik</Label>
                  <Input value={formData.accountHolder} onChange={e => setFormData(p => ({ ...p, accountHolder: e.target.value }))} placeholder="Ahmad Ridwan" data-testid="input-account-holder" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Nama E-Wallet</Label>
                  <Input value={formData.walletName} onChange={e => setFormData(p => ({ ...p, walletName: e.target.value }))} placeholder="GoPay, OVO, DANA, dll." data-testid="input-wallet-name" />
                </div>
                <div className="space-y-2">
                  <Label>Nomor E-Wallet</Label>
                  <Input value={formData.walletNumber} onChange={e => setFormData(p => ({ ...p, walletNumber: e.target.value }))} placeholder="08123456789" data-testid="input-wallet-number" />
                </div>
                <div className="space-y-2">
                  <Label>Nama Pemilik</Label>
                  <Input value={formData.accountHolder} onChange={e => setFormData(p => ({ ...p, accountHolder: e.target.value }))} placeholder="Ahmad Ridwan" data-testid="input-wallet-holder" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending} data-testid="button-submit-gift">
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
