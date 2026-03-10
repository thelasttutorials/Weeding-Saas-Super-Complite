import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGuestSchema, type Guest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, UserPlus, Copy, Trash2, Edit2, QrCode, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";

export default function GuestManagement() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showQR, setShowQR] = useState<Guest | null>(null);

  const { data, isLoading } = useQuery<{ list: Guest[], stats: any }>({
    queryKey: ["/api/invitations", id, "guests"],
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => apiRequest("POST", `/api/invitations/${id}/guests`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "guests"] });
      toast({ title: "Tamu berhasil ditambahkan" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) => apiRequest("PATCH", `/api/guests/${editingGuest?.id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "guests"] });
      setEditingGuest(null);
      toast({ title: "Tamu berhasil diperbarui" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (guestId: string) => apiRequest("DELETE", `/api/guests/${guestId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "guests"] });
      toast({ title: "Tamu berhasil dihapus" });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertGuestSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      category: "lainnya",
      guestCount: 1,
      notes: "",
    },
  });

  const onSubmit = (values: any) => {
    if (editingGuest) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
      form.reset();
    }
  };

  const guests = data?.list || [];
  const stats = data?.stats || { total: 0, invited: 0, rsvpAttending: 0, checkedIn: 0 };

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.phone && g.phone.includes(searchTerm))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "attending": return <Badge className="bg-emerald-500 hover:bg-emerald-500">Hadir</Badge>;
      case "not_attending": return <Badge variant="destructive">Tidak Hadir</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${id}?guest=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link disalin ke clipboard" });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Tamu</h1>
          <p className="text-muted-foreground">Kelola daftar tamu dan pantau kehadiran mereka.</p>
        </div>
        
        <Dialog onOpenChange={(open) => { if (!open) setEditingGuest(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-guest">
              <UserPlus className="w-4 h-4" />
              Tambah Tamu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGuest ? "Edit Tamu" : "Tambah Tamu Baru"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl><Input {...field} placeholder="Contoh: Budi Santoso" data-testid="input-guest-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="keluarga">Keluarga</SelectItem>
                          <SelectItem value="teman">Teman</SelectItem>
                          <SelectItem value="kantor">Kantor</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                          <SelectItem value="lainnya">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="guestCount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Tamu</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-guest-count" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. WhatsApp</FormLabel>
                    <FormControl><Input {...field} placeholder="08123456789" data-testid="input-guest-phone" /></FormControl>
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-guest">
                    {editingGuest ? "Simpan Perubahan" : "Tambah Tamu"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Tamu</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Diundang</p>
            <p className="text-2xl font-bold text-blue-600">{stats.invited}</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Konfirmasi Hadir</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.rsvpAttending}</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Check-in</p>
            <p className="text-2xl font-bold text-amber-600">{stats.checkedIn}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama atau telepon..." 
              className="pl-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-guests"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>RSVP</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredGuests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Belum ada tamu yang terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuests.map((guest) => (
                  <TableRow key={guest.id} data-testid={`row-guest-${guest.id}`}>
                    <TableCell>
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-xs text-muted-foreground">{guest.phone || "-"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{guest.category}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(guest.rsvpStatus)}</TableCell>
                    <TableCell>
                      {guest.checkedIn ? (
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          {guest.checkedInAt ? new Date(guest.checkedInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "Done"}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock className="w-3 h-3" /> Belum
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => copyLink(guest.customLinkToken!)} title="Salin Link" data-testid={`button-copy-link-${guest.id}`}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setShowQR(guest)} title="QR Code" data-testid={`button-qr-${guest.id}`}>
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setEditingGuest(guest); form.reset(guest); }} title="Edit" data-testid={`button-edit-${guest.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if(confirm("Hapus tamu ini?")) deleteMutation.mutate(guest.id); }} title="Hapus" data-testid={`button-delete-${guest.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">QR Check-in</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-xl shadow-sm border">
              {showQR && (
                <QRCodeSVG 
                  value={showQR.customLinkToken!} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              )}
            </div>
            <div className="text-center">
              <p className="font-bold">{showQR?.name}</p>
              <p className="text-xs text-muted-foreground">{showQR?.category}</p>
            </div>
            <Button className="w-full" variant="outline" onClick={() => setShowQR(null)}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
