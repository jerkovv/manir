import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Search, MailX, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CartStatus = "pending" | "converted" | "abandoned" | "unsubscribed";
type CartSource = "checkout" | "exit_intent" | "other" | string;

type CartItem = {
  id?: string;
  name?: string;
  size?: string | null;
  image?: string;
  price?: number;
  quantity?: number;
};

type AbandonedCart = {
  id: string;
  email: string;
  customer_name: string | null;
  status: CartStatus;
  source: CartSource | null;
  cart_data: CartItem[] | null;
  cart_total: number | null;
  created_at: string;
  updated_at: string | null;
  email_1_sent_at: string | null;
  email_2_sent_at: string | null;
  converted_at: string | null;
  unsubscribed_at: string | null;
};

type Stats = {
  last_30d_total: number;
  last_30d_pending: number;
  last_30d_converted: number;
  last_30d_abandoned: number;
  last_30d_unsubscribed: number;
  last_30d_conversion_rate: number;
  last_30d_recovered_revenue: number;
  last_30d_lost_revenue: number;
  all_time_total: number;
  all_time_converted: number;
  all_time_recovered_revenue: number;
};

type StatusFilter = "all" | CartStatus;

type LifecycleStage =
  | "awaiting_email_1"
  | "email_1_sent"
  | "email_2_sent"
  | "converted"
  | "abandoned"
  | "unsubscribed";

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<CartStatus, string> = {
  pending: "Na čekanju",
  converted: "Konvertovano",
  abandoned: "Otkazano",
  unsubscribed: "Odjavljen",
};

const STATUS_BADGE: Record<CartStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  converted: "bg-green-100 text-green-800",
  abandoned: "bg-stone-200 text-stone-700",
  unsubscribed: "bg-red-100 text-red-700",
};

const LIFECYCLE_LABEL: Record<LifecycleStage, string> = {
  awaiting_email_1: "Korpa kreirana",
  email_1_sent: "Prvi podsetnik poslat",
  email_2_sent: "Drugi podsetnik poslat",
  converted: "Konvertovano",
  abandoned: "Otkazano",
  unsubscribed: "Odjavljen",
};

const LIFECYCLE_BADGE: Record<LifecycleStage, string> = {
  awaiting_email_1: "bg-stone-100 text-stone-600 border border-stone-200",
  email_1_sent: "bg-amber-50 text-amber-700 border border-amber-200",
  email_2_sent: "bg-amber-100 text-amber-900 border border-amber-300",
  converted: "bg-green-50 text-green-800 border border-green-200",
  abandoned: "bg-stone-100 text-stone-600 border border-stone-200",
  unsubscribed: "bg-red-50 text-red-700 border border-red-200",
};

function lifecycleStage(c: AbandonedCart): LifecycleStage {
  if (c.status === "converted") return "converted";
  if (c.status === "unsubscribed") return "unsubscribed";
  if (c.status === "abandoned") return "abandoned";
  if (c.email_2_sent_at) return "email_2_sent";
  if (c.email_1_sent_at) return "email_1_sent";
  return "awaiting_email_1";
}

function formatRsd(value: number | null | undefined): string {
  const n = Number(value) || 0;
  return `${n.toLocaleString("sr-Latn-RS")} RSD`;
}

function sourceLabel(s: CartSource | null): string {
  if (s === "exit_intent") return "exit-intent";
  if (s === "checkout") return "checkout";
  if (!s) return "—";
  return s;
}

function sourceBadgeClass(s: CartSource | null): string {
  if (s === "exit_intent") return "border border-warm-brown/40 text-warm-brown bg-warm-cream/40";
  return "border border-border text-muted-foreground bg-background";
}

