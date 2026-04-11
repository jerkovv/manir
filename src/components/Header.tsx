import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

const navLinks = [
  { name: "Početna", path: "/" },
  { name: "O nama", path: "/o-nama" },
  { name: "Prodavnica", path: "/prodavnica" },
  { name: "Blog", path: "/blog" },
  { name: "Edukacije", path: "/edukacije" },
  { name: "Katalog", path: "/katalog", isDownload: true },
  { name: "Partner saloni", path: "/partner-saloni" },
  { name: "Kontakt", path: "/kontakt" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const location = useLocation();
  const { totalItems, setIsCartOpen } = useCart();

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

  const isOnHero = location.pathname === "/" && isHeroVisible && !scrolled;

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
            <span className={`font-heading text-2xl lg:text-3xl tracking-[0.15em] font-light transition-colors duration-500 ${isOnHero ? "text-white" : "text-warm-dark"}`}>
              0202 <span className="text-sm tracking-[0.3em] uppercase">skin</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isDownload ? (
                <a
                  key={link.path}
                  href="/0202-skin-katalog.pdf"
                  download
                  className={`font-body text-[13px] tracking-[0.12em] uppercase transition-colors duration-300 inline-flex items-center gap-1.5 ${
                    isOnHero ? "text-white/70 hover:text-white" : "text-warm-taupe hover:text-warm-brown"
                  }`}
                >
                  {link.name} <Download size={13} strokeWidth={1.5} />
                </a>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-body text-[13px] tracking-[0.12em] uppercase transition-colors duration-300 ${
                    isOnHero
                      ? location.pathname === link.path ? "text-white" : "text-white/70 hover:text-white"
                      : location.pathname === link.path ? "text-warm-brown" : "text-warm-taupe hover:text-warm-brown"
                  }`}
                >
                  {link.name}
                </Link>
              )
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative transition-colors ${isOnHero ? "text-white/80 hover:text-white" : "text-warm-dark hover:text-warm-brown"}`}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-warm-brown text-primary-foreground text-[9px] font-body font-medium rounded-full flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>
            <button
              onClick={toggleMenu}
              className={`lg:hidden relative z-50 transition-colors ${isOnHero ? "text-white" : "text-warm-dark"}`}
              aria-label={isOpen ? "Zatvori meni" : "Otvori meni"}
            >
              {isOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/100 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--background))' }}
            onClick={(e) => {
              // Close if clicking the backdrop itself
              if (e.target === e.currentTarget) closeMenu();
            }}
          >
            <nav className="flex flex-col items-center gap-7">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  {link.isDownload ? (
                    <a
                      href="/0202-skin-katalog.pdf"
                      download
                      onClick={closeMenu}
                      className="font-heading text-3xl tracking-wider text-warm-dark hover:text-warm-brown transition-colors inline-flex items-center gap-3"
                    >
                      {link.name} <Download size={22} strokeWidth={1.5} />
                    </a>
                  ) : (
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
                  )}
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;