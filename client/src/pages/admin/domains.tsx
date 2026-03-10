import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Globe, Edit2, ExternalLink } from "lucide-react";

interface CustomDomain {
  id: string;
  userId: string;
  username: string;
  domain: string;
  status: "pending" | "active" | "failed";
  adminNotes: string | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  active: "default",
  failed: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  active: "Aktif",
  failed: "Gagal",
};

export default function AdminDomains() {
  const { toast } = useToast();
  const [selectedDomain, setSelectedDomain] = useState<CustomDomain | null>(null);
  const [status, setStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { data: domains, isLoading } = useQuery<CustomDomain[]>({
    queryKey: ["/api/admin/domains"],
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status: string; adminNotes: string }) => 
      apiRequest("PATCH", `/api/admin/domains/${selectedDomain?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/domains"] });
      toast({ title: "Sukses", description: "Status domain berhasil diperbarui" });
      setSelectedDomain(null);
    },
  });

  const handleEdit = (domain: CustomDomain) => {
    setSelectedDomain(domain);
    setStatus(domain.status);
    setNotes(domain.adminNotes || "");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Custom Domain</h1>
        <p className="text-muted-foreground">Kelola permintaan custom domain dari pengguna.</p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catatan Admin</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Memuat...</TableCell></TableRow>
            ) : domains?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">Belum ada permintaan domain.</TableCell></TableRow>
            ) : domains?.map((d) => (
              <TableRow key={d.id} data-testid={`domain-row-${d.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium">{d.domain}</span>
                    <a href={`http://${d.domain}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  </div>
                </TableCell>
                <TableCell>@{d.username}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[d.status]}>
                    {STATUS_LABEL[d.status]}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                  {d.adminNotes || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(d)} data-testid={`button-edit-domain-${d.id}`}>
                    <Edit2 className="h-4 w-4 mr-2" /> Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedDomain} onOpenChange={(open) => !open && setSelectedDomain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Domain: {selectedDomain?.domain}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-domain-status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catatan Admin</Label>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Petunjuk setup atau alasan kegagalan..."
                data-testid="textarea-admin-notes"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => updateMutation.mutate({ status, adminNotes: notes })}
              disabled={updateMutation.isPending}
              data-testid="button-save-domain"
            >
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
