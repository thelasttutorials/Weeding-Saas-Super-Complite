import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Plus, Trash2, CreditCard, Wallet, Loader2, Copy, MapPin, Save, CheckCircle, PackageCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invitation, GiftAccount, GiftConfirmation } from "@shared/schema";

export default function GiftSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedInvId, setSelectedInvId] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({ type: "bank", bankName: "", accountNumber: "", accountHolder: "", walletName: "", walletNumber: "" });
  const [giftAddress, setGiftAddress] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);

  const { data: invitations } = useQuery<Invitation[]>({ queryKey: ["/api/invitations"] });
  const currentInvId = selectedInvId || invitations?.[0]?.id || "";
  const currentInv = invitations?.find(inv => inv.id === currentInvId);

  useEffect(() => {
    if (currentInv) {
      setGiftAddress(currentInv.giftAddress || "");
    }
  }, [currentInvId, currentInv?.giftAddress]);

  const { data: gifts, isLoading: giftsLoading } = useQuery<GiftAccount[]>({
    queryKey: ["/api/invitations", currentInvId, "gifts"],
    enabled: !!currentInvId,
  });

  const { data: confirmations, isLoading: confirmationsLoading } = useQuery<GiftConfirmation[]>({
    queryKey: ["/api/invitations", currentInvId, "gift-confirmations"],
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

  const saveAddress = async () => {
    if (!currentInvId) return;
    setAddressSaving(true);
    try {
      await apiRequest("PATCH", `/api/invitations/${currentInvId}`, { giftAddress });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      setAddressSaved(true);
      setTimeout(() => setAddressSaved(false), 2500);
    } catch (err: any) {
      toast({ title: "Gagal menyimpan alamat", description: err.message, variant: "destructive" });
    } finally {
      setAddressSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Disalin!" });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Digital Gift</h1>
          <p className="text-sm text-muted-foreground">Kelola rekening, alamat hadiah, dan konfirmasi transfer dari tamu</p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)} disabled={!currentInvId} data-testid="button-add-gift">
          <Plus className="w-4 h-4" />
          Tambah Rekening
        </Button>
      </div>

      {invitations && invitations.length > 1 && (
        <Select value={currentInvId} onValueChange={setSelectedInvId}>
          <SelectTrigger className="w-full sm:w-72" data-testid="select-invitation-gifts">
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
      ) : (
        <>
          {/* ── Alamat Kirim Hadiah ── */}
          <Card className="border border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Alamat Kirim Hadiah
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Opsional — isi jika ingin menerima hadiah fisik. Akan ditampilkan di halaman undangan.</p>
              <Textarea
                value={giftAddress}
                onChange={e => setGiftAddress(e.target.value)}
                placeholder="Jl. Mawar No. 10, RT 01/RW 02, Kelurahan Sukamaju, Kecamatan Indah, Jakarta Selatan 12345"
                className="min-h-[80px] resize-none"
                data-testid="textarea-gift-address"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={saveAddress}
                disabled={addressSaving}
                className="gap-2"
                data-testid="button-save-gift-address"
              >
                {addressSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : addressSaved ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {addressSaved ? "Tersimpan!" : "Simpan Alamat"}
              </Button>
            </CardContent>
          </Card>

          {/* ── Rekening Bank & E-Wallet ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                Rekening Bank & E-Wallet
              </h2>
            </div>
            {giftsLoading ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : !gifts || gifts.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Gift className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <h3 className="font-semibold text-foreground mb-1">Belum ada rekening</h3>
                  <p className="text-sm text-muted-foreground mb-4">Tambahkan rekening bank atau e-wallet untuk menerima amplop digital.</p>
                  <Button size="sm" onClick={() => setAddOpen(true)} data-testid="button-add-first-gift">Tambah Rekening</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {gifts.map((gift) => (
                  <Card key={gift.id} className="border border-card-border" data-testid={`gift-card-${gift.id}`}>
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
                            <p className="text-xs text-muted-foreground">{gift.accountHolder}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8"
                            onClick={() => copyToClipboard(gift.type === "bank" ? gift.accountNumber : gift.walletNumber)}
                            title="Salin nomor"
                            data-testid={`button-copy-gift-${gift.id}`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-destructive"
                            onClick={() => deleteMutation.mutate(gift.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-gift-${gift.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ── Konfirmasi Hadiah ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-muted-foreground" />
                Konfirmasi Hadiah
                {confirmations && confirmations.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{confirmations.length}</Badge>
                )}
              </h2>
            </div>
            {confirmationsLoading ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !confirmations || confirmations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <PackageCheck className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Belum ada konfirmasi hadiah dari tamu.</p>
                  <p className="text-xs text-muted-foreground mt-1">Tamu bisa mengisi form konfirmasi di halaman undangan.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {confirmations.map((conf) => (
                  <Card key={conf.id} className="border border-card-border" data-testid={`confirmation-card-${conf.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Gift className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{conf.name}</p>
                            {conf.amount && (
                              <p className="text-xs text-emerald-600 font-medium">{conf.amount}</p>
                            )}
                            {conf.message && (
                              <p className="text-xs text-muted-foreground mt-0.5 italic">"{conf.message}"</p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {new Date(conf.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
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
