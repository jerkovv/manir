import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import MultiImageUpload from "@/components/admin/MultiImageUpload";

type IngredientBenefit = { name: string; benefit: string };

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  size: string | null;
  category: string | null;
  category_slug: string | null;
  images: string[];
  stock_status: string;
  visible: boolean;
  featured: boolean;
  position: number;
  target_audience: string | null;
  benefits: string[];
  free_from: string[];
  ingredients_benefits: IngredientBenefit[];
  active_ingredients_count: number | null;
  usage: string | null;
  inci: string | null;
  composition_note: string | null;
};

const empty: Partial<Product> = {
  slug: "", name: "", description: "", short_description: "",
  price: 0, size: "", category: "", category_slug: "",
  images: [], stock_status: "in_stock", visible: true, featured: false, position: 0,
  target_audience: "", benefits: [], free_from: [], ingredients_benefits: [],
  active_ingredients_count: null, usage: "", inci: "", composition_note: "",
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  // images now managed directly on editing.images via MultiImageUpload

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing({ ...empty }); };
  const openEdit = (p: Product) => { setEditing(p); };

  const save = async () => {
    if (!editing) return;
    if (!editing.name || !editing.slug || !editing.price) {
      return toast.error("Naziv, slug i cena su obavezni");
    }
    const payload = {
      slug: editing.slug,
      name: editing.name,
      description: editing.description || null,
      short_description: editing.short_description || null,
      price: Number(editing.price),
      size: editing.size || null,
      category: editing.category || null,
      category_slug: editing.category_slug || null,
      images: editing.images || [],
      stock_status: editing.stock_status || "in_stock",
      visible: editing.visible ?? true,
      featured: editing.featured ?? false,
      position: Number(editing.position) || 0,
      target_audience: editing.target_audience || null,
      benefits: editing.benefits || [],
      free_from: editing.free_from || [],
      ingredients_benefits: editing.ingredients_benefits || [],
      active_ingredients_count: editing.active_ingredients_count ?? null,
      usage: editing.usage || null,
      inci: editing.inci || null,
      composition_note: editing.composition_note || null,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload as any).eq("id", editing.id)
      : await supabase.from("products").insert(payload as any);
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
          <div onClick={(e) => e.stopPropagation()} className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-white z-10">
              <h2 className="font-heading text-2xl">{editing.id ? "Izmeni proizvod" : "Novi proizvod"}</h2>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 font-body text-sm">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Naziv">
                  <input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 border border-border" />
                </Field>
                <Field label="Slug (URL)">
                  <input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="serum-k1" className="w-full px-3 py-2 border border-border" />
                </Field>
                <Field label="Cena (RSD)">
                  <input type="number" value={editing.price || 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-border" />
                </Field>
                <Field label="Veličina (npr. 100 ml)">
                  <input value={editing.size || ""} onChange={(e) => setEditing({ ...editing, size: e.target.value })} className="w-full px-3 py-2 border border-border" />
                </Field>
                <Field label="Kategorija (naziv)">
                  <input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Mom & Baby" className="w-full px-3 py-2 border border-border" />
                </Field>
                <Field label="Kategorija (slug)">
                  <input value={editing.category_slug || ""} onChange={(e) => setEditing({ ...editing, category_slug: e.target.value })} placeholder="mom-baby" className="w-full px-3 py-2 border border-border" />
                </Field>
              </div>

              <Field label="Kratak opis (za karticu)">
                <textarea value={editing.short_description || ""} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-border" />
              </Field>
              <Field label="Pun opis">
                <textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={5} className="w-full px-3 py-2 border border-border" />
              </Field>
              <Field label="Kome je namenjen">
                <textarea value={editing.target_audience || ""} onChange={(e) => setEditing({ ...editing, target_audience: e.target.value })} rows={2} className="w-full px-3 py-2 border border-border" />
              </Field>

              <Field label="Slike">
                <MultiImageUpload value={editing.images || []} onChange={(images) => setEditing({ ...editing, images })} folder="products" />
              </Field>

              <Field label="Benefiti (jedan po liniji)">
                <textarea
                  value={(editing.benefits || []).join("\n")}
                  onChange={(e) => setEditing({ ...editing, benefits: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })}
                  rows={5} className="w-full px-3 py-2 border border-border" />
              </Field>
              <Field label='"Bez" lista (jedan po liniji)'>
                <textarea
                  value={(editing.free_from || []).join("\n")}
                  onChange={(e) => setEditing({ ...editing, free_from: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })}
                  rows={4} className="w-full px-3 py-2 border border-border" />
              </Field>

              <Field label="Aktivni sastojci (Naziv | Benefit, jedan po liniji)">
                <textarea
                  value={(editing.ingredients_benefits || []).map(i => `${i.name} | ${i.benefit}`).join("\n")}
                  onChange={(e) => {
                    const arr = e.target.value.split("\n").map(line => {
                      const [name, ...rest] = line.split("|");
                      return { name: (name || "").trim(), benefit: rest.join("|").trim() };
                    }).filter(i => i.name);
                    setEditing({ ...editing, ingredients_benefits: arr });
                  }}
                  rows={6}
                  placeholder="Glicerin | Obezbeđuje hidrataciju kože"
                  className="w-full px-3 py-2 border border-border font-mono text-xs" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Broj aktivnih sastojaka">
                  <input type="number" value={editing.active_ingredients_count ?? ""} onChange={(e) => setEditing({ ...editing, active_ingredients_count: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 border border-border" />
                </Field>
                <Field label="Pozicija (sortiranje)">
                  <input type="number" value={editing.position ?? 0} onChange={(e) => setEditing({ ...editing, position: Number(e.target.value) })} className="w-full px-3 py-2 border border-border" />
                </Field>
              </div>

              <Field label="Način korišćenja">
                <textarea value={editing.usage || ""} onChange={(e) => setEditing({ ...editing, usage: e.target.value })} rows={3} className="w-full px-3 py-2 border border-border" />
              </Field>
              <Field label="INCI sastav">
                <textarea value={editing.inci || ""} onChange={(e) => setEditing({ ...editing, inci: e.target.value })} rows={3} className="w-full px-3 py-2 border border-border font-mono text-xs" />
              </Field>
              <Field label="Napomena o sastavu">
                <textarea value={editing.composition_note || ""} onChange={(e) => setEditing({ ...editing, composition_note: e.target.value })} rows={2} className="w-full px-3 py-2 border border-border" />
              </Field>

              <div className="grid grid-cols-3 gap-4">
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
                <Field label="Istaknuto (početna)">
                  <select value={editing.featured ? "1" : "0"} onChange={(e) => setEditing({ ...editing, featured: e.target.value === "1" })} className="w-full px-3 py-2 border border-border bg-white">
                    <option value="0">Ne</option>
                    <option value="1">Da</option>
                  </select>
                </Field>
              </div>

              <div className="flex gap-2 pt-2 sticky bottom-0 bg-white border-t border-border -mx-5 px-5 py-3">
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
