import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWebsiteSettingsSchema, type WebsiteSettings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<WebsiteSettings>({
    queryKey: ["/api/admin/settings/website"],
  });

  const form = useForm({
    resolver: zodResolver(insertWebsiteSettingsSchema),
    defaultValues: {
      siteName: "WedSaaS",
      tagline: "Platform Undangan Pernikahan Digital",
      logoUrl: "",
      faviconUrl: "",
      supportEmail: "",
      supportWhatsapp: "",
      businessAddress: "",
      primaryColor: "#e11d48",
      secondaryColor: "#f43f5e",
      maintenanceMode: false,
      registrationEnabled: true,
      trialEnabled: false,
      privacyPolicyUrl: "",
      termsUrl: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        siteName: settings.siteName,
        tagline: settings.tagline,
        logoUrl: settings.logoUrl ?? "",
        faviconUrl: settings.faviconUrl ?? "",
        supportEmail: settings.supportEmail,
        supportWhatsapp: settings.supportWhatsapp,
        businessAddress: settings.businessAddress,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        maintenanceMode: settings.maintenanceMode,
        registrationEnabled: settings.registrationEnabled,
        trialEnabled: settings.trialEnabled,
        privacyPolicyUrl: settings.privacyPolicyUrl,
        termsUrl: settings.termsUrl,
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<WebsiteSettings>) => {
      const res = await apiRequest("PUT", "/api/admin/settings/website", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/website"] });
      toast({
        title: "Berhasil",
        description: "Pengaturan website telah diperbarui",
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Website</h1>
        <p className="text-muted-foreground">
          Kelola konfigurasi umum dan sistem platform WedSaaS.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-8">
          <Tabs defaultValue="umum" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
              <TabsTrigger value="umum">Umum</TabsTrigger>
              <TabsTrigger value="sistem">Sistem</TabsTrigger>
            </TabsList>

            <TabsContent value="umum" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Dasar</CardTitle>
                  <CardDescription>
                    Pengaturan nama brand, logo, dan kontak support.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Situs</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-site-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tagline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tagline</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-tagline" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Logo</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-logo-url" />
                          </FormControl>
                          <FormDescription>Link menuju file gambar logo.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="faviconUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Favicon</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-favicon-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supportEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Support</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-support-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supportWhatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Support</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Contoh: 628123456789" data-testid="input-support-whatsapp" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat Bisnis</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-business-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warna Utama (Hex)</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} data-testid="input-primary-color" />
                            </FormControl>
                            <div 
                              className="w-10 h-10 rounded border" 
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warna Sekunder (Hex)</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} data-testid="input-secondary-color" />
                            </FormControl>
                            <div 
                              className="w-10 h-10 rounded border" 
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sistem" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Konfigurasi Sistem</CardTitle>
                  <CardDescription>
                    Kontrol fitur-fitur utama platform.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Mode Pemeliharaan</FormLabel>
                          <FormDescription>
                            Nonaktifkan akses publik ke situs selama perbaikan.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-maintenance-mode"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Pendaftaran Dibuka</FormLabel>
                          <FormDescription>
                            Izinkan pengguna baru untuk mendaftar akun.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-registration-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trialEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Aktifkan Trial</FormLabel>
                          <FormDescription>
                            Berikan akses fitur premium sementara untuk pengguna baru.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-trial-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="privacyPolicyUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Kebijakan Privasi</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-privacy-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="termsUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Syarat & Ketentuan</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-terms-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
