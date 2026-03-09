import { useState, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, Save, Eye, GripVertical, Trash2, Copy,
  Plus, Palette, Blocks, ChevronRight, Loader2, Check,
  EyeOff, Settings2, X,
} from "lucide-react";
import { Link } from "wouter";
import { BLOCK_DEFINITIONS, GLOBAL_SETTINGS_DEFAULTS, getBlockDefinition, type BlockType } from "@/lib/theme-blocks";
import type { WeddingTheme, WeddingThemeBlock } from "@shared/schema";

// ─── Sortable Block Card ───────────────────────────────────────────────────────

function SortableBlockCard({
  block,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onToggleVisibility,
}: {
  block: WeddingThemeBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const def = getBlockDefinition(block.blockType as BlockType);
  const Icon = def.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative rounded-xl border transition-all duration-150 bg-white cursor-pointer select-none
        ${isDragging ? "opacity-50 shadow-xl scale-[1.02] z-50" : ""}
        ${isSelected ? "border-primary/50 shadow-sm ring-2 ring-primary/20" : "border-border hover:border-border/80 hover:shadow-sm"}
        ${!block.isVisible ? "opacity-50" : ""}
      `}
      onClick={onSelect}
      data-testid={`block-card-${block.id}`}
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0 touch-none"
          onClick={e => e.stopPropagation()}
          data-testid={`block-drag-handle-${block.id}`}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Icon + Name */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
            <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>{def.label}</p>
            <p className="text-xs text-muted-foreground truncate">{def.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onToggleVisibility}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={block.isVisible ? "Sembunyikan" : "Tampilkan"}
            data-testid={`block-toggle-visible-${block.id}`}
          >
            {block.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDuplicate}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Duplikasi"
            data-testid={`block-duplicate-${block.id}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Hapus"
            data-testid={`block-delete-${block.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Selected indicator */}
        {isSelected && <ChevronRight className="w-4 h-4 text-primary shrink-0" />}
      </div>
    </div>
  );
}

// ─── Block Inspector Forms ────────────────────────────────────────────────────

function ContentField({ label, name, value, onChange, multiline = false, type = "text" }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      {multiline ? (
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="text-sm min-h-[80px] resize-none"
          data-testid={`inspector-field-${name}`}
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="text-sm h-9"
          data-testid={`inspector-field-${name}`}
        />
      )}
    </div>
  );
}

function ColorField({ label, name, value, onChange }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#ffffff"}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-border"
          data-testid={`inspector-color-${name}`}
        />
        <Input
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          className="text-xs h-7 w-24 font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function BlockInspector({ block, onUpdate }: { block: WeddingThemeBlock; onUpdate: (updates: Partial<WeddingThemeBlock>) => void }) {
  const content = JSON.parse(block.content || "{}");
  const style = JSON.parse(block.style || "{}");

  const updateContent = (key: string, value: any) => {
    onUpdate({ content: JSON.stringify({ ...content, [key]: value }) });
  };
  const updateStyle = (key: string, value: any) => {
    onUpdate({ style: JSON.stringify({ ...style, [key]: value }) });
  };

  const renderContentFields = () => {
    switch (block.blockType) {
      case "cover":
        return (
          <div className="space-y-3">
            <ContentField label="Pembuka" name="openingText" value={content.openingText || ""} onChange={v => updateContent("openingText", v)} />
            <ContentField label="Nama Pengantin Pria" name="groomName" value={content.groomName || ""} onChange={v => updateContent("groomName", v)} />
            <ContentField label="Nama Pengantin Wanita" name="brideName" value={content.brideName || ""} onChange={v => updateContent("brideName", v)} />
            <ContentField label="Tanggal Pernikahan" name="weddingDate" value={content.weddingDate || ""} onChange={v => updateContent("weddingDate", v)} />
            <ContentField label="Teks Pendukung" name="subText" value={content.subText || ""} onChange={v => updateContent("subText", v)} multiline />
            <ContentField label="Teks Tombol" name="buttonText" value={content.buttonText || ""} onChange={v => updateContent("buttonText", v)} />
            <ContentField label="URL Background Image" name="backgroundImage" value={content.backgroundImage || ""} onChange={v => updateContent("backgroundImage", v)} />
          </div>
        );
      case "couple":
        return (
          <div className="space-y-3">
            <ContentField label="Heading" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <ContentField label="Nama Pengantin Pria" name="groomName" value={content.groomName || ""} onChange={v => updateContent("groomName", v)} />
            <ContentField label="Nama Orang Tua Pria" name="groomParents" value={content.groomParents || ""} onChange={v => updateContent("groomParents", v)} multiline />
            <ContentField label="URL Foto Pengantin Pria" name="groomPhoto" value={content.groomPhoto || ""} onChange={v => updateContent("groomPhoto", v)} />
            <ContentField label="Nama Pengantin Wanita" name="brideName" value={content.brideName || ""} onChange={v => updateContent("brideName", v)} />
            <ContentField label="Nama Orang Tua Wanita" name="brideParents" value={content.brideParents || ""} onChange={v => updateContent("brideParents", v)} multiline />
            <ContentField label="URL Foto Pengantin Wanita" name="bridePhoto" value={content.bridePhoto || ""} onChange={v => updateContent("bridePhoto", v)} />
          </div>
        );
      case "quote":
        return (
          <div className="space-y-3">
            <ContentField label="Teks Kutipan" name="quoteText" value={content.quoteText || ""} onChange={v => updateContent("quoteText", v)} multiline />
            <ContentField label="Sumber Kutipan" name="quoteSource" value={content.quoteSource || ""} onChange={v => updateContent("quoteSource", v)} />
          </div>
        );
      case "countdown":
        return (
          <div className="space-y-3">
            <ContentField label="Heading" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <ContentField label="Sub Heading" name="subHeading" value={content.subHeading || ""} onChange={v => updateContent("subHeading", v)} />
            <ContentField label="Target Tanggal (ISO)" name="targetDate" value={content.targetDate || ""} type="datetime-local" onChange={v => updateContent("targetDate", v)} />
          </div>
        );
      case "events":
        return (
          <div className="space-y-3">
            <ContentField label="Heading" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">Akad Nikah</p>
            <ContentField label="Tanggal Akad" name="akadDate" value={content.akadDate || ""} onChange={v => updateContent("akadDate", v)} />
            <ContentField label="Waktu Akad" name="akadTime" value={content.akadTime || ""} onChange={v => updateContent("akadTime", v)} />
            <ContentField label="Venue Akad" name="akadVenue" value={content.akadVenue || ""} onChange={v => updateContent("akadVenue", v)} />
            <ContentField label="Alamat Akad" name="akadAddress" value={content.akadAddress || ""} onChange={v => updateContent("akadAddress", v)} multiline />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">Resepsi</p>
            <ContentField label="Tanggal Resepsi" name="receptionDate" value={content.receptionDate || ""} onChange={v => updateContent("receptionDate", v)} />
            <ContentField label="Waktu Resepsi" name="receptionTime" value={content.receptionTime || ""} onChange={v => updateContent("receptionTime", v)} />
            <ContentField label="Venue Resepsi" name="receptionVenue" value={content.receptionVenue || ""} onChange={v => updateContent("receptionVenue", v)} />
            <ContentField label="Alamat Resepsi" name="receptionAddress" value={content.receptionAddress || ""} onChange={v => updateContent("receptionAddress", v)} multiline />
          </div>
        );
      case "closing":
        return (
          <div className="space-y-3">
            <ContentField label="Heading" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <ContentField label="Pesan Penutup" name="message" value={content.message || ""} onChange={v => updateContent("message", v)} multiline />
            <ContentField label="Nama Pengantin Pria" name="groomName" value={content.groomName || ""} onChange={v => updateContent("groomName", v)} />
            <ContentField label="Nama Pengantin Wanita" name="brideName" value={content.brideName || ""} onChange={v => updateContent("brideName", v)} />
            <ContentField label="Hashtag" name="hashtag" value={content.hashtag || ""} onChange={v => updateContent("hashtag", v)} />
          </div>
        );
      case "text":
        return (
          <div className="space-y-3">
            <ContentField label="Heading (opsional)" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <ContentField label="Teks" name="body" value={content.body || ""} onChange={v => updateContent("body", v)} multiline />
          </div>
        );
      case "rsvp":
        return (
          <div className="space-y-3">
            <ContentField label="Heading" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <ContentField label="Sub Heading" name="subHeading" value={content.subHeading || ""} onChange={v => updateContent("subHeading", v)} multiline />
          </div>
        );
      case "messages":
        return (
          <div className="space-y-3">
            <ContentField label="Heading" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <ContentField label="Sub Heading" name="subHeading" value={content.subHeading || ""} onChange={v => updateContent("subHeading", v)} multiline />
          </div>
        );
      case "gifts":
        return (
          <div className="space-y-3">
            <ContentField label="Heading" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <ContentField label="Sub Heading" name="subHeading" value={content.subHeading || ""} onChange={v => updateContent("subHeading", v)} multiline />
          </div>
        );
      case "story":
        return (
          <div className="space-y-3">
            <ContentField label="Heading" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <ContentField label="Sub Heading" name="subHeading" value={content.subHeading || ""} onChange={v => updateContent("subHeading", v)} multiline />
            <p className="text-xs text-muted-foreground">Kisah cinta akan diambil dari data undangan pengguna.</p>
          </div>
        );
      case "gallery":
        return (
          <div className="space-y-3">
            <ContentField label="Heading" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <ContentField label="Sub Heading" name="subHeading" value={content.subHeading || ""} onChange={v => updateContent("subHeading", v)} multiline />
            <p className="text-xs text-muted-foreground">Foto akan diambil dari galeri undangan pengguna.</p>
          </div>
        );
      case "maps":
        return (
          <div className="space-y-3">
            <ContentField label="Heading" name="heading" value={content.heading || ""} onChange={v => updateContent("heading", v)} />
            <p className="text-xs text-muted-foreground">Link maps akan diambil dari data acara undangan pengguna.</p>
          </div>
        );
      case "divider":
        return (
          <div className="space-y-3">
            <ContentField label="Teks / Simbol" name="text" value={content.text || "♦"} onChange={v => updateContent("text", v)} />
          </div>
        );
      default:
        return <p className="text-sm text-muted-foreground text-center py-4">Tidak ada pengaturan konten untuk block ini.</p>;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            {(() => { const Icon = getBlockDefinition(block.blockType as BlockType).icon; return <Icon className="w-4 h-4 text-primary" />; })()}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{getBlockDefinition(block.blockType as BlockType).label}</p>
            <p className="text-xs text-muted-foreground">Inspector</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="content">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="content" className="flex-1 text-xs">Konten</TabsTrigger>
            <TabsTrigger value="style" className="flex-1 text-xs">Tampilan</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="mt-0 space-y-3">
            {renderContentFields()}
          </TabsContent>
          <TabsContent value="style" className="mt-0 space-y-4">
            <ColorField label="Background" name="backgroundColor" value={style.backgroundColor || ""} onChange={v => updateStyle("backgroundColor", v)} />
            <ColorField label="Warna Teks" name="textColor" value={style.textColor || ""} onChange={v => updateStyle("textColor", v)} />
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alignment</Label>
              <div className="flex gap-1">
                {["left", "center", "right"].map(a => (
                  <button
                    key={a}
                    onClick={() => updateStyle("textAlign", a)}
                    className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${style.textAlign === a ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}
                    data-testid={`inspector-align-${a}`}
                  >
                    {a === "left" ? "Kiri" : a === "center" ? "Tengah" : "Kanan"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Padding (px)</Label>
              <Input
                value={(style.padding || "").replace(/px/g, "").split(" ")[0] || "60"}
                onChange={e => updateStyle("padding", `${e.target.value}px 20px`)}
                type="number"
                className="text-sm h-9"
                data-testid="inspector-padding"
              />
            </div>
            <ContentField label="URL Background Image" name="bgImage" value={style.backgroundImage || ""} onChange={v => updateStyle("backgroundImage", v)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Global Settings Panel ────────────────────────────────────────────────────

function GlobalSettingsPanel({ globalSettings, onUpdate }: { globalSettings: string; onUpdate: (gs: string) => void }) {
  const settings = { ...GLOBAL_SETTINGS_DEFAULTS, ...JSON.parse(globalSettings || "{}") };

  const update = (key: string, value: string) => {
    onUpdate(JSON.stringify({ ...settings, [key]: value }));
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto flex-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warna</p>
      <div className="space-y-3">
        <ColorField label="Warna Utama" name="primaryColor" value={settings.primaryColor} onChange={v => update("primaryColor", v)} />
        <ColorField label="Warna Sekunder" name="secondaryColor" value={settings.secondaryColor} onChange={v => update("secondaryColor", v)} />
        <ColorField label="Warna Aksen" name="accentColor" value={settings.accentColor} onChange={v => update("accentColor", v)} />
        <ColorField label="Background" name="bgColor" value={settings.bgColor} onChange={v => update("bgColor", v)} />
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Tipografi</p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Font Heading</Label>
          <select
            value={settings.fontHeading}
            onChange={e => update("fontHeading", e.target.value)}
            className="w-full h-9 text-sm rounded-md border border-input bg-background px-3"
            data-testid="settings-font-heading"
          >
            {["Playfair Display", "Lora", "Georgia", "Times New Roman", "Inter", "Cormorant Garamond"].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Font Body</Label>
          <select
            value={settings.fontBody}
            onChange={e => update("fontBody", e.target.value)}
            className="w-full h-9 text-sm rounded-md border border-input bg-background px-3"
            data-testid="settings-font-body"
          >
            {["Inter", "Lato", "Open Sans", "Roboto", "Nunito", "Source Sans 3"].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Spacing</p>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Section Spacing (px)</Label>
        <Input
          value={settings.sectionSpacing}
          onChange={e => update("sectionSpacing", e.target.value)}
          type="number"
          className="text-sm h-9"
          data-testid="settings-spacing"
        />
      </div>
    </div>
  );
}

// ─── Main Theme Builder ───────────────────────────────────────────────────────

export default function ThemeBuilder() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [blocks, setBlocks] = useState<WeddingThemeBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [leftTab, setLeftTab] = useState<"blocks" | "settings">("blocks");
  const [globalSettings, setGlobalSettings] = useState("{}");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data: theme, isLoading } = useQuery<WeddingTheme & { blocks: WeddingThemeBlock[] }>({
    queryKey: ["/api/admin/themes", id],
    queryFn: () => fetch(`/api/admin/themes/${id}`, { credentials: "include" }).then(r => r.json()),
  });

  useEffect(() => {
    if (theme) {
      setBlocks(theme.blocks || []);
      setGlobalSettings(theme.globalSettings || "{}");
    }
  }, [theme]);

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/admin/themes/${id}`, { globalSettings });
      await apiRequest("POST", `/api/admin/themes/${id}/blocks/reorder`, {
        blockIds: blocks.map(b => b.id),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      setIsDirty(false);
      toast({ title: "Tersimpan!", description: "Tema berhasil disimpan." });
    },
    onError: () => toast({ title: "Gagal simpan", variant: "destructive" }),
  });

  const addBlockMutation = useMutation({
    mutationFn: async (blockType: BlockType) => {
      const def = getBlockDefinition(blockType);
      const resp = await apiRequest("POST", `/api/admin/themes/${id}/blocks`, {
        blockType,
        content: JSON.stringify(def.defaultContent),
        style: JSON.stringify(def.defaultStyle),
        isVisible: true,
      });
      return resp.json();
    },
    onSuccess: (newBlock: WeddingThemeBlock) => {
      setBlocks(prev => [...prev, newBlock]);
      setSelectedId(newBlock.id);
      setIsDirty(true);
    },
    onError: () => toast({ title: "Gagal menambah block", variant: "destructive" }),
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ blockId, updates }: { blockId: string; updates: Partial<WeddingThemeBlock> }) => {
      const resp = await apiRequest("PATCH", `/api/admin/themes/${id}/blocks/${blockId}`, updates);
      return resp.json();
    },
    onSuccess: (updated: WeddingThemeBlock) => {
      setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      await apiRequest("DELETE", `/api/admin/themes/${id}/blocks/${blockId}`, {});
    },
    onSuccess: (_, blockId) => {
      setBlocks(prev => prev.filter(b => b.id !== blockId));
      if (selectedId === blockId) setSelectedId(null);
      setIsDirty(true);
    },
  });

  const duplicateBlockMutation = useMutation({
    mutationFn: async (block: WeddingThemeBlock) => {
      const resp = await apiRequest("POST", `/api/admin/themes/${id}/blocks`, {
        blockType: block.blockType,
        content: block.content,
        style: block.style,
        isVisible: block.isVisible,
      });
      return resp.json();
    },
    onSuccess: (newBlock: WeddingThemeBlock) => {
      setBlocks(prev => {
        const idx = prev.findIndex(b => b.id === newBlock.id);
        if (idx >= 0) return prev;
        return [...prev, newBlock];
      });
      setIsDirty(true);
    },
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks(items => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setIsDirty(true);
    }
  }, []);

  const handleBlockUpdate = useCallback((blockId: string, updates: Partial<WeddingThemeBlock>) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...updates } : b));
    updateBlockMutation.mutate({ blockId, updates });
    setIsDirty(true);
  }, [updateBlockMutation]);

  const handleGlobalSettingsUpdate = (gs: string) => {
    setGlobalSettings(gs);
    setIsDirty(true);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!theme) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-lg font-semibold mb-2">Tema tidak ditemukan</p>
        <Link href="/admin/themes"><Button variant="outline">Kembali</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-muted/20 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4 gap-4 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/themes">
            <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" data-testid="button-back-to-themes">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="h-5 w-px bg-border" />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{theme.name}</p>
            <div className="flex items-center gap-1.5">
              <Badge
                variant={theme.status === "published" ? "default" : "outline"}
                className={`text-[10px] h-4 px-1.5 ${theme.status === "published" ? "bg-emerald-600 hover:bg-emerald-600 border-0 text-white" : ""}`}
              >
                {theme.status === "published" ? "Published" : theme.status === "archived" ? "Arsip" : "Draft"}
              </Badge>
              {isDirty && <span className="text-[10px] text-amber-600 font-medium">● Belum disimpan</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">{blocks.length} blok</span>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={() => window.open(`/invite-preview/${id}`, "_blank")}
            data-testid="button-preview-theme"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs h-8 shadow-sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !isDirty}
            data-testid="button-save-theme"
          >
            {saveMutation.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : isDirty ? <Save className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            {saveMutation.isPending ? "Menyimpan..." : isDirty ? "Simpan" : "Tersimpan"}
          </Button>
        </div>
      </header>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL — Block Library + Settings */}
        <div className="w-64 xl:w-72 bg-background border-r border-border flex flex-col shrink-0 overflow-hidden">
          <Tabs value={leftTab} onValueChange={v => setLeftTab(v as "blocks" | "settings")}>
            <TabsList className="w-full rounded-none border-b h-10 bg-background gap-0 p-0">
              <TabsTrigger value="blocks" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs gap-1.5 h-10">
                <Blocks className="w-3.5 h-3.5" />Blok
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs gap-1.5 h-10">
                <Settings2 className="w-3.5 h-3.5" />Tema
              </TabsTrigger>
            </TabsList>

            <TabsContent value="blocks" className="mt-0 flex-1 overflow-y-auto p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Library Blok</p>
              <div className="grid grid-cols-2 gap-1.5">
                {BLOCK_DEFINITIONS.map(def => {
                  const Icon = def.icon;
                  return (
                    <button
                      key={def.type}
                      onClick={() => addBlockMutation.mutate(def.type)}
                      disabled={addBlockMutation.isPending}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                      data-testid={`add-block-${def.type}`}
                      title={def.description}
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-[10px] font-medium text-foreground/70 text-center leading-tight">{def.label}</span>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 96px)" }}>
              <GlobalSettingsPanel
                globalSettings={globalSettings}
                onUpdate={handleGlobalSettingsUpdate}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* CENTER PANEL — Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Blocks className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5">Canvas Kosong</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-5">
                  Mulai dengan menambahkan blok dari library di sisi kiri.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLeftTab("blocks")}
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Blok Pertama
                </Button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 max-w-xl mx-auto">
                    {blocks.map(block => (
                      <SortableBlockCard
                        key={block.id}
                        block={block}
                        isSelected={selectedId === block.id}
                        onSelect={() => setSelectedId(selectedId === block.id ? null : block.id)}
                        onDelete={() => deleteBlockMutation.mutate(block.id)}
                        onDuplicate={() => duplicateBlockMutation.mutate(block)}
                        onToggleVisibility={() => handleBlockUpdate(block.id, { isVisible: !block.isVisible })}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Add block shortcut */}
            {blocks.length > 0 && (
              <div className="max-w-xl mx-auto mt-3">
                <button
                  onClick={() => setLeftTab("blocks")}
                  className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/3 transition-all flex items-center justify-center gap-2"
                  data-testid="button-add-block-shortcut"
                >
                  <Plus className="w-4 h-4" />
                  Tambah blok baru
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Inspector */}
        <div className="w-72 xl:w-80 bg-background border-l border-border flex flex-col overflow-hidden shrink-0">
          {selectedBlock ? (
            <>
              <div className="absolute top-0 right-0 p-1 hidden xl:block">
              </div>
              <BlockInspector
                block={selectedBlock}
                onUpdate={updates => handleBlockUpdate(selectedBlock.id, updates)}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Palette className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground mb-1">Pilih Blok</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Klik blok di canvas untuk mengedit konten dan tampilannya.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
