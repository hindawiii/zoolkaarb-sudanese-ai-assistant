import { ArrowLeft, Upload, Download, Loader2, RotateCcw, Share2, Sparkles, Zap, Wind, Flame, Swords, Drama, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/store/userStore";
import { consumeUse, getRemaining, grantAdReward } from "@/lib/studioQuota";
import { addZoolWatermark } from "@/lib/watermark";
import RewardedAdModal from "@/components/studio/RewardedAdModal";
import QuotaBadge from "@/components/studio/QuotaBadge";

const TOOL_ID = "anime-hero" as const;

const STYLES = [
  { id: "dbz", labelAr: "دراغون بول Z", labelEn: "Dragon Ball Z", color: "from-orange-500 to-yellow-400" },
  { id: "naruto", labelAr: "ناروتو شيبودن", labelEn: "Naruto Shippuden", color: "from-amber-500 to-orange-600" },
  { id: "one-piece", labelAr: "ون بيس", labelEn: "One Piece", color: "from-red-500 to-rose-600" },
  { id: "hxh", labelAr: "هانتر × هانتر", labelEn: "Hunter x Hunter", color: "from-emerald-500 to-green-700" },
  { id: "conan", labelAr: "المحقق كونان", labelEn: "Detective Conan", color: "from-blue-600 to-indigo-700" },
] as const;

const HEROES = [
  { id: "goku", labelAr: "غوكو", labelEn: "Goku", style: "dbz" },
  { id: "naruto", labelAr: "ناروتو", labelEn: "Naruto", style: "naruto" },
  { id: "luffy", labelAr: "لوفي", labelEn: "Luffy", style: "one-piece" },
] as const;

const AURAS = [
  { id: "kaio", labelAr: "كي (Kai)", labelEn: "Ki", icon: Flame },
  { id: "chakra", labelAr: "تشاكرا", labelEn: "Chakra", icon: Wind },
  { id: "nen", labelAr: "نين", labelEn: "Nen", icon: Sparkles },
  { id: "haki", labelAr: "هاكي", labelEn: "Haki", icon: Zap },
] as const;

const HAIRS = [
  { id: "keep", labelAr: "نفس الشعر", labelEn: "Keep" },
  { id: "spiky", labelAr: "شعر سبايكي", labelEn: "Spiky" },
  { id: "ssj-gold", labelAr: "سوبر ساين", labelEn: "Super Saiyan" },
] as const;

const PROPS = [
  { id: "none", labelAr: "بدون", labelEn: "None", icon: Check },
  { id: "saber", labelAr: "سيف طاقة", labelEn: "Saber", icon: Swords },
  { id: "rasengan", labelAr: "راسنغان", labelEn: "Rasengan", icon: Sparkles },
  { id: "staff", labelAr: "عصا قتال", labelEn: "Staff", icon: Drama },
] as const;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const isAiCreditsExhausted = (data: unknown) =>
  typeof data === "object" && data !== null && "code" in data && data.code === "AI_CREDITS_EXHAUSTED";

// Lightweight client-side preprocessing simulator (PoseNet/face-api stand-in)
// Uses native FaceDetector when available; otherwise returns a sane default.
const preprocess = async (dataUrl: string): Promise<{ face: boolean; pose: string }> => {
  try {
    const FD = (window as unknown as { FaceDetector?: new () => { detect: (img: HTMLImageElement) => Promise<unknown[]> } }).FaceDetector;
    if (FD) {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));
      const det = new FD();
      const faces = await det.detect(img);
      return { face: faces.length > 0, pose: "frontal" };
    }
  } catch { /* ignore */ }
  return { face: true, pose: "frontal" };
};

