import { ArrowLeft, ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@/store/userStore";
import { STUDIO_TOOLS } from "@/lib/studioTools";
import { getRemaining, type StudioToolId } from "@/lib/studioQuota";
import QuotaBadge from "@/components/studio/QuotaBadge";

const accentClasses: Record<string, string> = {
  gold: "from-gold/25 to-gold-glow/15 border-gold/40 text-gold",
  nile: "from-nile-green/25 to-nile-light/30 border-nile-green/40 text-nile-green",
  earth: "from-earth/25 to-earth-light/20 border-earth/40 text-earth",
};

const Studio = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const [, force] = useState(0);

  // refresh quota badges when window focuses
  useEffect(() => {
    const refresh = () => force((n) => n + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-24" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-xl hover:bg-muted transition-colors" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground">استوديو الذكاء الاصطناعي</h1>
          <p className="text-[10px] text-muted-foreground">Madar AI Studio — Production Suite</p>
        </div>
      </header>

      {/* Hero banner */}
      <div className="px-4 pt-4">
        <div className="rounded-3xl gradient-gold p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.4),transparent_60%)]" />
          <div className="relative">
            <p className="text-[11px] font-bold text-primary-foreground/80 font-cairo">
              {isRtl ? "✦ معمل الخال للذكاء الاصطناعي" : "✦ Al-Khal's AI Lab"}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-primary-foreground font-cairo leading-tight">
              {isRtl ? "ستة أدوات سحرية" : "Six magical tools"}
            </h2>
            <p className="mt-1.5 text-xs text-primary-foreground/80 font-cairo">
              {isRtl
                ? "كل أداة فيها 3 محاولات مجانية.. وبعدين إعلان قصير وتواصل"
                : "3 free uses per tool. Watch a short ad to keep going."}
            </p>
          </div>
        </div>
      </div>

      {/* Tools grid */}
      <div className="px-4 mt-5 grid grid-cols-2 gap-3">
        {STUDIO_TOOLS.map((tool) => {
          const remaining = getRemaining(tool.id as StudioToolId);
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => navigate(`/studio/${tool.slug}`)}
              className={`text-${isRtl ? "right" : "left"} rounded-2xl bg-gradient-to-br ${accentClasses[tool.accent]} border p-3.5 active:scale-[0.97] transition-transform flex flex-col gap-2 min-h-[140px] relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <Chevron className="w-4 h-4 text-foreground/50" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold font-cairo text-foreground leading-tight">
                  {isRtl ? tool.labelAr : tool.labelEn}
                </h3>
                <p className="text-[10.5px] text-foreground/60 font-cairo mt-0.5 leading-snug">
                  {isRtl ? tool.taglineAr : tool.taglineEn}
                </p>
              </div>
              <QuotaBadge remaining={remaining} isRtl={isRtl} />
            </button>
          );
        })}
      </div>

      {/* Quick edit shortcut */}
      <div className="px-4 mt-5">
        <button
          onClick={() => navigate("/studio/quick")}
          className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
        >
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
            <Wrench className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 text-start">
            <p className="text-sm font-bold font-cairo text-foreground">
              {isRtl ? "أدوات سريعة" : "Quick edit tools"}
            </p>
            <p className="text-[11px] text-muted-foreground font-cairo">
              {isRtl ? "إزالة خلفية، ترميم، فلاتر، تحسين" : "Remove BG, restore, filters, enhance"}
            </p>
          </div>
          <Chevron className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default Studio;
