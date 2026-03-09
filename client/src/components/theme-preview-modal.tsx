import { X, Heart, MapPin, Calendar, Clock, Gift, MessageSquare, Camera, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ThemePreviewModalProps {
  theme: ThemeData | null;
  onClose: () => void;
}

export interface ThemeData {
  id: string;
  name: string;
  tag: string;
  description: string;
  rating: number;
  reviewCount: number;
  isPremium: boolean;
  badges: string[];
  gradient: string;
  dot: string;
  accentColor: string;
}

const dummyGuests = [
  { name: "Ratna & Hendra", message: "Selamat menempuh hidup baru! Semoga selalu bahagia dan dilimpahkan berkah 🥰", time: "2 jam lalu" },
  { name: "Budi Santoso", message: "Wishing you both a lifetime of happiness and love. Congrats! ✨", time: "5 jam lalu" },
  { name: "Keluarga Wijaya", message: "Semoga menjadi keluarga sakinah mawaddah wa rahmah. Aamiin 🤲", time: "1 hari lalu" },
];

function ClassicElegantPreview() {
  return (
    <div className="bg-stone-900 text-stone-100 min-h-screen font-serif">
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, #d4a96a 0%, transparent 50%), radial-gradient(circle at 75% 75%, #c9905a 0%, transparent 50%)" }} />
        <div className="relative z-10">
          <p className="text-amber-300/80 text-xs tracking-[0.4em] uppercase mb-6">The Wedding of</p>
          <div className="flex items-center justify-center gap-5 mb-2">
            <div className="h-px w-16 bg-amber-300/40" />
            <Heart className="w-5 h-5 text-amber-300 fill-current" />
            <div className="h-px w-16 bg-amber-300/40" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-stone-50 mt-4 mb-2 tracking-tight">Ahmad</h1>
          <p className="text-amber-300/70 text-2xl mb-2 italic">&amp;</p>
          <h1 className="text-5xl sm:text-6xl font-bold text-stone-50 mb-8 tracking-tight">Sari</h1>
          <div className="border border-amber-300/20 rounded-lg px-8 py-4 backdrop-blur-sm bg-white/5">
            <p className="text-amber-200/80 text-sm tracking-widest">SABTU, 12 DESEMBER 2025</p>
          </div>
          <p className="mt-4 text-stone-400 text-sm">Ballroom Grand Hyatt, Jakarta Pusat</p>
        </div>
        <div className="absolute bottom-8 animate-bounce">
          <ChevronDown className="w-5 h-5 text-amber-300/50" />
        </div>
      </section>

      <section className="bg-stone-950 py-16 px-6 text-center">
        <p className="text-amber-300/60 text-xs tracking-[0.3em] uppercase mb-3">Hitung Mundur</p>
        <div className="flex justify-center gap-6 mt-4">
          {[{ n: "48", l: "Hari" }, { n: "12", l: "Jam" }, { n: "35", l: "Menit" }, { n: "20", l: "Detik" }].map((c) => (
            <div key={c.l} className="text-center">
              <div className="w-16 h-16 rounded-xl border border-amber-300/20 bg-stone-800 flex items-center justify-center text-2xl font-bold text-amber-200">{c.n}</div>
              <p className="text-stone-500 text-xs mt-1">{c.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 text-center bg-stone-900">
        <p className="text-amber-300/60 text-xs tracking-[0.3em] uppercase mb-6">Kisah Cinta</p>
        <div className="max-w-md mx-auto space-y-6">
          {[
            { year: "2018", event: "Pertama Bertemu", desc: "Kami bertemu di sebuah seminar nasional di Jakarta." },
            { year: "2020", event: "Mulai Berpacaran", desc: "Setelah dua tahun pertemanan, kami akhirnya bersama." },
            { year: "2025", event: "Lamaran", desc: "Di tepi pantai Bali yang indah, Ahmad melamar Sari." },
          ].map((s) => (
            <div key={s.year} className="flex gap-4 text-left">
              <div className="shrink-0">
                <div className="w-12 h-12 rounded-full bg-amber-300/10 border border-amber-300/30 flex items-center justify-center">
                  <span className="text-amber-300 text-xs font-bold">{s.year}</span>
                </div>
              </div>
              <div className="border-l border-amber-300/20 pl-4 pb-4">
                <p className="font-semibold text-stone-200 text-sm">{s.event}</p>
                <p className="text-stone-400 text-xs mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-stone-950">
        <p className="text-amber-300/60 text-xs tracking-[0.3em] uppercase mb-8 text-center">Jadwal Acara</p>
        <div className="max-w-md mx-auto space-y-4">
          {[
            { icon: Calendar, label: "Akad Nikah", time: "08.00 - 10.00 WIB", loc: "Masjid Al-Akbar, Jakarta" },
            { icon: Clock, label: "Resepsi", time: "11.00 - 15.00 WIB", loc: "Ballroom Grand Hyatt, Lt. 3" },
          ].map((e) => (
            <div key={e.label} className="flex gap-4 p-4 rounded-xl border border-amber-300/10 bg-stone-800/50">
              <div className="w-10 h-10 rounded-lg bg-amber-300/10 flex items-center justify-center shrink-0">
                <e.icon className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <p className="font-semibold text-stone-100 text-sm">{e.label}</p>
                <p className="text-amber-200/70 text-xs">{e.time}</p>
                <p className="text-stone-500 text-xs mt-0.5">{e.loc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-stone-900 text-center">
        <p className="text-amber-300/60 text-xs tracking-[0.3em] uppercase mb-4">Lokasi</p>
        <div className="max-w-md mx-auto">
          <div className="rounded-xl overflow-hidden border border-amber-300/10 bg-stone-800 h-40 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-amber-300/50 mx-auto mb-2" />
              <p className="text-stone-400 text-sm">Grand Hyatt Jakarta</p>
              <p className="text-stone-500 text-xs">Jl. MH Thamrin Kav. 28-30</p>
            </div>
          </div>
          <Button className="mt-4 w-full bg-amber-700 hover:bg-amber-600 text-white border-0" size="sm">
            <MapPin className="w-4 h-4 mr-2" /> Buka di Google Maps
          </Button>
        </div>
      </section>

      <section className="py-16 px-6 bg-stone-950">
        <p className="text-amber-300/60 text-xs tracking-[0.3em] uppercase mb-6 text-center">Konfirmasi Kehadiran</p>
        <div className="max-w-sm mx-auto space-y-3">
          <input className="w-full px-4 py-2.5 rounded-lg bg-stone-800 border border-amber-300/20 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-300/50" placeholder="Nama lengkap Anda" />
          <select className="w-full px-4 py-2.5 rounded-lg bg-stone-800 border border-amber-300/20 text-stone-400 text-sm focus:outline-none">
            <option>Konfirmasi kehadiran</option>
            <option>Hadir</option>
            <option>Tidak Hadir</option>
          </select>
          <Button className="w-full bg-amber-700 hover:bg-amber-600 text-white" size="sm">Kirim Konfirmasi</Button>
        </div>
      </section>

      <section className="py-16 px-6 bg-stone-900">
        <p className="text-amber-300/60 text-xs tracking-[0.3em] uppercase mb-6 text-center">Ucapan &amp; Doa</p>
        <div className="max-w-md mx-auto space-y-3">
          {dummyGuests.map((g) => (
            <div key={g.name} className="p-4 rounded-xl bg-stone-800/60 border border-amber-300/10">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-amber-700/30 flex items-center justify-center text-amber-200 text-xs font-bold">{g.name[0]}</div>
                <p className="text-stone-200 text-xs font-semibold">{g.name}</p>
                <span className="ml-auto text-stone-600 text-xs">{g.time}</span>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">{g.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-6 bg-stone-950 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-12 bg-amber-300/20" />
          <Heart className="w-5 h-5 text-amber-300/50 fill-current" />
          <div className="h-px w-12 bg-amber-300/20" />
        </div>
        <p className="text-stone-300 text-sm font-medium">Ahmad &amp; Sari</p>
        <p className="text-stone-600 text-xs mt-1">12.12.2025</p>
        <p className="text-stone-700 text-xs mt-4">Dibuat dengan ♥ di WedSaaS</p>
      </section>
    </div>
  );
}

function MinimalModernPreview() {
  return (
    <div className="bg-white text-zinc-800 min-h-screen font-sans">
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-zinc-50 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900" />
        <p className="text-zinc-400 text-[10px] tracking-[0.5em] uppercase mb-8">We're Getting Married</p>
        <h1 className="text-6xl sm:text-7xl font-black text-zinc-900 leading-none tracking-tight">Ahmad</h1>
        <div className="my-4 text-zinc-300 text-4xl font-thin">/</div>
        <h1 className="text-6xl sm:text-7xl font-black text-zinc-900 leading-none tracking-tight">Sari</h1>
        <div className="mt-10 inline-flex items-center gap-3 border border-zinc-200 rounded-full px-6 py-2">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 text-xs tracking-wider">12 · 12 · 2025</span>
        </div>
        <p className="mt-3 text-zinc-400 text-xs tracking-wide">Grand Hyatt Jakarta</p>
      </section>

      <section className="py-16 px-6 text-center border-y border-zinc-100">
        <p className="text-zinc-400 text-[10px] tracking-[0.4em] uppercase mb-6">Countdown</p>
        <div className="flex justify-center gap-4">
          {[{ n: "48", l: "Days" }, { n: "12", l: "Hours" }, { n: "35", l: "Min" }, { n: "20", l: "Sec" }].map((c) => (
            <div key={c.l} className="text-center">
              <div className="w-14 h-14 bg-zinc-900 text-white rounded-lg flex items-center justify-center text-xl font-bold">{c.n}</div>
              <p className="text-zinc-400 text-[10px] mt-1 uppercase tracking-wider">{c.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <p className="text-zinc-400 text-[10px] tracking-[0.4em] uppercase mb-8 text-center">Our Story</p>
        <div className="max-w-md mx-auto">
          <div className="border-l-2 border-zinc-200 pl-6 space-y-8">
            {[
              { year: "2018", title: "First Meeting", desc: "We met at a national seminar in Jakarta and instantly clicked." },
              { year: "2020", title: "Together", desc: "After two years of friendship, we decided to start our journey." },
              { year: "2025", title: "Engaged", desc: "Ahmad proposed to Sari at a beautiful Bali beach sunset." },
            ].map((s) => (
              <div key={s.year} className="relative">
                <div className="absolute -left-[29px] top-0 w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-white" />
                <p className="text-zinc-300 text-xs mb-1">{s.year}</p>
                <p className="font-bold text-zinc-900 text-sm">{s.title}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-zinc-50">
        <p className="text-zinc-400 text-[10px] tracking-[0.4em] uppercase mb-8 text-center">Schedule</p>
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
          {[
            { label: "Akad Nikah", time: "08:00 WIB", loc: "Masjid Al-Akbar" },
            { label: "Reception", time: "11:00 WIB", loc: "Grand Hyatt, Lt. 3" },
          ].map((e) => (
            <div key={e.label} className="p-5 bg-white border border-zinc-100 rounded-xl">
              <div className="w-8 h-1 bg-zinc-900 rounded mb-3" />
              <p className="font-bold text-zinc-900 text-sm">{e.label}</p>
              <p className="text-zinc-500 text-xs mt-1">{e.time}</p>
              <p className="text-zinc-400 text-xs">{e.loc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <p className="text-zinc-400 text-[10px] tracking-[0.4em] uppercase mb-6 text-center">RSVP</p>
        <div className="max-w-sm mx-auto space-y-3">
          <input className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-zinc-800 placeholder-zinc-300 text-sm focus:outline-none focus:border-zinc-400" placeholder="Your name" />
          <div className="flex gap-3">
            {["Hadir", "Tidak Hadir"].map((o) => (
              <button key={o} className="flex-1 py-2.5 rounded-lg border border-zinc-200 text-zinc-500 text-sm hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors">{o}</button>
            ))}
          </div>
          <Button className="w-full bg-zinc-900 hover:bg-zinc-700 text-white" size="sm">Confirm Attendance</Button>
        </div>
      </section>

      <section className="py-16 px-6 bg-zinc-50">
        <p className="text-zinc-400 text-[10px] tracking-[0.4em] uppercase mb-6 text-center">Messages</p>
        <div className="max-w-md mx-auto space-y-3">
          {dummyGuests.map((g) => (
            <div key={g.name} className="p-4 bg-white border border-zinc-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">{g.name[0]}</div>
                <p className="text-zinc-800 text-xs font-semibold">{g.name}</p>
                <span className="ml-auto text-zinc-300 text-xs">{g.time}</span>
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed">{g.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-6 bg-zinc-900 text-center">
        <p className="text-white text-sm font-bold tracking-wider">AHMAD × SARI</p>
        <p className="text-zinc-500 text-xs mt-1">12.12.2025 · Jakarta</p>
        <p className="text-zinc-700 text-xs mt-4">Powered by WedSaaS</p>
      </section>
    </div>
  );
}

function RomanticFloralPreview() {
  return (
    <div className="bg-rose-50 text-rose-900 min-h-screen">
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-100 via-rose-50 to-pink-100" />
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-pink-200/40 blur-2xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-rose-200/40 blur-2xl translate-x-1/3 translate-y-1/3" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl">🌸</span>
            <span className="text-pink-300/70 text-xs tracking-widest uppercase">Undangan Pernikahan</span>
            <span className="text-2xl">🌸</span>
          </div>
          <p className="text-rose-400/80 text-sm italic mb-2 font-light">dengan penuh cinta, kami mengundang</p>
          <h1 className="text-5xl sm:text-6xl font-bold text-rose-800 leading-tight">Ahmad</h1>
          <div className="my-3 text-rose-300 text-3xl">✦</div>
          <h1 className="text-5xl sm:text-6xl font-bold text-rose-800 leading-tight">Sari</h1>
          <div className="mt-8 mb-4">
            <div className="inline-block border border-rose-200 rounded-2xl px-8 py-3 bg-white/60 backdrop-blur-sm">
              <p className="text-rose-600 text-sm font-medium">Sabtu, 12 Desember 2025</p>
            </div>
          </div>
          <p className="text-rose-400 text-xs">Grand Hyatt Jakarta</p>
        </div>
      </section>

      <section className="py-16 px-6 text-center bg-pink-50">
        <p className="text-rose-400/70 text-xs tracking-widest uppercase mb-6">🕐 Hitung Mundur 🕐</p>
        <div className="flex justify-center gap-4">
          {[{ n: "48", l: "Hari" }, { n: "12", l: "Jam" }, { n: "35", l: "Menit" }, { n: "20", l: "Detik" }].map((c) => (
            <div key={c.l} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-rose-100 shadow-sm flex items-center justify-center text-2xl font-bold text-rose-700">{c.n}</div>
              <p className="text-rose-400 text-xs mt-1">{c.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-rose-50">
        <p className="text-rose-400/70 text-xs tracking-widest uppercase mb-8 text-center">💕 Kisah Cinta Kami 💕</p>
        <div className="max-w-md mx-auto space-y-5">
          {[
            { year: "2018", icon: "🌼", title: "Pertama Bertemu", desc: "Kami bertemu di sebuah seminar nasional di Jakarta dan langsung merasa ada chemistry." },
            { year: "2020", icon: "💌", title: "Mulai Bersama", desc: "Setelah dua tahun menjadi teman dekat, kami akhirnya memutuskan untuk bersama." },
            { year: "2025", icon: "💍", title: "Lamaran", desc: "Ahmad melamar Sari di tepi pantai Bali saat matahari terbenam yang indah." },
          ].map((s) => (
            <div key={s.year} className="flex gap-4 p-4 rounded-2xl bg-white/80 border border-rose-100">
              <div className="text-2xl shrink-0">{s.icon}</div>
              <div>
                <p className="text-rose-300 text-xs mb-0.5">{s.year}</p>
                <p className="font-semibold text-rose-800 text-sm">{s.title}</p>
                <p className="text-rose-500 text-xs leading-relaxed mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-pink-50">
        <p className="text-rose-400/70 text-xs tracking-widest uppercase mb-8 text-center">🌺 Jadwal Acara 🌺</p>
        <div className="max-w-md mx-auto space-y-4">
          {[
            { icon: "💒", label: "Akad Nikah", time: "08.00 - 10.00 WIB", loc: "Masjid Al-Akbar, Jakarta" },
            { icon: "🥂", label: "Resepsi", time: "11.00 - 15.00 WIB", loc: "Ballroom Grand Hyatt, Lt. 3" },
          ].map((e) => (
            <div key={e.label} className="flex gap-4 p-4 rounded-2xl bg-white border border-rose-100 shadow-sm">
              <div className="text-2xl shrink-0">{e.icon}</div>
              <div>
                <p className="font-semibold text-rose-800 text-sm">{e.label}</p>
                <p className="text-rose-500 text-xs">{e.time}</p>
                <p className="text-rose-400 text-xs mt-0.5">{e.loc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-rose-50">
        <p className="text-rose-400/70 text-xs tracking-widest uppercase mb-6 text-center">💌 Konfirmasi Kehadiran 💌</p>
        <div className="max-w-sm mx-auto space-y-3">
          <input className="w-full px-4 py-2.5 rounded-2xl border border-rose-200 bg-white text-rose-800 placeholder-rose-300 text-sm focus:outline-none" placeholder="Nama lengkap Anda" />
          <input className="w-full px-4 py-2.5 rounded-2xl border border-rose-200 bg-white text-rose-800 placeholder-rose-300 text-sm focus:outline-none" placeholder="Pesan untuk kami 💕" />
          <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-2xl" size="sm">Kirim Konfirmasi 🌸</Button>
        </div>
      </section>

      <section className="py-16 px-6 bg-pink-50">
        <p className="text-rose-400/70 text-xs tracking-widest uppercase mb-6 text-center">💬 Ucapan Tamu 💬</p>
        <div className="max-w-md mx-auto space-y-3">
          {dummyGuests.map((g) => (
            <div key={g.name} className="p-4 rounded-2xl bg-white border border-rose-100">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xs font-bold">{g.name[0]}</div>
                <p className="text-rose-800 text-xs font-semibold">{g.name}</p>
                <span className="ml-auto text-rose-300 text-xs">{g.time}</span>
              </div>
              <p className="text-rose-500 text-xs leading-relaxed">{g.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-6 bg-gradient-to-b from-rose-200 to-pink-300 text-center">
        <p className="text-3xl mb-3">🌸</p>
        <p className="text-rose-800 text-sm font-semibold">Ahmad & Sari</p>
        <p className="text-rose-600 text-xs mt-1">12 · 12 · 2025</p>
        <p className="text-rose-400 text-xs mt-4">Dibuat dengan cinta di WedSaaS 💕</p>
      </section>
    </div>
  );
}

function LuxuryGoldPreview() {
  return (
    <div className="bg-neutral-950 text-neutral-100 min-h-screen">
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, #d4af37 0, #d4af37 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-yellow-400/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-amber-300/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-yellow-400/60" />
            <div className="w-8 h-8 border border-yellow-400/40 rotate-45 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-yellow-400/70 fill-current -rotate-45" />
            </div>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-yellow-400/60" />
          </div>
          <p className="text-yellow-400/50 text-[10px] tracking-[0.6em] uppercase mb-6">The Grand Wedding of</p>
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-b from-yellow-200 to-yellow-500 bg-clip-text text-transparent leading-tight">Ahmad</h1>
          <p className="text-yellow-400/50 text-3xl my-3">&amp;</p>
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-b from-yellow-200 to-yellow-500 bg-clip-text text-transparent leading-tight">Sari</h1>
          <div className="mt-10 border border-yellow-400/20 rounded-none px-10 py-4 relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-400/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-400/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-400/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-400/40" />
            <p className="text-yellow-300/70 text-xs tracking-[0.3em] uppercase">Sabtu, 12 Desember 2025</p>
          </div>
          <p className="mt-4 text-neutral-500 text-sm">The Ritz-Carlton, Jakarta</p>
        </div>
      </section>

      <section className="py-16 px-6 text-center bg-black">
        <p className="text-yellow-400/40 text-[10px] tracking-[0.4em] uppercase mb-6">Menghitung Hari</p>
        <div className="flex justify-center gap-5">
          {[{ n: "48", l: "Hari" }, { n: "12", l: "Jam" }, { n: "35", l: "Menit" }, { n: "20", l: "Detik" }].map((c) => (
            <div key={c.l} className="text-center">
              <div className="w-16 h-16 border border-yellow-400/20 bg-neutral-900 flex items-center justify-center text-2xl font-bold text-yellow-300">{c.n}</div>
              <p className="text-neutral-600 text-xs mt-1 tracking-wider uppercase">{c.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-neutral-950">
        <div className="flex items-center gap-4 mb-8 max-w-md mx-auto">
          <div className="h-px flex-1 bg-yellow-400/20" />
          <p className="text-yellow-400/50 text-[10px] tracking-[0.4em] uppercase">Kisah Cinta</p>
          <div className="h-px flex-1 bg-yellow-400/20" />
        </div>
        <div className="max-w-md mx-auto space-y-4">
          {[
            { year: "2018", title: "Pertemuan Pertama", desc: "Takdir mempertemukan kami di sebuah seminar bergengsi di Jakarta." },
            { year: "2020", title: "Bersatu", desc: "Dua jiwa yang saling melengkapi akhirnya memilih untuk bersama selamanya." },
            { year: "2025", title: "Lamaran Mewah", desc: "Dengan berlian terbaik, Ahmad berlutut di hadapan Sari di Bali." },
          ].map((s) => (
            <div key={s.year} className="flex gap-4 p-4 border border-yellow-400/10 bg-neutral-900/50">
              <div className="shrink-0 text-right w-10">
                <span className="text-yellow-400/50 text-xs">{s.year}</span>
              </div>
              <div className="w-px bg-yellow-400/20 shrink-0" />
              <div className="pl-2">
                <p className="font-semibold text-yellow-200 text-sm">{s.title}</p>
                <p className="text-neutral-500 text-xs leading-relaxed mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-black">
        <div className="flex items-center gap-4 mb-8 max-w-md mx-auto">
          <div className="h-px flex-1 bg-yellow-400/20" />
          <p className="text-yellow-400/50 text-[10px] tracking-[0.4em] uppercase">Jadwal Acara</p>
          <div className="h-px flex-1 bg-yellow-400/20" />
        </div>
        <div className="max-w-md mx-auto space-y-4">
          {[
            { label: "Akad Nikah", time: "08.00 - 10.00 WIB", loc: "Masjid Istiqlal, Jakarta Pusat" },
            { label: "Resepsi Mewah", time: "19.00 - 22.00 WIB", loc: "The Ritz-Carlton Ballroom, Lt. 5" },
          ].map((e) => (
            <div key={e.label} className="p-5 border border-yellow-400/10 bg-neutral-900 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-yellow-400/40" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-yellow-400/40" />
              <p className="font-semibold text-yellow-200 text-sm">{e.label}</p>
              <p className="text-yellow-400/60 text-xs mt-1">{e.time}</p>
              <p className="text-neutral-500 text-xs mt-0.5">{e.loc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-neutral-950">
        <div className="flex items-center gap-4 mb-6 max-w-sm mx-auto">
          <div className="h-px flex-1 bg-yellow-400/20" />
          <p className="text-yellow-400/50 text-[10px] tracking-[0.4em] uppercase">RSVP</p>
          <div className="h-px flex-1 bg-yellow-400/20" />
        </div>
        <div className="max-w-sm mx-auto space-y-3">
          <input className="w-full px-4 py-2.5 bg-neutral-900 border border-yellow-400/20 text-neutral-100 placeholder-neutral-600 text-sm focus:outline-none focus:border-yellow-400/40" placeholder="Nama lengkap Anda" />
          <select className="w-full px-4 py-2.5 bg-neutral-900 border border-yellow-400/20 text-neutral-400 text-sm focus:outline-none">
            <option>Konfirmasi kehadiran</option>
            <option>Hadir</option>
            <option>Tidak Hadir</option>
          </select>
          <Button className="w-full bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-white border-0 font-semibold" size="sm">Konfirmasi Kehadiran</Button>
        </div>
      </section>

      <section className="py-16 px-6 bg-black">
        <div className="flex items-center gap-4 mb-6 max-w-md mx-auto">
          <div className="h-px flex-1 bg-yellow-400/20" />
          <p className="text-yellow-400/50 text-[10px] tracking-[0.4em] uppercase">Ucapan Tamu</p>
          <div className="h-px flex-1 bg-yellow-400/20" />
        </div>
        <div className="max-w-md mx-auto space-y-3">
          {dummyGuests.map((g) => (
            <div key={g.name} className="p-4 border border-yellow-400/10 bg-neutral-900/50">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 bg-yellow-600/20 border border-yellow-400/20 flex items-center justify-center text-yellow-300 text-xs font-bold">{g.name[0]}</div>
                <p className="text-neutral-200 text-xs font-semibold">{g.name}</p>
                <span className="ml-auto text-neutral-700 text-xs">{g.time}</span>
              </div>
              <p className="text-neutral-500 text-xs leading-relaxed">{g.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-6 bg-neutral-950 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-12 bg-yellow-400/20" />
          <div className="w-5 h-5 border border-yellow-400/30 rotate-45 flex items-center justify-center">
            <Heart className="w-2.5 h-2.5 text-yellow-400/50 fill-current -rotate-45" />
          </div>
          <div className="h-px w-12 bg-yellow-400/20" />
        </div>
        <p className="bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent text-sm font-bold tracking-widest">AHMAD & SARI</p>
        <p className="text-neutral-600 text-xs mt-1">12 · 12 · 2025</p>
        <p className="text-neutral-800 text-xs mt-4">Created with ♥ at WedSaaS</p>
      </section>
    </div>
  );
}

export default function ThemePreviewModal({ theme, onClose }: ThemePreviewModalProps) {
  if (!theme) return null;

  const previewMap: Record<string, JSX.Element> = {
    "classic-elegant": <ClassicElegantPreview />,
    "minimal-modern": <MinimalModernPreview />,
    "romantic-floral": <RomanticFloralPreview />,
    "luxury-gold": <LuxuryGoldPreview />,
  };

  const preview = previewMap[theme.id] ?? <ClassicElegantPreview />;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-sm sm:max-w-md my-4 mx-4 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-2 text-white/50 text-xs font-mono">wedsaas.com/invite/ahmad-sari</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs hidden sm:block">Preview: {theme.name}</span>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                data-testid="button-close-preview"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {preview}
          </div>

          <div className="shrink-0 px-4 py-3 bg-gray-900 border-t border-white/10 flex items-center justify-between gap-3">
            <p className="text-white/50 text-xs">Tema: <span className="text-white/70 font-medium">{theme.name}</span></p>
            <Link href="/register" onClick={onClose}>
              <Button size="sm" className="text-xs h-8 font-semibold" data-testid="button-use-theme-from-preview">
                Gunakan Tema
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
