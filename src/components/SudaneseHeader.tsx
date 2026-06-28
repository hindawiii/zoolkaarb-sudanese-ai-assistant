import { useMemo } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";
import madarLogo from "@/assets/madar-logo.png.asset.json";

const SudaneseHeader = () => {
  const { name, language } = useUser();
  const navigate = useNavigate();

  const greetingKey = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "greeting.morning";
    if (hour >= 12 && hour < 17) return "greeting.afternoon";
    if (hour >= 17 && hour < 21) return "greeting.evening";
    return "greeting.night";
  }, []);

  const isRtl = language === "ar";
  const greeting = isRtl
    ? `${t(greetingKey, "ar")}، ${name}`
    : `${t(greetingKey, "en")}, ${name}`;

  return (
    <header className="px-5 pt-5 pb-3 relative">
      {/* Settings button anchored to start corner */}
      <button
        onClick={() => navigate("/settings")}
        aria-label={isRtl ? "الإعدادات" : "Settings"}
        className={`absolute top-5 ${isRtl ? "left-5" : "right-5"} w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform z-10`}
      >
        <SettingsIcon className="w-5 h-5 text-foreground" />
      </button>

      {/* Centered Madar logo + brand */}
      <div className="flex flex-col items-center justify-center text-center gap-2">
        <img
          src={madarLogo.url}
          alt="Madar"
          className="h-14 w-auto object-contain drop-shadow-[0_2px_10px_rgba(212,175,55,0.35)]"
        />
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-cairo leading-none">
          {isRtl ? "مدار" : "Madar"}
        </h1>
        <p className="text-sm text-muted-foreground font-cairo">
          {greeting}
        </p>
      </div>
    </header>
  );
};

export default SudaneseHeader;
