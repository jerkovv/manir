import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHasPermission, type AppRole, type AppStatus, type AppUser } from "@/hooks/useAuth";
import { Crown, Shield, Pencil, Eye, Search, UserCog } from "lucide-react";

const ROLE_META: Record<AppRole, { label: string; icon: any; cls: string }> = {
  owner:  { label: "Owner",  icon: Crown,  cls: "bg-amber-100 text-amber-800 border-amber-300" },
  admin:  { label: "Admin",  icon: Shield, cls: "bg-blue-100 text-blue-800 border-blue-300" },
  editor: { label: "Editor", icon: Pencil, cls: "bg-green-100 text-green-800 border-green-300" },
  viewer: { label: "Viewer", icon: Eye,    cls: "bg-gray-100 text-gray-700 border-gray-300" },
};

const STATUS_META: Record<AppStatus, { label: string; cls: string }> = {
  active:    { label: "Aktivan",     cls: "bg-green-100 text-green-800 border-green-300" },
  invited:   { label: "Pozvan",      cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  suspended: { label: "Suspendovan", cls: "bg-red-100 text-red-800 border-red-300" },
};

const RoleBadge = ({ role }: { role: AppRole }) => {
  const m = ROLE_META[role];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-body uppercase tracking-wider ${m.cls}`}>
      <Icon size={12} /> {m.label}
    </span>
  );
};

const StatusBadge = ({ status }: { status: AppStatus }) => {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 border text-[11px] font-body uppercase tracking-wider ${m.cls}`}>
      {m.label}
    </span>
  );
};

const Avatar = ({ user, size = 40 }: { user: AppUser; size?: number }) => {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name || user.email}
        className="rounded-full object-cover border border-border"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = (user.full_name || user.email).slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full bg-[#F5F0E8] text-foreground flex items-center justify-center font-heading"
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {initials}
    </div>
  );
};

const formatRelative = (iso: string | null): string => {
  if (!iso) return "Nikad";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "upravo sad";
  if (min < 60) return `pre ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `pre ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `pre ${days} ${days === 1 ? "dan" : "dana"}`;
  return new Date(iso).toLocaleDateString("sr-RS");
};

const AdminUsers = () => {
  const canManage = useHasPermission("manage_users");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AppStatus>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_users" as any)
      .select("id, email, full_name, role, status, avatar_url, last_login_at, created_at")
      .order("created_at", { ascending: false });
    if (!error) setUsers((data as unknown as AppUser[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (q && !(u.email.toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  if (!canManage) {
    return (
      <div className="bg-white border border-border p-8 text-center font-body text-sm text-muted-foreground">
        Nemate dozvolu za pristup ovoj stranici.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-4xl text-foreground mb-1 flex items-center gap-3">
            <UserCog size={28} /> Korisnici sistema
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            Interni tim sa pristupom admin panelu — {filtered.length} {filtered.length === 1 ? "korisnik" : "korisnika"}
          </p>
        </div>
        <button
          disabled
          title="Dostupno u sledećoj fazi"
          className="bg-foreground text-background px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase opacity-40 cursor-not-allowed"
        >
          Pozovi korisnika
        </button>
      </div>

      <div className="bg-white border border-border p-4 mb-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pretraži po imenu ili email-u..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border bg-background font-body text-sm focus:outline-none focus:border-foreground"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="px-3 py-2 border border-border bg-background font-body text-sm focus:outline-none focus:border-foreground"
        >
          <option value="all">Sve uloge</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-border bg-background font-body text-sm focus:outline-none focus:border-foreground"
        >
          <option value="all">Svi statusi</option>
          <option value="active">Aktivni</option>
          <option value="invited">Pozvani</option>
          <option value="suspended">Suspendovani</option>
        </select>
      </div>

      <div className="bg-white border border-border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center font-body text-sm text-muted-foreground">Učitavanje...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center font-body text-sm text-muted-foreground">
            Nema korisnika za prikazane filtere.
          </div>
        ) : (
          <table className="w-full font-body text-sm">
            <thead className="bg-[#FAFAF8] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-4">Korisnik</th>
                <th className="text-left p-4">Uloga</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Poslednji login</th>
                <th className="text-left p-4">Pridružio se</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-[#FAFAF8]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} />
                      <div>
                        <div className="font-medium text-foreground">{u.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><RoleBadge role={u.role} /></td>
                  <td className="p-4"><StatusBadge status={u.status} /></td>
                  <td className="p-4 text-muted-foreground">{formatRelative(u.last_login_at)}</td>
                  <td className="p-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString("sr-RS")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;