import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { partnerSalons } from "@/data/siteData";

const PartnerSalons = () => {
  return (
    <main className="pt-24">
      <section className="py-20 lg:py-28 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal>
            <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">Partneri</span>
            <h1 className="font-heading text-5xl md:text-7xl font-light text-foreground">Partner saloni</h1>
            <p className="font-body text-base text-muted-foreground mt-4 max-w-lg mx-auto">Naši proizvodi su dostupni i u partnerskim salonima</p>
          </SectionReveal>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-8">
            {partnerSalons.map((salon) => (
              <SectionReveal key={salon.name}>
                <div className="bg-warm-cream overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={salon.image}
                      alt={salon.name}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      width={800}
                      height={600}
                    />
                  </div>
                  <div className="p-8 lg:p-10">
                    <div className="flex items-center gap-4 mb-4">
                      {salon.logo && (
                        <img src={salon.logo} alt={`${salon.name} logo`} className="w-12 h-12 object-contain" />
                      )}
                      <h3 className="font-heading text-2xl text-foreground">{salon.name}</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-warm-brown flex-shrink-0 mt-0.5" />
                        <span className="font-body text-sm text-muted-foreground">{salon.address}, {salon.city}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-warm-brown flex-shrink-0" />
                        <a href={`tel:${salon.phone.replace(/\s/g, "")}`} className="font-body text-sm text-foreground hover:text-warm-brown transition-colors">{salon.phone}</a>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>

          <SectionReveal>
            <div className="mt-16 text-center bg-warm-cream p-10">
              <h2 className="font-heading text-3xl text-foreground mb-4">Želite da vaš salon postane naš partner?</h2>
              <p className="font-body text-sm text-muted-foreground mb-6">Javite nam se i pružite svojim klijentima luksuznu negu kože.</p>
              <Link to="/kontakt" className="inline-flex items-center gap-3 bg-warm-brown text-primary-foreground px-8 py-4 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-dark transition-colors">
                Kontaktirajte nas
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
};

export default PartnerSalons;