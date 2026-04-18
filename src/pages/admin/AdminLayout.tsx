import { ReactNode } from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, ShoppingBag, Users, FileText, Star, Layers, FilePlus, LogOut } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Pregled", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Porudžbine", icon: ShoppingBag },
  { to: "/admin/customers", label: "Kupci", icon: Users },
  { to: "/admin/products", label: "Proizvodi", icon: Package },
  { to: "/admin/reviews", label: "Recenzije", icon: Star },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/pages", label: "Stranice", icon: FilePlus },
  { to: "/admin/landing", label: "Landing editor", icon: Layers },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();

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
      {/* Sidebar */}
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
        <div className="p-4 border-t border-border space-y-2">
          <div className="font-body text-xs text-muted-foreground truncate">{user.email}</div>
          <button onClick={signOut} className="flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground">
            <LogOut size={14} /> Odjava
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 bg-white border-b border-border z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/admin" className="font-heading text-lg">0202 admin</Link>
          <button onClick={signOut} className="font-body text-[11px] tracking-[0.15em] uppercase">Odjava</button>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1 scrollbar-hide">
          {navItems.map((item) => {
            const active = isActive(item.to, item.end);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-shrink-0 px-3 py-1.5 font-body text-xs whitespace-nowrap ${
                  active ? "bg-[#F5F0E8] text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 lg:ml-0 mt-[88px] lg:mt-0 p-6 lg:p-10 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
