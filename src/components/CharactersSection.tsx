import { motion } from "motion/react";
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useLanguage } from "../contexts/LanguageContext";

const characterImages = [
  "https://images.unsplash.com/photo-1627732922021-e73df99d192e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwa25pZ2h0JTIwd2FycmlvcnxlbnwxfHx8fDE3NjE4MDgyOTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1757083840090-17a7bfca08c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMHN3b3JkJTIwd2VhcG9ufGVufDF8fHx8MTc2MTczNjM2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1595854866399-6a4807ad33ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwZmlyZSUyMGRyYWdvbnxlbnwxfHx8fDE3NjE4MDgyOTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
];

const characterStats = [
  { strength: 95, agility: 70, magic: 40 },
  { strength: 60, agility: 95, magic: 50 },
  { strength: 40, agility: 65, magic: 98 },
];

export function CharactersSection() {
  const [selectedCharacter, setSelectedCharacter] = useState(0);
  const { t } = useLanguage();

  return (
    <section id="characters" className="relative bg-[#0A0A0A] py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="mb-4 text-[#D4AF37]">{t.characters.title}</h2>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mb-6" />
          <p className="text-gray-400">
            {t.characters.subtitle}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {t.characters.list.map((character, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
              className={`relative cursor-pointer group ${
                selectedCharacter === index ? "scale-105" : ""
              }`}
              onClick={() => setSelectedCharacter(index)}
            >
              <div
                className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                  selectedCharacter === index
                    ? "border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/30"
                    : "border-[#2A2A2A] hover:border-[#D4AF37]/50"
                }`}
              >
                <div className="aspect-[3/4] relative">
                  <ImageWithFallback
                    src={characterImages[index]}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-xs text-[#D4AF37] mb-1">{character.title}</div>
                  <h3 className="mb-2 text-white">{character.name}</h3>
                  <p className="text-gray-300 text-sm mb-4">{character.description}</p>

                  {/* Stats */}
                  <div className="space-y-2">
                    {Object.entries(characterStats[index]).map(([stat, value]) => (
                      <div key={stat} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-16 capitalize">
                          {t.characters.stats[stat as keyof typeof t.characters.stats]}
                        </span>
                        <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${value}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            viewport={{ once: true }}
                            className="h-full bg-gradient-to-r from-[#8B0000] to-[#D4AF37]"
                          />
                        </div>
                        <span className="text-xs text-[#D4AF37] w-8">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}