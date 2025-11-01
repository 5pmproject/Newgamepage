import { useState } from "react";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NavigationBar } from "./components/NavigationBar";
import { HeroSection } from "./components/HeroSection";
import { StorySection } from "./components/StorySection";
import { CharactersSection } from "./components/CharactersSection";
import { RewardsSection } from "./components/RewardsSection";
import { ReferralSystem } from "./components/ReferralSystem";
import { ReservationForm } from "./components/ReservationForm";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <NavigationBar onReserveClick={() => setIsReservationOpen(true)} />
        <HeroSection onReserveClick={() => setIsReservationOpen(true)} />
        <StorySection />
        <CharactersSection />
        <RewardsSection />
        <ReferralSystem />
        <Footer />
        
        <ReservationForm 
          open={isReservationOpen} 
          onOpenChange={setIsReservationOpen}
        />
        
        <Toaster theme="dark" />
      </div>
    </LanguageProvider>
  );
}