import { supabase } from "@/integrations/supabase/client";

export type IngredientBenefit = { name: string; benefit: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  size: string | null;
  price: number;
  category: string | null;
  category_slug: string | null;
  images: string[];
  featured: boolean;
  visible: boolean;
  stock_status: string;
  description: string | null;
  short_description: string | null;
  target_audience: string | null;
  benefits: string[];
  free_from: string[];
  ingredients_benefits: IngredientBenefit[];
  active_ingredients_count: number | null;
  usage: string | null;
  inci: string | null;
  composition_note: string | null;
  position: number | null;
};

export const fetchProducts = async (categorySlug?: string) => {
  let query = supabase
    .from("products")
    .select("*")
    .eq("visible", true)
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (categorySlug && categorySlug !== "all") {
    query = query.eq("category_slug", categorySlug);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Product[];
};

export const fetchProductBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
};

export const productImage = (p: Pick<Product, "images">) => p.images?.[0] || "";

export const categories = [
  { name: "Sve", slug: "all" },
  { name: "Nega lica", slug: "nega-lica" },
  { name: "Nega tela", slug: "nega-tela" },
  { name: "Mom & Baby", slug: "mom-baby" },
];
