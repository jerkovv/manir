import { supabase } from "@/integrations/supabase/client";

export type QuantityDiscount = { enabled: boolean; min_quantity: number; percent: number };

export type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  active: boolean;
};

export type AppliedDiscount = {
  amount: number; // RSD off
  label: string;  // "Popust 20% (3+ komada)" ili "Kupon WELCOME10"
  source: "quantity" | "coupon";
  couponCode?: string;
};

export const fetchQuantityDiscount = async (): Promise<QuantityDiscount> => {
  const { data } = await supabase.from("store_settings").select("value").eq("key", "quantity_discount").maybeSingle();
  const v = (data?.value as any) || {};
  return {
    enabled: v.enabled ?? false,
    min_quantity: v.min_quantity ?? 3,
    percent: v.percent ?? 20,
  };
};

export const computeQuantityDiscount = (subtotal: number, totalQty: number, cfg: QuantityDiscount): AppliedDiscount | null => {
  if (!cfg.enabled || totalQty < cfg.min_quantity || cfg.percent <= 0) return null;
  const amount = Math.round(subtotal * (cfg.percent / 100));
  return {
    amount,
    label: `Popust ${cfg.percent}% (${cfg.min_quantity}+ komada)`,
    source: "quantity",
  };
};

export const validateCoupon = async (code: string): Promise<Coupon | null> => {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .ilike("code", trimmed)
    .eq("active", true)
    .maybeSingle();
  return (data as Coupon) || null;
};

export const computeCouponDiscount = (subtotal: number, coupon: Coupon): AppliedDiscount => {
  let amount = coupon.discount_type === "percent"
    ? Math.round(subtotal * (Number(coupon.discount_value) / 100))
    : Math.round(Number(coupon.discount_value));
  amount = Math.min(amount, subtotal);
  return {
    amount,
    label: `Kupon ${coupon.code}`,
    source: "coupon",
    couponCode: coupon.code,
  };
};
