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
import { MapPin, Calendar, Clock, Heart, Copy, ExternalLink, Music, Video, Gift, MessageCircle, Users, ChevronDown, CheckCircle, Loader2 } from "lucide-react";
import type { FullInvitation, GuestMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return;
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

function getThemeStyles(theme: string) {
  switch (theme) {
    case "minimal_modern":
      return { bg: "bg-zinc-900", accent: "text-zinc-100", overlay: "from-zinc-900/90 to-zinc-800/70", card: "bg-zinc-800/80 border-zinc-700", btn: "bg-white text-zinc-900" };
    case "romantic_floral":
      return { bg: "bg-rose-950", accent: "text-rose-200", overlay: "from-rose-950/90 to-pink-900/70", card: "bg-rose-900/60 border-rose-800", btn: "bg-rose-400 text-white" };
    case "luxury_gold":
      return { bg: "bg-yellow-950", accent: "text-amber-200", overlay: "from-yellow-950/90 to-amber-900/70", card: "bg-yellow-900/60 border-amber-800", btn: "bg-amber-400 text-yellow-950" };
    default: // classic_elegant
      return { bg: "bg-stone-950", accent: "text-stone-200", overlay: "from-stone-950/90 to-stone-800/70", card: "bg-stone-800/60 border-stone-700", btn: "bg-white text-stone-900" };
  }
}

export default function InvitePage() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearch();
  const { toast } = useToast();
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [msgSubmitted, setMsgSubmitted] = useState(false);
  const [copyingGift, setCopyingGift] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const params = new URLSearchParams(search);
  const guestName = params.get("to") || "";

  const { data: invitation, isLoading, error } = useQuery<FullInvitation>({
    queryKey: ["/api/public", slug],
    queryFn: () => fetch(`/api/public/${slug}`).then(r => {
      if (!r.ok) throw new Error("Invitation not found");
      return r.json();
    }),
  });

  const { data: messages } = useQuery<GuestMessage[]>({
    queryKey: ["/api/public", slug, "messages"],
    queryFn: () => fetch(`/api/public/${slug}/messages`).then(r => r.json()),
    enabled: !!invitation,
    refetchInterval: 30000,
  });

  const rsvpForm = useForm<z.infer<typeof rsvpSchema>>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: { name: guestName, whatsapp: "", guestCount: 1, status: "attending", message: "" },
  });

  const msgForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { name: guestName, message: "" },
  });

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

  const styles = getThemeStyles(invitation.theme);
  const couple = invitation.couple;
  const events = invitation.events;
  const content = invitation.content;

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

  return (
    <div className={`min-h-screen ${styles.bg} font-serif`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Opening / Hero Cover */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        <div className={`absolute inset-0 bg-gradient-to-b ${styles.overlay}`} />
        {invitation.coverImage && (
          <img src={invitation.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="relative z-10 text-center max-w-lg">
          {guestName && (
            <p className="text-white/70 text-sm mb-6 italic">Kepada Yth.</p>
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
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-3">
                {couple.brideName}
                <span className="block text-2xl sm:text-3xl text-white/60 my-2">&</span>
                {couple.groomName}
              </h1>
            </>
          )}

          {events?.receptionDate && (
            <p className={`${styles.accent} text-sm tracking-widest mb-8`}>
              {formatDate(events.receptionDate)}
            </p>
          )}

          {events?.receptionDate && (
            <div className="mb-8">
              <Countdown targetDate={events.receptionDate} />
            </div>
          )}

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

      {/* Event Details */}
      {events && (events.akadDate || events.receptionDate) && (
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-8 text-center">Detail Acara</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {events.akadDate && (
                <div className={`p-6 rounded-xl border ${styles.card} text-center`}>
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
                    <a href={events.akadMapsLink} target="_blank" rel="noopener noreferrer">
                      <button className={`text-xs px-3 py-1.5 rounded-full ${styles.btn} font-sans`}>
                        Lihat Peta
                      </button>
                    </a>
                  )}
                </div>
              )}

              {events.receptionDate && (
                <div className={`p-6 rounded-xl border ${styles.card} text-center`}>
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
                    <a href={events.receptionMapsLink} target="_blank" rel="noopener noreferrer">
                      <button className={`text-xs px-3 py-1.5 rounded-full ${styles.btn} font-sans`}>
                        Lihat Peta
                      </button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {invitation.gallery && invitation.gallery.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-8 text-center">Galeri</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {invitation.gallery.map((img) => (
                <div key={img.id} className="aspect-square rounded-lg overflow-hidden">
                  <img src={img.imageUrl} alt={img.caption || ""} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
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
                              onChange={e => field.onChange(parseInt(e.target.value))}
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
      {invitation.giftAccounts && invitation.giftAccounts.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-lg mx-auto">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2 text-center">Amplop Digital</p>
            <p className="text-white/60 text-sm text-center mb-8">Bagi yang ingin memberikan hadiah, berikut informasi rekeningnya</p>
            <div className="space-y-3">
              {invitation.giftAccounts.map((gift) => (
                <div key={gift.id} className={`p-4 rounded-xl border ${styles.card}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-widest mb-1 font-sans">
                        {gift.type === "bank" ? gift.bankName : gift.walletName}
                      </p>
                      <p className="text-white font-mono text-base">
                        {gift.type === "bank" ? gift.accountNumber : gift.walletNumber}
                      </p>
                      <p className="text-white/60 text-xs font-sans mt-0.5">{gift.accountHolder}</p>
                    </div>
                    <button
                      onClick={() => copyGiftNumber(gift.type === "bank" ? gift.accountNumber : gift.walletNumber, gift.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${styles.btn} text-xs font-sans font-medium shrink-0`}
                      data-testid={`button-copy-gift-${gift.id}`}
                    >
                      {copyingGift === gift.id ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copyingGift === gift.id ? "Disalin!" : "Salin"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
          {couple && (
            <p className="text-white/80 text-xl">
              {couple.brideName} & {couple.groomName}
            </p>
          )}
          <p className="text-white/30 text-xs mt-6 font-sans">Made with love by WedSaaS</p>
        </div>
      </section>
    </div>
  );
}
