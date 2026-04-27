import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { downloadCSV } from "@/lib/csv";
import { Download, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Customer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  total_orders: number;
  created_at: string;
};

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    setCustomers((data as Customer[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteCustomer = async (c: Customer) => {
    const name = `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email;
    if (!confirm(`Obrisati kupca "${name}"? Ova akcija se ne može poništiti.`)) return;
    const { data, error } = await supabase.functions.invoke("delete-customer", { body: { customer_id: c.id } });
    if (error || (data as any)?.error) return toast.error("Greška: " + (error?.message || (data as any)?.error));
    toast.success("Kupac obrisan");
    setCustomers((current) => current.filter((customer) => customer.id !== c.id));
  };

  const filtered = customers.filter((c) => {
    const term = q.toLowerCase();
    return (
      !term ||
      c.email.toLowerCase().includes(term) ||
      `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase().includes(term) ||
      (c.phone || "").includes(term)
    );
  });

  const exportCSV = () => {
    const rows = filtered.map((c) => ({
      ime: c.first_name || "",
      prezime: c.last_name || "",
      email: c.email,
      telefon: c.phone || "",
      grad: c.city || "",
      broj_porudzbina: c.total_orders,
      registrovan: new Date(c.created_at).toLocaleDateString("sr-RS"),
    }));
    downloadCSV(`kupci-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-4xl text-foreground mb-1">Kupci</h1>
          <p className="font-body text-sm text-muted-foreground">{filtered.length} kupaca</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 font-body text-xs tracking-[0.15em] uppercase">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pretraga po imenu, emailu, telefonu..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border font-body text-sm focus:outline-none focus:border-foreground"
        />
      </div>

      <div className="bg-white border border-border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center font-body text-sm text-muted-foreground">Učitavanje...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center font-body text-sm text-muted-foreground">Nema kupaca.</div>
        ) : (
          <table className="w-full font-body text-sm">
            <thead className="bg-[#FAFAF8] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-4">Ime</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Telefon</th>
                <th className="text-left p-4">Grad</th>
                <th className="text-left p-4">Porudžbine</th>
                <th className="text-left p-4">Registrovan</th>
                <th className="text-right p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-4">{c.first_name} {c.last_name}</td>
                  <td className="p-4 text-muted-foreground">{c.email}</td>
                  <td className="p-4 text-muted-foreground">{c.phone || "—"}</td>
                  <td className="p-4 text-muted-foreground">{c.city || "—"}</td>
                  <td className="p-4">{c.total_orders}</td>
                  <td className="p-4 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("sr-RS")}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => deleteCustomer(c)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      title="Obriši kupca"
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
    </div>
  );
};

export default AdminCustomers;
