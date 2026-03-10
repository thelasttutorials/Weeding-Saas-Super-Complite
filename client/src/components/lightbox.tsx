import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, isOpen, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-4 right-4 z-[110] flex items-center gap-4">
        <span className="text-white/70 text-sm font-sans">
          {currentIndex + 1} / {images.length}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/10 no-default-hover-elevate"
          onClick={onClose}
          data-testid="button-close-lightbox"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
        <Button
          size="icon"
          variant="ghost"
          className="absolute left-4 z-[110] text-white hover:bg-white/10 no-default-hover-elevate"
          onClick={handlePrev}
          data-testid="button-prev-lightbox"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>

        <img
          src={images[currentIndex]}
          alt=""
          className="max-w-full max-h-full object-contain select-none animate-in zoom-in-95 duration-300"
        />

        <Button
          size="icon"
          variant="ghost"
          className="absolute right-4 z-[110] text-white hover:bg-white/10 no-default-hover-elevate"
          onClick={handleNext}
          data-testid="button-next-lightbox"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
