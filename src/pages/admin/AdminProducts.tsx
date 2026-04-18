import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  stock_status: string;
  visible: boolean;
};

const empty: Partial<Product> = { slug: "", name: "", description: "", price: 0, images: [], stock_status: "in_stock", visible: true };

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [imagesText, setImagesText] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing({ ...empty }); setImagesText(""); };
  const openEdit = (p: Product) => { setEditing(p); setImagesText((p.images || []).join("\n")); };

  const save = async () => {
    if (!editing) return;
    if (!editing.name || !editing.slug || !editing.price) {
      return toast.error("Naziv, slug i cena su obavezni");
    }
    const payload = {
      slug: editing.slug,
      name: editing.name,
      description: editing.description || null,
      price: Number(editing.price),
      images: imagesText.split("\n").map((s) => s.trim()).filter(Boolean),
      stock_status: editing.stock_status || "in_stock",
      visible: editing.visible ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error("Greška: " + error.message);
    toast.success("Sačuvano");
    setEditing(null);
    load();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Obrisati "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error("Greška: " + error.message);
    toast.success("Obrisano");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-4xl text-foreground mb-1">Proizvodi</h1>
          <p className="font-body text-sm text-muted-foreground">{products.length} proizvoda</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase">
          <Plus size={14} /> Novi proizvod
        </button>
      </div>

      <div className="bg-white border border-border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center font-body text-sm text-muted-foreground">Učitavanje...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center font-body text-sm text-muted-foreground">Nema proizvoda. Dodajte prvi.</div>
        ) : (
          <table className="w-full font-body text-sm">
            <thead className="bg-[#FAFAF8] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-4">Slika</th>
                <th className="text-left p-4">Naziv</th>
                <th className="text-left p-4">Slug</th>
                <th className="text-left p-4">Cena</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Vidljivo</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-4">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover" /> : <div className="w-12 h-12 bg-[#F5F0E8]" />}
                  </td>
                  <td className="p-4">{p.name}</td>
                  <td className="p-4 text-muted-foreground">{p.slug}</td>
                  <td className="p-4">{Number(p.price).toLocaleString("sr-RS")} RSD</td>
                  <td className="p-4 text-muted-foreground">{p.stock_status === "in_stock" ? "Na stanju" : "Nema"}</td>
                  <td className="p-4">{p.visible ? "Da" : "Ne"}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="p-2 hover:bg-[#FAFAF8]"><Pencil size={14} /></button>
                    <button onClick={() => remove(p)} className="p-2 hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-2xl">{editing.id ? "Izmeni proizvod" : "Novi proizvod"}</h2>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 font-body text-sm">
              <Field label="Naziv">
                <input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 border border-border" />
              </Field>
              <Field label="Slug (URL)">
                <input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="serum-0202" className="w-full px-3 py-2 border border-border" />
              </Field>
              <Field label="Cena (RSD)">
                <input type="number" value={editing.price || 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-border" />
              </Field>
              <Field label="Opis">
                <textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-border" />
              </Field>
              <Field label="Slike (URL po liniji)">
                <textarea value={imagesText} onChange={(e) => setImagesText(e.target.value)} rows={3} placeholder="https://..." className="w-full px-3 py-2 border border-border" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Stanje">
                  <select value={editing.stock_status} onChange={(e) => setEditing({ ...editing, stock_status: e.target.value })} className="w-full px-3 py-2 border border-border bg-white">
                    <option value="in_stock">Na stanju</option>
                    <option value="out_of_stock">Nema na stanju</option>
                  </select>
                </Field>
                <Field label="Vidljivo">
                  <select value={editing.visible ? "1" : "0"} onChange={(e) => setEditing({ ...editing, visible: e.target.value === "1" })} className="w-full px-3 py-2 border border-border bg-white">
                    <option value="1">Da</option>
                    <option value="0">Ne</option>
                  </select>
                </Field>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={save} className="bg-foreground text-background px-5 py-2.5 font-body text-xs tracking-[0.15em] uppercase">Sačuvaj</button>
                <button onClick={() => setEditing(null)} className="border border-border px-5 py-2.5 font-body text-xs tracking-[0.15em] uppercase">Otkaži</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">{label}</span>
    {children}
  </label>
);

export default AdminProducts;
