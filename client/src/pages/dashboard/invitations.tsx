import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Heart, Edit, Trash2, Eye, ExternalLink, Search, Copy, Archive, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invitation } from "@shared/schema";

const createSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  slug: z.string().min(3, "URL minimal 3 karakter").regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda hubung"),
  theme: z.enum(["classic_elegant", "minimal_modern", "romantic_floral", "luxury_gold"]),
});

const themeLabels: Record<string, string> = {
  classic_elegant: "Classic Elegant",
  minimal_modern: "Minimal Modern",
  romantic_floral: "Romantic Floral",
  luxury_gold: "Luxury Gold",
};

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export default function Invitations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: invitations, isLoading } = useQuery<Invitation[]>({ queryKey: ["/api/invitations"] });

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: "", slug: "", theme: "classic_elegant" },
  });

  const watchedSlug = form.watch("slug");

  // Auto-fill slug from title
  const handleTitleChange = (value: string) => {
    form.setValue("title", value);
    const auto = toSlug(value);
    if (auto) {
      form.setValue("slug", auto, { shouldValidate: true });
    }
  };

  // Debounced slug availability check
  useEffect(() => {
    if (!createOpen) return;
    const slug = watchedSlug?.trim();
    if (!slug || slug.length < 3 || !/^[a-z0-9-]+$/.test(slug)) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/invitations/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
        if (!data.available) {
          form.setError("slug", { message: "URL ini sudah dipakai, coba yang lain" });
        } else {
          form.clearErrors("slug");
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 500);
    return () => { if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current); };
  }, [watchedSlug, createOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createSchema>) => {
      const res = await apiRequest("POST", "/api/invitations", data);
      return res.json() as Promise<Invitation>;
    },
    onSuccess: (newInvitation: Invitation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setCreateOpen(false);
      form.reset();
      setSlugStatus("idle");
      toast({
        title: "Undangan berhasil dibuat!",
        description: `Mengarahkan ke editor undangan...`,
      });
      setLocation(`/dashboard/builder/${newInvitation.id}`);
    },
    onError: (err: any) => {
      const msg = err.message || "Gagal membuat undangan";
      if (msg.includes("slug") || msg.includes("URL")) {
        form.setError("slug", { message: msg });
        setSlugStatus("taken");
      } else {
        toast({ title: "Gagal membuat undangan", description: msg, variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/invitations/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDeleteId(null);
      toast({ title: "Undangan dihapus" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/invitations/${id}`, { status: "archived" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      toast({ title: "Undangan diarsipkan" });
    },
  });

  const filtered = (invitations || []).filter(inv =>
    inv.title.toLowerCase().includes(search.toLowerCase()) ||
    inv.slug.toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${slug}`);
    toast({ title: "Link disalin!" });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setSlugStatus("idle");
    }
    setCreateOpen(open);
  };

  const canSubmit = createMutation.isPending === false && slugStatus !== "taken" && slugStatus !== "checking";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Undangan Saya</h1>
          <p className="text-sm text-muted-foreground">Kelola semua undangan pernikahanmu</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)} data-testid="button-new-invitation">
          <PlusCircle className="w-4 h-4" />
          Buat Undangan Baru
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari undangan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-invitations"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {search ? "Tidak ada hasil" : "Belum ada undangan"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search ? "Coba kata kunci yang berbeda" : "Buat undangan pernikahan digitalmu yang pertama!"}
            </p>
            {!search && (
              <Button onClick={() => setCreateOpen(true)} data-testid="button-create-empty">
                Buat Undangan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <Card key={inv.id} data-testid={`card-invitation-${inv.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6 text-primary fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{inv.title}</p>
                      <Badge
                        variant={inv.status === "published" ? "default" : inv.status === "archived" ? "secondary" : "outline"}
                        className="text-xs"
                        data-testid={`badge-status-${inv.id}`}
                      >
                        {inv.status === "published" ? "Dipublish" : inv.status === "archived" ? "Diarsip" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>/invite/{inv.slug}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {inv.views} views</span>
                      <span>{themeLabels[inv.theme] || inv.theme}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyLink(inv.slug)}
                      title="Salin link undangan"
                      data-testid={`button-copy-link-${inv.id}`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {inv.status === "published" && (
                      <a href={`/invite/${inv.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" title="Lihat undangan" data-testid={`button-preview-${inv.id}`}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => archiveMutation.mutate(inv.id)}
                      disabled={inv.status === "archived"}
                      title="Arsipkan"
                      data-testid={`button-archive-${inv.id}`}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Link href={`/dashboard/builder/${inv.id}`}>
                      <Button size="sm" variant="outline" data-testid={`button-edit-${inv.id}`}>
                        <Edit className="w-4 h-4 mr-1.5" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(inv.id)}
                      className="text-destructive"
                      title="Hapus"
                      data-testid={`button-delete-${inv.id}`}
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Undangan Baru</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Undangan</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Pernikahan Ahmad & Sari"
                        data-testid="input-title"
                        {...field}
                        onChange={e => handleTitleChange(e.target.value)}
                      />
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
                    <FormLabel>URL Undangan</FormLabel>
                    <FormControl>
                      <div className="flex items-center border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
                        <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-input whitespace-nowrap">/invite/</span>
                        <div className="flex-1 flex items-center">
                          <Input
                            placeholder="ahmad-dan-sari"
                            className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            data-testid="input-slug"
                            {...field}
                            onChange={e => {
                              const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                              field.onChange(v);
                            }}
                          />
                          <span className="px-2 flex-shrink-0">
                            {slugStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                            {slugStatus === "available" && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {slugStatus === "taken" && <XCircle className="w-4 h-4 text-destructive" />}
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    {slugStatus === "available" && (
                      <p className="text-xs text-green-600">URL tersedia</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tema</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-theme">
                          <SelectValue placeholder="Pilih tema" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="classic_elegant">Classic Elegant</SelectItem>
                        <SelectItem value="minimal_modern">Minimal Modern</SelectItem>
                        <SelectItem value="romantic_floral">Romantic Floral</SelectItem>
                        <SelectItem value="luxury_gold">Luxury Gold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  data-testid="button-submit-create"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Membuat...
                    </>
                  ) : (
                    "Buat Undangan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Undangan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua data RSVP, pesan tamu, dan konten akan ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
