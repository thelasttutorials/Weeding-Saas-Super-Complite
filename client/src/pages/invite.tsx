import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Clock, Heart, Copy, ExternalLink, Music, Video, Gift, MessageCircle, Users, ChevronDown, CheckCircle, Loader2, Share2, Facebook, Mail } from "lucide-react";
import type { FullInvitation, GuestMessage, WeddingTheme, WeddingThemeBlock, LoveStoryItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import ThemeRenderer from "@/components/theme-renderer";
import { Lightbox } from "@/components/lightbox";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PublicInvitation extends FullInvitation {
  userPlan?: string;
  loveStory?: LoveStoryItem[];
}

const rsvpSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  whatsapp: z.string().optional(),
  guestCount: z.number().min(1).max(10),
  status: z.enum(["attending", "not_attending"]),
  message: z.string().optional(),
});

const messageSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  message: z.string().min(5, "Pesan minimal 5 karakter"),
});

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const parsed = targetDate ? new Date(targetDate).getTime() : NaN;
    if (!targetDate || isNaN(parsed)) return;

    const calc = () => {
      const diff = parsed - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-3 justify-center">
      {[{ v: timeLeft.days, l: "Hari" }, { v: timeLeft.hours, l: "Jam" }, { v: timeLeft.minutes, l: "Menit" }, { v: timeLeft.seconds, l: "Detik" }].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold text-white">{String(v).padStart(2, "0")}</span>
          </div>
          <p className="text-xs text-white/70 mt-1">{l}</p>
        </div>
      ))}
    </div>
  );
}

function getThemeStyles(theme: string, preset?: string) {
  const presets: Record<string, any> = {
    'classic': { primary: '#B8960C', accent: '#B8960C', bg: '#FDFCF0', text: '#44403C', btn: '#B8960C', btnText: '#FFFFFF', card: 'rgba(184, 150, 12, 0.05)', border: 'rgba(184, 150, 12, 0.2)' },
    'rose_gold': { primary: '#C9956B', accent: '#C9956B', bg: '#FFF5F0', text: '#57534E', btn: '#C9956B', btnText: '#FFFFFF', card: 'rgba(201, 149, 107, 0.05)', border: 'rgba(201, 149, 107, 0.2)' },
    'sage': { primary: '#6B7C5C', accent: '#6B7C5C', bg: '#F0F4F0', text: '#44403C', btn: '#6B7C5C', btnText: '#FFFFFF', card: 'rgba(107, 124, 92, 0.05)', border: 'rgba(107, 124, 92, 0.2)' },
    'black': { primary: '#1A1A1A', accent: '#444444', bg: '#F5F5F5', text: '#1A1A1A', btn: '#1A1A1A', btnText: '#FFFFFF', card: 'rgba(26, 26, 26, 0.05)', border: 'rgba(26, 26, 26, 0.2)' },
    'white': { primary: '#A8A29E', accent: '#78716C', bg: '#FFFFFF', text: '#292524', btn: '#292524', btnText: '#FFFFFF', card: 'rgba(120, 113, 108, 0.05)', border: 'rgba(120, 113, 108, 0.2)' },
  };

  const activePreset = presets[preset || 'classic'] || presets.classic;

  const themeStyles = {
    minimal_modern: { bg: "bg-zinc-900", accent: "text-zinc-100", overlay: "from-zinc-900/90 to-zinc-800/70", card: "bg-zinc-800/80 border-zinc-700", btn: "bg-white text-zinc-900" },
    romantic_floral: { bg: "bg-rose-950", accent: "text-rose-200", overlay: "from-rose-950/90 to-pink-900/70", card: "bg-rose-900/60 border-rose-800", btn: "bg-rose-400 text-white" },
    luxury_gold: { bg: "bg-yellow-950", accent: "text-amber-200", overlay: "from-yellow-950/90 to-amber-900/70", card: "bg-yellow-900/60 border-amber-800", btn: "bg-amber-400 text-yellow-950" },
    classic_elegant: { bg: "bg-stone-950", accent: "text-stone-200", overlay: "from-stone-950/90 to-stone-800/70", card: "bg-stone-800/60 border-stone-700", btn: "bg-white text-stone-900" }
  };

  const base = themeStyles[theme as keyof typeof themeStyles] || themeStyles.classic_elegant;
  return { ...base, preset: activePreset };
}

