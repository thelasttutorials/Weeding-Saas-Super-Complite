import { type WeddingThemeBlock } from "@shared/schema";
import { type FullInvitation } from "@shared/schema";
import CoverBlock from "./cover";
import CoupleBlock from "./couple";
import QuoteBlock from "./quote";
import CountdownBlock from "./countdown";
import StoryBlock from "./story";
import EventsBlock from "./events";
import MapsBlock from "./maps";
import GalleryBlock from "./gallery";
import RsvpBlock from "./rsvp";
import MessagesBlock from "./messages";
import GiftsBlock from "./gifts";
import ClosingBlock from "./closing";
import DividerBlock from "./divider";
import TextBlock from "./text";

interface ThemeRendererProps {
  blocks: WeddingThemeBlock[];
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function ThemeRenderer({ blocks, invitationData, globalSettings }: ThemeRendererProps) {
  const visibleBlocks = blocks
    .filter((b) => b.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const renderBlock = (block: WeddingThemeBlock) => {
    const content = typeof block.content === "string" ? JSON.parse(block.content) : block.content;
    const style = typeof block.style === "string" ? JSON.parse(block.style) : block.style;

    const props = {
      content,
      style,
      invitationData,
      globalSettings,
    };

    switch (block.blockType) {
      case "cover":
        return <CoverBlock {...props} />;
      case "couple":
        return <CoupleBlock {...props} />;
      case "quote":
        return <QuoteBlock {...props} />;
      case "countdown":
        return <CountdownBlock {...props} />;
      case "story":
        return <StoryBlock {...props} />;
      case "events":
        return <EventsBlock {...props} />;
      case "maps":
        return <MapsBlock {...props} />;
      case "gallery":
        return <GalleryBlock {...props} />;
      case "rsvp":
        return <RsvpBlock {...props} />;
      case "messages":
        return <MessagesBlock {...props} />;
      case "gifts":
        return <GiftsBlock {...props} />;
      case "closing":
        return <ClosingBlock {...props} />;
      case "divider":
        return <DividerBlock {...props} />;
      case "text":
        return <TextBlock {...props} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="w-full min-h-screen" 
      style={{ 
        backgroundColor: globalSettings.bgColor,
        color: globalSettings.fontBodyColor || "inherit",
        fontFamily: globalSettings.fontBody,
        "--primary": globalSettings.primaryColor,
        "--secondary": globalSettings.secondaryColor,
        "--accent": globalSettings.accentColor,
        "--radius": `${globalSettings.borderRadius}px`,
      } as React.CSSProperties}
    >
      {visibleBlocks.map((block) => (
        <section key={block.id} id={`block-${block.id}`}>
          {renderBlock(block)}
        </section>
      ))}
    </div>
  );
}
