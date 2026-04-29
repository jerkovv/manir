import { useEffect, useState } from "react";
import { fetchProductReviews, type ReviewItem } from "@/lib/products";
import StarRating from "@/components/StarRating";
import { formatDate } from "@/lib/format";

interface ProductReviewsProps {
  productId: string;
  avgRating: number | null;
  reviewCount: number;
}

const ProductReviews = ({ productId, avgRating, reviewCount }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<ReviewItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProductReviews(productId)
      .then((r) => { if (!cancelled) setReviews(r); })
      .catch(() => { if (!cancelled) setReviews([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const hasAny = reviewCount > 0 && avgRating != null;

  return (
    <section className="py-20 lg:py-28 border-t border-border/30">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <span className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-3">
            Iskustva kupaca
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground mb-5">
            Recenzije
          </h2>
          {hasAny && (
            <div className="flex items-center gap-3">
              <StarRating value={avgRating!} size={18} />
              <span className="font-body text-base text-foreground">
                {avgRating!.toFixed(1)}
              </span>
              <span className="font-body text-sm text-muted-foreground">
                · {reviewCount} {reviewCount === 1 ? "recenzija" : reviewCount < 5 ? "recenzije" : "recenzija"}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Učitavanje recenzija…</p>
        ) : !reviews || reviews.length === 0 ? (
          <div className="bg-warm-cream/50 border border-border/30 p-10 text-center">
            <p className="font-heading text-xl text-foreground mb-2">Budite prvi koji će ostaviti utisak</p>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Vaše iskustvo pomaže drugima da odaberu pravu negu.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((r) => (
              <article key={r.id} className="border border-border/40 bg-background p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <StarRating value={r.rating} size={14} />
                    <span className="font-body text-sm text-foreground">
                      {r.reviewer_name || "Kupac"}
                    </span>
                  </div>
                  <span className="font-body text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
                    {formatDate(r.created_at)}
                  </span>
                </div>
                {r.review_text && (
                  <p className="font-body text-[15px] text-muted-foreground leading-[1.8] whitespace-pre-line">
                    {r.review_text}
                  </p>
                )}
                {r.admin_response && (
                  <div className="mt-5 pl-5 border-l-2 border-warm-brown/40 bg-warm-cream/40 p-4">
                    <p className="font-body text-[10px] tracking-[0.2em] uppercase text-warm-brown mb-2">
                      Odgovor 0202skin
                    </p>
                    <p className="font-body text-[14px] text-muted-foreground leading-relaxed whitespace-pre-line">
                      {r.admin_response}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductReviews;