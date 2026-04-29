import { useEffect, useMemo, useState } from "react";
import { Eye, Flame, Package } from "lucide-react";

/**
 * Simulirani social proof signali za PDP.
 * - Stock i 24h sales su deterministički hash-ovani po product.id (stabilno između refresh-ova).
 * - Live viewers je random u opsegu 3-15, menja se na 20-30s.
 * Namerno suptilno: tanki tekst, mali ikoni, bez agresivnih boja.
 */

// Mali deterministički hash → ceo broj 0..2^32
const hashId = (id: string): number => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const pickInRange = (id: string, salt: string, min: number, max: number) => {
  const h = hashId(id + ":" + salt);
  return min + (h % (max - min + 1));
};

interface Props {
  productId: string;
}

const ProductSocialProof = ({ productId }: Props) => {
  // Stock: 3..14 (samo prikazujemo kad je <10 → low-stock signal)
  const stock = useMemo(() => pickInRange(productId, "stock", 3, 14), [productId]);
  // 24h prodato: 5..30
  const sold24h = useMemo(() => pickInRange(productId, "sold24", 5, 30), [productId]);

  // Live viewers: 3..15, refresh na 20-30s, sa malom +/-1 fluktuacijom
  const [viewers, setViewers] = useState(() => pickInRange(productId, "viewers", 4, 12));

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setViewers((v) => {
        const drift = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
        const next = Math.min(15, Math.max(3, v + drift));
        return next;
      });
      const delay = 20000 + Math.floor(Math.random() * 10000); // 20-30s
      timeout = window.setTimeout(tick, delay);
    };
    let timeout = window.setTimeout(tick, 20000 + Math.floor(Math.random() * 10000));
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [productId]);

  const showLowStock = stock < 10;

  return (
    <div className="mb-5 space-y-2">
      {/* Live viewers + 24h sold u istom redu */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-body text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="relative inline-flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-warm-brown/60 animate-ping" />
            <span className="relative inline-block w-1.5 h-1.5 rounded-full bg-warm-brown" />
          </span>
          <Eye size={12} strokeWidth={1.5} className="opacity-70" />
          Trenutno gleda <span className="text-foreground tabular-nums">{viewers}</span> osoba
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Package size={12} strokeWidth={1.5} className="opacity-70" />
          <span className="tabular-nums text-foreground">{sold24h}</span> narudžbina u poslednjih 24h
        </span>
      </div>

      {/* Low stock samo kad je <10 */}
      {showLowStock && (
        <div className="inline-flex items-center gap-2 font-body text-[11px] text-[hsl(var(--destructive))]">
          <Flame size={12} strokeWidth={1.75} />
          {stock <= 4
            ? "Poslednji komadi — skoro rasprodato"
            : <>Još <span className="tabular-nums font-medium">{stock}</span> komada na stanju</>}
        </div>
      )}
    </div>
  );
};

export default ProductSocialProof;
