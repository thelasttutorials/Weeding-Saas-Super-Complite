import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Globe, Settings2, Info, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CustomDomain {
  id: string;
  domain: string;
  status: "pending" | "active" | "failed";
  adminNotes: string | null;
}

export default function DomainSettings() {
  const { toast } = useToast();
  const [newDomain, setNewDomain] = useState("");

  const { data: domain, isLoading } = useQuery<CustomDomain | null>({
    queryKey: ["/api/domain"],
  });

  const mutation = useMutation({
    mutationFn: (domain: string) => apiRequest("POST", "/api/domain", { domain }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domain"] });
      toast({ title: "Sukses", description: "Permintaan domain berhasil dikirim" });
      setNewDomain("");
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    active: "default",
    failed: "destructive",
  };

  const STATUS_LABEL: Record<string, string> = {
    pending: "Sedang Diverifikasi",
    active: "Terhubung",
    failed: "Gagal Konfigurasi",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Custom Domain</h1>
        <p className="text-sm text-muted-foreground">Gunakan domain sendiri untuk undangan pernikahanmu (misal: budianisa.com)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Domain Kamu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              ) : domain ? (
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-1">
                    <p className="font-medium text-lg">{domain.domain}</p>
                    <Badge variant={STATUS_VARIANT[domain.status]}>
                      {STATUS_LABEL[domain.status]}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setNewDomain(domain.domain)} data-testid="button-change-domain">
                    Ganti
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">Nama Domain</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="domain"
                        placeholder="undangan.namamu.com" 
                        value={newDomain} 
                        onChange={(e) => setNewDomain(e.target.value)}
                        data-testid="input-new-domain"
                      />
                      <Button 
                        onClick={() => mutation.mutate(newDomain)}
                        disabled={mutation.isPending || !newDomain}
                        data-testid="button-submit-domain"
                      >
                        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Hubungkan
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {domain?.adminNotes && (
                <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-semibold mb-1">Catatan Admin:</p>
                    <p>{domain.adminNotes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Instruksi Setup DNS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Silakan tambahkan record DNS berikut di panel domain provider kamu (seperti Niagahoster, Rumahweb, dll):
              </p>
              <div className="space-y-3">
                <div className="p-3 rounded-md border bg-muted/50 font-mono text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-bold">A Record</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Host:</span>
                    <span className="font-bold">@ (atau namasubdomain)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-bold">76.76.21.21</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                  <span>Propagasi DNS biasanya memerlukan waktu 1-24 jam.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Informasi
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              Custom domain memungkinkan kamu memiliki alamat website undangan yang lebih personal dan profesional.
            </p>
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-primary shrink-0" />
              <p>Fitur ini hanya tersedia untuk pengguna paket <strong>Business</strong>.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
