import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart, Mail, Users, BarChart3, Palette, CheckCircle, Star,
  ArrowRight, Clock, Gift, MessageSquare, ChevronDown, Sparkles,
  Shield, Zap, Menu, X, Instagram, Twitter, Facebook, Eye, MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemePreviewModal, { type ThemeData } from "@/components/theme-preview-modal";
import ThemeReviewModal from "@/components/theme-review-modal";

const features = [
  { icon: Mail, title: "Undangan Digital", desc: "Buat undangan mobile-first yang indah dengan link unik yang bisa dibagikan ke siapa saja.", color: "bg-rose-500/10 text-rose-600" },
  { icon: Users, title: "Manajemen RSVP", desc: "Kelola konfirmasi kehadiran tamu dengan mudah, lengkap dengan jumlah tamu dan preferensi.", color: "bg-violet-500/10 text-violet-600" },
  { icon: MessageSquare, title: "Pesan Tamu", desc: "Kumpulkan ucapan dan doa restu dari semua tamu undangan di satu tempat yang rapi.", color: "bg-blue-500/10 text-blue-600" },
  { icon: Gift, title: "Digital Gift Registry", desc: "Bagikan rekening bank dan e-wallet untuk menerima hadiah secara cashless dan modern.", color: "bg-amber-500/10 text-amber-600" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Pantau views, tingkat RSVP, dan engagement tamu undangan secara real time.", color: "bg-emerald-500/10 text-emerald-600" },
  { icon: Palette, title: "Tema yang Indah", desc: "Pilih dari 4 tema premium — klasik, modern, floral, atau gold — sesuai konsep pernikahan.", color: "bg-pink-500/10 text-pink-600" },
];

const steps = [
  { num: "01", title: "Buat Undangan", desc: "Isi data pengantin, jadwal acara, dan cerita cinta kalian dalam hitungan menit.", icon: Heart },
  { num: "02", title: "Pilih Tema", desc: "Sesuaikan tampilan dengan 4 tema premium yang elegan dan modern.", icon: Palette },
  { num: "03", title: "Bagikan Link", desc: "Publikasikan dan bagikan link ke tamu via WhatsApp, Instagram, atau email.", icon: Mail },
  { num: "04", title: "Kelola Tamu", desc: "Pantau RSVP, baca pesan, dan konfirmasi hadiah — semua dalam satu dashboard.", icon: BarChart3 },
];

const themes: (ThemeData & {
  color: string;
  dot: string;
  previewAccent: string;
  labels: { text: string; color: string }[];
})[] = [
  {
    id: "classic-elegant",
    name: "Classic Elegant",
    tag: "Mewah & Timeless",
    description: "Nuansa gelap elegan dengan aksen emas. Sempurna untuk pernikahan mewah di hotel atau gedung bergengsi.",
    rating: 4.9,
    reviewCount: 128,
    isPremium: false,
    badges: ["Paling Populer"],
    gradient: "from-stone-700 via-stone-800 to-stone-900",
    color: "from-stone-700 via-stone-800 to-stone-900",
    dot: "bg-amber-300",
    accentColor: "#d4a96a",
    previewAccent: "border-amber-300/30",
    labels: [
      { text: "Paling Populer", color: "bg-amber-400/20 text-amber-300 border-amber-400/30" },
      { text: "Cocok untuk akad indoor", color: "bg-stone-400/20 text-stone-300 border-stone-400/20" },
    ],
  },
  {
    id: "minimal-modern",
    name: "Minimal Modern",
    tag: "Bersih & Kontemporer",
    description: "Desain clean dan kontemporer yang kekinian. Ideal untuk pasangan yang suka estetika minimalis modern.",
    rating: 4.8,
    reviewCount: 96,
    isPremium: false,
    badges: ["Terlaris"],
    gradient: "from-zinc-700 via-zinc-800 to-zinc-900",
    color: "from-zinc-700 via-zinc-800 to-zinc-900",
    dot: "bg-zinc-300",
    accentColor: "#a1a1aa",
    previewAccent: "border-zinc-300/30",
    labels: [
      { text: "Terlaris", color: "bg-blue-400/20 text-blue-300 border-blue-400/30" },
      { text: "Cocok untuk konsep modern", color: "bg-zinc-400/20 text-zinc-300 border-zinc-400/20" },
    ],
  },
  {
    id: "romantic-floral",
    name: "Romantic Floral",
    tag: "Manis & Romantis",
    description: "Nuansa floral yang hangat dan romantis. Pilihan terbaik untuk garden wedding yang indah dan manis.",
    rating: 4.9,
    reviewCount: 154,
    isPremium: true,
    badges: ["Paling Populer"],
    gradient: "from-rose-600 via-pink-700 to-rose-900",
    color: "from-rose-600 via-pink-700 to-rose-900",
    dot: "bg-pink-300",
    accentColor: "#f472b6",
    previewAccent: "border-pink-300/30",
    labels: [
      { text: "Paling Populer", color: "bg-pink-400/20 text-pink-300 border-pink-400/30" },
      { text: "Cocok untuk garden wedding", color: "bg-rose-400/20 text-rose-300 border-rose-400/20" },
    ],
  },
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    tag: "Glamor & Prestige",
    description: "Kemewahan sejati dengan aksen emas di atas latar hitam elegan. Untuk momen pernikahan paling prestisius.",
    rating: 4.7,
    reviewCount: 74,
    isPremium: true,
    badges: ["Premium"],
    gradient: "from-yellow-700 via-amber-700 to-yellow-900",
    color: "from-yellow-700 via-amber-700 to-yellow-900",
    dot: "bg-yellow-300",
    accentColor: "#fbbf24",
    previewAccent: "border-yellow-300/30",
    labels: [
      { text: "Premium", color: "bg-yellow-400/20 text-yellow-300 border-yellow-400/30" },
      { text: "Cocok untuk akad indoor", color: "bg-amber-400/20 text-amber-300 border-amber-400/20" },
    ],
  },
];

