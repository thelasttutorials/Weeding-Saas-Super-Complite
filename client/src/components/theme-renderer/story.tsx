import { type FullInvitation } from "@shared/schema";

interface StoryBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function StoryBlock({ content, style, invitationData, globalSettings }: StoryBlockProps) {
  const { heading, subHeading, events } = content;
  
  return (
    <div 
      className="py-16 px-4 max-w-2xl mx-auto"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        padding: style.padding || "80px 20px",
      } as React.CSSProperties}
    >
      <div className="text-center mb-12">
        <h2 
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ fontFamily: globalSettings.fontHeading }}
        >
          {heading}
        </h2>
        {subHeading && <p className="text-sm opacity-70">{subHeading}</p>}
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-current/20 before:to-transparent">
        {events?.map((event: any, index: number) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-current/20 bg-white dark:bg-zinc-950 text-current shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <span className="text-xs font-bold">{event.year}</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-current/10 bg-current/5">
              <h4 className="font-bold mb-1" style={{ fontFamily: globalSettings.fontHeading }}>{event.title}</h4>
              <p className="text-sm opacity-70 leading-relaxed">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
