import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Leaf, Droplets } from "lucide-react";
import { products } from "@/data/siteData";
import SectionReveal from "@/components/SectionReveal";
import ProductCard from "@/components/ProductCard";

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const [activeImage, setActiveImage] = useState(0);

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

  return (
    <main className="pt-24">
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-6">
        <div className="flex items-center gap-2 font-body text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Početna</Link>
          <span>/</span>
          <Link to="/prodavnica" className="hover:text-foreground transition-colors">Prodavnica</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Product Hero */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Gallery */}
            <SectionReveal>
              <div>
                <div className="bg-warm-cream aspect-[4/5] overflow-hidden mb-4">
                  <img src={allImages[activeImage]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                {allImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`aspect-square overflow-hidden border-2 transition-colors ${
                          activeImage === i ? "border-warm-brown" : "border-transparent"
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
            <SectionReveal delay={0.2}>
              <div className="lg:sticky lg:top-32">
                <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{product.category}</span>
                <h1 className="font-heading text-4xl md:text-5xl text-foreground mt-2 mb-2">{product.name}</h1>
                {product.size && <p className="font-body text-sm text-muted-foreground mb-4">{product.size}</p>}
                {product.activeIngredientsCount && (
                  <p className="font-body text-xs tracking-[0.1em] uppercase text-warm-brown mb-4">
                    {product.activeIngredientsCount} aktivnih sastojaka
                  </p>
                )}
                <p className="font-heading text-3xl text-warm-brown mb-6">{product.price.toLocaleString("sr-RS")} RSD</p>
                <p className="font-body text-xs text-muted-foreground mb-6">Cena proizvoda sa PDV-om bez iskazane cene transporta.</p>

                <div className="border-t border-border pt-6 mb-6">
                  <p className="font-body text-base text-muted-foreground leading-relaxed">{product.shortDescription}</p>
                </div>

                {product.targetAudience && (
                  <div className="flex items-start gap-3 mb-6 p-4 bg-warm-cream">
                    <Droplets size={16} className="text-warm-brown mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-body text-xs tracking-[0.15em] uppercase text-foreground mb-1">Kome je namenjen</p>
                      <p className="font-body text-sm text-muted-foreground">{product.targetAudience}</p>
                    </div>
                  </div>
                )}

                <a
                  href={`https://0202skin.com/product/${product.id.replace(/-/g, "-")}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-3 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-dark transition-colors"
                >
                  Poruči na 0202skin.com <ArrowRight size={14} />
                </a>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {product.benefits && product.benefits.length > 0 && (
        <section className="py-16 lg:py-24 bg-warm-cream">
          <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
            <SectionReveal>
              <div className="flex items-center gap-3 mb-8">
                <ShieldCheck size={24} className="text-warm-brown" />
                <h2 className="font-heading text-3xl md:text-4xl text-foreground">Benefiti</h2>
              </div>
              <div className="space-y-4">
                {product.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-3 bg-background p-5">
                    <Check size={16} className="text-warm-brown mt-1 flex-shrink-0" />
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">{b}</p>
                  </div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* Free From Section */}
      {product.freeFrom && product.freeFrom.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
            <SectionReveal>
              <h3 className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">Razvijeno sa posebnom pažnjom za osetljivu kožu</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {product.freeFrom.map((item) => (
                  <div key={item} className="flex items-center gap-2 p-3 bg-warm-cream">
                    <Check size={14} className="text-warm-brown flex-shrink-0" />
                    <span className="font-body text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* Ingredients & Their Benefits */}
      {product.ingredientsBenefits && product.ingredientsBenefits.length > 0 && (
        <section className="py-16 lg:py-24 bg-warm-cream">
          <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
            <SectionReveal>
              <div className="flex items-center gap-3 mb-8">
                <Leaf size={24} className="text-warm-brown" />
                <h2 className="font-heading text-3xl md:text-4xl text-foreground">
                  Sastojci i njihovi benefiti
                  {product.activeIngredientsCount && (
                    <span className="font-body text-sm text-muted-foreground ml-3">({product.activeIngredientsCount} aktivnih)</span>
                  )}
                </h2>
              </div>
              <div className="space-y-3">
                {product.ingredientsBenefits.map((ing, i) => (
                  <div key={i} className="bg-background p-5 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="font-body text-sm font-medium text-foreground min-w-[200px]">{ing.name}</span>
                    <span className="hidden sm:block text-muted-foreground">—</span>
                    <span className="font-body text-sm text-muted-foreground">{ing.benefit}</span>
                  </div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* Usage Section */}
      {product.usage && (
        <section className="py-16 lg:py-24">
          <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
            <SectionReveal>
              <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-6">Način upotrebe</h2>
              <div className="bg-warm-cream p-8">
                <p className="font-body text-base text-muted-foreground leading-relaxed">{product.usage}</p>
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* Composition / INCI */}
      {(product.inci || product.compositionNote) && (
        <section className="py-16 lg:py-24 bg-warm-cream">
          <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
            <SectionReveal>
              <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-6">Sastav</h2>
              {product.compositionNote && (
                <p className="font-body text-base text-muted-foreground leading-relaxed mb-6">{product.compositionNote}</p>
              )}
              {product.inci && (
                <div className="bg-background p-6">
                  <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3">INCI</p>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">{product.inci}</p>
                </div>
              )}
            </SectionReveal>
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-24">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <SectionReveal>
              <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground mb-12">Slični proizvodi</h2>
            </SectionReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-12">
        <Link to="/prodavnica" className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown hover:text-warm-dark transition-colors">
          <ArrowLeft size={14} /> Nazad na prodavnicu
        </Link>
      </div>
    </main>
  );
};

export default ProductDetail;
