import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminSetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase invite/recovery link dolazi sa tokenima u hash-u (#access_token=...&refresh_token=...&type=invite)
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const errDesc = params.get("error_description");

    if (errDesc) {
      setError(decodeURIComponent(errDesc));
      return;
    }

    const init = async () => {
      if (access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          setError("Link za pozivnicu je nevažeći ili je istekao. Zatražite novu pozivnicu.");
          return;
        }
        setEmail(data.user?.email || "");
        // Očisti hash iz URL-a
        window.history.replaceState(null, "", window.location.pathname);
        setReady(true);
      } else {
        // Možda je već postavljena sesija (npr. refresh stranice)
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setEmail(data.session.user.email || "");
          setReady(true);
        } else {
          setError("Nedostaje token. Otvorite link iz email pozivnice.");
        }
      }
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) {
      toast.error("Lozinka mora imati najmanje 8 karaktera");
      return;
    }
    if (pwd !== pwd2) {
      toast.error("Lozinke se ne poklapaju");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSubmitting(false);
    if (error) {
      toast.error("Greška: " + error.message);
      return;
    }
    // Označi app_user kao active
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (uid) {
        await supabase.from("app_users").update({ status: "active" }).eq("id", uid);
      }
    } catch {}
    toast.success("Lozinka postavljena. Dobrodošli!");
    navigate("/admin", { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-6">
      <div className="w-full max-w-md bg-white p-10 border border-border shadow-sm">
        <h1 className="font-heading text-3xl text-foreground mb-2">Postavite lozinku</h1>
        <p className="font-body text-sm text-muted-foreground mb-8">0202 SKIN admin panel</p>

        {error && (
          <div className="mb-6 p-4 border border-destructive/30 bg-destructive/5 text-sm text-destructive">
            {error}
          </div>
        )}

        {ready && !error && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {email && (
              <div>
                <label className="block font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full border border-border bg-muted px-4 py-3 font-body text-sm"
                />
              </div>
            )}
            <div>
              <label className="block font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Nova lozinka</label>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
                minLength={8}
                className="w-full border border-border bg-background px-4 py-3 font-body text-sm focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Potvrdite lozinku</label>
              <input
                type="password"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                required
                minLength={8}
                className="w-full border border-border bg-background px-4 py-3 font-body text-sm focus:outline-none focus:border-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-warm-brown text-primary-foreground py-3 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-dark transition-colors disabled:opacity-50"
            >
              {submitting ? "Čuvanje..." : "Postavi lozinku"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default AdminSetPassword;