import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn, signOut, user, isAdmin, accessDeniedReason, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user && isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }
    if (user && accessDeniedReason) {
      const msg =
        accessDeniedReason === "suspended"
          ? "Vaš nalog je suspendovan."
          : "Nemate pristup admin panelu.";
      toast.error(msg);
      signOut();
    }
  }, [user, isAdmin, accessDeniedReason, loading, navigate, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error("Pogrešan email ili lozinka");
      return;
    }
    toast.success("Dobrodošli");
    // Admin check + redirect happens via effect
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-6">
      <div className="w-full max-w-md bg-white p-10 border border-border shadow-sm">
        <h1 className="font-heading text-3xl text-foreground mb-2">Admin panel</h1>
        <p className="font-body text-sm text-muted-foreground mb-8">0202 SKIN</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border bg-background px-4 py-3 font-body text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="block font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Lozinka</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-border bg-background px-4 py-3 font-body text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-warm-brown text-primary-foreground py-3 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Prijava..." : "Prijavi se"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AdminLogin;
