-- Faza 3b-1: agregirana statistika recenzija po proizvodu.
-- Koristi status='approved' (autoritativan u Fazi 1+).
CREATE OR REPLACE VIEW public.product_review_stats AS
SELECT
  product_id,
  COUNT(*)::int AS review_count,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating
FROM public.reviews
WHERE status = 'approved'
GROUP BY product_id;

GRANT SELECT ON public.product_review_stats TO anon, authenticated;

-- Rollback:
--   DROP VIEW IF EXISTS public.product_review_stats;
