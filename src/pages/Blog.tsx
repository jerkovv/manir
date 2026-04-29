import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { supabase } from "@/integrations/supabase/client";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" }) : "";

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, featured_image, tags, published_at, created_at")
        .eq("published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      setPosts((data as Post[]) || []);
      setLoading(false);
    })();
  }, []);

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
          {loading ? (
            <p className="text-center font-body text-sm text-muted-foreground">Učitavanje...</p>
          ) : posts.length === 0 ? (
            <p className="text-center font-body text-sm text-muted-foreground">Uskoro novi tekstovi.</p>
          ) : (
            <>
              <SectionReveal>
                <Link to={`/blog/${posts[0].slug}`} className="group grid md:grid-cols-2 gap-8 lg:gap-16 items-center mb-16">
                  {posts[0].featured_image && (
                    <div className="overflow-hidden aspect-[16/10]">
                      <img src={posts[0].featured_image} alt={posts[0].title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  )}
                  <div>
                    <span className="font-body text-[10px] tracking-[0.2em] uppercase text-warm-brown">Najnovije</span>
                    <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground ml-4">{formatDate(posts[0].published_at || posts[0].created_at)}</span>
                    <h2 className="font-heading text-3xl md:text-4xl text-foreground mt-3 mb-4 group-hover:text-warm-brown transition-colors">{posts[0].title}</h2>
                    {posts[0].excerpt && <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">{posts[0].excerpt}</p>}
                    <span className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown">
                      Pročitaj više <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </SectionReveal>

              {posts.length > 1 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.slice(1).map((post) => (
                    <SectionReveal key={post.id}>
                      <Link to={`/blog/${post.slug}`} className="group block">
                        {post.featured_image && (
                          <div className="overflow-hidden aspect-[16/10] mb-4">
                            <img src={post.featured_image} alt={post.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          </div>
                        )}
                        <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                          {formatDate(post.published_at || post.created_at)}
                          {post.tags?.[0] && ` · ${post.tags[0]}`}
                        </span>
                        <h3 className="font-heading text-xl text-foreground mt-2 mb-2 group-hover:text-warm-brown transition-colors">{post.title}</h3>
                        {post.excerpt && <p className="font-body text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                      </Link>
                    </SectionReveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Blog;
