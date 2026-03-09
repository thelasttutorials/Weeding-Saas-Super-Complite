import { type FullInvitation } from "@shared/schema";
import { Gift, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface GiftsBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function GiftsBlock({ content, style, invitationData, globalSettings }: GiftsBlockProps) {
  const { heading, subHeading } = content;
  const giftAccounts = invitationData.giftAccounts || [];
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "Berhasil disalin!", description: "Nomor rekening telah disalin." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div 
      className="py-16 px-4 max-w-2xl mx-auto text-center"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        padding: style.padding || "80px 20px",
      } as React.CSSProperties}
    >
      <div className="mb-10">
        <Gift className="w-10 h-10 mx-auto mb-4 opacity-30" />
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: globalSettings.fontHeading }}
        >
          {heading}
        </h2>
        {subHeading && <p className="text-sm opacity-70">{subHeading}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {giftAccounts.map((acc) => (
          <div key={acc.id} className="p-6 rounded-2xl border border-current/10 bg-current/5 flex flex-col items-center">
            <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-2">
              {acc.type === 'bank' ? acc.bankName : acc.walletName}
            </p>
            <p className="text-xl font-bold mb-1 tracking-wider">
              {acc.type === 'bank' ? acc.accountNumber : acc.walletNumber}
            </p>
            <p className="text-sm opacity-70 mb-4">a.n. {acc.accountHolder}</p>
            
            <button 
              onClick={() => copyToClipboard(acc.type === 'bank' ? acc.accountNumber : acc.walletNumber, acc.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-current/10 hover:bg-current/20 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              {copiedId === acc.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedId === acc.id ? "Berhasil Disalin" : "Salin Rekening"}
            </button>
          </div>
        ))}
        {giftAccounts.length === 0 && (
          <div className="col-span-full py-12 border-2 border-dashed border-current/10 rounded-xl opacity-40 italic text-sm">
            Detail hadiah akan segera diupdate
          </div>
        )}
      </div>
    </div>
  );
}
