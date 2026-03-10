import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Wand2, Loader2, Check } from "lucide-react";

interface AICopyAssistantProps {
  groomName: string;
  brideName: string;
  onSelect: (text: string) => void;
}

export function AICopyAssistant({ groomName, brideName, onSelect }: AICopyAssistantProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("opening_text");
  const [tone, setTone] = useState("formal");
  const [language, setLanguage] = useState("id");
  const [length, setLength] = useState("medium");
  const [generatedText, setGeneratedText] = useState("");

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        type,
        groomName,
        brideName,
        tone,
        language,
        length,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedText(data.text);
    },
    onError: (err: any) => {
      toast({
        title: "Gagal generate text",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    toast({ title: "Teks disalin!" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-ai-assistant">
          <Wand2 className="w-4 h-4 text-primary" />
          AI Bantu Tulis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Bantu Tulis
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Template-Based Generator — Cepat dan praktis untuk undanganmu.
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipe Konten</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opening_text">Teks Pembuka</SelectItem>
                  <SelectItem value="quote">Kutipan / Kata Mutiara</SelectItem>
                  <SelectItem value="love_story">Cerita Cinta</SelectItem>
                  <SelectItem value="closing_message">Teks Penutup</SelectItem>
                  <SelectItem value="hashtag">Hashtag</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tone / Gaya</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Santai</SelectItem>
                  <SelectItem value="romantic">Romantis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full gap-2"
            data-testid="button-generate-ai"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Generate Teks
          </Button>

          {generatedText && (
            <div className="space-y-2">
              <Label>Hasil Generate</Label>
              <Textarea
                value={generatedText}
                readOnly
                className="min-h-[120px] resize-none"
                data-testid="text-ai-result"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={handleCopy}
                >
                  <Copy className="w-4 h-4" />
                  Salin
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => {
                    onSelect(generatedText);
                    setOpen(false);
                  }}
                >
                  <Check className="w-4 h-4" />
                  Gunakan
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
