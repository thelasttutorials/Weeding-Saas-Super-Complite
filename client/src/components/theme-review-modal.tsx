import { X, Star, ThumbsUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeData } from "./theme-preview-modal";

interface ThemeReviewModalProps {
  theme: ThemeData | null;
  onClose: () => void;
}

export interface ThemeReview {
  id: string;
  reviewerName: string;
  reviewerInitials: string;
  reviewerColor: string;
  rating: number;
  comment: string;
  weddingDateLabel: string;
  createdAt: string;
  helpful: number;
}

const themeReviews: Record<string, ThemeReview[]> = {
  "classic-elegant": [
    {
      id: "ce-1",
      reviewerName: "Anisa & Riko",
      reviewerInitials: "AR",
      reviewerColor: "bg-amber-100 text-amber-700",
      rating: 5,
      comment: "Temanya elegan banget dan RSVP-nya mudah dipakai tamu. Banyak tamu yang bilang undangannya cantik banget. Puas sekali pilih Classic Elegant!",
      weddingDateLabel: "Menikah November 2024",
      createdAt: "2 minggu lalu",
      helpful: 42,
    },
    {
      id: "ce-2",
      reviewerName: "Dewi & Arman",
      reviewerInitials: "DA",
      reviewerColor: "bg-stone-100 text-stone-700",
      rating: 5,
      comment: "Classic Elegant cocok banget buat konsep pernikahan mewah kami di hotel bintang lima. Penampilannya sophisticated dan timeless. Tidak menyesal sama sekali!",
      weddingDateLabel: "Menikah September 2024",
      createdAt: "1 bulan lalu",
      helpful: 38,
    },
    {
      id: "ce-3",
      reviewerName: "Maya & Farid",
      reviewerInitials: "MF",
      reviewerColor: "bg-rose-100 text-rose-700",
      rating: 4,
      comment: "Desainnya mewah sekali dengan nuansa gelap yang elegan. Perpaduan warna gold dan dark sangat pas. Fitur countdown-nya juga keren, bikin tamu makin excited datang.",
      weddingDateLabel: "Menikah Desember 2024",
      createdAt: "3 minggu lalu",
      helpful: 27,
    },
    {
      id: "ce-4",
      reviewerName: "Rani & Dani",
      reviewerInitials: "RD",
      reviewerColor: "bg-amber-100 text-amber-700",
      rating: 5,
      comment: "Sudah coba beberapa platform, tapi WedSaaS dengan tema Classic Elegant ini paling juara. Tamu dari luar kota pun bisa RSVP dengan mudah. Highly recommended!",
      weddingDateLabel: "Menikah Oktober 2024",
      createdAt: "5 minggu lalu",
      helpful: 51,
    },
  ],
  "minimal-modern": [
    {
      id: "mm-1",
      reviewerName: "Sinta & Kevin",
      reviewerInitials: "SK",
      reviewerColor: "bg-zinc-100 text-zinc-700",
      rating: 5,
      comment: "Minimal Modern cocok banget buat konsep nikahan kami yang berkonsep modern dan clean. Tamu-tamu pada suka karena tampilannya fresh dan tidak ribet.",
      weddingDateLabel: "Menikah Januari 2025",
      createdAt: "1 minggu lalu",
      helpful: 33,
    },
    {
      id: "mm-2",
      reviewerName: "Citra & Dimas",
      reviewerInitials: "CD",
      reviewerColor: "bg-blue-100 text-blue-700",
      rating: 5,
      comment: "Kami pasangan yang suka desain minimalis, dan tema ini persis seperti yang kami bayangkan. Clean, modern, dan profesional. RSVP-nya juga sangat user-friendly.",
      weddingDateLabel: "Menikah Maret 2025",
      createdAt: "3 hari lalu",
      helpful: 18,
    },
    {
      id: "mm-3",
      reviewerName: "Putri & Bima",
      reviewerInitials: "PB",
      reviewerColor: "bg-slate-100 text-slate-700",
      rating: 4,
      comment: "Tema yang sangat clean dan contemporary. Cocok banget buat konsep garden wedding modern kami. Tamu yang lebih muda pada suka tampilannya yang kekinian.",
      weddingDateLabel: "Menikah Februari 2025",
      createdAt: "2 minggu lalu",
      helpful: 24,
    },
    {
      id: "mm-4",
      reviewerName: "Lina & Roy",
      reviewerInitials: "LR",
      reviewerColor: "bg-zinc-100 text-zinc-700",
      rating: 5,
      comment: "Sudah 847 views dalam seminggu! Teman-teman pada bilang undangannya stylish banget. Minimal Modern memang pilihan tepat untuk pasangan milenial.",
      weddingDateLabel: "Menikah April 2025",
      createdAt: "5 hari lalu",
      helpful: 45,
    },
  ],
  "romantic-floral": [
    {
      id: "rf-1",
      reviewerName: "Nadia & Rizky",
      reviewerInitials: "NR",
      reviewerColor: "bg-pink-100 text-pink-700",
      rating: 5,
      comment: "Romantic Floral kelihatan mewah dan manis sesuai ekspektasi! Nuansa pink dan floral-nya bikin undangan terasa hangat dan romantis. Ibu mertua pun ikut suka!",
      weddingDateLabel: "Menikah Februari 2025",
      createdAt: "2 minggu lalu",
      helpful: 67,
    },
    {
      id: "rf-2",
      reviewerName: "Indah & Bayu",
      reviewerInitials: "IB",
      reviewerColor: "bg-rose-100 text-rose-700",
      rating: 5,
      comment: "Temanya sangat cantik dan feminim. Cocok banget buat konsep garden wedding kami. Tamu-tamu pada kagum dengan animasinya yang halus dan tampilannya yang indah.",
      weddingDateLabel: "Menikah Maret 2025",
      createdAt: "1 minggu lalu",
      helpful: 54,
    },
    {
      id: "rf-3",
      reviewerName: "Hana & Zaki",
      reviewerInitials: "HZ",
      reviewerColor: "bg-pink-100 text-pink-700",
      rating: 5,
      comment: "Sempurna untuk konsep outdoor floral wedding kami di kebun! Setiap detail di tema ini memang menawan. Tamu-tamu dengan mudah RSVP dan meninggalkan ucapan indah.",
      weddingDateLabel: "Menikah April 2025",
      createdAt: "4 hari lalu",
      helpful: 39,
    },
    {
      id: "rf-4",
      reviewerName: "Bella & Aldi",
      reviewerInitials: "BA",
      reviewerColor: "bg-rose-100 text-rose-700",
      rating: 4,
      comment: "Tema yang sangat girly dan romantis! Cocok banget buat saya yang memang suka konsep floral. Suami juga setuju karena terlihat elegan, tidak lebay.",
      weddingDateLabel: "Menikah Januari 2025",
      createdAt: "1 bulan lalu",
      helpful: 29,
    },
  ],
  "luxury-gold": [
    {
      id: "lg-1",
      reviewerName: "Vina & Andre",
      reviewerInitials: "VA",
      reviewerColor: "bg-amber-100 text-amber-700",
      rating: 5,
      comment: "Luxury Gold benar-benar mencerminkan konsep pernikahan mewah kami di Ritz Carlton. Tamu-tamu VIP kami sangat terkesan dengan tampilannya yang glamor dan prestisius.",
      weddingDateLabel: "Menikah Desember 2024",
      createdAt: "3 minggu lalu",
      helpful: 58,
    },
    {
      id: "lg-2",
      reviewerName: "Tara & Hendra",
      reviewerInitials: "TH",
      reviewerColor: "bg-yellow-100 text-yellow-700",
      rating: 5,
      comment: "Akhirnya menemukan tema yang benar-benar luxury! Background dark dengan aksen gold-nya sangat premium. Pas banget untuk wedding malam kami yang berkonsep black tie.",
      weddingDateLabel: "Menikah November 2024",
      createdAt: "1 bulan lalu",
      helpful: 44,
    },
    {
      id: "lg-3",
      reviewerName: "Ayu & Marco",
      reviewerInitials: "AM",
      reviewerColor: "bg-amber-100 text-amber-700",
      rating: 4,
      comment: "Tema paling mewah yang pernah saya lihat di undangan digital. Cocok banget untuk konsep formal dan high-end. Banyak tamu yang terkesima dan bertanya pakai platform apa.",
      weddingDateLabel: "Menikah Oktober 2024",
      createdAt: "5 minggu lalu",
      helpful: 36,
    },
    {
      id: "lg-4",
      reviewerName: "Risa & Denny",
      reviewerInitials: "RD",
      reviewerColor: "bg-yellow-100 text-yellow-700",
      rating: 5,
      comment: "Luxury Gold sangat pas untuk wedding kami yang berkonsep glamor. Detail goldnya sangat cantik dan terlihat mahal. Investasi yang tepat untuk momen sekali seumur hidup!",
      weddingDateLabel: "Menikah September 2024",
      createdAt: "6 minggu lalu",
      helpful: 62,
    },
  ],
};

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

