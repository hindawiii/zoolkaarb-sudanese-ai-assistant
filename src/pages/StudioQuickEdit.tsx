import {
  ArrowLeft,
  Upload,
  Download,
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
  Square,
  Triangle,
  Wand2,
  Maximize2,
  Copy,
  Repeat,
  Sliders,
  Activity,
  Sun,
  Move,
  Aperture,
  FlipHorizontal,
  Scan,
  Stars,
  Scissors,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/store/userStore";

/* ============================================================
   Madar Tools Hub – fully client-side image processing
   ============================================================ */

type ToolId =
  | "recolor"
  | "background"
  | "eraser"
  | "textify"
  | "crop"
  | "free-crop"
  | "shape-crop"
  | "perspective"
  | "resize"
  | "flip-rotate"
  | "ai-enhance"
  | "ai-expand"
  | "ai-replace"
  | "clone"
  | "dispersion"
  | "curves"
  | "adjust"
  | "enhance"
  | "stretch"
  | "motion"
  | "tilt-shift"
  | "remove-bg";

const TOOLS: { id: ToolId; ar: string; en: string; icon: typeof Palette }[] = [
  { id: "remove-bg", ar: "إزالة الخلفية", en: "Remove BG", icon: Scissors },
  { id: "crop", ar: "قص", en: "Crop", icon: Crop },
  { id: "free-crop", ar: "قص حر", en: "Free Crop", icon: Scan },
  { id: "shape-crop", ar: "قص الأشكال", en: "Shape Crop", icon: Triangle },
  { id: "dispersion", ar: "تشتيت", en: "Dispersion", icon: Stars },
  { id: "clone", ar: "استنساخ", en: "Clone", icon: Copy },
  { id: "ai-replace", ar: "تبديل ذكي", en: "AI Replace", icon: Wand2 },
  { id: "stretch", ar: "تمطيط", en: "Stretch", icon: Maximize2 },
  { id: "motion", ar: "حركة", en: "Motion", icon: Activity },
  { id: "eraser", ar: "ممحاة", en: "Eraser", icon: Eraser },
  { id: "curves", ar: "منحنيات", en: "Curves", icon: Sliders },
  { id: "adjust", ar: "ضبط", en: "Adjust", icon: Sun },
  { id: "enhance", ar: "تحسين", en: "Enhance", icon: Sparkles },
  { id: "tilt-shift", ar: "عزل العدسة", en: "Tilt Shift", icon: Aperture },
  { id: "perspective", ar: "منظور", en: "Perspective", icon: Move },
  { id: "resize", ar: "تعديل الحجم", en: "Resize", icon: Square },
  { id: "flip-rotate", ar: "تدوير/عكس", en: "Flip/Rotate", icon: FlipHorizontal },
  { id: "ai-enhance", ar: "تحسين ذكي", en: "AI Enhance", icon: Sparkles },
  { id: "ai-expand", ar: "توسيع ذكي", en: "AI Expand", icon: Maximize2 },
  { id: "recolor", ar: "تلوين", en: "Recolor", icon: Palette },
  { id: "background", ar: "خلفية", en: "Background", icon: Mountain },
  { id: "textify", ar: "نص ASCII", en: "Textify", icon: Type },
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

const makeCanvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

/* ---------- Algorithms ---------- */

const recolorImage = async (src: string, hex: string): Promise<string> => {
  const img = await loadImage(src);
  const c = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const { r: tr, g: tg, b: tb } = hexToRgb(hex);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
    px[i] = Math.min(255, lum * tr * 1.1 + (px[i] - lum * 255) * 0.45 + lum * 40);
    px[i + 1] = Math.min(255, lum * tg * 1.1 + (px[i + 1] - lum * 255) * 0.45 + lum * 40);
    px[i + 2] = Math.min(255, lum * tb * 1.1 + (px[i + 2] - lum * 255) * 0.45 + lum * 40);
  }
  ctx.putImageData(data, 0, 0);
  return c.toDataURL("image/png");
};

const segmentPerson = async (img: HTMLImageElement): Promise<ImageData> => {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  try {
    const cdnUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
    // @ts-ignore
    const mod: any = await import(/* @vite-ignore */ cdnUrl).catch(() => null);
    const SelfieCtor =
      mod?.SelfieSegmentation ||
      // @ts-ignore
      (typeof window !== "undefined" && (window as any).SelfieSegmentation);
    if (SelfieCtor) {
      const seg = new SelfieCtor({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
      });
      seg.setOptions({ modelSelection: 1 });
      const mask: ImageData = await new Promise((resolve, reject) => {
        seg.onResults((res: any) => {
          const mc = makeCanvas(w, h);
          const mctx = mc.getContext("2d")!;
          mctx.drawImage(res.segmentationMask, 0, 0, w, h);
          resolve(mctx.getImageData(0, 0, w, h));
        });
        seg.send({ image: img }).catch(reject);
      });
      return mask;
    }
  } catch {}
  ctx.drawImage(img, 0, 0);
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.min(w, h) * 0.55);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
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
  const out = makeCanvas(w, h);
  const octx = out.getContext("2d")!;
  if (bg.type === "color") {
    octx.fillStyle = bg.value;
    octx.fillRect(0, 0, w, h);
  } else {
    const bgImg = await loadImage(bg.value);
    const r = Math.max(w / bgImg.naturalWidth, h / bgImg.naturalHeight);
    const bw = bgImg.naturalWidth * r;
    const bh = bgImg.naturalHeight * r;
    octx.drawImage(bgImg, (w - bw) / 2, (h - bh) / 2, bw, bh);
  }
  const src2 = makeCanvas(w, h);
  const sctx = src2.getContext("2d")!;
  sctx.drawImage(img, 0, 0);
  const srcData = sctx.getImageData(0, 0, w, h);
  for (let i = 0; i < srcData.data.length; i += 4) {
    srcData.data[i + 3] = mask.data[i];
  }
  sctx.putImageData(srcData, 0, 0);
  octx.drawImage(src2, 0, 0);
  return out.toDataURL("image/png");
};

