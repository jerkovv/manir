import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Droplets, Shield, Heart, Sparkles, FlaskConical, Leaf } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import ProductCard from "@/components/ProductCard";
import { brandValues, blogPosts, educations } from "@/data/siteData";
import { fetchProducts, productImage, type Product } from "@/lib/products";
import heroImage from "@/assets/hero-blurred.jpg";
import heroOfferImage from "@/assets/hero-0202.jpg";
import selfcareImage from "@/assets/selfcare-ritual.jpg";
import scienceImage from "@/assets/brand-science.jpg";

const marqueeItems = [
  "Prirodna kozmetika", "Čista formula", "Rezultati na koži", "Balans kože",
  "Obnova barijere", "Self care", "Stručna nega", "Zdrava koža",
  "Bez kompromisa", "Ciljana rešenja", "Nauka i praksa", "Hidratacija",
  "Umirenje kože", "Profesionalni rezultati", "Ljubav prema sebi",
];

const valueIcons = [Droplets, Shield, Heart, Sparkles, FlaskConical, Leaf];

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  useEffect(() => {
    fetchProducts().then((all) => {
      const featured = all.filter((p) => p.featured);
      setFeaturedProducts((featured.length ? featured : all).slice(0, 4));
    });
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-screen flex items-end overflow-hidden bg-warm-dark">
        {/* Background image with heavy cinematic overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="0202 SKIN premium skincare proizvodi"
            className="w-full h-full object-cover object-center scale-105"
            width={1920}
            height={1080}
          />
          {/* Multi-layer cinematic grade */}
          <div className="absolute inset-0 bg-gradient-to-t from-warm-dark via-warm-dark/60 to-warm-dark/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-warm-dark/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-warm-dark/15" />
        </div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-12 top-28 bottom-28 w-px bg-gradient-to-b from-transparent via-primary-foreground/20 to-transparent origin-top hidden lg:block"
        />

        {/* Content */}
        <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 lg:px-12 pb-16 md:pb-24 lg:pb-32 pt-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center gap-4 mb-8"
            >
              <span className="w-10 h-px bg-warm-gold" />
              <span className="font-body text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-warm-gold">
                Premium Skincare
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-heading text-[3.2rem] md:text-[5.5rem] lg:text-[7rem] xl:text-[8rem] text-white font-light leading-[0.92] mb-8 drop-shadow-[0_2px_30px_rgba(0,0,0,0.3)]"
            >
              Ritual nege.
              <br />
              <span className="italic text-warm-cream">Nauka i priroda.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="font-body text-[15px] md:text-lg text-white/75 leading-relaxed max-w-[520px] mb-12"
            >
              Kozmetika nastala iz ljubavi prema koži i želje da ponudi stvarna rešenja za savremene probleme i stanja kože.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/prodavnica"
                className="group inline-flex items-center gap-3 bg-white text-warm-dark px-9 py-[18px] font-body text-[11px] tracking-[0.2em] uppercase hover:bg-warm-cream transition-all duration-500 shadow-[0_4px_30px_rgba(0,0,0,0.15)]"
              >
                Poručite ovde
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                to="/o-nama"
                className="inline-flex items-center gap-3 border border-white/25 text-white px-9 py-[18px] font-body text-[11px] tracking-[0.2em] uppercase hover:bg-white/8 hover:border-white/40 transition-all duration-500 backdrop-blur-sm"
              >
                Naša priča
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-8 right-12 hidden lg:flex flex-col items-center gap-3"
          >
            <span className="font-body text-[9px] tracking-[0.3em] uppercase text-white/40 [writing-mode:vertical-lr]">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent"
            />
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
      <div className="py-5 bg-warm-cream overflow-hidden border-y border-border">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="font-body text-[11px] tracking-[0.2em] uppercase text-muted-foreground mx-8 flex items-center gap-3">
              <span className="w-1 h-1 rounded-full bg-warm-taupe" /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* Trenutna ponuda */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <div className="max-w-[540px] mx-auto">
              <span className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-6 text-center">Trenutna ponuda</span>
              <Link to="/prodavnica" className="group block overflow-hidden border border-border/60 shadow-[0_30px_80px_-30px_hsl(var(--foreground)/0.18)]">
                <img
                  src={heroOfferImage}
                  alt="0202 SKIN trenutna ponuda"
                  loading="lazy"
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
                  width={1080}
                  height={1350}
                />
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Brand Intro */}
      <section className="py-24 lg:py-36">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <SectionReveal>
              <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-6">O brendu</span>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground font-light leading-[1.1] mb-8">
                Spoj nauke i <span className="italic">prirode</span> u službi vaše kože
              </h2>
              <div className="space-y-5 font-body text-base leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">0202 SKIN je kozmetika nastala iz ljubavi prema koži</strong> i želje da ponudi stvarna rešenja za savremene probleme i stanja kože.
                </p>
                <p>
                  Kombinujući znanje farmacije i iskustvo profesionalnih kozmetičara, razvijamo formule koje ciljano deluju na uzrok, a ne samo na posledice.
                </p>
                <p>
                  Ali 0202 SKIN je više od kozmetike. To je ritual nege, trenutak koji posvećujete sebi. Self care koji nije luksuz, već potreba.
                </p>
                <p className="text-foreground font-medium italic font-heading text-lg">
                  „Negovana koža nije slučajnost. Ona je rezultat pažnje, znanja i ljubavi prema sebi."
                </p>
              </div>
            </SectionReveal>
            <SectionReveal delay={0.2}>
              <div className="relative">
                <img
                  src={scienceImage}
                  alt="0202 SKIN spoj nauke i prirode"
                  loading="lazy"
                  className="w-full aspect-[4/5] object-cover"
                  width={1024}
                  height={1024}
                />
                <div className="absolute -bottom-6 -left-6 bg-warm-brown text-primary-foreground p-8 max-w-[240px]">
                  <p className="font-heading text-3xl font-light">15+</p>
                  <p className="font-body text-xs tracking-[0.1em] uppercase mt-1 opacity-80">Godina iskustva u kozmetičkoj praksi</p>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="py-24 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <div className="text-center mb-16">
              <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">Vrednosti</span>
              <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground">Zašto 0202 SKIN</h2>
            </div>
          </SectionReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brandValues.map((value, i) => {
              const Icon = valueIcons[i];
              return (
                <SectionReveal key={value.title} delay={i * 0.1}>
                  <div className="bg-background p-8 lg:p-10 group hover:shadow-[0_20px_60px_-15px_hsl(var(--warm-nude)/0.3)] transition-shadow duration-500">
                    <Icon size={28} strokeWidth={1} className="text-warm-brown mb-6" />
                    <h3 className="font-heading text-2xl text-foreground mb-3">{value.title}</h3>
                    <p className="font-body text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                  </div>
                </SectionReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 lg:py-36">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">Kolekcija</span>
                <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground">Izdvojeni proizvodi</h2>
              </div>
              <Link
                to="/prodavnica"
                className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown hover:text-warm-dark transition-colors"
              >
                Svi proizvodi <ArrowRight size={14} />
              </Link>
            </div>
          </SectionReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} id={p.slug} name={p.name} price={Number(p.price)} category={p.category || ""} image={productImage(p)} featured={p.featured} size={p.size || undefined} />
            ))}
          </div>
        </div>
      </section>

      {/* Self-care Section */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0">
          <img src={selfcareImage} alt="Self-care ritual" loading="lazy" className="w-full h-full object-cover" width={1280} height={960} />
          <div className="absolute inset-0 bg-warm-dark/50" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal>
            <span className="font-body text-[11px] tracking-[0.3em] uppercase text-primary-foreground/60 block mb-6">Ritual</span>
            <h2 className="font-heading text-4xl md:text-6xl lg:text-7xl text-primary-foreground font-light leading-[1.1] mb-8 max-w-3xl mx-auto">
              Kada usporite, počinje <span className="italic">prava promena</span>
            </h2>
            <p className="font-body text-base md:text-lg text-primary-foreground/80 max-w-xl mx-auto leading-relaxed mb-10">
              Kada birate šta stavljate na svoju kožu i kako se odnosite prema sebi — to je trenutak u kome se rađa lepota. 0202 SKIN je vaš svakodnevni ritual nege.
            </p>
            <Link
              to="/prodavnica"
              className="inline-flex items-center gap-3 bg-primary-foreground text-warm-dark px-8 py-4 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-cream transition-colors"
            >
              Otkrijte kolekciju <ArrowRight size={14} />
            </Link>
          </SectionReveal>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-24 lg:py-36">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">Blog</span>
                <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground">Priče i saveti</h2>
              </div>
              <Link to="/blog" className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown hover:text-warm-dark transition-colors">
                Svi tekstovi <ArrowRight size={14} />
              </Link>
            </div>
          </SectionReveal>
          {blogPosts.map((post) => (
            <SectionReveal key={post.id}>
              <Link to={`/blog/${post.id}`} className="group grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                <div className="overflow-hidden aspect-[16/10]">
                  <img src={post.image} alt={post.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div>
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{post.date} · {post.category}</span>
                  <h3 className="font-heading text-3xl md:text-4xl text-foreground mt-3 mb-4 group-hover:text-warm-brown transition-colors">{post.title}</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown">
                    Pročitaj više <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Educations Preview */}
      <section className="py-24 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <div className="text-center mb-16">
              <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">Edukacije</span>
              <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground">Stručne beauty edukacije</h2>
              <p className="font-body text-sm text-muted-foreground mt-4 max-w-lg mx-auto">
                Unapredite svoju karijeru u beauty industriji uz stručne edukacije visokog nivoa
              </p>
            </div>
          </SectionReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {educations.map((edu, i) => (
              <SectionReveal key={edu.id} delay={i * 0.1}>
                <Link to={`/edukacije/${edu.id}`} className="group block bg-background p-8 lg:p-10 hover:shadow-[0_20px_60px_-15px_hsl(var(--warm-nude)/0.3)] transition-all duration-500">
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase text-warm-brown">{edu.price}</span>
                  <h3 className="font-heading text-2xl text-foreground mt-2 mb-3 group-hover:text-warm-brown transition-colors">{edu.title}</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">{edu.subtitle}</p>
                  <span className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown">
                    Saznaj više <ArrowRight size={12} />
                  </span>
                </Link>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 lg:py-36 bg-warm-dark text-primary-foreground text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <span className="font-body text-[11px] tracking-[0.3em] uppercase opacity-50 block mb-6">0202 SKIN</span>
            <h2 className="font-heading text-4xl md:text-6xl lg:text-7xl font-light leading-[1.1] mb-8 max-w-3xl mx-auto">
              Vaša koža zaslužuje <span className="italic">najbolje</span>
            </h2>
            <p className="font-body text-base opacity-70 max-w-lg mx-auto mb-10">
              Otkrijte premium skincare kolekciju zasnovanu na nauci, stručnosti i ljubavi prema koži.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/prodavnica" className="inline-flex items-center gap-3 bg-primary-foreground text-warm-dark px-8 py-4 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-cream transition-colors">
                Prodavnica <ArrowRight size={14} />
              </Link>
              <Link to="/kontakt" className="inline-flex items-center gap-3 border border-primary-foreground/30 px-8 py-4 font-body text-xs tracking-[0.15em] uppercase hover:bg-primary-foreground/10 transition-colors">
                Kontaktirajte nas
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
};

export default Index;
