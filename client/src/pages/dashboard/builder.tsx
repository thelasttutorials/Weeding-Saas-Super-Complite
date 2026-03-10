import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Save, Globe, Loader2, ExternalLink, Image, Plus, Trash2, 
  Copy, CheckCircle, XCircle, Eye, Share2, Wand2, Music, Upload, Search, FileAudio, Play, Pause, ChevronDown,
  Database, Calendar as CalendarIcon, GripVertical
} from "lucide-react";
import { Link } from "wouter";
import { AICopyAssistant } from "@/components/ai-copy-assistant";
import type { Invitation, InvitationCouple, InvitationEvents, InvitationContent, GalleryImage, MediaAsset, LoveStoryItem } from "@shared/schema";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Per-section save button with transient success state ─────────────────────
function SaveButton({ isPending, savedKey, sectionKey, onClick, testId }: {
  isPending: boolean;
  savedKey: string | null;
  sectionKey: string;
  onClick: () => void;
  testId?: string;
}) {
  const justSaved = savedKey === sectionKey;
  return (
    <Button
      onClick={onClick}
      disabled={isPending}
      variant={justSaved ? "outline" : "default"}
      className="gap-2"
      data-testid={testId}
    >
      {isPending ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
      ) : justSaved ? (
        <><CheckCircle className="w-4 h-4 text-green-600" /> Tersimpan</>
      ) : (
        <><Save className="w-4 h-4" /> Simpan</>
      )}
    </Button>
  );
}

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track which section was most recently saved (for transient success state)
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = (section: string) => {
    setSavedSection(section);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedSection(null), 2500);
  };

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data: invitation, isLoading } = useQuery<Invitation>({
    queryKey: ["/api/invitations", id],
  });
  const { data: couple } = useQuery<InvitationCouple>({
    queryKey: ["/api/invitations", id, "couple"],
    enabled: !!id,
  });
  const { data: events } = useQuery<InvitationEvents>({
    queryKey: ["/api/invitations", id, "events"],
    enabled: !!id,
  });
  const { data: content } = useQuery<InvitationContent>({
    queryKey: ["/api/invitations", id, "content"],
    enabled: !!id,
  });
  const { data: gallery } = useQuery<GalleryImage[]>({
    queryKey: ["/api/invitations", id, "gallery"],
    enabled: !!id,
  });

  const { data: loveStoryItems } = useQuery<LoveStoryItem[]>({
    queryKey: ["/api/invitations", id, "love-story"],
    enabled: !!id,
  });

  const { data: mediaAssets } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media"],
  });

  // ── Local form states (synced from DB on first load) ─────────────────────────
  const [coupleData, setCoupleData] = useState({
    brideName: "", groomName: "", brideParents: "", groomParents: "",
    loveStory: "", bridePhoto: "", groomPhoto: "", couplePhoto: "",
  });
  const [eventsData, setEventsData] = useState({
    akadDate: "", akadTime: "", akadVenue: "", akadMapsLink: "",
    receptionDate: "", receptionTime: "", receptionVenue: "", receptionMapsLink: "",
  });
  const [contentData, setContentData] = useState({
    openingQuote: "", closingMessage: "", hashtag: "", livestreamLink: "",
    backgroundMusic: "", musicEnabled: false, musicLabel: "", showMusicControl: true,
    enableRsvp: true, rsvpDeadline: "", maxGuests: 2,
    videoUrl: "",
    colorPreset: "classic",
  });
  const [settingsData, setSettingsData] = useState({
    title: "", slug: "", coverImage: "",
    saveTheDateEnabled: false, saveTheDateMessage: "",
  });
  const [playingMusic, setPlayingMusic] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreviewMusic = (url: string) => {
    if (playingMusic === url) {
      audioRef.current?.pause();
      setPlayingMusic(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingMusic(url);
      }
    }
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Sync from DB → local state once data arrives
  useEffect(() => {
    if (couple) setCoupleData({
      brideName: couple.brideName || "", groomName: couple.groomName || "",
      brideParents: couple.brideParents || "", groomParents: couple.groomParents || "",
      loveStory: couple.loveStory || "", bridePhoto: couple.bridePhoto || "",
      groomPhoto: couple.groomPhoto || "", couplePhoto: couple.couplePhoto || "",
    });
  }, [couple]);

  useEffect(() => {
    if (events) setEventsData({
      akadDate: events.akadDate || "", akadTime: events.akadTime || "",
      akadVenue: events.akadVenue || "", akadMapsLink: events.akadMapsLink || "",
      receptionDate: events.receptionDate || "", receptionTime: events.receptionTime || "",
      receptionVenue: events.receptionVenue || "", receptionMapsLink: events.receptionMapsLink || "",
    });
  }, [events]);

  useEffect(() => {
    if (content) setContentData({
      openingQuote: content.openingQuote || "", closingMessage: content.closingMessage || "",
      hashtag: content.hashtag || "", livestreamLink: content.livestreamLink || "",
      backgroundMusic: content.backgroundMusic || "", 
      musicEnabled: content.musicEnabled ?? false,
      musicLabel: content.musicLabel || "",
      showMusicControl: content.showMusicControl ?? true,
      enableRsvp: content.enableRsvp ?? true,
      rsvpDeadline: content.rsvpDeadline || "", maxGuests: content.maxGuests ?? 2,
      videoUrl: content.videoUrl || "",
      colorPreset: content.colorPreset || "classic",
    });
  }, [content]);

  useEffect(() => {
    if (invitation) setSettingsData({
      title: invitation.title || "",
      slug: invitation.slug || "",
      coverImage: invitation.coverImage || "",
      saveTheDateEnabled: invitation.saveTheDateEnabled ?? false,
      saveTheDateMessage: invitation.saveTheDateMessage || "",
    });
  }, [invitation]);

  // Debounced slug availability check (for settings tab)
  useEffect(() => {
    const slug = settingsData.slug?.trim();
    if (!slug || slug === invitation?.slug) {
      setSlugStatus("idle");
      return;
    }
    if (slug.length < 3 || !/^[a-z0-9-]+$/.test(slug)) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/invitations/check-slug?slug=${encodeURIComponent(slug)}&excludeId=${id}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 600);
    return () => { if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current); };
  }, [settingsData.slug, invitation?.slug, id]);

  // ── Per-section mutations (independent — each has own isPending) ─────────────

  const coupleMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/invitations/${id}/couple`, coupleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "couple"] });
      markSaved("couple");
    },
    onError: (err: any) => toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" }),
  });

  const eventsMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/invitations/${id}/events`, eventsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "events"] });
      markSaved("events");
    },
    onError: (err: any) => toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" }),
  });

  const contentMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/invitations/${id}/content`, contentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "content"] });
      markSaved("content");
    },
    onError: (err: any) => toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" }),
  });

  const settingsMutation = useMutation({
    mutationFn: async () => {
      if (slugStatus === "taken") throw new Error("URL undangan sudah dipakai");
      const res = await apiRequest("PATCH", `/api/invitations/${id}`, settingsData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      setSlugStatus("idle");
      markSaved("settings");
    },
    onError: (err: any) => toast({ title: "Gagal menyimpan pengaturan", description: err.message, variant: "destructive" }),
  });

  const themeMutation = useMutation({
    mutationFn: (theme: string) => apiRequest("PATCH", `/api/invitations/${id}`, { theme }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      markSaved("theme");
    },
    onError: (err: any) => toast({ title: "Gagal mengubah tema", description: err.message, variant: "destructive" }),
  });

  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const [publishErrorOpen, setPublishErrorOpen] = useState(false);

  const publishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const endpoint = publish ? `/api/invitations/${id}/publish` : `/api/invitations/${id}/unpublish`;
      const res = await apiRequest("POST", endpoint, {});
      if (!res.ok) {
        const body = await res.json();
        const err: any = new Error(body.message || "Gagal");
        err.errors = body.errors || [];
        throw err;
      }
      return res.json();
    },
    onSuccess: (_, publish) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id] });
      toast({ title: publish ? "Undangan berhasil dipublish!" : "Undangan dikembalikan ke draft" });
    },
    onError: (err: any) => {
      if (err.errors && err.errors.length > 0) {
        setPublishErrors(err.errors);
        setPublishErrorOpen(true);
      } else {
        toast({ title: "Gagal", description: err.message, variant: "destructive" });
      }
    },
  });

  const addImageMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/invitations/${id}/gallery`, {
      imageUrl: newImageUrl,
      caption: "",
      sortOrder: gallery?.length || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "gallery"] });
      setNewImageUrl("");
    },
    onError: (err: any) => toast({ title: "Gagal menambah foto", description: err.message, variant: "destructive" }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imgId: string) => apiRequest("DELETE", `/api/invitations/${id}/gallery/${imgId}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "gallery"] }),
    onError: (err: any) => toast({ title: "Gagal menghapus foto", description: err.message, variant: "destructive" }),
  });

  // ── Love Story mutations ─────────────────────────────────────────────────────

  const createLoveStoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/invitations/${id}/love-story`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "love-story"] });
      toast({ title: "Item berhasil ditambah" });
    },
    onError: (err: any) => toast({ title: "Gagal menambah item", description: err.message, variant: "destructive" }),
  });

  const updateLoveStoryMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) => apiRequest("PATCH", `/api/love-story/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "love-story"] });
    },
    onError: (err: any) => toast({ title: "Gagal mengupdate item", description: err.message, variant: "destructive" }),
  });

  const deleteLoveStoryMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("DELETE", `/api/love-story/${itemId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "love-story"] });
      toast({ title: "Item berhasil dihapus" });
    },
    onError: (err: any) => toast({ title: "Gagal menghapus item", description: err.message, variant: "destructive" }),
  });

  const reorderLoveStoryMutation = useMutation({
    mutationFn: (itemIds: string[]) => apiRequest("PATCH", `/api/invitations/${id}/love-story/reorder`, { itemIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", id, "love-story"] });
    },
  });

  // ── Loading / not found states ───────────────────────────────────────────────
  if (isLoading) return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!invitation) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground mb-4">Undangan tidak ditemukan.</p>
      <Link href="/dashboard/invitations"><Button>Kembali ke Daftar</Button></Link>
    </div>
  );

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${invitation.slug}`);
    toast({ title: "Link disalin!" });
  };

  const settingsSlugChanged = settingsData.slug !== invitation.slug;
  const settingsCanSave = settingsMutation.isPending === false && slugStatus !== "taken" && slugStatus !== "checking";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invitations">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">{invitation.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={invitation.status === "published" ? "default" : "outline"} className="text-xs">
                {invitation.status === "published" ? "Dipublish" : "Draft"}
              </Badge>
              <button
                onClick={copyLink}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded px-1"
              >
                <Copy className="w-3 h-3" /> /invite/{invitation.slug}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invitation.status === "published" ? (
            <a href={`/invite/${invitation.slug}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5" data-testid="button-preview-live">
                <ExternalLink className="w-3.5 h-3.5" /> Lihat Undangan
              </Button>
            </a>
          ) : (
            <Link href={`/preview/${invitation.id}`}>
              <Button size="sm" variant="outline" className="gap-1.5" data-testid="button-preview-draft">
                <Eye className="w-3.5 h-3.5" /> Preview
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            variant={invitation.status === "published" ? "outline" : "default"}
            onClick={() => publishMutation.mutate(invitation.status !== "published")}
            disabled={publishMutation.isPending}
            className="gap-1.5"
            data-testid="button-publish"
          >
            {publishMutation.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Globe className="w-3.5 h-3.5" />}
            {invitation.status === "published" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="couple">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="couple" data-testid="tab-couple">Pasangan</TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">Acara</TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">Konten</TabsTrigger>
          <TabsTrigger value="love-story" data-testid="tab-love-story">Kisah Cinta</TabsTrigger>
          <TabsTrigger value="gallery" data-testid="tab-gallery">Galeri</TabsTrigger>
          <TabsTrigger value="theme" data-testid="tab-theme">Tema</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Pengaturan</TabsTrigger>
        </TabsList>

        {/* ── Pasangan Tab ── */}
        <TabsContent value="couple">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Info Pasangan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Mempelai Wanita</Label>
                  <Input
                    value={coupleData.brideName}
                    onChange={e => setCoupleData(p => ({ ...p, brideName: e.target.value }))}
                    placeholder="Sari Dewi"
                    data-testid="input-bride-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Mempelai Pria</Label>
                  <Input
                    value={coupleData.groomName}
                    onChange={e => setCoupleData(p => ({ ...p, groomName: e.target.value }))}
                    placeholder="Ahmad Ridwan"
                    data-testid="input-groom-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Orang Tua Mempelai Wanita</Label>
                  <Input
                    value={coupleData.brideParents}
                    onChange={e => setCoupleData(p => ({ ...p, brideParents: e.target.value }))}
                    placeholder="Bapak Sutrisno & Ibu Marlina"
                    data-testid="input-bride-parents"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Orang Tua Mempelai Pria</Label>
                  <Input
                    value={coupleData.groomParents}
                    onChange={e => setCoupleData(p => ({ ...p, groomParents: e.target.value }))}
                    placeholder="Bapak Hasan & Ibu Fatimah"
                    data-testid="input-groom-parents"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Kisah Cinta</Label>
                  <AICopyAssistant
                    groomName={coupleData.groomName}
                    brideName={coupleData.brideName}
                    onSelect={(text) => setCoupleData(p => ({ ...p, loveStory: text }))}
                  />
                </div>
                <Textarea
                  value={coupleData.loveStory}
                  onChange={e => setCoupleData(p => ({ ...p, loveStory: e.target.value }))}
                  placeholder="Ceritakan bagaimana kalian pertama kali bertemu..."
                  rows={4}
                  data-testid="input-love-story"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Foto Mempelai Wanita (URL)</Label>
                  <Input
                    value={coupleData.bridePhoto}
                    onChange={e => setCoupleData(p => ({ ...p, bridePhoto: e.target.value }))}
                    placeholder="https://..."
                    data-testid="input-bride-photo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Foto Mempelai Pria (URL)</Label>
                  <Input
                    value={coupleData.groomPhoto}
                    onChange={e => setCoupleData(p => ({ ...p, groomPhoto: e.target.value }))}
                    placeholder="https://..."
                    data-testid="input-groom-photo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Foto Berdua (URL)</Label>
                  <Input
                    value={coupleData.couplePhoto}
                    onChange={e => setCoupleData(p => ({ ...p, couplePhoto: e.target.value }))}
                    placeholder="https://..."
                    data-testid="input-couple-photo"
                  />
                </div>
              </div>
              <SaveButton
                isPending={coupleMutation.isPending}
                savedKey={savedSection}
                sectionKey="couple"
                onClick={() => coupleMutation.mutate()}
                testId="button-save-couple"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Acara Tab ── */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detail Acara</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h3 className="font-medium text-sm text-foreground mb-3 pb-2 border-b border-border">Akad Nikah</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Akad</Label>
                    <Input type="date" value={eventsData.akadDate} onChange={e => setEventsData(p => ({ ...p, akadDate: e.target.value }))} data-testid="input-akad-date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Akad</Label>
                    <Input type="time" value={eventsData.akadTime} onChange={e => setEventsData(p => ({ ...p, akadTime: e.target.value }))} data-testid="input-akad-time" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Lokasi Akad</Label>
                    <Input value={eventsData.akadVenue} onChange={e => setEventsData(p => ({ ...p, akadVenue: e.target.value }))} placeholder="Masjid Al-Hidayah, Jakarta Selatan" data-testid="input-akad-venue" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Link Google Maps Akad</Label>
                    <Input value={eventsData.akadMapsLink} onChange={e => setEventsData(p => ({ ...p, akadMapsLink: e.target.value }))} placeholder="https://maps.google.com/..." data-testid="input-akad-maps" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground mb-3 pb-2 border-b border-border">Resepsi Pernikahan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Resepsi</Label>
                    <Input type="date" value={eventsData.receptionDate} onChange={e => setEventsData(p => ({ ...p, receptionDate: e.target.value }))} data-testid="input-reception-date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Resepsi</Label>
                    <Input type="time" value={eventsData.receptionTime} onChange={e => setEventsData(p => ({ ...p, receptionTime: e.target.value }))} data-testid="input-reception-time" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Lokasi Resepsi</Label>
                    <Input value={eventsData.receptionVenue} onChange={e => setEventsData(p => ({ ...p, receptionVenue: e.target.value }))} placeholder="Gedung Serbaguna, Jakarta" data-testid="input-reception-venue" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Link Google Maps Resepsi</Label>
                    <Input value={eventsData.receptionMapsLink} onChange={e => setEventsData(p => ({ ...p, receptionMapsLink: e.target.value }))} placeholder="https://maps.google.com/..." data-testid="input-reception-maps" />
                  </div>
                </div>
              </div>
              <SaveButton
                isPending={eventsMutation.isPending}
                savedKey={savedSection}
                sectionKey="events"
                onClick={() => eventsMutation.mutate()}
                testId="button-save-events"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Konten Tab ── */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Konten & RSVP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Kutipan Pembuka</Label>
                  <AICopyAssistant
                    groomName={coupleData.groomName}
                    brideName={coupleData.brideName}
                    onSelect={(text) => setContentData(p => ({ ...p, openingQuote: text }))}
                  />
                </div>
                <Textarea
                  value={contentData.openingQuote}
                  onChange={e => setContentData(p => ({ ...p, openingQuote: e.target.value }))}
                  placeholder="Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu... (QS. Ar-Rum: 21)"
                  rows={3}
                  data-testid="input-opening-quote"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pesan Penutup</Label>
                  <AICopyAssistant
                    groomName={coupleData.groomName}
                    brideName={coupleData.brideName}
                    onSelect={(text) => setContentData(p => ({ ...p, closingMessage: text }))}
                  />
                </div>
                <Textarea
                  value={contentData.closingMessage}
                  onChange={e => setContentData(p => ({ ...p, closingMessage: e.target.value }))}
                  placeholder="Merupakan suatu kebahagiaan apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami."
                  rows={3}
                  data-testid="input-closing-message"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Wedding Hashtag</Label>
                    <AICopyAssistant
                      groomName={coupleData.groomName}
                      brideName={coupleData.brideName}
                      onSelect={(text) => setContentData(p => ({ ...p, hashtag: text }))}
                    />
                  </div>
                  <Input
                    value={contentData.hashtag}
                    onChange={e => setContentData(p => ({ ...p, hashtag: e.target.value }))}
                    placeholder="#AhmadDanSari2025"
                    data-testid="input-hashtag"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link Livestream</Label>
                  <Input
                    value={contentData.livestreamLink}
                    onChange={e => setContentData(p => ({ ...p, livestreamLink: e.target.value }))}
                    placeholder="https://youtube.com/live/..."
                    data-testid="input-livestream"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Musik Latar</Label>
                    <p className="text-xs text-muted-foreground">Mainkan musik otomatis saat undangan dibuka</p>
                  </div>
                  <Switch
                    checked={contentData.musicEnabled}
                    onCheckedChange={v => setContentData(p => ({ ...p, musicEnabled: v }))}
                    data-testid="switch-music-enabled"
                  />
                </div>

                {contentData.musicEnabled && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Label Musik</Label>
                        <Input
                          value={contentData.musicLabel}
                          onChange={e => setContentData(p => ({ ...p, musicLabel: e.target.value }))}
                          placeholder="Judul lagu - Artis"
                          data-testid="input-music-label"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-8">
                        <Switch
                          id="show-music-control"
                          checked={contentData.showMusicControl}
                          onCheckedChange={v => setContentData(p => ({ ...p, showMusicControl: v }))}
                          data-testid="switch-show-music-control"
                        />
                        <Label htmlFor="show-music-control" className="text-xs">Tampilkan tombol kontrol musik</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Pilih Musik</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Music className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={contentData.backgroundMusic}
                            onChange={e => setContentData(p => ({ ...p, backgroundMusic: e.target.value }))}
                            placeholder="URL Musik (MP3)"
                            className="pl-9"
                            data-testid="input-background-music"
                          />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                              <Database className="w-4 h-4" />
                              Media Library
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-80">
                            <div className="p-2 border-b">
                              <p className="text-xs font-semibold">Pilih dari Media Library</p>
                            </div>
                            <ScrollArea className="h-64">
                              <div className="p-1">
                                {mediaAssets?.filter(a => a.mediaType === "audio").length === 0 ? (
                                  <div className="p-4 text-center">
                                    <p className="text-xs text-muted-foreground">Belum ada file musik di Media Library</p>
                                    <Link href="/dashboard/media">
                                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary underline">Upload sekarang</Button>
                                    </Link>
                                  </div>
                                ) : (
                                  mediaAssets?.filter(a => a.mediaType === "audio").map((asset) => (
                                    <DropdownMenuItem
                                      key={asset.id}
                                      className="flex items-center justify-between gap-2 cursor-pointer"
                                      onSelect={() => setContentData(p => ({ ...p, backgroundMusic: asset.url, musicLabel: asset.originalName.replace(/\.[^/.]+$/, "") }))}
                                    >
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <FileAudio className="w-4 h-4 shrink-0 text-primary" />
                                        <span className="text-xs truncate">{asset.originalName}</span>
                                      </div>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          togglePreviewMusic(asset.url);
                                        }}
                                      >
                                        {playingMusic === asset.url ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                      </Button>
                                    </DropdownMenuItem>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        * Gunakan file MP3 berkualitas baik untuk pengalaman terbaik.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* RSVP Settings */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-muted/30">
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
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border">
                    <div className="space-y-2">
                      <Label>Batas RSVP</Label>
                      <Input
                        type="date"
                        value={contentData.rsvpDeadline}
                        onChange={e => setContentData(p => ({ ...p, rsvpDeadline: e.target.value }))}
                        data-testid="input-rsvp-deadline"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maks. Tamu per RSVP</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={contentData.maxGuests}
                        onChange={e => setContentData(p => ({ ...p, maxGuests: parseInt(e.target.value) || 1 }))}
                        data-testid="input-max-guests"
                      />
                    </div>
                  </div>
                )}
              </div>

              <SaveButton
                isPending={contentMutation.isPending}
                savedKey={savedSection}
                sectionKey="content"
                onClick={() => contentMutation.mutate()}
                testId="button-save-content"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Kisah Cinta Tab ── */}
        <TabsContent value="love-story">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0">
              <CardTitle className="text-base">Timeline Kisah Cinta</CardTitle>
              <Button size="sm" onClick={() => createLoveStoryMutation.mutate({
                title: "Pertama Bertemu",
                dateLabelText: "Januari 2020",
                description: "Tulis cerita singkat di sini...",
                sortOrder: loveStoryItems?.length || 0
              })} disabled={createLoveStoryMutation.isPending}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {loveStoryItems?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Belum ada timeline kisah cinta. Klik "Tambah Item" untuk memulai.
                </div>
              ) : (
                <div className="space-y-4">
                  {loveStoryItems?.map((item, idx) => (
                    <div key={item.id} className="p-4 border rounded-lg bg-card/50 space-y-3 relative group">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                          <Input
                            className="font-bold h-8 border-none p-0 focus-visible:ring-0 bg-transparent"
                            value={item.title}
                            placeholder="Judul"
                            onChange={(e) => updateLoveStoryMutation.mutate({ itemId: item.id, data: { title: e.target.value } })}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive h-8 w-8"
                          onClick={() => deleteLoveStoryMutation.mutate(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Label Tanggal / Waktu</Label>
                          <Input
                            value={item.dateLabelText}
                            placeholder="Contoh: Januari 2020"
                            onChange={(e) => updateLoveStoryMutation.mutate({ itemId: item.id, data: { dateLabelText: e.target.value } })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Foto URL (Opsional)</Label>
                          <Input
                            value={item.imageUrl || ""}
                            placeholder="https://..."
                            onChange={(e) => updateLoveStoryMutation.mutate({ itemId: item.id, data: { imageUrl: e.target.value } })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Cerita</Label>
                        <Textarea
                          className="min-h-[80px]"
                          value={item.description}
                          placeholder="Ceritakan momen indah ini..."
                          onChange={(e) => updateLoveStoryMutation.mutate({ itemId: item.id, data: { description: e.target.value } })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Galeri Tab ── */}
        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Galeri Foto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="Tempel URL foto (https://...)"
                  data-testid="input-gallery-url"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newImageUrl && !addImageMutation.isPending) {
                      addImageMutation.mutate();
                    }
                  }}
                />
                <Button
                  onClick={() => addImageMutation.mutate()}
                  disabled={!newImageUrl || addImageMutation.isPending}
                  className="gap-1.5 shrink-0"
                  data-testid="button-add-image"
                >
                  {addImageMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Plus className="w-4 h-4" />}
                  Tambah
                </Button>
              </div>
              {(!gallery || gallery.length === 0) ? (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <Image className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Belum ada foto.</p>
                  <p className="text-xs mt-1">Tempel URL foto di kolom atas, lalu klik Tambah.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {gallery.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-muted border border-border"
                      data-testid={`gallery-image-${img.id}`}
                    >
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:text-red-400"
                          onClick={() => deleteImageMutation.mutate(img.id)}
                          data-testid={`button-delete-image-${img.id}`}
                        >
                          {deleteImageMutation.isPending
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Total: {gallery?.length || 0} foto</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tema Tab ── */}
        <TabsContent value="theme">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-base">Pilih Tema & Warna</CardTitle>
              <SaveButton
                isPending={themeMutation.isPending || contentMutation.isPending}
                savedKey={savedSection}
                sectionKey="theme"
                onClick={() => {
                  contentMutation.mutate();
                }}
                testId="button-save-theme-tab"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Warna Preset</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'classic', name: 'Classic Gold', primary: '#B8960C', bg: '#FDFCF0' },
                    { id: 'rose_gold', name: 'Rose Gold', primary: '#C9956B', bg: '#FFF5F0' },
                    { id: 'sage', name: 'Sage Green', primary: '#6B7C5C', bg: '#F0F4F0' },
                    { id: 'black', name: 'Luxury Black', primary: '#1A1A1A', bg: '#F5F5F5' },
                    { id: 'white', name: 'Classic White', primary: '#A8A29E', bg: '#FFFFFF' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setContentData(p => ({ ...p, colorPreset: preset.id }))}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        contentData.colorPreset === preset.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:border-muted-foreground/20'
                      }`}
                      data-testid={`button-preset-${preset.id}`}
                    >
                      <div className="flex gap-1">
                        <div className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: preset.primary }} />
                        <div className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: preset.bg }} />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wider">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label>Desain Layout</Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "classic_elegant", label: "Classic Elegant", gradient: "from-stone-800 to-stone-600", desc: "Elegan & timeless" },
                    { value: "minimal_modern", label: "Minimal Modern", gradient: "from-zinc-900 to-zinc-700", desc: "Bersih & kontemporer" },
                    { value: "romantic_floral", label: "Romantic Floral", gradient: "from-rose-800 to-pink-600", desc: "Romantis & feminin" },
                    { value: "luxury_gold", label: "Luxury Gold", gradient: "from-yellow-800 to-amber-600", desc: "Mewah & berkesan" },
                  ].map((theme) => {
                    const isActive = invitation.theme === theme.value;
                    return (
                      <button
                        key={theme.value}
                        onClick={() => !isActive && themeMutation.mutate(theme.value)}
                        disabled={themeMutation.isPending}
                        className={`rounded-xl overflow-hidden border-2 transition-all text-left ${
                          isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                        }`}
                        data-testid={`theme-${theme.value}`}
                      >
                        <div className={`aspect-[3/2] bg-gradient-to-b ${theme.gradient} flex flex-col items-center justify-center gap-1 relative`}>
                          {themeMutation.isPending && isActive && (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          )}
                          {isActive && !themeMutation.isPending && (
                            <CheckCircle className="w-5 h-5 text-white" />
                          )}
                          <span className="text-white/90 text-xs font-medium">{theme.label}</span>
                        </div>
                        <div className={`p-2.5 text-center bg-card ${isActive ? "bg-primary/5" : ""}`}>
                          <p className="text-xs font-semibold text-foreground">{theme.label}</p>
                          <p className="text-xs text-muted-foreground">{theme.desc}</p>
                          {isActive && (
                            <Badge variant="default" className="text-xs mt-1">Aktif</Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pengaturan Tab ── */}
        <TabsContent value="settings">
          <div className="space-y-4">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi Dasar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Judul Undangan</Label>
                  <Input
                    value={settingsData.title}
                    onChange={e => setSettingsData(p => ({ ...p, title: e.target.value }))}
                    placeholder="Pernikahan Ahmad & Sari"
                    data-testid="input-invitation-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Undangan</Label>
                  <div className="flex items-center border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                    <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-input whitespace-nowrap">/invite/</span>
                    <div className="flex-1 flex items-center">
                      <Input
                        value={settingsData.slug}
                        onChange={e => setSettingsData(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                        className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="ahmad-dan-sari"
                        data-testid="input-invitation-slug"
                      />
                      <span className="px-2 shrink-0">
                        {settingsSlugChanged && slugStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        {settingsSlugChanged && slugStatus === "available" && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {settingsSlugChanged && slugStatus === "taken" && <XCircle className="w-4 h-4 text-destructive" />}
                      </span>
                    </div>
                  </div>
                  {settingsSlugChanged && slugStatus === "taken" && (
                    <p className="text-xs text-destructive">URL ini sudah dipakai undangan lain</p>
                  )}
                  {settingsSlugChanged && slugStatus === "available" && (
                    <p className="text-xs text-green-600">URL tersedia</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Foto Cover (URL)</Label>
                  <Input
                    value={settingsData.coverImage}
                    onChange={e => setSettingsData(p => ({ ...p, coverImage: e.target.value }))}
                    placeholder="https://... (foto latar belakang undangan)"
                    data-testid="input-cover-image"
                  />
                  {settingsData.coverImage && (
                    <div className="relative rounded-lg overflow-hidden border border-border aspect-video max-w-sm">
                      <img src={settingsData.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Video Prewedding URL (YouTube/Vimeo)</Label>
                  <Input
                    value={contentData.videoUrl}
                    onChange={e => setContentData(p => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    data-testid="input-video-url"
                  />
                  <p className="text-[10px] text-muted-foreground">Masukkan URL video YouTube atau Vimeo untuk ditampilkan di undangan.</p>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-foreground">Aktifkan Save The Date</Label>
                      <p className="text-[10px] text-muted-foreground">Tampilkan halaman pengingat minimalis sebelum undangan resmi dibuka</p>
                    </div>
                    <Switch
                      checked={settingsData.saveTheDateEnabled}
                      onCheckedChange={checked => setSettingsData(p => ({ ...p, saveTheDateEnabled: checked }))}
                      data-testid="switch-save-the-date"
                    />
                  </div>

                  {settingsData.saveTheDateEnabled && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <Label>Pesan Save The Date (Opsional)</Label>
                      <Textarea
                        value={settingsData.saveTheDateMessage}
                        onChange={e => setSettingsData(p => ({ ...p, saveTheDateMessage: e.target.value }))}
                        placeholder="Mohon simpan tanggal pernikahan kami..."
                        rows={2}
                        data-testid="input-save-the-date-message"
                      />
                    </div>
                  )}
                </div>

                <SaveButton
                  isPending={settingsMutation.isPending}
                  savedKey={savedSection}
                  sectionKey="settings"
                  onClick={() => settingsMutation.mutate()}
                  testId="button-save-settings"
                />
              </CardContent>
            </Card>

            {/* Publish Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Publikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Status Saat Ini</p>
                    <p className="text-xs text-muted-foreground">
                      {invitation.status === "published"
                        ? "Undangan aktif dan bisa diakses publik"
                        : "Undangan belum dipublish — hanya kamu yang bisa melihat"}
                    </p>
                  </div>
                  <Badge variant={invitation.status === "published" ? "default" : "outline"}>
                    {invitation.status === "published" ? "Dipublish" : "Draft"}
                  </Badge>
                </div>
                {invitation.status === "published" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-green-800 dark:text-green-300">Link Undangan Aktif:</p>
                        <p className="text-xs font-mono text-green-700 dark:text-green-400 truncate">{window.location.origin}/invite/{invitation.slug}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={copyLink} className="shrink-0" data-testid="button-copy-link-settings" title="Salin link">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <a href={`/invite/${invitation.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="shrink-0" title="Buka undangan">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> Bagikan ke:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Kami mengundang Anda ke pernikahan kami! 💕\n${window.location.origin}/invite/${invitation.slug}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="button-share-whatsapp"
                        >
                          <Button size="sm" variant="outline" className="gap-2 w-full text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            WhatsApp
                          </Button>
                        </a>
                        <a
                          href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/invite/${invitation.slug}`)}&text=${encodeURIComponent(`Kami mengundang Anda ke pernikahan kami! 💕`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="button-share-telegram"
                        >
                          <Button size="sm" variant="outline" className="gap-2 w-full text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                            Telegram
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                <Button
                  variant={invitation.status === "published" ? "outline" : "default"}
                  onClick={() => publishMutation.mutate(invitation.status !== "published")}
                  disabled={publishMutation.isPending}
                  className="gap-2 w-full"
                  data-testid="button-toggle-publish"
                >
                  {publishMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Globe className="w-4 h-4" />}
                  {invitation.status === "published" ? "Unpublish Undangan" : "Publish Undangan"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Publish validation error dialog */}
      <AlertDialog open={publishErrorOpen} onOpenChange={setPublishErrorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undangan Belum Bisa Dipublish</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">Lengkapi data berikut sebelum mempublish undangan:</p>
                <ul className="space-y-1.5">
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
            <AlertDialogCancel data-testid="button-close-publish-error">Tutup & Lengkapi</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
