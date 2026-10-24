import { MapPin, FileDown, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/store/userStore";
import { Button } from "@/components/ui/button";

const UtilityScroll = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";

  const items = [
    { ar: "موفّر البيانات", en: "Data Saver", icon: FileDown, action: () => navigate("/data-saver") },
    { ar: "المكتب والماسح", en: "Office & Scan", icon: FileText, action: () => navigate("/office") },
    { ar: "الزول يفتش", en: "Places", icon: MapPin, action: () => navigate("/yafatish") },
  ];

  return (
    <section className="shrink-0">
      <p className="mb-2 text-[11px] font-bold font-cairo text-muted-foreground">
        {isRtl ? "أدوات سريعة" : "Quick tools"}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <Button variant="ghost"
            key={it.en}
            onClick={it.action}
            className="min-w-0 h-auto min-h-11 px-1 rounded-lg surface-obsidian flex flex-col items-center gap-1 py-2 text-[10px] font-semibold font-cairo text-foreground whitespace-normal leading-tight active:scale-95 transition-transform"
          >
            <it.icon className="w-4 h-4 text-gold" />
            {isRtl ? it.ar : it.en}
          </Button>
        ))}
      </div>
    </section>
  );
};

export default UtilityScroll;