const removeBackground = async (src: string): Promise<string> => {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const mask = await segmentPerson(img);
  const out = makeCanvas(w, h);
  const ctx = out.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i + 3] = mask.data[i];
  }
  ctx.putImageData(data, 0, 0);
  return out.toDataURL("image/png");
};

const textifyImage = async (src: string, color: string): Promise<string> => {
  const img = await loadImage(src);
  const targetCols = 140;
  const aspectChar = 0.5;
  const scale = targetCols / img.naturalWidth;
  const cols = targetCols;
  const rows = Math.max(1, Math.floor(img.naturalHeight * scale * aspectChar));
  const c = makeCanvas(cols, rows);
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
  const fontSize = 8;
  const out = makeCanvas(Math.round(cols * fontSize * 0.6), rows * fontSize);
  const octx = out.getContext("2d")!;
  octx.fillStyle = color === "#ffffff" ? "#000000" : "#ffffff";
  octx.fillRect(0, 0, out.width, out.height);
  octx.fillStyle = color;
  octx.font = `${fontSize}px monospace`;
  octx.textBaseline = "top";
  lines.forEach((ln, i) => octx.fillText(ln, 0, i * fontSize));
  return out.toDataURL("image/png");
};

/* ---------- New algorithms ---------- */

const aiEnhance = async (src: string): Promise<string> => {
  const img = await loadImage(src);
  const c = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = c.getContext("2d")!;
  ctx.filter = "contrast(1.15) saturate(1.18) brightness(1.06)";
  ctx.drawImage(img, 0, 0);
  ctx.filter = "none";
  // Auto-levels stretch
  const d = ctx.getImageData(0, 0, c.width, c.height);
  let min = 255, max = 0;
  for (let i = 0; i < d.data.length; i += 4) {
    const l = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3;
    if (l < min) min = l;
    if (l > max) max = l;
  }
  const range = Math.max(1, max - min);
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = Math.min(255, Math.max(0, ((d.data[i] - min) * 255) / range));
    d.data[i + 1] = Math.min(255, Math.max(0, ((d.data[i + 1] - min) * 255) / range));
    d.data[i + 2] = Math.min(255, Math.max(0, ((d.data[i + 2] - min) * 255) / range));
  }
  ctx.putImageData(d, 0, 0);
  return c.toDataURL("image/png");
};

const aiExpand = async (src: string, padPct: number): Promise<string> => {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const pad = Math.round(Math.min(w, h) * (padPct / 100));
  const nw = w + pad * 2;
  const nh = h + pad * 2;
  const c = makeCanvas(nw, nh);
  const ctx = c.getContext("2d")!;
  // Outpaint by stretching/mirroring edges with blur
  (ctx as any).filter = "blur(40px) saturate(1.1)";
  // top, bottom, left, right strips
  ctx.drawImage(img, 0, 0, w, h, -pad, -pad, nw, pad + 30); // top
  ctx.drawImage(img, 0, 0, w, h, -pad, h, nw, pad + 30); // bottom
  ctx.drawImage(img, 0, 0, w, h, -pad, -pad, pad + 30, nh); // left
  ctx.drawImage(img, 0, 0, w, h, w, -pad, pad + 30, nh); // right
  (ctx as any).filter = "none";
  ctx.drawImage(img, pad, pad);
  return c.toDataURL("image/png");
};

