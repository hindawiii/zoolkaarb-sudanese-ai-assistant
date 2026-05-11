import { ArrowLeft, Upload, Download, Loader2, RotateCcw, Share2, Sparkles, Shirt, Crown, Glasses, Wand2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/store/userStore";
import { consumeUse, getRemaining, grantAdReward } from "@/lib/studioQuota";
import { addZoolWatermark } from "@/lib/watermark";
import RewardedAdModal from "@/components/studio/RewardedAdModal";
import QuotaBadge from "@/components/studio/QuotaBadge";

const TOOL_ID = "clothes-changer" as const;

type CategoryId = "casual" | "heritage" | "formal";

const CATEGORIES: { id: CategoryId; labelAr: string; labelEn: string; emoji: string; tone: string }[] = [
  { id: "casual", labelAr: "كاجوال", labelEn: "Casual", emoji: "👕", tone: "from-sky-500/20 to-indigo-500/10" },
  { id: "heritage", labelAr: "تراثي", labelEn: "Heritage", emoji: "🕌", tone: "from-amber-500/25 to-yellow-500/10" },
  { id: "formal", labelAr: "رسمي", labelEn: "Formal", emoji: "🤵", tone: "from-slate-500/20 to-neutral-500/10" },
];

const HERITAGE_OPTIONS = [
  { id: "galabiya", labelAr: "جلابية فقط", labelEn: "Galabiya only", emoji: "👘" },
  { id: "galabiya-imma", labelAr: "جلابية بعمة", labelEn: "Galabiya + Imma", emoji: "👳🏽" },
  { id: "galabiya-imma-shawl-cane", labelAr: "جلابية وعمة وشال وعجاز", labelEn: "Galabiya + Imma + Shawl + Cane", emoji: "🪄" },
  { id: "galabiya-imma-shawl-cane-markoub", labelAr: "+ مركوب", labelEn: "+ Markoub shoes", emoji: "👞" },
  { id: "ansar", labelAr: "جلابية أنصارية", labelEn: "Ansar-style Galabiya", emoji: "🏳️" },
] as const;

const FORMAL_OPTIONS = [
  { id: "classic", labelAr: "بدلة كلاسيك", labelEn: "Classic suit", emoji: "🤵" },
  { id: "blazer", labelAr: "بليزر", labelEn: "Blazer + chinos", emoji: "🧥" },
  { id: "wedding", labelAr: "بدلة عرس", labelEn: "Wedding suit", emoji: "💍" },
] as const;

const CASUAL_OPTIONS = [
  { id: "tshirt-jeans", labelAr: "تي شيرت وجينز", labelEn: "T-shirt & jeans", emoji: "👖" },
  { id: "hoodie", labelAr: "هودي ستريت", labelEn: "Streetwear hoodie", emoji: "🧢" },
  { id: "polo", labelAr: "بولو وشورت", labelEn: "Polo & shorts", emoji: "🩳" },
  { id: "denim-jacket", labelAr: "جاكيت جينز", labelEn: "Denim jacket", emoji: "🧥" },
] as const;

const EYEWEAR = [
  { id: "none", labelAr: "بدون", labelEn: "None" },
  { id: "sunglasses-aviator", labelAr: "شمسية أفياتور", labelEn: "Aviator shades" },
  { id: "sunglasses-wayfarer", labelAr: "شمسية ويفرر", labelEn: "Wayfarer shades" },
  { id: "glasses-clear", labelAr: "نظارة طبية", labelEn: "Clear glasses" },
] as const;

const HEADWEAR = [
  { id: "none", labelAr: "بدون", labelEn: "None" },
  { id: "cap", labelAr: "كاب كاجوال", labelEn: "Casual cap" },
  { id: "taqiya", labelAr: "طاقية", labelEn: "Taqiya" },
  { id: "tarboush", labelAr: "طربوش", labelEn: "Tarboush" },
] as const;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

// Lightweight client-side pose-stub (Mediapipe-style placeholder). Returns pose hint string.
const detectPose = async (dataUrl: string): Promise<{ pose: string; hasFace: boolean }> => {
  try {
    const FD = (window as unknown as { FaceDetector?: new () => { detect: (img: HTMLImageElement) => Promise<unknown[]> } }).FaceDetector;
    if (FD) {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));
      const det = new FD();
      const faces = await det.detect(img);
      // Heuristic: portrait aspect → likely standing/sitting upright
      const aspect = img.width / img.height;
      const pose = aspect > 1.1 ? "leaning/sideways" : aspect < 0.85 ? "full-body upright" : "seated/upper-body";
      return { hasFace: faces.length > 0, pose };
    }
  } catch { /* ignore */ }
  return { hasFace: true, pose: "natural" };
};

