import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Heart, Loader2, CheckCircle, Star, Ticket } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const registerSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter").regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, dan underscore"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

const perks = [
  "Gratis selamanya — tidak perlu kartu kredit",
  "Setup cepat, undangan siap dalam 5 menit",
  "4 tema premium yang cantik dan elegan",
  "RSVP otomatis & analytics real-time",
];

const testimonialSnippet = {
  text: "WedSaaS bikin undangan kami jadi sangat profesional. Tamu-tamu pada kagum!",
  name: "Anisa & Budi",
  role: "Menikah Maret 2025",
  initials: "AB",
};

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [location] = useLocation();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", username: "", password: "", confirmPassword: "", referralCode: "" },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      form.setValue("referralCode", ref);
    }
  }, [form]);

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setLoading(true);
    try {
      await register({ 
        fullName: data.fullName, 
        email: data.email, 
        username: data.username, 
        password: data.password,
        referralCode: data.referralCode 
      });
    } catch (err: any) {
      toast({ title: "Pendaftaran gagal", description: err.message || "Silakan coba lagi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative bg-gradient-to-br from-rose-900 via-primary to-rose-700 flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-10" />
        <div className="absolute top-16 right-16 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-24 left-8 w-80 h-80 rounded-full bg-rose-900/40 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="font-bold text-white text-xl tracking-tight">WedSaaS</span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Mulai Perjalanan
              <br />
              <span className="text-white/75">Undangan Digitalmu</span>
            </h2>
            <p className="text-white/65 text-base leading-relaxed">
              Bergabung dengan ribuan pasangan yang sudah mempercayakan undangan pernikahan mereka kepada WedSaaS.
            </p>
          </div>
          <ul className="space-y-3.5">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/80 text-sm leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>

          {/* Testimonial snippet */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              ))}
            </div>
            <p className="text-white/85 text-sm leading-relaxed mb-3">"{testimonialSnippet.text}"</p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                {testimonialSnippet.initials}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{testimonialSnippet.name}</p>
                <p className="text-white/55 text-xs">{testimonialSnippet.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/15 pt-6">
          <p className="text-white/50 text-xs font-medium">Gratis selamanya • Tanpa kartu kredit</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-background overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-primary-foreground fill-current" />
            </div>
            <span className="font-bold text-xl text-foreground">WedSaaS</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-1.5">Buat Akun Gratis</h1>
            <p className="text-sm text-muted-foreground">Tidak perlu kartu kredit. Selesai dalam satu menit.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Nama Lengkap</FormLabel>
                  <FormControl><Input placeholder="Ahmad Ridwan" className="h-10" data-testid="input-full-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Email</FormLabel>
                  <FormControl><Input type="email" placeholder="email@example.com" className="h-10" autoComplete="email" data-testid="input-email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Username</FormLabel>
                  <FormControl><Input placeholder="ahmad_ridwan" className="h-10" autoComplete="username" data-testid="input-username" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" className="h-10" autoComplete="new-password" data-testid="input-password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Konfirmasi</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" className="h-10" autoComplete="new-password" data-testid="input-confirm-password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="referralCode" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Kode Referral (Opsional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="KODE6DIGIT" className="h-10 pl-9" data-testid="input-referral-code" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm shadow-sm mt-1"
                disabled={loading}
                data-testid="button-register-submit"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Buat Akun Gratis
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
            Dengan mendaftar, kamu menyetujui{" "}
            <a href="#" className="text-primary hover:underline">Syarat & Ketentuan</a> dan{" "}
            <a href="#" className="text-primary hover:underline">Kebijakan Privasi</a> kami.
          </p>
        </div>
      </div>
    </div>
  );
}