function RatingBar({ count, total, stars }: { count: number; total: number; stars: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-4 text-right shrink-0">{stars}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-muted-foreground w-4 shrink-0">{count}</span>
    </div>
  );
}

export default function ThemeReviewModal({ theme, onClose }: ThemeReviewModalProps) {
  if (!theme) return null;

  const reviews = themeReviews[theme.id] ?? [];
  const total = reviews.length;
  const avgRating = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div>
              <h3 className="font-bold text-foreground text-base">Review Tema</h3>
              <p className="text-muted-foreground text-xs mt-0.5">{theme.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              data-testid="button-close-review"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-6 py-5 border-b border-border shrink-0 bg-muted/30">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-extrabold text-foreground tracking-tight">{avgRating.toFixed(1)}</p>
                <StarRating rating={Math.round(avgRating)} size="sm" />
                <p className="text-muted-foreground text-xs mt-1">{total} review</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {ratingCounts.map(({ stars, count }) => (
                  <RatingBar key={stars} stars={stars} count={count} total={total} />
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-5 space-y-4" data-testid="review-list">
            {reviews.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground text-sm">Belum ada review untuk tema ini.</p>
              </div>
            ) : (
              reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 bg-background border border-border rounded-xl"
                  data-testid={`review-item-${review.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full ${review.reviewerColor} flex items-center justify-center text-xs font-bold shrink-0`}>
                      {review.reviewerInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm">{review.reviewerName}</p>
                        <span className="text-muted-foreground text-xs shrink-0">{review.createdAt}</span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">{review.weddingDateLabel}</p>
                      <StarRating rating={review.rating} size="sm" />
                      <p className="text-foreground text-sm mt-2 leading-relaxed">"{review.comment}"</p>
                      <div className="flex items-center gap-1.5 mt-3">
                        <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground text-xs">{review.helpful} orang merasa terbantu</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
