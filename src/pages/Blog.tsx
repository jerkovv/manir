import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { blogPosts } from "@/data/siteData";

const Blog = () => {
  return (
    <main className="pt-24">
      <section className="py-20 lg:py-28 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal>
            <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">Blog</span>
            <h1 className="font-heading text-5xl md:text-7xl font-light text-foreground">Priče i saveti</h1>
            <p className="font-body text-base text-muted-foreground mt-4 max-w-lg mx-auto">
              Inspiracija, stručni saveti i iskustva iz sveta nege kože
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Featured post */}
          {blogPosts.length > 0 && (
            <SectionReveal>
              <Link to={`/blog/${blogPosts[0].id}`} className="group grid md:grid-cols-2 gap-8 lg:gap-16 items-center mb-16">
                <div className="overflow-hidden aspect-[16/10]">
                  <img src={blogPosts[0].image} alt={blogPosts[0].title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div>
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase text-warm-brown">Najnovije</span>
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground ml-4">{blogPosts[0].date}</span>
                  <h2 className="font-heading text-3xl md:text-4xl text-foreground mt-3 mb-4 group-hover:text-warm-brown transition-colors">{blogPosts[0].title}</h2>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">{blogPosts[0].excerpt}</p>
                  <span className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown">
                    Pročitaj više <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            </SectionReveal>
          )}

          {/* More posts grid */}
          {blogPosts.length > 1 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.slice(1).map((post) => (
                <SectionReveal key={post.id}>
                  <Link to={`/blog/${post.id}`} className="group block">
                    <div className="overflow-hidden aspect-[16/10] mb-4">
                      <img src={post.image} alt={post.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{post.date} · {post.category}</span>
                    <h3 className="font-heading text-xl text-foreground mt-2 mb-2 group-hover:text-warm-brown transition-colors">{post.title}</h3>
                    <p className="font-body text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  </Link>
                </SectionReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Blog;
