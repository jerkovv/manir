import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { fetchProductBySlug, productImage } from "@/lib/products";
import { toast } from "sonner";
import { X } from "lucide-react";

const SESSION_KEY = "welcome_popup_shown";
const K1_SLUG = "serum-koncentrat-k1";
const K1_PATH = `/proizvod/${K1_SLUG}`;
const ARM_DELAY_MS = 2500;

const formatPrice = (rsd: number) =>
  `${new Intl.NumberFormat("sr-RS").format(rsd)} RSD`;

const WelcomePopup = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { addItem, isCartOpen } = useCart();
  const [open, setOpen] = useState(false);

  const { data: product } = useQuery({
    queryKey: ["welcome-popup-product", K1_SLUG],
    queryFn: () => fetchProductBySlug(K1_SLUG),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    // Statički guard-ovi po ruti
    if (pathname.startsWith("/admin")) return;
    if (pathname.startsWith("/naruci")) return;
    if (pathname === K1_PATH) return;

    // Već prikazano u ovoj sesiji
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch { /* ignore */ }

    const timer = window.setTimeout(() => {
      // Re-check u trenutku triggera
      if (isCartOpen) return; // skip BEZ postavljanja flag-a (po dopuni)
      try {
        if (sessionStorage.getItem(SESSION_KEY)) return;
      } catch { /* ignore */ }
      if (!product) return; // ako fetch nije stigao / pao, tihi skip

      setOpen(true);
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
    }, ARM_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, isCartOpen, product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: productImage(product),
        size: product.size ?? undefined,
      },
      1,
    );
    toast.success("Serum K1 dodat u korpu");
    setOpen(false);
    // Cart drawer se sam otvori kroz addItem (CartContext)
  };

  const handleViewDetails = () => {
    setOpen(false);
    navigate(K1_PATH);
  };

  if (!product) return null;

  const image = productImage(product);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
      <DialogContent
        className="max-w-3xl p-0 overflow-hidden bg-warm-cream border-warm-beige z-[80] [&>button]:hidden"
      >
        {/* Custom close — pozicioniran preko slike, vidljiv na obe pozadine */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Zatvori"
          className="absolute right-3 top-3 z-10 rounded-full bg-warm-cream/90 p-1.5 text-warm-dark shadow-sm hover:bg-warm-cream transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Slika */}
          <div className="relative bg-warm-beige/50 aspect-[4/3] md:aspect-auto md:min-h-[420px]">
            {image ? (
              <img
                src={image}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
            ) : null}
          </div>

          {/* Tekst */}
          <div className="p-8 md:p-10 flex flex-col justify-center gap-5">
            <p className="text-[11px] tracking-[0.25em] uppercase text-warm-taupe font-body">
              Proizvod meseca
            </p>

            <div className="space-y-2">
              <p className="text-xs tracking-wider uppercase text-warm-taupe font-body">
                {formatPrice(Number(product.price))}
                {product.size ? <span className="ml-2 normal-case tracking-normal text-muted-foreground">· {product.size}</span> : null}
              </p>
              <h2 className="font-heading text-3xl md:text-4xl text-warm-dark leading-tight">
                {product.name}
              </h2>
            </div>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Antiinflamatorno &amp; anti-age dejstvo. 8 aktivnih sastojaka za sve tipove kože.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full bg-warm-dark text-warm-offwhite py-3.5 px-6 text-xs tracking-[0.25em] uppercase font-body whitespace-nowrap hover:bg-warm-brown transition-colors"
              >
                Dodaj u korpu
              </button>
              <button
                type="button"
                onClick={handleViewDetails}
                className="w-full border border-warm-dark/20 text-warm-dark py-3 px-6 text-xs tracking-[0.25em] uppercase font-body whitespace-nowrap hover:bg-warm-beige/60 transition-colors"
              >
                Pogledaj detalje
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;
