import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Leaf, Droplets, ChevronDown, Sparkles, FlaskConical, ShoppingBag, Plus } from "lucide-react";
import { products } from "@/data/siteData";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import SectionReveal from "@/components/SectionReveal";
import ProductCard from "@/components/ProductCard";

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

const AccordionItem = ({ title, icon, children, defaultOpen = false, badge }: AccordionItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-warm-brown/70">{icon}</span>
          <h3 className="font-heading text-lg md:text-xl text-foreground text-left">{title}</h3>
          {badge && (
            <span className="font-body text-[9px] tracking-[0.15em] uppercase bg-warm-cream/80 text-warm-brown/80 px-2.5 py-1 rounded-sm">
              {badge}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="text-muted-foreground/50 group-hover:text-warm-brown transition-colors"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: product.size,
    }, quantity);
    toast.success(`${product.name} dodato u korpu`);
  };

  if (!product) {
    return (
      <main className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-4xl text-foreground mb-4">Proizvod nije pronađen</h1>
          <Link to="/prodavnica" className="font-body text-sm text-warm-brown underline">Nazad na prodavnicu</Link>
        </div>
      </main>
    );
  }

  const relatedProducts = products.filter((p) => p.id !== product.id).slice(0, 3);
  const allImages = product.images && product.images.length > 0 ? product.images : [product.image];

  const hasBenefits = product.benefits && product.benefits.length > 0;
  const hasFreeFrom = product.freeFrom && product.freeFrom.length > 0;
  const hasIngredients = product.ingredientsBenefits && product.ingredientsBenefits.length > 0;
  const hasUsage = !!product.usage;
  const hasComposition = !!(product.inci || product.compositionNote);
  const hasAccordionContent = hasBenefits || hasFreeFrom || hasIngredients || hasUsage || hasComposition;

  return (
    <main className="pt-24">
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-6">
        <div className="flex items-center gap-2 font-body text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Početna</Link>
          <span className="opacity-40">/</span>
          <Link to="/prodavnica" className="hover:text-foreground transition-colors">Prodavnica</Link>
          <span className="opacity-40">/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Product Hero */}
      <section className="pb-20 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
            {/* Gallery */}
            <SectionReveal>
              <div className="lg:sticky lg:top-28">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-warm-cream aspect-[4/5] overflow-hidden mb-4"
                >
                  <img
                    src={allImages[activeImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                {allImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`aspect-square overflow-hidden transition-all duration-300 ${
                          activeImage === i
                            ? "ring-2 ring-warm-brown ring-offset-2 ring-offset-background"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SectionReveal>

            {/* Product Info */}
            <SectionReveal delay={0.15}>
              <div>
                {/* Category & Badge */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-body text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                    {product.category}
                  </span>
                  {product.featured && (
                    <span className="font-body text-[9px] tracking-[0.15em] uppercase bg-warm-brown text-primary-foreground px-2.5 py-1">
                      Izdvojeno
                    </span>
                  )}
                </div>

                {/* Name */}
                <h1 className="font-heading text-4xl md:text-[2.75rem] leading-[1.1] text-foreground mb-3">
                  {product.name}
                </h1>

                {/* Size & Active Count */}
                <div className="flex items-center gap-4 mb-6">
                  {product.size && (
                    <span className="font-body text-sm text-muted-foreground">{product.size}</span>
                  )}
                  {product.activeIngredientsCount && (
                    <>
                      <span className="w-px h-4 bg-border" />
                      <span className="font-body text-xs tracking-[0.1em] uppercase text-warm-brown">
                        {product.activeIngredientsCount} aktivnih sastojaka
                      </span>
                    </>
                  )}
                </div>

                {/* Price */}
                <div className="mb-8">
                  <p className="font-heading text-3xl text-foreground">{product.price.toLocaleString("sr-RS")} <span className="text-lg text-muted-foreground">RSD</span></p>
                  
                </div>

                {/* Divider */}
                <div className="w-12 h-px bg-warm-brown/40 mb-8" />

                {/* Description */}
                <p className="font-body text-[15px] text-muted-foreground leading-[1.8] mb-8">
                  {product.shortDescription}
                </p>

                {/* Target Audience */}
                {product.targetAudience && (
                  <div className="flex items-start gap-4 mb-8 p-5 bg-warm-cream/60 border border-border/40">
                    <Droplets size={18} className="text-warm-brown mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-body text-[10px] tracking-[0.2em] uppercase text-foreground mb-1.5">Kome je namenjen</p>
                      <p className="font-body text-sm text-muted-foreground leading-relaxed">{product.targetAudience}</p>
                    </div>
                  </div>
                )}

                {/* Quantity + Add to Cart */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center border border-border/60">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-11 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-body text-sm text-foreground">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-11 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <motion.button
                    onClick={handleAddToCart}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 inline-flex items-center justify-center gap-3 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-dark transition-colors duration-300"
                  >
                    <ShoppingBag size={15} /> Dodaj u korpu
                  </motion.button>
                </div>

                {/* Free From pills - always visible */}
                {hasFreeFrom && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {product.freeFrom.map((item) => (
                      <span
                        key={item}
                        className="font-body text-[10px] tracking-[0.1em] uppercase text-muted-foreground border border-border/60 px-3 py-1.5"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                )}

                {/* Product Details Accordion */}
                {hasAccordionContent && (
                  <div className="mt-12 pt-10 border-t border-border/30">
                    <div className="mb-10">
                      <span className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-3">Detalji proizvoda</span>
                      <h2 className="font-heading text-[1.75rem] md:text-[2rem] font-light text-foreground leading-tight">Sve što treba da znate</h2>
                    </div>

                    <div className="bg-[hsl(var(--warm-cream)/0.35)] rounded-sm">
                      <div className="px-4 md:px-7">
                        {hasBenefits && (
                          <AccordionItem
                            title="Benefiti"
                            icon={<Sparkles size={18} strokeWidth={1.5} />}
                            badge={`${product.benefits.length} benefita`}
                          >
                            <div className="space-y-2.5 pl-7">
                              {product.benefits.map((b, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.04 }}
                                  className="flex items-start gap-2.5"
                                >
                                  <div className="w-[18px] h-[18px] rounded-full bg-warm-cream flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check size={10} className="text-warm-brown" />
                                  </div>
                                  <p className="font-body text-[13px] text-muted-foreground leading-relaxed">{b}</p>
                                </motion.div>
                              ))}
                            </div>
                          </AccordionItem>
                        )}

                        {hasUsage && (
                          <AccordionItem
                            title="Način upotrebe"
                            icon={<Droplets size={18} strokeWidth={1.5} />}
                          >
                            <div className="pl-7">
                              <p className="font-body text-[13px] text-muted-foreground leading-[1.85]">{product.usage}</p>
                            </div>
                          </AccordionItem>
                        )}

                        {hasComposition && (
                          <AccordionItem
                            title="Sastav (INCI)"
                            icon={<FlaskConical size={18} strokeWidth={1.5} />}
                          >
                            <div className="pl-7 space-y-3">
                              {product.compositionNote && (
                                <p className="font-body text-[13px] text-muted-foreground leading-relaxed">{product.compositionNote}</p>
                              )}
                              {product.inci && (
                                <div className="bg-warm-cream/50 p-4 border border-border/20 rounded-sm">
                                  <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-2">INCI lista</p>
                                  <p className="font-body text-[11px] text-muted-foreground/80 leading-relaxed">{product.inci}</p>
                                </div>
                              )}
                            </div>
                          </AccordionItem>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <SectionReveal>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                <div>
                  <span className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-3">Preporučujemo</span>
                  <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">Slični proizvodi</h2>
                </div>
                <Link to="/prodavnica" className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown hover:text-warm-dark transition-colors">
                  Svi proizvodi <ArrowRight size={12} />
                </Link>
              </div>
            </SectionReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-16">
        <Link to="/prodavnica" className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown hover:text-warm-dark transition-colors">
          <ArrowLeft size={14} /> Nazad na prodavnicu
        </Link>
      </div>
    </main>
  );
};

export default ProductDetail;