export default function InvitePage() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearch();
  const { toast } = useToast();
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [msgSubmitted, setMsgSubmitted] = useState(false);
  const [giftConfirmSubmitted, setGiftConfirmSubmitted] = useState(false);
  const [showGiftConfirm, setShowGiftConfirm] = useState(false);
  const [copyingGift, setCopyingGift] = useState<string | null>(null);
  const [giftConfirmData, setGiftConfirmData] = useState({ name: "", amount: "", message: "" });
  const [showQrisModal, setShowQrisModal] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const params = new URLSearchParams(search);
  const guestToken = params.get("guest") || "";
  const guestNameTo = params.get("to") || "";

  const { data: guestData } = useQuery<{ name: string, eventAssignment: string }>({
    queryKey: ["/api/guests/token", guestToken],
    enabled: !!guestToken,
  });

  const guestName = guestData?.name || guestNameTo || "";
  const eventAssignment = guestData?.eventAssignment || "both";

  const { data: invitation, isLoading, error } = useQuery<PublicInvitation>({
    queryKey: ["/api/public", slug],
    queryFn: () => fetch(`/api/public/${slug}`).then(r => {
      if (!r.ok) throw new Error("Invitation not found");
      return r.json();
    }),
  });

  const { data: customTheme } = useQuery<{ theme: WeddingTheme, blocks: WeddingThemeBlock[] }>({
    queryKey: ["/api/public/themes", invitation?.customThemeId],
    queryFn: () => fetch(`/api/public/themes/${invitation?.customThemeId}`).then(r => r.json()),
    enabled: !!invitation?.customThemeId,
  });

  const { data: messages } = useQuery<GuestMessage[]>({
    queryKey: ["/api/public", slug, "messages"],
    queryFn: () => fetch(`/api/public/${slug}/messages`).then(r => r.json()),
    enabled: !!invitation,
    refetchInterval: 30000,
  });

  // Dynamic SEO — set document title + OG meta tags when invitation loads
  useEffect(() => {
    if (!invitation) return;
    const couple = invitation.couple;
    const names = couple?.brideName && couple?.groomName
      ? `${couple.brideName} & ${couple.groomName}`
      : invitation.title;
    document.title = `Undangan Pernikahan ${names} | WedSaaS`;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("og:title", `Undangan Pernikahan ${names}`);
    setMeta("og:description", invitation.content?.openingQuote || `Kami mengundang Anda ke pernikahan ${names}`);
    setMeta("og:type", "website");
    if (invitation.coverImage) setMeta("og:image", invitation.coverImage);
    else if (couple?.couplePhoto) setMeta("og:image", couple.couplePhoto);

    return () => { document.title = "WedSaaS"; };
  }, [invitation]);

  const rsvpForm = useForm<z.infer<typeof rsvpSchema>>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: { name: guestName, whatsapp: "", guestCount: 1, status: "attending", message: "" },
  });

  const msgForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { name: guestName, message: "" },
  });

  useEffect(() => {
    if (guestName) {
      rsvpForm.setValue("name", guestName);
      msgForm.setValue("name", guestName);
    }
  }, [guestName, rsvpForm, msgForm]);

  const rsvpMutation = useMutation({
    mutationFn: (data: z.infer<typeof rsvpSchema>) =>
      apiRequest("POST", `/api/public/${slug}/rsvp`, data),
    onSuccess: () => { setRsvpSubmitted(true); toast({ title: "RSVP berhasil!", description: "Terima kasih atas konfirmasimu!" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const msgMutation = useMutation({
    mutationFn: (data: z.infer<typeof messageSchema>) =>
      apiRequest("POST", `/api/public/${slug}/messages`, data),
    onSuccess: () => { setMsgSubmitted(true); msgForm.reset(); toast({ title: "Ucapan terkirim!" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const giftConfirmMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/public/${slug}/gift-confirmation`, giftConfirmData),
    onSuccess: () => {
      setGiftConfirmSubmitted(true);
      setGiftConfirmData({ name: "", amount: "", message: "" });
      toast({ title: "Konfirmasi terkirim!", description: "Terima kasih atas hadiahmu!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const [playingMusic, setPlayingMusic] = useState(false);
  const [audio] = useState(() => new Audio());

  useEffect(() => {
    if (!invitation?.content?.backgroundMusic || !invitation.content.musicEnabled) return;
    audio.src = invitation.content.backgroundMusic;
    audio.loop = true;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [invitation, audio]);

  const copyGiftNumber = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopyingGift(id);
    setTimeout(() => setCopyingGift(null), 2000);
    toast({ title: "Nomor disalin!" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 fill-current mx-auto mb-4 animate-pulse" />
          <p className="text-stone-400 text-sm">Memuat undangan...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="text-center">
          <Heart className="w-12 h-12 text-stone-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-200 mb-2">Undangan tidak ditemukan</h2>
          <p className="text-stone-400 text-sm">Link undangan tidak valid atau belum dipublish.</p>
        </div>
      </div>
    );
  }

  if (invitation.customThemeId && customTheme) {
    const globalSettings = typeof customTheme.theme.globalSettings === 'string' 
      ? JSON.parse(customTheme.theme.globalSettings) 
      : customTheme.theme.globalSettings;
      
    return (
      <ThemeRenderer 
        blocks={customTheme.blocks} 
        invitationData={invitation} 
        globalSettings={globalSettings}
      />
    );
  }

  const toggleMusic = () => {
    if (playingMusic) {
      audio.pause();
      setPlayingMusic(false);
    } else {
      audio.play().then(() => setPlayingMusic(true));
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch { return d; }
  };

  const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}.${m} ${hour >= 12 ? "WIB" : "WIB"}`;
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const getCalendarLink = (event: { title: string, date: string, time: string, venue: string }) => {
    const title = encodeURIComponent(event.title);
    const location = encodeURIComponent(event.venue);
    // Simple date format for Google Calendar (YYYYMMDDTHHMMSSZ)
    // We assume WIB (UTC+7)
    const d = new Date(event.date);
    const dateStr = d.toISOString().replace(/-|:|\.\d+/g, "");
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=Undangan+Pernikahan&location=${location}&sf=true&output=xml`;
  };

  const downloadICS = (event: { title: string, date: string, time: string, venue: string }) => {
    const d = new Date(event.date);
    const dateStr = d.toISOString().replace(/-|:|\.\d+/g, "").split("T")[0];
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${dateStr}T000000Z
DTEND:${dateStr}T235959Z
SUMMARY:${event.title}
LOCATION:${event.venue}
DESCRIPTION:Undangan Pernikahan
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", "event.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getWazeLink = (venue: string) => `https://waze.com/ul?q=${encodeURIComponent(venue)}&navigate=yes`;
  const getAppleMapsLink = (venue: string) => `https://maps.apple.com/?q=${encodeURIComponent(venue)}`;

  const styles = getThemeStyles(invitation.theme, invitation.content?.colorPreset);
  const couple = invitation.couple;
  const events = invitation.events;
  const content = invitation.content;
  const gallery = invitation.gallery;

  return (
    <div 
      className={`min-h-screen ${styles.bg} font-serif`} 
      style={{ 
        fontFamily: "Georgia, 'Times New Roman', serif",
        ["--invite-primary" as any]: styles.preset.primary,
        ["--invite-accent" as any]: styles.preset.accent,
        ["--invite-bg" as any]: styles.preset.bg,
        ["--invite-text" as any]: styles.preset.text,
        ["--invite-btn" as any]: styles.preset.btn,
        ["--invite-btn-text" as any]: styles.preset.btnText,
        ["--invite-card" as any]: styles.preset.card,
        ["--invite-border" as any]: styles.preset.border,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .invite-custom-bg { background-color: var(--invite-bg); color: var(--invite-text); }
        .invite-custom-text-primary { color: var(--invite-primary); }
        .invite-custom-btn { background-color: var(--invite-btn); color: var(--invite-btn-text); }
        .invite-custom-card { background-color: var(--invite-card); border-color: var(--invite-border); }
        .invite-custom-border { border-color: var(--invite-border); }
        .invite-custom-accent { color: var(--invite-accent); }
      `}} />
      {/* Music Control */}
      {content?.musicEnabled && content?.showMusicControl && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover-elevate active-elevate-2 transition-all"
          data-testid="button-toggle-music"
        >
          {playingMusic ? (
            <div className="relative w-6 h-6 flex items-center justify-center">
              <Music className="w-5 h-5 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full border-2 border-white/30 rounded-full animate-ping" />
              </div>
            </div>
          ) : (
            <Music className="w-5 h-5 opacity-50" />
          )}
          {content.musicLabel && playingMusic && (
            <div className="absolute left-14 bg-black/60 backdrop-blur-md border border-white/20 rounded-md px-3 py-1.5 whitespace-nowrap overflow-hidden max-w-[200px]">
              <p className="text-[10px] font-sans text-white/90 animate-marquee">{content.musicLabel}</p>
            </div>
          )}
        </button>
      )}

      {/* Opening / Hero Cover */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        {invitation.coverImage ? (
          <>
            <img src={invitation.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-b ${styles.overlay}`} />
          </>
        ) : couple?.couplePhoto ? (
          <>
            <img src={couple.couplePhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-b ${styles.overlay}`} />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-b ${styles.overlay}`} />
        )}
        <div className="relative z-10 text-center max-w-lg">
          {guestName && (
            <p className="text-white/70 text-sm mb-2 italic">Kepada Yth.</p>
          )}
          {guestName && (
            <p className="text-white text-xl font-bold mb-8">{guestName}</p>
          )}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-12 bg-white/30" />
              <Heart className="w-5 h-5 text-white/70 fill-current" />
              <div className="h-px w-12 bg-white/30" />
            </div>
            <p className="text-white/60 text-sm uppercase tracking-widest mb-6">Undangan Pernikahan</p>
          </div>

          {couple && (couple.brideName || couple.groomName) && (
            <>
              {couple.couplePhoto && !invitation.coverImage && (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-white/30 mx-auto mb-6">
                  <img src={couple.couplePhoto} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-3">
                {couple?.brideName}
                <span className="block text-2xl sm:text-3xl text-white/60 my-2">&</span>
                {couple?.groomName}
              </h1>
            </>
          )}

          {events?.receptionDate && (
            <p className="invite-custom-accent text-sm tracking-widest mb-8">
              {formatDate(events.receptionDate)}
            </p>
          )}

          {events?.receptionDate && (
            <div className="mb-8">
              <Countdown targetDate={events.receptionDate} />
            </div>
          )}

          <button
            onClick={() => {
              document.getElementById("section-couple")?.scrollIntoView({ behavior: "smooth" });
              if (invitation.content?.musicEnabled && !playingMusic) {
                audio.play().then(() => setPlayingMusic(true)).catch(err => console.error("Autoplay failed:", err));
              }
            }}
            className="px-8 py-3 rounded-full bg-white text-stone-900 font-sans font-bold text-sm hover-elevate active-elevate-2 transition-all mb-8 invite-custom-btn"
            data-testid="button-open-invitation"
          >
            Buka Undangan
          </button>
          <button
            onClick={() => document.getElementById("section-couple")?.scrollIntoView({ behavior: "smooth" })}
            className="text-white/50 animate-bounce mx-auto block"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Opening Quote */}
      {content?.openingQuote && (
        <section className="py-16 px-4 text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/10" />
            <Heart className="w-4 h-4 text-white/30 fill-current" />
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <p className="text-white/70 text-base leading-relaxed italic">"{content.openingQuote}"</p>
        </section>
      )}

      {/* Couple Section */}
      {couple && (couple.brideName || couple.groomName) && (
        <section id="section-couple" className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-8">Mempelai</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              {/* Bride */}
              <div className="text-center">
                {couple.bridePhoto && (
                  <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-2 border-white/20">
                    <img src={couple.bridePhoto} alt={couple.brideName} className="w-full h-full object-cover" />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-white mb-1">{couple.brideName}</h2>
                {couple.brideParents && <p className="text-white/50 text-sm italic">Putri dari {couple.brideParents}</p>}
              </div>

              {/* Divider */}
              <div className="hidden sm:flex sm:col-span-2 sm:hidden" />

              {/* Groom */}
              <div className="text-center">
                {couple.groomPhoto && (
                  <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-2 border-white/20">
                    <img src={couple.groomPhoto} alt={couple.groomName} className="w-full h-full object-cover" />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-white mb-1">{couple.groomName}</h2>
                {couple.groomParents && <p className="text-white/50 text-sm italic">Putra dari {couple.groomParents}</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Love Story */}
      {couple?.loveStory && (
        <section className="py-12 px-4 max-w-2xl mx-auto text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-6">Kisah Cinta</p>
          <p className="text-white/70 leading-relaxed">{couple.loveStory}</p>
        </section>
      )}

      {/* Love Story */}
      {invitation.loveStory && invitation.loveStory.length > 0 && (
        <section className="py-16 px-4 bg-white/5">
          <div className="max-w-2xl mx-auto">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-12 text-center">Perjalanan Cinta Kami</p>
            <div className="relative border-l border-white/10 ml-4 sm:ml-auto sm:mr-auto pl-8 sm:pl-0">
              {invitation.loveStory.map((item, idx) => (
                <div key={item.id} className={`relative mb-12 ${idx % 2 === 0 ? 'sm:pr-1/2 sm:text-right sm:ml-0 sm:mr-auto' : 'sm:pl-1/2 sm:text-left sm:ml-auto sm:mr-0'}`}>
                  {/* Dot */}
                  <div className="absolute top-0 -left-[33px] sm:left-1/2 sm:-ml-1.5 w-3 h-3 rounded-full bg-white/30 border border-white/50" style={{ backgroundColor: 'var(--invite-primary)' }} />
                  
                  <div className={`relative ${idx % 2 === 0 ? 'sm:mr-10' : 'sm:ml-10'}`}>
                    <p className="invite-custom-accent text-xs font-sans font-bold uppercase tracking-tighter mb-1">{item.dateLabelText}</p>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    {item.imageUrl && (
                      <div className={`mb-3 rounded-lg overflow-hidden border border-white/10 aspect-video ${idx % 2 === 0 ? 'sm:ml-auto' : ''} max-w-[300px]`}>
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Event Details */}
      {events && (events.akadDate || events.receptionDate) && (
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-8 text-center">Detail Acara</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {events.akadDate && (eventAssignment === "both" || eventAssignment === "akad") && (
                <div className={`p-6 rounded-xl border ${styles.card} text-center invite-custom-card`}>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Akad Nikah</p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-white/50" />
                    <p className="text-white text-sm">{formatDate(events.akadDate)}</p>
                  </div>
                  {events.akadTime && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-white/50" />
                      <p className="text-white/80 text-sm">{events.akadTime} WIB</p>
                    </div>
                  )}
                  {events.akadVenue && (
                    <div className="flex items-start justify-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
                      <p className="text-white/70 text-sm">{events.akadVenue}</p>
                    </div>
                  )}
                  {events.akadMapsLink && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <a href={events.akadMapsLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] sm:text-xs rounded-full gap-1.5 no-default-hover-elevate">
                          <MapPin className="w-3 h-3" /> Google Maps
                        </Button>
                      </a>
                      <a href={getWazeLink(events.akadVenue)} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] sm:text-xs rounded-full gap-1.5 no-default-hover-elevate">
                          <ExternalLink className="w-3 h-3" /> Waze
                        </Button>
                      </a>
                      <a href={getAppleMapsLink(events.akadVenue)} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] sm:text-xs rounded-full gap-1.5 no-default-hover-elevate">
                          <MapPin className="w-3 h-3" /> Apple Maps
                        </Button>
                      </a>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-[10px] sm:text-xs rounded-full gap-1.5 no-default-hover-elevate"
                        onClick={() => downloadICS({ title: `Akad Nikah ${couple?.brideName ?? ""} & ${couple?.groomName ?? ""}`, date: events.akadDate, time: events.akadTime, venue: events.akadVenue })}
                      >
                        <Calendar className="w-3 h-3" /> + Calendar
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {events.receptionDate && (eventAssignment === "both" || eventAssignment === "reception") && (
                <div className={`p-6 rounded-xl border ${styles.card} text-center invite-custom-card`}>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Resepsi Pernikahan</p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-white/50" />
                    <p className="text-white text-sm">{formatDate(events.receptionDate)}</p>
                  </div>
                  {events.receptionTime && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-white/50" />
                      <p className="text-white/80 text-sm">{events.receptionTime} WIB</p>
                    </div>
                  )}
                  {events.receptionVenue && (
                    <div className="flex items-start justify-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
                      <p className="text-white/70 text-sm">{events.receptionVenue}</p>
                    </div>
                  )}
                  {events.receptionMapsLink && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <a href={events.receptionMapsLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] sm:text-xs rounded-full gap-1.5 no-default-hover-elevate">
                          <MapPin className="w-3 h-3" /> Google Maps
                        </Button>
                      </a>
                      <a href={getWazeLink(events.receptionVenue)} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] sm:text-xs rounded-full gap-1.5 no-default-hover-elevate">
                          <ExternalLink className="w-3 h-3" /> Waze
                        </Button>
                      </a>
                      <a href={getAppleMapsLink(events.receptionVenue)} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] sm:text-xs rounded-full gap-1.5 no-default-hover-elevate">
                          <MapPin className="w-3 h-3" /> Apple Maps
                        </Button>
                      </a>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-[10px] sm:text-xs rounded-full gap-1.5 no-default-hover-elevate"
                        onClick={() => downloadICS({ title: `Resepsi Pernikahan ${couple?.brideName ?? ""} & ${couple?.groomName ?? ""}`, date: events.receptionDate, time: events.receptionTime, venue: events.receptionVenue })}
                      >
                        <Calendar className="w-3 h-3" /> + Calendar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery && gallery.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-8 text-center">Galeri Foto</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {gallery.map((img, idx) => (
                <div 
                  key={img.id} 
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer group hover-elevate"
                  onClick={() => openLightbox(idx)}
                  data-testid={`gallery-image-${idx}`}
                >
                  <img src={img.imageUrl} alt={img.caption || ""} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
              ))}
            </div>

            {content?.videoUrl && (
              <div className="mt-12 aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <iframe
                  src={content.videoUrl.includes("youtube.com") 
                    ? `https://www.youtube.com/embed/${content.videoUrl.split("v=")[1]?.split("&")[0] || content.videoUrl.split("/").pop()}`
                    : content.videoUrl.includes("vimeo.com")
                    ? `https://player.vimeo.com/video/${content.videoUrl.split("/").pop()}`
                    : content.videoUrl
                  }
                  className="w-full h-full"
                  allowFullScreen
                  title="Wedding Video"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Livestream Link */}
      {content?.livestreamLink && (
        <section className="py-8 px-4 text-center">
          <a href={content.livestreamLink} target="_blank" rel="noopener noreferrer">
            <button className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full ${styles.btn} font-sans text-sm font-medium`}>
              <Video className="w-4 h-4" />
              Saksikan Livestream
            </button>
          </a>
        </section>
      )}

      {/* Hashtag */}
      {content?.hashtag && (
        <section className="py-6 px-4 text-center">
          <p className="text-white/40 text-sm">Gunakan hashtag</p>
          <p className={`text-xl font-bold mt-1 ${styles.accent}`}>{content.hashtag}</p>
        </section>
      )}

      {/* RSVP Form */}
      {content?.enableRsvp && (
        <section className="py-16 px-4">
          <div className="max-w-lg mx-auto">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2 text-center">Konfirmasi Kehadiran</p>
            <p className="text-white/60 text-sm text-center mb-8">Mohon konfirmasi kehadiranmu</p>

            {rsvpSubmitted ? (
              <div className={`p-8 rounded-xl border ${styles.card} text-center`}>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold text-lg mb-2">Terima kasih!</h3>
                <p className="text-white/60 text-sm">RSVP kamu telah kami terima. Sampai jumpa di hari bahagia ini!</p>
              </div>
            ) : (
              <div className={`p-6 rounded-xl border ${styles.card}`}>
                <Form {...rsvpForm}>
                  <form onSubmit={rsvpForm.handleSubmit(d => rsvpMutation.mutate(d))} className="space-y-4">
                    <FormField control={rsvpForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-sans font-medium">Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Nama lengkap"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-sans"
                            data-testid="input-rsvp-name"
                          />
                        </FormControl>
                        <FormMessage className="font-sans text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={rsvpForm.control} name="whatsapp" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-sans font-medium">No. WhatsApp (opsional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="08123456789"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-sans"
                            data-testid="input-rsvp-whatsapp"
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={rsvpForm.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-sans font-medium">Konfirmasi Kehadiran</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-2 gap-3"
                          >
                            {[{ val: "attending", label: "Insya Allah Hadir" }, { val: "not_attending", label: "Tidak Bisa Hadir" }].map(opt => (
                              <div key={opt.val} className={`relative flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${field.value === opt.val ? "border-white/50 bg-white/15" : "border-white/10 bg-white/5"}`}>
                                <RadioGroupItem value={opt.val} id={opt.val} className="text-white border-white/40" />
                                <label htmlFor={opt.val} className="text-white/80 text-sm cursor-pointer font-sans">{opt.label}</label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )} />
                    {rsvpForm.watch("status") === "attending" && (
                      <FormField control={rsvpForm.control} name="guestCount" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70 text-sm font-sans font-medium">Jumlah Tamu</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={content?.maxGuests || 5}
                              value={field.value}
                              onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                              className="bg-white/10 border-white/20 text-white font-sans"
                              data-testid="input-rsvp-guest-count"
                            />
                          </FormControl>
                        </FormItem>
                      )} />
                    )}
                    <FormField control={rsvpForm.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-sans font-medium">Ucapan / Pesan (opsional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tuliskan ucapan untuk mempelai..."
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-sans resize-none"
                            rows={3}
                            data-testid="input-rsvp-message"
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                    <button
                      type="submit"
                      disabled={rsvpMutation.isPending}
                      className={`w-full py-3 rounded-lg ${styles.btn} font-sans font-semibold text-sm flex items-center justify-center gap-2`}
                      data-testid="button-submit-rsvp"
                    >
                      {rsvpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Kirim Konfirmasi
                    </button>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Guest Messages */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2 text-center">Ucapan & Doa</p>
          <p className="text-white/60 text-sm text-center mb-8">Kirimkan ucapan dan doa terbaikmu</p>

          {/* Send message form */}
          {!msgSubmitted ? (
            <div className={`p-5 rounded-xl border ${styles.card} mb-6`}>
              <Form {...msgForm}>
                <form onSubmit={msgForm.handleSubmit(d => msgMutation.mutate(d))} className="space-y-3">
                  <FormField control={msgForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm font-sans font-medium">Nama</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nama kamu" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-sans" data-testid="input-message-name" />
                      </FormControl>
                      <FormMessage className="font-sans text-xs" />
                    </FormItem>
                  )} />
                  <FormField control={msgForm.control} name="message" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm font-sans font-medium">Ucapan</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Tuliskan ucapan dan doa terbaikmu..." className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-sans resize-none" rows={3} data-testid="input-message-text" />
                      </FormControl>
                      <FormMessage className="font-sans text-xs" />
                    </FormItem>
                  )} />
                  <button
                    type="submit"
                    disabled={msgMutation.isPending}
                    className={`w-full py-2.5 rounded-lg ${styles.btn} font-sans font-semibold text-sm flex items-center justify-center gap-2`}
                    data-testid="button-submit-message"
                  >
                    {msgMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    Kirim Ucapan
                  </button>
                </form>
              </Form>
            </div>
          ) : (
            <div className={`p-6 rounded-xl border ${styles.card} text-center mb-6`}>
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-white/80 font-sans text-sm">Ucapanmu sudah terkirim! Terima kasih</p>
            </div>
          )}

          {/* Messages list */}
          {messages && messages.length > 0 && (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-4 rounded-lg border ${styles.card}`}>
                  <p className="text-white font-semibold text-sm mb-1 font-sans">{msg.name}</p>
                  <p className="text-white/70 text-sm leading-relaxed">"{msg.message}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Digital Gift */}
      {(invitation.giftAccounts && invitation.giftAccounts.length > 0) || invitation.giftAddress ? (
        <section className="py-16 px-4">
          <div className="max-w-lg mx-auto">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2 text-center">Hadiah</p>
            <p className="text-white/60 text-sm text-center mb-8">Bagi yang ingin memberikan hadiah, berikut informasinya</p>

            {/* Rekening */}
            {invitation.giftAccounts && invitation.giftAccounts.length > 0 && (
              <div className="space-y-3 mb-6">
                {invitation.giftAccounts.map((gift) => (
                  <div key={gift.id} className={`p-4 rounded-xl border ${styles.card} invite-custom-card`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="invite-custom-accent text-white/50 text-xs uppercase tracking-widest mb-1 font-sans">
                          {gift.type === "bank" ? gift.bankName : (gift.type as string) === "qris" ? "QRIS" : gift.walletName}
                        </p>
                        {(gift.type as string) === "qris" ? (
                          <button
                            onClick={() => setShowQrisModal(gift.qrisUrl)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg ${styles.btn} text-xs font-sans font-bold invite-custom-btn hover-elevate active-elevate-2 transition-all mt-1`}
                          >
                            Tampilkan QRIS
                          </button>
                        ) : (
                          <>
                            <p className="text-white font-mono text-base">
                              {gift.type === "bank" ? gift.accountNumber : gift.walletNumber}
                            </p>
                            <p className="text-white/60 text-xs font-sans mt-0.5">{gift.accountHolder}</p>
                          </>
                        )}
                      </div>
                      {(gift.type as string) !== "qris" && (
                        <button
                          onClick={() => copyGiftNumber(gift.type === "bank" ? gift.accountNumber : gift.walletNumber, gift.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${styles.btn} text-xs font-sans font-medium shrink-0 invite-custom-btn`}
                          data-testid={`button-copy-gift-${gift.id}`}
                        >
                          {copyingGift === gift.id ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copyingGift === gift.id ? "Disalin!" : "Salin"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col items-center gap-4 mt-8">
              <p className="text-white/40 text-xs uppercase tracking-widest">Bagikan Kebahagiaan</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Kami mengundang Anda ke pernikahan kami! 💕\n${window.location.origin}/invite/${slug}`)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white font-sans text-xs font-bold hover:scale-105 transition-transform"
                  data-testid="button-share-whatsapp"
                >
                  <Share2 className="w-3.5 h-3.5" /> WhatsApp
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/invite/${slug}`)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1877F2] text-white font-sans text-xs font-bold hover:scale-105 transition-transform"
                  data-testid="button-share-facebook"
                >
                  <Facebook className="w-3.5 h-3.5" /> Facebook
                </a>
                <a 
                  href={`mailto:?subject=${encodeURIComponent(`Undangan Pernikahan ${couple?.brideName ?? ""} & ${couple?.groomName ?? ""}`)}&body=${encodeURIComponent(`Kami mengundang Anda ke pernikahan kami! 💕\n\nBuka undangan di: ${window.location.origin}/invite/${slug}`)}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-700 text-white font-sans text-xs font-bold hover:scale-105 transition-transform"
                  data-testid="button-share-email"
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              </div>
            </div>

            {/* Alamat Hadiah Fisik */}
            {invitation.giftAddress && (
              <div className={`p-4 rounded-xl border ${styles.card} mb-6`}>
                <p className="text-white/50 text-xs uppercase tracking-widest mb-2 font-sans flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  Alamat Pengiriman Hadiah
                </p>
                <p className="text-white/80 text-sm font-sans leading-relaxed">{invitation.giftAddress}</p>
              </div>
            )}

            {/* Gift Confirmation Form */}
            {invitation.giftAccounts && invitation.giftAccounts.length > 0 && (
              <div className="mt-4">
                {giftConfirmSubmitted ? (
                  <div className={`p-5 rounded-xl border ${styles.card} text-center`}>
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    <p className="text-white font-medium text-sm font-sans">Konfirmasi terkirim!</p>
                    <p className="text-white/50 text-xs font-sans mt-1">Terima kasih atas hadiahmu yang indah</p>
                    <button
                      onClick={() => setGiftConfirmSubmitted(false)}
                      className="text-white/40 text-xs font-sans mt-3 underline"
                    >
                      Kirim konfirmasi lain
                    </button>
                  </div>
                ) : !showGiftConfirm ? (
                  <button
                    onClick={() => setShowGiftConfirm(true)}
                    className={`w-full py-3 rounded-xl border ${styles.card} text-white/60 text-sm font-sans flex items-center justify-center gap-2 hover:text-white/80 transition-colors`}
                    data-testid="button-show-gift-confirm"
                  >
                    <Gift className="w-4 h-4" />
                    Sudah transfer? Konfirmasi di sini
                  </button>
                ) : (
                  <div className={`p-5 rounded-xl border ${styles.card}`}>
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-4 font-sans">Konfirmasi Hadiah</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-white/50 text-xs font-sans block mb-1.5">Nama Lengkap *</label>
                        <input
                          type="text"
                          value={giftConfirmData.name}
                          onChange={e => setGiftConfirmData(p => ({ ...p, name: e.target.value }))}
                          placeholder="Nama Anda"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-sans placeholder:text-white/20 focus:outline-none focus:border-white/30"
                          data-testid="input-gift-confirm-name"
                        />
                      </div>
                      <div>
                        <label className="text-white/50 text-xs font-sans block mb-1.5">Nominal Transfer (Opsional)</label>
                        <input
                          type="text"
                          value={giftConfirmData.amount}
                          onChange={e => setGiftConfirmData(p => ({ ...p, amount: e.target.value }))}
                          placeholder="Rp 500.000"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-sans placeholder:text-white/20 focus:outline-none focus:border-white/30"
                          data-testid="input-gift-confirm-amount"
                        />
                      </div>
                      <div>
                        <label className="text-white/50 text-xs font-sans block mb-1.5">Pesan (Opsional)</label>
                        <textarea
                          value={giftConfirmData.message}
                          onChange={e => setGiftConfirmData(p => ({ ...p, message: e.target.value }))}
                          placeholder="Semoga bahagia selalu..."
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-sans placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none"
                          data-testid="input-gift-confirm-message"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setShowGiftConfirm(false)}
                          className="flex-1 py-2 rounded-lg border border-white/10 text-white/50 text-sm font-sans hover:text-white/70 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => giftConfirmMutation.mutate()}
                          disabled={!giftConfirmData.name || giftConfirmMutation.isPending}
                          className={`flex-1 py-2 rounded-lg ${styles.btn} text-sm font-sans font-medium flex items-center justify-center gap-2 disabled:opacity-50`}
                          data-testid="button-submit-gift-confirm"
                        >
                          {giftConfirmMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Kirim Konfirmasi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Share Section */}
      <section className="py-12 px-4">
        <div className="max-w-sm mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/10" />
            <Share2 className="w-4 h-4 text-white/30" />
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Bagikan Undangan</p>
          {couple && (
            <p className="text-white/60 text-sm mb-6 font-sans">
              Ceritakan momen istimewa {couple.brideName} &amp; {couple.groomName} kepada orang tersayang
            </p>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                  toast({ title: "Link disalin!", description: "Link undangan berhasil disalin ke clipboard." });
                });
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border ${styles.card} text-white/70 text-sm font-sans hover:text-white/90 transition-colors shrink-0`}
              data-testid="button-share-copy-link"
            >
              <Copy className="w-4 h-4" />
              Salin Link
            </button>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `${couple ? `Hadir di pernikahan ${couple.brideName} & ${couple.groomName}? ` : ""}Lihat undangan lengkapnya di sini 💕\n${window.location.href}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 text-sm font-sans hover:bg-green-500/20 transition-colors shrink-0`}
              data-testid="button-share-whatsapp"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-600/30 bg-blue-600/10 text-blue-300 text-sm font-sans hover:bg-blue-600/20 transition-colors shrink-0`}
              data-testid="button-share-facebook"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Undangan Pernikahan ${couple?.brideName || ""} & ${couple?.groomName || ""}`)}&body=${encodeURIComponent(`Kami mengundang Anda ke pernikahan kami! 💕\n\nBuka undangan di: ${window.location.href}`)}`}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-500/30 bg-stone-500/10 text-stone-300 text-sm font-sans hover:bg-stone-500/20 transition-colors shrink-0`}
              data-testid="button-share-email"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(
                couple ? `Hadir di pernikahan ${couple.brideName} & ${couple.groomName}? Lihat undangan lengkapnya! 💕` : "Lihat undangan pernikahan ini! 💕"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-400/30 bg-blue-400/10 text-blue-300 text-sm font-sans hover:bg-blue-400/20 transition-colors shrink-0`}
              data-testid="button-share-telegram"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </a>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-lg mx-auto">
          {content?.closingMessage ? (
            <>
              <p className="text-white/60 leading-relaxed mb-8">{content.closingMessage}</p>
            </>
          ) : (
            <p className="text-white/50 text-sm mb-8">
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-white/10" />
            <Heart className="w-5 h-5 text-white/30 fill-current" />
            <div className="h-px w-12 bg-white/10" />
          </div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2 font-sans">Hormat Kami,</p>
          {couple && (
            <h2 className="text-3xl font-bold text-white mb-8">
              {couple.brideName} &amp; {couple.groomName}
            </h2>
          )}

          {/* Watermark for Free Plan */}
          {invitation.userPlan === "free" && (
            <div className="mt-8">
              <a 
                href="/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/40 transition-all group"
              >
                <span className="text-white/40 text-[10px] font-sans tracking-wide">Made with ❤️</span>
                <span className="text-white/70 text-[10px] font-sans font-bold group-hover:text-white transition-colors">WedSaaS</span>
              </a>
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!showQrisModal} onOpenChange={() => setShowQrisModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Scan QRIS</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {showQrisModal && (
              <img src={showQrisModal} alt="QRIS" className="w-full max-w-[300px] h-auto rounded-lg shadow-lg" />
            )}
            <p className="mt-4 text-sm text-muted-foreground text-center italic">
              Silakan scan QRIS di atas melalui aplikasi m-banking atau e-wallet pilihan Anda.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
