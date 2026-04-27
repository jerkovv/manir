import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { downloadCSV } from "@/lib/csv";
import { displayOrderNumber } from "@/lib/orderNumber";
import { StatusBadge } from "./AdminOverview";
import { Download, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  subtotal: number | null;
  discount_amount: number | null;
  discount_label: string | null;
  coupon_code: string | null;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

const STATUSES = ["all", "pending", "shipped", "delivered", "cancelled"];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openOrder = async (o: Order) => {
    setSelected(o);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems((data as OrderItem[]) || []);
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    const update: any = { status };
    if (status === "shipped") update.shipped_at = new Date().toISOString();
    if (status === "delivered") update.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(update).eq("id", selected.id);
    if (error) return toast.error("Greška: " + error.message);
    toast.success("Status ažuriran");
    setSelected({ ...selected, status });
    load();
  };

  const exportCSV = () => {
    const rows = filtered.map((o) => ({
      broj: displayOrderNumber(o.order_number),
      datum: new Date(o.created_at).toLocaleString("sr-RS"),
      kupac: o.customer_name,
      email: o.customer_email,
      telefon: o.customer_phone || "",
      adresa: `${o.shipping_address || ""}, ${o.shipping_postal_code || ""} ${o.shipping_city || ""}`.trim(),
      medjuzbir: o.subtotal ?? "",
      popust: o.discount_amount ?? 0,
      popust_opis: o.discount_label ?? "",
      kupon: o.coupon_code ?? "",
      iznos: o.total,
      status: o.status,
    }));
    downloadCSV(`porudzbine-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const deleteOrder = async (o: Order, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Obrisati porudžbinu #${displayOrderNumber(o.order_number)}? Ova akcija se ne može poništiti.`)) return;
    try {
      const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", o.id);
      if (itemsError) return toast.error("Greška: " + itemsError.message);

      const { error: orderError, count } = await supabase
        .from("orders")
        .delete({ count: "exact" })
        .eq("id", o.id);

      if (orderError) return toast.error("Greška: " + orderError.message);
      if ((count ?? 0) !== 1) return toast.error("Porudžbina nije obrisana");

      toast.success("Porudžbina obrisana");
      if (selected?.id === o.id) setSelected(null);
      setOrders((current) => current.filter((order) => order.id !== o.id));
    } catch (err: any) {
      console.error("[deleteOrder] network error", err);
      toast.error("Mrežna greška: " + (err?.message || "nepoznato"));
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-4xl text-foreground mb-1">Porudžbine</h1>
          <p className="font-body text-sm text-muted-foreground">{filtered.length} porudžbina</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 font-body text-xs tracking-wider uppercase border ${filter === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}
          >
            {s === "all" ? "Sve" : s === "pending" ? "Na čekanju" : s === "shipped" ? "Poslato" : s === "delivered" ? "Isporučeno" : "Otkazano"}
          </button>
        ))}
      </div>

      <div className="bg-white border border-border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center font-body text-sm text-muted-foreground">Učitavanje...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center font-body text-sm text-muted-foreground">Nema porudžbina.</div>
        ) : (
          <table className="w-full font-body text-sm">
            <thead className="bg-[#FAFAF8] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-4">#</th>
                <th className="text-left p-4">Datum</th>
                <th className="text-left p-4">Kupac</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Popust</th>
                <th className="text-left p-4">Kupon</th>
                <th className="text-left p-4">Iznos</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} onClick={() => openOrder(o)} className="border-t border-border cursor-pointer hover:bg-[#FAFAF8]">
                  <td className="p-4">#{displayOrderNumber(o.order_number)}</td>
                  <td className="p-4 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("sr-RS")}</td>
                  <td className="p-4">{o.customer_name}</td>
                  <td className="p-4 text-muted-foreground">{o.customer_email}</td>
                  <td className="p-4 text-muted-foreground">
                    {o.discount_amount && Number(o.discount_amount) > 0
                      ? `−${Number(o.discount_amount).toLocaleString("sr-RS")} RSD`
                      : "—"}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {o.coupon_code ? <span className="font-mono text-xs uppercase">{o.coupon_code}</span> : "—"}
                  </td>
                  <td className="p-4">{Number(o.total).toLocaleString("sr-RS")} RSD</td>
                  <td className="p-4"><StatusBadge status={o.status} /></td>
                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => deleteOrder(o, e)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      title="Obriši porudžbinu"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-2xl">Porudžbina #{displayOrderNumber(selected.order_number)}</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => deleteOrder(selected)}
                  className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-destructive hover:underline"
                >
                  <Trash2 size={14} /> Obriši
                </button>
                <button onClick={() => setSelected(null)}><X size={20} /></button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <div className="font-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Status</div>
                <div className="flex gap-2 flex-wrap">
                  {["pending", "shipped", "delivered", "cancelled"].map((s) => (
                    <button key={s} onClick={() => updateStatus(s)} className={`px-3 py-1.5 font-body text-xs uppercase tracking-wider border ${selected.status === s ? "bg-foreground text-background border-foreground" : "border-border"}`}>
                      {s === "pending" ? "Na čekanju" : s === "shipped" ? "Poslato" : s === "delivered" ? "Isporučeno" : "Otkazano"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 font-body text-sm">
                <div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Kupac</div>{selected.customer_name}</div>
                <div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</div>{selected.customer_email}</div>
                <div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Telefon</div>{selected.customer_phone || "—"}</div>
                <div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Datum</div>{new Date(selected.created_at).toLocaleString("sr-RS")}</div>
                <div className="col-span-2"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Adresa</div>{selected.shipping_address || "—"}, {selected.shipping_postal_code} {selected.shipping_city}</div>
                {selected.notes && <div className="col-span-2"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Napomena</div>{selected.notes}</div>}
              </div>
              <div>
                <div className="font-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Stavke</div>
                <table className="w-full font-body text-sm border border-border">
                  <thead className="bg-[#FAFAF8] text-xs uppercase tracking-wider text-muted-foreground">
                    <tr><th className="text-left p-3">Proizvod</th><th className="text-left p-3">Kol</th><th className="text-left p-3">Cena</th><th className="text-right p-3">Ukupno</th></tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-t border-border">
                        <td className="p-3">{it.product_name}</td>
                        <td className="p-3">{it.quantity}</td>
                        <td className="p-3">{Number(it.unit_price).toLocaleString("sr-RS")}</td>
                        <td className="p-3 text-right">{Number(it.subtotal).toLocaleString("sr-RS")}</td>
                      </tr>
                    ))}
                    {selected.subtotal != null && (
                      <tr className="border-t border-border">
                        <td colSpan={3} className="p-3 text-right text-muted-foreground">Međuzbir</td>
                        <td className="p-3 text-right text-muted-foreground">{Number(selected.subtotal).toLocaleString("sr-RS")} RSD</td>
                      </tr>
                    )}
                    {selected.discount_amount != null && Number(selected.discount_amount) > 0 && (
                      <tr className="border-t border-border">
                        <td colSpan={3} className="p-3 text-right text-muted-foreground">
                          Popust{selected.discount_label ? ` (${selected.discount_label})` : ""}
                          {selected.coupon_code ? ` · kupon ${selected.coupon_code}` : ""}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">−{Number(selected.discount_amount).toLocaleString("sr-RS")} RSD</td>
                      </tr>
                    )}
                    <tr className="border-t border-border bg-[#FAFAF8]">
                      <td colSpan={3} className="p-3 text-right font-medium">Ukupno</td>
                      <td className="p-3 text-right font-medium">{Number(selected.total).toLocaleString("sr-RS")} RSD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
