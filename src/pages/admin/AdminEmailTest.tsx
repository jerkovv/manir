import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle2, XCircle } from "lucide-react";
import { displayOrderNumber } from "@/lib/orderNumber";

type OrderRow = {
  id: string;
  order_number: number;
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  created_at: string;
};

type SendResult = {
  type: "customer" | "admin";
  recipient?: string;
  status: "sent" | "failed";
  error?: string;
};

const DEFAULT_TEST_EMAIL = "jerkovdejan@icloud.com";

const formatRsd = (n: number) =>
  `${new Intl.NumberFormat("sr-RS").format(Math.round(Number(n) || 0))} RSD`;

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
};

const AdminEmailTest = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderId, setOrderId] = useState<string>("");
  const [testEmail, setTestEmail] = useState<string>(DEFAULT_TEST_EMAIL);
  const [sendCustomer, setSendCustomer] = useState(true);
  const [sendAdmin, setSendAdmin] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_email, total, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (cancelled) return;
      if (error) {
        toast.error("Greška pri učitavanju porudžbina: " + error.message);
        setOrders([]);
      } else {
        const list = (data as OrderRow[]) ?? [];
        setOrders(list);
        if (list.length > 0) setOrderId(list[0].id);
      }
      setLoadingOrders(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const selected = useMemo(
    () => orders.find((o) => o.id === orderId) || null,
    [orders, orderId],
  );

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const canSend =
    !!orderId &&
    isValidEmail(testEmail) &&
    (sendCustomer || sendAdmin) &&
    !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setResults(null);
    setErrorMsg(null);
    try {
      const body: Record<string, unknown> = {
        orderId,
        sendCustomer,
        sendAdmin,
      };
      if (sendCustomer) body.testCustomerEmail = testEmail.trim();
      if (sendAdmin) body.testAdminEmail = testEmail.trim();

      const { data, error } = await supabase.functions.invoke("send-order-email", { body });
      if (error) {
        setErrorMsg(error.message || "Nepoznata greška");
        toast.error("Greška: " + (error.message || "slanje neuspešno"));
        return;
      }
      const resp = (data ?? {}) as { results?: SendResult[]; error?: string };
      if (resp.error) {
        setErrorMsg(resp.error);
        toast.error("Greška: " + resp.error);
        return;
      }
      const r = resp.results ?? [];
      setResults(r);
      const anyFailed = r.some((x) => x.status === "failed");
      if (anyFailed) {
        toast.error("Neki email-ovi nisu poslati — pogledaj rezultat ispod.");
      } else if (r.length === 0) {
        toast.message("Nije bilo email-ova za slanje.");
      } else {
        toast.success(`Test email poslat na ${testEmail.trim()}`);
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      setErrorMsg(msg);
      toast.error("Greška: " + msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-foreground mb-2">Test slanje order email-a</h1>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Pošalji potvrdu porudžbine i admin notifikaciju na test email adresu.
          Pravi kupci i admini neće dobiti email — sve se preusmerava na test adresu ispod.
        </p>
      </div>

      <div className="bg-white border border-border p-6 space-y-6">
        {/* 1. Izbor porudžbine */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-2 font-body">
            Porudžbina za test
          </label>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            disabled={loadingOrders || sending}
            className="w-full px-3 py-2.5 border border-border bg-white font-body text-sm disabled:opacity-50"
          >
            {loadingOrders && <option>Učitavanje porudžbina...</option>}
            {!loadingOrders && orders.length === 0 && <option value="">Nema porudžbina</option>}
            {!loadingOrders && orders.map((o) => (
              <option key={o.id} value={o.id}>
                #{displayOrderNumber(o.order_number)} · {o.customer_name || "—"} · {formatRsd(o.total)} · {formatDate(o.created_at)}
              </option>
            ))}
          </select>
          {selected && (
            <p className="mt-2 font-body text-xs text-muted-foreground">
              Pravi email kupca: <span className="font-mono">{selected.customer_email || "—"}</span> (ne dobija ovaj test)
            </p>
          )}
        </div>

        {/* 2. Test email */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-2 font-body">
            Email za test
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            disabled={sending}
            placeholder="test@example.com"
            className="w-full px-3 py-2.5 border border-border font-body text-sm disabled:opacity-50"
          />
          {!isValidEmail(testEmail) && testEmail.trim() !== "" && (
            <p className="mt-2 font-body text-xs text-red-600">Neispravan email format</p>
          )}
        </div>

        {/* 3. Tip email-a */}
        <div>
          <div className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3 font-body">
            Šta poslati
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 font-body text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={sendCustomer}
                onChange={(e) => setSendCustomer(e.target.checked)}
                disabled={sending}
                className="h-4 w-4"
              />
              <span>Email kupca <span className="text-muted-foreground">(potvrda porudžbine)</span></span>
            </label>
            <label className="flex items-center gap-3 font-body text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={sendAdmin}
                onChange={(e) => setSendAdmin(e.target.checked)}
                disabled={sending}
                className="h-4 w-4"
              />
              <span>Email admina <span className="text-muted-foreground">(nova porudžbina)</span></span>
            </label>
          </div>
          {!sendCustomer && !sendAdmin && (
            <p className="mt-2 font-body text-xs text-red-600">Izaberi bar jednu vrstu email-a</p>
          )}
        </div>

        {/* 4. Akcija */}
        <div className="pt-2">
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 font-body text-xs tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            {sending ? "Šaljem..." : "Pošalji test email"}
          </button>
        </div>
      </div>

      {/* Rezultati */}
      {(results || errorMsg) && (
        <div className="bg-white border border-border p-6 space-y-3">
          <div className="font-body text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
            Rezultat
          </div>
          {errorMsg && (
            <div className="flex items-start gap-2 font-body text-sm text-red-700">
              <XCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {results && results.length === 0 && (
            <div className="font-body text-sm text-muted-foreground">
              Nije bilo email-ova za slanje.
            </div>
          )}
          {results && results.map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 font-body text-sm ${
                r.status === "sent" ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {r.status === "sent" ? (
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle size={16} className="mt-0.5 flex-shrink-0" />
              )}
              <div>
                <div>
                  {r.type === "customer" ? "Customer email" : "Admin email"} {r.status === "sent" ? "poslat" : "neuspešan"}
                  {r.recipient ? ` na ${r.recipient}` : ""}
                </div>
                {r.error && <div className="text-xs text-muted-foreground mt-0.5">{r.error}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEmailTest;