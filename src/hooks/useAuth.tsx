import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "admin" | "editor" | "viewer";
export type AppStatus = "active" | "suspended" | "invited";

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  status: AppStatus;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
}

export type Permission =
  | "manage_users"
  | "manage_settings"
  | "manage_products"
  | "manage_orders"
  | "view_only";

const PERMISSION_MAP: Record<Permission, AppRole[]> = {
  manage_users: ["owner", "admin"],
  manage_settings: ["owner", "admin"],
  manage_products: ["owner", "admin", "editor"],
  manage_orders: ["owner", "admin", "editor"],
  view_only: ["owner", "admin", "editor", "viewer"],
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  appUser: AppUser | null;
  accessDeniedReason: "no_access" | "suspended" | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [accessDeniedReason, setAccessDeniedReason] = useState<
    "no_access" | "suspended" | null
  >(null);
  const [loading, setLoading] = useState(true);

  const loadAppUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("app_users" as any)
      .select("id, email, full_name, role, status, avatar_url, last_login_at, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      setAppUser(null);
      setAccessDeniedReason("no_access");
      return;
    }
    const u = data as unknown as AppUser;
    if (u.status === "suspended") {
      setAppUser(null);
      setAccessDeniedReason("suspended");
      return;
    }
    setAppUser(u);
    setAccessDeniedReason(null);
    // record login (async, ne blokira)
    supabase.rpc("app_user_record_login" as any).then(() => {});
  };

  useEffect(() => {
    // Listener first (sync state updates only)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadAppUser(sess.user.id), 0);
      } else {
        setAppUser(null);
        setAccessDeniedReason(null);
      }
    });

    // Then existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadAppUser(sess.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAppUser(null);
    setAccessDeniedReason(null);
  };

  const isAdmin = !!appUser; // svaki app_user ima admin pristup

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, appUser, accessDeniedReason, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const useCurrentUser = (): AppUser | null => {
  return useAuth().appUser;
};

export const useHasPermission = (perm: Permission): boolean => {
  const u = useAuth().appUser;
  if (!u) return false;
  return PERMISSION_MAP[perm].includes(u.role);
};
