import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Crown, Zap, Building2, Copy, ExternalLink, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { BankAccount, Payment } from "@shared/schema";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "Rp 0",
    amount: 0,
    period: "selamanya",
    icon: Zap,
    features: ["1 undangan digital", "Tema basic (Classic Elegant)", "Form RSVP", "Pesan tamu", "Watermark WedSaaS"],
    notIncluded: ["Tema premium", "Digital gift", "Analytics", "Tanpa watermark"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "Rp 99.000",
    amount: 99000,
    period: "per undangan",
    icon: Crown,
    features: ["Semua fitur Free", "Semua tema premium", "Digital gift registry", "Analytics lengkap", "Tanpa watermark", "Prioritas support"],
    notIncluded: [],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: "Rp 299.000",
    amount: 299000,
    period: "per bulan",
    icon: Building2,
    features: ["Undangan tidak terbatas", "Semua fitur Premium", "White label", "Custom domain (segera hadir)", "Dedicated support"],
    notIncluded: [],
  },
];

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

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  const { data: bankAccounts, isLoading: bankLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
    enabled: !!selectedPlan,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const createMutation = useMutation({
    mutationFn: (plan: string) => apiRequest("POST", "/api/payments", { plan }),
    onSuccess: async (res) => {
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/payments"] });
      setSelectedPlan(null);
      setLocation(`/dashboard/billing/${data.id}`);
    },
    onError: async (err: any) => {
      let msg = "Gagal membuat invoice.";
      try { const d = await err.json(); msg = d.message || msg; } catch {}
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const handleUpgrade = (plan: typeof plans[0]) => {
    if (plan.id === "free") return;
    setSelectedPlan(plan);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Langganan</h1>
        <p className="text-sm text-muted-foreground">Pilih paket yang sesuai dengan kebutuhanmu</p>
      </div>

      {/* Current Plan Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Paket Saat Ini</p>
              <p className="text-lg font-bold text-foreground capitalize">{user?.plan || "Free"}</p>
            </div>
            <Badge variant={user?.plan === "premium" ? "default" : user?.plan === "business" ? "default" : "secondary"} className="capitalize">
              {user?.plan === "premium" && <Crown className="w-3 h-3 mr-1" />}
              {user?.plan || "Free"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isCurrentPlan = user?.plan === plan.id;
          return (
            <Card key={plan.id} className={`relative ${plan.highlighted ? "border-primary shadow-md" : ""}`} data-testid={`plan-card-${plan.id}`}>
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="text-xs">Paling Populer</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${plan.highlighted ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <plan.icon className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {isCurrentPlan && <Badge variant="secondary" className="text-xs ml-auto">Aktif</Badge>}
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground line-through opacity-50">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrentPlan ? "secondary" : plan.highlighted ? "default" : "outline"}
                  className="w-full"
                  disabled={isCurrentPlan || plan.id === "free"}
                  onClick={() => handleUpgrade(plan)}
                  data-testid={`button-select-plan-${plan.id}`}
                >
                  {isCurrentPlan ? "Paket Aktif" : plan.id === "free" ? "Gratis" : `Pilih ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !payments || payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada riwayat pembayaran.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-testid={`payment-row-${p.id}`}>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.plan} — {formatRp(p.finalAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[p.status] || "outline"} className="text-xs" data-testid={`status-badge-${p.id}`}>
                      {STATUS_LABEL[p.status] || p.status}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => setLocation(`/dashboard/billing/${p.id}`)} data-testid={`button-view-invoice-${p.id}`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground text-center">
            Butuh bantuan? Hubungi kami di{" "}
            <a href="mailto:hello@wedsaas.app" className="text-primary font-medium">hello@wedsaas.app</a>
          </p>
        </CardContent>
      </Card>

      {/* Checkout Modal */}
      <Dialog open={!!selectedPlan} onOpenChange={(o) => { if (!o) setSelectedPlan(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout — Paket {selectedPlan?.name}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-5">
              {/* Order summary */}
              <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paket</span>
                  <span className="font-medium capitalize">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Harga</span>
                  <span className="font-medium">{selectedPlan.price} / {selectedPlan.period}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="font-medium">Transfer Bank</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Nominal Transfer</span>
                    <span className="text-primary">{selectedPlan.price} + kode unik 3 digit</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Kode unik akan ditampilkan setelah invoice dibuat untuk memudahkan identifikasi pembayaran.</p>
                </div>
              </div>

              {/* Bank accounts preview */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Rekening Tujuan</p>
                {bankLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : bankAccounts && bankAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {bankAccounts.slice(0, 2).map((ba) => (
                      <div key={ba.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm">
                        <div className="w-10 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">{ba.bankName}</div>
                        <div>
                          <p className="font-mono font-medium">{ba.accountNumber}</p>
                          <p className="text-xs text-muted-foreground">{ba.accountName}</p>
                        </div>
                      </div>
                    ))}
                    {bankAccounts.length > 2 && (
                      <p className="text-xs text-muted-foreground">+{bankAccounts.length - 2} rekening lainnya tersedia di halaman invoice</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Memuat rekening...</p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">Invoice berlaku <strong>24 jam</strong>. Segera lakukan transfer dan upload bukti sebelum invoice kadaluarsa.</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedPlan(null)} data-testid="button-cancel-checkout">Batal</Button>
                <Button
                  className="flex-1"
                  onClick={() => createMutation.mutate(selectedPlan.id)}
                  disabled={createMutation.isPending}
                  data-testid="button-create-invoice"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Buat Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
