import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { CheckCircle2, Mail, User, Smartphone, ChevronRight, Gift } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useLanguage } from "../contexts/LanguageContext";

interface ReservationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReservationForm({ open, onOpenChange }: ReservationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    phone: "",
    playstyle: "",
  });
  const [showStory, setShowStory] = useState(false);
  const [referralCode] = useState(`SHADOW${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const { t } = useLanguage();

  const handleNext = () => {
    if (currentStep === 1 && (!formData.nickname || !formData.email)) {
      toast.error(t.reservation.messages.fillRequired);
      return;
    }

    // Show story unlock animation
    setShowStory(true);
    setTimeout(() => {
      setShowStory(false);
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete reservation
        toast.success(t.reservation.messages.complete);
        onOpenChange(false);
        setCurrentStep(1);
      }
    }, 3000);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success(t.reservation.messages.copySuccess);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = referralCode;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success(t.reservation.messages.copySuccess);
      } catch (err) {
        toast.error(t.reservation.messages.copyError);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1A1A1A] border-[#D4AF37]/30 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#D4AF37]">
            {t.reservation.title} - {t.reservation.steps[currentStep - 1].title}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-6">
          {t.reservation.steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div
                className={`flex-1 h-2 rounded-full ${
                  currentStep > index
                    ? "bg-[#D4AF37]"
                    : currentStep === index + 1
                    ? "bg-[#D4AF37]/60"
                    : "bg-[#2A2A2A]"
                }`}
              />
              {index < t.reservation.steps.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-1 text-[#2A2A2A]" />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {showStory ? (
            <motion.div
              key="story"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <Gift className="h-20 w-20 mx-auto text-[#D4AF37]" />
              </motion.div>
              <h3 className="mb-4 text-[#D4AF37]">
                {t.reservation.stories[currentStep - 1].title}
              </h3>
              <p className="text-gray-300 max-w-lg mx-auto leading-relaxed">
                {t.reservation.stories[currentStep - 1].content}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-[#D4AF37] text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>{t.reservation.steps[currentStep - 1].reward}</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-[#2A2A2A]/50 border border-[#D4AF37]/20 p-4 rounded-lg">
                <p className="text-sm text-gray-300">{t.reservation.steps[currentStep - 1].description}</p>
                <div className="flex items-center gap-2 mt-2 text-[#D4AF37] text-xs">
                  <Gift className="h-4 w-4" />
                  <span>보상: {t.reservation.steps[currentStep - 1].reward}</span>
                </div>
              </div>

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nickname" className="text-gray-300">
                      {t.reservation.form.nickname}
                    </Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="nickname"
                        placeholder={t.reservation.form.nicknamePlaceholder}
                        value={formData.nickname}
                        onChange={(e) =>
                          setFormData({ ...formData, nickname: e.target.value })
                        }
                        className="pl-10 bg-[#2A2A2A] border-[#D4AF37]/30 text-white focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-300">
                      {t.reservation.form.email}
                    </Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t.reservation.form.emailPlaceholder}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="pl-10 bg-[#2A2A2A] border-[#D4AF37]/30 text-white focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-300">
                      {t.reservation.form.phone}
                    </Label>
                    <div className="relative mt-2">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="phone"
                        placeholder={t.reservation.form.phonePlaceholder}
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="pl-10 bg-[#2A2A2A] border-[#D4AF37]/30 text-white focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <Label className="text-gray-300">{t.reservation.form.playstyle}</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: "warrior", label: t.reservation.form.warrior, icon: "⚔️" },
                      { value: "assassin", label: t.reservation.form.assassin, icon: "🗡️" },
                      { value: "mage", label: t.reservation.form.mage, icon: "🔮" },
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setFormData({ ...formData, playstyle: style.value })}
                        className={`p-6 rounded-lg border-2 transition-all ${
                          formData.playstyle === style.value
                            ? "border-[#D4AF37] bg-[#D4AF37]/10"
                            : "border-[#2A2A2A] hover:border-[#D4AF37]/50"
                        }`}
                      >
                        <div className="text-3xl mb-2">{style.icon}</div>
                        <div className="text-sm text-white">{style.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-[#8B0000]/20 to-[#D4AF37]/20 border border-[#D4AF37]/30 p-6 rounded-lg text-center">
                    <h4 className="mb-3 text-[#D4AF37]">{t.reservation.form.referralTitle}</h4>
                    <div className="bg-[#2A2A2A] p-4 rounded-lg mb-4">
                      <code className="text-[#D4AF37] text-xl">
                        {referralCode}
                      </code>
                    </div>
                    <div className="text-gray-400 text-sm mb-4 space-y-1">
                      {t.reservation.form.referralDescription.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A]"
                      onClick={handleCopyCode}
                    >
                      {t.reservation.form.copyCode}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-[#8B0000] to-[#D4AF37] hover:from-[#A00000] hover:to-[#FFD700]"
                size="lg"
              >
                {currentStep === 3 ? t.reservation.form.complete : t.reservation.form.next}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}