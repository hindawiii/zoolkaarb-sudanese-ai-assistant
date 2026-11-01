import BackButton from "@/components/BackButton";
import { Heart, Star, Sun, Moon, MessageCircle, Sparkles, Play, Crown, Lock, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

type Category = "all" | "friday" | "morning" | "greetings" | "cards";

interface Template {
  id: string;
  title: string;
  titleAr: string;
  category: Exclude<Category, "all">;
  icon: typeof Star;
  gradient: string;
  iconColor: string;
  isPremium: boolean;
  trending?: boolean;
}

const templates: Template[] = [
  { id: "friday", title: "Friday Blessings", titleAr: "جمعة مباركة", category: "friday", icon: Star, gradient: "from-gold/40 via-sand to-gold/20", iconColor: "text-gold", isPremium: false, trending: true },
  { id: "friday-pro", title: "Friday Premium", titleAr: "جمعة مباركة (فاخر)", category: "friday", icon: Star, gradient: "from-gold/60 via-gold/30 to-earth/30", iconColor: "text-gold", isPremium: true },
  { id: "morning", title: "Morning Greetings", titleAr: "صباح الخير", category: "morning", icon: Sun, gradient: "from-nile/40 via-sand to-nile/20", iconColor: "text-nile", isPremium: false, trending: true },
  { id: "morning-pro", title: "Morning Premium", titleAr: "صباحيات فاخرة", category: "morning", icon: Sun, gradient: "from-nile/60 via-sand to-gold/30", iconColor: "text-nile", isPremium: true },
  { id: "evening", title: "Evening Greetings", titleAr: "مساء النور", category: "morning", icon: Moon, gradient: "from-earth/40 via-sand to-earth/20", iconColor: "text-earth-light", isPremium: false },
  { id: "whatsapp", title: "WhatsApp Status", titleAr: "حالات واتساب", category: "greetings", icon: MessageCircle, gradient: "from-sand-dark/40 via-sand to-gold/20", iconColor: "text-sand-dark", isPremium: false, trending: true },
  { id: "congrats", title: "Congratulations", titleAr: "تهاني ومباركات", category: "greetings", icon: Sparkles, gradient: "from-gold/30 via-sand to-nile/20", iconColor: "text-gold", isPremium: false },
  { id: "wedding", title: "Wedding Cards", titleAr: "بطاقات أعراس", category: "cards", icon: Heart, gradient: "from-gold/50 via-sand to-gold/30", iconColor: "text-gold", isPremium: true },
  { id: "eid", title: "Eid Cards", titleAr: "بطاقات العيد", category: "cards", icon: Sparkles, gradient: "from-nile/50 via-gold/20 to-sand", iconColor: "text-nile", isPremium: true },
  { id: "birthday", title: "Birthday Cards", titleAr: "بطاقات أعياد ميلاد", category: "cards", icon: Heart, gradient: "from-earth/40 via-sand to-gold/30", iconColor: "text-earth-light", isPremium: false },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "friday", label: "جمعة مباركة" },
  { id: "morning", label: "صباحيات" },
  { id: "greetings", label: "تهاني" },
  { id: "cards", label: "بطاقات" },
];

