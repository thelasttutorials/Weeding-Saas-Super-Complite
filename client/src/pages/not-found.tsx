import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        <div className="mb-8">
          <h1 className="text-9xl font-extrabold text-primary/20 select-none">404</h1>
          <div className="relative -mt-20">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Halaman Tidak Ditemukan</h2>
            <p className="text-muted-foreground">
              Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
            </p>
          </div>
        </div>

        <Card className="border-dashed mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground italic">
              "Cinta itu abadi, tapi link ini mungkin tidak."
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" size="lg" className="gap-2" data-testid="button-back">
            <button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>
          </Button>
          <Button asChild size="lg" className="gap-2" data-testid="button-home">
            <Link href="/">
              <Home className="h-4 w-4" />
              Ke Beranda
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
