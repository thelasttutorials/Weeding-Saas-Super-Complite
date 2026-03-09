import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart, Mail, Users, BarChart3, Palette, CheckCircle, Star,
  ArrowRight, Play, Clock, MapPin, Gift, MessageSquare, ChevronDown,
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: Mail, title: "Digital Invitations", desc: "Create beautiful, mobile-first wedding invitations with your own custom link." },
  { icon: Users, title: "RSVP Management", desc: "Manage guest responses, attendance count, and meal preferences with ease." },
  { icon: MessageSquare, title: "Guest Messages", desc: "Collect heartfelt wishes and congratulations from all your invited guests." },
  { icon: Gift, title: "Digital Gift Registry", desc: "Share bank transfer details and e-wallet accounts for cashless gifting." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track invitation views, RSVP rates, and guest engagement in real time." },
  { icon: Palette, title: "Beautiful Themes", desc: "Choose from classic, modern, floral, or gold themes that match your style." },
];

const steps = [
  { num: "01", title: "Create Your Invitation", desc: "Fill in your wedding details — couple info, event date, venue, and love story." },
  { num: "02", title: "Customize the Design", desc: "Choose a theme, upload photos, and personalize every section of your page." },
  { num: "03", title: "Share Your Link", desc: "Publish and share a beautiful link with your guests. Track views in real time." },
  { num: "04", title: "Manage Everything", desc: "Monitor RSVPs, read guest messages, and see gift confirmations — all in one place." },
];

const themes = [
  { name: "Classic Elegant", color: "from-stone-800 to-stone-600", accent: "border-amber-300" },
  { name: "Minimal Modern", color: "from-zinc-900 to-zinc-700", accent: "border-zinc-400" },
  { name: "Romantic Floral", color: "from-rose-800 to-pink-600", accent: "border-pink-300" },
  { name: "Luxury Gold", color: "from-yellow-800 to-amber-600", accent: "border-yellow-300" },
];