const AlWajib = () => {
  const navigate = useNavigate();
  const [adTemplate, setAdTemplate] = useState<Template | null>(null);
  const [activeCat, setActiveCat] = useState<Category>("all");

  const trending = useMemo(() => templates.filter((t) => t.trending).slice(0, 3), []);
  const filtered = useMemo(
    () => (activeCat === "all" ? templates : templates.filter((t) => t.category === activeCat)),
    [activeCat],
  );

  const handleClick = (t: Template) => {
    if (t.isPremium) {
      setAdTemplate(t);
    } else {
      navigate(`/al-wajib/editor/${t.id}`);
    }
  };

  const watchAd = () => {
    if (!adTemplate) return;
    const id = adTemplate.id;
    setAdTemplate(null);
    setTimeout(() => navigate(`/al-wajib/editor/${id}`), 300);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-20">
        <BackButton onClick={() => navigate("/")} />
        <div className="flex-1 text-start">
          <h1 className="text-base font-bold font-cairo text-foreground">مصمم الحالات</h1>
          <p className="text-[10px] text-muted-foreground font-cairo">قوالب احترافية وتهاني</p>
        </div>
      </header>

      {/* Category bar */}
      <div className="sticky top-[60px] z-10 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((c) => {
            const active = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-cairo font-semibold transition-all ${
                  active
                    ? "gradient-gold text-primary-foreground shadow-md"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Al-Khal's Picks */}
      {activeCat === "all" && (
        <div className="px-5 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary-foreground" />
            </div>
            <h2 className="text-sm font-bold font-cairo text-foreground">ترشيحات الخال</h2>
            <span className="text-[10px] text-muted-foreground font-cairo">الأكثر استخداماً</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
            {trending.map((t) => (
              <button
                key={`trend-${t.id}`}
                onClick={() => handleClick(t)}
                className={`shrink-0 w-32 aspect-[3/4] rounded-2xl bg-gradient-to-br ${t.gradient} border border-border p-3 flex flex-col justify-between text-start active:scale-95 transition-transform shadow-sm relative overflow-hidden`}
              >
                <div className={`w-9 h-9 rounded-xl bg-card/70 backdrop-blur flex items-center justify-center`}>
                  <t.icon className={`w-4 h-4 ${t.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-bold font-cairo text-foreground" dir="rtl">{t.titleAr}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Flame className="w-3 h-3 text-gold" />
                    <span className="text-[9px] text-muted-foreground font-cairo">رائج</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates grid */}
      <div className="px-5 mt-5">
        <h2 className="text-sm font-bold font-cairo text-foreground mb-3 text-start">
          {activeCat === "all" ? "كل القوالب" : CATEGORIES.find((c) => c.id === activeCat)?.label}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => handleClick(t)}
              className={`relative aspect-[3/4] rounded-2xl bg-gradient-to-br ${t.gradient} border border-border p-3 flex flex-col justify-between text-start active:scale-[0.97] transition-transform overflow-hidden shadow-sm`}
            >
              {t.isPremium && (
                <div className="absolute top-2 end-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-card/80 backdrop-blur border border-gold/40">
                  <Crown className="w-3 h-3 text-gold" />
                  <span className="text-[9px] font-cairo font-bold text-gold">VIP</span>
                </div>
              )}
              <div className={`w-10 h-10 rounded-xl bg-card/70 backdrop-blur flex items-center justify-center`}>
                <t.icon className={`w-5 h-5 ${t.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-bold font-cairo text-foreground" dir="rtl">{t.titleAr}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.title}</p>
              </div>
              {t.isPremium && (
                <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px] flex items-end justify-center pb-3 pointer-events-none">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/90 border border-border">
                    <Lock className="w-3 h-3 text-gold" />
                    <span className="text-[10px] font-cairo font-semibold text-foreground">شاهد إعلان</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {adTemplate && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setAdTemplate(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-7 mx-6 text-center max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl gradient-gold mx-auto flex items-center justify-center mb-4">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold font-cairo text-foreground">قالب احترافي</h3>
            <p className="text-sm text-muted-foreground mt-2 font-cairo" dir="rtl">
              هذا القالب احترافي.. شاهد إعلان لدعم التطبيق وفتح "{adTemplate.titleAr}" للتعديل.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setAdTemplate(null)}
                className="flex-1 px-4 py-2.5 rounded-full border border-border text-sm font-semibold font-cairo active:scale-95 transition-transform"
              >
                لاحقاً
              </button>
              <button
                onClick={watchAd}
                className="flex-1 px-4 py-2.5 rounded-full gradient-gold text-primary-foreground text-sm font-semibold font-cairo active:scale-95 transition-transform flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                شاهد الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlWajib;
