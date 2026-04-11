import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, MapPin, Calendar, CreditCard } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { educations } from "@/data/siteData";

const EducationDetail = () => {
  const { id } = useParams();
  const edu = educations.find((e) => e.id === id);

  if (!edu) {
    return (
      <main className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-4xl text-foreground mb-4">Edukacija nije pronađena</h1>
          <Link to="/edukacije" className="font-body text-sm text-warm-brown underline">Nazad na edukacije</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24">
      <section className="py-20 lg:py-28 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal>
            <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">Edukacija</span>
            <h1 className="font-heading text-5xl md:text-7xl font-light text-foreground">{edu.title}</h1>
            <p className="font-body text-lg text-muted-foreground mt-4">{edu.subtitle}</p>
          </SectionReveal>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: CreditCard, label: "Cena", value: edu.price },
              { icon: MapPin, label: "Lokacija", value: edu.location },
              { icon: Calendar, label: "Datum", value: edu.date },
            ].map(({ icon: Icon, label, value }) => (
              <SectionReveal key={label}>
                <div className="bg-warm-cream p-6 text-center">
                  <Icon size={20} className="text-warm-brown mx-auto mb-3" />
                  <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">{label}</p>
                  <p className="font-body text-sm font-medium text-foreground">{value}</p>
                </div>
              </SectionReveal>
            ))}
          </div>

          <SectionReveal>
            <p className="font-body text-base text-muted-foreground leading-relaxed mb-12">{edu.description}</p>

            <h2 className="font-heading text-3xl text-foreground mb-6">Šta te očekuje</h2>
            <div className="space-y-3 mb-12">
              {edu.features.map((f) => (
                <div key={f} className="flex items-center gap-3 p-4 bg-warm-cream">
                  <Check size={16} className="text-warm-brown flex-shrink-0" />
                  <span className="font-body text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>

            {edu.bonuses.length > 0 && (
              <>
                <h2 className="font-heading text-3xl text-foreground mb-6">Bonus sadržaj</h2>
                <div className="space-y-3 mb-12">
                  {edu.bonuses.map((b) => (
                    <div key={b} className="flex items-center gap-3 p-4 bg-warm-cream">
                      <Check size={16} className="text-warm-brown flex-shrink-0" />
                      <span className="font-body text-sm text-foreground">{b}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="text-center mt-16">
              <Link to="/kontakt" className="inline-flex items-center gap-3 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-dark transition-colors">
                Prijavi se / Kontaktiraj nas
              </Link>
            </div>
          </SectionReveal>

          <div className="mt-12">
            <Link to="/edukacije" className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-warm-brown hover:text-warm-dark transition-colors">
              <ArrowLeft size={14} /> Sve edukacije
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default EducationDetail;