const plans = [
  {
    name: "Free",
    price: "Rp 0",
    period: "forever",
    features: ["1 invitation", "Basic theme", "RSVP form", "Guest messages", "WedSaaS watermark"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "Rp 99.000",
    period: "per invitation",
    features: ["All Free features", "All premium themes", "Digital gift registry", "Analytics dashboard", "No watermark", "Priority support"],
    cta: "Go Premium",
    highlighted: true,
  },
  {
    name: "Business",
    price: "Rp 299.000",
    period: "per month",
    features: ["Unlimited invitations", "All Premium features", "White label option", "Custom domain (coming soon)", "API access", "Dedicated support"],
    cta: "Go Business",
    highlighted: false,
  },
];

const testimonials = [
  { name: "Anisa & Budi", role: "Married March 2025", text: "WedSaaS made our digital invitation so beautiful and professional. Guests loved it and RSVPs came flooding in!" },
  { name: "Sari & Dimas", role: "Married January 2025", text: "We saved so much on printing! The digital gift feature was amazing — guests could transfer gifts directly." },
  { name: "Rina & Fajar", role: "Married April 2025", text: "The analytics showed us 847 views in the first week. We could see which friends were excited about the wedding!" },
];

const faqs = [
  { q: "Can I try WedSaaS for free?", a: "Yes! Our Free plan lets you create one invitation with core features including RSVP and guest messages at no cost." },
  { q: "How do guests access my invitation?", a: "Each invitation gets a unique link like wedsaas.com/invite/your-name. Share it via WhatsApp, Instagram, or email." },
  { q: "Can I change the design after publishing?", a: "Absolutely. You can edit your invitation anytime, including theme, content, and photos — changes appear instantly." },
  { q: "Is my data secure?", a: "Yes. All data is stored securely in our encrypted database. We never share your personal information with third parties." },
  { q: "What happens to my invitation after the wedding?", a: "Your invitation stays online indefinitely. You can archive it or delete it from your dashboard whenever you're ready." },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground fill-current" />
            </div>
            <span className="font-bold text-lg text-foreground">WedSaaS</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover-elevate rounded-md px-2 py-1">Features</a>
            <a href="#how-it-works" className="hover-elevate rounded-md px-2 py-1">How it Works</a>
            <a href="#pricing" className="hover-elevate rounded-md px-2 py-1">Pricing</a>
            <a href="#faq" className="hover-elevate rounded-md px-2 py-1">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="button-login">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" data-testid="button-get-started">Coba Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-rose-500/5" />
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-rose-300/10 blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="secondary" className="mb-6 text-xs font-medium">
            <Heart className="w-3 h-3 mr-1 fill-current text-primary" />
            Platform Undangan Pernikahan Digital #1
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            Undangan Pernikahan
            <span className="block text-primary">Digital yang Elegan</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Buat undangan pernikahan digital yang indah, bagikan ke semua tamu, kelola RSVP, dan terima ucapan — semua dalam satu platform.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="gap-2" data-testid="button-hero-cta">
                Coba Gratis Sekarang
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-demo">
                <Play className="w-4 h-4" />
                Lihat Demo
              </Button>
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {["10.000+ Undangan Dibuat", "98% Kepuasan Pengguna", "Gratis untuk Dicoba"].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs">Fitur Lengkap</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Semua yang Kamu Butuhkan</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Platform undangan pernikahan digital terlengkap untuk pernikahanmu yang sempurna.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="hover-elevate cursor-default">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs">Mudah Digunakan</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Cara Kerja WedSaaS</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Dari pembuatan hingga membagikan undangan, hanya dalam beberapa menit.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-sm">{step.num}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute translate-x-32 translate-y-[-3rem] w-full">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Themes */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs">4 Tema Tersedia</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Tema yang Memukau</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Pilih tema yang sesuai dengan kepribadian dan konsep pernikahanmu.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {themes.map((theme) => (
              <div key={theme.name} className="hover-elevate rounded-lg overflow-hidden cursor-pointer group">
                <div className={`aspect-[3/4] bg-gradient-to-b ${theme.color} relative flex flex-col items-center justify-end p-4`}>
                  <div className={`absolute inset-0 border-2 ${theme.accent} rounded-lg opacity-40 group-hover:opacity-70 transition-opacity`} />
                  <div className="relative z-10 text-center">
                    <div className="w-6 h-0.5 bg-white/60 mx-auto mb-2" />
                    <p className="text-white/90 text-xs font-medium">Ahmad & Budi</p>
                    <p className="text-white/60 text-xs">12 Desember 2025</p>
                  </div>
                </div>
                <div className="p-3 bg-card border border-card-border border-t-0 rounded-b-lg">
                  <p className="text-sm font-medium text-foreground text-center">{theme.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs">Harga Terjangkau</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Pilihan Paket</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Mulai gratis, upgrade kapan saja sesuai kebutuhanmu.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.highlighted ? "border-primary shadow-lg" : ""}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="text-xs">Paling Populer</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-1">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button
                      variant={plan.highlighted ? "default" : "outline"}
                      className="w-full"
                      data-testid={`button-plan-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs">Testimoni</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Kata Mereka</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <Card key={t.name} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Pertanyaan Umum</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card
                key={i}
                className="cursor-pointer"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-sm text-foreground">{faq.q}</p>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </div>
                  {openFaq === i && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{faq.a}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Heart className="w-8 h-8 text-primary fill-current" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Siap Membuat Undangan Digitalmu?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Bergabung dengan ribuan pasangan yang sudah menggunakan WedSaaS untuk undangan pernikahan mereka.</p>
          <Link href="/register">
            <Button size="lg" className="gap-2" data-testid="button-footer-cta">
              Mulai Gratis Sekarang
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-primary-foreground fill-current" />
            </div>
            <span className="font-bold text-foreground">WedSaaS</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 WedSaaS. Platform Undangan Pernikahan Digital.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover-elevate px-2 py-1 rounded">Privacy</a>
            <a href="#" className="hover-elevate px-2 py-1 rounded">Terms</a>
            <a href="#" className="hover-elevate px-2 py-1 rounded">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
