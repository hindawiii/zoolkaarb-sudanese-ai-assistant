import { ArrowLeft, ChevronLeft, ChevronRight, Film, Mic2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@/store/userStore";
import { getCredits } from "@/lib/zoolCredits";

type Tool = {
  id: string;
  slug: string;
  labelAr: string;
  labelEn: string;
  taglineAr: string;
  taglineEn: string;
  icon: typeof Film;
  accent: "gold" | "nile" | "earth";
};

const TOOLS: Tool[] = [
  {
    id: "media-factory",
    slug: "media-factory",
    labelAr: "مصنع الميديا",
    labelEn: "Media Factory",
    taglineAr: "حول الفيديو لصوت + خلط الصور بالأغاني",
    taglineEn: "Video → audio · photo + audio mixer",
    icon: Film,
    accent: "gold",
  },
  {
    id: "voice-over",
    slug: "voice-over",
    labelAr: "بصمتي الخاصة",
    labelEn: "Voice-over",
    taglineAr: "سجل صوتك في البداية، الوسط، أو النهاية",
    taglineEn: "Drop voice at start / middle / end",
    icon: Mic2,
    accent: "nile",
  },
];

const accentClasses: Record<Tool["accent"], string> = {
  gold: "from-gold/25 via-gold-glow/10 to-transparent border-gold/40 text-gold",
  nile: "from-nile/25 via-nile-light/20 to-transparent border-nile/40 text-nile",
  earth: "from-earth/30 via-earth-light/15 to-transparent border-earth/40 text-earth-light",
};

const AudioStudio = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const [, force] = useState(0);

  useEffect(() => {
    const refresh = () => force((n) => n + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("zoolkaarb-credits-changed", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("zoolkaarb-credits-changed", refresh);
    };
  }, []);

  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-24" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button
          onClick={() => navigate("/")}
          className="p-1.5 rounded-xl hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground">
            {isRtl ? "استوديو مدار" : "Madar Audio Studio"}
          </h1>
          <p className="text-[10px] text-muted-foreground">Audio Production Suite</p>
        </div>
      </header>

      {/* Hero */}
      <div className="px-4 pt-4">
        <div className="relative rounded-3xl p-5 overflow-hidden border border-gold/30 bg-gradient-to-br from-earth/40 via-card/80 to-nile/20 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,hsl(var(--gold-glow)/0.35),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_90%,hsl(var(--nile-green)/0.25),transparent_50%)]" />
          <div className="relative">
            <p className="text-[11px] font-bold text-gold font-cairo">
              {isRtl ? "✦ معمل الصوت السوداني" : "✦ Sudanese Sound Lab"}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-foreground font-cairo leading-tight">
              {isRtl ? "اخلط، سجل، صدّر.. بكبسة زر" : "Mix, record, export — one tap"}
            </h2>
            <p className="mt-1.5 text-xs text-foreground/70 font-cairo">
              {isRtl
                ? "3 تجارب مجانية لكل أداة.. وبعدين إعلان قصير ونواصل الكرب"
                : "3 free uses per tool. Watch a quick ad to keep going."}
            </p>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="px-4 mt-5 space-y-3">
        {TOOLS.map((tool) => {
          const remaining = getCredits(tool.id);
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => navigate(`/audio-studio/${tool.slug}`)}
              className={`w-full text-${isRtl ? "right" : "left"} rounded-2xl border bg-gradient-to-br ${accentClasses[tool.accent]} bg-card/40 backdrop-blur-xl p-4 active:scale-[0.98] transition-transform flex items-center gap-3 relative overflow-hidden`}
            >
              <div className="w-12 h-12 rounded-2xl bg-background/60 backdrop-blur flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-cairo text-foreground">
                    {isRtl ? tool.labelAr : tool.labelEn}
                  </h3>
                  <span className="text-[10px] font-bold font-cairo px-1.5 py-0.5 rounded-full bg-gold/20 text-gold">
                    {isRtl ? `${remaining} فزعات` : `${remaining} left`}
                  </span>
                </div>
                <p className="text-[11px] text-foreground/70 font-cairo mt-0.5 leading-snug">
                  {isRtl ? tool.taglineAr : tool.taglineEn}
                </p>
              </div>
              <Chevron className="w-5 h-5 text-foreground/50 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AudioStudio;
