import { motion } from "motion/react";
import { Users, Award, Crown, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/LanguageContext";

const mockReferrals = [
  { name: "ShadowHunter", level: 1, children: 3 },
  { name: "DarkKnight92", level: 1, children: 5 },
  { name: "FireMage", level: 1, children: 2 },
];

export function ReferralSystem() {
  const { t } = useLanguage();
  return (
    <section id="empire" className="relative bg-gradient-to-b from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="mb-4 text-[#D4AF37]">{t.empire.title}</h2>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mb-6" />
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t.empire.description.map((line, i) => (
              <span key={i}>
                {line}
                {i < t.empire.description.length - 1 && <br />}
              </span>
            ))}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Referral Stats - Simplified */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#2A2A2A]/50 to-[#1A1A1A]/50 border border-[#D4AF37]/20 p-8 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-8">
              <Crown className="h-5 w-5 text-[#D4AF37]" />
              <h3 className="text-white text-lg">{t.empire.status.title}</h3>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Direct Referrals */}
              <div className="bg-[#1A1A1A]/50 p-6 rounded-lg border border-[#D4AF37]/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-[#D4AF37]" />
                  <span className="text-gray-400 text-sm">{t.empire.status.referrals}</span>
                </div>
                <div className="text-3xl font-bold text-[#D4AF37]">10</div>
              </div>

              {/* Total Population */}
              <div className="bg-[#1A1A1A]/50 p-6 rounded-lg border border-[#D4AF37]/10">
                <div className="text-gray-400 text-sm mb-2">{t.empire.status.population}</div>
                <div className="text-3xl font-bold text-white">23</div>
              </div>
            </div>

            {/* Empire Level */}
            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#8B0000]/10 p-4 rounded-lg border border-[#D4AF37]/20">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{t.empire.status.level}</span>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-[#D4AF37]" />
                  <span className="text-xl font-bold text-[#D4AF37]">3단계</span>
                </div>
              </div>
            </div>

            {/* Top Referrals */}
            <div className="mt-6 pt-6 border-t border-[#2A2A2A]">
              <div className="text-xs text-gray-500 mb-3">{t.empire.status.recentReferrals}</div>
              <div className="space-y-2">
                {mockReferrals.map((referral, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-[#1A1A1A]/30 rounded"
                  >
                    <span className="text-gray-300 text-sm">{referral.name}</span>
                    <span className="text-[#D4AF37] text-xs">+{referral.children}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Rewards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#2A2A2A]/50 to-[#1A1A1A]/50 border border-[#D4AF37]/20 p-8 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-6 w-6 text-[#D4AF37]" />
              <h3 className="text-[#D4AF37]">{t.empire.rewardsTiers.title}</h3>
            </div>

            <div className="space-y-4">
              {t.empire.rewardsTiers.tiers.map((tier, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-4 rounded-lg border ${
                    index < 2
                      ? "bg-[#D4AF37]/10 border-[#D4AF37]/50"
                      : "bg-[#2A2A2A]/30 border-[#2A2A2A]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={
                        index < 2 ? "text-[#D4AF37]" : "text-gray-400"
                      }
                    >
                      {tier.name}
                    </span>
                    {index < 2 && (
                      <Crown className="h-4 w-4 text-[#D4AF37]" />
                    )}
                  </div>
                  <div className="text-white text-sm mb-1">{tier.requirement}</div>
                  <div className="text-gray-400 text-xs">보상: {tier.reward}</div>
                </motion.div>
              ))}
            </div>

            <Button
              className="w-full mt-6 bg-gradient-to-r from-[#D4AF37] to-[#8B0000] hover:from-[#FFD700] hover:to-[#A00000]"
              size="lg"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t.empire.invite}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}