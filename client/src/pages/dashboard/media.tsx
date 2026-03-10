import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Upload, 
  Trash2, 
  Music, 
  Image as ImageIcon, 
  Copy, 
  Loader2, 
  Search, 
  FileAudio,
  FileImage,
  MoreVertical,
  Download,
  CheckCircle2,
  XCircle,
  Database
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MediaAsset } from "@shared/schema";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function MediaLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "image" | "audio">("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: assets, isLoading } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal mengupload file");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Berhasil", description: "File berhasil diupload" });
    },
    onError: (err: any) => {
      toast({ 
        title: "Gagal upload", 
        description: err.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Berhasil", description: "File berhasil dihapus" });
    },
    onError: (err: any) => {
      toast({ 
        title: "Gagal menghapus", 
        description: err.message, 
        variant: "destructive" 
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    e.target.value = ""; // Reset
  };

  const copyUrl = (url: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: "Disalin!", description: "URL file berhasil disalin ke clipboard" });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredAssets = assets?.filter(asset => {
    const matchesFilter = filter === "all" || asset.mediaType === filter;
    const matchesSearch = asset.originalName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground">Kelola aset gambar dan musik untuk undanganmu</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="media-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,audio/*"
          />
          <Button 
            className="gap-2" 
            onClick={() => document.getElementById("media-upload")?.click()}
            disabled={uploadMutation.isPending}
            data-testid="button-upload-media"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload File
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Filter & Cari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari file..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-media"
              />
            </div>
            <div className="space-y-1">
              <Button
                variant={filter === "all" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setFilter("all")}
                data-testid="filter-media-all"
              >
                <Database className="w-4 h-4" />
                Semua File
              </Button>
              <Button
                variant={filter === "image" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setFilter("image")}
                data-testid="filter-media-image"
              >
                <ImageIcon className="w-4 h-4" />
                Gambar
              </Button>
              <Button
                variant={filter === "audio" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setFilter("audio")}
                data-testid="filter-media-audio"
              >
                <Music className="w-4 h-4" />
                Musik
              </Button>
            </div>

            {assets && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">Penyimpanan Digunakan</p>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">
                    {formatSize(assets.reduce((acc, curr) => acc + curr.size, 0))}
                  </span>
                  <span className="text-xs text-muted-foreground">{assets.length} file</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : filteredAssets?.length === 0 ? (
            <Card className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Belum ada file</h3>
              <p className="text-sm text-muted-foreground max-w-xs px-4">
                {search ? "Tidak ada file yang sesuai dengan pencarianmu." : "Upload gambar atau musik untuk mulai membangun undanganmu."}
              </p>
              {search && (
                <Button variant="ghost" onClick={() => setSearch("")} className="mt-2 text-primary underline">
                  Hapus pencarian
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets?.map((asset) => (
                <Card key={asset.id} className="group relative overflow-hidden border-card-border hover-elevate" data-testid={`media-card-${asset.id}`}>
                  <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
                    {asset.mediaType === "image" ? (
                      <img
                        src={asset.url}
                        alt={asset.originalName}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Music className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate w-full px-2">
                          {asset.mimeType.split('/')[1]}
                        </p>
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="secondary" className="w-7 h-7 bg-white/90 backdrop-blur shadow-sm">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyUrl(asset.url)} className="gap-2">
                            <Copy className="w-4 h-4" /> Salin URL
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={asset.url} download={asset.originalName} className="gap-2">
                              <Download className="w-4 h-4" /> Download
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(asset.id)}
                            className="text-destructive gap-2"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="p-2 border-t bg-card">
                    <p className="text-xs font-medium truncate mb-0.5" title={asset.originalName}>
                      {asset.originalName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{formatSize(asset.size)}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 uppercase font-bold">
                        {asset.mediaType}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
