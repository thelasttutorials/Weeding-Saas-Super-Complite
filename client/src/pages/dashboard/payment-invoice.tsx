import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Copy, Clock, CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft,
  ExternalLink, Upload, ImageIcon, Timer, FileText, Paperclip, Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { Payment, BankAccount } from "@shared/schema";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  waiting_confirmation: "Menunggu Verifikasi Admin",
  paid: "Lunas",
  rejected: "Ditolak",
  expired: "Kadaluarsa",
  canceled: "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
  waiting_confirmation: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
  paid: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900",
  rejected: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
  expired: "text-muted-foreground bg-muted border-border",
  canceled: "text-muted-foreground bg-muted border-border",
};

function formatRp(v: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
}

function useCountdown(expiresAt: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const calc = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return timeLeft;
}

function CountdownDisplay({ expiresAt, status }: { expiresAt: string | null | undefined; status: string }) {
  const t = useCountdown(expiresAt);
  if (!expiresAt || status !== "pending") return null;
  if (t.expired) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
        <p className="text-sm text-red-700 dark:text-red-300 font-medium">Invoice ini sudah kadaluarsa. Buat invoice baru untuk melanjutkan pembayaran.</p>
      </div>
    );
  }
  const urgent = t.hours === 0 && t.minutes < 30;
  return (
    <div className={`p-4 rounded-lg border ${urgent ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Timer className={`w-4 h-4 ${urgent ? "text-red-600" : "text-amber-600"}`} />
        <p className={`text-sm font-medium ${urgent ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
          Sisa waktu pembayaran:
        </p>
      </div>
      <div className="flex gap-3">
        {[{ v: t.hours, l: "Jam" }, { v: t.minutes, l: "Menit" }, { v: t.seconds, l: "Detik" }].map(({ v, l }) => (
          <div key={l} className="text-center">
            <div className={`w-14 h-12 rounded-lg border flex items-center justify-center ${urgent ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800" : "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-900"}`}>
              <span className={`text-xl font-bold font-mono ${urgent ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
                {String(v).padStart(2, "0")}
              </span>
            </div>
            <p className={`text-xs mt-1 ${urgent ? "text-red-600" : "text-amber-600"}`}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentTimeline({ status, createdAt, paidAt }: { status: string; createdAt: string; paidAt: string | null | undefined }) {
  const steps = [
    { key: "created", label: "Invoice Dibuat", done: true },
    { key: "pending", label: "Menunggu Transfer", done: ["waiting_confirmation", "paid"].includes(status) },
    { key: "proof", label: "Bukti Transfer Dikirim", done: ["waiting_confirmation", "paid"].includes(status) },
    { key: "verify", label: "Menunggu Verifikasi Admin", done: status === "paid" },
    { key: "paid", label: status === "rejected" ? "Pembayaran Ditolak" : "Pembayaran Dikonfirmasi", done: status === "paid" || status === "rejected", rejected: status === "rejected" },
  ];
  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
            step.rejected ? "border-destructive bg-destructive/10" :
            step.done ? "border-green-500 bg-green-50 dark:bg-green-950/30" :
            "border-muted bg-background"
          }`}>
            {step.rejected ? <XCircle className="w-3.5 h-3.5 text-destructive" /> :
             step.done ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> :
             <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
          </div>
          <p className={`text-sm ${step.done || step.rejected ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {step.label}
            {step.key === "created" && <span className="text-xs text-muted-foreground ml-2 font-normal">{format(new Date(createdAt), "d MMM yyyy, HH:mm", { locale: localeId })}</span>}
            {step.key === "paid" && paidAt && step.done && <span className="text-xs text-muted-foreground ml-2 font-normal">{format(new Date(paidAt), "d MMM yyyy, HH:mm", { locale: localeId })}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function PaymentInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: payment, isLoading, error } = useQuery<Payment>({
    queryKey: ["/api/payments", id],
    queryFn: () => fetch(`/api/payments/${id}`).then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); }),
    refetchInterval: 30000,
  });

  const { data: bankAccounts } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const proofMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/payments/${id}/upload-proof`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Gagal mengupload file.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setProofFile(null);
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "Bukti transfer terkirim!", description: "Admin akan memverifikasi pembayaran dalam 1x24 jam." });
    },
    onError: (err: any) => {
      toast({ title: "Upload Gagal", description: err.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) { setProofFile(null); return; }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Tipe file tidak diizinkan. Hanya JPG, PNG, WebP, dan PDF.");
      setProofFile(null);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      setFileError(`Ukuran file terlalu besar. Maksimal 5 MB (file ini ${formatBytes(file.size)}).`);
      setProofFile(null);
      e.target.value = "";
      return;
    }
    setProofFile(file);
  };

  const cancelMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/payments/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setCancelOpen(false);
      toast({ title: "Invoice dibatalkan." });
    },
  });

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} disalin!` });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">Invoice tidak ditemukan</h2>
        <Link href="/dashboard/subscription">
          <Button variant="outline">Kembali ke Langganan</Button>
        </Link>
      </div>
    );
  }

  const canSubmitProof = payment.status === "pending";
  const isActive = payment.status === "pending" || payment.status === "waiting_confirmation";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/subscription">
          <Button size="icon" variant="ghost" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Detail Invoice</h1>
          <p className="text-sm text-muted-foreground font-mono">{payment.invoiceNumber}</p>
        </div>
        <div className="ml-auto">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${STATUS_COLOR[payment.status] || "bg-muted"}`} data-testid="invoice-status-badge">
            {STATUS_LABEL[payment.status] || payment.status}
          </div>
        </div>
      </div>

      {/* Countdown */}
      <CountdownDisplay expiresAt={payment.expiresAt?.toString()} status={payment.status} />

      {/* Rejection reason */}
      {payment.status === "rejected" && payment.rejectedReason && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Pembayaran Ditolak</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{payment.rejectedReason}</p>
            <Link href="/dashboard/subscription">
              <Button size="sm" variant="outline" className="mt-3">Buat Invoice Baru</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Paid confirmation */}
      {payment.status === "paid" && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Pembayaran Dikonfirmasi</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-0.5">Paket <strong className="capitalize">{payment.plan}</strong> kamu sudah aktif.</p>
          </div>
        </div>
      )}

      {/* Invoice Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Paket</p>
              <p className="font-medium capitalize">{payment.plan}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Metode</p>
              <p className="font-medium">Transfer Bank</p>
            </div>
            <div>
              <p className="text-muted-foreground">Nominal Paket</p>
              <p className="font-medium">{formatRp(payment.amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kode Unik</p>
              <div className="flex items-center gap-1">
                <p className="font-mono font-bold text-primary" data-testid="unique-code">{String(payment.uniqueCode).padStart(3, "0")}</p>
                <button onClick={() => copyText(String(payment.uniqueCode), "Kode unik")} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Final amount highlight */}
          <div className="mt-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Total yang harus ditransfer:</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-primary" data-testid="final-amount">{formatRp(payment.finalAmount)}</p>
              <button
                onClick={() => copyText(String(payment.finalAmount), "Nominal transfer")}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border"
                data-testid="button-copy-amount"
              >
                <Copy className="w-3.5 h-3.5" /> Salin
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatRp(payment.amount)} + kode unik <strong>{payment.uniqueCode}</strong> = {formatRp(payment.finalAmount)}
            </p>
          </div>

          {payment.expiresAt && isActive && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Berlaku hingga: {format(new Date(payment.expiresAt), "d MMMM yyyy, HH:mm", { locale: localeId })} WIB
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Accounts */}
      {isActive && bankAccounts && bankAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rekening Tujuan Transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bankAccounts.map((ba) => (
              <div key={ba.id} className="flex items-center gap-3 p-3 rounded-lg border" data-testid={`bank-account-${ba.id}`}>
                <div className="w-14 h-10 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                  {ba.bankName}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-semibold text-foreground">{ba.accountNumber}</p>
                  <p className="text-xs text-muted-foreground">{ba.accountName}</p>
                  {ba.branch && <p className="text-xs text-muted-foreground">{ba.branch}</p>}
                </div>
                <button
                  onClick={() => copyText(ba.accountNumber, `Nomor rekening ${ba.bankName}`)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`button-copy-account-${ba.id}`}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Langkah Pembayaran:</p>
              <p>1. Transfer sesuai nominal yang tertera (termasuk kode unik)</p>
              <p>2. Pastikan nominal transfer tepat untuk memudahkan verifikasi</p>
              <p>3. Upload bukti transfer di bawah ini</p>
              <p>4. Admin akan memverifikasi maksimal 1×24 jam</p>
              <p>5. Paket aktif setelah pembayaran dikonfirmasi</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Proof */}
      {canSubmitProof && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Bukti Transfer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              data-testid="input-proof-file"
              onChange={handleFileChange}
            />

            {/* Drop zone / file selector */}
            {!proofFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20 transition-colors cursor-pointer"
                data-testid="button-select-file"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Klik untuk pilih file</p>
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP, atau PDF — maksimal 5 MB</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30" data-testid="file-preview">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  {proofFile.type === "application/pdf"
                    ? <FileText className="w-5 h-5 text-primary" />
                    : <ImageIcon className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{proofFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(proofFile.size)} · {proofFile.type.split("/")[1].toUpperCase()}</p>
                </div>
                <button
                  onClick={() => {
                    setProofFile(null);
                    setFileError(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  data-testid="button-remove-file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Validation error */}
            {fileError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20" data-testid="file-error">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{fileError}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Format yang diterima: JPG, JPEG, PNG, WebP, PDF</p>
              <p>Ukuran maksimal: 5 MB</p>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => proofFile && proofMutation.mutate(proofFile)}
              disabled={!proofFile || !!fileError || proofMutation.isPending}
              data-testid="button-submit-proof"
            >
              {proofMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Kirim Bukti Transfer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Proof already submitted */}
      {payment.status === "waiting_confirmation" && payment.transferProofUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Bukti Transfer Terkirim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <a href={payment.transferProofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                Lihat bukti transfer <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Admin sedang memproses pembayaran kamu. Harap tunggu konfirmasi.</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentTimeline status={payment.status} createdAt={payment.createdAt.toString()} paidAt={payment.paidAt?.toString()} />
        </CardContent>
      </Card>

      {/* Cancel button */}
      {payment.status === "pending" && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCancelOpen(true)} data-testid="button-cancel-invoice">
            Batalkan Invoice
          </Button>
        </div>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Invoice?</AlertDialogTitle>
            <AlertDialogDescription>Invoice akan dibatalkan dan kamu harus membuat invoice baru untuk melakukan pembayaran.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tidak</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
