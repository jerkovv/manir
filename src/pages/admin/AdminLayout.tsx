import { useState } from "react";
import { Navigate, Link, useLocation, Outlet } from "react-router-dom";
import { useAuth, useHasPermission } from "@/hooks/useAuth";
import { LayoutDashboard, Package, ShoppingBag, Users, FileText, Star, Layers, FilePlus, Tag, LogOut, Menu, X, Mail, UserCog } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type Perm = "manage_users" | "manage_settings" | "manage_products" | "manage_orders" | "view_only";
type NavItem = { to: string; label: string; icon: any; end?: boolean; perm?: Perm };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Glavno",
    items: [
      { to: "/admin", label: "Pregled", icon: LayoutDashboard, end: true, perm: "view_only" },
      { to: "/admin/orders", label: "Porudžbine", icon: ShoppingBag, perm: "manage_orders" },
      { to: "/admin/customers", label: "Kupci", icon: Users, perm: "view_only" },
      { to: "/admin/products", label: "Proizvodi", icon: Package, perm: "manage_products" },
      { to: "/admin/discounts", label: "Popusti i kuponi", icon: Tag, perm: "manage_products" },
    ],
  },
  {
    label: "Sadržaj",
    items: [
      { to: "/admin/reviews", label: "Recenzije", icon: Star, perm: "manage_products" },
      { to: "/admin/blog", label: "Blog", icon: FileText, perm: "manage_products" },
      { to: "/admin/pages", label: "Stranice", icon: FilePlus, perm: "manage_products" },
      { to: "/admin/landing", label: "Landing editor", icon: Layers, perm: "manage_products" },
    ],
  },
  {
    label: "Podešavanja",
    items: [
      { to: "/admin/settings/email", label: "Email podešavanja", icon: Mail, perm: "manage_settings" },
      { to: "/admin/settings/users", label: "Korisnici", icon: UserCog, perm: "manage_users" },
    ],
  },
];

const bottomTabItems: NavItem[] = [
  { to: "/admin", label: "Pregled", icon: LayoutDashboard, end: true, perm: "view_only" },
  { to: "/admin/orders", label: "Porudžbine", icon: ShoppingBag, perm: "manage_orders" },
  { to: "/admin/products", label: "Proizvodi", icon: Package, perm: "manage_products" },
  { to: "/admin/customers", label: "Kupci", icon: Users, perm: "view_only" },
];

