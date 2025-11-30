import { useState, useEffect } from "react";
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

  useEffect(() => {
    // 강제 디버그 출력
    console.log('🎨 [App] App component mounted');
    console.log('🔧 [App] Environment check:', {
      DEV: import.meta.env.DEV,
      MODE: import.meta.env.MODE,
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    });
    
    // localStorage 확인
    const debugInfo = {
      variant: localStorage.getItem('exp_card_hover_effect'),
      sessionId: localStorage.getItem('experiment_session_id'),
      excluded: localStorage.getItem('exclude_from_experiments'),
      timestamp: new Date().toISOString()
    };
    
    console.warn('🧪 [A/B Test] Debug Info:', debugInfo);
    
    // 환경 변수가 없으면 경고
    if (!import.meta.env.VITE_SUPABASE_URL) {
      console.error('❌ [CRITICAL] VITE_SUPABASE_URL is not set! Check .env.local file.');
    }
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('❌ [CRITICAL] VITE_SUPABASE_ANON_KEY is not set! Check .env.local file.');
    }
  }, []);

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