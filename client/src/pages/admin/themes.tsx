import { useQuery, useMutation } from "@tanstack/react-query";
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
import { insertWeddingThemeSchema, type WeddingTheme, type InsertWeddingTheme } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Palette, Plus, Edit2, Trash2, Copy, Send, Archive, Search, Layout } from "lucide-react";
import { Link } from "wouter";

export default function AdminThemes() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: themes, isLoading } = useQuery<WeddingTheme[]>({
    queryKey: ["/api/admin/themes"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertWeddingTheme) => apiRequest("POST", "/api/admin/themes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast({ title: "Tema berhasil dibuat" });
      setIsAddOpen(false);
    },
    onError: (err: Error) => toast({ title: "Gagal membuat tema", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/themes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast({ title: "Tema berhasil dihapus" });
    },
    onError: (err: Error) => toast({ title: "Gagal menghapus tema", description: err.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/themes/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast({ title: "Tema berhasil diduplikasi" });
    },
    onError: (err: Error) => toast({ title: "Gagal menduplikasi tema", description: err.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiRequest("PATCH", `/api/admin/themes/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast({ title: "Status tema diperbarui" });
    },
    onError: (err: Error) => toast({ title: "Gagal memperbarui status", description: err.message, variant: "destructive" }),
  });

  const filteredThemes = themes?.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         theme.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || theme.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Wedding Theme Library</h1>
          <p className="text-muted-foreground">Kelola koleksi tema undangan pernikahan kustom.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-theme">
              <Plus className="w-4 h-4 mr-2" />
              Buat Tema Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Buat Tema Baru</DialogTitle>
            </DialogHeader>
            <ThemeForm 
              onSubmit={(data) => createMutation.mutate(data)} 
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari nama atau slug tema..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-themes"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredThemes?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
            <h3 className="text-lg font-medium text-foreground">Tema tidak ditemukan</h3>
            <p className="text-muted-foreground mb-6">Mulai dengan membuat tema kustom pertama Anda.</p>
            <Button variant="outline" onClick={() => setIsAddOpen(true)}>
              Buat Tema Baru
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThemes?.map((theme) => (
            <Card key={theme.id} className="flex flex-col hover-elevate overflow-visible">
              <div className="aspect-video w-full relative bg-muted rounded-t-xl overflow-hidden group">
                {theme.thumbnailUrl ? (
                  <img 
                    src={theme.thumbnailUrl} 
                    alt={theme.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center p-6 text-center">
                    <span className="text-primary font-serif italic text-xl font-bold">{theme.name}</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge 
                    variant={
                      theme.status === "published" ? "default" : 
                      theme.status === "archived" ? "secondary" : "outline"
                    }
                    className="bg-background/80 backdrop-blur-sm"
                  >
                    {theme.status.charAt(0).toUpperCase() + theme.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-bold line-clamp-1">{theme.name}</CardTitle>
                <p className="text-xs text-muted-foreground font-mono">/{theme.slug}</p>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {theme.description || "Tidak ada deskripsi."}
                </p>
              </CardContent>
              <div className="p-4 pt-0 flex flex-wrap gap-2 mt-auto">
                <Button asChild variant="outline" size="sm" className="flex-1" data-testid={`button-edit-builder-${theme.id}`}>
                  <Link href={`/admin/themes/${theme.id}/builder`}>
                    <Layout className="w-4 h-4 mr-2" />
                    Builder
                  </Link>
                </Button>
                
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => duplicateMutation.mutate(theme.id)}
                    disabled={duplicateMutation.isPending}
                    title="Duplikat"
                    data-testid={`button-duplicate-theme-${theme.id}`}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  {theme.status !== "published" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-emerald-600"
                      onClick={() => statusMutation.mutate({ id: theme.id, status: "published" })}
                      title="Publish"
                      data-testid={`button-publish-theme-${theme.id}`}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  )}

                  {theme.status === "published" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-orange-600"
                      onClick={() => statusMutation.mutate({ id: theme.id, status: "archived" })}
                      title="Archive"
                      data-testid={`button-archive-theme-${theme.id}`}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        data-testid={`button-delete-theme-${theme.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Tema?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini tidak dapat dibatalkan. Tema <strong>{theme.name}</strong> akan dihapus permanen beserta semua blok di dalamnya.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate(theme.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeForm({ 
  onSubmit, 
  isPending, 
  defaultValues 
}: { 
  onSubmit: (data: InsertWeddingTheme) => void; 
  isPending: boolean;
  defaultValues?: Partial<InsertWeddingTheme>;
}) {
  const form = useForm<InsertWeddingTheme>({
    resolver: zodResolver(insertWeddingThemeSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      slug: defaultValues?.slug || "",
      description: defaultValues?.description || "",
      status: defaultValues?.status || "draft",
      thumbnailUrl: defaultValues?.thumbnailUrl || "",
      globalSettings: defaultValues?.globalSettings || "{}",
    },
  });

  const nameValue = form.watch("name");
  
  // Auto-generate slug from name
  useState(() => {
    if (nameValue && !form.getValues("slug")) {
      const slug = nameValue.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      form.setValue("slug", slug);
    }
  });

  const handleNameBlur = () => {
    const name = form.getValues("name");
    const currentSlug = form.getValues("slug");
    if (name && !currentSlug) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      form.setValue("slug", slug);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Tema</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Elegant Gold" 
                  {...field} 
                  onBlur={handleNameBlur}
                  data-testid="input-theme-name" 
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
              <FormLabel>Slug (URL)</FormLabel>
              <FormControl>
                <Input placeholder="elegant-gold" {...field} data-testid="input-theme-slug" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tema mewah dengan aksen emas..." 
                  className="min-h-[80px] resize-none" 
                  {...field} 
                  data-testid="textarea-theme-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-theme-status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="pt-4">
          <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-theme">
            {isPending ? "Menyimpan..." : "Buat Tema"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
