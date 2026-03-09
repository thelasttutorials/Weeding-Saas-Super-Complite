import { type FullInvitation } from "@shared/schema";
import { Quote } from "lucide-react";

interface QuoteBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function QuoteBlock({ content, style, invitationData, globalSettings }: QuoteBlockProps) {
  const { quoteText, quoteSource } = content;
  
  return (
    <div 
      className="py-12 px-4 max-w-3xl mx-auto text-center"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        textAlign: style.textAlign || "center",
        padding: style.padding || "60px 20px",
      } as React.CSSProperties}
    >
      <Quote className="w-10 h-10 mx-auto mb-6 opacity-20" />
      <p className="text-lg sm:text-xl italic leading-relaxed mb-4">
        {quoteText}
      </p>
      {quoteSource && (
        <p className="text-sm font-bold opacity-70 uppercase tracking-widest">
          — {quoteSource}
        </p>
      )}
    </div>
  );
}
