import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Type,
  Lock,
  Wand2,
  Frame as FrameIcon,
  Plus,
  Trash2,
  Copy,
  RotateCw,
  Layers,
  ArrowUp,
  ArrowDown,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Bold,
  Scissors,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toJpeg } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  consumePremiumUse,
  getPremiumRemaining,
} from "@/lib/premiumQuota";
import RewardedAdModal from "@/components/studio/RewardedAdModal";
import StudioProgress from "@/components/audio/StudioProgress";

const TEMPLATE_META: Record<string, { titleAr: string; defaultText: string; gradient: string }> = {
  friday: { titleAr: "أدعية الجمعة", defaultText: "جمعة مباركة", gradient: "from-gold/40 via-sand to-gold/20" },
  morning: { titleAr: "أذكار الصباح", defaultText: "صباح الخير\nحبابك عشرة", gradient: "from-nile/40 via-sand to-nile/20" },
  evening: { titleAr: "أذكار المساء", defaultText: "مساء النور\nمساء الفل", gradient: "from-earth/40 via-sand to-earth/20" },
  whatsapp: { titleAr: "حالات واتساب", defaultText: "أبشر يا غالي", gradient: "from-sand-dark/40 via-sand to-gold/20" },
  wedding: { titleAr: "بطاقات أعراس", defaultText: "مبروك العرس\nألف مبروك", gradient: "from-gold/50 via-sand to-gold/30" },
  custom: { titleAr: "قالب مخصص", defaultText: "اكتب رسالتك هنا", gradient: "from-nile/30 via-sand to-gold/30" },
};

type FontDef = { id: string; labelAr: string; className: string; premium: boolean; preview: string };

const FONTS: FontDef[] = [
  { id: "tajawal", labelAr: "تجوّل", className: "font-cairo", premium: false, preview: "أبجد" },
  { id: "cairo", labelAr: "Cairo", className: "font-cairo-display", premium: false, preview: "أبجد" },
  { id: "amiri", labelAr: "أميري", className: "font-amiri", premium: false, preview: "أبجد" },
  { id: "mohanad", labelAr: "المهند", className: "font-mohanad", premium: false, preview: "أبجد" },
  { id: "lateef", labelAr: "لطيف", className: "font-lateef", premium: false, preview: "أبجد" },
  { id: "almarai", labelAr: "المرعي", className: "font-almarai", premium: false, preview: "أبجد" },
  { id: "changa", labelAr: "تشانغا", className: "font-changa", premium: true, preview: "أبجد" },
  { id: "lemonada", labelAr: "ليموناضة", className: "font-lemonada", premium: true, preview: "أبجد" },
  { id: "reem-kufi", labelAr: "ريم كوفي", className: "font-reem-kufi", premium: true, preview: "أبجد" },
  { id: "aref-ruqaa", labelAr: "رقعة", className: "font-aref-ruqaa", premium: true, preview: "أبجد" },
  { id: "blaka", labelAr: "بلاكا", className: "font-blaka", premium: true, preview: "أبجد" },
  { id: "blaka-ink", labelAr: "بلاكا حبر", className: "font-blaka-ink", premium: true, preview: "أبجد" },
  { id: "rakkas", labelAr: "ركاز", className: "font-rakkas", premium: true, preview: "أبجد" },
  { id: "jomhuria", labelAr: "جمهورية", className: "font-jomhuria", premium: true, preview: "أبجد" },
  { id: "marhey", labelAr: "مرحي", className: "font-marhey", premium: true, preview: "أبجد" },
  { id: "kufam", labelAr: "كوفام", className: "font-kufam", premium: true, preview: "أبجد" },
  { id: "scheherazade", labelAr: "شهرزاد", className: "font-scheherazade", premium: true, preview: "أبجد" },
  { id: "noto-nastaliq", labelAr: "نستعليق", className: "font-nastaliq", premium: true, preview: "أبجد" },
];

type ColorDef = { id: string; labelAr: string; className: string; premium: boolean; swatch: string };

