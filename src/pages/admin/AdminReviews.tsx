import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Trash2, Star, RotateCcw, MessageSquare, Search } from "lucide-react";
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

type ReviewStatus = "pending" | "approved" | "rejected";

type Review = {
  id: string;
  product_id: string;
  order_id: string | null;
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  review_text: string;
  verified_purchase: boolean;
  status: ReviewStatus;
  admin_response: string | null;
  admin_response_at: string | null;
  created_at: string;
};

type Product = { id: string; name: string };

type StatusFilter = "all" | ReviewStatus;

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Na čekanju",
  approved: "Odobrena",
  rejected: "Odbijena",
};

const STATUS_BADGE: Record<ReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 20;

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Response editor (per-row)
  const [responseEditing, setResponseEditing] = useState<Record<string, string>>({});
  const [responseOpen, setResponseOpen] = useState<Set<string>>(new Set());
  const [savingResponse, setSavingResponse] = useState<string | null>(null);

  // Confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmReject, setConfirmReject] = useState<Review | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: r, error: er }, { data: p }] = await Promise.all([
      supabase
        .from("reviews")
        .select("id, product_id, order_id, reviewer_name, reviewer_email, rating, review_text, verified_purchase, status, admin_response, admin_response_at, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("products").select("id, name").order("name", { ascending: true }),
    ]);
    if (er) toast.error("Greška pri učitavanju: " + er.message);
    setReviews((r as Review[]) || []);
    setProducts((p as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const productsMap = useMemo(() => {
    const m: Record<string, string> = {};
    products.forEach((p) => (m[p.id] = p.name));
    return m;
  }, [products]);

  // Counts (across all reviews, not filtered)
  const counts = useMemo(() => {
    const c = { all: reviews.length, pending: 0, approved: 0, rejected: 0 };
    reviews.forEach((r) => {
      if (r.status === "pending") c.pending++;
      else if (r.status === "approved") c.approved++;
      else if (r.status === "rejected") c.rejected++;
    });
    return c;
  }, [reviews]);

  // Apply filters
  const filtered = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (productFilter !== "all" && r.product_id !== productFilter) return false;
      if (ratingFilter !== "all" && r.rating !== Number(ratingFilter)) return false;
      if (fromTs != null && new Date(r.created_at).getTime() < fromTs) return false;
      if (toTs != null && new Date(r.created_at).getTime() > toTs) return false;
      if (q) {
        const hay = `${r.reviewer_name} ${r.review_text} ${r.reviewer_email ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, statusFilter, productFilter, ratingFilter, dateFrom, dateTo, search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, productFilter, ratingFilter, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const allOnPageSelected = pageItems.length > 0 && pageItems.every((r) => selectedIds.has(r.id));
  const togglePageSelection = () => {
    const next = new Set(selectedIds);
    if (allOnPageSelected) pageItems.forEach((r) => next.delete(r.id));
    else pageItems.forEach((r) => next.add(r.id));
    setSelectedIds(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };
  const clearSelection = () => setSelectedIds(new Set());

  // ---- Mutations ----
  const setStatus = async (id: string, status: ReviewStatus) => {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(
      status === "approved" ? "Recenzija odobrena" : status === "rejected" ? "Recenzija odbijena" : "Vraćeno u red",
    );
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Obrisano");
    setReviews((rs) => rs.filter((r) => r.id !== id));
    setSelectedIds((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  const bulkSetStatus = async (status: ReviewStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { error } = await supabase.from("reviews").update({ status }).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} recenzija ažurirano`);
    setReviews((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));
    clearSelection();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { error } = await supabase.from("reviews").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} recenzija obrisano`);
    setReviews((rs) => rs.filter((r) => !ids.includes(r.id)));
    clearSelection();
    setConfirmBulkDelete(false);
  };

  const toggleResponse = (r: Review) => {
    const next = new Set(responseOpen);
    if (next.has(r.id)) {
      next.delete(r.id);
    } else {
      next.add(r.id);
      setResponseEditing((prev) => ({ ...prev, [r.id]: r.admin_response ?? "" }));
    }
    setResponseOpen(next);
  };

  const saveResponse = async (r: Review) => {
    const text = (responseEditing[r.id] ?? "").trim();
    setSavingResponse(r.id);
    const payload =
      text.length === 0
        ? { admin_response: null, admin_response_at: null }
        : { admin_response: text, admin_response_at: new Date().toISOString() };
    const { error } = await supabase.from("reviews").update(payload).eq("id", r.id);
    setSavingResponse(null);
    if (error) return toast.error(error.message);
    toast.success(text.length === 0 ? "Odgovor obrisan" : "Odgovor sačuvan");
    setReviews((rs) => rs.map((x) => (x.id === r.id ? { ...x, ...payload } as Review : x)));
    const next = new Set(responseOpen);
    next.delete(r.id);
    setResponseOpen(next);
  };

  const clearFilters = () => {
    setProductFilter("all");
    setRatingFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-4xl text-foreground mb-1">Recenzije</h1>
        <p className="font-body text-sm text-muted-foreground">
          {counts.pending} na čekanju · {counts.approved} odobrenih · {counts.rejected} odbijenih · {counts.all} ukupno
        </p>
      </div>

      {/* Status pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([
          ["pending", `Na čekanju (${counts.pending})`],
          ["approved", `Odobrene (${counts.approved})`],
          ["rejected", `Odbijene (${counts.rejected})`],
          ["all", `Sve (${counts.all})`],
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
      <div className="bg-white border border-border p-4 mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraga (ime, tekst, email)"
            className="w-full pl-9 pr-3 py-2 border border-border font-body text-sm bg-background"
          />
        </div>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="px-3 py-2 border border-border font-body text-sm bg-background"
        >
          <option value="all">Svi proizvodi</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="px-3 py-2 border border-border font-body text-sm bg-background"
        >
          <option value="all">Sve ocene</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "zvezda" : "zvezdice"}
            </option>
          ))}
        </select>
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
        {(productFilter !== "all" || ratingFilter !== "all" || dateFrom || dateTo || search) && (
          <button
            onClick={clearFilters}
            className="lg:col-span-6 justify-self-start font-body text-[11px] tracking-wider uppercase text-muted-foreground underline hover:text-foreground"
          >
            Resetuj filtere
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-foreground text-background p-3 mb-4 flex items-center justify-between flex-wrap gap-3">
          <span className="font-body text-sm">
            {selectedIds.size} {selectedIds.size === 1 ? "izabrana" : "izabrano"}
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => bulkSetStatus("approved")}
              className="flex items-center gap-1.5 bg-background text-foreground px-3 py-1.5 font-body text-xs tracking-wider uppercase"
            >
              <Check size={12} /> Odobri sve
            </button>
            <button
              onClick={() => bulkSetStatus("rejected")}
              className="flex items-center gap-1.5 border border-background/40 px-3 py-1.5 font-body text-xs tracking-wider uppercase"
            >
              <X size={12} /> Odbij sve
            </button>
            <button
              onClick={() => bulkSetStatus("pending")}
              className="flex items-center gap-1.5 border border-background/40 px-3 py-1.5 font-body text-xs tracking-wider uppercase"
            >
              <RotateCcw size={12} /> Vrati u red
            </button>
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
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border p-8 text-center font-body text-sm text-muted-foreground">
          Nema recenzija za izabrane filtere.
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
            {pageItems.map((r) => {
              const isOpen = responseOpen.has(r.id);
              const isSelected = selectedIds.has(r.id);
              return (
                <div key={r.id} className={`bg-white border p-5 transition-colors ${isSelected ? "border-foreground" : "border-border"}`}>
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(r.id)}
                      className="h-4 w-4 mt-1.5"
                      aria-label="Izaberi recenziju"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-heading text-lg">{r.reviewer_name}</span>
                            {r.verified_purchase && (
                              <span className="font-body text-[10px] uppercase tracking-wider bg-green-100 text-green-800 px-2 py-0.5">
                                Verifikovan
                              </span>
                            )}
                            <span
                              className={`font-body text-[10px] uppercase tracking-wider px-2 py-0.5 ${STATUS_BADGE[r.status]}`}
                            >
                              {STATUS_LABEL[r.status]}
                            </span>
                          </div>
                          <div className="font-body text-xs text-muted-foreground">
                            {productsMap[r.product_id] || "-"} · {formatDate(r.created_at)}
                            {r.reviewer_email && ` · ${r.reviewer_email}`}
                          </div>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="font-body text-sm text-foreground mb-4 whitespace-pre-line">{r.review_text}</p>

                      {r.admin_response && !isOpen && (
                        <div className="mb-4 pl-4 border-l-2 border-warm-brown/40 bg-warm-cream/40 p-3">
                          <div className="font-body text-[10px] tracking-[0.2em] uppercase text-warm-brown mb-1">
                            Odgovor 0202skin{r.admin_response_at ? ` · ${formatDate(r.admin_response_at)}` : ""}
                          </div>
                          <p className="font-body text-[13px] text-muted-foreground whitespace-pre-line">
                            {r.admin_response}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {r.status === "pending" && (
                          <>
                            <button
                              onClick={() => setStatus(r.id, "approved")}
                              className="flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 font-body text-xs tracking-wider uppercase"
                            >
                              <Check size={12} /> Odobri
                            </button>
                            <button
                              onClick={() => setConfirmReject(r)}
                              className="flex items-center gap-1.5 border border-border px-3 py-1.5 font-body text-xs tracking-wider uppercase"
                            >
                              <X size={12} /> Odbij
                            </button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <>
                            <button
                              onClick={() => setConfirmReject(r)}
                              className="flex items-center gap-1.5 border border-border px-3 py-1.5 font-body text-xs tracking-wider uppercase"
                            >
                              <X size={12} /> Skini sa sajta
                            </button>
                            <button
                              onClick={() => toggleResponse(r)}
                              className="flex items-center gap-1.5 border border-border px-3 py-1.5 font-body text-xs tracking-wider uppercase"
                            >
                              <MessageSquare size={12} />
                              {r.admin_response ? "Uredi odgovor" : "Dodaj odgovor"}
                            </button>
                          </>
                        )}
                        {r.status === "rejected" && (
                          <button
                            onClick={() => setStatus(r.id, "pending")}
                            className="flex items-center gap-1.5 border border-border px-3 py-1.5 font-body text-xs tracking-wider uppercase"
                          >
                            <RotateCcw size={12} /> Vrati u red
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete(r)}
                          className="flex items-center gap-1.5 border border-border text-red-600 px-3 py-1.5 font-body text-xs tracking-wider uppercase ml-auto"
                        >
                          <Trash2 size={12} /> Obriši
                        </button>
                      </div>

                      {/* Response editor */}
                      {isOpen && (
                        <div className="mt-4 border-t border-border pt-4">
                          <label className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                            Odgovor brenda
                          </label>
                          <textarea
                            value={responseEditing[r.id] ?? ""}
                            onChange={(e) =>
                              setResponseEditing((prev) => ({ ...prev, [r.id]: e.target.value }))
                            }
                            rows={4}
                            placeholder="Hvala vam na utisku..."
                            className="w-full px-3 py-2 border border-border font-body text-sm bg-background"
                          />
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <button
                              onClick={() => saveResponse(r)}
                              disabled={savingResponse === r.id}
                              className="bg-foreground text-background px-3 py-1.5 font-body text-xs tracking-wider uppercase disabled:opacity-50"
                            >
                              {savingResponse === r.id ? "Čuvanje..." : "Sačuvaj odgovor"}
                            </button>
                            {r.admin_response && (
                              <button
                                onClick={() => {
                                  setResponseEditing((prev) => ({ ...prev, [r.id]: "" }));
                                  saveResponse({ ...r, admin_response: null });
                                }}
                                disabled={savingResponse === r.id}
                                className="border border-border text-red-600 px-3 py-1.5 font-body text-xs tracking-wider uppercase"
                              >
                                Obriši odgovor
                              </button>
                            )}
                            <button
                              onClick={() => toggleResponse(r)}
                              className="font-body text-xs tracking-wider uppercase text-muted-foreground underline"
                            >
                              Otkaži
                            </button>
                          </div>
                        </div>
                      )}
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
                Stranica {pageSafe} / {totalPages} · {filtered.length} recenzija
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

      {/* Confirm reject */}
      <AlertDialog open={!!confirmReject} onOpenChange={(o) => !o && setConfirmReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odbiti recenziju?</AlertDialogTitle>
            <AlertDialogDescription>
              Recenzija će biti sakrivena sa sajta, ali ostaje u bazi. Možeš je kasnije vratiti u red.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmReject) setStatus(confirmReject.id, "rejected");
                setConfirmReject(null);
              }}
            >
              Odbij
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete (single) */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trajno obrisati recenziju?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija ne može da se poništi. Recenzija će biti uklonjena iz baze.
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
            <AlertDialogTitle>Trajno obrisati {selectedIds.size} recenzija?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija ne može da se poništi. Sve izabrane recenzije će biti uklonjene iz baze.
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

export default AdminReviews;