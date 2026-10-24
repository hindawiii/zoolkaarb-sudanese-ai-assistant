import SudaneseHeader from "@/components/SudaneseHeader";
import HeroSection from "@/components/HeroSection";
import ServiceGrid from "@/components/ServiceGrid";
import UtilityScroll from "@/components/UtilityScroll";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative pb-20">
      <SudaneseHeader />
      <HeroSection />
      <ServiceGrid />
      <UtilityScroll />
      <BottomNav />
    </div>
  );
};

export default Index;
