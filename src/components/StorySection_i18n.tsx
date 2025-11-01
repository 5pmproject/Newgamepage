import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export function StorySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="relative min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] py-32 px-4 overflow-hidden"
    >
      {/* Parallax Background Layers */}
      <motion.div
        style={{ y: y1, opacity }}
        className="absolute inset-0 opacity-20"
      >
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1618495369035-045987b3c3f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxteXN0aWNhbCUyMGZvcmVzdCUyMGRhcmt8ZW58MXx8fHwxNzYxODA4Mjk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
          }}
        />
      </motion.div>

      <motion.div
        style={{ y: y2 }}
        className="absolute inset-0 opacity-10"
      >
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1595854866399-6a4807ad33ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwZmlyZSUyMGRyYWdvbnxlbnwxfHx8fDE3NjE4MDgyOTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="mb-6 text-[#D4AF37]">{t.story.title}</h2>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mb-8" />
          <div className="text-gray-300 max-w-3xl mx-auto leading-relaxed space-y-2">
            {t.story.description.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.story.features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-[#2A2A2A]/50 to-[#1A1A1A]/50 border border-[#D4AF37]/20 p-8 rounded-lg backdrop-blur-sm hover:border-[#D4AF37]/50 transition-all hover:shadow-lg hover:shadow-[#D4AF37]/10"
            >
              <div className="text-4xl mb-4">{["🏰", "⚔️", "📜"][index]}</div>
              <h3 className="mb-3 text-[#D4AF37]">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
