import { useState } from "react";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ABTestProvider } from "./contexts/ABTestContext";
import { NavigationBar } from "./components/NavigationBar";
import { HeroSection } from "./components/HeroSection";
import { StorySection } from "./components/StorySection";
import { CharactersSection } from "./components/CharactersSection";
import { RewardsSection } from "./components/RewardsSection";
import { ReferralSystem } from "./components/ReferralSystem";
import { ReservationForm } from "./components/ReservationForm";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/sonner";
import { ExperimentMonitor } from "./components/ExperimentMonitor";

export default function App() {
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  return (
    <LanguageProvider>
      <ABTestProvider>
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
          
          {/* A/B 테스트 모니터 (개발 환경에서만) */}
          {import.meta.env.DEV && <ExperimentMonitor />}
        </div>
      </ABTestProvider>
    </LanguageProvider>
  );
}