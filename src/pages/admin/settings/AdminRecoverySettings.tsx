import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Mail, ShoppingCart, Star, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Settings = {
  abandoned_cart_enabled: boolean;
  email1_delay_minutes: number;
  email2_delay_hours: number;
  review_emails_enabled: boolean;
  review_request_delay_days: number;
};

const DEFAULTS: Settings = {
  abandoned_cart_enabled: false,
  email1_delay_minutes: 30,
  email2_delay_hours: 72,
  review_emails_enabled: false,
  review_request_delay_days: 14,
};

const AdminRecoverySettings = () => {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("recovery_settings" as any)
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) {
        toast.error("Greška pri učitavanju: " + error.message);
      } else if (data) {
        const d = data as any;
        setS({
          abandoned_cart_enabled: !!d.abandoned_cart_enabled,
          email1_delay_minutes: Number(d.email1_delay_minutes ?? 30),
          email2_delay_hours: Number(d.email2_delay_hours ?? 72),
          review_emails_enabled: !!d.review_emails_enabled,
          review_request_delay_days: Number(d.review_request_delay_days ?? 14),
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (s.email1_delay_minutes < 1 || s.email1_delay_minutes > 1440) {
      return toast.error("Prvi email: 1–1440 minuta");
    }
    if (s.email2_delay_hours < 1 || s.email2_delay_hours > 720) {
      return toast.error("Drugi email: 1–720 sati");
    }
    if (s.review_request_delay_days < 1 || s.review_request_delay_days > 90) {
      return toast.error("Review delay: 1–90 dana");
    }
    setSaving(true);
    const { error } = await supabase
      .from("recovery_settings" as any)
      .update({
        abandoned_cart_enabled: s.abandoned_cart_enabled,
        email1_delay_minutes: s.email1_delay_minutes,
        email2_delay_hours: s.email2_delay_hours,
        review_emails_enabled: s.review_emails_enabled,
        review_request_delay_days: s.review_request_delay_days,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) return toast.error("Greška: " + error.message);
    toast.success("Sačuvano");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl mb-1">Recovery email-ovi</h1>
        <p className="font-body text-sm text-muted-foreground">
          Kontrola automatskih email-ova za napuštene korpe i molbe za ocenu proizvoda.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 mb-6 flex items-start gap-3">
        <Info size={16} className="text-amber-700 mt-0.5 shrink-0" />
        <p className="font-body text-xs text-amber-900 leading-relaxed">
          Cron radi na svakih 15 minuta. Promene veza za delay-eve počinju da važe od sledećeg ciklusa.
          Ako isključiš flag, slanje prestaje odmah, ali korpe i porudžbine ostaju u redu i nastavljaju
          se kada ponovo uključiš.
        </p>
      </div>

      {/* Abandoned cart card */}
      <div className="bg-white border border-border rounded-md p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-warm-cream flex items-center justify-center shrink-0">
              <ShoppingCart size={18} className="text-warm-brown" />
            </div>
            <div>
              <h2 className="font-heading text-xl mb-1">Napuštene korpe</h2>
              <p className="font-body text-xs text-muted-foreground">
                Dva podsetnika kupcima koji su uneli email a nisu završili porudžbinu.
              </p>
            </div>
          </div>
          <Switch
            checked={s.abandoned_cart_enabled}
            onCheckedChange={(v) => setS({ ...s, abandoned_cart_enabled: v })}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-5 border-t border-border">
          <div>
            <Label className="text-xs">Prvi podsetnik (minuta posle napuštanja)</Label>
            <Input
              type="number"
              min={1}
              max={1440}
              value={s.email1_delay_minutes}
              onChange={(e) => setS({ ...s, email1_delay_minutes: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground mt-1">Preporučeno: 30 minuta.</p>
          </div>
          <div>
            <Label className="text-xs">Drugi podsetnik (sati posle prvog)</Label>
            <Input
              type="number"
              min={1}
              max={720}
              value={s.email2_delay_hours}
              onChange={(e) => setS({ ...s, email2_delay_hours: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground mt-1">Preporučeno: 72 sata (3 dana).</p>
          </div>
        </div>
      </div>

      {/* Review email card */}
      <div className="bg-white border border-border rounded-md p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-warm-cream flex items-center justify-center shrink-0">
              <Star size={18} className="text-warm-brown" />
            </div>
            <div>
              <h2 className="font-heading text-xl mb-1">Molba za ocenu</h2>
              <p className="font-body text-xs text-muted-foreground">
                Email kupcima posle isporuke sa pozivom da ostave recenziju proizvoda.
              </p>
            </div>
          </div>
          <Switch
            checked={s.review_emails_enabled}
            onCheckedChange={(v) => setS({ ...s, review_emails_enabled: v })}
          />
        </div>

        <div className="pt-5 border-t border-border">
          <Label className="text-xs">Slanje (dana posle porudžbine)</Label>
          <Input
            type="number"
            min={1}
            max={90}
            value={s.review_request_delay_days}
            onChange={(e) => setS({ ...s, review_request_delay_days: Number(e.target.value) })}
            className="max-w-[200px]"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Preporučeno: 14 dana (vreme da kupac proba proizvod).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-warm-brown text-primary-foreground px-5 py-2.5 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-dark transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sačuvaj
        </button>
        <a
          href="/odjava/test-token"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground"
        >
          <Mail size={12} /> Pregledaj odjavu
        </a>
      </div>
    </div>
  );
};

export default AdminRecoverySettings;