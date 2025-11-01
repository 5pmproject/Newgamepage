import { motion } from "motion/react";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface HeroSectionProps {
  onReserveClick: () => void;
}

export function HeroSection({ onReserveClick }: HeroSectionProps) {
  const [count, setCount] = useState(487234);
  const { t } = useLanguage();

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0A0A0A]">
      {/* Background with enhanced overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1692897403215-9718cae64dd9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZmFudGFzeSUyMGNhc3RsZXxlbnwxfHx8fDE3NjE4MDM4NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/60 to-[#0A0A0A]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#8B0000]/10 via-transparent to-[#D4AF37]/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="text-center"
        >
          <motion.h1
            className="mb-6 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent tracking-wider"
            style={{ fontSize: "4.5rem", lineHeight: "1.2" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            {t.hero.title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="h-1 w-64 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mb-8"
          />

          <motion.p
            className="mb-12 text-gray-300 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.8 }}
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="flex flex-col items-center gap-6"
          >
            <Button
              size="lg"
              onClick={onReserveClick}
              className="bg-gradient-to-r from-[#8B0000] to-[#D4AF37] hover:from-[#A00000] hover:to-[#FFD700] text-white px-12 py-6 shadow-2xl shadow-[#8B0000]/50 border border-[#D4AF37]/30"
            >
              {t.hero.cta}
            </Button>

            <div className="flex items-center gap-3 text-[#D4AF37]">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50"
              />
              <span className="text-sm">
                {t.hero.counter} <span className="text-[#FFD700]">{count.toLocaleString()}</span>{t.hero.people}
              </span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-8 w-8 text-[#D4AF37]" />
        </motion.div>
      </div>
    </section>
  );
}