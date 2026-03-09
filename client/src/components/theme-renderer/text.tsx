import { type FullInvitation } from "@shared/schema";

interface TextBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function TextBlock({ content, style, invitationData, globalSettings }: TextBlockProps) {
  const { heading, body } = content;
  
  return (
    <div 
      className="py-12 px-4 max-w-2xl mx-auto"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        textAlign: style.textAlign || "center",
        padding: style.padding || "40px 20px",
      } as React.CSSProperties}
    >
      {heading && (
        <h2 
          className="text-2xl font-bold mb-6"
          style={{ fontFamily: globalSettings.fontHeading }}
        >
          {heading}
        </h2>
      )}
      <div 
        className="text-base leading-relaxed opacity-80 whitespace-pre-wrap"
        style={{ textAlign: style.textAlign as any }}
      >
        {body}
      </div>
    </div>
  );
}
