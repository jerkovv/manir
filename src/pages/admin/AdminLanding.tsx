import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  DEFAULT_LANDING,
  fetchLandingContent,
  type LandingContent,
} from "@/lib/landingContent";

type SectionKey = keyof LandingContent;

const SECTIONS: { key: SectionKey; title: string; description: string }[] = [
  { key: "hero", title: "Hero", description: "Glavna sekcija na vrhu" },
  { key: "offer", title: "Trenutna ponuda", description: "Banner odmah ispod hero-a" },
  { key: "brand_intro", title: "O brendu", description: "Sekcija sa tekstom i slikom" },
  { key: "selfcare", title: "Self-care banner", description: "Tamna sekcija sa pozadinskom slikom" },
  { key: "final_cta", title: "Završni CTA", description: "Tamna sekcija na dnu" },
];

const Field = ({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) => (
  <label className="block">
    <span className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5 font-body">
      {label}
    </span>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-border font-body text-sm bg-white"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-border font-body text-sm bg-white"
      />
    )}
  </label>
);

const AdminLanding = () => {
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SectionKey | null>(null);
  const [active, setActive] = useState<SectionKey>("hero");

  useEffect(() => {
    fetchLandingContent().then((c) => {
      setContent(c);
      setLoading(false);
    });
  }, []);

  const update = <K extends SectionKey>(key: K, patch: Partial<LandingContent[K]>) => {
    setContent((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const save = async (key: SectionKey) => {
    setSaving(key);
    const { error } = await supabase
      .from("landing_content")
      .upsert({ key, data: content[key] as any }, { onConflict: "key" });
    setSaving(null);
    if (error) return toast.error("Greška: " + error.message);
    toast.success("Sačuvano");
  };

  if (loading) {
    return (
      <div className="font-body text-sm text-muted-foreground">Učitavanje...</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-4xl text-foreground mb-1">Landing editor</h1>
        <p className="font-body text-sm text-muted-foreground">
          Upravljajte sadržajem početne stranice. Promene se primenjuju odmah po čuvanju.
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={`px-3 py-1.5 font-body text-xs tracking-wider uppercase border ${
              active === s.key
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="bg-white border border-border p-6 max-w-3xl">
        {SECTIONS.filter((s) => s.key === active).map((s) => (
          <div key={s.key}>
            <div className="mb-5 pb-5 border-b border-border">
              <h2 className="font-heading text-2xl">{s.title}</h2>
              <p className="font-body text-sm text-muted-foreground mt-1">{s.description}</p>
            </div>

            {s.key === "hero" && (
              <div className="space-y-4">
                <Field label="Eyebrow (sitan tekst iznad)" value={content.hero.eyebrow}
                  onChange={(v) => update("hero", { eyebrow: v })} />
                <Field label="Naslov — prvi red" value={content.hero.titleLine1}
                  onChange={(v) => update("hero", { titleLine1: v })} />
                <Field label="Naslov — drugi red (italic)" value={content.hero.titleLine2}
                  onChange={(v) => update("hero", { titleLine2: v })} />
                <Field label="Podnaslov" value={content.hero.subtitle} textarea
                  onChange={(v) => update("hero", { subtitle: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Primarni CTA — tekst" value={content.hero.ctaPrimaryLabel}
                    onChange={(v) => update("hero", { ctaPrimaryLabel: v })} />
                  <Field label="Primarni CTA — link" value={content.hero.ctaPrimaryLink}
                    onChange={(v) => update("hero", { ctaPrimaryLink: v })} />
                  <Field label="Sekundarni CTA — tekst" value={content.hero.ctaSecondaryLabel}
                    onChange={(v) => update("hero", { ctaSecondaryLabel: v })} />
                  <Field label="Sekundarni CTA — link" value={content.hero.ctaSecondaryLink}
                    onChange={(v) => update("hero", { ctaSecondaryLink: v })} />
                </div>
                <ImageUpload
                  label="Pozadinska slika hero-a (prazno = default)"
                  folder="landing"
                  value={content.hero.image}
                  onChange={(url) => update("hero", { image: url })}
                />
              </div>
            )}

            {s.key === "offer" && (
              <div className="space-y-4">
                <label className="flex items-center gap-2 font-body text-sm">
                  <input
                    type="checkbox"
                    checked={content.offer.enabled}
                    onChange={(e) => update("offer", { enabled: e.target.checked })}
                  />
                  Prikaži sekciju
                </label>
                <Field label="Eyebrow" value={content.offer.eyebrow}
                  onChange={(v) => update("offer", { eyebrow: v })} />
                <Field label="Link kad se klikne na sliku" value={content.offer.link}
                  onChange={(v) => update("offer", { link: v })} />
                <ImageUpload
                  label="Slika ponude (portretna, prazno = default)"
                  folder="landing"
                  value={content.offer.image}
                  onChange={(url) => update("offer", { image: url })}
                />
              </div>
            )}

            {s.key === "brand_intro" && (
              <div className="space-y-4">
                <Field label="Eyebrow" value={content.brand_intro.eyebrow}
                  onChange={(v) => update("brand_intro", { eyebrow: v })} />
                <Field label="Naslov" value={content.brand_intro.title} textarea
                  onChange={(v) => update("brand_intro", { title: v })} />
                <Field label="Pasus 1" value={content.brand_intro.paragraph1} textarea
                  onChange={(v) => update("brand_intro", { paragraph1: v })} />
                <Field label="Pasus 2" value={content.brand_intro.paragraph2} textarea
                  onChange={(v) => update("brand_intro", { paragraph2: v })} />
                <Field label="Pasus 3" value={content.brand_intro.paragraph3} textarea
                  onChange={(v) => update("brand_intro", { paragraph3: v })} />
                <Field label="Citat (italic)" value={content.brand_intro.quote} textarea
                  onChange={(v) => update("brand_intro", { quote: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Badge — broj" value={content.brand_intro.badgeNumber}
                    onChange={(v) => update("brand_intro", { badgeNumber: v })} />
                  <Field label="Badge — tekst" value={content.brand_intro.badgeLabel}
                    onChange={(v) => update("brand_intro", { badgeLabel: v })} />
                </div>
                <ImageUpload
                  label="Slika sekcije (4:5, prazno = default)"
                  folder="landing"
                  value={content.brand_intro.image}
                  onChange={(url) => update("brand_intro", { image: url })}
                />
              </div>
            )}

            {s.key === "selfcare" && (
              <div className="space-y-4">
                <Field label="Eyebrow" value={content.selfcare.eyebrow}
                  onChange={(v) => update("selfcare", { eyebrow: v })} />
                <Field label="Naslov" value={content.selfcare.title} textarea
                  onChange={(v) => update("selfcare", { title: v })} />
                <Field label="Podnaslov" value={content.selfcare.subtitle} textarea
                  onChange={(v) => update("selfcare", { subtitle: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="CTA — tekst" value={content.selfcare.ctaLabel}
                    onChange={(v) => update("selfcare", { ctaLabel: v })} />
                  <Field label="CTA — link" value={content.selfcare.ctaLink}
                    onChange={(v) => update("selfcare", { ctaLink: v })} />
                </div>
                <ImageUpload
                  label="Pozadinska slika (prazno = default)"
                  folder="landing"
                  value={content.selfcare.image}
                  onChange={(url) => update("selfcare", { image: url })}
                />
              </div>
            )}

            {s.key === "final_cta" && (
              <div className="space-y-4">
                <Field label="Eyebrow" value={content.final_cta.eyebrow}
                  onChange={(v) => update("final_cta", { eyebrow: v })} />
                <Field label="Naslov" value={content.final_cta.title} textarea
                  onChange={(v) => update("final_cta", { title: v })} />
                <Field label="Podnaslov" value={content.final_cta.subtitle} textarea
                  onChange={(v) => update("final_cta", { subtitle: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Primarni CTA — tekst" value={content.final_cta.ctaPrimaryLabel}
                    onChange={(v) => update("final_cta", { ctaPrimaryLabel: v })} />
                  <Field label="Primarni CTA — link" value={content.final_cta.ctaPrimaryLink}
                    onChange={(v) => update("final_cta", { ctaPrimaryLink: v })} />
                  <Field label="Sekundarni CTA — tekst" value={content.final_cta.ctaSecondaryLabel}
                    onChange={(v) => update("final_cta", { ctaSecondaryLabel: v })} />
                  <Field label="Sekundarni CTA — link" value={content.final_cta.ctaSecondaryLink}
                    onChange={(v) => update("final_cta", { ctaSecondaryLink: v })} />
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-border flex justify-end">
              <button
                onClick={() => save(s.key)}
                disabled={saving === s.key}
                className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 font-body text-xs tracking-[0.15em] uppercase disabled:opacity-50"
              >
                {saving === s.key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Sačuvaj sekciju
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLanding;
