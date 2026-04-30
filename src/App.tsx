import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SocialProofNotification from "@/components/SocialProofNotification";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import WelcomePopup from "@/components/WelcomePopup";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import About from "./pages/About";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import Educations from "./pages/Educations";
import EducationDetail from "./pages/EducationDetail";
import Checkout from "./pages/Checkout";
import PartnerSalons from "./pages/PartnerSalons";
import Unsubscribe from "./pages/Unsubscribe";
import ReviewSubmit from "./pages/ReviewSubmit";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSetPassword from "./pages/admin/AdminSetPassword";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminAbandonedCarts from "./pages/admin/AdminAbandonedCarts";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminPages from "./pages/admin/AdminPages";
import AdminDiscounts from "./pages/admin/AdminDiscounts";
import AdminLanding from "./pages/admin/AdminLanding";
import AdminEmailSettings from "./pages/admin/settings/AdminEmailSettings";
import AdminRecoverySettings from "./pages/admin/settings/AdminRecoverySettings";
import AdminUsers from "./pages/admin/settings/AdminUsers";
import { useEffect } from "react";

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    const scroll = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch {
        window.scrollTo(0, 0);
      }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };
    scroll();
    requestAnimationFrame(scroll);
  }, [pathname, search, hash]);
  return null;
};

// Hvata Supabase invite/recovery linkove (#access_token=...&type=invite|recovery)
// koji su redirektovani na pogrešnu stranicu i prebacuje korisnika na /admin/set-password.
const AuthHashRedirect = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return;
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const type = params.get("type");
    if (type !== "invite" && type !== "recovery" && type !== "signup") return;
    if (pathname.startsWith("/admin/set-password")) return;
    window.location.replace(`/admin/set-password${hash}`);
  }, [pathname]);
  return null;
};

const ChromeShell = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return <>{children}</>;
  return (
    <CartProvider>
      <Header />
      <CartDrawer />
      <SocialProofNotification />
      <ExitIntentPopup />
      <WelcomePopup />
      {children}
      <Footer />
    </CartProvider>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <AuthHashRedirect />
          <ChromeShell>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/o-nama" element={<About />} />
              <Route path="/prodavnica" element={<Shop />} />
              <Route path="/proizvod/:id" element={<ProductDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/kontakt" element={<Contact />} />
              <Route path="/edukacije" element={<Educations />} />
              <Route path="/edukacije/:id" element={<EducationDetail />} />
              <Route path="/partner-saloni" element={<PartnerSalons />} />
              <Route path="/naruci" element={<Checkout />} />
              <Route path="/odjava/:token" element={<Unsubscribe />} />
              <Route path="/oceni" element={<ReviewSubmit />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/set-password" element={<AdminSetPassword />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="discounts" element={<AdminDiscounts />} />
                <Route path="landing" element={<AdminLanding />} />
                <Route path="settings/email" element={<AdminEmailSettings />} />
                <Route path="settings/recovery" element={<AdminRecoverySettings />} />
              <Route path="settings/users" element={<AdminUsers />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ChromeShell>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
