// Klijentski helper za abandoned-cart-public-api edge funkciju.
// Koristi se sa Checkout (on-blur na email) i (kasnije) exit-intent popup-om.

import type { CartItem } from "@/contexts/CartContext";

const SUPABASE_URL = "https://caqjobwfcuwvxojengky.supabase.co";
const ENDPOINT = `${SUPABASE_URL}/functions/v1/abandoned-cart-public-api`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CartCaptureSource = "checkout" | "exit_intent" | "other";

export interface CaptureCartArgs {
  email: string;
  items: CartItem[];
  total: number;
  customerName?: string | null;
  source?: CartCaptureSource;
}

/**
 * Šalje email + sadržaj korpe u backend (upsert_abandoned_cart RPC preko edge-a).
 * Tiha greška: ne pravi toast, samo loguje. Korisnik ne sme da oseti workflow.
 */
export async function captureAbandonedCart(args: CaptureCartArgs): Promise<boolean> {
  const email = args.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return false;
  if (!args.items?.length) return false;

  const payload = {
    email,
    customer_name: args.customerName?.trim() || null,
    items: args.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      image: i.image,
      size: i.size || null,
      quantity: i.quantity,
    })),
    total: Number(args.total) || 0,
    source: args.source || "checkout",
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return res.ok;
  } catch (err) {
    console.warn("[abandonedCart] capture failed:", err);
    return false;
  }
}

/**
 * Markira poslednju zabeleženu korpu kao "converted" posle uspešne porudžbine.
 * Poziva mark_cart_converted preko service-role RPC-ja u edge-u? Trenutno edge
 * podržava samo token-based convert. Ovo radi direktno preko Supabase RPC-ja.
 */
export async function markCartConverted(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => unknown },
  email: string,
): Promise<void> {
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return;
  try {
    await (supabase.rpc("mark_cart_converted", { _email: e }) as unknown as Promise<unknown>);
  } catch (err) {
    console.warn("[abandonedCart] mark_converted failed:", err);
  }
}