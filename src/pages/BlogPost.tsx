import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { supabase } from "@/integrations/supabase/client";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  featured_image: string | null;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" }) : "";

const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", id)
        .eq("published", true)
        .maybeSingle();
      setPost(data as Post | null);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (post?.meta_title) document.title = post.meta_title;
    else if (post?.title) document.title = post.title;
  }, [post]);

  if (loading) {
    return <main className="pt-24 min-h-screen flex items-center justify-center font-body text-sm text-muted-foreground">Učitavanje...</main>;
  }

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

  return (
    <main className="pt-24">
      <section className="relative py-20 lg:py-32 bg-warm-cream">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
              <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{formatDate(post.published_at || post.created_at)}</span>
              {post.tags?.[0] && (
                <>
                  <span className="w-1 h-1 rounded-full bg-warm-taupe" />
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{post.tags[0]}</span>
                </>
              )}
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground font-light leading-tight">{post.title}</h1>
            {post.excerpt && <p className="font-body text-base text-muted-foreground mt-6 max-w-xl mx-auto leading-relaxed">{post.excerpt}</p>}
          </SectionReveal>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-[700px] mx-auto px-6">
          <SectionReveal>
            {post.featured_image && (
              <img src={post.featured_image} alt={post.title} loading="lazy" className="w-full aspect-[16/10] object-cover mb-12" />
            )}
            <div className="font-body text-base leading-[1.9] text-muted-foreground space-y-6">
              {(post.body || "").split(/\n\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      <div className="max-w-[700px] mx-auto px-6 pb-16">
        <Link to="/blog" className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown hover:text-warm-dark transition-colors">
          <ArrowLeft size={14} /> Nazad na blog
        </Link>
      </div>
    </main>
  );
};

export default BlogPost;
