import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Page = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published: boolean;
  created_at: string;
};

const empty: Partial<Page> = { slug: "", title: "", body: "", featured_image: "", meta_title: "", meta_description: "", published: false };

const AdminPages = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Page> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("pages").select("*").order("created_at", { ascending: false });
    setPages((data as Page[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title || !editing.slug) return toast.error("Naslov i slug su obavezni");
    const payload = {
      slug: editing.slug,
      title: editing.title,
      body: editing.body || null,
      featured_image: editing.featured_image || null,
      meta_title: editing.meta_title || null,
      meta_description: editing.meta_description || null,
      published: editing.published ?? false,
    };
    const { error } = editing.id
      ? await supabase.from("pages").update(payload).eq("id", editing.id)
      : await supabase.from("pages").insert(payload);
    if (error) return toast.error("Greška: " + error.message);
    toast.success("Sačuvano");
    setEditing(null);
    load();
  };

  const remove = async (p: Page) => {
    if (!confirm(`Obrisati "${p.title}"?`)) return;
    const { error } = await supabase.from("pages").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Obrisano");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-4xl text-foreground mb-1">Stranice</h1>
          <p className="font-body text-sm text-muted-foreground">{pages.length} stranica</p>
        </div>
        <button onClick={() => setEditing({ ...empty })} className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase">
          <Plus size={14} /> Nova stranica
        </button>
      </div>

      <div className="bg-white border border-border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center font-body text-sm text-muted-foreground">Učitavanje...</div>
        ) : pages.length === 0 ? (
          <div className="p-8 text-center font-body text-sm text-muted-foreground">Nema stranica.</div>
        ) : (
          <table className="w-full font-body text-sm">
            <thead className="bg-[#FAFAF8] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-4">Naslov</th>
                <th className="text-left p-4">Slug</th>
                <th className="text-left p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-4">{p.title}</td>
                  <td className="p-4 text-muted-foreground">/{p.slug}</td>
                  <td className="p-4">
                    {p.published ? (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 text-[11px] uppercase tracking-wider">Objavljena</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 text-[11px] uppercase tracking-wider">Skica</span>
                    )}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(p)} className="p-2 hover:bg-[#FAFAF8]"><Pencil size={14} /></button>
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
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-2xl">{editing.id ? "Izmeni stranicu" : "Nova stranica"}</h2>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 font-body text-sm">
              <Field label="Naslov">
                <input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-border" />
              </Field>
              <Field label="Slug (URL)">
                <input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="uslovi-koriscenja" className="w-full px-3 py-2 border border-border" />
              </Field>
              <Field label="Sadržaj (Markdown / HTML)">
                <textarea value={editing.body || ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={12} className="w-full px-3 py-2 border border-border font-mono text-xs" />
              </Field>
              <Field label="URL naslovne slike">
                <input value={editing.featured_image || ""} onChange={(e) => setEditing({ ...editing, featured_image: e.target.value })} className="w-full px-3 py-2 border border-border" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Meta naslov (SEO)">
                  <input value={editing.meta_title || ""} onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })} className="w-full px-3 py-2 border border-border" />
                </Field>
                <Field label="Status">
                  <select value={editing.published ? "1" : "0"} onChange={(e) => setEditing({ ...editing, published: e.target.value === "1" })} className="w-full px-3 py-2 border border-border bg-white">
                    <option value="0">Skica</option>
                    <option value="1">Objavi</option>
                  </select>
                </Field>
              </div>
              <Field label="Meta opis (SEO)">
                <textarea value={editing.meta_description || ""} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-border" />
              </Field>
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

export default AdminPages;
