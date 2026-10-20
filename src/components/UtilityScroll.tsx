import { MapPin, FileDown, FileText, Megaphone, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";
import ShareAppModal from "./ShareAppModal";

const UtilityScroll = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const [showShare, setShowShare] = useState(false);
  const isRtl = language === "ar";

  const utilities = [
    {
      title: t("util.dataSaver.title", language),
      titleAr: "موفّر البيانات",
      icon: FileDown,
      color: "text-gold",
      bg: "bg-gold/15",
      action: () => navigate("/data-saver"),
      span: "wide" as const,
    },
    {
      title: t("util.scanner.title", language),
      titleAr: "مسح المستندات",
      icon: ScanLine,
      color: "text-nile",
      bg: "bg-nile/15",
      action: () => navigate("/scanner"),
      span: "square" as const,
    },
    {
      title: t("util.yafatish.title", language),
      titleAr: "الزول يفتش",
      icon: MapPin,
      color: "text-nile",
      bg: "bg-nile-light",
      action: () => navigate("/yafatish"),
      span: "square" as const,
    },
    {
      title: language === "ar" ? "انشر التطبيق" : "Share App",
      titleAr: "انشر التطبيق",
      icon: Megaphone,
      color: "text-sand-dark",
      bg: "bg-sand-dark/20",
      action: () => setShowShare(true),
      span: "square" as const,
    },
    {
      title: language === "ar" ? "المكتب الرقمي" : "Digital Office",
      titleAr: "المكتب الرقمي",
      icon: FileText,
      color: "text-earth-light",
      bg: "bg-sand",
      action: () => navigate("/office"),
      span: "square" as const,
    },
  ];

  const baseCard =
    "rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-sm p-3 active:scale-[0.97] transition-all hover:shadow-md hover:border-border";

  return (
    <section className="px-5 mt-6">
      <h3 className="text-base font-semibold text-foreground mb-3 text-start">
        {t("section.utilities", language)}
      </h3>

      <div className="grid grid-cols-2 gap-3 auto-rows-[110px]">
        {utilities.map((item) => {
          const isWide = item.span === "wide";
          return (
            <button
              key={item.titleAr}
              onClick={item.action}
              className={`${baseCard} ${
                isWide
                  ? "col-span-2 flex items-center gap-3 text-start"
                  : "flex flex-col items-center justify-center text-center"
              }`}
            >
              <div
                className={`${isWide ? "w-11 h-11" : "w-10 h-10"} rounded-xl ${item.bg} flex items-center justify-center shrink-0 ${isWide ? "" : "mb-1.5"}`}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className={isWide ? "flex-1 min-w-0" : ""}>
                <p className={`text-sm font-semibold text-foreground ${isWide ? "" : "leading-tight"}`}>
                  {item.title}
                </p>
                <p
                  className={`text-[11px] font-cairo text-muted-foreground mt-0.5 ${isWide ? "" : "line-clamp-1"}`}
                  dir="rtl"
                >
                  {item.titleAr}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <ShareAppModal open={showShare} onClose={() => setShowShare(false)} />

    </section>
  );
};

export default UtilityScroll;