const plans = [
  {
    name: "Free",
    price: "Rp 0",
    period: "selamanya",
    desc: "Cocok untuk percobaan",
    features: ["1 undangan", "Tema dasar", "Form RSVP", "Pesan tamu", "Watermark WedSaaS"],
    cta: "Mulai Gratis",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "Rp 99.000",
    period: "per undangan",
    desc: "Paling populer untuk pasangan",
    features: ["Semua fitur Free", "Semua tema premium", "Digital gift registry", "Analytics lengkap", "Tanpa watermark", "Priority support"],
    cta: "Coba Premium",
    highlighted: true,
  },
  {
    name: "Business",
    price: "Rp 299.000",
    period: "per bulan",
    desc: "Untuk wedding organizer",
    features: ["Undangan tak terbatas", "Semua fitur Premium", "White label option", "Custom domain (segera)", "Akses API", "Dedicated support"],
    cta: "Hubungi Kami",
    highlighted: false,
  },
];

const testimonials = [
  { name: "Anisa & Budi", role: "Menikah Maret 2025", text: "WedSaaS bikin undangan kami jadi sangat cantik dan profesional. Tamu-tamu pada kagum dan RSVP langsung banjir!", initials: "AB", color: "bg-rose-100 text-rose-700" },
  { name: "Sari & Dimas", role: "Menikah Januari 2025", text: "Hemat banget! Fitur digital gift-nya keren — tamu bisa transfer hadiah langsung tanpa ribet cari nomor rekening.", initials: "SD", color: "bg-violet-100 text-violet-700" },
  { name: "Rina & Fajar", role: "Menikah April 2025", text: "Dalam seminggu ada 847 views! Kami bisa tahu teman mana yang sudah buka undangannya. Seru banget!", initials: "RF", color: "bg-blue-100 text-blue-700" },
];

const faqs = [
  { q: "Apakah WedSaaS bisa dicoba gratis?", a: "Ya! Paket Free memungkinkan kamu membuat satu undangan dengan fitur inti termasuk RSVP dan pesan tamu tanpa biaya apapun." },
  { q: "Bagaimana tamu mengakses undangan saya?", a: "Setiap undangan memiliki link unik seperti wedsaas.com/invite/nama-kamu. Bagikan via WhatsApp, Instagram, atau email." },
  { q: "Apakah desain bisa diubah setelah dipublish?", a: "Tentu saja! Kamu bisa edit undangan kapan saja — tema, konten, dan foto — perubahan langsung tampil real time." },
  { q: "Apakah data saya aman?", a: "Ya. Semua data disimpan aman di database terenkripsi kami. Kami tidak pernah membagikan informasi pribadi kamu ke pihak ketiga." },
  { q: "Apa yang terjadi setelah pernikahan?", a: "Undangan tetap online selamanya. Kamu bisa mengarsipkan atau menghapusnya dari dashboard kapan saja kamu mau." },
];

