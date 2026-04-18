import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Users, Package, TrendingUp } from "lucide-react";

type Stats = {
  revenue: number;
  ordersCount: number;
  pendingCount: number;
  customersCount: number;
  productsCount: number;
};

type RecentOrder = {
  id: string;
  order_number: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: orders }, { count: customersCount }, { count: productsCount }, { data: recentOrders }] = await Promise.all([
          supabase.from("orders").select("total, status"),
          supabase.from("customers").select("*", { count: "exact", head: true }),
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("id, order_number, customer_name, total, status, created_at").order("created_at", { ascending: false }).limit(5),
        ]);

        const ordersList = orders || [];
        const revenue = ordersList.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total || 0), 0);
        const pendingCount = ordersList.filter((o: any) => o.status === "pending").length;

        setStats({
          revenue,
          ordersCount: ordersList.length,
          pendingCount,
          customersCount: customersCount || 0,
          productsCount: productsCount || 0,
        });
        setRecent((recentOrders as RecentOrder[]) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = stats ? [
    { label: "Prihod", value: `${stats.revenue.toLocaleString("sr-RS")} RSD`, icon: TrendingUp },
    { label: "Porudžbine", value: stats.ordersCount, icon: ShoppingBag, sub: `${stats.pendingCount} na čekanju` },
    { label: "Kupci", value: stats.customersCount, icon: Users },
    { label: "Proizvodi", value: stats.productsCount, icon: Package },
  ] : [];

  return (
    <div>
      <h1 className="font-heading text-4xl text-foreground mb-2">Pregled</h1>
      <p className="font-body text-sm text-muted-foreground mb-10">Pregled poslovanja u realnom vremenu.</p>

      {loading ? (
        <p className="font-body text-sm text-muted-foreground">Učitavanje...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-white border border-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground">{c.label}</span>
                    <Icon size={16} className="text-muted-foreground" />
                  </div>
                  <div className="font-heading text-2xl">{c.value}</div>
                  {c.sub && <div className="font-body text-xs text-muted-foreground mt-1">{c.sub}</div>}
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-lg">Najnovije porudžbine</h2>
              <Link to="/admin/orders" className="font-body text-xs tracking-[0.15em] uppercase underline">Sve</Link>
            </div>
            {recent.length === 0 ? (
              <div className="p-8 text-center font-body text-sm text-muted-foreground">Još uvek nema porudžbina.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead className="bg-[#FAFAF8] text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left p-4">#</th>
                      <th className="text-left p-4">Kupac</th>
                      <th className="text-left p-4">Iznos</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((o) => (
                      <tr key={o.id} className="border-t border-border">
                        <td className="p-4">#{o.order_number}</td>
                        <td className="p-4">{o.customer_name}</td>
                        <td className="p-4">{Number(o.total).toLocaleString("sr-RS")} RSD</td>
                        <td className="p-4"><StatusBadge status={o.status} /></td>
                        <td className="p-4 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("sr-RS")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    pending: "Na čekanju",
    shipped: "Poslato",
    delivered: "Isporučeno",
    cancelled: "Otkazano",
  };
  return <span className={`inline-block px-2 py-0.5 text-[11px] font-body ${map[status] || "bg-gray-100"}`}>{labels[status] || status}</span>;
};

export default AdminOverview;
