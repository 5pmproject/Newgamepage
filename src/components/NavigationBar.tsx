import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Menu, X, Sword, Globe, ChevronDown } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface NavigationBarProps {
  onReserveClick: () => void;
}

export function NavigationBar({ onReserveClick }: NavigationBarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: t.nav.story, href: "#story" },
    { label: t.nav.characters, href: "#characters" },
    { label: t.nav.rewards, href: "#rewards" },
    { label: t.nav.empire, href: "#empire" },
  ];

  const languages = [
    { code: "ko" as const, label: "한국어" },
    { code: "en" as const, label: "English" },
    { code: "ja" as const, label: "日本語" },
  ];

  const handleLanguageChange = (lang: "ko" | "en" | "ja") => {
    setLanguage(lang);
    setIsLangMenuOpen(false);
  };

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-selector')) {
        setIsLangMenuOpen(false);
      }
    };

    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangMenuOpen]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#D4AF37]/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <Sword className="h-8 w-8 text-[#D4AF37]" />
              <div className="absolute inset-0 blur-md bg-[#D4AF37]/30" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#D4AF37] tracking-wider">REALM OF</span>
              <span className="text-white -mt-1">SHADOWS</span>
            </div>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-gray-300 hover:text-[#D4AF37] transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D4AF37] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* Language Selector & CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative language-selector">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-[#D4AF37] hover:bg-transparent"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              >
                <Globe className="h-4 w-4 mr-2" />
                {languages.find((l) => l.code === language)?.label}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-[#1A1A1A] border border-[#D4AF37]/30 rounded shadow-lg z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-4 py-2 text-gray-300 hover:text-[#D4AF37] hover:bg-[#2A2A2A] cursor-pointer transition-colors first:rounded-t last:rounded-b ${
                        language === lang.code ? "text-[#D4AF37] bg-[#2A2A2A]" : ""
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={onReserveClick}
              className="bg-gradient-to-r from-[#8B0000] to-[#D4AF37] hover:from-[#8B0000]/90 hover:to-[#D4AF37]/90 text-white shadow-lg shadow-[#8B0000]/30"
            >
              {t.nav.preregister}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#D4AF37]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#1A1A1A]/95 backdrop-blur-md border-t border-[#D4AF37]/20"
          >
            <div className="px-4 py-6 space-y-4">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block text-gray-300 hover:text-[#D4AF37] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}

              {/* Mobile Language Selector */}
              <div className="flex gap-2 pt-2 border-t border-[#2A2A2A]">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                      language === lang.code
                        ? "bg-[#D4AF37] text-[#0A0A0A]"
                        : "bg-[#2A2A2A] text-gray-300 hover:text-[#D4AF37]"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => {
                  onReserveClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-[#8B0000] to-[#D4AF37] hover:from-[#8B0000]/90 hover:to-[#D4AF37]/90 text-white"
              >
                {t.nav.preregister}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}