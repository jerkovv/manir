import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

type Review = {
  id: string;
  product_id: string;
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  review_text: string;
  verified_purchase: boolean;
  approved: boolean;
  created_at: string;
};

type Product = { id: string; name: string };

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name"),
    ]);
    setReviews((r as Review[]) || []);
    const map: Record<string, string> = {};
    ((p as Product[]) || []).forEach((x) => (map[x.id] = x.name));
    setProducts(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setApproved = async (id: string, approved: boolean) => {
    const { error } = await supabase.from("reviews").update({ approved }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(approved ? "Odobreno" : "Skinuto sa sajta");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Obrisati recenziju?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Obrisano");
    load();
  };

  const filtered = reviews.filter((r) => filter === "all" ? true : filter === "approved" ? r.approved : !r.approved);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-4xl text-foreground mb-1">Recenzije</h1>
        <p className="font-body text-sm text-muted-foreground">{filtered.length} recenzija</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 font-body text-xs tracking-wider uppercase border ${filter === f ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
            {f === "pending" ? "Na čekanju" : f === "approved" ? "Odobrene" : "Sve"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-border p-8 text-center font-body text-sm text-muted-foreground">Učitavanje...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border p-8 text-center font-body text-sm text-muted-foreground">Nema recenzija.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white border border-border p-5">
              <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading text-lg">{r.reviewer_name}</span>
                    {r.verified_purchase && <span className="font-body text-[10px] uppercase tracking-wider bg-green-100 text-green-800 px-2 py-0.5">Verifikovan</span>}
                    {r.approved ? (
                      <span className="font-body text-[10px] uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5">Objavljena</span>
                    ) : (
                      <span className="font-body text-[10px] uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5">Na čekanju</span>
                    )}
                  </div>
                  <div className="font-body text-xs text-muted-foreground">
                    {products[r.product_id] || "-"} · {new Date(r.created_at).toLocaleDateString("sr-Latn-RS")}
                    {r.reviewer_email && ` · ${r.reviewer_email}`}
                  </div>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={14} className={i <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                  ))}
                </div>
              </div>
              <p className="font-body text-sm text-foreground mb-4">{r.review_text}</p>
              <div className="flex gap-2">
                {!r.approved ? (
                  <button onClick={() => setApproved(r.id, true)} className="flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 font-body text-xs tracking-wider uppercase">
                    <Check size={12} /> Odobri
                  </button>
                ) : (
                  <button onClick={() => setApproved(r.id, false)} className="flex items-center gap-1.5 border border-border px-3 py-1.5 font-body text-xs tracking-wider uppercase">
                    <X size={12} /> Skini
                  </button>
                )}
                <button onClick={() => remove(r.id)} className="flex items-center gap-1.5 border border-border text-red-600 px-3 py-1.5 font-body text-xs tracking-wider uppercase">
                  <Trash2 size={12} /> Obriši
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
