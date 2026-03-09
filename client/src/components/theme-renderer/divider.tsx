import { type FullInvitation } from "@shared/schema";

interface DividerBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function DividerBlock({ content, style, invitationData, globalSettings }: DividerBlockProps) {
  const { style: dividerStyle, text } = content;
  
  return (
    <div 
      className="w-full flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        height: style.height || "60px",
        padding: "20px 0",
      } as React.CSSProperties}
    >
      <div className="flex items-center gap-6 w-full max-w-lg px-4">
        <div className="flex-1 h-px bg-current opacity-20" />
        
        {dividerStyle === "ornament" && (
          <span className="text-xl opacity-60 px-2">{text || "♦"}</span>
        )}
        
        {dividerStyle === "floral" && (
          <span className="text-2xl opacity-60 px-2">❧</span>
        )}

        {dividerStyle === "line" && (
          <div className="w-2 h-2 rounded-full bg-current opacity-40" />
        )}

        <div className="flex-1 h-px bg-current opacity-20" />
      </div>
    </div>
  );
}
