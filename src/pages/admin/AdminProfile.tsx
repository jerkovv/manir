import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Crown, Shield, Pencil, Eye, KeyRound } from "lucide-react";

const ROLE_ICON: Record<string, any> = { owner: Crown, admin: Shield, editor: Pencil, viewer: Eye };

const AdminProfile = () => {
  const { appUser, user, signOut } = useAuth();
  const [fullName, setFullName] = useState(appUser?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(appUser?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  if (!appUser || !user) return null;

  const RoleIcon = ROLE_ICON[appUser.role] || Eye;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_users" as any)
      .update({ full_name: fullName.trim() || null, avatar_url: avatarUrl.trim() || null })
      .eq("id", appUser.id);
    setSaving(false);
    if (error) toast.error("Greška: " + error.message);
    else toast.success("Profil sačuvan. Osvežite stranicu da vidite promene.");
  };

  const sendResetLink = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
      redirectTo: `${window.location.origin}/admin/login`,
    });
    if (error) toast.error("Greška: " + error.message);
    else toast.success("Email za promenu lozinke poslat na " + user.email);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-4xl text-foreground mb-1">Moj profil</h1>
      <p className="font-body text-sm text-muted-foreground mb-8">Upravljajte svojim podacima</p>

      <div className="bg-white border border-border p-6 mb-5">
        <div className="flex items-center gap-5 mb-6">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border border-border" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#F5F0E8] flex items-center justify-center font-heading text-2xl">
              {(fullName || user.email || "??").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <RoleIcon size={14} />
              <span className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground">{appUser.role}</span>
            </div>
            <div className="font-body text-sm text-muted-foreground">
              Status: <span className="text-foreground">{appUser.status}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Ime i prezime</label>
            <input
              type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="block font-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Avatar URL (opciono)</label>
            <input
              type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="block font-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Email</label>
            <input
              type="email" value={user.email || ""} disabled
              className="w-full border border-border bg-[#FAFAF8] px-3 py-2.5 font-body text-sm text-muted-foreground"
            />
          </div>
          <button
            onClick={save} disabled={saving}
            className="px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase bg-foreground text-background disabled:opacity-50"
          >
            {saving ? "Snimam..." : "Sačuvaj izmene"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-border p-6 mb-5">
        <h2 className="font-heading text-xl mb-3">Lozinka</h2>
        <p className="font-body text-sm text-muted-foreground mb-4">
          Poslaćemo vam email sa linkom za postavljanje nove lozinke.
        </p>
        <button
          onClick={sendResetLink}
          className="flex items-center gap-2 px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase border border-border hover:bg-[#FAFAF8]"
        >
          <KeyRound size={14} /> Pošalji link za promenu lozinke
        </button>
      </div>

      <div className="bg-white border border-border p-6 grid grid-cols-2 gap-4 font-body text-sm">
        <div>
          <div className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Pridružio se</div>
          <div>{new Date(appUser.created_at).toLocaleDateString("sr-Latn-RS")}</div>
        </div>
        <div>
          <div className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Poslednji login</div>
          <div>{appUser.last_login_at ? new Date(appUser.last_login_at).toLocaleString("sr-RS") : "-"}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;