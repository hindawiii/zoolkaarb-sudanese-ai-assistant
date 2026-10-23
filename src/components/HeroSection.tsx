import { Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import avatarImg from "@/assets/wad-al-halal-avatar.png";
import { useUser } from "@/store/userStore";

const bars = [0.6, 1, 0.75, 0.9, 0.5, 0.85, 0.65];

const HeroSection = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";

  return (
    <section className="mx-4 mt-3">
      <button
        onClick={() => navigate("/chat")}
        aria-label={isRtl ? "تكلم مع الخال" : "Talk to Al-Khal"}
        className="w-full h-[58px] rounded-full surface-obsidian flex items-center gap-3 ps-1.5 pe-1.5 active:scale-[0.98] transition-transform"
      >
        <div className="relative shrink-0">
          <img src={avatarImg} alt="" width={46} height={46} className="w-[46px] h-[46px] rounded-full object-cover border-2 border-gold" />
          <span className="absolute bottom-0 end-0 w-3 h-3 rounded-full bg-nile border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0 text-start">
          <p className="text-[13px] font-bold font-cairo text-foreground leading-tight">الخال</p>
          <p className="text-[11px] text-muted-foreground font-cairo truncate">
            {isRtl ? "حبابك يا هندسة.. جاهزين نرسم؟" : "Ready to create?"}
          </p>
        </div>
        <div className="flex items-center gap-[3px] h-5" aria-hidden>
          {bars.map((h, i) => (
            <span key={i} className="wave-bar w-[3px] rounded-full bg-gold/70" style={{ height: `${h * 20}px`, animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <span className="w-[46px] h-[46px] shrink-0 rounded-full gradient-gold flex items-center justify-center">
          <Mic className="w-5 h-5 text-primary-foreground" />
        </span>
      </button>
    </section>
  );
};

export default HeroSection;
