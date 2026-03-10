import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Calendar, MapPin, ArrowRight } from "lucide-react";

export default function SaveTheDate() {
  const { slug } = useParams<{ slug: string }>();

  const { data: std, isLoading, error } = useQuery<{
    title: string;
    slug: string;
    coverImage?: string;
    saveTheDateMessage?: string;
    brideName?: string;
    groomName?: string;
    date?: string;
    venue?: string;
  }>({
    queryKey: ["/api/public", slug, "save-the-date"],
    queryFn: () => fetch(`/api/public/${slug}/save-the-date`).then(r => {
      if (!r.ok) throw new Error("Save The Date not found");
      return r.json();
    }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-md">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !std) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Heart className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
        <h1 className="text-xl font-bold mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-muted-foreground mb-6">Maaf, halaman Save The Date tidak tersedia atau belum diaktifkan.</p>
        <Link href="/">
          <Button variant="outline">Kembali ke Beranda</Button>
        </Link>
      </div>
    );
  }

  const formattedDate = std.date ? new Date(std.date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }) : "";

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden bg-background">
      {/* Background with wash */}
      {std.coverImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={std.coverImage}
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-2xl text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="space-y-2">
          <p className="text-primary-foreground/80 font-medium tracking-widest uppercase text-xs sm:text-sm">Save The Date</p>
          <div className="h-px w-12 bg-primary-foreground/30 mx-auto" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-serif text-white font-bold tracking-tight">
            {std.brideName} & {std.groomName}
          </h1>
          {std.saveTheDateMessage && (
            <p className="text-lg sm:text-xl text-white/90 italic font-serif max-w-lg mx-auto leading-relaxed">
              "{std.saveTheDateMessage}"
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 py-8 border-y border-white/20">
          {formattedDate && (
            <div className="flex flex-col items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-foreground/70" />
              <p className="text-white font-medium">{formattedDate}</p>
            </div>
          )}
          {std.venue && (
            <div className="flex flex-col items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-foreground/70" />
              <p className="text-white font-medium">{std.venue}</p>
            </div>
          )}
        </div>

        <div className="pt-8">
          <Link href={`/invite/${slug}`}>
            <Button size="lg" className="rounded-full px-8 gap-2 bg-white text-black hover:bg-white/90 no-default-hover-elevate">
              Lihat Undangan Lengkap
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <p className="text-white/40 text-[10px] tracking-widest uppercase">
          WedSaaS — Digital Wedding Invitation
        </p>
      </div>
    </div>
  );
}
