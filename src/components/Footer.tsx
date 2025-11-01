import { Youtube, Twitter, Facebook, Instagram } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="relative bg-[#0A0A0A] border-t border-[#D4AF37]/20 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-[#D4AF37] mb-4">Realm of Shadows</h3>
            <p className="text-gray-400 text-sm">
              {t.footer.tagline.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < t.footer.tagline.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>

          <div>
            <h4 className="text-white mb-4">{t.footer.quickLinks}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#story" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                  {t.footer.links.story}
                </a>
              </li>
              <li>
                <a href="#characters" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                  {t.footer.links.characters}
                </a>
              </li>
              <li>
                <a href="#rewards" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                  {t.footer.links.rewards}
                </a>
              </li>
              <li>
                <a href="#empire" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                  {t.footer.links.community}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white mb-4">{t.footer.social}</h4>
            <div className="flex gap-4">
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#2A2A2A] rounded-lg hover:bg-[#D4AF37] transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="https://www.twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#2A2A2A] rounded-lg hover:bg-[#D4AF37] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#2A2A2A] rounded-lg hover:bg-[#D4AF37] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#2A2A2A] rounded-lg hover:bg-[#D4AF37] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#2A2A2A] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>{t.footer.copyright}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#D4AF37] transition-colors">
              {t.footer.terms}
            </a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors">
              {t.footer.privacy}
            </a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors">
              {t.footer.cookies}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}