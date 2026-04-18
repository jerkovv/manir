import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Tag, Percent } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  active: boolean;
  uses_count: number;
};

const AdminDiscounts = () => {
  // Quantity discount config
  const [qd, setQd] = useState({ enabled: true, min_quantity: 3, percent: 20 });
  const [savingQd, setSavingQd] = useState(false);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);

  const loadAll = async () => {
    const [{ data: settings }, { data: coupData }] = await Promise.all([
      supabase.from("store_settings").select("value").eq("key", "quantity_discount").maybeSingle(),
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
    ]);
    if (settings?.value) {
      const v = settings.value as any;
      setQd({
        enabled: v.enabled ?? true,
        min_quantity: v.min_quantity ?? 3,
        percent: v.percent ?? 20,
      });
    }
    setCoupons((coupData as Coupon[]) || []);
  };

  useEffect(() => { loadAll(); }, []);

  const saveQd = async () => {
    setSavingQd(true);
    const { error } = await supabase
      .from("store_settings")
      .upsert({ key: "quantity_discount", value: qd, updated_at: new Date().toISOString() });
    setSavingQd(false);
    if (error) return toast.error("Greška: " + error.message);
    toast.success("Sačuvano");
  };

  const saveCoupon = async () => {
    if (!editing) return;
    if (!editing.code || !editing.discount_value) return toast.error("Kod i vrednost su obavezni");
    const payload = {
      code: editing.code.trim().toUpperCase(),
      discount_type: editing.discount_type || "percent",
      discount_value: Number(editing.discount_value),
      active: editing.active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("coupons").update(payload).eq("id", editing.id)
      : await supabase.from("coupons").insert(payload);
    if (error) return toast.error("Greška: " + error.message);
    toast.success("Sačuvano");
    setEditing(null);
    loadAll();
  };

  const removeCoupon = async (c: Coupon) => {
    if (!confirm(`Obrisati kupon ${c.code}?`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) return toast.error("Greška: " + error.message);
    toast.success("Obrisano");
    loadAll();
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-4xl text-foreground mb-1">Popusti i kuponi</h1>
        <p className="font-body text-sm text-muted-foreground">Auto-popust po količini i kupon kodovi</p>
      </div>

      {/* Quantity discount */}
      <section className="bg-white border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Percent size={18} className="text-warm-brown" />
          <h2 className="font-heading text-2xl">Popust po količini u korpi</h2>
        </div>
        <p className="font-body text-sm text-muted-foreground mb-5">
          Kada kupac ima zadatu količinu artikala u korpi, automatski dobija procenat popusta.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
          <label className="block">
            <span className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5 font-body">Aktivno</span>
            <select
              value={qd.enabled ? "1" : "0"}
              onChange={(e) => setQd({ ...qd, enabled: e.target.value === "1" })}
              className="w-full px-3 py-2 border border-border bg-white font-body text-sm"
            >
              <option value="1">Da</option>
              <option value="0">Ne</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5 font-body">Min. komada</span>
            <input
              type="number" min={1}
              value={qd.min_quantity}
              onChange={(e) => setQd({ ...qd, min_quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-border font-body text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5 font-body">Popust (%)</span>
            <input
              type="number" min={0} max={100}
              value={qd.percent}
              onChange={(e) => setQd({ ...qd, percent: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-border font-body text-sm"
            />
          </label>
        </div>
        <button
          onClick={saveQd}
          disabled={savingQd}
          className="mt-5 bg-foreground text-background px-5 py-2.5 font-body text-xs tracking-[0.15em] uppercase disabled:opacity-50"
        >
          {savingQd ? "Čuvanje..." : "Sačuvaj"}
        </button>
        <p className="font-body text-xs text-muted-foreground mt-3">
          Trenutno: {qd.enabled ? `${qd.percent}% popusta na ${qd.min_quantity}+ komada` : "isključeno"}
        </p>
      </section>

      {/* Coupons */}
      <section className="bg-white border border-border p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-warm-brown" />
            <h2 className="font-heading text-2xl">Kupon kodovi</h2>
          </div>
          <button
            onClick={() => setEditing({ code: "", discount_type: "percent", discount_value: 10, active: true })}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase"
          >
            <Plus size={14} /> Novi kupon
          </button>
        </div>
        <p className="font-body text-xs text-muted-foreground mb-4">
          Napomena: kupon i auto-popust se ne kombinuju — kupac koristi samo jedan u isto vreme.
        </p>
        {coupons.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground py-4">Nema kupona. Kreirajte prvi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead className="bg-[#FAFAF8] text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Kod</th>
                  <th className="text-left p-3">Tip</th>
                  <th className="text-left p-3">Vrednost</th>
                  <th className="text-left p-3">Korišćenja</th>
                  <th className="text-left p-3">Aktivan</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-3 font-mono">{c.code}</td>
                    <td className="p-3">{c.discount_type === "percent" ? "Procenat" : "Fiksno (RSD)"}</td>
                    <td className="p-3">
                      {c.discount_type === "percent"
                        ? `${c.discount_value}%`
                        : `${Number(c.discount_value).toLocaleString("sr-RS")} RSD`}
                    </td>
                    <td className="p-3 text-muted-foreground">{c.uses_count || 0}</td>
                    <td className="p-3">{c.active ? "Da" : "Ne"}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(c)} className="p-2 hover:bg-[#FAFAF8]"><Pencil size={14} /></button>
                      <button onClick={() => removeCoupon(c)} className="p-2 hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-2xl">{editing.id ? "Izmeni kupon" : "Novi kupon"}</h2>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 font-body text-sm">
              <label className="block">
                <span className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">Kod</span>
                <input
                  value={editing.code || ""}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10"
                  className="w-full px-3 py-2 border border-border font-mono"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">Tip popusta</span>
                <select
                  value={editing.discount_type || "percent"}
                  onChange={(e) => setEditing({ ...editing, discount_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border bg-white"
                >
                  <option value="percent">Procenat (%)</option>
                  <option value="fixed">Fiksni iznos (RSD)</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">Vrednost</span>
                <input
                  type="number" min={0}
                  value={editing.discount_value ?? 0}
                  onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">Aktivan</span>
                <select
                  value={editing.active ? "1" : "0"}
                  onChange={(e) => setEditing({ ...editing, active: e.target.value === "1" })}
                  className="w-full px-3 py-2 border border-border bg-white"
                >
                  <option value="1">Da</option>
                  <option value="0">Ne</option>
                </select>
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={saveCoupon} className="bg-foreground text-background px-5 py-2.5 font-body text-xs tracking-[0.15em] uppercase">Sačuvaj</button>
                <button onClick={() => setEditing(null)} className="border border-border px-5 py-2.5 font-body text-xs tracking-[0.15em] uppercase">Otkaži</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscounts;
