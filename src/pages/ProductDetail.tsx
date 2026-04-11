import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { products } from "@/data/siteData";
import SectionReveal from "@/components/SectionReveal";
import ProductCard from "@/components/ProductCard";

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);

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

  const relatedProducts = products.filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug).slice(0, 3);

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

      {/* Product */}
      <section className="py-8 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <SectionReveal>
              <div className="bg-warm-cream aspect-[4/5] overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
            </SectionReveal>

            <SectionReveal delay={0.2}>
              <div className="lg:sticky lg:top-32">
                <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{product.category}</span>
                <h1 className="font-heading text-4xl md:text-5xl text-foreground mt-2 mb-2">{product.name}</h1>
                {product.size && <p className="font-body text-sm text-muted-foreground mb-6">{product.size}</p>}
                <p className="font-heading text-3xl text-warm-brown mb-8">{product.price.toLocaleString("sr-RS")} RSD</p>

                <div className="border-t border-border pt-8 mb-8">
                  <p className="font-body text-base text-muted-foreground leading-relaxed">{product.description}</p>
                </div>

                {product.benefits && (
                  <div className="mb-8">
                    <h3 className="font-body text-xs tracking-[0.2em] uppercase text-foreground mb-4">Benefiti</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {product.benefits.map((b) => (
                        <div key={b} className="flex items-center gap-2">
                          <Check size={14} className="text-warm-brown flex-shrink-0" />
                          <span className="font-body text-sm text-muted-foreground">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={`https://0202skin.com/product/${product.id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-3 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-dark transition-colors"
                >
                  Poruči na 0202skin.com <ArrowRight size={14} />
                </a>

                <div className="mt-6 p-4 bg-warm-cream">
                  <p className="font-body text-xs text-muted-foreground text-center">Besplatna dostava za porudžbine preko 5.000 RSD</p>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-24 bg-warm-cream">
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

      {/* Back */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
        <Link to="/prodavnica" className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown hover:text-warm-dark transition-colors">
          <ArrowLeft size={14} /> Nazad na prodavnicu
        </Link>
      </div>
    </main>
  );
};

export default ProductDetail;
