import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import StarRating from "@/components/StarRating";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  featured?: boolean;
  size?: string;
  avgRating?: number | null;
  reviewCount?: number;
}

const ProductCard = ({ id, name, price, category, image, featured, size, avgRating, reviewCount }: ProductCardProps) => {
  const hasReviews = !!reviewCount && reviewCount > 0 && avgRating != null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
    >
      <Link to={`/proizvod/${id}`} className="group block">
        <div className="relative overflow-hidden bg-warm-cream aspect-[4/5]">
          {featured && (
            <span className="absolute top-4 left-4 z-10 font-body text-[10px] tracking-[0.2em] uppercase bg-warm-brown text-primary-foreground px-3 py-1.5">
              Izdvojeno
            </span>
          )}
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-warm-dark/0 group-hover:bg-warm-dark/10 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
            <span className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-primary-foreground bg-warm-brown/90 backdrop-blur-sm px-4 py-2.5">
              Pogledaj <ArrowRight size={12} />
            </span>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{category}</p>
          {hasReviews && (
            <div className="flex items-center gap-1.5">
              <StarRating value={avgRating!} size={12} />
              <span className="font-body text-[11px] text-muted-foreground">
                {avgRating!.toFixed(1)} <span className="opacity-60">({reviewCount})</span>
              </span>
            </div>
          )}
          <h3 className="font-heading text-lg text-foreground leading-tight">{name}{size && ` (${size})`}</h3>
          <p className="font-body text-sm font-medium text-warm-brown">{price.toLocaleString("sr-RS")} RSD</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