const dispersionEffect = async (src: string, direction: "right" | "left" | "up" | "down", intensity: number): Promise<string> => {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const src2 = ctx.getImageData(0, 0, w, h);
  // Apply a radial mask threshold split
  const out = ctx.createImageData(w, h);
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = src2.data[i];
    out.data[i + 1] = src2.data[i + 1];
    out.data[i + 2] = src2.data[i + 2];
    out.data[i + 3] = src2.data[i + 3];
  }
  // Particle scatter: sample pixels and replicate in direction with noise
  const particles = Math.round(w * h * (intensity / 100) * 0.08);
  for (let p = 0; p < particles; p++) {
    const sx = Math.floor(Math.random() * w);
    const sy = Math.floor(Math.random() * h);
    const si = (sy * w + sx) * 4;
    const dist = Math.random() * intensity * 2;
    let dx = sx, dy = sy;
    if (direction === "right") dx = sx + Math.round(dist);
    if (direction === "left") dx = sx - Math.round(dist);
    if (direction === "down") dy = sy + Math.round(dist);
    if (direction === "up") dy = sy - Math.round(dist);
    if (dx < 0 || dx >= w || dy < 0 || dy >= h) continue;
    const di = (dy * w + dx) * 4;
    out.data[di] = src2.data[si];
    out.data[di + 1] = src2.data[si + 1];
    out.data[di + 2] = src2.data[si + 2];
    out.data[di + 3] = 255;
  }
  // Erode source on dispersion side
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let frac = 0;
      if (direction === "right") frac = x / w;
      if (direction === "left") frac = 1 - x / w;
      if (direction === "down") frac = y / h;
      if (direction === "up") frac = 1 - y / h;
      const threshold = 1 - (intensity / 100) * 0.6;
      if (frac > threshold && Math.random() > (1 - frac) * 3) {
        const i = (y * w + x) * 4;
        out.data[i + 3] = Math.max(0, out.data[i + 3] - 180);
      }
    }
  }
  ctx.putImageData(out, 0, 0);
  return c.toDataURL("image/png");
};

const flipRotate = async (src: string, op: "flip-h" | "flip-v" | "rotate-90" | "rotate-270" | "rotate-180"): Promise<string> => {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const rotated = op === "rotate-90" || op === "rotate-270";
  const c = makeCanvas(rotated ? h : w, rotated ? w : h);
  const ctx = c.getContext("2d")!;
  ctx.save();
  ctx.translate(c.width / 2, c.height / 2);
  if (op === "flip-h") ctx.scale(-1, 1);
  if (op === "flip-v") ctx.scale(1, -1);
  if (op === "rotate-90") ctx.rotate(Math.PI / 2);
  if (op === "rotate-180") ctx.rotate(Math.PI);
  if (op === "rotate-270") ctx.rotate(-Math.PI / 2);
  ctx.drawImage(img, -w / 2, -h / 2);
  ctx.restore();
  return c.toDataURL("image/png");
};

const resizeImage = async (src: string, scalePct: number): Promise<string> => {
  const img = await loadImage(src);
  const w = Math.max(16, Math.round((img.naturalWidth * scalePct) / 100));
  const h = Math.max(16, Math.round((img.naturalHeight * scalePct) / 100));
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/png");
};

const stretchImage = async (src: string, sx: number, sy: number): Promise<string> => {
  const img = await loadImage(src);
  const w = Math.max(16, Math.round((img.naturalWidth * sx) / 100));
  const h = Math.max(16, Math.round((img.naturalHeight * sy) / 100));
  const c = makeCanvas(w, h);
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/png");
};

const perspectiveTilt = async (src: string, amount: number): Promise<string> => {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const slices = 60;
  const max = (amount / 100) * w * 0.35;
  for (let i = 0; i < slices; i++) {
    const sy = (i / slices) * h;
    const sh = h / slices + 1;
    const t = i / slices;
    const offset = max * (1 - t);
    const dw = w - 2 * offset;
    ctx.drawImage(img, 0, sy, w, sh, offset, sy, dw, sh);
  }
  return c.toDataURL("image/png");
};

const motionBlur = async (src: string, amount: number, angle: number): Promise<string> => {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const steps = Math.max(2, Math.min(24, Math.round(amount / 4)));
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * amount * 0.5;
  const dy = Math.sin(rad) * amount * 0.5;
  ctx.globalAlpha = 1 / steps;
  for (let i = 1; i < steps; i++) {
    ctx.drawImage(img, (dx * i) / steps, (dy * i) / steps);
    ctx.drawImage(img, (-dx * i) / steps, (-dy * i) / steps);
  }
  ctx.globalAlpha = 1;
  return c.toDataURL("image/png");
};

