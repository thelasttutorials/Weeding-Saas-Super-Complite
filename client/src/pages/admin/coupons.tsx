import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCouponSchema, type Coupon } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Ticket } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AdminCoupons() {
  const { toast } = useToast();
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/coupons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Sukses", description: "Kupon berhasil dibuat" });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/coupons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Sukses", description: "Kupon berhasil diperbarui" });
      setIsDialogOpen(false);
      setEditingCoupon(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Sukses", description: "Kupon berhasil dihapus" });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertCouponSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 0,
      minAmount: 0,
      maxUses: null,
      isActive: true,
      description: "",
      applicablePlans: [],
    },
  });

  const onSubmit = (data: any) => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.reset({
      code: coupon.code,
      discountType: coupon.discountType as "percentage" | "fixed",
      discountValue: coupon.discountValue,
      minAmount: coupon.minAmount,
      maxUses: coupon.maxUses,
      isActive: coupon.isActive,
      description: coupon.description,
      applicablePlans: coupon.applicablePlans || [],
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kupon Diskon</h1>
          <p className="text-muted-foreground">Kelola kupon diskon untuk pembayaran paket.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCoupon(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-coupon">
              <Plus className="mr-2 h-4 w-4" /> Tambah Kupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? "Edit Kupon" : "Tambah Kupon Baru"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Kupon</FormLabel>
                    <FormControl><Input placeholder="PROMO2024" {...field} data-testid="input-coupon-code" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="discountType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Diskon</FormLabel>
                      <FormControl>
                        <select className="w-full p-2 rounded-md border" {...field} data-testid="select-discount-type">
                          <option value="percentage">Persentase (%)</option>
                          <option value="fixed">Nominal Tetap (Rp)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="discountValue" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nilai Diskon</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-discount-value" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="minAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min. Transaksi (Rp)</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-min-amount" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="maxUses" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maks. Penggunaan (Kosongkan jika tidak terbatas)</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)} data-testid="input-max-uses" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-coupon">
                  {editingCoupon ? "Perbarui" : "Simpan"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Diskon</TableHead>
              <TableHead>Min. Transaksi</TableHead>
              <TableHead>Penggunaan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Memuat...</TableCell></TableRow>
            ) : coupons?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center">Belum ada kupon.</TableCell></TableRow>
            ) : coupons?.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    {coupon.code}
                  </div>
                </TableCell>
                <TableCell>
                  {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `Rp ${coupon.discountValue.toLocaleString()}`}
                </TableCell>
                <TableCell>Rp {coupon.minAmount.toLocaleString()}</TableCell>
                <TableCell>{coupon.usedCount} / {coupon.maxUses || "∞"}</TableCell>
                <TableCell>
                  <Badge variant={coupon.isActive ? "default" : "secondary"}>
                    {coupon.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(coupon)} data-testid={`button-edit-coupon-${coupon.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => {
                      if (confirm("Hapus kupon ini?")) deleteMutation.mutate(coupon.id);
                    }} data-testid={`button-delete-coupon-${coupon.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
