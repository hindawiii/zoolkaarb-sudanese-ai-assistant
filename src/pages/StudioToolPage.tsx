import { ArrowLeft, Upload, Download, Loader2, RotateCcw, Plus, X, Share2, Swords, Flame, Zap } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/store/userStore";
import { STUDIO_TOOLS } from "@/lib/studioTools";
import { consumeUse, getRemaining, grantAdReward, type StudioToolId } from "@/lib/studioQuota";
import { addZoolWatermark } from "@/lib/watermark";
import RewardedAdModal from "@/components/studio/RewardedAdModal";
import QuotaBadge from "@/components/studio/QuotaBadge";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const VS_ICONS = [
  { id: "vs", labelAr: "VS", labelEn: "VS", render: () => <span className="font-extrabold text-primary-foreground text-xl tracking-tight">VS</span> },
  { id: "bolt", labelAr: "صاعقة", labelEn: "Bolt", render: () => <Zap className="w-6 h-6 text-primary-foreground" /> },
  { id: "fire", labelAr: "نار", labelEn: "Fire", render: () => <Flame className="w-6 h-6 text-primary-foreground" /> },
  { id: "swords", labelAr: "سيوف", labelEn: "Swords", render: () => <Swords className="w-6 h-6 text-primary-foreground" /> },
] as const;

const isAiCreditsExhausted = (data: unknown) =>
  typeof data === "object" && data !== null && "code" in data && data.code === "AI_CREDITS_EXHAUSTED";

const StudioToolPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { language } = useUser();
  const isRtl = language === "ar";
  const tool = useMemo(() => STUDIO_TOOLS.find((t) => t.slug === slug), [slug]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [pendingRun, setPendingRun] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(tool ? getRemaining(tool.id as StudioToolId) : 0);
  const [vsIcon, setVsIcon] = useState<(typeof VS_ICONS)[number]["id"]>("vs");
  const [livingPlaying, setLivingPlaying] = useState(false);

  useEffect(() => {
    if (tool) setRemaining(getRemaining(tool.id as StudioToolId));
  }, [tool]);

  if (!tool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={isRtl ? "rtl" : "ltr"}>
        <div className="text-center">
          <p className="font-cairo text-foreground">{isRtl ? "أداة غير موجودة" : "Tool not found"}</p>
          <button onClick={() => navigate("/studio")} className="mt-3 px-4 py-2 rounded-xl gradient-gold text-primary-foreground font-cairo">
            {isRtl ? "رجوع للاستوديو" : "Back to Studio"}
          </button>
        </div>
      </div>
    );
  }

  const requiredCount = tool.mode === "single-edit" || tool.mode === "living-image" ? 1 : tool.mode === "multi-edit" ? 2 : 2;
  const maxImages = tool.mode === "multi-edit" ? 4 : tool.mode === "single-edit" || tool.mode === "living-image" ? 1 : 2;
  const slotLabels = tool.mode === "dual-edit"
    ? isRtl ? ["1. صورة الجسم/الخلفية", "2. صورة الوجه"] : ["1. Body / scene", "2. Face source"]
    : tool.mode === "vs-arena"
      ? isRtl ? ["المتنافس 1", "المتنافس 2"] : ["Fighter 1", "Fighter 2"]
      : [];

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid", description: "Please select an image.", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 8MB.", variant: "destructive" });
      return;
    }
    const b64 = await fileToBase64(file);
    setImages((prev) => {
      if (prev.length >= maxImages) return [...prev.slice(1), b64];
      return [...prev, b64];
    });
    setOutput(null);
  };

  const removeAt = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const reallyRun = async (action: string) => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { action };
      if (images.length === 1) body.imageBase64 = images[0];
      else body.images = images;

      const { data, error } = await supabase.functions.invoke("photo-edit", { body });
      if (error) throw error;
      if (isAiCreditsExhausted(data)) {
        toast({
          title: isRtl ? "رصيد الذكاء الاصطناعي خلص" : "AI balance exhausted",
          description: isRtl
            ? "الصفحة شغالة، لكن تعديل الصور يحتاج شحن رصيد Cloud & AI من إعدادات مساحة العمل."
            : "The page is still working, but image editing needs more Cloud & AI balance in workspace settings.",
          variant: "destructive",
        });
        return;
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error("No image returned");

      const watermarked = await addZoolWatermark(data.imageUrl);
      setOutput(watermarked);

      // consume quota AFTER success
      const next = consumeUse(tool.id as StudioToolId);
      setRemaining(next);

      toast({
        title: isRtl ? "تمام يا هندسة!" : "Done!",
        description: isRtl ? "الفزعة جاهزة" : "Result is ready",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: isRtl ? "ما زبط" : "Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const triggerRun = async (action: string) => {
    if (loading) return;
    if (images.length < requiredCount) {
      toast({
        title: isRtl ? "ناقصة صور" : "Need more images",
        description: isRtl ? `حمّل ${requiredCount} صور أولاً` : `Upload ${requiredCount} images first`,
        variant: "destructive",
      });
      return;
    }
    if (tool.metered && remaining <= 0) {
      setPendingRun(action);
      setAdOpen(true);
      return;
    }
    await reallyRun(action);
  };

  // Living image: client-only Ken Burns "fake animation" preview (Phase 1).
  const triggerLivingImage = async () => {
    if (loading) return;
    if (images.length < 1) {
      toast({ title: isRtl ? "ناقصة صورة" : "Need an image", description: isRtl ? "حمّل صورة أولاً" : "Upload an image first", variant: "destructive" });
      return;
    }
    if (tool.metered && remaining <= 0) {
      setPendingRun("__living__");
      setAdOpen(true);
      return;
    }
    setLoading(true);
    // simulate processing
    await new Promise((r) => setTimeout(r, 1400));
    const watermarked = await addZoolWatermark(images[0]);
    setOutput(watermarked);
    setLivingPlaying(true);
    const next = consumeUse(tool.id as StudioToolId);
    setRemaining(next);
    setLoading(false);
    toast({ title: isRtl ? "بدأ الرقص!" : "Dancing!", description: isRtl ? "صورتك حية الحين" : "Your photo is alive" });
  };

  const onAdRewarded = () => {
    if (!tool) return;
    const r = grantAdReward(tool.id as StudioToolId);
    setRemaining(r);
    if (pendingRun === "__living__") {
      setPendingRun(null);
      setTimeout(() => triggerLivingImage(), 100);
    } else if (pendingRun) {
      const action = pendingRun;
      setPendingRun(null);
      setTimeout(() => reallyRun(action), 100);
    }
  };

  const shareOutput = async () => {
    if (!output) return;
    try {
      const blob = await (await fetch(output)).blob();
      const file = new File([blob], "zool-studio.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Zool Karb Studio" });
      } else {
        const a = document.createElement("a");
        a.href = output;
        a.download = "zool-studio.png";
        a.click();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const reset = () => {
    setImages([]);
    setOutput(null);
    setLivingPlaying(false);
  };

  const Icon = tool.icon;
  const showVsBadge = tool.mode === "vs-arena" && !!output;
  const currentVs = VS_ICONS.find((v) => v.id === vsIcon)!;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-28" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/studio")} className="p-1.5 rounded-xl hover:bg-muted" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold font-cairo text-foreground truncate">{isRtl ? tool.labelAr : tool.labelEn}</h1>
          <p className="text-[10px] text-muted-foreground font-cairo truncate">{isRtl ? tool.taglineAr : tool.taglineEn}</p>
        </div>
        <QuotaBadge remaining={remaining} isRtl={isRtl} />
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />

      {/* Image slots */}
      <div className="px-4 mt-4">
        <div className={`grid gap-2 ${maxImages > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {Array.from({ length: maxImages }).map((_, i) => {
            const img = images[i];
            return (
              <div key={i} className="relative">
                {img ? (
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-card">
                    <img src={img} alt={`slot ${i}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeAt(i)}
                      className="absolute top-1.5 end-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                      aria-label="remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {slotLabels[i] && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-[10px] text-white font-cairo font-bold">{slotLabels[i]}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-square rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Plus className="w-6 h-6 text-muted-foreground" />
                    <p className="text-[10.5px] text-muted-foreground font-cairo text-center px-2">
                      {slotLabels[i] || (isRtl ? "ارفع صورة" : "Upload")}
                    </p>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Output preview */}
      {(output || loading) && (
        <div className="px-4 mt-4">
          <div className="rounded-3xl border border-border bg-card overflow-hidden relative">
            {output ? (
              <div className="relative">
                <img
                  src={output}
                  alt="result"
                  className={`w-full h-auto block ${livingPlaying ? "animate-living" : ""}`}
                />
                {showVsBadge && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center shadow-2xl border-4 border-card relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6),transparent_60%)]" />
                      <div className="relative">{currentVs.render()}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-muted/30">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-xs text-foreground font-cairo text-center px-6 leading-relaxed">
                  {isRtl ? tool.workingMessageAr : tool.workingMessageEn}
                </p>
              </div>
            )}
          </div>

          {/* VS icon picker */}
          {showVsBadge && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {VS_ICONS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVsIcon(v.id)}
                  className={`min-w-[68px] py-2 rounded-xl border text-[10.5px] font-cairo flex flex-col items-center gap-1 active:scale-95 ${
                    vsIcon === v.id ? "gradient-gold border-transparent text-primary-foreground" : "bg-card border-border text-foreground"
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {v.id === "vs" ? <span className="font-extrabold text-sm">VS</span> : v.render()}
                  </div>
                  <span>{isRtl ? v.labelAr : v.labelEn}</span>
                </button>
              ))}
            </div>
          )}

          {output && (
            <div className="flex gap-2 mt-3">
              <button onClick={reset} className="flex-1 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground active:scale-95 flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                {isRtl ? "من جديد" : "Reset"}
              </button>
              <button onClick={shareOutput} className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold active:scale-95 flex items-center justify-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                {isRtl ? "مشاركة" : "Share"}
              </button>
              <a
                href={output}
                download="zool-studio.png"
                className="flex-1 py-2.5 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                {isRtl ? "حفظ" : "Save"}
              </a>
            </div>
          )}
        </div>
      )}

      {!output && images.length === 0 && (
        <div className="px-4 mt-6">
          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-[12px] text-muted-foreground font-cairo leading-relaxed">
              {isRtl
                ? "ارفع صورتك من فوق عشان نبدأ. كل أداة فيها 3 محاولات مجانية، وبعدها إعلان قصير وتواصل."
                : "Upload your photo above to start. 3 free uses per tool, then a short ad to continue."}
            </p>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-card/95 backdrop-blur-xl border-t border-border" dir={isRtl ? "rtl" : "ltr"}>
        <div className="max-w-md mx-auto px-3 py-3">
          {tool.variants ? (
            <div className="flex gap-2 overflow-x-auto">
              {tool.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => triggerRun(v.action)}
                  disabled={loading || images.length < requiredCount}
                  className="flex-1 min-w-[100px] py-3 rounded-xl gradient-gold text-primary-foreground text-xs font-bold font-cairo disabled:opacity-50 active:scale-95"
                >
                  {isRtl ? v.labelAr : v.labelEn}
                </button>
              ))}
            </div>
          ) : tool.mode === "living-image" ? (
            <button
              onClick={triggerLivingImage}
              disabled={loading || images.length < 1}
              className="w-full py-3.5 rounded-xl gradient-gold text-primary-foreground font-bold font-cairo disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isRtl ? "خلي الصورة ترقص" : "Bring it to life"}
            </button>
          ) : (
            <button
              onClick={() => triggerRun(tool.action || "")}
              disabled={loading || images.length < requiredCount}
              className="w-full py-3.5 rounded-xl gradient-gold text-primary-foreground font-bold font-cairo disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isRtl ? "يلا الفزعة" : "Generate"}
            </button>
          )}
          <p className="text-[10px] text-center text-muted-foreground font-cairo mt-1.5">
            {isRtl
              ? remaining > 0
                ? `${remaining} محاولات مجانية متبقية`
                : "خلصت المحاولات — إعلان قصير +3"
              : remaining > 0
                ? `${remaining} free uses left`
                : "Out of uses — short ad for +3"}
          </p>
        </div>
      </div>

      <RewardedAdModal
        open={adOpen}
        isRtl={isRtl}
        onClose={() => {
          setAdOpen(false);
          setPendingRun(null);
        }}
        onRewarded={onAdRewarded}
      />

      <style>{`
        @keyframes living-kenburns {
          0% { transform: scale(1) translate(0,0); }
          50% { transform: scale(1.06) translate(-1.5%, 1%); }
          100% { transform: scale(1) translate(0,0); }
        }
        .animate-living { animation: living-kenburns 4s ease-in-out infinite; transform-origin: center; }
      `}</style>
    </div>
  );
};

export default StudioToolPage;
