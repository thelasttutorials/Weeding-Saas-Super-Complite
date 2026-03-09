import { type FullInvitation } from "@shared/schema";
import { MapPin, ExternalLink } from "lucide-react";

interface MapsBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function MapsBlock({ content, style, invitationData, globalSettings }: MapsBlockProps) {
  const { heading, venues } = content;
  
  return (
    <div 
      className="py-12 px-4 max-w-2xl mx-auto text-center"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        padding: style.padding || "60px 20px",
      } as React.CSSProperties}
    >
      <h2 
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: globalSettings.fontHeading }}
      >
        {heading}
      </h2>

      <div className="space-y-4">
        {venues?.map((venue: any, i: number) => (
          <div key={i} className="flex flex-col items-center p-6 rounded-xl border border-current/10 bg-current/5">
            <MapPin className="w-6 h-6 mb-3 opacity-50" />
            <p className="text-xs uppercase tracking-widest opacity-60 mb-1">{venue.label}</p>
            <h4 className="font-bold mb-4">{venue.name}</h4>
            <a 
              href={venue.mapsLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-current text-white dark:text-black font-medium text-sm hover:opacity-90 transition-opacity"
              style={{ color: style.backgroundColor || '#fff' }}
            >
              <ExternalLink className="w-4 h-4" />
              Buka Google Maps
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