const AdminLayout = () => {
  const { user, isAdmin, appUser, accessDeniedReason, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const permMap: Record<string, string[]> = {
    manage_users: ["owner", "admin"],
    manage_settings: ["owner", "admin"],
    manage_products: ["owner", "admin", "editor"],
    manage_orders: ["owner", "admin", "editor"],
    view_only: ["owner", "admin", "editor", "viewer"],
  };

  const canSee = (item: NavItem) => {
    if (!appUser) return false;
    if (!item.perm) return true;
    return permMap[item.perm].includes(appUser.role);
  };

  const visibleGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter(canSee) }))
    .filter((g) => g.items.length > 0);
  const visibleNav = visibleGroups.flatMap((g) => g.items);
  const visibleBottomTabs = bottomTabItems.filter(canSee).slice(0, 4);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] font-body text-sm text-muted-foreground">Učitavanje...</div>;
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) {
    const msg =
      accessDeniedReason === "suspended"
        ? "Vaš nalog je suspendovan. Kontaktirajte administratora."
        : "Vaš nalog nema pristup admin panelu.";
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-6 text-center">
        <div>
          <h1 className="font-heading text-2xl mb-3">Pristup odbijen</h1>
          <p className="font-body text-sm text-muted-foreground mb-6">{msg}</p>
          <button onClick={signOut} className="font-body text-xs tracking-[0.15em] uppercase underline">Odjavi se</button>
        </div>
      </main>
    );
  }

  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex bg-[#FAFAF8]">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border">
        <div className="p-6 border-b border-border">
          <Link to="/admin" className="font-heading text-xl">0202 admin</Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.end);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 font-body text-sm transition-colors ${
                  active ? "bg-[#F5F0E8] text-foreground" : "text-muted-foreground hover:bg-[#F5F0E8]/50"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-3">
          <Link to="/admin/profile" className="block hover:bg-[#F5F0E8] -mx-2 px-2 py-1.5 rounded transition-colors">
            <div className="font-body text-xs text-foreground truncate">
              {appUser?.full_name || user.email}
            </div>
            {appUser && (
              <div className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 mt-0.5">
                {appUser.role}
              </div>
            )}
          </Link>
          <button onClick={signOut} className="flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground">
            <LogOut size={14} /> Odjava
          </button>
          <a
            href="https://luno.rs"
            target="_blank"
            rel="noopener noreferrer"
            className="block pt-3 border-t border-border"
          >
            <div className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60">
              Platformu izradio
            </div>
            <div className="font-heading text-sm tracking-wider text-foreground hover:text-primary transition-colors mt-0.5">
              LUNO<span className="text-primary">.rs</span>
            </div>
          </a>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 inset-x-0 bg-white/95 backdrop-blur border-b border-border z-40 flex items-center justify-between px-3"
        style={{ height: "calc(3.5rem + env(safe-area-inset-top))", paddingTop: "env(safe-area-inset-top)" }}
      >
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Otvori meni"
              className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-[#F5F0E8] active:bg-[#F5F0E8]"
            >
              <Menu size={22} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] max-w-[320px] p-0 flex flex-col bg-white">
            <div
              className="px-5 py-4 border-b border-border flex items-center justify-between"
              style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
            >
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="font-heading text-lg">
                0202 <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground">admin</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
              {visibleGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-3 mb-1.5 font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.to, item.end);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 pl-3 pr-3 py-3 rounded-md font-body text-[15px] transition-colors border-l-2 ${
                            active
                              ? "bg-[#F5F0E8] text-foreground font-medium border-warm-brown"
                              : "text-muted-foreground hover:bg-[#F5F0E8]/50 border-transparent"
                          }`}
                        >
                          <Icon size={18} strokeWidth={1.75} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div
              className="p-4 border-t border-border space-y-3"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            >
              <Link
                to="/admin/profile"
                onClick={() => setMobileOpen(false)}
                className="block hover:bg-[#F5F0E8] -mx-2 px-2 py-1.5 rounded transition-colors"
              >
                <div className="font-body text-xs text-foreground truncate">
                  {appUser?.full_name || user.email}
                </div>
                {appUser && (
                  <div className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 mt-0.5">
                    {appUser.role}
                  </div>
                )}
              </Link>
              <button
                onClick={() => { setMobileOpen(false); signOut(); }}
                className="flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground"
              >
                <LogOut size={14} /> Odjava
              </button>
              <a
                href="https://luno.rs"
                target="_blank"
                rel="noopener noreferrer"
                className="block pt-3 border-t border-border"
              >
                <div className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60">
                  Platformu izradio
                </div>
                <div className="font-heading text-sm tracking-wider text-foreground mt-0.5">
                  LUNO<span className="text-primary">.rs</span>
                </div>
              </a>
            </div>
          </SheetContent>
        </Sheet>

        <Link
          to="/admin"
          className="font-heading text-base absolute left-1/2 -translate-x-1/2"
          style={{ top: "calc(env(safe-area-inset-top) + 0.25rem)", paddingTop: "0.5rem" }}
        >
          0202 <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">admin</span>
        </Link>

        <Link
          to="/admin/profile"
          aria-label="Profil"
          className="flex items-center justify-center w-11 h-11 rounded-full bg-[#F5F0E8] text-foreground font-body text-xs font-medium uppercase"
        >
          {(appUser?.full_name || user.email || "?").trim().charAt(0)}
        </Link>
      </div>

      {/* Mobile bottom tab bar */}
      {visibleBottomTabs.length > 0 && (
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-border z-40 flex items-stretch justify-around"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {visibleBottomTabs.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.end);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 font-body text-[10px] tracking-wide transition-colors ${
                  active ? "text-warm-brown" : "text-muted-foreground"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <main
        className="flex-1 lg:ml-0 max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-10 mt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))] lg:!mt-0 lg:!pb-10"
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
