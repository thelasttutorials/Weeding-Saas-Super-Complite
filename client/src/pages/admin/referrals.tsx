import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Users, UserPlus } from "lucide-react";

interface ReferralUsage {
  id: string;
  referrerId: string;
  refereeId: string;
  createdAt: string;
  referrerUsername: string;
  refereeUsername: string;
}

export default function AdminReferrals() {
  const { data: referrals, isLoading } = useQuery<ReferralUsage[]>({
    queryKey: ["/api/admin/referrals"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Referral</h1>
        <p className="text-muted-foreground">Lihat riwayat pendaftaran melalui kode referral.</p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Referrer (Pengajak)</TableHead>
              <TableHead>Referee (Pendaftar)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center">Memuat...</TableCell></TableRow>
            ) : referrals?.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center">Belum ada data referral.</TableCell></TableRow>
            ) : referrals?.map((ref) => (
              <TableRow key={ref.id} data-testid={`referral-row-${ref.id}`}>
                <TableCell>{format(new Date(ref.createdAt), "d MMMM yyyy HH:mm", { locale: localeId })}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">@{ref.referrerUsername}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <span className="font-medium">@{ref.refereeUsername}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
