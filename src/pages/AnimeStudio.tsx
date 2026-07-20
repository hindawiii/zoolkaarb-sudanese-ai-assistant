import { ArrowLeft, Upload, Download, Loader2, RotateCcw, Share2, Sparkles, Zap, Wind, Flame, Swords, Drama, Check, AlertTriangle, Eye, ShieldCheck, X } from "lucide-react";
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

const BODY_POSES = [
  { id: "auto", labelAr: "تلقائي", labelEn: "Auto" },
  { id: "standing", labelAr: "وقوف", labelEn: "Standing" },
  { id: "half", labelAr: "نصف جسم", labelEn: "Half-body" },
  { id: "sitting", labelAr: "جلوس", labelEn: "Sitting" },
] as const;

const HANDS = [
  { id: "auto", labelAr: "تلقائي", labelEn: "Auto" },
  { id: "left", labelAr: "يسار فقط", labelEn: "Left only" },
  { id: "right", labelAr: "يمين فقط", labelEn: "Right only" },
  { id: "both", labelAr: "الاثنتين", labelEn: "Both" },
  { id: "none", labelAr: "غير واضح", labelEn: "None visible" },
] as const;

type LogEntry = { id: number; kind: "info" | "warn" | "error" | "ok"; text: string; suggestion?: string };

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const isAiCreditsExhausted = (data: unknown) =>
  typeof data === "object" && data !== null && "code" in data && (data as { code?: string }).code === "AI_CREDITS_EXHAUSTED";

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
  const [pendingOutput, setPendingOutput] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [remaining, setRemaining] = useState(getRemaining(TOOL_ID));

  const [style, setStyle] = useState<string>("dbz");
  const [hero, setHero] = useState<string>("");
  const [aura, setAura] = useState<string>("kaio");
  const [hair, setHair] = useState<string>("spiky");
  const [prop, setProp] = useState<string>("none");
  const [bodyPose, setBodyPose] = useState<string>("auto");
  const [visibleHand, setVisibleHand] = useState<string>("auto");
  const [safeMode, setSafeMode] = useState(false);

  const [log, setLog] = useState<LogEntry[]>([]);
  const logId = useRef(0);
  const pushLog = (kind: LogEntry["kind"], text: string, suggestion?: string) => {
    logId.current += 1;
    setLog((l) => [{ id: logId.current, kind, text, suggestion }, ...l].slice(0, 8));
  };

  useEffect(() => { setRemaining(getRemaining(TOOL_ID)); }, []);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast({ title: isRtl ? "صورة غير صالحة" : "Invalid", variant: "destructive" });
    if (file.size > 8 * 1024 * 1024) return toast({ title: isRtl ? "الصورة كبيرة (max 8MB)" : "Too large", variant: "destructive" });
    const b64 = await fileToBase64(file);
    setImage(b64); setOutput(null); setPendingOutput(null); setLog([]);
    setAnalyzing(true);
    const meta = await preprocess(b64);
    setAnalyzing(false);
    if (!meta.face) pushLog("warn", isRtl ? "ما لقينا وجه واضح — جرب صورة أوضح." : "No clear face detected — try a clearer photo.");
  };

  const generate = async () => {
    if (!image) return;
    setLoading(true); setPendingOutput(null);
    pushLog("info", isRtl ? "الخال شغال.. برسم في الهالة القتالية" : "Rendering the battle aura...");
    try {
      const { data, error } = await supabase.functions.invoke("photo-edit", {
        body: {
          imageBase64: image,
          action: "anime-studio",
          anime: {
            style, hero: hero || undefined, aura, hair, prop,
            bodyPose: bodyPose === "auto" ? undefined : bodyPose,
            visibleHand: visibleHand === "auto" ? undefined : visibleHand,
            safeMode,
          },
        },
      });
      if (error) throw error;
      if (isAiCreditsExhausted(data)) {
        pushLog("error", isRtl ? "رصيد الذكاء الاصطناعي خلص." : "AI balance exhausted.");
        toast({ title: isRtl ? "رصيد الذكاء الاصطناعي خلص" : "AI balance exhausted", variant: "destructive" });
        return;
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error("No image returned");

      // Safety check
      setVerifying(true);
      const { data: v } = await supabase.functions.invoke("photo-edit", {
        body: { imageBase64: data.imageUrl, action: "verify-anime-anatomy" },
      });
      setVerifying(false);

      const watermarked = await addZoolWatermark(data.imageUrl);
      if (v && v.ok === false) {
        const issues: string[] = Array.isArray(v.issues) ? v.issues : [];
        const suggest = v.suggestedProp && v.suggestedProp !== prop
          ? (isRtl ? `جرّب المهارة "${PROPS.find(x => x.id === v.suggestedProp)?.labelAr ?? v.suggestedProp}" أو فعّل الوضع البديل` : `Try prop "${v.suggestedProp}" or enable Safe Mode`)
          : (isRtl ? "فعّل الوضع البديل (طاقة معلّقة) أو حدّد اليد الظاهرة يدويًا" : "Enable Safe Mode or set the visible hand manually");
        pushLog("error", isRtl ? `فحص السلامة رصد مشكلة: ${issues.join(" • ") || "تشوّه تشريحي"}` : `Safety check found: ${issues.join(" • ") || "anatomy issue"}`, suggest);
        setPendingOutput(watermarked); // still show it, but require review
        toast({ title: isRtl ? "لازم مراجعة" : "Review needed", description: isRtl ? "الفحص الآلي رصد ملاحظات — راجع المعاينة" : "Auto-check flagged issues — review preview", variant: "destructive" });
      } else {
        pushLog("ok", isRtl ? "الفحص التشريحي: نظيف ✓" : "Anatomy check: clean ✓");
        setPendingOutput(watermarked);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      pushLog("error", msg);
      toast({ title: isRtl ? "ما زبط" : "Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const triggerRun = () => {
    if (loading || !image) return toast({ title: isRtl ? "ارفع صورة الأول" : "Upload first", variant: "destructive" });
    if (remaining <= 0) { setAdOpen(true); return; }
    generate();
  };

  const onAdRewarded = () => {
    const r = grantAdReward(TOOL_ID);
    setRemaining(r);
    setTimeout(generate, 100);
  };

  const acceptPreview = () => {
    if (!pendingOutput) return;
    setOutput(pendingOutput);
    setPendingOutput(null);
    const next = consumeUse(TOOL_ID);
    setRemaining(next);
    pushLog("ok", isRtl ? "تم الحفظ — انقص من الرصيد" : "Saved — credit consumed");
  };

  const rejectPreview = () => {
    setPendingOutput(null);
    pushLog("info", isRtl ? "تم رفض المعاينة — ما انخصم رصيد" : "Preview rejected — no credit consumed");
  };

  const applySuggestion = (suggestedProp?: string) => {
    if (suggestedProp) setProp(suggestedProp);
    setSafeMode(true);
    setPendingOutput(null);
    pushLog("info", isRtl ? "طبّقنا الاقتراح — اضغط توليد من جديد" : "Suggestion applied — regenerate now");
  };

  const shareOutput = async () => {
    if (!output) return;
    try {
      const blob = await (await fetch(output)).blob();
      const file = new File([blob], "madar-anime.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) await navigator.share({ files: [file], title: "Madar Anime Studio" });
      else { const a = document.createElement("a"); a.href = output; a.download = "madar-anime.png"; a.click(); }
    } catch { /* ignore */ }
  };

  const reset = () => { setImage(null); setOutput(null); setPendingOutput(null); setLog([]); };

  const pickHero = (h: typeof HEROES[number]) => {
    setHero(h.id); setStyle(h.style);
    if (h.id === "goku") setHair("spiky");
    if (h.id === "naruto" || h.id === "luffy") setHair("keep");
  };

  const previewShown = pendingOutput && !output;

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

      {/* Preview / output */}
      <div className="px-4 mt-4">
        {output ? (
          <div className="rounded-3xl border border-border bg-card overflow-hidden relative">
            <img src={output} alt="anime result" className="w-full h-auto block" />
          </div>
        ) : previewShown ? (
          <div className="rounded-3xl border-2 border-gold bg-card overflow-hidden relative">
            <img src={pendingOutput!} alt="preview" className="w-full h-auto block" />
            <div className="absolute top-2 start-2 px-2 py-1 rounded-full bg-gold/95 backdrop-blur text-[10px] font-bold font-cairo text-primary-foreground flex items-center gap-1">
              <Eye className="w-3 h-3" /> {isRtl ? "معاينة قبل الحفظ" : "Preview before saving"}
            </div>
          </div>
        ) : loading || verifying ? (
          <div className="rounded-3xl border border-border bg-card overflow-hidden aspect-square flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
            <p className="text-xs text-foreground font-cairo text-center px-6 leading-relaxed">
              {verifying
                ? (isRtl ? "الخال بيتأكد.. فحص السلامة التشريحية" : "Running anatomy safety check...")
                : (isRtl ? "الخال شغال.. برسم في الهالة القتالية" : "Drawing the battle aura...")}
            </p>
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

        {/* Preview accept/reject */}
        {previewShown && (
          <div className="flex gap-2 mt-3">
            <button onClick={rejectPreview} className="flex-1 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground active:scale-95 flex items-center justify-center gap-1.5">
              <X className="w-3.5 h-3.5" />{isRtl ? "رفض" : "Reject"}
            </button>
            <button onClick={generate} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold active:scale-95 flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />{isRtl ? "أعِد التوليد" : "Regenerate"}
            </button>
            <button onClick={acceptPreview} className="flex-1 py-2.5 rounded-xl gradient-gold text-primary-foreground text-xs font-bold active:scale-95 flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" />{isRtl ? "قبول وحفظ" : "Accept"}
            </button>
          </div>
        )}

        {output && (
          <div className="flex gap-2 mt-3">
            <button onClick={reset} className="flex-1 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground active:scale-95 flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />{isRtl ? "من جديد" : "Reset"}
            </button>
            <button onClick={shareOutput} className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold active:scale-95 flex items-center justify-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />{isRtl ? "مشاركة" : "Share"}
            </button>
            <a href={output} download="madar-anime.png" className="flex-1 py-2.5 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95">
              <Download className="w-3.5 h-3.5" />{isRtl ? "حفظ" : "Save"}
            </a>
          </div>
        )}
      </div>

      {/* Error / activity log */}
      {log.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "سجل الأحداث والأخطاء" : "Event & error log"}</p>
          <div className="rounded-2xl border border-border bg-card/60 divide-y divide-border max-h-60 overflow-auto">
            {log.map((e) => {
              const color = e.kind === "error" ? "text-destructive" : e.kind === "warn" ? "text-amber-500" : e.kind === "ok" ? "text-emerald-500" : "text-muted-foreground";
              const Icon = e.kind === "error" || e.kind === "warn" ? AlertTriangle : e.kind === "ok" ? ShieldCheck : Sparkles;
              return (
                <div key={e.id} className="p-2.5 flex items-start gap-2">
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-cairo text-foreground leading-relaxed">{e.text}</p>
                    {e.suggestion && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="text-[10px] font-cairo text-muted-foreground flex-1">{e.suggestion}</p>
                        <button onClick={() => applySuggestion(undefined)} className="text-[10px] font-cairo font-bold text-gold underline whitespace-nowrap">
                          {isRtl ? "طبّق البديل" : "Apply"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Body pose */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "وضعية الجسم" : "Body pose"}</p>
        <div className="grid grid-cols-4 gap-2">
          {BODY_POSES.map((b) => (
            <button key={b.id} onClick={() => setBodyPose(b.id)}
              className={`py-2.5 rounded-xl border text-[11px] font-cairo font-bold active:scale-95 ${
                bodyPose === b.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
              }`}>
              {isRtl ? b.labelAr : b.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Visible hand */}
      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-1">{isRtl ? "اليد الظاهرة" : "Visible hand"}</p>
        <p className="text-[10px] text-muted-foreground/80 font-cairo mb-2 leading-relaxed">
          {isRtl ? "حدد يدك الظاهرة يدويًا لو الصورة مش واضحة — يمنع اليد الثالثة." : "Set manually if unclear in the photo — prevents third arm artifacts."}
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {HANDS.map((h) => (
            <button key={h.id} onClick={() => setVisibleHand(h.id)}
              className={`py-2 rounded-lg border text-[10px] font-cairo font-bold active:scale-95 ${
                visibleHand === h.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
              }`}>
              {isRtl ? h.labelAr : h.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Safe mode */}
      <div className="px-4 mt-4">
        <button onClick={() => setSafeMode((v) => !v)}
          className={`w-full p-3 rounded-2xl border flex items-center gap-3 active:scale-[0.98] ${
            safeMode ? "border-gold bg-gold/10" : "border-border bg-card"
          }`}>
          <ShieldCheck className={`w-5 h-5 ${safeMode ? "text-gold" : "text-muted-foreground"}`} />
          <div className="flex-1 text-start">
            <p className="text-[12px] font-bold font-cairo text-foreground">{isRtl ? "الوضع البديل الآمن" : "Safe Fallback Mode"}</p>
            <p className="text-[10px] text-muted-foreground font-cairo">{isRtl ? "السلاح يظهر كطاقة معلّقة — بدون تعديل اليدين" : "Prop always renders as floating energy — no hand manipulation"}</p>
          </div>
          <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${safeMode ? "bg-gold" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-card transition-transform ${safeMode ? "translate-x-4" : ""}`} />
          </div>
        </button>
      </div>

      {/* Style Hub */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "اختر عالم الأنمي" : "Anime Universe"}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {STYLES.map((s) => (
            <button key={s.id} onClick={() => { setStyle(s.id); setHero(""); }}
              className={`min-w-[120px] rounded-2xl p-3 border text-start active:scale-95 ${
                style === s.id ? "border-gold bg-gold/10" : "border-border bg-card"
              }`}>
              <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${s.color} mb-2`} />
              <p className="text-[11px] font-bold font-cairo text-foreground leading-tight">{isRtl ? s.labelAr : s.labelEn}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "التحول لبطل محدد" : "Transform to Specific Hero"}</p>
        <div className="grid grid-cols-3 gap-2">
          {HEROES.map((h) => (
            <button key={h.id} onClick={() => pickHero(h)}
              className={`py-3 rounded-xl border text-[11px] font-cairo font-bold active:scale-95 ${
                hero === h.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
              }`}>
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

      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "الهالة القتالية" : "Power Aura"}</p>
        <div className="grid grid-cols-4 gap-2">
          {AURAS.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.id} onClick={() => setAura(a.id)}
                className={`py-2.5 rounded-xl border flex flex-col items-center gap-1 active:scale-95 ${
                  aura === a.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
                }`}>
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-cairo font-bold">{isRtl ? a.labelAr : a.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">{isRtl ? "الشعر" : "Hair"}</p>
        <div className="grid grid-cols-3 gap-2">
          {HAIRS.map((h) => (
            <button key={h.id} onClick={() => setHair(h.id)}
              className={`py-2.5 rounded-xl border text-[11px] font-cairo font-bold active:scale-95 ${
                hair === h.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
              }`}>
              {isRtl ? h.labelAr : h.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-1">{isRtl ? "السلاح / الأداة" : "Prop in Hand"}</p>
        <p className="text-[10px] text-muted-foreground/80 font-cairo mb-2 leading-relaxed">
          {isRtl
            ? "الخال بيتأقلم مع وضعيتك: بيستخدم يدك الظاهرة لحمل السلاح. لو يديك مش باينة، السلاح بيطلع كطاقة طايرة جنبك — من غير يد ثالثة."
            : "Al-Khal adapts to your pose. If no hand is free, the prop becomes floating energy — never a third hand."}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {PROPS.map((p) => {
            const Icon = p.icon;
            return (
              <button key={p.id} onClick={() => setProp(p.id)}
                className={`py-2.5 rounded-xl border flex flex-col items-center gap-1 active:scale-95 ${
                  prop === p.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-card border-border text-foreground"
                }`}>
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
            disabled={loading || verifying || !image || analyzing || !!previewShown}
            className="w-full py-3.5 rounded-xl gradient-gold text-primary-foreground font-bold font-cairo disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
          >
            {loading || verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {previewShown
              ? (isRtl ? "راجع المعاينة أعلاه" : "Review preview above")
              : (isRtl ? "حوّل الفزعة" : "Transform")}
          </button>
          <p className="text-[10px] text-center text-muted-foreground font-cairo mt-1.5">
            {isRtl
              ? remaining > 0 ? `${remaining} محاولات مجانية — يخصم فقط بعد "قبول وحفظ"` : "خلصت — شوف إعلان قصير +5"
              : remaining > 0 ? `${remaining} free uses — charged only on Accept` : "Out — short ad for +5"}
          </p>
        </div>
      </div>

      <RewardedAdModal open={adOpen} isRtl={isRtl} onClose={() => setAdOpen(false)} onRewarded={onAdRewarded} />
    </div>
  );
};

export default AnimeStudio;
