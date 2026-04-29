import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, AlertCircle, Loader2 } from "lucide-react";

const SUPABASE_URL = "https://caqjobwfcuwvxojengky.supabase.co";

type State =
  | { kind: "loading" }
  | { kind: "pending"; email?: string }
  | { kind: "submitting" }
  | { kind: "ok" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "error"; message?: string };

const Unsubscribe = () => {
  const { token } = useParams();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    // SEO i email-prefetch zaštita: spreči indeksiranje i caching.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token || !/^[a-f0-9]{48}$/i.test(token)) {
        setState({ kind: "invalid" });
        return;
      }
      try {
        // GET bez confirm=true: samo verifikuje token, NE menja state.
        // Ovo sprečava email klijente (Gmail, Outlook, Defender) da auto-unsubscribe-uju
        // korisnika preflight skenom linkova.
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/abandoned-cart-public-api?token=${encodeURIComponent(token)}&action=unsubscribe&format=json`,
          { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data?.status === "already_unsubscribed") setState({ kind: "already" });
        else if (data?.status === "pending") setState({ kind: "pending", email: data.email });
        else if (data?.status === "invalid_token") setState({ kind: "invalid" });
        else if (data?.ok === false && data?.status === "error") {
          setState({ kind: "error", message: data.message });
        } else {
          setState({ kind: "invalid" });
        }
      } catch (e: any) {
        if (!cancelled) setState({ kind: "error", message: e?.message });
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const confirmUnsubscribe = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/abandoned-cart-public-api`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ action: "unsubscribe", token }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (data?.status === "unsubscribed") setState({ kind: "ok" });
      else if (data?.status === "invalid_token") setState({ kind: "invalid" });
      else setState({ kind: "error", message: data?.message });
    } catch (e: any) {
      setState({ kind: "error", message: e?.message });
    }
  };

  return (
    <main className="pt-24 min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {state.kind === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <Loader2 size={24} className="text-warm-brown animate-spin" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-2">Trenutak…</h1>
            <p className="font-body text-sm text-muted-foreground">Obrađujemo vaš zahtev.</p>
          </>
        )}

        {state.kind === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={26} className="text-warm-brown" />
            </div>
            <span className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-3">
              Potvrda odjave
            </span>
            <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
              Da li želite da se odjavite?
            </h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-2">
              Više nećemo slati podsetnike{state.email ? ` na ${state.email}` : ""} kada napustite korpu pre kupovine.
            </p>
            <p className="font-body text-xs text-muted-foreground/80 leading-relaxed mb-8">
              Možete se uvek vratiti i kupovati normalno.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={confirmUnsubscribe}
                className="bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors"
              >
                Da, odjavi me
              </button>
              <Link
                to="/"
                className="border border-border px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-cream transition-colors"
              >
                Otkaži
              </Link>
            </div>
          </>
        )}

        {state.kind === "submitting" && (
          <>
            <div className="w-16 h-16 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <Loader2 size={24} className="text-warm-brown animate-spin" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-2">Odjavljujemo vas…</h1>
          </>
        )}

        {state.kind === "ok" && (
          <>
            <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <Check size={28} className="text-warm-brown" />
            </div>
            <span className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-3">
              Odjava potvrđena
            </span>
            <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
              Više vam nećemo pisati.
            </h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
              Hvala što ste bili sa nama. Vaše korpe više neće pokretati podsetnike, a vaši podaci ostaju
              kod nas samo onoliko koliko propisi nalažu.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors"
            >
              Nazad na početnu
            </Link>
          </>
        )}

        {state.kind === "already" && (
          <>
            <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <Check size={28} className="text-warm-brown" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-3">Već ste odjavljeni</h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
              Vaša adresa je već uklonjena iz naših podsetnika.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors"
            >
              Nazad na početnu
            </Link>
          </>
        )}

        {state.kind === "invalid" && (
          <>
            <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={26} className="text-warm-brown/70" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-3">Link nije valjan</h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
              Ovaj link za odjavu je istekao ili je već iskorišćen. Ako i dalje primate naše email-ove,
              kliknite na link iz najnovijeg email-a ili nas kontaktirajte direktno.
            </p>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 border border-border px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-cream transition-colors"
            >
              Kontaktirajte nas
            </Link>
          </>
        )}

        {state.kind === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={26} className="text-warm-brown/70" />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-3">Nešto nije u redu</h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
              Pokušajte ponovo za nekoliko trenutaka. Ako se problem ponovi, javite nam se.
            </p>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 border border-border px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-cream transition-colors"
            >
              Kontaktirajte nas
            </Link>
          </>
        )}
      </motion.div>
    </main>
  );
};

export default Unsubscribe;