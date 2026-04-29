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
  // Agregati iz product_review_stats view-a (Faza 3b-1).
  // null/0 znači "još nema odobrenih recenzija" — UI to ne prikazuje.
  avg_rating?: number | null;
  review_count?: number;
};

/**
 * Dohvati product_review_stats jednim pozivom i merge-uj u listu proizvoda.
 * View nema FK na products, pa ne može Supabase nested select — radimo
 * 2 paralelna query-ja + Map lookup (O(n)).
 */
const mergeReviewStats = async <T extends { id: string }>(products: T[]): Promise<T[]> => {
  if (products.length === 0) return products;
  const { data: stats } = await supabase
    .from("product_review_stats")
    .select("product_id, review_count, avg_rating");
  const map = new Map<string, { review_count: number; avg_rating: number }>(
    (stats ?? []).map((s: any) => [s.product_id, { review_count: s.review_count, avg_rating: Number(s.avg_rating) }]),
  );
  return products.map((p) => {
    const s = map.get(p.id);
    return { ...p, avg_rating: s?.avg_rating ?? null, review_count: s?.review_count ?? 0 };
  });
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
  return mergeReviewStats((data || []) as Product[]);
};

export const fetchProductBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [withStats] = await mergeReviewStats([data as Product]);
  return withStats;
};

export type ReviewItem = {
  id: string;
  reviewer_name: string | null;
  rating: number;
  review_text: string | null;
  created_at: string;
  admin_response: string | null;
  admin_response_at: string | null;
};

export const fetchProductReviews = async (productId: string): Promise<ReviewItem[]> => {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, reviewer_name, rating, review_text, created_at, admin_response, admin_response_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReviewItem[];
};

export const productImage = (p: Pick<Product, "images">) => p.images?.[0] || "";

export const categories = [
  { name: "Sve", slug: "all" },
  { name: "Nega lica", slug: "nega-lica" },
  { name: "Nega tela", slug: "nega-tela" },
  { name: "Mom & Baby", slug: "mom-baby" },
];
