import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminCMSLanding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/cms/landing"],
  });

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/admin/cms/landing", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/landing"] });
      toast({ title: "Pengaturan berhasil disimpan" });
    },
    onError: (err: any) => {
      toast({
        title: "Gagal menyimpan",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !formData) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CMS Landing Page</h1>
          <p className="text-sm text-muted-foreground">Kelola konten halaman depan website</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Utama</Label>
              <Input
                value={formData.heroTitle}
                onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sub-judul</Label>
              <Input
                value={formData.heroSubtitle}
                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teks Tombol CTA</Label>
                <Input
                  value={formData.heroCtaText}
                  onChange={(e) => setFormData({ ...formData, heroCtaText: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Teks Tombol Sekunder</Label>
                <Input
                  value={formData.heroCtaSecondaryText}
                  onChange={(e) => setFormData({ ...formData, heroCtaSecondaryText: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibilitas Section</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <Label>Fitur</Label>
              <Switch
                checked={formData.showFeatures}
                onCheckedChange={(val) => setFormData({ ...formData, showFeatures: val })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Cara Kerja</Label>
              <Switch
                checked={formData.showHowItWorks}
                onCheckedChange={(val) => setFormData({ ...formData, showHowItWorks: val })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Testimoni</Label>
              <Switch
                checked={formData.showTestimonials}
                onCheckedChange={(val) => setFormData({ ...formData, showTestimonials: val })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Harga</Label>
              <Switch
                checked={formData.showPricing}
                onCheckedChange={(val) => setFormData({ ...formData, showPricing: val })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>FAQ</Label>
              <Switch
                checked={formData.showFaq}
                onCheckedChange={(val) => setFormData({ ...formData, showFaq: val })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Footer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tagline Footer</Label>
              <Input
                value={formData.footerTagline}
                onChange={(e) => setFormData({ ...formData, footerTagline: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
