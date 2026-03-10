import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QrCode, Scan, UserCheck, Search, Users, CheckCircle2, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Html5QrcodeScanner } from "html5-qrcode";
import type { Guest } from "@shared/schema";

export default function CheckinPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scannedToken, setScannedToken] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [lastScanned, setLastScanned] = useState<Guest | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<{ total: number, invited: number, rsvpAttending: number, checkedIn: number }>({
    queryKey: ["/api/invitations", id, "guests"],
    select: (d: any) => d.stats,
  });

  const checkinMutation = useMutation({
    mutationFn: (guestId: string) => apiRequest("POST", `/api/guests/${guestId}/checkin`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "guests"] });
      setLastScanned(res as Guest);
      toast({ title: "Check-in berhasil!", description: `Tamu ${(res as Guest).name} telah masuk.` });
      setScannedToken("");
    },
    onError: (err: any) => toast({ title: "Gagal Check-in", description: err.message, variant: "destructive" }),
  });

  const resolveTokenMutation = useMutation({
    mutationFn: (token: string) => fetch(`/api/guests/token/${token}`).then(r => {
      if (!r.ok) throw new Error("Token tidak valid");
      return r.json();
    }),
    onSuccess: (guest: Guest) => {
      if (guest.invitationId !== id) {
        toast({ title: "Token tidak valid", description: "Tamu ini bukan bagian dari undangan ini.", variant: "destructive" });
        return;
      }
      if (guest.checkedIn) {
        setLastScanned(guest);
        toast({ title: "Tamu sudah check-in", description: `Tamu ${guest.name} sudah check-in sebelumnya.`, variant: "default" });
      } else {
        checkinMutation.mutate(guest.id);
      }
    },
    onError: (err: any) => toast({ title: "Token tidak ditemukan", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render((decodedText) => {
      if (decodedText !== scannedToken) {
        setScannedToken(decodedText);
        resolveTokenMutation.mutate(decodedText);
      }
    }, (error) => {
      // Ignore scanning errors
    });

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, []);

  const handleManualCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    resolveTokenMutation.mutate(manualToken.trim());
    setManualToken("");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scan className="w-6 h-6 text-primary" />
            Check-in Tamu
          </h1>
          <p className="text-muted-foreground">Scan QR Code tamu atau masukkan kode manual untuk check-in.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "guests"] })} disabled={statsLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} /> Refresh Stats
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scanner Panel */}
        <Card className="md:col-span-2 overflow-hidden border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Scan QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div id="reader" className="w-full"></div>
            <div className="p-4 border-t bg-muted/30">
              <form onSubmit={handleManualCheckin} className="flex gap-2">
                <Input 
                  placeholder="Masukkan kode manual..." 
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="font-mono"
                  data-testid="input-manual-token"
                />
                <Button type="submit" disabled={resolveTokenMutation.isPending} data-testid="button-manual-checkin">
                  Check-in
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Last Scanned */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Statistik Kehadiran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Tamu</span>
                <span className="font-bold">{stats?.total ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Konfirmasi Hadir</span>
                <span className="font-bold text-emerald-600">{stats?.rsvpAttending ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Sudah Check-in</span>
                <span className="font-bold text-amber-600">{stats?.checkedIn ?? 0}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-medium">Progress</span>
                  <span className="font-bold">{stats?.total ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-500" 
                    style={{ width: `${stats?.total ? (stats.checkedIn / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {lastScanned && (
            <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5 animate-in slide-in-from-right-5 duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600">
                  <UserCheck className="w-4 h-4" />
                  Berhasil Check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-lg font-bold truncate">{lastScanned.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{lastScanned.category}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                    ${lastScanned.guestCount} Tamu
                  </Badge>
                  <span className="text-muted-foreground italic flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lastScanned.checkedInAt ? new Date(lastScanned.checkedInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => setLastScanned(null)}>
                  Tutup
                </Button>
              </CardFooter>
            </Card>
          )}

          {resolveTokenMutation.isPending && (
            <Card className="animate-pulse">
              <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium">Memproses token...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
