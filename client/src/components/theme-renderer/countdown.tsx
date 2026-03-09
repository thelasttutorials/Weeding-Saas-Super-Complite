import { type FullInvitation } from "@shared/schema";
import { useState, useEffect } from "react";

interface CountdownBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function CountdownBlock({ content, style, invitationData, globalSettings }: CountdownBlockProps) {
  const { heading, subHeading, targetDate } = content;
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const parsed = targetDate ? new Date(targetDate).getTime() : NaN;
    if (!targetDate || isNaN(parsed)) return;

    const calc = () => {
      const diff = parsed - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div 
      className="py-12 px-4 text-center"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        textAlign: style.textAlign || "center",
        padding: style.padding || "60px 20px",
      } as React.CSSProperties}
    >
      <h2 
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: globalSettings.fontHeading }}
      >
        {heading}
      </h2>
      {subHeading && <p className="text-sm opacity-70 mb-8">{subHeading}</p>}
      
      <div className="flex gap-4 sm:gap-6 justify-center">
        {[{ v: timeLeft.days, l: "Hari" }, { v: timeLeft.hours, l: "Jam" }, { v: timeLeft.minutes, l: "Menit" }, { v: timeLeft.seconds, l: "Detik" }].map(({ v, l }) => (
          <div key={l} className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl bg-current/5 border border-current/10 mb-2">
              <span className="text-2xl sm:text-3xl font-bold">{String(v).padStart(2, "0")}</span>
            </div>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest opacity-60">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
