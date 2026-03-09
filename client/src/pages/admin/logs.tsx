import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { AuditLog } from "@shared/schema";
import { Search, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuditLogWithAdmin = AuditLog & {
  admin?: {
    username: string;
  };
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery<AuditLogWithAdmin[]>({
    queryKey: ["/api/admin/audit-logs"],
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase()) ||
      log.admin?.username.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return <Badge className="bg-green-500 hover:bg-green-600 border-none no-default-hover-elevate no-default-active-elevate">Create</Badge>;
      case "update":
        return <Badge className="bg-blue-500 hover:bg-blue-600 border-none no-default-hover-elevate no-default-active-elevate">Update</Badge>;
      case "delete":
        return <Badge className="bg-red-500 hover:bg-red-600 border-none no-default-hover-elevate no-default-active-elevate">Delete</Badge>;
      case "publish":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none no-default-hover-elevate no-default-active-elevate">Publish</Badge>;
      case "login":
        return <Badge className="bg-gray-500 hover:bg-gray-600 border-none no-default-hover-elevate no-default-active-elevate">Login</Badge>;
      default:
        return <Badge variant="outline" className="no-default-hover-elevate no-default-active-elevate">{action}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          Pantau semua aktivitas admin di platform ini.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari deskripsi, entitas, atau admin..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-logs"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-action-filter">
                  <SelectValue placeholder="Semua Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Tanggal</TableHead>
                  <TableHead className="w-[120px]">Admin</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                  <TableHead className="w-[150px]">Entitas</TableHead>
                  <TableHead>Deskripsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLogs && filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.createdAt ? format(new Date(log.createdAt), "dd MMM yyyy, HH:mm") : "-"}
                      </TableCell>
                      <TableCell>{log.admin?.username || "System"}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{log.entity}</span>
                          <span className="text-[10px] font-mono truncate max-w-[120px]" title={log.entityId}>{log.entityId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs md:max-w-md lg:max-w-xl truncate" title={log.description}>
                        {log.description}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <History className="h-8 w-8 opacity-20" />
                        <p>Belum ada aktivitas tercatat</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
