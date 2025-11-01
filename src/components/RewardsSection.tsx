import { motion } from "motion/react";
import { Gift, Star, Zap, Shield } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const rewardIcons = [Star, Zap, Shield, Gift];

export function RewardsSection() {
  const { t } = useLanguage();
  return (
    <section id="rewards" className="relative bg-[#0A0A0A] py-32 px-4 overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="mb-4 text-[#D4AF37]">{t.rewards.title}</h2>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mb-6" />
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t.rewards.description.map((line, i) => (
              <span key={i}>
                {line}
                {i < t.rewards.description.length - 1 && <br />}
              </span>
            ))}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {t.rewards.list.map((reward, index) => {
            const IconComponent = rewardIcons[index];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="group relative bg-gradient-to-br from-[#2A2A2A]/50 to-[#1A1A1A]/50 border border-[#D4AF37]/20 p-8 rounded-lg hover:border-[#D4AF37]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#D4AF37]/20"
              >
                <div className="absolute top-4 right-4">
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      reward.tier === "전설" || reward.tier === "Legendary" || reward.tier === "伝説"
                        ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50"
                        : "bg-[#8B0000]/20 text-[#FF6B35] border border-[#8B0000]/50"
                    }`}
                  >
                    {reward.tier}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-[#D4AF37]/20 to-[#8B0000]/20 rounded-lg">
                    <IconComponent className="h-8 w-8 text-[#D4AF37]" />
                  </div>
                </div>

                <h3 className="mb-3 text-white group-hover:text-[#D4AF37] transition-colors">
                  {reward.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {reward.description}
                </p>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-[#8B0000]/20 via-[#D4AF37]/20 to-[#8B0000]/20 border border-[#D4AF37]/30 p-8 rounded-lg text-center"
        >
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="mb-3 text-[#D4AF37]">{t.rewards.earlyBird.title}</h3>
          <p className="text-gray-300 mb-4">
            {t.rewards.earlyBird.description} <span className="text-[#D4AF37]">{t.rewards.earlyBird.reward}</span> 추가 지급!
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-[#D4AF37]">{t.rewards.earlyBird.current}</span>
              <span className="text-white">487,234명</span>
            </div>
            <div className="h-12 w-px bg-[#2A2A2A]" />
            <div className="flex flex-col">
              <span className="text-[#D4AF37]">{t.rewards.earlyBird.target}</span>
              <span className="text-white">12,766{t.rewards.earlyBird.remaining}</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-[#2A2A2A] rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "97.4%" }}
              transition={{ duration: 1.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#8B0000]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}