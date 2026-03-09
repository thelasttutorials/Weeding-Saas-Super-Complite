import { type FullInvitation } from "@shared/schema";
import { ChevronDown, Heart } from "lucide-react";

interface CoverBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function CoverBlock({ content, style, invitationData, globalSettings }: CoverBlockProps) {
  const { groomName, brideName, weddingDate, openingText, subText, buttonText, backgroundImage } = content;
  
  const bgImage = backgroundImage || invitationData.coverImage || invitationData.couple?.couplePhoto;
  
  return (
    <section 
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4"
      style={{
        backgroundColor: style.backgroundColor || "#000",
        color: style.textColor || "#fff",
        textAlign: style.textAlign || "center",
      } as React.CSSProperties}
    >
      {bgImage && (
        <>
          <img 
            src={bgImage} 
            alt="Wedding Cover" 
            className="absolute inset-0 w-full h-full object-cover" 
          />
          <div 
            className="absolute inset-0" 
            style={{ 
              background: `rgba(0,0,0,${style.overlayOpacity || 0.5})` 
            }} 
          />
        </>
      )}
      
      <div className="relative z-10 text-center max-w-lg">
        {openingText && (
          <p className="text-sm italic opacity-80 mb-4">{openingText}</p>
        )}
        
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-12 bg-current opacity-30" />
            <Heart className="w-5 h-5 opacity-70 fill-current" />
            <div className="h-px w-12 bg-current opacity-30" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] mb-6 opacity-70">
            Undangan Pernikahan
          </p>
        </div>

        <h1 
          className="text-4xl sm:text-6xl font-bold leading-tight mb-4"
          style={{ fontFamily: globalSettings.fontHeading }}
        >
          {brideName}
          <span className="block text-2xl sm:text-3xl opacity-60 my-2">&</span>
          {groomName}
        </h1>

        {weddingDate && (
          <p className="text-base tracking-widest mb-8 opacity-90">
            {weddingDate}
          </p>
        )}

        {subText && (
          <p className="text-sm opacity-70 mb-8 max-w-sm mx-auto">
            {subText}
          </p>
        )}

        {buttonText && (
          <button
            onClick={() => {
              const nextSection = document.getElementById(`block-${invitationData.id}`)?.nextElementSibling;
              nextSection?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors mb-8"
          >
            {buttonText}
          </button>
        )}

        <div className="animate-bounce opacity-50">
          <ChevronDown className="w-6 h-6 mx-auto" />
        </div>
      </div>
    </section>
  );
}
