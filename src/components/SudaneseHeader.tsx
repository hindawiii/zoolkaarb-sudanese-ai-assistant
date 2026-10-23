import { useMemo } from "react";
import { Settings as SettingsIcon, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";
import { FREE_TRIAL } from "@/lib/zoolCredits";
import rasmaLogo from "@/assets/madar-logo-v2.png";

const SudaneseHeader = () => {
  const { name, language } = useUser();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const greetingKey = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "greeting.morning";
    if (hour >= 12 && hour < 17) return "greeting.afternoon";
    if (hour >= 17 && hour < 21) return "greeting.evening";
    return "greeting.night";
  }, []);

  const greeting = isRtl
    ? `${t(greetingKey, "ar")}، ${name}`
    : `${t(greetingKey, "en")}, ${name}`;

  return (
    <header className="sticky top-0 z-30 topbar-glass h-[56px] px-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <img src={rasmaLogo} alt="Rasma" width={38} height={38} className="h-[38px] w-[38px] rounded-xl object-contain shadow-sm" />
        <div className="min-w-0 leading-tight">
          <h1 className="text-[17px] font-extrabold font-cairo text-gradient-gold leading-none">
            {isRtl ? "رَسْـمَـة" : "Rasma"}
          </h1>
          <p className="text-[11px] text-muted-foreground font-cairo truncate mt-1">{greeting}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 h-8 px-2.5 rounded-full border border-gold/30 bg-gold/10 text-[11px] font-bold font-cairo text-foreground">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          {isRtl ? `${FREE_TRIAL} مجاناً لكل أداة` : `${FREE_TRIAL} free / tool`}
        </span>
        <button
          onClick={() => navigate("/settings")}
          aria-label={isRtl ? "الإعدادات" : "Settings"}
          className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
        >
          <SettingsIcon className="w-[18px] h-[18px] text-foreground" />
        </button>
      </div>
    </header>
  );
};

export default SudaneseHeader;
