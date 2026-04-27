import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HeroSection = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryLink: string;
  ctaSecondaryLabel: string;
  ctaSecondaryLink: string;
  image: string;
};

export type OfferSection = {
  eyebrow: string;
  image: string;
  link: string;
  enabled: boolean;
};

export type BrandIntroSection = {
  eyebrow: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  quote: string;
  badgeNumber: string;
  badgeLabel: string;
  image: string;
};

export type SelfcareSection = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  image: string;
};

export type FinalCtaSection = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryLink: string;
  ctaSecondaryLabel: string;
  ctaSecondaryLink: string;
};

export type LandingContent = {
  hero: HeroSection;
  offer: OfferSection;
  brand_intro: BrandIntroSection;
  selfcare: SelfcareSection;
  final_cta: FinalCtaSection;
};

export const DEFAULT_LANDING: LandingContent = {
  hero: {
    eyebrow: "Premium Skincare",
    titleLine1: "Ritual nege.",
    titleLine2: "Nauka i priroda.",
    subtitle:
      "Kozmetika nastala iz ljubavi prema koži i želje da ponudi stvarna rešenja za savremene probleme i stanja kože.",
    ctaPrimaryLabel: "Poručite ovde",
    ctaPrimaryLink: "/prodavnica",
    ctaSecondaryLabel: "Naša priča",
    ctaSecondaryLink: "/o-nama",
    image: "",
  },
  offer: {
    eyebrow: "Trenutna ponuda",
    image: "",
    link: "/prodavnica",
    enabled: true,
  },
  brand_intro: {
    eyebrow: "O brendu",
    title: "Spoj nauke i prirode u službi vaše kože",
    paragraph1:
      "0202 SKIN je kozmetika nastala iz ljubavi prema koži i želje da ponudi stvarna rešenja za savremene probleme i stanja kože.",
    paragraph2:
      "Kombinujući znanje farmacije i iskustvo profesionalnih kozmetičara, razvijamo formule koje ciljano deluju na uzrok, a ne samo na posledice.",
    paragraph3:
      "Ali 0202 SKIN je više od kozmetike. To je ritual nege, trenutak koji posvećujete sebi. Self care koji nije luksuz, već potreba.",
    quote:
      "Negovana koža nije slučajnost. Ona je rezultat pažnje, znanja i ljubavi prema sebi.",
    badgeNumber: "15+",
    badgeLabel: "Godina iskustva u kozmetičkoj praksi",
    image: "",
  },
  selfcare: {
    eyebrow: "Ritual",
    title: "Kada usporite, počinje prava promena",
    subtitle:
      "Kada birate šta stavljate na svoju kožu i kako se odnosite prema sebi to je trenutak u kome se rađa lepota. 0202 SKIN je vaš svakodnevni ritual nege.",
    ctaLabel: "Otkrijte kolekciju",
    ctaLink: "/prodavnica",
    image: "",
  },
  final_cta: {
    eyebrow: "0202 SKIN",
    title: "Vaša koža zaslužuje najbolje",
    subtitle:
      "Otkrijte premium skincare kolekciju zasnovanu na nauci, stručnosti i ljubavi prema koži.",
    ctaPrimaryLabel: "Prodavnica",
    ctaPrimaryLink: "/prodavnica",
    ctaSecondaryLabel: "Kontaktirajte nas",
    ctaSecondaryLink: "/kontakt",
  },
};

export async function fetchLandingContent(): Promise<LandingContent> {
  const { data } = await supabase.from("landing_content").select("key, data");
  const merged: LandingContent = JSON.parse(JSON.stringify(DEFAULT_LANDING));
  if (data) {
    for (const row of data as { key: string; data: any }[]) {
      if (row.key in merged) {
        (merged as any)[row.key] = { ...(merged as any)[row.key], ...row.data };
      }
    }
  }
  return merged;
}

export function useLandingContent() {
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchLandingContent().then((c) => {
      setContent(c);
      setLoading(false);
    });
  }, []);
  return { content, loading };
}
