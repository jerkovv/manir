import { useState } from "react";
import SectionReveal from "@/components/SectionReveal";
import ProductCard from "@/components/ProductCard";
import { products, categories } from "@/data/siteData";

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter((p) => p.categorySlug === activeCategory);

  return (
    <main className="pt-24">
      <section className="py-20 lg:py-28 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal>
            <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">Kolekcija</span>
            <h1 className="font-heading text-5xl md:text-7xl font-light text-foreground">Prodavnica</h1>
          </SectionReveal>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Filters */}
          <SectionReveal>
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`font-body text-[11px] tracking-[0.15em] uppercase px-6 py-2.5 transition-all duration-300 ${
                    activeCategory === cat.slug
                      ? "bg-warm-brown text-primary-foreground"
                      : "bg-warm-cream text-muted-foreground hover:bg-warm-beige"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </SectionReveal>

          {/* Products Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Shop;
