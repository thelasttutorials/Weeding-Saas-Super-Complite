import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, Globe, Loader2, ExternalLink, Image, Plus, Trash2, Copy } from "lucide-react";
import { Link } from "wouter";
import type { Invitation, InvitationCouple, InvitationEvents, InvitationContent, GalleryImage } from "@shared/schema";

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [publishing, setPublishing] = useState(false);

  const { data: invitation, isLoading } = useQuery<Invitation>({ queryKey: ["/api/invitations", id] });
  const { data: couple } = useQuery<InvitationCouple>({ queryKey: ["/api/invitations", id, "couple"] });
  const { data: events } = useQuery<InvitationEvents>({ queryKey: ["/api/invitations", id, "events"] });
  const { data: content } = useQuery<InvitationContent>({ queryKey: ["/api/invitations", id, "content"] });
  const { data: gallery } = useQuery<GalleryImage[]>({ queryKey: ["/api/invitations", id, "gallery"] });

  // Couple form state
  const [coupleData, setCoupleData] = useState({ brideName: "", groomName: "", brideParents: "", groomParents: "", loveStory: "", bridePhoto: "", groomPhoto: "", couplePhoto: "" });
  const [eventsData, setEventsData] = useState({ akadDate: "", akadTime: "", akadVenue: "", akadMapsLink: "", receptionDate: "", receptionTime: "", receptionVenue: "", receptionMapsLink: "" });
  const [contentData, setContentData] = useState({ openingQuote: "", closingMessage: "", hashtag: "", livestreamLink: "", backgroundMusic: "", enableRsvp: true, rsvpDeadline: "", maxGuests: 2 });
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => { if (couple) setCoupleData({ brideName: couple.brideName || "", groomName: couple.groomName || "", brideParents: couple.brideParents || "", groomParents: couple.groomParents || "", loveStory: couple.loveStory || "", bridePhoto: couple.bridePhoto || "", groomPhoto: couple.groomPhoto || "", couplePhoto: couple.couplePhoto || "" }); }, [couple]);
  useEffect(() => { if (events) setEventsData({ akadDate: events.akadDate || "", akadTime: events.akadTime || "", akadVenue: events.akadVenue || "", akadMapsLink: events.akadMapsLink || "", receptionDate: events.receptionDate || "", receptionTime: events.receptionTime || "", receptionVenue: events.receptionVenue || "", receptionMapsLink: events.receptionMapsLink || "" }); }, [events]);
  useEffect(() => { if (content) setContentData({ openingQuote: content.openingQuote || "", closingMessage: content.closingMessage || "", hashtag: content.hashtag || "", livestreamLink: content.livestreamLink || "", backgroundMusic: content.backgroundMusic || "", enableRsvp: content.enableRsvp ?? true, rsvpDeadline: content.rsvpDeadline || "", maxGuests: content.maxGuests ?? 2 }); }, [content]);

  const saveMutation = useMutation({
    mutationFn: async (section: string) => {
      if (section === "couple") await apiRequest("PUT", `/api/invitations/${id}/couple`, coupleData);
      if (section === "events") await apiRequest("PUT", `/api/invitations/${id}/events`, eventsData);
      if (section === "content") await apiRequest("PUT", `/api/invitations/${id}/content`, contentData);
    },
    onSuccess: (_, section) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id] });
      toast({ title: `Tersimpan!`, description: `Perubahan berhasil disimpan.` });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: (publish: boolean) => apiRequest("PATCH", `/api/invitations/${id}`, {
      status: publish ? "published" : "draft",
      publishedAt: publish ? new Date().toISOString() : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id] });
      toast({ title: invitation?.status === "published" ? "Undangan di-draft" : "Undangan dipublish!" });
    },
  });

  const addImageMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/invitations/${id}/gallery`, { imageUrl: newImageUrl, caption: "", sortOrder: (gallery?.length || 0) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "gallery"] });
      setNewImageUrl("");
      toast({ title: "Foto ditambahkan" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imgId: string) => apiRequest("DELETE", `/api/invitations/${id}/gallery/${imgId}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "gallery"] }),
  });

  const updateInvMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/invitations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      toast({ title: "Tersimpan!" });
    },
  });

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!invitation) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Undangan tidak ditemukan.</p>
      <Link href="/dashboard/invitations"><Button className="mt-4">Kembali</Button></Link>
    </div>
  );

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${invitation.slug}`);
    toast({ title: "Link disalin!" });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invitations">
            <Button size="icon" variant="ghost" data-testid="button-back"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">{invitation.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={invitation.status === "published" ? "default" : "outline"} className="text-xs">
                {invitation.status === "published" ? "Dipublish" : "Draft"}
              </Badge>
              <button onClick={copyLink} className="flex items-center gap-1 text-xs text-muted-foreground hover-elevate rounded px-1">
                <Copy className="w-3 h-3" /> /invite/{invitation.slug}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invitation.status === "published" && (
            <a href={`/invite/${invitation.slug}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Preview
              </Button>
            </a>
          )}
          <Button
            size="sm"
            variant={invitation.status === "published" ? "outline" : "default"}
            onClick={() => publishMutation.mutate(invitation.status !== "published")}
            disabled={publishMutation.isPending}
            className="gap-1.5"
            data-testid="button-publish"
          >
            {publishMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            {invitation.status === "published" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Tabs Builder */}
      <Tabs defaultValue="couple">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="couple" data-testid="tab-couple">Pasangan</TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">Acara</TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">Konten</TabsTrigger>
          <TabsTrigger value="gallery" data-testid="tab-gallery">Galeri</TabsTrigger>
          <TabsTrigger value="theme" data-testid="tab-theme">Tema</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Pengaturan</TabsTrigger>
        </TabsList>

        {/* Couple Tab */}
        <TabsContent value="couple">
          <Card>
            <CardHeader><CardTitle className="text-base">Info Pasangan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Mempelai Wanita</Label>
                  <Input value={coupleData.brideName} onChange={e => setCoupleData(p => ({ ...p, brideName: e.target.value }))} placeholder="Sari Dewi" data-testid="input-bride-name" />
                </div>
                <div className="space-y-2">
                  <Label>Nama Mempelai Pria</Label>
                  <Input value={coupleData.groomName} onChange={e => setCoupleData(p => ({ ...p, groomName: e.target.value }))} placeholder="Ahmad Ridwan" data-testid="input-groom-name" />
                </div>
                <div className="space-y-2">
                  <Label>Orang Tua Mempelai Wanita</Label>
                  <Input value={coupleData.brideParents} onChange={e => setCoupleData(p => ({ ...p, brideParents: e.target.value }))} placeholder="Bapak Sutrisno & Ibu Marlina" data-testid="input-bride-parents" />
                </div>
                <div className="space-y-2">
                  <Label>Orang Tua Mempelai Pria</Label>
                  <Input value={coupleData.groomParents} onChange={e => setCoupleData(p => ({ ...p, groomParents: e.target.value }))} placeholder="Bapak Hasan & Ibu Fatimah" data-testid="input-groom-parents" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kisah Cinta</Label>
                <Textarea
                  value={coupleData.loveStory}
                  onChange={e => setCoupleData(p => ({ ...p, loveStory: e.target.value }))}
                  placeholder="Ceritakan bagaimana kalian pertama kali bertemu..."
                  rows={4}
                  data-testid="input-love-story"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Foto Mempelai Wanita (URL)</Label>
                  <Input value={coupleData.bridePhoto} onChange={e => setCoupleData(p => ({ ...p, bridePhoto: e.target.value }))} placeholder="https://..." data-testid="input-bride-photo" />
                </div>
                <div className="space-y-2">
                  <Label>Foto Mempelai Pria (URL)</Label>
                  <Input value={coupleData.groomPhoto} onChange={e => setCoupleData(p => ({ ...p, groomPhoto: e.target.value }))} placeholder="https://..." data-testid="input-groom-photo" />
                </div>
              </div>
              <Button onClick={() => saveMutation.mutate("couple")} disabled={saveMutation.isPending} className="gap-2" data-testid="button-save-couple">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader><CardTitle className="text-base">Detail Acara</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h3 className="font-medium text-sm text-foreground mb-3">Akad Nikah</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tanggal Akad</Label><Input type="date" value={eventsData.akadDate} onChange={e => setEventsData(p => ({ ...p, akadDate: e.target.value }))} data-testid="input-akad-date" /></div>
                  <div className="space-y-2"><Label>Waktu Akad</Label><Input type="time" value={eventsData.akadTime} onChange={e => setEventsData(p => ({ ...p, akadTime: e.target.value }))} data-testid="input-akad-time" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Lokasi Akad</Label><Input value={eventsData.akadVenue} onChange={e => setEventsData(p => ({ ...p, akadVenue: e.target.value }))} placeholder="Masjid Al-Hidayah, Jakarta Selatan" data-testid="input-akad-venue" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Link Google Maps Akad</Label><Input value={eventsData.akadMapsLink} onChange={e => setEventsData(p => ({ ...p, akadMapsLink: e.target.value }))} placeholder="https://maps.google.com/..." data-testid="input-akad-maps" /></div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground mb-3">Resepsi Pernikahan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tanggal Resepsi</Label><Input type="date" value={eventsData.receptionDate} onChange={e => setEventsData(p => ({ ...p, receptionDate: e.target.value }))} data-testid="input-reception-date" /></div>
                  <div className="space-y-2"><Label>Waktu Resepsi</Label><Input type="time" value={eventsData.receptionTime} onChange={e => setEventsData(p => ({ ...p, receptionTime: e.target.value }))} data-testid="input-reception-time" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Lokasi Resepsi</Label><Input value={eventsData.receptionVenue} onChange={e => setEventsData(p => ({ ...p, receptionVenue: e.target.value }))} placeholder="Gedung Serbaguna, Jakarta" data-testid="input-reception-venue" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Link Google Maps Resepsi</Label><Input value={eventsData.receptionMapsLink} onChange={e => setEventsData(p => ({ ...p, receptionMapsLink: e.target.value }))} placeholder="https://maps.google.com/..." data-testid="input-reception-maps" /></div>
                </div>
              </div>
              <Button onClick={() => saveMutation.mutate("events")} disabled={saveMutation.isPending} className="gap-2" data-testid="button-save-events">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader><CardTitle className="text-base">Konten Tambahan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kutipan Pembuka</Label>
                <Textarea value={contentData.openingQuote} onChange={e => setContentData(p => ({ ...p, openingQuote: e.target.value }))} placeholder="Dan di antara tanda-tanda kebesaran-Nya..." rows={3} data-testid="input-opening-quote" />
              </div>
              <div className="space-y-2">
                <Label>Pesan Penutup</Label>
                <Textarea value={contentData.closingMessage} onChange={e => setContentData(p => ({ ...p, closingMessage: e.target.value }))} placeholder="Merupakan suatu kebahagiaan apabila Bapak/Ibu/Saudara/i berkenan hadir..." rows={3} data-testid="input-closing-message" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Wedding Hashtag</Label>
                  <Input value={contentData.hashtag} onChange={e => setContentData(p => ({ ...p, hashtag: e.target.value }))} placeholder="#AhmadDanSari2025" data-testid="input-hashtag" />
                </div>
                <div className="space-y-2">
                  <Label>Link Livestream</Label>
                  <Input value={contentData.livestreamLink} onChange={e => setContentData(p => ({ ...p, livestreamLink: e.target.value }))} placeholder="https://youtube.com/..." data-testid="input-livestream" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Aktifkan RSVP</p>
                  <p className="text-xs text-muted-foreground">Izinkan tamu mengisi konfirmasi kehadiran</p>
                </div>
                <Switch
                  checked={contentData.enableRsvp}
                  onCheckedChange={v => setContentData(p => ({ ...p, enableRsvp: v }))}
                  data-testid="switch-enable-rsvp"
                />
              </div>
              {contentData.enableRsvp && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Batas RSVP</Label>
                    <Input type="date" value={contentData.rsvpDeadline} onChange={e => setContentData(p => ({ ...p, rsvpDeadline: e.target.value }))} data-testid="input-rsvp-deadline" />
                  </div>
                  <div className="space-y-2">
                    <Label>Maksimal Tamu per RSVP</Label>
                    <Input type="number" min={1} max={10} value={contentData.maxGuests} onChange={e => setContentData(p => ({ ...p, maxGuests: parseInt(e.target.value) }))} data-testid="input-max-guests" />
                  </div>
                </div>
              )}
              <Button onClick={() => saveMutation.mutate("content")} disabled={saveMutation.isPending} className="gap-2" data-testid="button-save-content">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery">
          <Card>
            <CardHeader><CardTitle className="text-base">Galeri Foto</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="URL foto (https://...)"
                  data-testid="input-gallery-url"
                />
                <Button
                  onClick={() => newImageUrl && addImageMutation.mutate()}
                  disabled={!newImageUrl || addImageMutation.isPending}
                  className="gap-1.5"
                  data-testid="button-add-image"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </Button>
              </div>
              {(!gallery || gallery.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Belum ada foto. Tambahkan URL foto di atas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {gallery.map((img) => (
                    <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted" data-testid={`gallery-image-${img.id}`}>
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white"
                          onClick={() => deleteImageMutation.mutate(img.id)}
                          data-testid={`button-delete-image-${img.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme">
          <Card>
            <CardHeader><CardTitle className="text-base">Pilih Tema</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "classic_elegant", label: "Classic Elegant", color: "from-stone-800 to-stone-600" },
                  { value: "minimal_modern", label: "Minimal Modern", color: "from-zinc-900 to-zinc-700" },
                  { value: "romantic_floral", label: "Romantic Floral", color: "from-rose-800 to-pink-600" },
                  { value: "luxury_gold", label: "Luxury Gold", color: "from-yellow-800 to-amber-600" },
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => updateInvMutation.mutate({ theme: theme.value })}
                    className={`rounded-lg overflow-hidden border-2 transition-all ${invitation.theme === theme.value ? "border-primary" : "border-border"}`}
                    data-testid={`theme-${theme.value}`}
                  >
                    <div className={`aspect-[3/2] bg-gradient-to-b ${theme.color} flex items-center justify-center`}>
                      <span className="text-white/80 text-xs font-medium">{theme.label}</span>
                    </div>
                    <div className="p-2 text-center text-xs font-medium text-foreground bg-card">
                      {invitation.theme === theme.value ? "✓ Aktif" : theme.label}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle className="text-base">Pengaturan Undangan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Undangan</Label>
                <Input
                  defaultValue={invitation.title}
                  onBlur={e => updateInvMutation.mutate({ title: e.target.value })}
                  data-testid="input-invitation-title"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Undangan</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-input rounded-md overflow-hidden flex-1">
                    <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-input whitespace-nowrap">/invite/</span>
                    <Input
                      defaultValue={invitation.slug}
                      onBlur={e => updateInvMutation.mutate({ slug: e.target.value })}
                      className="border-0 rounded-none focus-visible:ring-0"
                      data-testid="input-invitation-slug"
                    />
                  </div>
                  <Button size="icon" variant="ghost" onClick={copyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Status Undangan</p>
                    <p className="text-xs text-muted-foreground">{invitation.status === "published" ? "Undangan aktif dan dapat diakses publik" : "Undangan belum dipublish"}</p>
                  </div>
                  <Badge variant={invitation.status === "published" ? "default" : "outline"}>
                    {invitation.status === "published" ? "Dipublish" : "Draft"}
                  </Badge>
                </div>
              </div>
              <Button
                variant={invitation.status === "published" ? "outline" : "default"}
                onClick={() => publishMutation.mutate(invitation.status !== "published")}
                disabled={publishMutation.isPending}
                className="gap-2 w-full"
                data-testid="button-toggle-publish"
              >
                <Globe className="w-4 h-4" />
                {invitation.status === "published" ? "Unpublish Undangan" : "Publish Undangan"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
