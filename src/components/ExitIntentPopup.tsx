import { useEffect, useState, useRef, FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { captureAbandonedCart } from "@/lib/abandonedCart";
import { toast } from "sonner";

const SESSION_KEY = "exit_intent_shown";
const COOLDOWN_KEY = "exit_intent_last_shown";
const EMAIL_KEY = "0202-checkout-email";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 dana
const ARM_DELAY_MS = 7000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ExitIntentPopup = () => {
  const { pathname } = useLocation();
  const { items, totalPrice, isCartOpen } = useCart();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const armedRef = useRef(false);
  const itemsRef = useRef(items);
  const totalRef = useRef(totalPrice);
  const cartOpenRef = useRef(isCartOpen);

  // Drži najsvežije vrednosti korpe u ref-u za listener
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { totalRef.current = totalPrice; }, [totalPrice]);
  useEffect(() => { cartOpenRef.current = isCartOpen; }, [isCartOpen]);

  // Pre-fill email iz localStorage ako postoji
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EMAIL_KEY);
      if (saved && EMAIL_RE.test(saved)) setEmail(saved);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // Skip ruta: checkout
    if (pathname.startsWith("/naruci")) return;

    // Skip mobile/touch (nema kursora)
    if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) return;

    // Session guard
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch { /* ignore */ }

    // 7-dnevni cooldown
    try {
      const last = localStorage.getItem(COOLDOWN_KEY);
      if (last) {
        const ts = Number(last);
        if (Number.isFinite(ts) && Date.now() - ts < COOLDOWN_MS) return;
      }
    } catch { /* ignore */ }

    let armTimer: number | undefined;

    const onMouseLeave = (e: MouseEvent) => {
      if (!armedRef.current) return;
      if (e.clientY > 0) return;
      // Ne okidaj dok je korpa drawer otvoren — kupac upravo gleda korpu
      if (cartOpenRef.current) return;
      // Korpa mora postojati
      if (!itemsRef.current?.length) return;
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
      setOpen(true);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
    };

    armTimer = window.setTimeout(() => {
      armedRef.current = true;
      document.documentElement.addEventListener("mouseleave", onMouseLeave);
    }, ARM_DELAY_MS);

    return () => {
      if (armTimer) window.clearTimeout(armTimer);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [pathname]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      toast.error("Unesi validnu email adresu.");
      return;
    }
    if (!itemsRef.current?.length) {
      setOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      const ok = await captureAbandonedCart({
        email: trimmed,
        items: itemsRef.current,
        total: totalRef.current,
        source: "exit_intent",
      });
      if (ok) {
        try { localStorage.setItem(EMAIL_KEY, trimmed); } catch { /* ignore */ }
        try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch { /* ignore */ }
        toast.success("Korpa je sačuvana. Poslaćemo ti link na email.");
      } else {
        toast.error("Nismo uspeli da sačuvamo korpu. Pokušaj ponovo.");
      }
    } finally {
      setSubmitting(false);
      setOpen(false);
    }
  };

  const handleDismiss = () => {
    // Samo session-only, bez 7d cooldown-a (dismiss != submit)
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-wide">
            Sačuvaj svoju korpu
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            Ostavi nam email i poslaćemo ti link da nastaviš kupovinu kad budeš spremna.
            Bez spama, samo tvoja izabrana ritualna nega.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            type="email"
            placeholder="tvoj@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
            disabled={submitting}
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDismiss}
              disabled={submitting}
            >
              Ne, hvala
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Čuvam..." : "Sačuvaj korpu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentPopup;