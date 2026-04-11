import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { blogPosts, products } from "@/data/siteData";
import ProductCard from "@/components/ProductCard";

const BlogPost = () => {
  const { id } = useParams();
  const post = blogPosts.find((p) => p.id === id);

  if (!post) {
    return (
      <main className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-4xl text-foreground mb-4">Tekst nije pronađen</h1>
          <Link to="/blog" className="font-body text-sm text-warm-brown underline">Nazad na blog</Link>
        </div>
      </main>
    );
  }

  const k1Product = products.find((p) => p.id === "serum-k1");

  return (
    <main className="pt-24">
      {/* Hero */}
      <section className="relative py-20 lg:py-32 bg-warm-cream">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{post.date}</span>
              <span className="w-1 h-1 rounded-full bg-warm-taupe" />
              <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{post.category}</span>
              <span className="w-1 h-1 rounded-full bg-warm-taupe" />
              <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{post.author}</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground font-light leading-tight">{post.title}</h1>
          </SectionReveal>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[700px] mx-auto px-6">
          <SectionReveal>
            <img src={post.image} alt={post.title} loading="lazy" className="w-full aspect-[16/10] object-cover mb-12" />
            <div className="font-body text-base leading-[1.9] text-muted-foreground space-y-6">
              {post.content.split("\n\n").map((paragraph, i) => (
                <p key={i} className={paragraph.startsWith("Ako") ? "text-foreground font-medium" : ""}>
                  {paragraph}
                </p>
              ))}
            </div>

            {k1Product && (
              <div className="mt-12 p-8 bg-warm-cream">
                <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Proizvod iz priče</p>
                <Link to={`/proizvod/${k1Product.id}`} className="font-heading text-2xl text-foreground hover:text-warm-brown transition-colors">
                  {k1Product.name} →
                </Link>
              </div>
            )}
          </SectionReveal>
        </div>
      </section>

      {/* Back */}
      <div className="max-w-[700px] mx-auto px-6 pb-16">
        <Link to="/blog" className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown hover:text-warm-dark transition-colors">
          <ArrowLeft size={14} /> Nazad na blog
        </Link>
      </div>
    </main>
  );
};

export default BlogPost;