const COLORS: ColorDef[] = [
  { id: "white", labelAr: "أبيض", className: "text-white", premium: false, swatch: "#FFFFFF" },
  { id: "black", labelAr: "أسود", className: "text-black", premium: false, swatch: "#111111" },
  { id: "cream", labelAr: "كريمي", className: "text-[#F5E6C8]", premium: false, swatch: "#F5E6C8" },
  { id: "nile", labelAr: "نيلي", className: "text-nile", premium: false, swatch: "hsl(150 30% 45%)" },
  { id: "gold", labelAr: "ذهبي", className: "text-gradient-gold", premium: false, swatch: "linear-gradient(135deg,#FFD86B,#C4944A,#8B5E1A)" },
  { id: "royal-gold", labelAr: "ذهبي ملكي", className: "text-royal-gold", premium: true, swatch: "linear-gradient(135deg,#FFE066,#D4AF37,#8B6914)" },
  { id: "emerald", labelAr: "زمردي", className: "text-emerald-rich", premium: true, swatch: "#047857" },
  { id: "neon", labelAr: "نيون", className: "text-neon-gradient", premium: true, swatch: "linear-gradient(135deg,#FF00C8,#00F0FF,#B400FF)" },
  { id: "bronze", labelAr: "برونزي", className: "text-gradient-bronze", premium: true, swatch: "linear-gradient(135deg,#E6A472,#B06A2E,#5C3210)" },
  { id: "silver", labelAr: "فضي", className: "text-gradient-silver", premium: true, swatch: "linear-gradient(135deg,#F4F4F4,#BFBFBF,#6E6E6E)" },
];

type EffectId = "none" | "shadow" | "drop" | "glow" | "neon" | "glass" | "strip" | "outline";
type EffectDef = { id: EffectId; labelAr: string; premium: boolean };

const EFFECTS: EffectDef[] = [
  { id: "none", labelAr: "بدون", premium: false },
  { id: "shadow", labelAr: "ظل", premium: false },
  { id: "drop", labelAr: "Drop Shadow", premium: false },
  { id: "outline", labelAr: "حدود", premium: false },
  { id: "glow", labelAr: "توهج", premium: true },
  { id: "neon", labelAr: "نيون", premium: true },
  { id: "glass", labelAr: "زجاجي", premium: true },
  { id: "strip", labelAr: "شريط", premium: true },
];

type FrameId = "none" | "polaroid" | "circular" | "geometric";
const FRAMES: { id: FrameId; labelAr: string; premium: boolean }[] = [
  { id: "none", labelAr: "بدون", premium: false },
  { id: "polaroid", labelAr: "بولارويد", premium: false },
  { id: "circular", labelAr: "دائري", premium: true },
  { id: "geometric", labelAr: "هندسي", premium: true },
];

type SplitId = "off" | "bw-gold" | "bw-emerald" | "bw-neon";
const SPLITS: { id: SplitId; labelAr: string; premium: boolean }[] = [
  { id: "off", labelAr: "بدون", premium: false },
  { id: "bw-gold", labelAr: "ذهبي/أبيض وأسود", premium: true },
  { id: "bw-emerald", labelAr: "زمردي/أبيض وأسود", premium: true },
  { id: "bw-neon", labelAr: "نيون/أبيض وأسود", premium: true },
];

type Align = "right" | "center" | "left";

interface WordStyle {
  fontId?: string;
  colorId?: string;
  effect?: EffectId;
  scale?: number;
}

interface TextLayer {
  id: string;
  text: string;
  fontId: string;
  colorId: string;
  effect: EffectId;
  size: number; // % of canvas width
  rotation: number;
  x: number; // % center
  y: number; // % center
  behind: boolean;
  weight: number;
  letterSpacing: number;
  lineHeight: number;
  opacity: number;
  align: Align;
  curve: number;
  wordStyles: Record<number, WordStyle>;
}

let uid = 0;
const newLayer = (text: string): TextLayer => ({
  id: `t${Date.now()}-${uid++}`,
  text,
  fontId: "tajawal",
  colorId: "white",
  effect: "shadow",
  size: 11,
  rotation: 0,
  x: 50,
  y: 50,
  behind: false,
  weight: 700,
  letterSpacing: 0,
  lineHeight: 1.25,
  opacity: 1,
  align: "center",
  curve: 0,
  wordStyles: {},
});


type ToolId = "size" | "rotation" | "letterSpacing" | "lineHeight" | "opacity" | "weight" | "align";