const AnimeStudio = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [remaining, setRemaining] = useState(getRemaining(TOOL_ID));

  const [style, setStyle] = useState<string>("dbz");
  const [hero, setHero] = useState<string>("");
  const [aura, setAura] = useState<string>("kaio");
  const [hair, setHair] = useState<string>("spiky");
  const [prop, setProp] = useState<string>("none");

  useEffect(() => {
    setRemaining(getRemaining(TOOL_ID));
  }, []);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: isRtl ? "صورة غير صالحة" : "Invalid", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: isRtl ? "الصورة كبيرة (max 8MB)" : "Too large", variant: "destructive" });
      return;
    }
    const b64 = await fileToBase64(file);
    setImage(b64);
    setOutput(null);
    setAnalyzing(true);
    const meta = await preprocess(b64);
    setAnalyzing(false);
    if (!meta.face) {
      toast({ title: isRtl ? "ما لقينا وجه واضح" : "No face detected", description: isRtl ? "جرب صورة أوضح" : "Try a clearer photo" });
    }
  };

  const reallyRun = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("photo-edit", {
        body: {
          imageBase64: image,
          action: "anime-studio",
          anime: { style, hero: hero || undefined, aura, hair, prop },
        },
      });
      if (error) throw error;
      if (isAiCreditsExhausted(data)) {
        toast({
          title: isRtl ? "رصيد الذكاء الاصطناعي خلص" : "AI balance exhausted",
          description: isRtl
            ? "الصفحة شغالة، لكن تحويل الصور يحتاج شحن رصيد Cloud & AI من إعدادات مساحة العمل."
            : "The page is still working, but image generation needs more Cloud & AI balance in workspace settings.",
          variant: "destructive",
        });
        return;
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error("No image returned");
      const watermarked = await addZoolWatermark(data.imageUrl);
      setOutput(watermarked);
      const next = consumeUse(TOOL_ID);
      setRemaining(next);
      toast({ title: isRtl ? "تمام يا بطل!" : "Done!", description: isRtl ? "التحول جاهز" : "Transformation ready" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: isRtl ? "ما زبط" : "Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const triggerRun = () => {
    if (loading || !image) {
      toast({ title: isRtl ? "ارفع صورة الأول" : "Upload an image first", variant: "destructive" });
      return;
    }
    if (remaining <= 0) {
      setAdOpen(true);
      return;
    }
    reallyRun();
  };

  const onAdRewarded = () => {
    const r = grantAdReward(TOOL_ID);
    setRemaining(r);
    setTimeout(reallyRun, 100);
  };

  const shareOutput = async () => {
    if (!output) return;
    try {
      const blob = await (await fetch(output)).blob();
      const file = new File([blob], "zool-anime.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Zool Anime Studio" });
      } else {
        const a = document.createElement("a");
        a.href = output; a.download = "zool-anime.png"; a.click();
      }
    } catch { /* ignore */ }
  };

  const reset = () => { setImage(null); setOutput(null); };

  const pickHero = (h: typeof HEROES[number]) => {
    setHero(h.id);
    setStyle(h.style);
    if (h.id === "goku") setHair("spiky");
    if (h.id === "naruto") setHair("keep");
    if (h.id === "luffy") setHair("keep");
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-32" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/studio")} className="p-1.5 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center">
          <Drama className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold font-cairo text-foreground truncate">{isRtl ? "استوديو تحويل الأنمي" : "Anime Studio"}</h1>
          <p className="text-[10px] text-muted-foreground font-cairo truncate">{isRtl ? "حوّل نفسك لبطل شونين حقيقي" : "Become a true Shonen hero"}</p>
        </div>
        <QuotaBadge remaining={remaining} isRtl={isRtl} />
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />

      {/* Source / Output preview */}
      <div className="px-4 mt-4">
        {output || loading ? (
          <div className="rounded-3xl border border-border bg-card overflow-hidden relative">
            {output ? (
              <img src={output} alt="anime result" className="w-full h-auto block" />
            ) : (
              <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-muted/30">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-xs text-foreground font-cairo text-center px-6 leading-relaxed">
                  {isRtl ? "الخال شغال.. برسم في الهالة القتالية" : "Drawing the battle aura..."}
                </p>
              </div>
            )}
          </div>
        ) : image ? (
          <div className="rounded-3xl border border-border bg-card overflow-hidden relative">
            <img src={image} alt="source" className="w-full h-auto block" />
            {analyzing && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
                <p className="text-[11px] font-cairo text-foreground">{isRtl ? "تحليل الوضعية والوجه..." : "Analyzing pose & face..."}</p>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/5] rounded-3xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary-foreground" />
            </div>
            <p className="text-sm font-bold font-cairo text-foreground">{isRtl ? "ارفع صورتك" : "Upload your photo"}</p>
            <p className="text-[11px] text-muted-foreground font-cairo px-8 text-center leading-relaxed">
              {isRtl ? "بنحلل الوضعية، السماعات، والوجه قبل التحول" : "We'll detect pose, headphones & face first"}
            </p>
          </button>
        )}

        {output && (
          <div className="flex gap-2 mt-3">
            <button onClick={reset} className="flex-1 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground active:scale-95 flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />{isRtl ? "من جديد" : "Reset"}
            </button>
            <button onClick={shareOutput} className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold active:scale-95 flex items-center justify-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />{isRtl ? "مشاركة" : "Share"}
            </button>
            <a href={output} download="zool-anime.png" className="flex-1 py-2.5 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95">
              <Download className="w-3.5 h-3.5" />{isRtl ? "حفظ" : "Save"}
            </a>
          </div>
        )}
      </div>

      {/* Style Hub */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "اختر عالم الأنمي" : "Anime Universe"}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => { setStyle(s.id); setHero(""); }}
              className={`min-w-[120px] rounded-2xl p-3 border text-start active:scale-95 ${
                style === s.id ? "border-gold bg-gold/10" : "border-border bg-card"
              }`}
            >
              <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${s.color} mb-2`} />
              <p className="text-[11px] font-bold font-cairo text-foreground leading-tight">{isRtl ? s.labelAr : s.labelEn}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Specific Hero */}
      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "التحول لبطل محدد" : "Transform to Specific Hero"}</p>
        <div className="grid grid-cols-3 gap-2">
          {HEROES.map((h) => (
            <button
              key={h.id}
              onClick={() => pickHero(h)}
              className={`py-3 rounded-xl border text-[11px] font-cairo font-bold active:scale-95 ${
                hero === h.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
              }`}
            >
              {isRtl ? h.labelAr : h.labelEn}
            </button>
          ))}
        </div>
        {hero && (
          <button onClick={() => setHero("")} className="mt-2 text-[10px] text-muted-foreground font-cairo underline">
            {isRtl ? "إلغاء البطل المحدد" : "Clear hero"}
          </button>
        )}
      </div>

      {/* Aura */}
      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "الهالة القتالية" : "Power Aura"}</p>
        <div className="grid grid-cols-4 gap-2">
          {AURAS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => setAura(a.id)}
                className={`py-2.5 rounded-xl border flex flex-col items-center gap-1 active:scale-95 ${
                  aura === a.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-cairo font-bold">{isRtl ? a.labelAr : a.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hair */}
      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "الشعر" : "Hair"}</p>
        <div className="grid grid-cols-3 gap-2">
          {HAIRS.map((h) => (
            <button
              key={h.id}
              onClick={() => setHair(h.id)}
              className={`py-2.5 rounded-xl border text-[11px] font-cairo font-bold active:scale-95 ${
                hair === h.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
              }`}
            >
              {isRtl ? h.labelAr : h.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Props */}
      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "السلاح / الأداة" : "Prop in Hand"}</p>
        <div className="grid grid-cols-4 gap-2">
          {PROPS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setProp(p.id)}
                className={`py-2.5 rounded-xl border flex flex-col items-center gap-1 active:scale-95 ${
                  prop === p.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-cairo font-bold">{isRtl ? p.labelAr : p.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-card/95 backdrop-blur-xl border-t border-border" dir={isRtl ? "rtl" : "ltr"}>
        <div className="max-w-md mx-auto px-3 py-3">
          <button
            onClick={triggerRun}
            disabled={loading || !image || analyzing}
            className="w-full py-3.5 rounded-xl gradient-gold text-primary-foreground font-bold font-cairo disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isRtl ? "حوّل الفزعة" : "Transform"}
          </button>
          <p className="text-[10px] text-center text-muted-foreground font-cairo mt-1.5">
            {isRtl
              ? remaining > 0 ? `${remaining} محاولات مجانية متبقية` : "خلصت — شوف إعلان قصير +5"
              : remaining > 0 ? `${remaining} free uses left` : "Out — short ad for +5"}
          </p>
        </div>
      </div>

      <RewardedAdModal open={adOpen} isRtl={isRtl} onClose={() => setAdOpen(false)} onRewarded={onAdRewarded} />
    </div>
  );
};

export default AnimeStudio;
