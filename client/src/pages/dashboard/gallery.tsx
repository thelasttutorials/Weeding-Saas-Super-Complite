import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Images, Plus, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invitation, GalleryImage } from "@shared/schema";

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedInvId, setSelectedInvId] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({ imageUrl: "", caption: "" });

  const { data: invitations } = useQuery<Invitation[]>({ queryKey: ["/api/invitations"] });
  const currentInvId = selectedInvId || invitations?.[0]?.id || "";

  const { data: gallery, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/invitations", currentInvId, "gallery"],
    enabled: !!currentInvId,
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/invitations/${currentInvId}/gallery`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", currentInvId, "gallery"] });
      setAddOpen(false);
      setFormData({ imageUrl: "", caption: "" });
      toast({ title: "Foto ditambahkan!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => apiRequest("DELETE", `/api/invitations/${currentInvId}/gallery/${imageId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", currentInvId, "gallery"] });
      toast({ title: "Foto dihapus" });
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Galeri Foto</h1>
          <p className="text-sm text-muted-foreground">Tambah foto-foto indah untuk undangan pernikahanmu</p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)} disabled={!currentInvId} data-testid="button-add-photo">
          <Plus className="w-4 h-4" />
          Tambah Foto
        </Button>
      </div>

      {invitations && invitations.length > 1 && (
        <Select value={currentInvId} onValueChange={setSelectedInvId}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Pilih undangan" />
          </SelectTrigger>
          <SelectContent>
            {invitations.map(inv => (
              <SelectItem key={inv.id} value={inv.id}>{inv.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!currentInvId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><p>Belum ada undangan</p></CardContent></Card>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : !gallery || gallery.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Images className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground mb-2">Belum ada foto</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Tambahkan foto-foto kenangan dengan memasukkan URL gambar dari Google Drive, Dropbox, atau layanan penyimpanan lainnya.
            </p>
            <Button onClick={() => setAddOpen(true)} data-testid="button-add-first-photo">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Foto Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gallery.map((img) => (
            <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-card-border bg-muted" data-testid={`gallery-image-${img.id}`}>
              <img
                src={img.imageUrl}
                alt={img.caption || "Gallery photo"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Error";
                }}
              />
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">{img.caption}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="destructive"
                  className="w-8 h-8"
                  onClick={() => deleteMutation.mutate(img.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-photo-${img.id}`}
                >
                  {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {gallery && gallery.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">{gallery.length} foto dalam galeri</p>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL Foto</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={formData.imageUrl}
                  onChange={e => setFormData(p => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                  className="pl-9"
                  data-testid="input-photo-url"
                />
              </div>
              <p className="text-xs text-muted-foreground">Masukkan URL langsung ke file gambar (JPG, PNG, WebP)</p>
            </div>
            <div className="space-y-2">
              <Label>Keterangan (Opsional)</Label>
              <Input
                value={formData.caption}
                onChange={e => setFormData(p => ({ ...p, caption: e.target.value }))}
                placeholder="Momen indah bersama..."
                data-testid="input-photo-caption"
              />
            </div>
            {formData.imageUrl && (
              <div className="rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=URL+Tidak+Valid";
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !formData.imageUrl}
              data-testid="button-submit-photo"
            >
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tambah Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
