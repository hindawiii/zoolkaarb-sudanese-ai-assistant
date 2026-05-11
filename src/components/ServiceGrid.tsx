import {
  ImagePlus,
  Heart,
  Wand2,
  Share2,
  PhoneCall,
  Music2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUser } from "@/store/userStore";

type Tile = {
  titleAr: string;
  titleEn: string;
  desc: string;
  icon: typeof ImagePlus;
  iconBg: string;
  route?: string;
  comingSoon?: boolean;
};

type Hub = {
  titleAr: string;
  titleEn: string;
  accent: string; // gradient class for header pill
  tiles: Tile[];
};

const ServiceGrid = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const [showOverlay, setShowOverlay] = useState(false);

  const hubs: Hub[] = [
    {
      titleAr: "استوديو الذكاء الاصطناعي",
      titleEn: "AI Studio",
      accent: "gradient-gold",
      tiles: [
        {
          titleAr: "ستوديو مدار",
          titleEn: "Madar Studio",
          desc: isRtl ? "Face Swap · Anime · Living Image" : "Face Swap · Anime · Living",
          icon: ImagePlus,
          iconBg: "bg-gold/20",
          route: "/studio",
        },
        {
          titleAr: "مصمم حالات",
          titleEn: "Status Maker",
          desc: isRtl ? "حالات وقوالب جاهزة" : "Ready-made status",
          icon: Heart,
          iconBg: "bg-nile/20",
          route: "/al-wajib",
        },
        {
          titleAr: "غيّر صوتك",
          titleEn: "Voice-over",
          desc: isRtl ? "مقلب الصوت بشخصيات سودانية" : "Sudanese voice changer",
          icon: Wand2,
          iconBg: "bg-earth/20",
          route: "/voice-changer",
        },
        {
          titleAr: "مصنع الميديا",
          titleEn: "Media Factory",
          desc: isRtl ? "استوديو مدار" : "Media · Voice-over · Mix",
          icon: Music2,
          iconBg: "bg-gold/20",
          route: "/audio-studio",
        },
        {
          titleAr: "فزعة الخال",
          titleEn: "Fake Call",
          desc: isRtl ? "مكالمة وهمية واقعية" : "Realistic fake call",
          icon: PhoneCall,
          iconBg: "bg-nile/20",
          route: "/fake-call",
        },
        {
          titleAr: "مدار شير",
          titleEn: "Madar Share",
          desc: isRtl ? "مشاركة بدون نت" : "Offline file share",
          icon: Share2,
          iconBg: "bg-earth/20",
          route: "/zool-share",
        },
      ],
    },
  ];

  const onTile = (t: Tile) => {
    if (t.comingSoon || !t.route) {
      setShowOverlay(true);
      return;
    }
    navigate(t.route);
  };

  return (
    <section className="px-5 mt-6 space-y-7">
      {hubs.map((hub) => (
        <div key={hub.titleAr}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-block w-1.5 h-5 rounded-full ${hub.accent}`} />
            <h3 className="text-base font-bold font-cairo text-foreground" dir="rtl">
              {isRtl ? hub.titleAr : hub.titleEn}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {hub.tiles.map((tile) => (
              <button
                key={tile.titleAr}
                onClick={() => onTile(tile)}
                className="relative rounded-2xl bg-card border border-border p-4 text-start active:scale-[0.97] transition-transform hover:glow-gold overflow-hidden"
              >
                {tile.comingSoon && (
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-cairo">
                    {isRtl ? "قريباً" : "Soon"}
                  </span>
                )}
                <div
                  className={`w-11 h-11 rounded-xl ${tile.iconBg} flex items-center justify-center mb-3`}
                >
                  <tile.icon className="w-5 h-5 text-foreground" />
                </div>
                <p className="text-sm font-bold font-cairo text-foreground" dir="rtl">
                  {isRtl ? tile.titleAr : tile.titleEn}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 font-cairo">
                  {tile.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}

      {showOverlay && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowOverlay(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-8 mx-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold font-cairo text-foreground">
              {isRtl ? "قريباً يا هندسة!" : "Coming soon!"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 font-cairo">
              {isRtl ? "الخال شغال على الميزة دي.. صبراً جميلاً" : "Al-Khal is cooking this up..."}
            </p>
            <button
              onClick={() => setShowOverlay(false)}
              className="mt-5 px-6 py-2.5 rounded-full gradient-gold text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
            >
              {isRtl ? "تمام" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ServiceGrid;
