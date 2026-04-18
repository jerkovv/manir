import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ShoppingBag, Truck, CreditCard, ShieldCheck, Loader2, Tag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import SectionReveal from "@/components/SectionReveal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchQuantityDiscount, computeQuantityDiscount, validateCoupon, computeCouponDiscount,
  type AppliedDiscount, type QuantityDiscount,
} from "@/lib/discount";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", zip: "", note: "",
  });

  // Discounts (kupon ima prioritet — kupon i auto se ne kombinuju)
  const [qdConfig, setQdConfig] = useState<QuantityDiscount>({ enabled: false, min_quantity: 3, percent: 20 });
  const [couponInput, setCouponInput] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<AppliedDiscount | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => { fetchQuantityDiscount().then(setQdConfig); }, []);

  const autoDiscount = computeQuantityDiscount(totalPrice, totalQty, qdConfig);
  const appliedDiscount: AppliedDiscount | null = couponDiscount || autoDiscount;
  const discountAmount = appliedDiscount?.amount || 0;
  const subtotalAfterDiscount = totalPrice - discountAmount;

  const shippingCost = subtotalAfterDiscount >= 5000 ? 0 : 350;
  const grandTotal = subtotalAfterDiscount + shippingCost;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setValidatingCoupon(true);
    try {
      const c = await validateCoupon(code);
      if (!c) {
        toast.error("Nepoznat ili neaktivan kupon");
        setCouponDiscount(null);
        return;
      }
      const d = computeCouponDiscount(totalPrice, c);
      setCouponDiscount(d);
      toast.success(`Kupon ${c.code} primenjen`);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => { setCouponDiscount(null); setCouponInput(""); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.phone || !form.address || !form.city || !form.zip) {
      toast.error("Molimo popunite sva obavezna polja");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      // 1. Upsert customer by email
      const email = form.email.trim().toLowerCase();
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      let customerId = existing?.id as string | undefined;
      if (!customerId) {
        const { data: newCustomer, error: cErr } = await supabase
          .from("customers")
          .insert({
            email,
            first_name: form.firstName,
            last_name: form.lastName || null,
            phone: form.phone,
            address: form.address,
            city: form.city,
            postal_code: form.zip,
          })
          .select("id")
          .single();
        if (cErr) throw cErr;
        customerId = newCustomer.id;
      }

      // 2. Create order
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          customer_email: email,
          customer_name: `${form.firstName} ${form.lastName}`.trim(),
          customer_phone: form.phone,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_postal_code: form.zip,
          subtotal: totalPrice,
          discount_amount: discountAmount,
          discount_label: appliedDiscount?.label || null,
          coupon_code: appliedDiscount?.couponCode || null,
          total: grandTotal,
          notes: form.note || null,
        })
        .select("id, order_number")
        .single();
      if (oErr) throw oErr;

      // 3. Insert order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(orderItems);
      if (iErr) throw iErr;

      setOrderNumber(order.order_number);
      setIsSubmitted(true);
      clearCart();
    } catch (err: any) {
      console.error(err);
      toast.error("Greška: " + (err.message || "Pokušajte ponovo"));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !isSubmitted) {
    return (
      <main className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-24 h-24 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-8">
            <ShoppingBag size={36} className="text-warm-brown/40" />
          </div>
          <h1 className="font-heading text-4xl text-foreground mb-3">Korpa je prazna</h1>
          <p className="font-body text-sm text-muted-foreground mb-8">Dodajte proizvode pre naručivanja</p>
          <Link
            to="/prodavnica"
            className="inline-flex items-center gap-2 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors"
          >
            Prodavnica
          </Link>
        </div>
      </main>
    );
  }

  if (isSubmitted) {
    return (
      <main className="pt-24 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-6 max-w-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className="w-24 h-24 rounded-full bg-warm-cream flex items-center justify-center mx-auto mb-8"
          >
            <Check size={36} className="text-warm-brown" />
          </motion.div>
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">Hvala na porudžbini!</h1>
          {orderNumber && (
            <p className="font-body text-xs tracking-[0.2em] uppercase text-warm-brown mb-4">
              Broj porudžbine: #{orderNumber}
            </p>
          )}
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-3">
            Vaša porudžbina je primljena. Kontaktiraćemo vas uskoro radi potvrde i detalja isporuke.
          </p>
          <p className="font-body text-xs text-muted-foreground mb-10">
            Potvrda je poslata na <strong className="text-foreground">{form.email}</strong>
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors"
          >
            Nazad na početnu
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-20">
      {/* Header */}
      <section className="py-10 lg:py-14 bg-warm-cream">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <div className="flex items-center gap-3 mb-4">
              <Link to="/prodavnica" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={18} />
              </Link>
              <span className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Naručivanje</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground">Vaša porudžbina</h1>
          </SectionReveal>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
              {/* Form */}
              <div className="lg:col-span-3 space-y-10">
                <SectionReveal>
                  {/* Personal info */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-warm-cream flex items-center justify-center">
                        <span className="font-body text-xs font-medium text-warm-brown">1</span>
                      </div>
                      <h2 className="font-heading text-2xl text-foreground">Lični podaci</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">Ime *</label>
                        <input name="firstName" value={form.firstName} onChange={handleChange} required
                          className="w-full bg-transparent border border-border/60 px-4 py-3.5 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-warm-brown focus:outline-none transition-colors"
                          placeholder="Vaše ime" />
                      </div>
                      <div>
                        <label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">Prezime</label>
                        <input name="lastName" value={form.lastName} onChange={handleChange}
                          className="w-full bg-transparent border border-border/60 px-4 py-3.5 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-warm-brown focus:outline-none transition-colors"
                          placeholder="Vaše prezime" />
                      </div>
                      <div>
                        <label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">Email *</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required
                          className="w-full bg-transparent border border-border/60 px-4 py-3.5 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-warm-brown focus:outline-none transition-colors"
                          placeholder="email@primer.com" />
                      </div>
                      <div>
                        <label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">Telefon *</label>
                        <input name="phone" type="tel" value={form.phone} onChange={handleChange} required
                          className="w-full bg-transparent border border-border/60 px-4 py-3.5 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-warm-brown focus:outline-none transition-colors"
                          placeholder="+381 6x xxx xxxx" />
                      </div>
                    </div>
                  </div>
                </SectionReveal>

                <SectionReveal delay={0.1}>
                  {/* Shipping */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-warm-cream flex items-center justify-center">
                        <span className="font-body text-xs font-medium text-warm-brown">2</span>
                      </div>
                      <h2 className="font-heading text-2xl text-foreground">Adresa za dostavu</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">Adresa *</label>
                        <input name="address" value={form.address} onChange={handleChange} required
                          className="w-full bg-transparent border border-border/60 px-4 py-3.5 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-warm-brown focus:outline-none transition-colors"
                          placeholder="Ulica i broj" />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">Grad *</label>
                          <input name="city" value={form.city} onChange={handleChange} required
                            className="w-full bg-transparent border border-border/60 px-4 py-3.5 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-warm-brown focus:outline-none transition-colors"
                            placeholder="Beograd" />
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">Poštanski broj *</label>
                          <input name="zip" value={form.zip} onChange={handleChange} required
                            className="w-full bg-transparent border border-border/60 px-4 py-3.5 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-warm-brown focus:outline-none transition-colors"
                            placeholder="11000" />
                        </div>
                      </div>
                      <div>
                        <label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-2">Napomena (opciono)</label>
                        <textarea name="note" value={form.note} onChange={handleChange} rows={3}
                          className="w-full bg-transparent border border-border/60 px-4 py-3.5 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-warm-brown focus:outline-none transition-colors resize-none"
                          placeholder="Dodatne informacije za dostavu..." />
                      </div>
                    </div>
                  </div>
                </SectionReveal>

                <SectionReveal delay={0.15}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-warm-cream flex items-center justify-center">
                      <span className="font-body text-xs font-medium text-warm-brown">3</span>
                    </div>
                    <h2 className="font-heading text-2xl text-foreground">Plaćanje</h2>
                  </div>
                  <div className="p-5 bg-warm-cream/60 border border-border/40 flex items-start gap-4">
                    <CreditCard size={18} className="text-warm-brown mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-body text-sm text-foreground font-medium mb-1">Plaćanje pouzećem</p>
                      <p className="font-body text-xs text-muted-foreground">Platite kuriru prilikom preuzimanja paketa</p>
                    </div>
                  </div>
                </SectionReveal>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-2">
                <SectionReveal delay={0.1}>
                  <div className="lg:sticky lg:top-28">
                    <div className="bg-warm-cream/60 border border-border/40 p-6 lg:p-8">
                      <h3 className="font-heading text-xl text-foreground mb-6">Pregled porudžbine</h3>
                      <div className="space-y-4 mb-6">
                        {items.map(item => (
                          <div key={item.id} className="flex gap-3">
                            <div className="w-14 h-16 bg-warm-cream flex-shrink-0 overflow-hidden">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-xs text-foreground leading-tight line-clamp-2">{item.name}</p>
                              <p className="font-body text-[10px] text-muted-foreground mt-1">Količina: {item.quantity}</p>
                            </div>
                            <p className="font-body text-sm text-foreground flex-shrink-0">
                              {(item.price * item.quantity).toLocaleString("sr-RS")} RSD
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border/40 pt-4 space-y-3">
                        <div className="flex justify-between font-body text-xs text-muted-foreground">
                          <span>Proizvodi</span>
                          <span>{totalPrice.toLocaleString("sr-RS")} RSD</span>
                        </div>
                        <div className="flex justify-between font-body text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Truck size={12} /> Dostava</span>
                          <span>{shippingCost === 0 ? "Besplatno" : `${shippingCost} RSD`}</span>
                        </div>
                        {totalPrice < 5000 && (
                          <p className="font-body text-[10px] text-warm-brown">
                            Još {(5000 - totalPrice).toLocaleString("sr-RS")} RSD do besplatne dostave
                          </p>
                        )}
                        <div className="border-t border-border/40 pt-3 flex justify-between items-baseline">
                          <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Ukupno</span>
                          <span className="font-heading text-2xl text-foreground">{grandTotal.toLocaleString("sr-RS")} <span className="text-sm text-muted-foreground">RSD</span></span>
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        whileHover={{ scale: submitting ? 1 : 1.01 }}
                        whileTap={{ scale: submitting ? 1 : 0.99 }}
                        disabled={submitting}
                        className="w-full mt-6 flex items-center justify-center gap-3 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {submitting ? <><Loader2 size={14} className="animate-spin" /> Slanje...</> : "Potvrdite porudžbinu"}
                      </motion.button>

                      <div className="mt-5 flex items-center gap-2 justify-center">
                        <ShieldCheck size={14} className="text-warm-brown/60" />
                        <span className="font-body text-[10px] text-muted-foreground">Sigurna kupovina · Povrat u roku od 14 dana</span>
                      </div>
                    </div>
                  </div>
                </SectionReveal>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Checkout;
