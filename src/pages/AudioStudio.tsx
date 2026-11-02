import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import { ChevronLeft, ChevronRight, Film, Mic2, Music2, Image, AudioLines } from "lucide-react";
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
        <BackButton
          onClick={() => navigate("/")} />
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground">
            {isRtl ? "استوديو رسمة" : "Rasma Audio Studio"}
          </h1>
          <p className="text-[10px] text-muted-foreground">Audio Production Suite</p>
        </div>
      </header>

      <main className="px-4 pt-5 pb-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">{isRtl ? "أدوات الإنتاج" : "Production tools"}</h2>
          <AudioLines className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        {TOOLS.map((tool) => {
          const remaining = getCredits(tool.id);
          const Icon = tool.icon;
          return (
            <Button variant="ghost" key={tool.id} onClick={() => navigate(`/audio-studio/${tool.slug}`)}
              className="w-full h-auto min-h-[190px] rounded-lg p-5 surface-obsidian whitespace-normal flex-col items-stretch justify-between gap-5 text-start active:scale-[0.98] transition-transform">
              <span className="flex items-start gap-3">
                <span className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${tool.accent === "gold" ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}><Icon className="!w-6 !h-6" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-bold text-foreground">{isRtl ? tool.labelAr : tool.labelEn}</span>
                  <span className="block mt-1 text-xs text-muted-foreground leading-relaxed">{isRtl ? tool.taglineAr : tool.taglineEn}</span>
                </span>
                <Chevron className="text-muted-foreground" />
              </span>
              <span className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="flex items-center gap-2 text-muted-foreground" aria-hidden="true">
                  {tool.id === "media-factory" ? <><Film /><span>+</span><Image /><span>+</span><Music2 /></> : <><Mic2 /><span>+</span><Music2 /></>}
                </span>
                <span className="text-xs text-foreground">{isRtl ? `${remaining} متبقية` : `${remaining} remaining`}</span>
              </span>
            </Button>
          );
        })}
        <div className="border-t border-border pt-4 flex items-center gap-3">
          <AudioLines className="text-secondary w-5 h-5 shrink-0" />
          <span className="flex-1 text-sm font-semibold text-foreground">{isRtl ? "غيّر صوتك" : "Voice changer"}</span>
          <Button variant="outline" onClick={() => navigate("/voice-changer")} className="gap-2">{isRtl ? "فتح" : "Open"}<Chevron /></Button>
        </div>
      </main>
    </div>
  );
};

export default AudioStudio;
