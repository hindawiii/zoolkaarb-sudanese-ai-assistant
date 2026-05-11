import { useMemo } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";

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
    <header className="px-5 pt-6 pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-start">
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-cairo truncate">
            {isRtl ? "مدار" : "Madar"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-cairo truncate">
            {greeting}
          </p>
        </div>
        <button
          onClick={() => navigate("/settings")}
          aria-label={isRtl ? "الإعدادات" : "Settings"}
          className="shrink-0 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
        >
          <SettingsIcon className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </header>
  );
};

export default SudaneseHeader;
