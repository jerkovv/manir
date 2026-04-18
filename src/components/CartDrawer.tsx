import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchQuantityDiscount, computeQuantityDiscount, type AppliedDiscount } from "@/lib/discount";

const CartDrawer = () => {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const [autoDiscount, setAutoDiscount] = useState<AppliedDiscount | null>(null);

  useEffect(() => {
    let active = true;
    fetchQuantityDiscount().then(cfg => {
      if (!active) return;
      setAutoDiscount(computeQuantityDiscount(totalPrice, totalItems, cfg));
    });
    return () => { active = false; };
  }, [totalPrice, totalItems]);

  const finalTotal = totalPrice - (autoDiscount?.amount || 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-warm-dark/40 backdrop-blur-sm z-[60]"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-[60] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-warm-brown" />
                <h2 className="font-heading text-2xl text-foreground">Korpa</h2>
                <span className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground bg-warm-cream px-2.5 py-1">
                  {totalItems} {totalItems === 1 ? "artikal" : "artikala"}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mb-6">
                    <ShoppingBag size={28} className="text-warm-brown/40" />
                  </div>
                  <p className="font-heading text-2xl text-foreground mb-2">Korpa je prazna</p>
                  <p className="font-body text-sm text-muted-foreground mb-8">Dodajte proizvode iz naše kolekcije</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="font-body text-[11px] tracking-[0.15em] uppercase text-warm-brown hover:text-warm-dark transition-colors"
                  >
                    Nastavite kupovinu
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 space-y-0">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 py-5 border-b border-border/40 last:border-b-0"
                    >
                      <Link
                        to={`/proizvod/${item.id}`}
                        onClick={() => setIsCartOpen(false)}
                        className="w-20 h-24 bg-warm-cream flex-shrink-0 overflow-hidden"
                      >
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/proizvod/${item.id}`}
                          onClick={() => setIsCartOpen(false)}
                          className="font-heading text-base text-foreground leading-tight hover:text-warm-brown transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        {item.size && (
                          <p className="font-body text-[10px] tracking-[0.1em] uppercase text-muted-foreground mt-1">{item.size}</p>
                        )}
                        <p className="font-body text-sm font-medium text-warm-brown mt-2">
                          {item.price.toLocaleString("sr-RS")} RSD
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-border/60">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center font-body text-sm text-foreground">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border/60 px-6 py-5 space-y-3 bg-background">
                {autoDiscount && (
                  <div className="bg-warm-cream/60 border border-warm-brown/20 px-3 py-2 flex items-center justify-between">
                    <span className="font-body text-[11px] tracking-[0.1em] uppercase text-warm-brown">{autoDiscount.label}</span>
                    <span className="font-body text-sm text-warm-brown">−{autoDiscount.amount.toLocaleString("sr-RS")} RSD</span>
                  </div>
                )}
                {autoDiscount && (
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs text-muted-foreground">Međuzbir</span>
                    <span className="font-body text-sm text-muted-foreground line-through">{totalPrice.toLocaleString("sr-RS")} RSD</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Ukupno</span>
                  <span className="font-heading text-2xl text-foreground">{finalTotal.toLocaleString("sr-RS")} <span className="text-base text-muted-foreground">RSD</span></span>
                </div>
                <p className="font-body text-[10px] text-muted-foreground text-right">Cena dostave se obračunava na checkout-u</p>
                <Link
                  to="/naruci"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center gap-3 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors duration-300"
                >
                  Naruči <ArrowRight size={14} />
                </Link>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full text-center font-body text-[11px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Nastavite kupovinu
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
