import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;        // 0–5, decimalni dozvoljeno (npr 4.7)
  size?: number;
  className?: string;
}

/**
 * Read-only star rating, 5 ikona. Pola-zvezde se ne crta:
 * round-half-up (Math.round) odgovara prikazu "★ 4.7 (23)" stila.
 */
const StarRating = ({ value, size = 14, className = "" }: StarRatingProps) => {
  const filled = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-0.5 text-warm-brown ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          className={i <= filled ? "fill-warm-brown text-warm-brown" : "text-warm-brown/30"}
        />
      ))}
    </span>
  );
};

export default StarRating;