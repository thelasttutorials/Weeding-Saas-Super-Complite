import { type FullInvitation } from "@shared/schema";

interface GalleryBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function GalleryBlock({ content, style, invitationData, globalSettings }: GalleryBlockProps) {
  const { heading, subHeading } = content;
  const gallery = invitationData.gallery || [];
  
  return (
    <div 
      className="py-16 px-4 max-w-5xl mx-auto"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        textAlign: style.textAlign || "center",
        padding: style.padding || "80px 20px",
      } as React.CSSProperties}
    >
      <div className="text-center mb-10">
        <h2 
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ fontFamily: globalSettings.fontHeading }}
        >
          {heading}
        </h2>
        {subHeading && <p className="text-sm opacity-70">{subHeading}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {gallery.map((img) => (
          <div key={img.id} className="aspect-square rounded-xl overflow-hidden shadow-sm group">
            <img 
              src={img.imageUrl} 
              alt={img.caption || ""} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
          </div>
        ))}
        {gallery.length === 0 && (
          <div className="col-span-full py-12 border-2 border-dashed border-current/10 rounded-xl opacity-40">
            Belum ada foto di galeri
          </div>
        )}
      </div>
    </div>
  );
}
