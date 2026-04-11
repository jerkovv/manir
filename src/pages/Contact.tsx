import { useState } from "react";
import SectionReveal from "@/components/SectionReveal";
import { contactInfo } from "@/data/siteData";
import { Mail, Phone, Clock, Instagram, Facebook } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  return (
    <main className="pt-24">
      <section className="py-20 lg:py-28 bg-warm-cream">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal>
            <span className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground block mb-4">Kontakt</span>
            <h1 className="font-heading text-5xl md:text-7xl font-light text-foreground">Javite nam se</h1>
          </SectionReveal>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-5 gap-16">
            <div className="lg:col-span-2">
              <SectionReveal>
                <h2 className="font-heading text-3xl text-foreground mb-8">Kontakt informacije</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Mail size={18} className="text-warm-brown mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Email</p>
                      <a href={`mailto:${contactInfo.email}`} className="font-body text-base text-foreground hover:text-warm-brown transition-colors">{contactInfo.email}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone size={18} className="text-warm-brown mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Telefon</p>
                      {contactInfo.phones.map((p) => (
                        <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="block font-body text-base text-foreground hover:text-warm-brown transition-colors">{p}</a>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock size={18} className="text-warm-brown mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Radno vreme</p>
                      <p className="font-body text-base text-foreground">{contactInfo.workingHours}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="text-warm-brown hover:text-warm-dark transition-colors"><Instagram size={20} /></a>
                  <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="text-warm-brown hover:text-warm-dark transition-colors"><Facebook size={20} /></a>
                </div>
              </SectionReveal>
            </div>
            <div className="lg:col-span-3">
              <SectionReveal delay={0.2}>
                <h2 className="font-heading text-3xl text-foreground mb-8">Kontaktirajte nas</h2>
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground block mb-2">Ime i prezime</label>
                      <input type="text" className="w-full bg-warm-cream border-0 px-4 py-3.5 font-body text-sm text-foreground focus:ring-1 focus:ring-warm-brown outline-none transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground block mb-2">Email</label>
                      <input type="email" className="w-full bg-warm-cream border-0 px-4 py-3.5 font-body text-sm text-foreground focus:ring-1 focus:ring-warm-brown outline-none transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground block mb-2">Naslov</label>
                    <input type="text" className="w-full bg-warm-cream border-0 px-4 py-3.5 font-body text-sm text-foreground focus:ring-1 focus:ring-warm-brown outline-none transition-all" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} />
                  </div>
                  <div>
                    <label className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground block mb-2">Poruka</label>
                    <textarea rows={6} className="w-full bg-warm-cream border-0 px-4 py-3.5 font-body text-sm text-foreground focus:ring-1 focus:ring-warm-brown outline-none transition-all resize-none" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} />
                  </div>
                  <button type="submit" className="bg-warm-brown text-primary-foreground px-8 py-4 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-dark transition-colors">
                    Pošaljite poruku
                  </button>
                </form>
              </SectionReveal>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
