import { MapPin, FileDown, FileText, Megaphone, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUser } from "@/store/userStore";
import ShareAppModal from "./ShareAppModal";

const UtilityScroll = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const [showShare, setShowShare] = useState(false);
  const isRtl = language === "ar";

  const items = [
    { ar: "الماسح", en: "Scanner", icon: ScanLine, action: () => navigate("/scanner") },
    { ar: "موفّر البيانات", en: "Data Saver", icon: FileDown, action: () => navigate("/data-saver") },
    { ar: "المكتب", en: "Office", icon: FileText, action: () => navigate("/office") },
    { ar: "الزول يفتش", en: "Places", icon: MapPin, action: () => navigate("/yafatish") },
    { ar: "انشر التطبيق", en: "Share App", icon: Megaphone, action: () => setShowShare(true) },
  ];

  return (
    <section className="mt-4">
      <p className="px-4 mb-2 text-[11px] font-bold font-cairo text-muted-foreground">
        {isRtl ? "أدوات سريعة" : "Quick tools"}
      </p>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it) => (
          <button
            key={it.en}
            onClick={it.action}
            className="shrink-0 h-[38px] px-3 rounded-full surface-obsidian flex items-center gap-1.5 text-[12px] font-semibold font-cairo text-foreground active:scale-95 transition-transform"
          >
            <it.icon className="w-4 h-4 text-gold" />
            {isRtl ? it.ar : it.en}
          </button>
        ))}
      </div>
      <ShareAppModal open={showShare} onClose={() => setShowShare(false)} />
    </section>
  );
};

export default UtilityScroll;
