import { type FullInvitation } from "@shared/schema";
import { Calendar, Clock, MapPin } from "lucide-react";

interface EventsBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function EventsBlock({ content, style, invitationData, globalSettings }: EventsBlockProps) {
  const { heading, akadLabel, akadDate, akadTime, akadVenue, akadAddress, receptionLabel, receptionDate, receptionTime, receptionVenue, receptionAddress } = content;
  
  return (
    <div 
      className="py-16 px-4 max-w-4xl mx-auto"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        textAlign: style.textAlign || "center",
        padding: style.padding || "80px 20px",
      } as React.CSSProperties}
    >
      <h2 
        className="text-2xl sm:text-3xl font-bold mb-12"
        style={{ fontFamily: globalSettings.fontHeading }}
      >
        {heading}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { label: akadLabel, date: akadDate, time: akadTime, venue: akadVenue, address: akadAddress },
          { label: receptionLabel, date: receptionDate, time: receptionTime, venue: receptionVenue, address: receptionAddress }
        ].map((event, i) => (
          <div key={i} className="p-8 rounded-2xl border border-current/10 bg-current/5 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-6 opacity-90 uppercase tracking-widest text-xs" style={{ fontFamily: globalSettings.fontHeading }}>
              {event.label}
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex flex-col items-center">
                <Calendar className="w-5 h-5 mb-2 opacity-50" />
                <p className="font-medium">{event.date}</p>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="w-5 h-5 mb-2 opacity-50" />
                <p>{event.time}</p>
              </div>
              <div className="flex flex-col items-center">
                <MapPin className="w-5 h-5 mb-2 opacity-50" />
                <p className="font-bold mb-1">{event.venue}</p>
                <p className="opacity-70 max-w-xs">{event.address}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
