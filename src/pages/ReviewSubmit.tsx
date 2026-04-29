import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Loader2, Check, AlertCircle } from "lucide-react";

const SUPABASE_URL = "https://caqjobwfcuwvxojengky.supabase.co";
const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TEXT = 2000;
const MIN_TEXT = 10;

type TokenInfo = {
  product_id: string;
  product_name: string;
  product_image: string | null;
  customer_name: string | null;
  customer_email: string | null;
  used_at: string | null;
};

type State =
  | { kind: "loading" }
  | { kind: "ready"; info: TokenInfo }
  | { kind: "submitting"; info: TokenInfo }
  | { kind: "ok" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "error"; message?: string };

const ReviewSubmit = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState<State>({ kind: "loading" });

  // form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!TOKEN_RE.test(token)) {
        setState({ kind: "invalid" });
        return;
      }
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/review-public-api?token=${encodeURIComponent(token)}`,
          { method: "GET", headers: { Accept: "application/json" } },
        );
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 404) { setState({ kind: "invalid" }); return; }
        if (!res.ok || !body?.data) {
          setState({ kind: "error", message: body?.error });
          return;
        }
        const info = body.data as TokenInfo;
        if (info.used_at) {
          setState({ kind: "already" });
          return;
        }
        setName(info.customer_name || "");
        setState({ kind: "ready", info });
      } catch (e: any) {
        if (!cancelled) setState({ kind: "error", message: e?.message });
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const submit = async () => {
    if (state.kind !== "ready") return;
    setFormError(null);
    if (rating < 1 || rating > 5) { setFormError("Molimo izaberite ocenu (1–5 zvezdica)."); return; }
    if (text.trim().length > 0 && text.trim().length < MIN_TEXT) {
      setFormError(`Recenzija mora imati bar ${MIN_TEXT} karaktera (ili ostavite prazno).`);
      return;
    }
    if (text.length > MAX_TEXT) { setFormError(`Recenzija ne sme prelaziti ${MAX_TEXT} karaktera.`); return; }

    const info = state.info;
    setState({ kind: "submitting", info });
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/review-public-api`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          token,
          rating,
          review_text: text.trim() || null,
          reviewer_name: name.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.ok) { setState({ kind: "ok" }); return; }
      const msg = String(body?.error || "");
      if (/already|used|token/i.test(msg)) { setState({ kind: "already" }); return; }
      setState({ kind: "ready", info });
      setFormError(msg || "Slanje nije uspelo. Pokušajte ponovo.");
    } catch (e: any) {
      setState({ kind: "ready", info });
      setFormError(e?.message || "Greška u mreži.");
    }
  };

  const charCount = useMemo(() => text.length, [text]);

  return (
    <main className="pt-24 pb-20 min-h-screen flex items-start justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl w-full"
      >
        {state.kind === "loading" && (
          <div className="text-center py-20">
            <Loader2 size={28} className="text-warm-brown animate-spin mx-auto mb-4" />
            <p className="font-body text-sm text-muted-foreground">Učitavanje…</p>
          </div>
        )}

        {(state.kind === "ready" || state.kind === "submitting") && (
          <>
            <div className="text-center mb-10">
              <span className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-3">
                Vaše iskustvo
              </span>
              <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-2">
                Ocenite proizvod
              </h1>
              <p className="font-body text-sm text-muted-foreground">
                Vaše mišljenje pomaže drugim kupcima.
              </p>
            </div>

            <div className="bg-warm-cream/40 border border-border/30 p-5 mb-8 flex items-center gap-4">
              {state.info.product_image && (
                <img
                  src={state.info.product_image}
                  alt={state.info.product_name}
                  className="w-20 h-20 object-cover bg-warm-cream flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                  Proizvod
                </p>
                <p className="font-heading text-lg text-foreground leading-tight truncate">
                  {state.info.product_name}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); submit(); }}
              className="space-y-6"
            >
              <div>
                <label className="font-body text-[10px] tracking-[0.2em] uppercase text-foreground block mb-3">
                  Vaša ocena
                </label>
                <div
                  className="flex items-center gap-2"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((i) => {
                    const active = (hoverRating || rating) >= i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHoverRating(i)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={`${i} ${i === 1 ? "zvezdica" : "zvezdica"}`}
                      >
                        <Star
                          size={32}
                          strokeWidth={1.5}
                          className={active ? "fill-warm-brown text-warm-brown" : "text-warm-brown/30"}
                        />
                      </button>
                    );
                  })}
                  {rating > 0 && (
                    <span className="font-body text-sm text-muted-foreground ml-2">
                      {rating} / 5
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="review-text" className="font-body text-[10px] tracking-[0.2em] uppercase text-foreground block mb-3">
                  Vaš utisak <span className="text-muted-foreground/70 normal-case tracking-normal">(opciono)</span>
                </label>
                <textarea
                  id="review-text"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
                  rows={6}
                  placeholder="Podelite kako vam je proizvod pomogao…"
                  className="w-full bg-background border border-border/60 px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-warm-brown transition-colors"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="font-body text-[11px] text-muted-foreground/70">
                    {text.trim().length > 0 && text.trim().length < MIN_TEXT
                      ? `Bar ${MIN_TEXT} karaktera`
                      : ""}
                  </span>
                  <span className="font-body text-[11px] text-muted-foreground/70">
                    {charCount} / {MAX_TEXT}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="review-name" className="font-body text-[10px] tracking-[0.2em] uppercase text-foreground block mb-3">
                  Vaše ime
                </label>
                <input
                  id="review-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 100))}
                  className="w-full bg-background border border-border/60 px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-warm-brown transition-colors"
                />
              </div>

              {formError && (
                <div className="flex items-start gap-2 text-warm-brown bg-warm-cream/60 border border-warm-brown/20 p-3">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm">{formError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={state.kind === "submitting"}
                className="w-full bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {state.kind === "submitting" ? (
                  <><Loader2 size={14} className="animate-spin" /> Šaljemo…</>
                ) : (
                  "Pošalji recenziju"
                )}
              </button>

              <p className="font-body text-[11px] text-muted-foreground/70 text-center leading-relaxed">
                Recenzija se objavljuje nakon kratke provere našeg tima.
              </p>
            </form>
          </>
        )}

        {state.kind === "ok" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <Check size={28} className="text-warm-brown" />
            </div>
            <span className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-3">
              Hvala vam
            </span>
            <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
              Recenzija je poslata
            </h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
              Vaš utisak ćemo objaviti nakon kratke provere. Hvala što ste izdvojili vreme.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors"
            >
              Idi na 0202skin.com
            </Link>
          </div>
        )}

        {state.kind === "already" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <Check size={28} className="text-warm-brown" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-3">Recenzija je već poslata</h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
              Ovaj link je već iskorišćen. Hvala što ste podelili svoje iskustvo.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors"
            >
              Nazad na početnu
            </Link>
          </div>
        )}

        {state.kind === "invalid" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={26} className="text-warm-brown/70" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-3">Link nije valjan</h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
              Ovaj link za recenziju je istekao ili je već iskorišćen. Ako i dalje želite da ostavite utisak, javite nam se.
            </p>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 border border-border px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-cream transition-colors"
            >
              Kontaktirajte nas
            </Link>
          </div>
        )}

        {state.kind === "error" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={26} className="text-warm-brown/70" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-3">Nešto nije u redu</h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
              Pokušajte ponovo za nekoliko trenutaka. Ako se problem ponovi, javite nam se.
            </p>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 border border-border px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-cream transition-colors"
            >
              Kontaktirajte nas
            </Link>
          </div>
        )}
      </motion.div>
    </main>
  );
};

export default ReviewSubmit;