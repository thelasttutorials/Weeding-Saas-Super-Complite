import { type FullInvitation } from "@shared/schema";

interface CoupleBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function CoupleBlock({ content, style, invitationData, globalSettings }: CoupleBlockProps) {
  const { heading, groomName, groomParents, groomPhoto, brideName, brideParents, bridePhoto } = content;
  
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-center">
          {bridePhoto && (
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-current opacity-20 mb-6 aspect-square">
              <img src={bridePhoto} alt={brideName} className="w-full h-full object-cover" />
            </div>
          )}
          <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: globalSettings.fontHeading }}>{brideName}</h3>
          <p className="text-sm italic opacity-70">Putri dari {brideParents}</p>
        </div>
        
        <div className="flex flex-col items-center">
          {groomPhoto && (
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-current opacity-20 mb-6 aspect-square">
              <img src={groomPhoto} alt={groomName} className="w-full h-full object-cover" />
            </div>
          )}
          <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: globalSettings.fontHeading }}>{groomName}</h3>
          <p className="text-sm italic opacity-70">Putra dari {groomParents}</p>
        </div>
      </div>
    </div>
  );
}
