import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PricingPlan, InsertPricingPlan, insertPricingPlanSchema, PricingPlanFeature } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Check, X, GripVertical, Star, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

type PlanWithFeatures = PricingPlan & { features: PricingPlanFeature[] };

export default function PricingAdminPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanWithFeatures | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery<PlanWithFeatures[]>({
    queryKey: ["/api/admin/pricing"],
  });

  const form = useForm<InsertPricingPlan>({
    resolver: zodResolver(insertPricingPlanSchema),
    defaultValues: {
      name: "",
      slug: "",
      shortDescription: "",
      price: 0,
      billingType: "monthly",
      priceLabel: "",
      badgeText: "",
      highlightColor: "#e11d48",
      sortOrder: 0,
      isActive: true,
      isPopular: false,
      ctaText: "Pilih Paket",
      ctaLink: "/register",
    },
  });

  // Features are handled separately via a sub-resource endpoint
  const [features, setFeatures] = useState<{ featureName: string; included: boolean }[]>([]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertPricingPlan) => {
      const res = await apiRequest("POST", "/api/admin/pricing", data);
      const plan = await res.json();
      // After creating plan, update features
      await apiRequest("PUT", `/api/admin/pricing/${plan.id}/features`, { features });
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({ title: "Sukses", description: "Paket harga berhasil dibuat" });
      setIsDialogOpen(false);
      form.reset();
      setFeatures([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PricingPlan>) => {
      const res = await apiRequest("PATCH", `/api/admin/pricing/${editingPlan!.id}`, data);
      const plan = await res.json();
      // Update features
      await apiRequest("PUT", `/api/admin/pricing/${plan.id}/features`, { features });
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({ title: "Sukses", description: "Paket harga berhasil diperbarui" });
      setIsDialogOpen(false);
      setEditingPlan(null);
      form.reset();
      setFeatures([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/pricing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({ title: "Sukses", description: "Paket harga berhasil dihapus" });
      setPlanToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/admin/pricing/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
    },
  });

  const togglePopularMutation = useMutation({
    mutationFn: async ({ id, isPopular }: { id: string; isPopular: boolean }) => {
      await apiRequest("PATCH", `/api/admin/pricing/${id}`, { isPopular });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
    },
  });

  const onSubmit = (data: InsertPricingPlan) => {
    if (editingPlan) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (plan: PlanWithFeatures) => {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      slug: plan.slug,
      shortDescription: plan.shortDescription,
      price: plan.price,
      billingType: plan.billingType,
      priceLabel: plan.priceLabel,
      badgeText: plan.badgeText,
      highlightColor: plan.highlightColor,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      ctaText: plan.ctaText,
      ctaLink: plan.ctaLink,
    });
    setFeatures((plan.features || []).map(f => ({ featureName: f.featureName, included: f.included })));
    setIsDialogOpen(true);
  };

  const addFeature = () => {
    setFeatures([...features, { featureName: "", included: true }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: "featureName" | "included", value: any) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paket Harga</h1>
          <p className="text-muted-foreground">Kelola paket langganan dan fitur-fiturnya.</p>
        </div>
        <Button 
          onClick={() => {
            setEditingPlan(null);
            form.reset();
            setFeatures([]);
            setIsDialogOpen(true);
          }}
          data-testid="button-add-plan"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Paket
        </Button>
      </div>

      {!plans || plans.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Belum Ada Paket Harga</CardTitle>
          <CardDescription className="mt-2 max-w-sm">
            Mulai dengan membuat paket harga pertama Anda untuk ditawarkan kepada pelanggan.
          </CardDescription>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Buat Paket Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all hover:shadow-md ${plan.isPopular ? 'border-primary shadow-sm' : ''}`}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-md">Terpopuler</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.shortDescription}</CardDescription>
                  </div>
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? "Gratis" : `Rp ${plan.price.toLocaleString()}`}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {plan.priceLabel || (plan.billingType === "monthly" ? "/ bulan" : plan.billingType === "yearly" ? "/ tahun" : "")}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fitur Utama:</p>
                  <ul className="space-y-2 text-sm">
                    {(plan.features || []).slice(0, 5).map((feature) => (
                      <li key={feature.id} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground line-through"}>
                          {feature.featureName}
                        </span>
                      </li>
                    ))}
                    {(plan.features || []).length > 5 && (
                      <li className="text-muted-foreground text-xs italic">
                        + {(plan.features || []).length - 5} fitur lainnya
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEdit(plan)}
                  data-testid={`button-edit-${plan.id}`}
                >
                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => setPlanToDelete(plan.id)}
                  data-testid={`button-delete-${plan.id}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Hapus
                </Button>
                <div className="w-full flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => toggleActiveMutation.mutate({ id: plan.id, isActive: !plan.isActive })}
                    disabled={toggleActiveMutation.isPending}
                  >
                    {plan.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => togglePopularMutation.mutate({ id: plan.id, isPopular: !plan.isPopular })}
                    disabled={togglePopularMutation.isPending}
                  >
                    {plan.isPopular ? "Unset Populer" : "Set Populer"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Paket" : "Tambah Paket"}</DialogTitle>
            <DialogDescription>
              Isi formulir di bawah untuk {editingPlan ? "memperbarui" : "membuat"} paket harga.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Paket</FormLabel>
                      <FormControl>
                        <Input placeholder="Misal: Premium" {...field} data-testid="input-plan-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="misal: premium" {...field} data-testid="input-plan-slug" />
                      </FormControl>
                      <FormDescription>Digunakan untuk URL atau identifier.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi Singkat</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ringkasan singkat apa yang didapat dari paket ini" 
                        {...field} 
                        data-testid="input-plan-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga (IDR)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                          data-testid="input-plan-price" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Billing</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-billing-type">
                            <SelectValue placeholder="Pilih tipe billing" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="one_time">Sekali Bayar</SelectItem>
                          <SelectItem value="monthly">Bulanan</SelectItem>
                          <SelectItem value="yearly">Tahunan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priceLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label Harga</FormLabel>
                      <FormControl>
                        <Input placeholder="Misal: / selamanya" {...field} data-testid="input-price-label" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="badgeText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teks Badge</FormLabel>
                      <FormControl>
                        <Input placeholder="Misal: Hemat 20%" {...field} data-testid="input-badge-text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="highlightColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warna Highlight</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="color" {...field} className="w-12 h-9 p-1" data-testid="input-highlight-color" />
                        </FormControl>
                        <Input {...field} placeholder="#e11d48" className="flex-1" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ctaText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teks Tombol CTA</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-cta-text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ctaLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link CTA</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-cta-link" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urutan</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                          data-testid="input-sort-order" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Aktif</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Terpopuler</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-popular"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Fitur Paket</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Fitur
                  </Button>
                </div>

                {features.length === 0 ? (
                  <div className="text-center py-4 border rounded-md border-dashed text-muted-foreground text-sm">
                    Belum ada fitur yang ditambahkan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Checkbox 
                          checked={feature.included} 
                          onCheckedChange={(checked) => updateFeature(index, "included", !!checked)}
                        />
                        <Input 
                          placeholder="Nama fitur (misal: Undangan Tanpa Batas)" 
                          value={feature.featureName}
                          onChange={(e) => updateFeature(index, "featureName", e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-plan"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPlan ? "Simpan Perubahan" : "Buat Paket"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Paket harga akan dihapus secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => planToDelete && deleteMutation.mutate(planToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreditCard(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
