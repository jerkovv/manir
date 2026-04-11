import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import { products } from "@/data/siteData";

const NAMES = [
  "Milica S.", "Ana M.", "Jelena D.", "Marija K.", "Ivana P.",
  "Tamara R.", "Jovana T.", "Dragana V.", "Maja L.", "Nikolina B.",
  "Katarina N.", "Teodora J.", "Sofija Đ.", "Aleksandra Z.", "Nina G.",
];

const CITIES: { name: string; genitive: string }[] = [
  { name: "Beograd", genitive: "Beograda" },
  { name: "Novi Sad", genitive: "Novog Sada" },
  { name: "Niš", genitive: "Niša" },
  { name: "Kragujevac", genitive: "Kragujevca" },
  { name: "Subotica", genitive: "Subotice" },
  { name: "Zrenjanin", genitive: "Zrenjanina" },
  { name: "Pančevo", genitive: "Pančeva" },
  { name: "Čačak", genitive: "Čačka" },
  { name: "Novi Pazar", genitive: "Novog Pazara" },
  { name: "Kraljevo", genitive: "Kraljeva" },
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomMinutes = () => [3, 5, 8, 12, 15, 18, 22, 27, 33, 45][Math.floor(Math.random() * 10)];

const SocialProofNotification = () => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<{ name: string; city: typeof CITIES[0]; product: typeof products[0]; minutes: number } | null>(null);

  const showNotification = useCallback(() => {
    const product = getRandomItem(products);
    setData({
      name: getRandomItem(NAMES),
      city: getRandomItem(CITIES),
      product,
      minutes: getRandomMinutes(),
    });
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);
  }, []);

  useEffect(() => {
    const initialDelay = setTimeout(() => {
      showNotification();
    }, 8000 + Math.random() * 7000);

    const scheduleNext = () => {
      return setTimeout(() => {
        showNotification();
        timeoutRef = scheduleNext();
      }, 120000 + Math.random() * 120000); // 2-4 minuta random
    };

    let timeoutRef = scheduleNext();

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(timeoutRef);
    };
  }, [showNotification]);

  if (!data) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-6 z-40 max-w-sm"
        >
          <div className="bg-background border border-border/60 rounded-sm shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] flex items-center gap-4 p-4 pr-10">
            {/* Product image */}
            <div className="w-14 h-14 rounded-sm overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={data.product.image}
                alt={data.product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="min-w-0">
              <p className="font-heading text-sm text-foreground leading-tight">
                {data.name} iz {data.city.genitive}
              </p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                je kupila{" "}
                <span className="text-primary font-medium">{data.product.name}</span>
              </p>
              <p className="font-body text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                <ShoppingBag size={10} />
                Pre {data.minutes} minuta
              </p>
            </div>

            {/* Close */}
            <button
              onClick={() => setVisible(false)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SocialProofNotification;
