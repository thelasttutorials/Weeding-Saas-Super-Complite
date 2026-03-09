import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSeoSettingsSchema, type SeoSettings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, Globe, Share2, Search } from "lucide-react";
import { useEffect } from "react";

export default function AdminSeoPage() {
  const { toast } = useToast();

  const { data: seo, isLoading } = useQuery<SeoSettings>({
    queryKey: ["/api/admin/settings/seo"],
  });

  const form = useForm({
    resolver: zodResolver(insertSeoSettingsSchema),
    defaultValues: {
      homepageMetaTitle: "WedSaaS — Undangan Pernikahan Digital",
      homepageMetaDescription: "",
      homepageMetaKeywords: "",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: "",
      twitterCard: "summary_large_image",
      canonicalUrl: "",
    },
  });

  useEffect(() => {
    if (seo) {
      form.reset({
        homepageMetaTitle: seo.homepageMetaTitle,
        homepageMetaDescription: seo.homepageMetaDescription,
        homepageMetaKeywords: seo.homepageMetaKeywords,
        ogTitle: seo.ogTitle,
        ogDescription: seo.ogDescription,
        ogImageUrl: seo.ogImageUrl ?? "",
        twitterCard: seo.twitterCard,
        canonicalUrl: seo.canonicalUrl,
      });
    }
  }, [seo, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<SeoSettings>) => {
      const res = await apiRequest("PUT", "/api/admin/settings/seo", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/seo"] });
      toast({
        title: "Berhasil",
        description: "Pengaturan SEO telah diperbarui",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal memperbarui",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const metaTitle = form.watch("homepageMetaTitle");
  const metaDescription = form.watch("homepageMetaDescription");

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan SEO</h1>
        <p className="text-muted-foreground">
          Optimalkan visibilitas situs Anda di mesin pencari dan media sosial.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Meta Tags Dasar
                  </CardTitle>
                  <CardDescription>
                    Informasi utama yang digunakan oleh Google dan mesin pencari lainnya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="homepageMetaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title Beranda</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-meta-title" />
                        </FormControl>
                        <FormDescription>
                          Judul yang muncul di tab browser dan hasil pencarian.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="homepageMetaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="h-20" data-testid="textarea-meta-description" />
                        </FormControl>
                        <FormDescription>
                          Ringkasan singkat tentang situs Anda (maksimal 160 karakter).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="homepageMetaKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Keywords</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-meta-keywords" />
                        </FormControl>
                        <FormDescription>
                          Kata kunci yang dipisahkan dengan koma.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="canonicalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canonical URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://wedsaas.id" data-testid="input-canonical-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Open Graph & Media Sosial
                  </CardTitle>
                  <CardDescription>
                    Mengontrol bagaimana situs Anda tampil saat dibagikan di Facebook, Twitter, dan WhatsApp.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ogTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Judul Share (OG Title)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-og-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi Share (OG Description)</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="h-20" data-testid="textarea-og-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Gambar Share (OG Image)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="https://..." data-testid="input-og-image" />
                        </FormControl>
                        <FormDescription>
                          Rekomendasi ukuran: 1200 x 630 pixels.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitterCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Card Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-twitter-card">
                              <SelectValue placeholder="Pilih tipe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="summary">Summary</SelectItem>
                            <SelectItem value="summary_large_image">Summary with Large Image</SelectItem>
                            <SelectItem value="app">App</SelectItem>
                            <SelectItem value="player">Player</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-save-seo"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Simpan Pengaturan SEO
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Preview Google
              </CardTitle>
              <CardDescription>
                Tampilan simulasi hasil pencarian Google.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white dark:bg-zinc-950 space-y-1">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                  {form.watch("canonicalUrl") || "https://wedsaas.id"}
                </div>
                <div className="text-xl text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium leading-tight">
                  {metaTitle || "WedSaaS — Undangan Pernikahan Digital"}
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
                  {metaDescription || "Silakan masukkan deskripsi meta untuk melihat pratinjau bagaimana situs Anda akan muncul di hasil pencarian Google."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