const tiltShift = async (src: string, focusY: number, amount: number): Promise<string> => {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  // Blurred copy
  const blurred = makeCanvas(w, h);
  const bctx = blurred.getContext("2d")!;
  (bctx as any).filter = `blur(${Math.round((amount / 100) * 18)}px)`;
  bctx.drawImage(img, 0, 0);
  (bctx as any).filter = "none";
  ctx.drawImage(blurred, 0, 0);
  // Composite sharp band around focusY
  const sharp = makeCanvas(w, h);
  const sctx = sharp.getContext("2d")!;
  sctx.drawImage(img, 0, 0);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  const fy = focusY / 100;
  const band = 0.18;
  grad.addColorStop(Math.max(0, fy - band - 0.1), "rgba(0,0,0,0)");
  grad.addColorStop(Math.max(0, fy - band), "rgba(0,0,0,1)");
  grad.addColorStop(Math.min(1, fy + band), "rgba(0,0,0,1)");
  grad.addColorStop(Math.min(1, fy + band + 0.1), "rgba(0,0,0,0)");
  sctx.globalCompositeOperation = "destination-in";
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, w, h);
  ctx.drawImage(sharp, 0, 0);
  return c.toDataURL("image/png");
};

const adjustImage = async (src: string, brightness: number, contrast: number, saturation: number): Promise<string> => {
  const img = await loadImage(src);
  const c = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = c.getContext("2d")!;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ctx.drawImage(img, 0, 0);
  ctx.filter = "none";
  return c.toDataURL("image/png");
};

const curvesImage = async (src: string, gamma: number): Promise<string> => {
  const img = await loadImage(src);
  const c = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  const g = gamma / 100;
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) lut[i] = Math.min(255, Math.max(0, Math.round(255 * Math.pow(i / 255, 1 / g))));
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = lut[d.data[i]];
    d.data[i + 1] = lut[d.data[i + 1]];
    d.data[i + 2] = lut[d.data[i + 2]];
  }
  ctx.putImageData(d, 0, 0);
  return c.toDataURL("image/png");
};

const enhanceColors = async (src: string): Promise<string> =>
  adjustImage(src, 105, 115, 130);

