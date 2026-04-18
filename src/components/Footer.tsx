import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone } from "lucide-react";
import { contactInfo } from "@/data/siteData";

const Footer = () => {
  return (
    <footer className="bg-warm-dark text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Main footer */}
        <div className="py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <span className="font-heading text-2xl tracking-[0.15em] font-light">
              0202 <span className="text-sm tracking-[0.3em] uppercase">skin</span>
            </span>
            <p className="mt-4 font-body text-sm leading-relaxed opacity-70">
              Kozmetika nastala iz ljubavi prema koži. Spoj nauke i prirode u službi vaše kože.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-body text-xs tracking-[0.2em] uppercase mb-6 opacity-50">Navigacija</h4>
            <div className="flex flex-col gap-3">
              {[
                { name: "Početna", path: "/" },
                { name: "O nama", path: "/o-nama" },
                { name: "Prodavnica", path: "/prodavnica" },
                { name: "Blog", path: "/blog" },
                { name: "Edukacije", path: "/edukacije" },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="font-body text-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* More links */}
          <div>
            <h4 className="font-body text-xs tracking-[0.2em] uppercase mb-6 opacity-50">Više</h4>
            <div className="flex flex-col gap-3">
              {[
                { name: "Partner saloni", path: "/partner-saloni" },
                { name: "Kontakt", path: "/kontakt" },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="font-body text-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body text-xs tracking-[0.2em] uppercase mb-6 opacity-50">Kontakt</h4>
            <div className="flex flex-col gap-3">
              <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 font-body text-sm opacity-70 hover:opacity-100 transition-opacity">
                <Mail size={14} /> {contactInfo.email}
              </a>
              {contactInfo.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 font-body text-sm opacity-70 hover:opacity-100 transition-opacity">
                  <Phone size={14} /> {phone}
                </a>
              ))}
              <p className="font-body text-sm opacity-50 mt-2">{contactInfo.workingHours}</p>
            </div>
            <div className="flex gap-4 mt-6">
              <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
                <Instagram size={18} />
              </a>
              <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
                <Facebook size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/10 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-xs opacity-40">
            © {new Date().getFullYear()} 0202 SKIN. Sva prava zadržana.
          </p>
          <p className="font-body text-xs opacity-40">
            Premium skincare · Srbija
          </p>
        </div>

        {/* Credit badge */}
        <div className="pb-8 flex justify-center">
          <a
            href="https://luno.rs"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-primary-foreground/15 bg-primary/20 hover:bg-primary/40 transition-colors"
          >
            <span className="font-body text-[11px] tracking-wide text-primary-foreground/50 group-hover:text-primary-foreground/70 transition-colors">
              Sajt izradio
            </span>
            <span className="font-body text-[11px] font-bold tracking-wide text-primary-foreground group-hover:text-primary-foreground transition-colors">
              luno.rs
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
