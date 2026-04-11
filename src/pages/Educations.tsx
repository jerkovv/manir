import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { educations } from "@/data/siteData";

const Educations = () => {
  return (
    <main className="pt-24">
      <section className="py-20 lg:py-28 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal>
            <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">Edukacije</span>
            <h1 className="font-heading text-5xl md:text-7xl font-light text-foreground">Stručne beauty edukacije</h1>
            <p className="font-body text-base text-muted-foreground mt-4 max-w-lg mx-auto">Unapredite svoju karijeru u beauty industriji uz stručne edukacije visokog nivoa</p>
          </SectionReveal>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 space-y-16">
          {educations.map((edu, i) => (
            <SectionReveal key={edu.id}>
              <Link to={`/edukacije/${edu.id}`} className="group block bg-warm-cream p-8 lg:p-12 hover:shadow-[0_20px_60px_-15px_hsl(var(--warm-nude)/0.3)] transition-all duration-500">
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                  <div className="lg:col-span-2">
                    <span className="font-body text-[10px] tracking-[0.2em] uppercase text-warm-brown">{edu.price} · {edu.date}</span>
                    <h2 className="font-heading text-3xl md:text-4xl text-foreground mt-2 mb-3 group-hover:text-warm-brown transition-colors">{edu.title}</h2>
                    <p className="font-body text-lg text-muted-foreground mb-4">{edu.subtitle}</p>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">{edu.description}</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <span className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown">
                      Saznaj više <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </SectionReveal>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Educations;
