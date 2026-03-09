import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTestimonialSchema, type Testimonial, type InsertTestimonial } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Star, Plus, Edit2, Trash2, Quote, CheckCircle2, XCircle } from "lucide-react";

export default function AdminTestimonials() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTestimonial) => apiRequest("POST", "/api/admin/testimonials", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Testimoni ditambahkan" });
      setIsAddOpen(false);
    },
    onError: (err: Error) => toast({ title: "Gagal menambah testimoni", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertTestimonial> }) =>
      apiRequest("PATCH", `/api/admin/testimonials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Testimoni diperbarui" });
      setEditingTestimonial(null);
    },
    onError: (err: Error) => toast({ title: "Gagal memperbarui testimoni", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Testimoni dihapus" });
    },
    onError: (err: Error) => toast({ title: "Gagal menghapus testimoni", description: err.message, variant: "destructive" }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      apiRequest("PATCH", `/api/admin/testimonials/${id}`, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    },
  });

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Manajemen Testimoni</h1>
          <p className="text-muted-foreground">Kelola testimoni dari pasangan yang telah menggunakan layanan.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-testimonial">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Testimoni
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Testimoni Baru</DialogTitle>
            </DialogHeader>
            <TestimonialForm 
              onSubmit={(data) => createMutation.mutate(data)} 
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {testimonials?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Quote className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
            <h3 className="text-lg font-medium text-foreground">Belum ada testimoni</h3>
            <p className="text-muted-foreground mb-6">Mulai dengan menambahkan testimoni pertama Anda.</p>
            <Button variant="outline" onClick={() => setIsAddOpen(true)}>
              Tambah Testimoni
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials?.map((t) => (
            <Card key={t.id} className="flex flex-col hover-elevate overflow-visible">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {t.avatarInitials}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold leading-none">{t.coupleName}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{t.weddingDateLabel}</p>
                  </div>
                </div>
                <Badge variant={t.isPublished ? "default" : "secondary"} className="text-[10px] px-1.5 h-5">
                  {t.isPublished ? "Published" : "Draft"}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-4 italic">"{t.testimonialText}"</p>
              </CardContent>
              <div className="p-4 pt-0 flex justify-end gap-2 mt-auto">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => togglePublishMutation.mutate({ id: t.id, isPublished: !t.isPublished })}
                  data-testid={`button-toggle-publish-${t.id}`}
                >
                  {t.isPublished ? <XCircle className="w-4 h-4 text-orange-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </Button>
                <Dialog open={editingTestimonial?.id === t.id} onOpenChange={(open) => !open && setEditingTestimonial(null)}>
                  <DialogTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(t)}
                      data-testid={`button-edit-testimonial-${t.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Testimoni</DialogTitle>
                    </DialogHeader>
                    {editingTestimonial && (
                      <TestimonialForm
                        defaultValues={editingTestimonial}
                        onSubmit={(data) => updateMutation.mutate({ id: t.id, data })}
                        isPending={updateMutation.isPending}
                      />
                    )}
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      data-testid={`button-delete-testimonial-${t.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Testimoni?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Testimoni dari <strong>{t.coupleName}</strong> akan dihapus permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate(t.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialForm({ 
  onSubmit, 
  isPending, 
  defaultValues 
}: { 
  onSubmit: (data: InsertTestimonial) => void; 
  isPending: boolean;
  defaultValues?: Partial<InsertTestimonial>;
}) {
  const form = useForm<InsertTestimonial>({
    resolver: zodResolver(insertTestimonialSchema),
    defaultValues: {
      coupleName: defaultValues?.coupleName || "",
      avatarInitials: defaultValues?.avatarInitials || "",
      testimonialText: defaultValues?.testimonialText || "",
      rating: defaultValues?.rating ?? 5,
      weddingDateLabel: defaultValues?.weddingDateLabel || "",
      photo: defaultValues?.photo || "",
      sortOrder: defaultValues?.sortOrder ?? 0,
      isPublished: defaultValues?.isPublished ?? true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="coupleName"
            render={({ field }) => (
              <FormItem className="col-span-2 sm:col-span-1">
                <FormLabel>Nama Pasangan</FormLabel>
                <FormControl>
                  <Input placeholder="Budi & Susi" {...field} data-testid="input-couple-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="avatarInitials"
            render={({ field }) => (
              <FormItem className="col-span-2 sm:col-span-1">
                <FormLabel>Inisial Avatar</FormLabel>
                <FormControl>
                  <Input placeholder="BS" maxLength={2} {...field} data-testid="input-avatar-initials" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="testimonialText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Isi Testimoni</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ceritakan pengalaman mereka..." 
                  className="min-h-[100px] resize-none" 
                  {...field} 
                  data-testid="textarea-testimonial-text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(parseInt(val))} 
                  defaultValue={field.value?.toString() || "5"}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-rating">
                      <SelectValue placeholder="Pilih rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <SelectItem key={r} value={r.toString()}>
                        {r} Bintang
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weddingDateLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Menikah (Label)</FormLabel>
                <FormControl>
                  <Input placeholder="Desember 2023" {...field} data-testid="input-wedding-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="photo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Foto (Opsional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} value={field.value || ""} data-testid="input-photo-url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Urutan Tampil</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                  data-testid="input-sort-order"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="pt-4">
          <Button type="submit" className="w-full sm:w-auto" disabled={isPending} data-testid="button-submit-testimonial">
            {isPending ? "Menyimpan..." : "Simpan Testimoni"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
