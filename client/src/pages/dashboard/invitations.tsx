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
import { PlusCircle, Heart, Edit, Trash2, Eye, ExternalLink, Search, Copy, Archive, Loader2, CheckCircle, XCircle, Globe, GlobeLock, Share2, CopyPlus, Users, QrCode, Calendar } from "lucide-react";
import { SiFacebook } from "react-icons/si";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const [publishErrorOpen, setPublishErrorOpen] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      setPublishingId(id);
      const res = await apiRequest("POST", `/api/invitations/${id}/publish`, {});
      if (!res.ok) {
        const body = await res.json();
        const err: any = new Error(body.message || "Gagal publish");
        err.errors = body.errors || [];
        throw err;
      }
      return res.json() as Promise<Invitation>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setPublishingId(null);
      toast({ title: "Undangan berhasil dipublish!", description: "Tamu kini bisa mengakses undangan." });
    },
    onError: (err: any) => {
      setPublishingId(null);
      if (err.errors && err.errors.length > 0) {
        setPublishErrors(err.errors);
        setPublishErrorOpen(true);
      } else {
        toast({ title: "Gagal publish", description: err.message, variant: "destructive" });
      }
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      setPublishingId(id);
      const res = await apiRequest("POST", `/api/invitations/${id}/unpublish`, {});
      return res.json() as Promise<Invitation>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      setPublishingId(null);
      toast({ title: "Undangan dikembalikan ke draft" });
    },
    onError: (err: any) => {
      setPublishingId(null);
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/invitations/${id}/duplicate`, {});
      return res.json() as Promise<Invitation>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Undangan berhasil diduplikasi" });
    },
    onError: (err: any) => {
      toast({ title: "Gagal duplikasi", description: err.message, variant: "destructive" });
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
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Heart className="w-6 h-6 text-primary fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{inv.title}</p>
                      <Badge
                        variant={inv.status === "published" ? "default" : inv.status === "archived" ? "secondary" : "outline"}
                        className={`text-xs ${inv.status === "published" ? "bg-emerald-600 hover:bg-emerald-600 text-white border-0" : ""}`}
                        data-testid={`badge-status-${inv.id}`}
                      >
                        {inv.status === "published" ? "✓ Live" : inv.status === "archived" ? "Diarsip" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>/invite/{inv.slug}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {inv.views} views</span>
                      <span>{themeLabels[inv.theme] || inv.theme}</span>
                      {inv.status === "published" && inv.publishedAt && (
                        <span className="text-emerald-600 font-medium">
                          Dipublish {new Date(inv.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Preview — draft goes to /preview/:id, published opens live */}
                    {inv.status === "published" ? (
                      <div className="flex items-center gap-1">
                        <a href={`/invite/${inv.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="gap-1.5" title="Buka undangan" data-testid={`button-open-live-${inv.id}`}>
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">Buka</span>
                          </Button>
                        </a>
                        {inv.saveTheDateEnabled && (
                          <a href={`/save-the-date/${inv.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="gap-1.5" title="Save The Date" data-testid={`button-std-live-${inv.id}`}>
                              <Calendar className="w-4 h-4" />
                              <span className="hidden sm:inline text-[10px]">STD</span>
                            </Button>
                          </a>
                        )}
                      </div>
                    ) : (
                      <Link href={`/preview/${inv.id}`}>
                        <Button size="sm" variant="ghost" className="gap-1.5" title="Preview draft" data-testid={`button-preview-draft-${inv.id}`}>
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Preview</span>
                        </Button>
                      </Link>
                    )}
                    {/* Share popover — only for published */}
                    {inv.status === "published" && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="ghost" className="gap-1.5" data-testid={`button-share-${inv.id}`} title="Bagikan">
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Share</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                          <p className="text-xs text-muted-foreground font-medium px-2 py-1 mb-1">Bagikan undangan</p>
                          <button
                            onClick={() => copyLink(inv.slug)}
                            className="flex items-center gap-2.5 w-full px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                            data-testid={`button-copy-link-${inv.id}`}
                          >
                            <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
                            Salin Link
                          </button>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/invite/${inv.slug}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 w-full px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                            data-testid={`button-share-fb-${inv.id}`}
                          >
                            <SiFacebook className="w-4 h-4 text-blue-600 shrink-0" />
                            Facebook
                          </a>
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Kami mengundang Anda ke pernikahan kami! 💕\n${window.location.origin}/invite/${inv.slug}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 w-full px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                            data-testid={`button-share-wa-${inv.id}`}
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-600 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            WhatsApp
                          </a>
                          <a
                            href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/invite/${inv.slug}`)}&text=${encodeURIComponent(`Kami mengundang Anda ke pernikahan kami! 💕`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 w-full px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                            data-testid={`button-share-tg-${inv.id}`}
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-500 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                            Telegram
                          </a>
                        </PopoverContent>
                      </Popover>
                    )}
                    {inv.status === "draft" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => publishMutation.mutate(inv.id)}
                        disabled={publishingId === inv.id}
                        className="gap-1.5"
                        data-testid={`button-publish-${inv.id}`}
                      >
                        {publishingId === inv.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Globe className="w-3.5 h-3.5" />}
                        Publish
                      </Button>
                    )}
                    {inv.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unpublishMutation.mutate(inv.id)}
                        disabled={publishingId === inv.id}
                        className="gap-1.5"
                        data-testid={`button-unpublish-${inv.id}`}
                      >
                        {publishingId === inv.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <GlobeLock className="w-3.5 h-3.5" />}
                        Unpublish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => duplicateMutation.mutate(inv.id)}
                      disabled={duplicateMutation.isPending}
                      title="Duplikat"
                      data-testid={`button-duplicate-${inv.id}`}
                    >
                      {duplicateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CopyPlus className="w-4 h-4" />}
                    </Button>
                    {inv.status !== "archived" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => archiveMutation.mutate(inv.id)}
                        title="Arsipkan"
                        data-testid={`button-archive-${inv.id}`}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/builder/${inv.id}`}>
                        <Button size="sm" variant="outline" data-testid={`button-edit-${inv.id}`}>
                          <Edit className="w-4 h-4 mr-1.5" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/dashboard/invitations/${inv.id}/guests`}>
                        <Button size="sm" variant="outline" data-testid={`button-guests-${inv.id}`}>
                          <Users className="w-4 h-4 mr-1.5" />
                          Tamu
                        </Button>
                      </Link>
                      <Link href={`/dashboard/invitations/${inv.id}/checkin`}>
                        <Button size="sm" variant="outline" data-testid={`button-checkin-${inv.id}`}>
                          <QrCode className="w-4 h-4 mr-1.5" />
                          Check-in
                        </Button>
                      </Link>
                    </div>
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

      {/* Publish validation errors */}
      <AlertDialog open={publishErrorOpen} onOpenChange={setPublishErrorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undangan Belum Bisa Dipublish</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">Lengkapi data berikut terlebih dahulu di editor undangan:</p>
                <ul className="space-y-2">
                  {publishErrors.map((err, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-close-publish-error">Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