const TOOLS: { id: ToolId; labelAr: string; icon: typeof Type; min: number; max: number; step: number }[] = [
  { id: "size", labelAr: "الحجم", icon: Maximize2, min: 3, max: 48, step: 0.5 },
  { id: "rotation", labelAr: "التدوير", icon: RotateCw, min: -180, max: 180, step: 1 },
  { id: "letterSpacing", labelAr: "تباعد الحروف", icon: MoveHorizontal, min: -0.1, max: 0.6, step: 0.01 },
  { id: "lineHeight", labelAr: "تباعد الأسطر", icon: MoveVertical, min: 0.8, max: 2.5, step: 0.05 },
  { id: "opacity", labelAr: "الشفافية", icon: Droplet, min: 0.1, max: 1, step: 0.05 },
  { id: "weight", labelAr: "السماكة", icon: Bold, min: 200, max: 900, step: 100 },
  { id: "align", labelAr: "المحاذاة", icon: AlignCenter, min: 0, max: 0, step: 1 },
];


const TemplateEditor = () => {
  const navigate = useNavigate();
  const { id = "custom" } = useParams();
  const meta = TEMPLATE_META[id] ?? TEMPLATE_META.custom;

  const [layers, setLayers] = useState<TextLayer[]>([{ ...newLayer(meta.defaultText) }]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [removingBg, setRemovingBg] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [frame, setFrame] = useState<FrameId>("none");
  const [split, setSplit] = useState<SplitId>("off");

  const [premiumRemaining, setPremiumRemaining] = useState<number>(getPremiumRemaining());
  const [adOpen, setAdOpen] = useState(false);
  const pendingApply = useRef<(() => void) | null>(null);

  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; mode: "move" | "scale"; startX: number; startY: number; base: TextLayer; rect: DOMRect } | null>(null);

  useEffect(() => {
    setPremiumRemaining(getPremiumRemaining());
    setSelectedId((s) => s || layers[0]?.id || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = layers.find((l) => l.id === selectedId) ?? layers[0];

  const patch = (p: Partial<TextLayer>, lid = selected?.id) =>
    setLayers((ls) => ls.map((l) => (l.id === lid ? { ...l, ...p } : l)));

  const tryPremium = (apply: () => void) => {
    if (premiumRemaining > 0) {
      setPremiumRemaining(consumePremiumUse());
      apply();
      return;
    }
    pendingApply.current = apply;
    setAdOpen(true);
    toast({
      title: "يا هندسة، خلصت تجاربك المجانية",
      description: "أحضر إعلان سريع وعشّم الخال عشان نواصل الفزعة!",
    });
  };

  const onPickFont = (f: FontDef) => (f.premium ? tryPremium(() => patch({ fontId: f.id })) : patch({ fontId: f.id }));
  const onPickColor = (c: ColorDef) => (c.premium ? tryPremium(() => patch({ colorId: c.id })) : patch({ colorId: c.id }));
  const onPickEffect = (e: EffectDef) => (e.premium ? tryPremium(() => patch({ effect: e.id })) : patch({ effect: e.id }));

  const addLayer = () => {
    const l = newLayer("نص جديد");
    l.y = 30 + Math.random() * 40;
    setLayers((ls) => [...ls, l]);
    setSelectedId(l.id);
  };
  const duplicateLayer = () => {
    if (!selected) return;
    const l = { ...selected, id: `t${Date.now()}-${uid++}`, y: Math.min(92, selected.y + 8) };
    setLayers((ls) => [...ls, l]);
    setSelectedId(l.id);
  };
  const removeLayer = () => {
    if (!selected || layers.length === 1) return;
    setLayers((ls) => ls.filter((l) => l.id !== selected.id));
    setSelectedId(layers.find((l) => l.id !== selected.id)?.id ?? "");
  };
  const moveOrder = (dir: -1 | 1) => {
    if (!selected) return;
    setLayers((ls) => {
      const i = ls.findIndex((l) => l.id === selected.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ls.length) return ls;
      const copy = [...ls];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  // ---- pointer drag / scale ----
  const startDrag = (e: React.PointerEvent, layer: TextLayer, mode: "move" | "scale") => {
    e.stopPropagation();
    e.preventDefault();
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSelectedId(layer.id);
    dragState.current = { id: layer.id, mode, startX: e.clientX, startY: e.clientY, base: layer, rect };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.mode === "move") {
      patch(
        {
          x: Math.max(2, Math.min(98, d.base.x + (dx / d.rect.width) * 100)),
          y: Math.max(2, Math.min(98, d.base.y + (dy / d.rect.height) * 100)),
        },
        d.id,
      );
    } else {
      const delta = (dx + dy) / 2;
      patch({ size: Math.max(3, Math.min(48, d.base.size + (delta / d.rect.width) * 100)) }, d.id);
    }
  };
  const endDrag = () => {
    dragState.current = null;
  };

  // Al-Khal Touch
  const PRESETS = [
    { fontId: "cairo", colorId: "royal-gold", effect: "glow" as EffectId, frame: "polaroid" as FrameId },
    { fontId: "amiri", colorId: "emerald", effect: "glass" as EffectId, frame: "geometric" as FrameId },
    { fontId: "blaka", colorId: "neon", effect: "neon" as EffectId, frame: "circular" as FrameId },
    { fontId: "rakkas", colorId: "gold", effect: "drop" as EffectId, frame: "polaroid" as FrameId },
    { fontId: "changa", colorId: "white", effect: "strip" as EffectId, frame: "none" as FrameId },
  ];
  const handleAlKhalTouch = () => {
    tryPremium(() => {
      const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
      patch({ fontId: p.fontId, colorId: p.colorId, effect: p.effect });
      setFrame(p.frame);
      toast({ title: "بصمة الخال!", description: "ظبطنا ليك القالب يا هندسة 🔥" });
    });
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setCutoutUrl(null);
    };
    reader.readAsDataURL(f);
  };

  /** Cut the subject out so text can sit BEHIND the person. */
  const handleCutout = async () => {
    if (!imageUrl) {
      toast({ title: "ارفع صورة الأول يا غالي", description: "Pick an image first." });
      return;
    }
    setRemovingBg(true);
    setProgressOpen(true);
    setProgress(0.15);
    const tick = setInterval(() => setProgress((p) => Math.min(0.9, p + 0.08)), 250);
    try {
      const { data, error } = await supabase.functions.invoke("remove-bg", { body: { imageBase64: imageUrl } });
      if (error) throw error;
      if (!data?.imageUrl) throw new Error(data?.error || "No image returned");
      setCutoutUrl(data.imageUrl);
      setProgress(1);
      toast({ title: "تمام!", description: "دحين تقدر تحط النص خلف الصورة." });
    } catch (err) {
      toast({
        title: "حصل خطأ",
        description: err instanceof Error ? err.message : "Cutout failed",
        variant: "destructive",
      });
    } finally {
      clearInterval(tick);
      setTimeout(() => setProgressOpen(false), 350);
      setRemovingBg(false);
    }
  };

  const handleDownload = async () => {
    if (!frameRef.current) return;
    setSelectedId("");
    setExporting(true);
    setProgressOpen(true);
    setProgress(0.1);
    const tick = setInterval(() => setProgress((p) => Math.min(0.9, p + 0.1)), 180);
    try {
      await new Promise((r) => setTimeout(r, 60));
      const dataUrl = await toJpeg(frameRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true });
      setProgress(1);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `al-wajib-${id}.jpg`;
      a.click();
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      clearInterval(tick);
      setTimeout(() => setProgressOpen(false), 350);
      setExporting(false);
    }
  };

  const textShadowFor = (effect: EffectId) =>
    effect === "shadow"
      ? "0 2px 10px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.45)"
      : effect === "drop"
        ? "0 6px 14px rgba(0,0,0,0.65)"
        : effect === "glow"
          ? "0 0 14px hsl(var(--gold-glow) / 0.9), 0 0 28px hsl(var(--gold-glow) / 0.5)"
          : effect === "neon"
            ? "0 0 6px #00F0FF, 0 0 14px #FF00C8, 0 0 28px #B400FF"
            : undefined;

  const frameWrapClass =
    frame === "polaroid"
      ? "p-3 pb-10 bg-white shadow-2xl rotate-[-1deg]"
      : frame === "circular"
        ? "rounded-full overflow-hidden border-4 border-gold/60"
        : frame === "geometric"
          ? "border-[6px] border-double border-gold/70 p-1"
          : "";

  const splitOverlay =
    split === "bw-gold"
      ? "linear-gradient(90deg, rgba(0,0,0,0.6) 0 50%, rgba(212,175,55,0.45) 50% 100%)"
      : split === "bw-emerald"
        ? "linear-gradient(90deg, rgba(0,0,0,0.6) 0 50%, rgba(4,120,87,0.5) 50% 100%)"
        : split === "bw-neon"
          ? "linear-gradient(90deg, rgba(0,0,0,0.55) 0 50%, rgba(255,0,200,0.45) 50% 100%)"
          : undefined;
  const splitFilter = split !== "off" ? "grayscale(0.85) contrast(1.05)" : undefined;

  const renderLayer = (l: TextLayer) => {
    const font = FONTS.find((f) => f.id === l.fontId) ?? FONTS[0];
    const color = COLORS.find((c) => c.id === l.colorId) ?? COLORS[0];
    const isSel = l.id === selectedId;
    const inner = (
      <p
        dir="rtl"
        className={`${font.className} ${color.className} whitespace-pre-line m-0`}
        style={{
          fontSize: `${l.size}cqw`,
          fontWeight: l.weight,
          letterSpacing: `${l.letterSpacing}em`,
          lineHeight: l.lineHeight,
          textAlign: l.align,
          textShadow: textShadowFor(l.effect),
          WebkitTextStroke: l.effect === "outline" ? "1.5px rgba(0,0,0,0.85)" : undefined,
        }}
      >
        {l.text}
      </p>
    );
    return (
      <div
        key={l.id}
        onPointerDown={(e) => startDrag(e, l, "move")}
        className="absolute cursor-move select-none touch-none"
        style={{
          left: `${l.x}%`,
          top: `${l.y}%`,
          transform: `translate(-50%, -50%) rotate(${l.rotation}deg)`,
          opacity: l.opacity,
          maxWidth: "92%",
        }}
      >
        <div
          className={
            l.effect === "glass"
              ? "px-4 py-2 rounded-2xl backdrop-blur-md bg-white/15 border border-white/25 shadow-xl"
              : l.effect === "strip"
                ? "px-4 py-1.5 rounded-md bg-foreground/85"
                : ""
          }
        >
          {inner}
        </div>
        {isSel && (
          <>
            <div className="absolute -inset-2 border border-dashed border-gold/80 rounded-lg pointer-events-none" />
            <div
              onPointerDown={(e) => startDrag(e, l, "scale")}
              className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-gold border-2 border-white shadow touch-none"
            />
          </>
        )}
      </div>
    );
  };

  const behindLayers = layers.filter((l) => l.behind);
  const frontLayers = layers.filter((l) => !l.behind);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8" dir="rtl">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground">{meta.titleAr}</h1>
          <p className="text-[10px] text-muted-foreground" dir="ltr">Status Maker Pro</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold font-cairo">
          <Sparkles className="w-3 h-3" />
          {premiumRemaining > 0 ? `${premiumRemaining} مميّز` : "إعلان"}
        </div>
        <button
          onClick={handleDownload}
          disabled={exporting}
          className="px-3 py-1.5 rounded-full gradient-gold text-primary-foreground text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span className="font-cairo">حفظ</span>
        </button>
      </header>

      {/* Canvas */}
      <div className="px-5 mt-5">
        <div className={`relative ${frame === "circular" ? "aspect-square" : ""} ${frameWrapClass}`}>
          <div
            ref={frameRef}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerDown={() => setSelectedId("")}
            className={`relative aspect-square ${frame === "circular" ? "" : "rounded-3xl"} overflow-hidden bg-gradient-to-br ${meta.gradient} ${frame === "polaroid" || frame === "geometric" ? "" : "border border-border shadow-lg"}`}
            style={{ containerType: "inline-size" }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="خلفية القالب"
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: splitFilter }}
              />
            )}
            {splitOverlay && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: splitOverlay, mixBlendMode: "multiply" }} />
            )}

            {/* Text behind the subject */}
            {behindLayers.map(renderLayer)}

            {/* Cut-out subject on top of "behind" text */}
            {cutoutUrl && (
              <img
                src={cutoutUrl}
                alt="العنصر المقصوص"
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Text in front */}
            {frontLayers.map(renderLayer)}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground font-cairo mt-2 text-center">
          اسحب النص لأي مكان • اسحب الدائرة الذهبية للتكبير والتصغير
        </p>
      </div>

      {/* Controls */}
      <div className="px-5 mt-4 space-y-5">
        <button
          onClick={handleAlKhalTouch}
          className="w-full rounded-2xl gradient-gold p-3 flex items-center justify-center gap-2 text-sm font-bold text-primary-foreground active:scale-95 transition-transform shadow-lg glow-gold font-cairo"
        >
          <Wand2 className="w-4 h-4" />
          بصمة الخال — ستايل ذكي تلقائي
        </button>

        {/* Layers bar */}
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2 font-cairo">
            <Layers className="w-3.5 h-3.5" /> طبقات النص
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {layers.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={`shrink-0 max-w-[110px] px-3 py-2 rounded-xl border text-[11px] font-cairo truncate ${
                  l.id === selectedId ? "border-gold bg-gold/10 text-foreground" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {i + 1}. {l.text.split("\n")[0] || "نص"}
              </button>
            ))}
            <button onClick={addLayer} className="shrink-0 px-3 py-2 rounded-xl border border-dashed border-gold/60 text-gold">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={duplicateLayer} className="flex-1 py-2 rounded-xl bg-card border border-border text-[11px] font-cairo flex items-center justify-center gap-1">
              <Copy className="w-3.5 h-3.5" /> نسخ
            </button>
            <button onClick={() => moveOrder(1)} className="flex-1 py-2 rounded-xl bg-card border border-border text-[11px] font-cairo flex items-center justify-center gap-1">
              <ArrowUp className="w-3.5 h-3.5" /> فوق
            </button>
            <button onClick={() => moveOrder(-1)} className="flex-1 py-2 rounded-xl bg-card border border-border text-[11px] font-cairo flex items-center justify-center gap-1">
              <ArrowDown className="w-3.5 h-3.5" /> تحت
            </button>
            <button onClick={removeLayer} className="flex-1 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-[11px] font-cairo flex items-center justify-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> حذف
            </button>
          </div>
        </div>

        {selected && (
          <>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2 font-cairo">
                <Type className="w-3.5 h-3.5" /> النص
              </label>
              <textarea
                value={selected.text}
                onChange={(e) => patch({ text: e.target.value })}
                onFocus={() => setSelectedId(selected.id)}
                rows={2}
                dir="rtl"
                className="w-full rounded-2xl bg-card border border-border p-3 text-sm font-cairo text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
                placeholder="اكتب رسالتك..."
              />
            </div>

            {/* Transform sliders */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
              <Slider label="الحجم" value={selected.size} min={3} max={48} step={0.5} onChange={(v) => patch({ size: v })} />
              <Slider
                label="التدوير"
                value={selected.rotation}
                min={-180}
                max={180}
                step={1}
                icon={<RotateCw className="w-3 h-3" />}
                onChange={(v) => patch({ rotation: v })}
              />
              <Slider label="تباعد الحروف" value={selected.letterSpacing} min={-0.1} max={0.6} step={0.01} onChange={(v) => patch({ letterSpacing: v })} />
              <Slider label="تباعد الأسطر" value={selected.lineHeight} min={0.8} max={2.5} step={0.05} onChange={(v) => patch({ lineHeight: v })} />
              <Slider label="الشفافية" value={selected.opacity} min={0.1} max={1} step={0.05} onChange={(v) => patch({ opacity: v })} />
              <Slider label="السماكة" value={selected.weight} min={200} max={900} step={100} icon={<Bold className="w-3 h-3" />} onChange={(v) => patch({ weight: v })} />
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-cairo text-muted-foreground w-16">المحاذاة</span>
                {([["right", AlignRight], ["center", AlignCenter], ["left", AlignLeft]] as const).map(([a, Icon]) => (
                  <button
                    key={a}
                    onClick={() => patch({ align: a })}
                    className={`p-2 rounded-lg border ${selected.align === a ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
                <button
                  onClick={() => patch({ rotation: 0, x: 50, y: 50 })}
                  className="ms-auto px-3 py-1.5 rounded-lg border border-border text-[11px] font-cairo text-muted-foreground"
                >
                  توسيط
                </button>
              </div>
            </div>

            {/* Behind image */}
            <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cairo font-semibold text-foreground">النص خلف الصورة</span>
                <button
                  onClick={() => {
                    if (!cutoutUrl) {
                      toast({ title: "محتاج قص العنصر الأول", description: "اضغط «قص العنصر» عشان الخال يفصل الشخص من الخلفية." });
                    }
                    patch({ behind: !selected.behind });
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${selected.behind ? "bg-gold" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${selected.behind ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
              <button
                onClick={handleCutout}
                disabled={removingBg || !imageUrl}
                className="w-full py-2 rounded-xl border border-gold/50 text-gold text-[11px] font-cairo flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {removingBg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                {cutoutUrl ? "أعد قص العنصر" : "قص العنصر (عشان النص يمشي خلفه)"}
              </button>
            </div>

            {/* Font picker */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 font-cairo">الخط (للطبقة المحددة)</p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {FONTS.map((f) => {
                  const active = f.id === selected.fontId;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onPickFont(f)}
                      className={`relative shrink-0 min-w-[68px] px-3 py-2 rounded-2xl border text-center transition-all ${
                        active ? "border-gold bg-gold/10" : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      <span className={`block ${f.className} text-lg leading-none text-foreground`}>{f.preview}</span>
                      <span className="block mt-1 font-cairo text-[10px] text-muted-foreground">{f.labelAr}</span>
                      {f.premium && <Lock className="absolute top-1 left-1 w-2.5 h-2.5 text-gold" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 font-cairo">اللون</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onPickColor(c)}
                    className={`relative w-11 h-11 rounded-full border-2 transition-all ${
                      c.id === selected.colorId ? "border-gold scale-110" : "border-border"
                    }`}
                    style={{ background: c.swatch }}
                    aria-label={c.labelAr}
                    title={c.labelAr}
                  >
                    {c.premium && <Lock className="absolute -top-1 -left-1 w-3 h-3 text-gold bg-card rounded-full p-0.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Effects */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 font-cairo">المؤثر</p>
              <div className="flex gap-2 flex-wrap">
                {EFFECTS.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onPickEffect(e)}
                    className={`relative px-3 py-1.5 rounded-full text-xs font-cairo font-semibold border transition-all ${
                      e.id === selected.effect ? "border-gold bg-gold/10 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {e.labelAr}
                    {e.premium && <Lock className="inline w-2.5 h-2.5 ms-1 text-gold" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Image */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 font-cairo">الصورة</p>
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 py-2.5 rounded-xl bg-card border border-border text-xs font-cairo flex items-center justify-center gap-1.5"
            >
              <ImageIcon className="w-4 h-4" /> اختر صورة
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
          </div>
        </div>

        {/* Frames */}
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2 font-cairo">
            <FrameIcon className="w-3.5 h-3.5" /> الإطار
          </p>
          <div className="flex gap-2 flex-wrap">
            {FRAMES.map((f) => (
              <button
                key={f.id}
                onClick={() => (f.premium ? tryPremium(() => setFrame(f.id)) : setFrame(f.id))}
                className={`px-3 py-1.5 rounded-full text-xs font-cairo font-semibold border ${
                  frame === f.id ? "border-gold bg-gold/10 text-foreground" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {f.labelAr}
                {f.premium && <Lock className="inline w-2.5 h-2.5 ms-1 text-gold" />}
              </button>
            ))}
          </div>
        </div>

        {/* Split tone */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 font-cairo">تقسيم الألوان</p>
          <div className="flex gap-2 flex-wrap">
            {SPLITS.map((s) => (
              <button
                key={s.id}
                onClick={() => (s.premium ? tryPremium(() => setSplit(s.id)) : setSplit(s.id))}
                className={`px-3 py-1.5 rounded-full text-xs font-cairo font-semibold border ${
                  split === s.id ? "border-gold bg-gold/10 text-foreground" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {s.labelAr}
                {s.premium && <Lock className="inline w-2.5 h-2.5 ms-1 text-gold" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <RewardedAdModal
        open={adOpen}
        isRtl
        onClose={() => setAdOpen(false)}
        onRewarded={() => {
          setAdOpen(false);
          setPremiumRemaining(getPremiumRemaining());
          pendingApply.current?.();
          pendingApply.current = null;
        }}
      />
      <StudioProgress open={progressOpen} progress={progress} message="الخال شغال.. بظبط ليك القالب" />
    </div>
  );
};

const Slider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] font-cairo text-muted-foreground w-20 flex items-center gap-1">
      {icon}
      {label}
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="flex-1 accent-gold"
    />
    <span className="text-[10px] text-muted-foreground w-9 text-left" dir="ltr">
      {Math.round(value * 100) / 100}
    </span>
  </div>
);

export default TemplateEditor;
