import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHasPermission, type AppRole, type AppStatus, type AppUser } from "@/hooks/useAuth";
import { Crown, Shield, Pencil, Eye, Search, UserCog, MoreVertical, X, AlertTriangle, Send, UserPlus, Activity } from "lucide-react";
import { toast } from "sonner";

const ROLE_META: Record<AppRole, { label: string; icon: any; cls: string }> = {
  owner: { label: "Owner", icon: Crown, cls: "bg-amber-100 text-amber-800 border-amber-300" },
  admin: { label: "Admin", icon: Shield, cls: "bg-blue-100 text-blue-800 border-blue-300" },
  editor: { label: "Editor", icon: Pencil, cls: "bg-green-100 text-green-800 border-green-300" },
  viewer: { label: "Viewer", icon: Eye, cls: "bg-gray-100 text-gray-700 border-gray-300" },
};

const STATUS_META: Record<AppStatus, { label: string; cls: string }> = {
  active: { label: "Aktivan", cls: "bg-green-100 text-green-800 border-green-300" },
  invited: { label: "Pozvan", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
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
  return new Date(iso).toLocaleDateString("sr-Latn-RS");
};

type AuditEntry = {
  id: string;
  actor_email: string | null;
  target_email: string | null;
  action: string;
  metadata: Record<string, any> | null;
  created_at: string;
};

const ACTION_LABEL: Record<string, string> = {
  invited: "Pozvao",
  invite_resent: "Ponovo poslao poziv",
  role_changed: "Promenio ulogu",
  suspended: "Suspendovao",
  activated: "Aktivirao",
  deleted: "Obrisao",
  login: "Prijava",
};

const AdminUsers = () => {
  const { appUser: currentUser } = useAuth();
  const canManage = useHasPermission("manage_users");
  const isOwner = currentUser?.role === "owner";
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AppStatus>("all");
  const [tab, setTab] = useState<"users" | "activity">("users");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

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
            Interni tim sa pristupom admin panelu
          </p>
        </div>
        {tab === "users" && (
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors"
          >
            <UserPlus size={14} /> Dodaj korisnika
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-5 border-b border-border">
        {[
          { id: "users", label: "Korisnici", icon: UserCog },
          { id: "activity", label: "Aktivnost", icon: Activity },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase border-b-2 -mb-px transition-colors ${
                active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "users" && (
        <>
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
        <div className="text-xs text-muted-foreground font-body ml-auto">
          {filtered.length} {filtered.length === 1 ? "korisnik" : "korisnika"}
        </div>
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
                <th className="text-right p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-[#FAFAF8]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} />
                      <div>
                        <div className="font-medium text-foreground">{u.full_name || "-"}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><RoleBadge role={u.role} /></td>
                  <td className="p-4"><StatusBadge status={u.status} /></td>
                  <td className="p-4 text-muted-foreground">{formatRelative(u.last_login_at)}</td>
                  <td className="p-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString("sr-Latn-RS")}</td>
                  <td className="p-4 text-right relative">
                    <UserActionsMenu
                      user={u}
                      isSelf={u.id === currentUser?.id}
                      isOwner={isOwner}
                      open={menuFor === u.id}
                      onToggle={() => setMenuFor(menuFor === u.id ? null : u.id)}
                      onClose={() => setMenuFor(null)}
                      onEdit={() => { setEditTarget(u); setMenuFor(null); }}
                      onDelete={() => { setDeleteTarget(u); setMenuFor(null); }}
                      onResend={async () => {
                        setMenuFor(null);
                        const { data, error } = await supabase.functions.invoke("resend-invite", { body: { user_id: u.id } });
                        if (error || (data as any)?.error) toast.error("Greška: " + (error?.message || (data as any)?.error));
                        else toast.success("Poziv ponovo poslat");
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
        </>
      )}

      {tab === "activity" && <ActivityTab />}

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onDone={() => { setInviteOpen(false); load(); }}
        />
      )}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          isOwner={isOwner}
          onClose={() => setEditTarget(null)}
          onDone={() => { setEditTarget(null); load(); }}
        />
      )}
      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDone={() => { setDeleteTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default AdminUsers;

// ============================================================
// Actions menu
// ============================================================
const UserActionsMenu = ({ user, isSelf, isOwner, open, onToggle, onClose, onEdit, onDelete, onResend }: {
  user: AppUser; isSelf: boolean; isOwner: boolean;
  open: boolean; onToggle: () => void; onClose: () => void;
  onEdit: () => void; onDelete: () => void; onResend: () => void;
}) => {
  return (
    <>
      <button
        onClick={onToggle}
        className="p-1.5 hover:bg-[#F5F0E8] rounded text-muted-foreground"
        aria-label="Akcije"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div className="absolute right-4 top-12 z-50 bg-white border border-border shadow-lg min-w-[200px] py-1">
            <button
              disabled={isSelf}
              onClick={onEdit}
              className="w-full text-left px-4 py-2 font-body text-sm hover:bg-[#FAFAF8] disabled:opacity-40 disabled:cursor-not-allowed"
              title={isSelf ? "Ne možete menjati sami sebe" : ""}
            >
              Izmeni ulogu / status
            </button>
            {user.status === "invited" && (
              <button
                onClick={onResend}
                className="w-full text-left px-4 py-2 font-body text-sm hover:bg-[#FAFAF8] flex items-center gap-2"
              >
                <Send size={13} /> Pošalji poziv ponovo
              </button>
            )}
            <button
              disabled={!isOwner || isSelf}
              onClick={onDelete}
              className="w-full text-left px-4 py-2 font-body text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title={!isOwner ? "Samo owner može brisati" : isSelf ? "Ne možete obrisati sami sebe" : ""}
            >
              Obriši
            </button>
          </div>
        </>
      )}
    </>
  );
};

// ============================================================
// Invite Modal
// ============================================================
const ROLE_DESC: Record<string, string> = {
  admin: "Sve osim brisanja owner-a",
  editor: "Proizvodi, porudžbine, content bez podešavanja",
  viewer: "Samo čitanje (npr. računovođa)",
};

const InviteModal = ({ onClose, onDone }: { onClose: () => void; onDone: () => void }) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("invite-app-user", {
      body: { email: email.trim(), full_name: fullName.trim(), role },
    });
    setSubmitting(false);
    if ((data as any)?.already_exists) {
      toast.error("Email je već dodat");
      return;
    }
    if (error || (data as any)?.error) {
      toast.error("Greška: " + (error?.message || (data as any)?.error));
      return;
    }
    if ((data as any)?.email_sent === false) {
      const fb = (data as any)?.fallback_credentials;
      if (fb) {
        toast.warning(
          `Korisnik kreiran, ali email nije poslat. Lozinka: ${fb.password}`,
          { duration: 30000 }
        );
      } else {
        toast.warning("Korisnik dodat, ali email nije poslat: " + ((data as any)?.email_error || "nepoznato"));
      }
    } else {
      toast.success("Korisnik kreiran pristupni podaci su poslati na email");
    }
    onDone();
  };

  return (
    <ModalShell title="Dodaj korisnika" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="ime@primer.rs"
            className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:border-foreground"
          />
        </Field>
        <Field label="Ime i prezime">
          <input
            type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:border-foreground"
          />
        </Field>
        <Field label="Uloga">
          <div className="space-y-2">
            {(["admin", "editor", "viewer"] as const).map((r) => (
              <label key={r} className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${role === r ? "border-foreground bg-[#FAFAF8]" : "border-border"}`}>
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="mt-0.5" />
                <div>
                  <div className="font-body text-sm font-medium uppercase tracking-wider">{r}</div>
                  <div className="font-body text-xs text-muted-foreground mt-0.5">{ROLE_DESC[r]}</div>
                </div>
              </label>
            ))}
          </div>
        </Field>
        <p className="font-body text-xs text-muted-foreground bg-[#FAFAF8] p-3 border border-border">
          Korisnik će dobiti email sa linkom za postavljanje lozinke. Link važi 24 sata.
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase border border-border">Otkaži</button>
          <button type="submit" disabled={submitting} className="px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase bg-foreground text-background disabled:opacity-50">
            {submitting ? "Šaljem..." : "Pošalji poziv"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ============================================================
// Edit User Modal
// ============================================================
const EditUserModal = ({ user, isOwner, onClose, onDone }: { user: AppUser; isOwner: boolean; onClose: () => void; onDone: () => void }) => {
  const [role, setRole] = useState<AppRole>(user.role);
  const [status, setStatus] = useState<AppStatus>(user.status);
  const [submitting, setSubmitting] = useState(false);
  const [ownerCount, setOwnerCount] = useState<number | null>(null);

  useEffect(() => {
    supabase.from("app_users" as any)
      .select("id", { count: "exact", head: true })
      .eq("role", "owner").eq("status", "active")
      .then(({ count }) => setOwnerCount(count ?? 0));
  }, []);

  const isOnlyOwner = user.role === "owner" && ownerCount === 1;
  const targetIsOwner = user.role === "owner";
  const canEditRole = isOwner || !targetIsOwner;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === user.role && status === user.status) {
      toast.info("Nema promena");
      return;
    }
    setSubmitting(true);
    const body: any = { user_id: user.id };
    if (role !== user.role) body.new_role = role;
    if (status !== user.status) body.new_status = status;
    const { data, error } = await supabase.functions.invoke("update-app-user", { body });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      toast.error("Greška: " + (error?.message || (data as any)?.error));
      return;
    }
    toast.success("Korisnik ažuriran");
    onDone();
  };

  return (
    <ModalShell title="Izmeni korisnika" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[#FAFAF8] border border-border">
          <Avatar user={user} />
          <div>
            <div className="font-medium">{user.full_name || "-"}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>

        {isOnlyOwner && (
          <div className="flex gap-2 p-3 border border-amber-300 bg-amber-50 text-amber-900 text-xs font-body">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>Ovo je jedini owner. Da biste promenili njegovu ulogu ili status, prvo dodelite owner ulogu drugom korisniku.</div>
          </div>
        )}

        <Field label="Uloga">
          <select
            value={role} onChange={(e) => setRole(e.target.value as AppRole)}
            disabled={!canEditRole || isOnlyOwner}
            className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:border-foreground disabled:opacity-50"
          >
            {isOwner && <option value="owner">Owner</option>}
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          {!isOwner && targetIsOwner && (
            <p className="text-xs text-muted-foreground mt-1">Samo owner može menjati drugog ownera.</p>
          )}
        </Field>

        <Field label="Status">
          <div className="flex gap-2">
            {(["active", "suspended"] as const).map((s) => (
              <button
                key={s} type="button"
                disabled={isOnlyOwner && s === "suspended"}
                onClick={() => setStatus(s)}
                className={`flex-1 py-2.5 font-body text-xs tracking-[0.15em] uppercase border ${
                  status === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {s === "active" ? "Aktivan" : "Suspendovan"}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase border border-border">Otkaži</button>
          <button type="submit" disabled={submitting} className="px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase bg-foreground text-background disabled:opacity-50">
            {submitting ? "Snimam..." : "Sačuvaj"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ============================================================
// Delete User Modal (GitHub-style email confirm)
// ============================================================
const DeleteUserModal = ({ user, onClose, onDone }: { user: AppUser; onClose: () => void; onDone: () => void }) => {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const matches = confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

  const submit = async () => {
    if (!matches) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("delete-app-user", { body: { user_id: user.id } });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      toast.error("Greška: " + (error?.message || (data as any)?.error));
      return;
    }
    toast.success("Korisnik obrisan");
    onDone();
  };

  return (
    <ModalShell title="Obriši korisnika" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-2 p-3 border border-red-300 bg-red-50 text-red-900 text-sm font-body">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>{user.full_name || user.email}</strong> će izgubiti pristup admin panelu. Ova akcija je nepovratna.
          </div>
        </div>
        <Field label={`Za potvrdu, ukucajte email: ${user.email}`}>
          <input
            type="text" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={user.email}
            className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:border-foreground"
          />
        </Field>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase border border-border">Otkaži</button>
          <button onClick={submit} disabled={!matches || submitting}
            className="px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Brišem..." : "Obriši nepovratno"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ============================================================
// Activity (audit log) tab
// ============================================================
const ActivityTab = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("user_audit_log" as any)
        .select("id, actor_email, target_email, action, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setLogs((data as any) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="bg-white border border-border overflow-x-auto">
      {loading ? (
        <div className="p-8 text-center font-body text-sm text-muted-foreground">Učitavanje...</div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center font-body text-sm text-muted-foreground">Nema zabeležene aktivnosti.</div>
      ) : (
        <table className="w-full font-body text-sm">
          <thead className="bg-[#FAFAF8] text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-4">Datum</th>
              <th className="text-left p-4">Akcija</th>
              <th className="text-left p-4">Ko</th>
              <th className="text-left p-4">Nad kim</th>
              <th className="text-left p-4">Detalji</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-4 text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString("sr-RS")}</td>
                <td className="p-4">{ACTION_LABEL[l.action] || l.action}</td>
                <td className="p-4 text-muted-foreground">{l.actor_email || "-"}</td>
                <td className="p-4 text-muted-foreground">{l.target_email || "-"}</td>
                <td className="p-4 text-muted-foreground text-xs">
                  {l.metadata && Object.keys(l.metadata).length > 0
                    ? Object.entries(l.metadata).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ============================================================
// Shared Modal/Field
// ============================================================
const ModalShell = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="font-heading text-2xl">{title}</h2>
        <button onClick={onClose} aria-label="Zatvori"><X size={20} /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block font-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-2">{label}</label>
    {children}
  </div>
);