import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
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
import {
  MapPin, Calendar, Clock, Heart, Copy, ExternalLink, Gift,
  MessageCircle, ChevronDown, CheckCircle, Loader2, Eye, ArrowLeft, Globe,
} from "lucide-react";
import type { FullInvitation } from "@shared/schema";
import { Link } from "wouter";

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
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
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
    default:
      return { bg: "bg-stone-950", accent: "text-stone-200", overlay: "from-stone-950/90 to-stone-800/70", card: "bg-stone-800/60 border-stone-700", btn: "bg-white text-stone-900" };
  }
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: invitation, isLoading, error } = useQuery<FullInvitation>({
    queryKey: ["/api/invitations", id, "preview-data"],
    queryFn: () => fetch(`/api/invitations/${id}/preview-data`).then(r => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
  });

  const rsvpForm = useForm<z.infer<typeof rsvpSchema>>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: { name: "", whatsapp: "", guestCount: 1, status: "attending", message: "" },
  });

  const msgForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { name: "", message: "" },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 fill-current mx-auto mb-4 animate-pulse" />
          <p className="text-stone-400 text-sm">Memuat preview...</p>
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
          <p className="text-stone-400 text-sm mb-6">Undangan tidak ada atau kamu tidak memiliki akses.</p>
          <Link href="/dashboard/invitations">
            <Button variant="outline">Kembali ke Dashboard</Button>
          </Link>
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
    try { return new Date(d).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <div className="relative">
      {/* Preview Banner */}
      <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg" data-testid="preview-banner">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-sm">Mode Preview</span>
          <span className="hidden sm:inline text-xs font-medium opacity-70">— Ini tampilan undanganmu. RSVP & pesan tidak akan tersimpan.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/dashboard/builder/${id}`}>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-950 hover:bg-amber-400 gap-1" data-testid="button-back-to-builder">
              <ArrowLeft className="w-3.5 h-3.5" /> Edit
            </Button>
          </Link>
          {invitation.status === "published" ? (
            <a href={`/invite/${invitation.slug}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="h-7 text-xs bg-amber-800 hover:bg-amber-900 text-white gap-1" data-testid="button-open-live">
                <ExternalLink className="w-3.5 h-3.5" /> Buka Live
              </Button>
            </a>
          ) : (
            <Link href={`/dashboard/builder/${id}`}>
              <Button size="sm" className="h-7 text-xs bg-amber-800 hover:bg-amber-900 text-white gap-1" data-testid="button-go-publish">
                <Globe className="w-3.5 h-3.5" /> Publish
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className={`min-h-screen ${styles.bg} font-serif`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {/* Hero Cover */}
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
          {invitation.coverImage ? (
            <><img src={invitation.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" /><div className={`absolute inset-0 bg-gradient-to-b ${styles.overlay}`} /></>
          ) : couple?.couplePhoto ? (
            <><img src={couple.couplePhoto} alt="" className="absolute inset-0 w-full h-full object-cover" /><div className={`absolute inset-0 bg-gradient-to-b ${styles.overlay}`} /></>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-b ${styles.overlay}`} />
          )}
          <div className="relative z-10 text-center max-w-lg">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px w-12 bg-white/30" />
                <Heart className="w-5 h-5 text-white/70 fill-current" />
                <div className="h-px w-12 bg-white/30" />
              </div>
              <p className="text-white/60 text-sm uppercase tracking-widest mb-6">Undangan Pernikahan</p>
            </div>
            {couple && (couple.brideName || couple.groomName) ? (
              <>
                {couple.couplePhoto && !invitation.coverImage && (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-white/30 mx-auto mb-6">
                    <img src={couple.couplePhoto} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-3">
                  {couple.brideName || "Nama Mempelai Wanita"}
                  <span className="block text-2xl sm:text-3xl text-white/60 my-2">&</span>
                  {couple.groomName || "Nama Mempelai Pria"}
                </h1>
              </>
            ) : (
              <p className="text-white/40 text-sm italic mb-6">[Isi nama mempelai di tab Pasangan]</p>
            )}
            {events?.receptionDate && (
              <p className={`${styles.accent} text-sm tracking-widest mb-8`}>{formatDate(events.receptionDate)}</p>
            )}
            {events?.receptionDate && (
              <div className="mb-8"><Countdown targetDate={events.receptionDate} /></div>
            )}
            <button onClick={() => document.getElementById("section-couple")?.scrollIntoView({ behavior: "smooth" })} className="text-white/50 animate-bounce mx-auto block">
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

        {/* Couple */}
        {couple && (couple.brideName || couple.groomName) && (
          <section id="section-couple" className="py-16 px-4">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-8">Mempelai</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="text-center">
                  {couple.bridePhoto && <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-2 border-white/20"><img src={couple.bridePhoto} alt={couple.brideName} className="w-full h-full object-cover" /></div>}
                  <h2 className="text-2xl font-bold text-white mb-1">{couple.brideName}</h2>
                  {couple.brideParents && <p className="text-white/50 text-sm italic">Putri dari {couple.brideParents}</p>}
                </div>
                <div className="text-center">
                  {couple.groomPhoto && <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-2 border-white/20"><img src={couple.groomPhoto} alt={couple.groomName} className="w-full h-full object-cover" /></div>}
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

        {/* Events */}
        {events && (events.akadDate || events.receptionDate) && (
          <section className="py-16 px-4">
            <div className="max-w-2xl mx-auto">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-8 text-center">Detail Acara</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {events.akadDate && (
                  <div className={`p-6 rounded-xl border ${styles.card} text-center`}>
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Akad Nikah</p>
                    <div className="flex items-center justify-center gap-2 mb-2"><Calendar className="w-4 h-4 text-white/50" /><p className="text-white text-sm">{formatDate(events.akadDate)}</p></div>
                    {events.akadTime && <div className="flex items-center justify-center gap-2 mb-2"><Clock className="w-4 h-4 text-white/50" /><p className="text-white/80 text-sm">{events.akadTime} WIB</p></div>}
                    {events.akadVenue && <div className="flex items-start justify-center gap-2 mb-3"><MapPin className="w-4 h-4 text-white/50 mt-0.5 shrink-0" /><p className="text-white/70 text-sm">{events.akadVenue}</p></div>}
                    {events.akadMapsLink && <a href={events.akadMapsLink} target="_blank" rel="noopener noreferrer"><button className={`text-xs px-3 py-1.5 rounded-full ${styles.btn} font-sans`}>Lihat Peta</button></a>}
                  </div>
                )}
                {events.receptionDate && (
                  <div className={`p-6 rounded-xl border ${styles.card} text-center`}>
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Resepsi Pernikahan</p>
                    <div className="flex items-center justify-center gap-2 mb-2"><Calendar className="w-4 h-4 text-white/50" /><p className="text-white text-sm">{formatDate(events.receptionDate)}</p></div>
                    {events.receptionTime && <div className="flex items-center justify-center gap-2 mb-2"><Clock className="w-4 h-4 text-white/50" /><p className="text-white/80 text-sm">{events.receptionTime} WIB</p></div>}
                    {events.receptionVenue && <div className="flex items-start justify-center gap-2 mb-3"><MapPin className="w-4 h-4 text-white/50 mt-0.5 shrink-0" /><p className="text-white/70 text-sm">{events.receptionVenue}</p></div>}
                    {events.receptionMapsLink && <a href={events.receptionMapsLink} target="_blank" rel="noopener noreferrer"><button className={`text-xs px-3 py-1.5 rounded-full ${styles.btn} font-sans`}>Lihat Peta</button></a>}
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

        {/* Hashtag */}
        {content?.hashtag && (
          <section className="py-6 px-4 text-center">
            <p className="text-white/40 text-sm">Gunakan hashtag</p>
            <p className={`text-xl font-bold mt-1 ${styles.accent}`}>{content.hashtag}</p>
          </section>
        )}

        {/* RSVP (preview — disabled submission) */}
        {content?.enableRsvp && (
          <section className="py-16 px-4">
            <div className="max-w-lg mx-auto">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2 text-center">Konfirmasi Kehadiran</p>
              <p className="text-white/60 text-sm text-center mb-8">Mohon konfirmasi kehadiranmu</p>
              <div className={`p-6 rounded-xl border ${styles.card}`}>
                <div className="mb-4 p-3 rounded-lg bg-amber-500/20 border border-amber-400/30">
                  <p className="text-amber-300 text-xs font-sans font-medium text-center">⚠️ Mode Preview — Pengiriman RSVP dinonaktifkan</p>
                </div>
                <Form {...rsvpForm}>
                  <form className="space-y-4 pointer-events-none opacity-60">
                    <div className="space-y-2">
                      <label className="text-white/70 text-sm font-sans font-medium block">Nama Lengkap</label>
                      <Input placeholder="Nama lengkap" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-sans" disabled />
                    </div>
                    <div className="flex gap-3">
                      {["Insya Allah Hadir", "Tidak Bisa Hadir"].map(o => (
                        <div key={o} className="flex-1 p-3 rounded-lg border border-white/10 bg-white/5 text-white/60 text-sm font-sans text-center">{o}</div>
                      ))}
                    </div>
                    <button type="button" disabled className={`w-full py-3 rounded-lg ${styles.btn} font-sans font-semibold text-sm opacity-50`}>Kirim Konfirmasi</button>
                  </form>
                </Form>
              </div>
            </div>
          </section>
        )}

        {/* Guest Messages (preview) */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2 text-center">Ucapan & Doa</p>
            <p className="text-white/60 text-sm text-center mb-8">Kirimkan ucapan dan doa terbaikmu</p>
            <div className={`p-5 rounded-xl border ${styles.card} mb-6`}>
              <div className="mb-3 p-3 rounded-lg bg-amber-500/20 border border-amber-400/30">
                <p className="text-amber-300 text-xs font-sans font-medium text-center">⚠️ Mode Preview — Pengiriman pesan dinonaktifkan</p>
              </div>
              <div className="space-y-3 pointer-events-none opacity-60">
                <Input placeholder="Nama kamu" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-sans" disabled />
                <Textarea placeholder="Tuliskan ucapan dan doa terbaikmu..." className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-sans resize-none" rows={3} disabled />
                <button type="button" disabled className={`w-full py-2.5 rounded-lg ${styles.btn} font-sans font-semibold text-sm opacity-50`}>Kirim Ucapan</button>
              </div>
            </div>
          </div>
        </section>

        {/* Gift (preview) */}
        {(invitation.giftAccounts && invitation.giftAccounts.length > 0) || invitation.giftAddress ? (
          <section className="py-16 px-4">
            <div className="max-w-lg mx-auto">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2 text-center">Hadiah</p>
              <p className="text-white/60 text-sm text-center mb-8">Bagi yang ingin memberikan hadiah</p>
              {invitation.giftAccounts && invitation.giftAccounts.length > 0 && (
                <div className="space-y-3 mb-6">
                  {invitation.giftAccounts.map((gift) => (
                    <div key={gift.id} className={`p-4 rounded-xl border ${styles.card}`}>
                      <p className="text-white/50 text-xs uppercase tracking-widest mb-1 font-sans">
                        {gift.type === "bank" ? gift.bankName : gift.walletName}
                      </p>
                      <p className="text-white font-mono text-base">{gift.type === "bank" ? gift.accountNumber : gift.walletNumber}</p>
                      <p className="text-white/60 text-xs font-sans mt-0.5">{gift.accountHolder}</p>
                    </div>
                  ))}
                </div>
              )}
              {invitation.giftAddress && (
                <div className={`p-4 rounded-xl border ${styles.card}`}>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-2 font-sans">Alamat Pengiriman Hadiah</p>
                  <p className="text-white/80 text-sm font-sans leading-relaxed">{invitation.giftAddress}</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* Closing */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-lg mx-auto">
            {content?.closingMessage ? (
              <p className="text-white/60 leading-relaxed mb-8">{content.closingMessage}</p>
            ) : (
              <p className="text-white/50 text-sm mb-8">Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.</p>
            )}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12 bg-white/10" />
              <Heart className="w-5 h-5 text-white/30 fill-current" />
              <div className="h-px w-12 bg-white/10" />
            </div>
            {couple && (
              <p className="text-white/80 text-xl">
                {couple.brideName || "Mempelai Wanita"} & {couple.groomName || "Mempelai Pria"}
              </p>
            )}
            <p className="text-white/30 text-xs mt-6 font-sans">Made with love by WedSaaS</p>
          </div>
        </section>
      </div>
    </div>
  );
}
