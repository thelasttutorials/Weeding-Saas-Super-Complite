import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Heart, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

const benefits = [
  "Buat undangan digital yang elegan dalam 5 menit",
  "Kelola RSVP dan pesan tamu secara otomatis",
  "Analytics real-time untuk semua undangan",
  "Digital gift registry tanpa ribet",
];

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
    } catch (err: any) {
      toast({ title: "Login gagal", description: err.message || "Username atau password salah", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative bg-gradient-to-br from-rose-900 via-primary to-rose-700 flex-col justify-between p-12 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-dots opacity-10" />
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
              Undangan Pernikahan
              <br />
              <span className="text-white/75">yang Tak Terlupakan</span>
            </h2>
            <p className="text-white/65 text-base leading-relaxed">
              Platform terlengkap untuk menciptakan, membagikan, dan mengelola undangan pernikahan digitalmu.
            </p>
          </div>
          <ul className="space-y-3.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/80 text-sm leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Quote */}
        <div className="relative z-10 border-t border-white/15 pt-6">
          <p className="text-white/50 text-xs font-medium">Dipercaya 10.000+ pasangan di Indonesia</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-primary-foreground fill-current" />
            </div>
            <span className="font-bold text-xl text-foreground">WedSaaS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-1.5">Selamat datang kembali</h1>
            <p className="text-sm text-muted-foreground">Masuk untuk mengelola undangan pernikahanmu.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="username_kamu"
                        autoComplete="username"
                        className="h-11"
                        data-testid="input-username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-11"
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm shadow-sm mt-1"
                disabled={loading}
                data-testid="button-login-submit"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Masuk ke Dashboard
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Daftar gratis
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Demo: username <code className="bg-muted px-1.5 py-0.5 rounded font-mono">demo</code> / password <code className="bg-muted px-1.5 py-0.5 rounded font-mono">demo123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
