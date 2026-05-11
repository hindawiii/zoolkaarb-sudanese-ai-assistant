import {
  ArrowLeft,
  Upload,
  Download,
  Loader2,
  RotateCcw,
  Image as ImageIcon,
  Palette,
  Mountain,
  Eraser,
  Type,
  Crop,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/store/userStore";

/* ============================================================
   Madar Tools Hub – fully client-side image processing
   ============================================================ */

type ToolId = "recolor" | "background" | "eraser" | "textify" | "crop";

const TOOLS: { id: ToolId; ar: string; en: string; icon: typeof Palette }[] = [
  { id: "recolor", ar: "تلوين", en: "Recolor", icon: Palette },
  { id: "background", ar: "خلفية", en: "Background", icon: Mountain },
  { id: "eraser", ar: "ممحاة", en: "Eraser", icon: Eraser },
  { id: "textify", ar: "نص ASCII", en: "Textify", icon: Type },
  { id: "crop", ar: "قص", en: "Crop", icon: Crop },
];

const COLOR_PRESETS = [
  { name: "Noir", hex: "#1a1a1a" },
  { name: "Retro", hex: "#c97b3c" },
  { name: "Soft", hex: "#e8c5d0" },
  { name: "Pastel", hex: "#a8c0a0" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Nile", hex: "#2d8a9e" },
];

const BG_TEXTURES = [
  { name: "Studio", url: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&q=80" },
  { name: "Sunset", url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1200&q=80" },
  { name: "Marble", url: "https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?w=1200&q=80" },
  { name: "Neon", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80" },
  { name: "Forest", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80" },
  { name: "Sand", url: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1200&q=80" },
];

const ASPECT_RATIOS = [
  { label: "Free", value: 0 },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "4:3", value: 4 / 3 },
];

const fileToDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const hexToRgb = (hex: string) => {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
};

/* ---------- Algorithms ---------- */

// Recolor: tints the image while preserving luminance + detail
const recolorImage = async (src: string, hex: string): Promise<string> => {
  const img = await loadImage(src);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const { r: tr, g: tg, b: tb } = hexToRgb(hex);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
    // Soft-light blend toward target color, preserving luminance
    px[i] = Math.min(255, lum * tr * 1.1 + (px[i] - lum * 255) * 0.45 + lum * 40);
    px[i + 1] = Math.min(255, lum * tg * 1.1 + (px[i + 1] - lum * 255) * 0.45 + lum * 40);
    px[i + 2] = Math.min(255, lum * tb * 1.1 + (px[i + 2] - lum * 255) * 0.45 + lum * 40);
  }
  ctx.putImageData(data, 0, 0);
  return c.toDataURL("image/png");
};

// Lightweight client-side person segmentation using luminance + edge fallback.
// Tries MediaPipe Selfie Segmentation via dynamic CDN; falls back to a
// center-weighted soft mask if unavailable so the tool always works offline.
const segmentPerson = async (img: HTMLImageElement): Promise<ImageData> => {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  try {
    const cdnUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
    // @ts-ignore – dynamic import from CDN at runtime
    const mod: any = await import(/* @vite-ignore */ cdnUrl).catch(() => null);
    const SelfieCtor =
      mod?.SelfieSegmentation ||
      // @ts-ignore
      (typeof window !== "undefined" && (window as any).SelfieSegmentation);
    if (SelfieCtor) {
      const seg = new SelfieCtor({
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
      });
      seg.setOptions({ modelSelection: 1 });
      const mask: ImageData = await new Promise((resolve, reject) => {
        seg.onResults((res: any) => {
          const mc = document.createElement("canvas");
          mc.width = w;
          mc.height = h;
          const mctx = mc.getContext("2d")!;
          mctx.drawImage(res.segmentationMask, 0, 0, w, h);
          resolve(mctx.getImageData(0, 0, w, h));
        });
        seg.send({ image: img }).catch(reject);
      });
      return mask;
    }
  } catch {
    /* fall through */
  }

  // Fallback: soft elliptical center mask
  ctx.drawImage(img, 0, 0);
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.min(w, h) * 0.55);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
};

const swapBackground = async (
  src: string,
  bg: { type: "color" | "image"; value: string },
): Promise<string> => {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const mask = await segmentPerson(img);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d")!;

  if (bg.type === "color") {
    octx.fillStyle = bg.value;
    octx.fillRect(0, 0, w, h);
  } else {
    const bgImg = await loadImage(bg.value);
    // cover-fit
    const r = Math.max(w / bgImg.naturalWidth, h / bgImg.naturalHeight);
    const bw = bgImg.naturalWidth * r;
    const bh = bgImg.naturalHeight * r;
    octx.drawImage(bgImg, (w - bw) / 2, (h - bh) / 2, bw, bh);
  }

  // Source image
  const src2 = document.createElement("canvas");
  src2.width = w;
  src2.height = h;
  const sctx = src2.getContext("2d")!;
  sctx.drawImage(img, 0, 0);
  const srcData = sctx.getImageData(0, 0, w, h);

  // Apply mask alpha to source
  for (let i = 0; i < srcData.data.length; i += 4) {
    const a = mask.data[i]; // luminance of mask
    srcData.data[i + 3] = a;
  }
  sctx.putImageData(srcData, 0, 0);
  octx.drawImage(src2, 0, 0);
  return out.toDataURL("image/png");
};

// ASCII text representation
const textifyImage = async (src: string, color: string): Promise<string> => {
  const img = await loadImage(src);
  const targetCols = 140;
  const aspectChar = 0.5; // chars are ~2x taller than wide
  const scale = targetCols / img.naturalWidth;
  const cols = targetCols;
  const rows = Math.max(1, Math.floor(img.naturalHeight * scale * aspectChar));
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const ramp = "@%#*+=-:. ";
  const lines: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      line += ramp[Math.min(ramp.length - 1, Math.floor(lum * (ramp.length - 1)))];
    }
    lines.push(line);
  }
  // Render to canvas in chosen color
  const fontSize = 8;
  const out = document.createElement("canvas");
  out.width = cols * fontSize * 0.6;
  out.height = rows * fontSize;
  const octx = out.getContext("2d")!;
  octx.fillStyle = color === "#ffffff" ? "#000000" : "#ffffff";
  octx.fillRect(0, 0, out.width, out.height);
  octx.fillStyle = color;
  octx.font = `${fontSize}px monospace`;
  octx.textBaseline = "top";
  lines.forEach((ln, i) => octx.fillText(ln, 0, i * fontSize));
  return out.toDataURL("image/png");
};

/* ============================================================
   Component
   ============================================================ */

const ZoolProToolsHub = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  // Tool-specific state
  const [color, setColor] = useState("#D4AF37");
  const [textColor, setTextColor] = useState("#D4AF37");
  const [aspect, setAspect] = useState(0);

  // Crop state
  const cropImgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 }); // %

  // Eraser state
  const eraserCanvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(30);
  const eraserState = useRef<{ painting: boolean; mask: HTMLCanvasElement | null }>({
    painting: false,
    mask: null,
  });

  /* ---------- File handling ---------- */
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: isRtl ? "ملف غير صالح" : "Invalid file", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: isRtl ? "حجم الصورة كبير" : "File too large (max 8MB)", variant: "destructive" });
      return;
    }
    const data = await fileToDataURL(file);
    setCurrentImage(data);
    setHistory([]);
    setActiveTool(null);
  };

  const apply = (next: string) => {
    if (currentImage) setHistory((h) => [...h, currentImage]);
    setCurrentImage(next);
    setActiveTool(null);
  };

  const withProgress = async (fn: () => Promise<string>) => {
    setLoading(true);
    try {
      const next = await fn();
      apply(next);
      toast({ title: isRtl ? "تمام!" : "Done!" });
    } catch (e) {
      toast({
        title: isRtl ? "ما زبط" : "Failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Tool runners ---------- */
  const runRecolor = (hex: string) => {
    if (!currentImage) return;
    withProgress(() => recolorImage(currentImage, hex));
  };

  const runBackgroundColor = (hex: string) => {
    if (!currentImage) return;
    withProgress(() => swapBackground(currentImage, { type: "color", value: hex }));
  };

  const runBackgroundImage = (url: string) => {
    if (!currentImage) return;
    withProgress(() => swapBackground(currentImage, { type: "image", value: url }));
  };

  const runTextify = () => {
    if (!currentImage) return;
    withProgress(() => textifyImage(currentImage, textColor));
  };

  /* ---------- Eraser canvas setup ---------- */
  useEffect(() => {
    if (activeTool !== "eraser" || !currentImage) return;
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    loadImage(currentImage).then((img) => {
      const maxW = 480;
      const scale = Math.min(1, maxW / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // overlay mask canvas
      const mask = document.createElement("canvas");
      mask.width = canvas.width;
      mask.height = canvas.height;
      eraserState.current.mask = mask;
    });
  }, [activeTool, currentImage]);

  const eraserPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = eraserCanvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height };
  };

  const onEraserDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    eraserState.current.painting = true;
    onEraserMove(e);
  };
  const onEraserMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!eraserState.current.painting) return;
    const mask = eraserState.current.mask!;
    const mctx = mask.getContext("2d")!;
    const { x, y } = eraserPos(e);
    mctx.fillStyle = "rgba(212,175,55,0.6)";
    mctx.beginPath();
    mctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    mctx.fill();
    // visualize on display canvas
    const ctx = eraserCanvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "rgba(212,175,55,0.4)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };
  const onEraserUp = () => {
    eraserState.current.painting = false;
  };

  const applyEraser = async () => {
    if (!currentImage || !eraserState.current.mask) return;
    setLoading(true);
    try {
      const img = await loadImage(currentImage);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      // scale mask up to source
      const maskFull = document.createElement("canvas");
      maskFull.width = w;
      maskFull.height = h;
      maskFull.getContext("2d")!.drawImage(eraserState.current.mask, 0, 0, w, h);
      const maskData = maskFull.getContext("2d")!.getImageData(0, 0, w, h).data;

      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      const octx = out.getContext("2d")!;
      octx.drawImage(img, 0, 0);
      // Inpaint using a heavily blurred copy of the source as the fill source
      const blurred = document.createElement("canvas");
      blurred.width = w;
      blurred.height = h;
      const bctx = blurred.getContext("2d")!;
      (bctx as any).filter = "blur(28px)";
      bctx.drawImage(img, 0, 0);
      (bctx as any).filter = "none";

      const srcData = octx.getImageData(0, 0, w, h);
      const blurData = bctx.getImageData(0, 0, w, h).data;
      for (let i = 0; i < srcData.data.length; i += 4) {
        const m = maskData[i + 3];
        if (m > 10) {
          const a = m / 255;
          srcData.data[i] = srcData.data[i] * (1 - a) + blurData[i] * a;
          srcData.data[i + 1] = srcData.data[i + 1] * (1 - a) + blurData[i + 1] * a;
          srcData.data[i + 2] = srcData.data[i + 2] * (1 - a) + blurData[i + 2] * a;
        }
      }
      octx.putImageData(srcData, 0, 0);
      apply(out.toDataURL("image/png"));
      toast({ title: isRtl ? "تم المحو" : "Erased!" });
    } catch (e) {
      toast({ title: isRtl ? "ما زبط" : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Crop ---------- */
  const applyCrop = async () => {
    if (!currentImage) return;
    setLoading(true);
    try {
      const img = await loadImage(currentImage);
      const sx = (crop.x / 100) * img.naturalWidth;
      const sy = (crop.y / 100) * img.naturalHeight;
      let sw = (crop.w / 100) * img.naturalWidth;
      let sh = (crop.h / 100) * img.naturalHeight;
      if (aspect > 0) {
        if (sw / sh > aspect) sw = sh * aspect;
        else sh = sw / aspect;
      }
      const c = document.createElement("canvas");
      c.width = Math.round(sw);
      c.height = Math.round(sh);
      c.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      apply(c.toDataURL("image/png"));
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Render helpers ---------- */
  const undo = () => {
    if (!history.length) return;
    setCurrentImage(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };
  const reset = () => {
    setCurrentImage(null);
    setHistory([]);
    setActiveTool(null);
  };

  /* ============================================================ */
  return (
    <div
      className="min-h-screen bg-background max-w-md mx-auto relative pb-56"
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top, hsl(var(--gold) / 0.08), transparent 60%)",
      }}
    >
      <header className="flex items-center gap-3 px-4 py-4 border-b border-gold/20 bg-card/60 backdrop-blur-2xl sticky top-0 z-30">
        <button
          onClick={() => navigate("/studio")}
          className="p-2 rounded-xl hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold font-cairo bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
            {isRtl ? "أدوات مدار" : "Madar Tools"}
          </h1>
          <p className="text-xs text-muted-foreground font-cairo">
            {isRtl ? "محرر احترافي بالكامل في المتصفح" : "Pro client-side editor"}
          </p>
        </div>
        {currentImage && (
          <button onClick={reset} className="p-2 rounded-xl hover:bg-muted text-muted-foreground" aria-label="New">
            <ImageIcon className="w-5 h-5" />
          </button>
        )}
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
      <input ref={bgImageInputRef} type="file" accept="image/*" onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const url = await fileToDataURL(f);
        runBackgroundImage(url);
      }} className="hidden" />

      {/* Upload state */}
      {!currentImage ? (
        <div className="px-5 mt-10">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square rounded-3xl border-2 border-dashed border-gold/40 bg-card/40 backdrop-blur-xl flex flex-col items-center justify-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center">
              <Upload className="w-7 h-7 text-primary-foreground" />
            </div>
            <p className="text-base font-bold font-cairo text-foreground px-6 text-center">
              {isRtl ? "ارفع صورة لتبدأ" : "Upload a photo to start"}
            </p>
            <p className="text-[11px] text-muted-foreground font-cairo">
              {isRtl ? "كل الأدوات تشتغل محلياً في جهازك" : "All tools run locally in your browser"}
            </p>
          </button>
        </div>
      ) : (
        <div className="px-3 mt-3">
          {/* Image canvas area */}
          <div className="relative rounded-2xl overflow-hidden border border-gold/20 bg-black/40 min-h-[280px] flex items-center justify-center">
            {activeTool === "crop" ? (
              <div className="relative w-full">
                <img ref={cropImgRef} src={currentImage} alt="" className="w-full h-auto block select-none" />
                <div
                  className="absolute border-2 border-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                  style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.w}%`, height: `${crop.h}%` }}
                />
              </div>
            ) : activeTool === "eraser" ? (
              <canvas
                ref={eraserCanvasRef}
                className="w-full h-auto block touch-none cursor-crosshair"
                onPointerDown={onEraserDown}
                onPointerMove={onEraserMove}
                onPointerUp={onEraserUp}
                onPointerLeave={onEraserUp}
              />
            ) : (
              <img src={currentImage} alt="Editing" className="w-full h-auto block" />
            )}
            {loading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl gradient-gold flex items-center justify-center animate-pulse-glow">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="text-xs text-foreground font-cairo">
                  {isRtl ? "الخال شغال.. بجهز في أدوات مدار" : "Working..."}
                </p>
              </div>
            )}
          </div>

          {/* Undo / Save */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={undo}
              disabled={!history.length || loading}
              className="flex-1 py-2.5 rounded-xl bg-card/60 backdrop-blur-xl border border-gold/20 text-xs font-semibold text-foreground active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 font-cairo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isRtl ? "تراجع" : "Undo"}
            </button>
            <a
              href={currentImage}
              download="zool-pro.png"
              className="flex-1 py-2.5 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 font-cairo"
            >
              <Download className="w-3.5 h-3.5" />
              {isRtl ? "حفظ" : "Save"}
            </a>
          </div>

          {/* Active tool panel */}
          {activeTool && (
            <div className="mt-3 rounded-2xl border border-gold/30 bg-card/60 backdrop-blur-2xl p-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold font-cairo text-gold">
                  {TOOLS.find((t) => t.id === activeTool)?.[isRtl ? "ar" : "en"]}
                </p>
                <button onClick={() => setActiveTool(null)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {activeTool === "recolor" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-border"
                    />
                    <button
                      onClick={() => runRecolor(color)}
                      className="flex-1 py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95"
                    >
                      {isRtl ? "طبّق اللون" : "Apply color"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => runRecolor(p.hex)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-background/50 active:scale-95"
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: p.hex }} />
                        <span className="text-[10px] font-cairo text-foreground">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === "background" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-border"
                    />
                    <button
                      onClick={() => runBackgroundColor(color)}
                      className="flex-1 py-2 rounded-xl bg-background/60 border border-gold/30 text-foreground text-xs font-semibold font-cairo active:scale-95"
                    >
                      {isRtl ? "خلفية لون" : "Solid color"}
                    </button>
                    <button
                      onClick={() => bgImageInputRef.current?.click()}
                      className="flex-1 py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95"
                    >
                      {isRtl ? "ارفع خلفية" : "Upload"}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {BG_TEXTURES.map((b) => (
                      <button
                        key={b.name}
                        onClick={() => runBackgroundImage(b.url)}
                        className="relative aspect-square rounded-xl overflow-hidden border border-border active:scale-95"
                      >
                        <img src={b.url} alt={b.name} className="w-full h-full object-cover" loading="lazy" />
                        <span className="absolute inset-x-0 bottom-0 text-[9px] font-cairo bg-black/60 text-white py-0.5 text-center">
                          {b.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === "eraser" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-cairo text-muted-foreground">{isRtl ? "حجم الفرشاة" : "Brush"}</span>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="flex-1 accent-[hsl(var(--gold))]"
                    />
                    <span className="text-[10px] font-cairo text-foreground w-6 text-end">{brushSize}</span>
                  </div>
                  <button
                    onClick={applyEraser}
                    className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95"
                  >
                    {isRtl ? "محو ذكي" : "Smart erase"}
                  </button>
                  <p className="text-[10px] text-muted-foreground font-cairo text-center">
                    {isRtl ? "ارسم على المنطقة المراد محوها" : "Paint over the area to erase"}
                  </p>
                </div>
              )}

              {activeTool === "textify" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTextColor("#ffffff")}
                      className={`flex-1 py-2 rounded-xl border text-xs font-cairo ${textColor === "#ffffff" ? "border-gold bg-gold/10" : "border-border bg-background/50"}`}
                    >
                      {isRtl ? "أبيض" : "White"}
                    </button>
                    <button
                      onClick={() => setTextColor("#000000")}
                      className={`flex-1 py-2 rounded-xl border text-xs font-cairo ${textColor === "#000000" ? "border-gold bg-gold/10" : "border-border bg-background/50"}`}
                    >
                      {isRtl ? "أسود" : "Black"}
                    </button>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-border"
                    />
                  </div>
                  <button
                    onClick={runTextify}
                    className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95"
                  >
                    {isRtl ? "حوّل لـ ASCII" : "Convert to ASCII"}
                  </button>
                </div>
              )}

              {activeTool === "crop" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {ASPECT_RATIOS.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => setAspect(a.value)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-cairo border ${aspect === a.value ? "border-gold bg-gold/15 text-gold" : "border-border text-foreground bg-background/50"}`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["x", "y", "w", "h"] as const).map((k) => (
                      <label key={k} className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                        <span className="uppercase w-4">{k}</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={crop[k]}
                          onChange={(e) =>
                            setCrop((c) => ({ ...c, [k]: Math.min(100, Math.max(0, Number(e.target.value))) }))
                          }
                          className="flex-1 accent-[hsl(var(--gold))]"
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={applyCrop}
                    className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    {isRtl ? "طبّق القص" : "Apply crop"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Premium horizontally-scrolling tool bar (original Madar style) */}
      {currentImage && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-card/85 backdrop-blur-2xl border-t border-gold/30">
          <div className="max-w-md mx-auto px-3 py-3">
            <div
              className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none" }}
            >
              {TOOLS.map((t) => {
                const active = activeTool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool((prev) => (prev === t.id ? null : t.id))}
                    disabled={loading}
                    className={`shrink-0 snap-start flex flex-col items-center justify-center gap-1.5 w-[78px] h-[78px] rounded-2xl border transition-all active:scale-95 disabled:opacity-50 ${
                      active
                        ? "gradient-gold text-primary-foreground shadow-lg shadow-gold/40 border-gold"
                        : "bg-background/60 text-foreground border-gold/20 hover:border-gold/50"
                    }`}
                  >
                    <t.icon className="w-6 h-6" />
                    <span className="text-[11px] font-cairo font-semibold leading-tight">
                      {isRtl ? t.ar : t.en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoolProToolsHub;
