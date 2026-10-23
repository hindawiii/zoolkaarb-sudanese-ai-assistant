import { ImagePlus, Heart, Wand2, Share2, PhoneCall, Music2, ArrowLeft, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/store/userStore";

type Tile = {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: typeof ImagePlus;
  tint: string;
  route: string;
};

const tiles: Tile[] = [
  { titleAr: "مصمم حالات", titleEn: "Status Maker", descAr: "خطوط وقوالب", descEn: "Fonts & templates", icon: Heart, tint: "bg-nile/20 text-nile", route: "/al-wajib" },
  { titleAr: "غيّر صوتك", titleEn: "Voice-over", descAr: "أصوات سودانية", descEn: "Sudanese voices", icon: Wand2, tint: "bg-gold/20 text-gold", route: "/voice-changer" },
  { titleAr: "مصنع الميديا", titleEn: "Media Factory", descAr: "صوت · فيديو · دمج", descEn: "Audio · Video · Mix", icon: Music2, tint: "bg-earth/25 text-earth-light", route: "/audio-studio" },
  { titleAr: "فزعة الخال", titleEn: "Fake Call", descAr: "مكالمة واقعية", descEn: "Realistic call", icon: PhoneCall, tint: "bg-nile/20 text-nile", route: "/fake-call" },
];

const ServiceGrid = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";

  return (
    <section className="px-4 mt-4 space-y-2.5">
      {/* Spotlight */}
      <button
        onClick={() => navigate("/studio")}
        className="relative w-full h-[132px] rounded-3xl surface-hero p-4 text-start overflow-hidden active:scale-[0.98] transition-transform"
      >
        <div className="absolute -bottom-8 -end-6 w-36 h-36 rounded-full bg-gold/15 blur-2xl" />
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-[10px] font-bold font-cairo text-gold">
          <Star className="w-3 h-3 fill-current" />
          {isRtl ? "الأداة الأقوى" : "Flagship"}
        </span>
        <div className="flex items-end justify-between mt-2.5 gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold font-cairo text-foreground leading-tight">
              {isRtl ? "ستوديو رسمة" : "Rasma Studio"}
            </h3>
            <p className="text-[12px] text-muted-foreground font-cairo mt-1 truncate">
              {isRtl ? "أنمي · أزياء تراثية · تبديل وجوه · دمج ذكي" : "Anime · Heritage outfits · Face swap · Blend"}
            </p>
          </div>
          <span className="w-11 h-11 shrink-0 rounded-2xl gradient-gold flex items-center justify-center shadow-md">
            <ArrowLeft className={`w-5 h-5 text-primary-foreground ${isRtl ? "" : "rotate-180"}`} />
          </span>
        </div>
        <ImagePlus className="absolute top-3 end-4 w-9 h-9 text-gold/40" aria-hidden />
      </button>

      {/* Creative grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((tile) => (
          <button
            key={tile.route}
            onClick={() => navigate(tile.route)}
            className="h-[92px] rounded-2xl surface-obsidian p-3 flex flex-col justify-between text-start active:scale-[0.97] transition-transform"
          >
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tile.tint}`}>
              <tile.icon className="w-[18px] h-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold font-cairo text-foreground leading-tight truncate">{isRtl ? tile.titleAr : tile.titleEn}</p>
              <p className="text-[10.5px] text-muted-foreground font-cairo truncate">{isRtl ? tile.descAr : tile.descEn}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Share strip */}
      <button
        onClick={() => navigate("/zool-share")}
        className="w-full h-[52px] rounded-2xl surface-obsidian px-3 flex items-center gap-3 text-start active:scale-[0.98] transition-transform"
      >
        <span className="w-9 h-9 rounded-xl bg-earth/25 text-earth-light flex items-center justify-center">
          <Share2 className="w-[18px] h-[18px]" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold font-cairo text-foreground leading-tight">{isRtl ? "رسمة شير" : "Rasma Share"}</p>
          <p className="text-[10.5px] text-muted-foreground font-cairo">{isRtl ? "انقل ملفاتك بدون نت" : "Share files offline"}</p>
        </div>
        <ArrowLeft className={`w-4 h-4 text-muted-foreground ${isRtl ? "" : "rotate-180"}`} />
      </button>
    </section>
  );
};

export default ServiceGrid;
