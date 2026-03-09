import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User, Shield, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

export default function AccountSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({ fullName: user?.fullName || "", email: user?.email || "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiRequest("PATCH", `/api/users/me`, profileData);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profil diperbarui!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Password tidak cocok", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      await apiRequest("PATCH", `/api/users/me/password`, passwordData);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password berhasil diubah!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan Akun</h1>
        <p className="text-sm text-muted-foreground">Kelola profil dan keamanan akun</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {(user?.fullName || user?.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{user?.fullName || user?.username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1">
                {user?.plan === "premium" && <Crown className="w-3 h-3 text-amber-500" />}
                <Badge variant="secondary" className="text-xs capitalize">{user?.plan || "free"}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={e => setProfileData(p => ({ ...p, fullName: e.target.value }))}
                data-testid="input-full-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={user?.username || ""} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Username tidak dapat diubah</p>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="gap-2" data-testid="button-save-profile">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Profil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Ubah Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password Saat Ini</Label>
            <Input
              type="password"
              value={passwordData.currentPassword}
              onChange={e => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
              data-testid="input-current-password"
            />
          </div>
          <div className="space-y-2">
            <Label>Password Baru</Label>
            <Input
              type="password"
              value={passwordData.newPassword}
              onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="••••••••"
              data-testid="input-new-password"
            />
          </div>
          <div className="space-y-2">
            <Label>Konfirmasi Password Baru</Label>
            <Input
              type="password"
              value={passwordData.confirmPassword}
              onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              data-testid="input-confirm-password"
            />
          </div>
          <Button onClick={savePassword} disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword} className="gap-2" data-testid="button-save-password">
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Ubah Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