const shapeCrop = async (src: string, shape: "circle" | "triangle" | "rounded" | "star"): Promise<string> => {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.save();
  ctx.beginPath();
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;
  if (shape === "circle") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === "triangle") {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r * 0.85);
    ctx.lineTo(cx - r, cy + r * 0.85);
    ctx.closePath();
  } else if (shape === "rounded") {
    const rad = Math.min(w, h) * 0.18;
    ctx.moveTo(rad, 0);
    ctx.lineTo(w - rad, 0);
    ctx.quadraticCurveTo(w, 0, w, rad);
    ctx.lineTo(w, h - rad);
    ctx.quadraticCurveTo(w, h, w - rad, h);
    ctx.lineTo(rad, h);
    ctx.quadraticCurveTo(0, h, 0, h - rad);
    ctx.lineTo(0, rad);
    ctx.quadraticCurveTo(0, 0, rad, 0);
  } else {
    const spikes = 5;
    const outer = r;
    const inner = r * 0.5;
    for (let i = 0; i < spikes * 2; i++) {
      const rad = i % 2 === 0 ? outer : inner;
      const a = (Math.PI / spikes) * i - Math.PI / 2;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  return c.toDataURL("image/png");
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
  const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [resizePct, setResizePct] = useState(100);
  const [stretchX, setStretchX] = useState(100);
  const [stretchY, setStretchY] = useState(100);
  const [perspectiveAmt, setPerspectiveAmt] = useState(20);
  const [motionAmt, setMotionAmt] = useState(20);
  const [motionAngle, setMotionAngle] = useState(0);
  const [tiltFocus, setTiltFocus] = useState(50);
  const [tiltAmt, setTiltAmt] = useState(60);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [gamma, setGamma] = useState(100);
  const [expandPct, setExpandPct] = useState(20);
  const [dispDir, setDispDir] = useState<"right" | "left" | "up" | "down">("right");
  const [dispAmt, setDispAmt] = useState(40);

  // Eraser / Replace / Clone shared state
  const paintCanvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(30);
  const paintState = useRef<{ painting: boolean; mask: HTMLCanvasElement | null; cloneOffset: { x: number; y: number } }>({
    painting: false,
    mask: null,
    cloneOffset: { x: 80, y: 80 },
  });

  const cropImgRef = useRef<HTMLImageElement>(null);

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

  /* ---------- Paint canvas setup (eraser / ai-replace / clone) ---------- */
  useEffect(() => {
    const isPaintTool = activeTool === "eraser" || activeTool === "ai-replace" || activeTool === "clone";
    if (!isPaintTool || !currentImage) return;
    const canvas = paintCanvasRef.current;
    if (!canvas) return;
    loadImage(currentImage).then((img) => {
      const maxW = 480;
      const scale = Math.min(1, maxW / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mask = makeCanvas(canvas.width, canvas.height);
      paintState.current.mask = mask;
    });
  }, [activeTool, currentImage]);

  const paintPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = paintCanvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height };
  };

  const onPaintDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    paintState.current.painting = true;
    onPaintMove(e);
  };
  const onPaintMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!paintState.current.painting) return;
    const mask = paintState.current.mask!;
    const mctx = mask.getContext("2d")!;
    const { x, y } = paintPos(e);
    mctx.fillStyle = "rgba(212,175,55,0.6)";
    mctx.beginPath();
    mctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    mctx.fill();
    const ctx = paintCanvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "rgba(212,175,55,0.4)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };
  const onPaintUp = () => {
    paintState.current.painting = false;
  };

  const applyMaskedFill = async (mode: "blur" | "clone") => {
    if (!currentImage || !paintState.current.mask) return;
    setLoading(true);
    try {
      const img = await loadImage(currentImage);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const maskFull = makeCanvas(w, h);
      maskFull.getContext("2d")!.drawImage(paintState.current.mask, 0, 0, w, h);
      const maskData = maskFull.getContext("2d")!.getImageData(0, 0, w, h).data;

      const out = makeCanvas(w, h);
      const octx = out.getContext("2d")!;
      octx.drawImage(img, 0, 0);

      const src = makeCanvas(w, h);
      const sctx = src.getContext("2d")!;
      if (mode === "blur") {
        (sctx as any).filter = "blur(28px)";
        sctx.drawImage(img, 0, 0);
        (sctx as any).filter = "none";
      } else {
        // Clone: shift the source by offset
        const dx = paintState.current.cloneOffset.x;
        const dy = paintState.current.cloneOffset.y;
        sctx.drawImage(img, dx, dy);
      }
      const fillData = sctx.getImageData(0, 0, w, h).data;
      const dstData = octx.getImageData(0, 0, w, h);
      for (let i = 0; i < dstData.data.length; i += 4) {
        const m = maskData[i + 3];
        if (m > 10) {
          const a = m / 255;
          dstData.data[i] = dstData.data[i] * (1 - a) + fillData[i] * a;
          dstData.data[i + 1] = dstData.data[i + 1] * (1 - a) + fillData[i + 1] * a;
          dstData.data[i + 2] = dstData.data[i + 2] * (1 - a) + fillData[i + 2] * a;
        }
      }
      octx.putImageData(dstData, 0, 0);
      apply(out.toDataURL("image/png"));
      toast({ title: isRtl ? "تم" : "Done!" });
    } catch {
      toast({ title: isRtl ? "ما زبط" : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Crop ---------- */
  const applyCrop = async (freeMode: boolean) => {
    if (!currentImage) return;
    setLoading(true);
    try {
      const img = await loadImage(currentImage);
      const sx = (crop.x / 100) * img.naturalWidth;
      const sy = (crop.y / 100) * img.naturalHeight;
      let sw = (crop.w / 100) * img.naturalWidth;
      let sh = (crop.h / 100) * img.naturalHeight;
      if (!freeMode && aspect > 0) {
        if (sw / sh > aspect) sw = sh * aspect;
        else sh = sw / aspect;
      }
      const c = makeCanvas(Math.round(sw), Math.round(sh));
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

  const activeMeta = TOOLS.find((t) => t.id === activeTool);
  const isPaintTool = activeTool === "eraser" || activeTool === "ai-replace" || activeTool === "clone";
  const isCropTool = activeTool === "crop" || activeTool === "free-crop";

  /* ============================================================ */
  return (
    <div
      className="min-h-screen bg-background max-w-md mx-auto relative pb-56"
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        backgroundImage: "radial-gradient(ellipse at top, hsl(var(--gold) / 0.08), transparent 60%)",
      }}
    >
      <header className="flex items-center gap-3 px-4 py-4 border-b border-gold/20 bg-card/60 backdrop-blur-2xl sticky top-0 z-30">
        <button onClick={() => navigate("/studio")} className="p-2 rounded-xl hover:bg-muted" aria-label="Back">
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
      <input
        ref={bgImageInputRef}
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f || !currentImage) return;
          const url = await fileToDataURL(f);
          withProgress(() => swapBackground(currentImage, { type: "image", value: url }));
        }}
        className="hidden"
      />

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
          <div className="relative rounded-2xl overflow-hidden border border-gold/20 bg-black/40 min-h-[280px] flex items-center justify-center">
            {isCropTool ? (
              <div className="relative w-full">
                <img ref={cropImgRef} src={currentImage} alt="" className="w-full h-auto block select-none" />
                <div
                  className="absolute border-2 border-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                  style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.w}%`, height: `${crop.h}%` }}
                />
              </div>
            ) : isPaintTool ? (
              <canvas
                ref={paintCanvasRef}
                className="w-full h-auto block touch-none cursor-crosshair"
                onPointerDown={onPaintDown}
                onPointerMove={onPaintMove}
                onPointerUp={onPaintUp}
                onPointerLeave={onPaintUp}
              />
            ) : (
              <img src={currentImage} alt="Editing" className="w-full h-auto block" />
            )}
            {loading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl gradient-gold flex items-center justify-center animate-pulse-glow">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="text-xs text-foreground font-cairo text-center px-4">
                  {isRtl ? "الخال شغال في المدار.. بظبط في أبعاد الصورة" : "Al-Khal is tuning your image..."}
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
              download="madar.png"
              className="flex-1 py-2.5 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 font-cairo"
            >
              <Download className="w-3.5 h-3.5" />
              {isRtl ? "حفظ" : "Save"}
            </a>
          </div>

          {/* Active tool panel */}
          {activeTool && activeMeta && (
            <div className="mt-3 rounded-2xl border border-gold/30 bg-card/60 backdrop-blur-2xl p-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold font-cairo text-gold">{isRtl ? activeMeta.ar : activeMeta.en}</p>
                <button onClick={() => setActiveTool(null)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {activeTool === "recolor" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-border" />
                    <button onClick={() => withProgress(() => recolorImage(currentImage, color))} className="flex-1 py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                      {isRtl ? "طبّق اللون" : "Apply color"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button key={p.name} onClick={() => withProgress(() => recolorImage(currentImage, p.hex))} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-background/50 active:scale-95">
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
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-border" />
                    <button onClick={() => withProgress(() => swapBackground(currentImage, { type: "color", value: color }))} className="flex-1 py-2 rounded-xl bg-background/60 border border-gold/30 text-foreground text-xs font-semibold font-cairo active:scale-95">
                      {isRtl ? "خلفية لون" : "Solid"}
                    </button>
                    <button onClick={() => bgImageInputRef.current?.click()} className="flex-1 py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                      {isRtl ? "ارفع خلفية" : "Upload"}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {BG_TEXTURES.map((b) => (
                      <button key={b.name} onClick={() => withProgress(() => swapBackground(currentImage, { type: "image", value: b.url }))} className="relative aspect-square rounded-xl overflow-hidden border border-border active:scale-95">
                        <img src={b.url} alt={b.name} className="w-full h-full object-cover" loading="lazy" />
                        <span className="absolute inset-x-0 bottom-0 text-[9px] font-cairo bg-black/60 text-white py-0.5 text-center">{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isPaintTool && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-cairo text-muted-foreground">{isRtl ? "حجم الفرشاة" : "Brush"}</span>
                    <input type="range" min={10} max={120} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="text-[10px] font-cairo text-foreground w-6 text-end">{brushSize}</span>
                  </div>
                  <button
                    onClick={() => applyMaskedFill(activeTool === "clone" ? "clone" : "blur")}
                    className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95"
                  >
                    {activeTool === "eraser" && (isRtl ? "محو ذكي" : "Smart erase")}
                    {activeTool === "ai-replace" && (isRtl ? "تبديل ذكي" : "AI replace")}
                    {activeTool === "clone" && (isRtl ? "استنساخ المنطقة" : "Clone area")}
                  </button>
                  <p className="text-[10px] text-muted-foreground font-cairo text-center">
                    {isRtl ? "ارسم على المنطقة المستهدفة" : "Paint over the target area"}
                  </p>
                </div>
              )}

              {activeTool === "textify" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTextColor("#ffffff")} className={`flex-1 py-2 rounded-xl border text-xs font-cairo ${textColor === "#ffffff" ? "border-gold bg-gold/10" : "border-border bg-background/50"}`}>
                      {isRtl ? "أبيض" : "White"}
                    </button>
                    <button onClick={() => setTextColor("#000000")} className={`flex-1 py-2 rounded-xl border text-xs font-cairo ${textColor === "#000000" ? "border-gold bg-gold/10" : "border-border bg-background/50"}`}>
                      {isRtl ? "أسود" : "Black"}
                    </button>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-border" />
                  </div>
                  <button onClick={() => withProgress(() => textifyImage(currentImage, textColor))} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                    {isRtl ? "حوّل لـ ASCII" : "Convert to ASCII"}
                  </button>
                </div>
              )}

              {isCropTool && (
                <div className="space-y-3">
                  {activeTool === "crop" && (
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_RATIOS.map((a) => (
                        <button key={a.label} onClick={() => setAspect(a.value)} className={`px-3 py-1.5 rounded-full text-[10px] font-cairo border ${aspect === a.value ? "border-gold bg-gold/15 text-gold" : "border-border text-foreground bg-background/50"}`}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {(["x", "y", "w", "h"] as const).map((k) => (
                      <label key={k} className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                        <span className="uppercase w-4">{k}</span>
                        <input type="range" min={0} max={100} value={crop[k]} onChange={(e) => setCrop((c) => ({ ...c, [k]: Math.min(100, Math.max(0, Number(e.target.value))) }))} className="flex-1 accent-[hsl(var(--gold))]" />
                      </label>
                    ))}
                  </div>
                  <button onClick={() => applyCrop(activeTool === "free-crop")} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95 flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" />
                    {isRtl ? "طبّق القص" : "Apply crop"}
                  </button>
                </div>
              )}

              {activeTool === "shape-crop" && (
                <div className="grid grid-cols-4 gap-2">
                  {(["circle", "rounded", "triangle", "star"] as const).map((s) => (
                    <button key={s} onClick={() => withProgress(() => shapeCrop(currentImage, s))} className="py-3 rounded-xl border border-gold/30 bg-background/60 text-[11px] font-cairo text-foreground active:scale-95 capitalize">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {activeTool === "perspective" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-10">{isRtl ? "ميل" : "Tilt"}</span>
                    <input type="range" min={0} max={100} value={perspectiveAmt} onChange={(e) => setPerspectiveAmt(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-8 text-end text-foreground">{perspectiveAmt}</span>
                  </label>
                  <button onClick={() => withProgress(() => perspectiveTilt(currentImage, perspectiveAmt))} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                    {isRtl ? "طبّق المنظور" : "Apply perspective"}
                  </button>
                </div>
              )}

              {activeTool === "resize" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-12">{isRtl ? "حجم %" : "Scale %"}</span>
                    <input type="range" min={10} max={200} value={resizePct} onChange={(e) => setResizePct(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-10 text-end text-foreground">{resizePct}%</span>
                  </label>
                  <button onClick={() => withProgress(() => resizeImage(currentImage, resizePct))} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                    {isRtl ? "غيّر الحجم" : "Resize"}
                  </button>
                </div>
              )}

              {activeTool === "flip-rotate" && (
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["flip-h", isRtl ? "عكس أفقي" : "Flip H"],
                    ["flip-v", isRtl ? "عكس رأسي" : "Flip V"],
                    ["rotate-90", isRtl ? "تدوير 90°" : "Rotate 90°"],
                    ["rotate-180", isRtl ? "تدوير 180°" : "Rotate 180°"],
                    ["rotate-270", isRtl ? "تدوير -90°" : "Rotate -90°"],
                  ] as const).map(([op, label]) => (
                    <button key={op} onClick={() => withProgress(() => flipRotate(currentImage, op as any))} className="py-2.5 rounded-xl border border-gold/30 bg-background/60 text-[11px] font-cairo text-foreground active:scale-95">
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {activeTool === "ai-enhance" && (
                <button onClick={() => withProgress(() => aiEnhance(currentImage))} className="w-full py-2.5 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                  {isRtl ? "حسّن تلقائياً" : "Auto enhance"}
                </button>
              )}

              {activeTool === "ai-expand" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-12">{isRtl ? "توسيع %" : "Pad %"}</span>
                    <input type="range" min={5} max={60} value={expandPct} onChange={(e) => setExpandPct(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-10 text-end text-foreground">{expandPct}%</span>
                  </label>
                  <button onClick={() => withProgress(() => aiExpand(currentImage, expandPct))} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                    {isRtl ? "وسّع الكانفس" : "Expand canvas"}
                  </button>
                </div>
              )}

              {activeTool === "dispersion" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-1">
                    {(["left", "right", "up", "down"] as const).map((d) => (
                      <button key={d} onClick={() => setDispDir(d)} className={`py-1.5 rounded-lg text-[10px] font-cairo border ${dispDir === d ? "border-gold bg-gold/15 text-gold" : "border-border text-foreground bg-background/50"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-12">{isRtl ? "شدة" : "Intensity"}</span>
                    <input type="range" min={10} max={100} value={dispAmt} onChange={(e) => setDispAmt(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-8 text-end text-foreground">{dispAmt}</span>
                  </label>
                  <button onClick={() => withProgress(() => dispersionEffect(currentImage, dispDir, dispAmt))} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                    {isRtl ? "شتت الجزيئات" : "Disperse"}
                  </button>
                </div>
              )}

              {activeTool === "curves" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-12">Gamma</span>
                    <input type="range" min={30} max={250} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-10 text-end text-foreground">{gamma}</span>
                  </label>
                  <button onClick={() => withProgress(() => curvesImage(currentImage, gamma))} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                    {isRtl ? "طبّق المنحنى" : "Apply curve"}
                  </button>
                </div>
              )}

              {activeTool === "adjust" && (
                <div className="space-y-2">
                  {([
                    ["B", brightness, setBrightness],
                    ["C", contrast, setContrast],
                    ["S", saturation, setSaturation],
                  ] as const).map(([k, v, set]) => (
                    <label key={k} className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                      <span className="w-4 text-foreground">{k}</span>
                      <input type="range" min={0} max={200} value={v} onChange={(e) => set(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                      <span className="w-10 text-end text-foreground">{v}%</span>
                    </label>
                  ))}
                  <button onClick={() => withProgress(() => adjustImage(currentImage, brightness, contrast, saturation))} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                    {isRtl ? "طبّق الضبط" : "Apply adjust"}
                  </button>
                </div>
              )}

              {activeTool === "enhance" && (
                <button onClick={() => withProgress(() => enhanceColors(currentImage))} className="w-full py-2.5 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                  {isRtl ? "حسّن الألوان" : "Enhance colors"}
                </button>
              )}

              {activeTool === "stretch" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-4">X</span>
                    <input type="range" min={30} max={200} value={stretchX} onChange={(e) => setStretchX(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-10 text-end text-foreground">{stretchX}%</span>
                  </label>
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-4">Y</span>
                    <input type="range" min={30} max={200} value={stretchY} onChange={(e) => setStretchY(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-10 text-end text-foreground">{stretchY}%</span>
                  </label>
                  <button onClick={() => withProgress(() => stretchImage(currentImage, stretchX, stretchY))} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                    {isRtl ? "مطّط" : "Stretch"}
                  </button>
                </div>
              )}

              {activeTool === "motion" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-12">{isRtl ? "شدة" : "Amount"}</span>
                    <input type="range" min={5} max={80} value={motionAmt} onChange={(e) => setMotionAmt(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-8 text-end text-foreground">{motionAmt}</span>
                  </label>
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-12">{isRtl ? "زاوية" : "Angle"}</span>
                    <input type="range" min={0} max={360} value={motionAngle} onChange={(e) => setMotionAngle(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-8 text-end text-foreground">{motionAngle}°</span>
                  </label>
                  <button onClick={() => withProgress(() => motionBlur(currentImage, motionAmt, motionAngle))} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                    {isRtl ? "ضباب حركة" : "Motion blur"}
                  </button>
                </div>
              )}

              {activeTool === "tilt-shift" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-12">{isRtl ? "تركيز" : "Focus"}</span>
                    <input type="range" min={0} max={100} value={tiltFocus} onChange={(e) => setTiltFocus(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-8 text-end text-foreground">{tiltFocus}</span>
                  </label>
                  <label className="text-[10px] font-cairo text-muted-foreground flex items-center gap-2">
                    <span className="w-12">{isRtl ? "ضباب" : "Blur"}</span>
                    <input type="range" min={10} max={100} value={tiltAmt} onChange={(e) => setTiltAmt(Number(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]" />
                    <span className="w-8 text-end text-foreground">{tiltAmt}</span>
                  </label>
                  <button onClick={() => withProgress(() => tiltShift(currentImage, tiltFocus, tiltAmt))} className="w-full py-2 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold font-cairo active:scale-95">
                    {isRtl ? "عزل العدسة" : "Apply tilt shift"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Compact Madar tools panel — 5-col grid, smaller tiles so preview stays visible */}
      {currentImage && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-card/92 backdrop-blur-2xl border-t border-gold/30 shadow-[0_-8px_30px_rgba(212,175,55,0.15)]">
          <div className="max-w-md mx-auto px-3 pt-2 pb-3">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-cairo text-gold/80 font-bold tracking-wide">
                {isRtl ? `${TOOLS.length} أداة مدار` : `${TOOLS.length} Madar Tools`}
              </span>
              <span className="h-1 w-8 rounded-full bg-gold/40" />
            </div>
            <div
              className="grid grid-cols-8 gap-1 max-h-[26vh] overflow-y-auto pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {TOOLS.map((t) => {
                const active = activeTool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (t.id === "remove-bg") {
                        withProgress(() => removeBackground(currentImage));
                        setActiveTool(null);
                        return;
                      }
                      setActiveTool((prev) => (prev === t.id ? null : t.id));
                    }}
                    disabled={loading}
                    className={`flex flex-col items-center justify-center gap-0.5 h-[48px] rounded-lg border transition-all active:scale-95 disabled:opacity-50 ${
                      active
                        ? "gradient-gold text-primary-foreground shadow shadow-gold/40 border-gold"
                        : "bg-background/60 text-foreground border-gold/25 hover:border-gold/60"
                    }`}
                  >
                    <t.icon className="w-3 h-3" />
                    <span className="text-[7px] font-cairo font-bold leading-none text-center px-0.5 line-clamp-1">
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
