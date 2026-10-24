import SudaneseHeader from "@/components/SudaneseHeader";
import HeroSection from "@/components/HeroSection";
import ServiceGrid from "@/components/ServiceGrid";
import UtilityScroll from "@/components/UtilityScroll";
import BottomNav from "@/components/BottomNav";
import AppShareInline from "@/components/AppShareInline";

const Index = () => {
  return (
    <div className="home-shell bg-background max-w-md mx-auto relative">
      <SudaneseHeader />
      <main className="home-content">
        <HeroSection />
        <ServiceGrid />
        <UtilityScroll />
        <AppShareInline />
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
