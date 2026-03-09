import { type FullInvitation } from "@shared/schema";
import { Heart } from "lucide-react";

interface ClosingBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function ClosingBlock({ content, style, invitationData, globalSettings }: ClosingBlockProps) {
  const { heading, message, groomName, brideName, hashtag } = content;
  
  return (
    <div 
      className="py-20 px-4 text-center"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        textAlign: style.textAlign || "center",
        padding: style.padding || "100px 20px",
      } as React.CSSProperties}
    >
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12 bg-current opacity-20" />
          <Heart className="w-5 h-5 opacity-50 fill-current" />
          <div className="h-px w-12 bg-current opacity-20" />
        </div>

        <h2 
          className="text-3xl font-bold mb-6"
          style={{ fontFamily: globalSettings.fontHeading }}
        >
          {heading}
        </h2>
        
        <p className="text-base italic leading-relaxed opacity-80 mb-12">
          {message}
        </p>

        <div className="space-y-4 mb-12">
          <p className="text-sm uppercase tracking-widest opacity-60">Kami yang berbahagia,</p>
          <h3 className="text-3xl font-bold" style={{ fontFamily: globalSettings.fontHeading }}>
            {brideName} & {groomName}
          </h3>
        </div>

        {hashtag && (
          <p className="text-xl font-bold tracking-widest opacity-70" style={{ color: globalSettings.primaryColor }}>
            {hashtag}
          </p>
        )}
      </div>
    </div>
  );
}