const AdminAbandonedCarts = () => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<AbandonedCart | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: c, error: ec }, { data: s }] = await Promise.all([
      supabase
        .from("abandoned_carts")
        .select("id, email, customer_name, status, source, cart_data, cart_total, created_at, updated_at, email_1_sent_at, email_2_sent_at, converted_at, unsubscribed_at")
        .order("created_at", { ascending: false }),
      supabase.from("abandoned_cart_stats").select("*").maybeSingle(),
    ]);
    if (ec) toast.error("Greška pri učitavanju: " + ec.message);
    setCarts((c as AbandonedCart[]) || []);
    setStats((s as Stats) || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c = { all: carts.length, pending: 0, converted: 0, abandoned: 0, unsubscribed: 0 };
    carts.forEach((x) => {
      if (x.status === "pending") c.pending++;
      else if (x.status === "converted") c.converted++;
      else if (x.status === "abandoned") c.abandoned++;
      else if (x.status === "unsubscribed") c.unsubscribed++;
    });
    return c;
  }, [carts]);

  const filtered = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    const q = search.trim().toLowerCase();
    return carts.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (fromTs != null && new Date(c.created_at).getTime() < fromTs) return false;
      if (toTs != null && new Date(c.created_at).getTime() > toTs) return false;
      if (q) {
        const hay = `${c.email} ${c.customer_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [carts, statusFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const allOnPageSelected = pageItems.length > 0 && pageItems.every((x) => selectedIds.has(x.id));
  const togglePageSelection = () => {
    const next = new Set(selectedIds);
    if (allOnPageSelected) pageItems.forEach((x) => next.delete(x.id));
    else pageItems.forEach((x) => next.add(x.id));
    setSelectedIds(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };
  const clearSelection = () => setSelectedIds(new Set());

  const remove = async (id: string) => {
    const { error } = await supabase.from("abandoned_carts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Korpa obrisana");
    setCarts((cs) => cs.filter((x) => x.id !== id));
    setSelectedIds((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { error } = await supabase.from("abandoned_carts").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} ${ids.length === 1 ? "korpa obrisana" : "korpi obrisano"}`);
    setCarts((cs) => cs.filter((x) => !ids.includes(x.id)));
    clearSelection();
    setConfirmBulkDelete(false);
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const completedFlows = (stats?.last_30d_converted ?? 0) + (stats?.last_30d_abandoned ?? 0) + (stats?.last_30d_unsubscribed ?? 0);
  const lostBreakdown = (() => {
    const a = stats?.last_30d_abandoned ?? 0;
    const u = stats?.last_30d_unsubscribed ?? 0;
    if (a === 0 && u === 0) return "0 korpi";
    const total = a + u;
    const parts: string[] = [];
    if (a > 0) parts.push(`${a} ${a === 1 ? "otkazana" : "otkazanih"}`);
    if (u > 0) parts.push(`${u} ${u === 1 ? "odjavljena" : "odjavljenih"}`);
    const totalLabel = `${total} ${total === 1 ? "korpa" : "korpi"}`;
    return `${totalLabel} (${parts.join(", ")})`;
  })();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-4xl text-foreground mb-1">Napuštene korpe</h1>
        <p className="font-body text-sm text-muted-foreground">
          {counts.pending} na čekanju · {counts.converted} konvertovano · {counts.abandoned} otkazano · {counts.unsubscribed} odjavljeno · {counts.all} ukupno
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-border p-5">
          <div className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Korpe (30d)</div>
          <div className="font-heading text-3xl text-foreground mb-3">{stats?.last_30d_total ?? 0}</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="font-body text-[10px] tracking-wider uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5">P {stats?.last_30d_pending ?? 0}</span>
            <span className="font-body text-[10px] tracking-wider uppercase bg-green-100 text-green-800 px-1.5 py-0.5">K {stats?.last_30d_converted ?? 0}</span>
            <span className="font-body text-[10px] tracking-wider uppercase bg-stone-200 text-stone-700 px-1.5 py-0.5">O {stats?.last_30d_abandoned ?? 0}</span>
            <span className="font-body text-[10px] tracking-wider uppercase bg-red-100 text-red-700 px-1.5 py-0.5">U {stats?.last_30d_unsubscribed ?? 0}</span>
          </div>
        </div>
        <div className="bg-white border border-border p-5">
          <div className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Conversion rate</div>
          <div className="font-heading text-3xl text-foreground mb-3">
            {stats ? `${Number(stats.last_30d_conversion_rate ?? 0).toFixed(1)}%` : "0.0%"}
          </div>
          <div className="font-body text-xs text-muted-foreground">
            od {completedFlows} {completedFlows === 1 ? "završenog flow-a" : "završenih flow-ova"}
          </div>
        </div>
        <div className="bg-white border border-border p-5">
          <div className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Recovered (30d)</div>
          <div className="font-heading text-3xl text-foreground mb-3">{formatRsd(stats?.last_30d_recovered_revenue)}</div>
          <div className="font-body text-xs text-muted-foreground">
            {stats?.last_30d_converted ?? 0} {(stats?.last_30d_converted ?? 0) === 1 ? "korpa konvertovana" : "korpi konvertovano"}
          </div>
        </div>
        <div className="bg-white border border-border p-5">
          <div className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Lost (30d)</div>
          <div className="font-heading text-3xl text-foreground mb-3">{formatRsd(stats?.last_30d_lost_revenue)}</div>
          <div className="font-body text-xs text-muted-foreground">{lostBreakdown}</div>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([
          ["all", `Sve (${counts.all})`],
          ["pending", `Na čekanju (${counts.pending})`],
          ["converted", `Konvertovano (${counts.converted})`],
          ["abandoned", `Otkazano (${counts.abandoned})`],
          ["unsubscribed", `Odjavljeno (${counts.unsubscribed})`],
        ] as [StatusFilter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 font-body text-xs tracking-wider uppercase border transition-colors ${
              statusFilter === key
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-border p-4 mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraga (email ili ime)"
            className="w-full pl-9 pr-3 py-2 border border-border font-body text-sm bg-background"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-border font-body text-sm bg-background"
          aria-label="Od datuma"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-border font-body text-sm bg-background"
          aria-label="Do datuma"
        />
        {(search || dateFrom || dateTo) && (
          <button
            onClick={clearFilters}
            className="lg:col-span-4 justify-self-start font-body text-[11px] tracking-wider uppercase text-muted-foreground underline hover:text-foreground"
          >
            Resetuj filtere
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-foreground text-background p-3 mb-4 flex items-center justify-between flex-wrap gap-3">
          <span className="font-body text-sm">
            {selectedIds.size} {selectedIds.size === 1 ? "selektovana" : "selektovano"}
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setConfirmBulkDelete(true)}
              className="flex items-center gap-1.5 border border-red-300 text-red-200 px-3 py-1.5 font-body text-xs tracking-wider uppercase"
            >
              <Trash2 size={12} /> Obriši sve
            </button>
            <button
              onClick={clearSelection}
              className="font-body text-xs tracking-wider uppercase underline opacity-80"
            >
              Poništi izbor
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="bg-white border border-border p-8 text-center font-body text-sm text-muted-foreground">
          Učitavanje...
        </div>
      ) : carts.length === 0 ? (
        <div className="bg-white border border-border p-12 text-center">
          <ShoppingCart size={32} className="mx-auto mb-3 text-muted-foreground/50" strokeWidth={1.25} />
          <div className="font-heading text-xl mb-1">Nema napuštenih korpi</div>
          <p className="font-body text-sm text-muted-foreground max-w-md mx-auto">
            Sve korpe iz checkout-a su uspešno završene. Pratite ovde ako se to promeni.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border p-8 text-center font-body text-sm text-muted-foreground">
          Nema korpi za prikazane filtere.
        </div>
      ) : (
        <>
          {/* Select-all bar */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={togglePageSelection}
              className="h-4 w-4"
              aria-label="Izaberi sve na stranici"
            />
            <span className="font-body text-xs text-muted-foreground">
              Izaberi sve na stranici ({pageItems.length})
            </span>
          </div>

          <div className="space-y-3">
            {pageItems.map((c) => {
              const isSelected = selectedIds.has(c.id);
              const stage = lifecycleStage(c);
              const items = Array.isArray(c.cart_data) ? c.cart_data : [];
              return (
                <div key={c.id} className={`bg-white border p-5 transition-colors ${isSelected ? "border-foreground" : "border-border"}`}>
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(c.id)}
                      className="h-4 w-4 mt-1.5"
                      aria-label="Izaberi korpu"
                    />
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-heading text-lg break-all">{c.email}</span>
                            {c.customer_name && (
                              <span className="font-body text-sm text-muted-foreground">· {c.customer_name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-body text-[10px] uppercase tracking-wider px-2 py-0.5 ${STATUS_BADGE[c.status]}`}>
                              {STATUS_LABEL[c.status]}
                            </span>
                            <span className={`font-body text-[10px] uppercase tracking-wider px-2 py-0.5 ${LIFECYCLE_BADGE[stage]}`}>
                              {LIFECYCLE_LABEL[stage]}
                            </span>
                            <span className={`font-body text-[10px] uppercase tracking-wider px-2 py-0.5 ${sourceBadgeClass(c.source)}`}>
                              {sourceLabel(c.source)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-heading text-xl text-foreground">{formatRsd(c.cart_total)}</div>
                          <div className="font-body text-[11px] text-muted-foreground">
                            {items.length} {items.length === 1 ? "proizvod" : "proizvoda"}
                          </div>
                        </div>
                      </div>

                      {/* Meta dates */}
                      <div className="font-body text-xs text-muted-foreground mb-3 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Kreirano: {formatDate(c.created_at)}</span>
                        {c.email_1_sent_at && <span>· Email 1: {formatDate(c.email_1_sent_at)}</span>}
                        {c.email_2_sent_at && <span>· Email 2: {formatDate(c.email_2_sent_at)}</span>}
                        {c.converted_at && <span>· Konvertovano: {formatDate(c.converted_at)}</span>}
                        {c.unsubscribed_at && <span>· Odjavljen: {formatDate(c.unsubscribed_at)}</span>}
                      </div>

                      {/* Items */}
                      {items.length > 0 && (
                        <div className="border-t border-border pt-3 mb-4 space-y-2">
                          {items.map((it, idx) => {
                            const qty = Number(it.quantity) || 1;
                            const price = Number(it.price) || 0;
                            return (
                              <div key={`${c.id}-${idx}`} className="flex items-center gap-3">
                                {it.image ? (
                                  <img
                                    src={it.image}
                                    alt={it.name || ""}
                                    className="w-12 h-12 object-cover bg-warm-cream/50 border border-border"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-warm-cream/50 border border-border" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-body text-sm text-foreground truncate">
                                    {it.name || "—"}
                                    {it.size && <span className="text-muted-foreground"> · {it.size}</span>}
                                  </div>
                                  <div className="font-body text-xs text-muted-foreground">
                                    {qty} × {formatRsd(price)}
                                  </div>
                                </div>
                                <div className="font-body text-sm text-foreground">{formatRsd(qty * price)}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setConfirmDelete(c)}
                          className="flex items-center gap-1.5 border border-border text-red-600 px-3 py-1.5 font-body text-xs tracking-wider uppercase ml-auto"
                        >
                          <Trash2 size={12} /> Obriši
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
              <span className="font-body text-xs text-muted-foreground">
                Stranica {pageSafe} / {totalPages} · {filtered.length} korpi
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pageSafe === 1}
                  className="border border-border px-3 py-1.5 font-body text-xs tracking-wider uppercase disabled:opacity-40"
                >
                  Prethodna
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={pageSafe === totalPages}
                  className="border border-border px-3 py-1.5 font-body text-xs tracking-wider uppercase disabled:opacity-40"
                >
                  Sledeća
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm delete (single) */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trajno obrisati korpu?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija ne može da se poništi. Korpa će biti uklonjena iz baze i više se neće voditi statistika za nju.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (confirmDelete) remove(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm bulk delete */}
      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Trajno obrisati {selectedIds.size} {selectedIds.size === 1 ? "korpu" : "korpi"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija ne može da se poništi. Sve izabrane korpe će biti uklonjene iz baze.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={bulkDelete}>
              Obriši sve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// MailX icon imported but unused-safe (kept for potential header icon usage).
void MailX;

export default AdminAbandonedCarts;