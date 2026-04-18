import { useState } from "react";
import { Navigate, Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, ShoppingBag, Users, FileText, Star, Layers, FilePlus, Tag, LogOut, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { to: "/admin", label: "Pregled", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Porudžbine", icon: ShoppingBag },
  { to: "/admin/customers", label: "Kupci", icon: Users },
  { to: "/admin/products", label: "Proizvodi", icon: Package },
  { to: "/admin/discounts", label: "Popusti i kuponi", icon: Tag },
  { to: "/admin/reviews", label: "Recenzije", icon: Star },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/pages", label: "Stranice", icon: FilePlus },
  { to: "/admin/landing", label: "Landing editor", icon: Layers },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] font-body text-sm text-muted-foreground">Učitavanje...</div>;
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-6 text-center">
        <div>
          <h1 className="font-heading text-2xl mb-3">Pristup odbijen</h1>
          <p className="font-body text-sm text-muted-foreground mb-6">Vaš nalog nema admin privilegije.</p>
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
          {navItems.map((item) => {
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
          <div className="font-body text-xs text-muted-foreground truncate">{user.email}</div>
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
      <div className="lg:hidden fixed top-0 inset-x-0 bg-white border-b border-border z-40 h-14 flex items-center justify-between px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Otvori meni"
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-md hover:bg-[#F5F0E8] active:bg-[#F5F0E8]"
            >
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col bg-white">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="font-heading text-lg">0202 admin</Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to, item.end);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-md font-body text-sm transition-colors ${
                      active ? "bg-[#F5F0E8] text-foreground font-medium" : "text-muted-foreground hover:bg-[#F5F0E8]/50"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-border space-y-3">
              <div className="font-body text-xs text-muted-foreground truncate">{user.email}</div>
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

        <Link to="/admin" className="font-heading text-base absolute left-1/2 -translate-x-1/2">0202 admin</Link>

        <button
          onClick={signOut}
          aria-label="Odjava"
          className="flex items-center justify-center w-10 h-10 -mr-2 rounded-md hover:bg-[#F5F0E8] text-muted-foreground"
        >
          <LogOut size={18} />
        </button>
      </div>

      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 p-4 sm:p-6 lg:p-10 max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
