import SectionReveal from "@/components/SectionReveal";
import scienceImage from "@/assets/brand-science.jpg";
import selfcareImage from "@/assets/selfcare-ritual.jpg";
import introVideo from "@/assets/0202-intro.mp4";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const About = () => {
  return (
    <main className="pt-24">
      {/* Page Hero */}
      <section className="py-20 lg:py-28 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal>
            <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">O nama</span>
            <h1 className="font-heading text-5xl md:text-7xl font-light text-foreground">Naša priča</h1>
          </SectionReveal>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 lg:py-36">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <SectionReveal>
              <video
                src={introVideo}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto block"
              />
            </SectionReveal>
            <SectionReveal delay={0.2}>
              <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-8">Naša priča</h2>
              <div className="space-y-5 font-body text-base leading-relaxed text-muted-foreground">
                <p><strong className="text-foreground">0202 SKIN</strong> je nastao iz ljubavi prema koži i želje da spojimo najbolje iz nauke i prirode. Nakon više od 15 godina iskustva u kozmetičkoj praksi, udružili smo snage sa magistrom farmacije i fitoterapeutom kako bismo kreirali prirodne kozmetičke proizvode koji daju vidljive rezultate, a pritom neguju, regenerišu i štite kožu.</p>
                <p>Ime brenda 0202 ima ličnu i emotivnu dimenziju – i u tom smislu simbolizuje ljubav, nežnost i povezanost. Broj 0202 evocira ciklus harmonije i regeneracije, baš kao naši proizvodi koji balansiraju nauku i prirodu.</p>
                <p>Ovi brojevi označavaju stabilnost i čvrstu osnovu – upravo je to ono što stoji iza naših prirodnih, stručno formulisanih sastojaka. Estetski, simetričnost broja 0202 prenosi osećaj sklada i elegancije.</p>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <SectionReveal>
              <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground italic mb-8 leading-tight">
                Dobrodošli u 0202 SKIN – spoj nauke i prirode u službi vaše kože
              </h2>
              <p className="font-body text-base text-muted-foreground leading-relaxed">
                Naša misija je da negujemo, obnavljamo i inspirišemo – i vašu kožu i vaša čula.
              </p>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24 lg:py-36">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <SectionReveal>
              <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-6">Filozofija</span>
              <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-8">Naša filozofija i misija</h2>
              <div className="space-y-5 font-body text-base leading-relaxed text-muted-foreground">
                <p>Verujemo u to da lepota dolazi iznutra i da je najblistavija kada je prirodna. Upravo to podržavaju naši proizvodi. U njima kombinujemo aktivne biljne sastojke i stručnu formulaciju, pružajući nežnu, ali efikasnu negu.</p>
                <p>Pored toga što hranimo kožu lica i tela, podržavamo i negujemo osećaj kompletnog blagostanja. Tretiranje kože 0202 SKIN proizvodima je deo celokupnog self-care rituala.</p>
                <p>Želimo da svaka osoba koja redovno koristi kombinacije prirodnih 0202 SKIN proizvoda veoma brzo oseti razliku – kožu koja diše, regeneriše se i zrači zdravljem.</p>
              </div>
            </SectionReveal>
            <SectionReveal delay={0.2}>
              <img src={selfcareImage} alt="Self-care ritual" loading="lazy" className="w-full aspect-[4/5] object-cover" />
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* What sets us apart */}
      <section className="py-24 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground text-center mb-16">Šta nas izdvaja?</h2>
          </SectionReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Stručnost", desc: "Spoj kozmetičara, farmaceuta i fitoterapeuta" },
              { title: "Aktivne formule", desc: "Pažljivo odabrani sastojci sa dokazanim efektima" },
              { title: "Biljna baza", desc: "Prirodni temelj koji podržava zdravlje kože" },
              { title: "Holistički pristup", desc: "Tretiranje kože kao deo celokupnog blagostanja" },
            ].map((item, i) => (
              <SectionReveal key={item.title} delay={i * 0.1}>
                <div className="bg-background p-8 text-center">
                  <h3 className="font-heading text-2xl text-foreground mb-3">{item.title}</h3>
                  <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground italic mb-6">
              0202 Skin je spoj dugogodišnjeg iskustva i naučnih istraživanja
            </h2>
            <p className="font-body text-base text-muted-foreground mb-8 max-w-xl mx-auto">
              Naše formule su osmišljene da pruže vidljive rezultate, koristeći samo najkvalitetnije prirodne sastojke, bez parabena i štetnih aditiva.
            </p>
            <Link to="/prodavnica" className="inline-flex items-center gap-3 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-dark transition-colors">
              Pogledaj ponudu <ArrowRight size={14} />
            </Link>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
};

export default About;