const stats = [
  { value: "10.000+", label: "Undangan Dibuat" },
  { value: "98%", label: "Kepuasan Pengguna" },
  { value: "500K+", label: "RSVP Dikelola" },
  { value: "4.9/5", label: "Rating Platform" },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeData | null>(null);
  const [reviewTheme, setReviewTheme] = useState<ThemeData | null>(null);

  const navLinks = [
    ["#features", "Fitur"],
    ["#how-it-works", "Cara Kerja"],
    ["#pricing", "Harga"],
    ["#faq", "FAQ"],
  ];

  return (
    <div className="min-h-screen bg-background font-sans">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-primary-foreground fill-current" />
            </div>
            <span className="font-bold text-base text-foreground tracking-tight">WedSaaS</span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-sm">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href} className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-medium">
                {label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium" data-testid="button-login">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="font-semibold shadow-sm" data-testid="button-get-started">
                Coba Gratis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-b border-border bg-background overflow-hidden"
            >
              <div className="flex flex-col p-4 space-y-2">
                {navLinks.map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    className="px-4 py-3 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {label}
                  </a>
                ))}
                <div className="pt-4 flex flex-col gap-2">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center" data-testid="mobile-button-login">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full justify-center" data-testid="mobile-button-get-started">
                      Coba Gratis
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 to-transparent" />
        {/* Blobs */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/8 blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-300/10 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pink-200/10 blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-1.5 bg-primary/8 border border-primary/20 rounded-full px-3.5 py-1.5 mb-7">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Platform Undangan Pernikahan Digital #1</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-foreground leading-[1.08] tracking-tight mb-6">
            Undangan Pernikahan
            <span className="block gradient-text mt-1">Digital yang Elegan</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-9 leading-relaxed">
            Buat undangan pernikahan digital yang memukau, bagikan ke semua tamu, kelola RSVP otomatis, dan terima ucapan — dalam satu platform yang indah.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link href="/register">
              <Button size="lg" className="gap-2 h-12 px-7 text-base font-semibold shadow-md" data-testid="button-hero-cta">
                Coba Gratis Sekarang
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="h-12 px-7 text-base font-medium" data-testid="button-demo">
                Lihat Cara Kerja
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm">
            {["Gratis untuk dicoba", "Tidak perlu kartu kredit", "Setup dalam 5 menit"].map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="border-y border-border bg-muted/30 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-foreground tracking-tight">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 font-semibold text-xs px-3 py-1">Fitur Lengkap</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Semua yang Kamu Butuhkan</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">Platform undangan pernikahan digital paling lengkap untuk momen terpenting hidupmu.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="group p-6 bg-card border border-card-border rounded-xl hover-elevate-2 transition-all duration-200 cursor-default">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 font-semibold text-xs px-3 py-1">Mudah Digunakan</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Cara Kerja WedSaaS</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">Dari pembuatan hingga membagikan undangan, hanya dalam beberapa menit saja.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Themes */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 font-semibold text-xs px-3 py-1">4 Tema Premium</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Tema yang Memukau</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">Setiap tema dirancang dengan detail untuk mencerminkan keindahan hari istimewamu.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {themes.map((theme) => (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="group rounded-2xl overflow-hidden bg-card border border-card-border hover-elevate-2 transition-all duration-300 flex flex-col"
                data-testid={`card-theme-${theme.id}`}
              >
                <div className={`aspect-[3/4] bg-gradient-to-b ${theme.color} relative flex flex-col items-end justify-between p-4 overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/15" />

                  <div className="relative z-10 flex flex-wrap gap-1.5 justify-end">
                    {theme.isPremium && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/25 text-yellow-200 border border-yellow-400/30 backdrop-blur-sm">
                        Premium
                      </span>
                    )}
                    {!theme.isPremium && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-400/25 text-green-200 border border-green-400/30 backdrop-blur-sm">
                        Free
                      </span>
                    )}
                  </div>

                  <div className="relative z-10 text-center w-full">
                    <div className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                      <Heart className="w-5 h-5 text-white/80 fill-current" />
                    </div>
                    <p className="text-white/95 text-sm font-semibold">Ahmad & Sari</p>
                    <div className="w-8 h-px bg-white/40 mx-auto my-2" />
                    <p className="text-white/60 text-xs">12 Desember 2025</p>

                    <div className="flex flex-wrap gap-1 justify-center mt-3">
                      {theme.labels.map((lbl) => (
                        <span key={lbl.text} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border backdrop-blur-sm ${lbl.color}`}>
                          {lbl.text}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => setPreviewTheme(theme)}
                      className="mt-3 w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold transition-all duration-200 backdrop-blur-sm flex items-center justify-center gap-1.5"
                      data-testid={`button-preview-${theme.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview Demo
                    </button>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${theme.dot} shrink-0 mt-0.5`} />
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight">{theme.name}</p>
                        <p className="text-xs text-muted-foreground">{theme.tag}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{theme.description}</p>

                  <button
                    onClick={() => setReviewTheme(theme)}
                    className="flex items-center gap-1.5 group/rating hover:opacity-80 transition-opacity w-fit"
                    data-testid={`button-review-${theme.id}`}
                  >
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i <= Math.round(theme.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{theme.rating}</span>
                    <span className="text-xs text-muted-foreground underline underline-offset-2 group-hover/rating:text-primary transition-colors">
                      ({theme.reviewCount} review)
                    </span>
                  </button>

                  <div className="flex flex-col gap-2 mt-auto pt-1">
                    <button
                      onClick={() => setReviewTheme(theme)}
                      className="w-full py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-200 flex items-center justify-center gap-1.5"
                      data-testid={`button-lihat-review-${theme.id}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Lihat Review
                    </button>
                    <Link href="/register">
                      <Button
                        size="sm"
                        className="w-full text-xs font-semibold h-8"
                        data-testid={`button-gunakan-tema-${theme.id}`}
                      >
                        Gunakan Tema
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ThemePreviewModal theme={previewTheme} onClose={() => setPreviewTheme(null)} />
      <ThemeReviewModal theme={reviewTheme} onClose={() => setReviewTheme(null)} />

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 font-semibold text-xs px-3 py-1">Harga Terjangkau</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Pilihan Paket</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">Mulai gratis, upgrade kapan saja. Tidak ada biaya tersembunyi.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border bg-card overflow-hidden transition-all duration-200 ${
                  plan.highlighted
                    ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                    : "border-card-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-2 tracking-wide">
                    ★ PALING POPULER ★
                  </div>
                )}
                <div className="p-7">
                  <h3 className="font-extrabold text-xl text-foreground mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4 font-medium">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1.5">/{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={plan.highlighted ? "text-foreground font-medium" : "text-muted-foreground"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button
                      variant={plan.highlighted ? "default" : "outline"}
                      className={`w-full font-semibold ${plan.highlighted ? "shadow-md" : ""}`}
                      data-testid={`button-plan-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 font-semibold text-xs px-3 py-1">Testimoni</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Kata Mereka</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">Bergabung dengan ribuan pasangan yang sudah mempercayai WedSaaS.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 bg-card border border-card-border rounded-2xl hover-elevate-2 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 border-y border-border bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Data Aman & Terenkripsi", desc: "Privasi dan keamanan data tamu dijaga penuh" },
              { icon: Zap, title: "Setup Hanya 5 Menit", desc: "Tanpa coding, langsung bisa dipakai siapa saja" },
              { icon: Clock, title: "Tersedia 24/7", desc: "Undangan kamu online dan bisa diakses kapan saja" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 font-semibold text-xs px-3 py-1">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 tracking-tight">Pertanyaan Umum</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                  openFaq === i ? "border-primary/30 bg-primary/3" : "border-border bg-card"
                }`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-3 p-5">
                  <p className={`font-semibold text-sm ${openFaq === i ? "text-primary" : "text-foreground"}`}>{faq.q}</p>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </div>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-br from-primary/8 via-background to-rose-500/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 mb-7">
            <Heart className="w-8 h-8 text-primary fill-current" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            Siap Buat Undangan Digitalmu?
          </h2>
          <p className="text-muted-foreground mb-9 text-lg leading-relaxed">
            Bergabung dengan ribuan pasangan yang sudah menggunakan WedSaaS untuk hari pernikahan mereka yang istimewa.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="gap-2 h-12 px-8 text-base font-semibold shadow-lg" data-testid="button-footer-cta">
                Mulai Gratis Sekarang
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium">
                Sudah Punya Akun
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-card-border pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <Heart className="w-5 h-5 text-primary-foreground fill-current" />
                </div>
                <span className="font-bold text-xl text-foreground tracking-tight">WedSaaS</span>
              </div>
              <p className="text-muted-foreground text-base max-w-sm mb-6 leading-relaxed">
                Platform SaaS undangan pernikahan digital terbaik di Indonesia. Bantu ribuan pasangan menciptakan momen tak terlupakan dengan teknologi modern.
              </p>
              <div className="flex gap-4">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <Button key={i} size="icon" variant="ghost" className="rounded-full hover-elevate" data-testid={`button-social-${i}`}>
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Produk Column */}
            <div>
              <h4 className="font-bold text-foreground mb-6">Produk</h4>
              <ul className="space-y-4">
                {navLinks.map(([href, label]) => (
                  <li key={href}>
                    <a href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bantuan Column */}
            <div>
              <h4 className="font-bold text-foreground mb-6">Bantuan</h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/login">
                    <span className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium cursor-pointer">Masuk ke Akun</span>
                  </Link>
                </li>
                <li>
                  <Link href="/register">
                    <span className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium cursor-pointer">Daftar Gratis</span>
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@wedsaas.com" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                    Hubungi Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-card-border flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-xs text-tertiary font-medium">
              &copy; {new Date().getFullYear()} WedSaaS. Seluruh hak cipta dilindungi.
            </p>
            <p className="text-xs text-tertiary font-medium italic">
              "Mewujudkan Pernikahan Impian di Era Digital"
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
