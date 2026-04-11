import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
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
  const [progress, setProgress] = useState(100);

  const showNotification = useCallback(() => {
    const product = getRandomItem(products);
    setData({
      name: getRandomItem(NAMES),
      city: getRandomItem(CITIES),
      product,
      minutes: getRandomMinutes(),
    });
    setProgress(100);
    setVisible(true);
    setTimeout(() => setVisible(false), 6000);
  }, []);

  // Progress bar countdown
  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const duration = 6000;
    const frame = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) requestAnimationFrame(frame);
    };
    const raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  useEffect(() => {
    const initialDelay = setTimeout(() => {
      showNotification();
    }, 8000 + Math.random() * 7000);

    const scheduleNext = () => {
      return setTimeout(() => {
        showNotification();
        timeoutRef = scheduleNext();
      }, 120000 + Math.random() * 120000);
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
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="fixed bottom-5 left-5 z-40 w-[340px] md:w-[380px]"
        >
          <div className="relative bg-background/95 backdrop-blur-xl border border-border/40 rounded-lg overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.03)]">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="flex items-start gap-3.5 p-4">
              {/* Product image with verified badge */}
              <div className="relative flex-shrink-0">
                <div className="w-[52px] h-[52px] rounded-md overflow-hidden ring-1 ring-border/30">
                  <img
                    src={data.product.image}
                    alt={data.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center ring-2 ring-background">
                  <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-5">
                <p className="font-heading text-[13px] text-foreground leading-snug">
                  <span className="font-semibold">{data.name}</span>
                  <span className="text-muted-foreground font-normal"> iz {data.city.genitive}</span>
                </p>
                <p className="font-body text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  je kupila{" "}
                  <span className="text-foreground font-medium">{data.product.name}</span>
                </p>
                <p className="font-body text-[10px] tracking-wide text-muted-foreground/50 mt-1.5 uppercase">
                  Pre {data.minutes} min
                </p>
              </div>

              {/* Close */}
              <button
                onClick={() => setVisible(false)}
                className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center text-muted-foreground/30 hover:text-foreground transition-colors duration-200"
              >
                <X size={12} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-[2px] bg-muted/50">
              <motion.div
                className="h-full bg-primary/30"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SocialProofNotification;