const OutfitterStudio = () => {
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
  const [pose, setPose] = useState<string>("natural");
  const [aiCreditsExhausted, setAiCreditsExhausted] = useState(false);

  const [category, setCategory] = useState<CategoryId>("heritage");
  const [variant, setVariant] = useState<string>("galabiya-imma");
  const [eyewear, setEyewear] = useState<string>("none");
  const [headwear, setHeadwear] = useState<string>("none");
  const [mixMatch, setMixMatch] = useState(false);
  const [mixTarget, setMixTarget] = useState<string>("top");

  useEffect(() => { setRemaining(getRemaining(TOOL_ID)); }, []);

  // sync default variant per category
  useEffect(() => {
    if (category === "heritage") setVariant("galabiya-imma");
    if (category === "formal") setVariant("classic");
    if (category === "casual") setVariant("tshirt-jeans");
  }, [category]);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast({ title: isRtl ? "صورة غير صالحة" : "Invalid", variant: "destructive" });
    if (file.size > 8 * 1024 * 1024) return toast({ title: isRtl ? "كبيرة جداً (8MB)" : "Too large", variant: "destructive" });
    const b64 = await fileToBase64(file);
    setImage(b64);
    setOutput(null);
    setAnalyzing(true);
    const meta = await detectPose(b64);
    setPose(meta.pose);
    setAnalyzing(false);
    if (!meta.hasFace) toast({ title: isRtl ? "ما لقينا وجه واضح" : "No clear face" });
  };

  const variants = category === "heritage" ? HERITAGE_OPTIONS : category === "formal" ? FORMAL_OPTIONS : CASUAL_OPTIONS;

  const reallyRun = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("photo-edit", {
        body: {
          imageBase64: image,
          action: "outfitter-studio",
          outfitter: {
            category,
            variant,
            eyewear,
            headwear,
            mixMatch,
            mixTarget: mixMatch ? mixTarget : undefined,
            pose,
          },
        },
      });
      if (error) throw error;
      if (data?.code === "AI_CREDITS_EXHAUSTED") {
        setAiCreditsExhausted(true);
        toast({
          title: isRtl ? "رصيد الذكاء الاصطناعي خلص" : "AI balance exhausted",
          description: isRtl
            ? "زِد رصيد Lovable AI من إعدادات مساحة العمل عشان نكمل التعديل."
            : "Add Lovable AI balance in workspace settings to keep editing.",
          variant: "destructive",
        });
        return;
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error("No image");
      setAiCreditsExhausted(false);
      const watermarked = await addZoolWatermark(data.imageUrl);
      setOutput(watermarked);
      const next = consumeUse(TOOL_ID);
      setRemaining(next);
      toast({ title: isRtl ? "جاهزة!" : "Done!", description: isRtl ? "اللبس انضبط" : "Outfit applied" });
    } catch (err) {
      toast({ title: isRtl ? "ما زبط" : "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const triggerRun = () => {
    if (loading || !image) return toast({ title: isRtl ? "ارفع صورة الأول" : "Upload an image first", variant: "destructive" });
    if (remaining <= 0) return setAdOpen(true);
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
      const file = new File([blob], "zool-outfitter.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Madar Outfitter" });
      } else {
        const a = document.createElement("a");
        a.href = output; a.download = "zool-outfitter.png"; a.click();
      }
    } catch { /* ignore */ }
  };

  const reset = () => { setImage(null); setOutput(null); };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-32" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gold/30 bg-card/70 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/studio")} className="p-1.5 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center">
          <Shirt className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold font-cairo text-foreground truncate">{isRtl ? "استوديو الملابس" : "Outfitter Studio"}</h1>
          <p className="text-[10px] text-muted-foreground font-cairo truncate">
            {isRtl ? `رصيد الفزعة: ${remaining}` : `Credits: ${remaining}`}
          </p>
        </div>
        <QuotaBadge remaining={remaining} isRtl={isRtl} />
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />

      {/* Preview */}
      <div className="px-4 mt-4">
        {output || loading ? (
          <div className="rounded-3xl border border-gold/30 bg-card overflow-hidden relative">
            {output ? (
              <img src={output} alt="result" className="w-full h-auto block" />
            ) : (
              <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-muted/30">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-xs text-foreground font-cairo text-center px-6 leading-relaxed">
                  {isRtl ? "الخال شغال.. بظبط في الملابس" : "Tailoring your new look..."}
                </p>
                <div className="w-2/3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full gradient-gold animate-pulse" style={{ width: "70%" }} />
                </div>
              </div>
            )}
          </div>
        ) : image ? (
          <div className="rounded-3xl border border-gold/30 bg-card overflow-hidden relative">
            <img src={image} alt="source" className="w-full h-auto block" />
            {analyzing && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
                <p className="text-[11px] font-cairo text-foreground">{isRtl ? "تحليل الوضعية والهيكل العظمي..." : "Detecting pose & skeleton..."}</p>
              </div>
            )}
            {!analyzing && (
              <div className="absolute top-2 end-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur text-[10px] font-cairo text-gold">
                {isRtl ? `وضعية: ${pose}` : `pose: ${pose}`}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/5] rounded-3xl border-2 border-dashed border-gold/40 bg-card flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary-foreground" />
            </div>
            <p className="text-sm font-bold font-cairo text-foreground">{isRtl ? "ارفع صورتك" : "Upload your photo"}</p>
            <p className="text-[11px] text-muted-foreground font-cairo px-8 text-center leading-relaxed">
              {isRtl ? "بنحافظ على وضعيتك بالظبط (وقوف/جلوس)" : "We preserve your exact pose (sit/lean/stand)"}
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
            <a href={output} download="zool-outfitter.png" className="flex-1 py-2.5 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95">
              <Download className="w-3.5 h-3.5" />{isRtl ? "حفظ" : "Save"}
            </a>
          </div>
        )}

        {aiCreditsExhausted && !loading && (
          <div className="mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2.5">
            <p className="text-[12px] font-bold font-cairo text-foreground">
              {isRtl ? "رصيد Lovable AI خلص" : "Lovable AI balance is exhausted"}
            </p>
            <p className="text-[10.5px] text-muted-foreground font-cairo leading-relaxed mt-1">
              {isRtl
                ? "الصفحة شغالة، لكن تعديل الصور يحتاج شحن رصيد Cloud & AI من إعدادات مساحة العمل."
                : "The page is still working, but image editing needs more Cloud & AI balance in workspace settings."}
            </p>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-bold font-cairo text-gold mb-2">{isRtl ? "اختر النوع" : "Outfit Category"}</p>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-2xl p-3 border bg-gradient-to-br ${c.tone} active:scale-95 ${
                category === c.id ? "border-gold ring-2 ring-gold/40" : "border-border/60"
              }`}
            >
              <div className="text-2xl">{c.emoji}</div>
              <p className="text-[11px] font-bold font-cairo text-foreground mt-1">{isRtl ? c.labelAr : c.labelEn}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Variants */}
      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-gold mb-2">{isRtl ? "التفاصيل" : "Details"}</p>
        <div className="flex flex-col gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setVariant(v.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-start active:scale-[0.98] ${
                variant === v.id ? "border-gold bg-gold/10" : "border-border bg-card"
              }`}
            >
              <span className="text-xl">{v.emoji}</span>
              <span className="flex-1 text-[12px] font-bold font-cairo text-foreground">{isRtl ? v.labelAr : v.labelEn}</span>
              {variant === v.id && <Check className="w-4 h-4 text-gold" />}
            </button>
          ))}
        </div>
      </div>

      {/* Accessories */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-bold font-cairo text-gold mb-2 flex items-center gap-1.5">
          <Glasses className="w-3.5 h-3.5" /> {isRtl ? "نظارات" : "Eyewear"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {EYEWEAR.map((e) => (
            <button
              key={e.id}
              onClick={() => setEyewear(e.id)}
              className={`py-2.5 rounded-xl border text-[11px] font-cairo font-bold active:scale-95 ${
                eyewear === e.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
              }`}
            >
              {isRtl ? e.labelAr : e.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-gold mb-2 flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5" /> {isRtl ? "غطاء الرأس" : "Headwear"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {HEADWEAR.map((h) => (
            <button
              key={h.id}
              onClick={() => setHeadwear(h.id)}
              className={`py-2.5 rounded-xl border text-[11px] font-cairo font-bold active:scale-95 ${
                headwear === h.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
              }`}
            >
              {isRtl ? h.labelAr : h.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Mix & Match */}
      <div className="px-4 mt-5">
        <button
          onClick={() => setMixMatch((v) => !v)}
          className={`w-full p-3 rounded-2xl border flex items-center gap-3 active:scale-[0.98] ${
            mixMatch ? "border-gold bg-gold/10" : "border-border bg-card"
          }`}
        >
          <Wand2 className={`w-5 h-5 ${mixMatch ? "text-gold" : "text-muted-foreground"}`} />
          <div className="flex-1 text-start">
            <p className="text-[12px] font-bold font-cairo text-foreground">{isRtl ? "تخصيص القطع" : "Customize Outfit"}</p>
            <p className="text-[10px] text-muted-foreground font-cairo">{isRtl ? "بدّل قطعة محددة فقط" : "Swap one specific piece only"}</p>
          </div>
          <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${mixMatch ? "bg-gold" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-card transition-transform ${mixMatch ? "translate-x-4" : ""}`} />
          </div>
        </button>
        {mixMatch && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[
              { id: "top", labelAr: "العلوي", labelEn: "Top" },
              { id: "bottom", labelAr: "السفلي", labelEn: "Bottom" },
              { id: "outer", labelAr: "خارجي", labelEn: "Outer" },
              { id: "shoes", labelAr: "حذاء", labelEn: "Shoes" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setMixTarget(t.id)}
                className={`py-2 rounded-lg border text-[10.5px] font-cairo font-bold active:scale-95 ${
                  mixTarget === t.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
                }`}
              >
                {isRtl ? t.labelAr : t.labelEn}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-card/95 backdrop-blur-xl border-t border-gold/30" dir={isRtl ? "rtl" : "ltr"}>
        <div className="max-w-md mx-auto px-3 py-3">
          <button
            onClick={triggerRun}
            disabled={loading || !image || analyzing}
            className="w-full py-3.5 rounded-xl gradient-gold text-primary-foreground font-bold font-cairo disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isRtl ? "غيّر اللبس" : "Apply Outfit"}
          </button>
          <p className="text-[10px] text-center text-muted-foreground font-cairo mt-1.5">
            {isRtl
              ? remaining > 0 ? `${remaining} محاولات مجانية متبقية` : "خلصت — شوف إعلان قصير +3"
              : remaining > 0 ? `${remaining} free uses left` : "Out — short ad for +3"}
          </p>
        </div>
      </div>

      <RewardedAdModal open={adOpen} isRtl={isRtl} onClose={() => setAdOpen(false)} onRewarded={onAdRewarded} />
    </div>
  );
};

export default OutfitterStudio;
