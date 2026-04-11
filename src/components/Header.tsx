import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Početna", path: "/" },
  { name: "O nama", path: "/o-nama" },
  { name: "Prodavnica", path: "/prodavnica" },
  { name: "Blog", path: "/blog" },
  { name: "Edukacije", path: "/edukacije" },
  { name: "Partner saloni", path: "/partner-saloni" },
  { name: "Kontakt", path: "/kontakt" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setIsHeroVisible(window.scrollY < window.innerHeight - 100);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-[0_1px_0_hsl(var(--border))]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo */}
          <Link to="/" className="relative z-50">
            <span className="font-heading text-2xl lg:text-3xl tracking-[0.15em] text-warm-dark font-light">
              0202 <span className="text-sm tracking-[0.3em] uppercase">skin</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-body text-[13px] tracking-[0.12em] uppercase transition-colors duration-300 hover:text-warm-brown ${
                  location.pathname === link.path
                    ? "text-warm-brown"
                    : "text-warm-taupe"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <a
              href="/0202-skin-katalog.pdf"
              download
              className="font-body text-[13px] tracking-[0.12em] uppercase text-warm-taupe hover:text-warm-brown transition-colors duration-300 inline-flex items-center gap-1.5"
            >
              Katalog <Download size={13} strokeWidth={1.5} />
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link to="/prodavnica" className="text-warm-dark hover:text-warm-brown transition-colors">
              <ShoppingBag size={20} strokeWidth={1.5} />
            </Link>
            <button
              onClick={toggleMenu}
              className="lg:hidden text-warm-dark relative z-50"
              aria-label={isOpen ? "Zatvori meni" : "Otvori meni"}
            >
              {isOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-background"
          >
            <nav className="flex flex-col items-center justify-center h-full gap-7">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <Link
                    to={link.path}
                    onClick={closeMenu}
                    className={`font-heading text-3xl tracking-wider transition-colors ${
                      location.pathname === link.path
                        ? "text-warm-brown"
                        : "text-warm-dark hover:text-warm-brown"
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.04, duration: 0.25 }}
              >
                <a
                  href="/0202-skin-katalog.pdf"
                  download
                  onClick={closeMenu}
                  className="font-heading text-3xl tracking-wider text-warm-dark hover:text-warm-brown transition-colors inline-flex items-center gap-3"
                >
                  Katalog <Download size={22} strokeWidth={1.5} />
                </a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;