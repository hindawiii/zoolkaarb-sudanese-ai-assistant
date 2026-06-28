// Apply the official Madar logo watermark to a base64/dataURL image.
// Returns a new PNG dataURL. Falls back to original on failure.
import madarLogo from "@/assets/madar-logo.png.asset.json";

let cachedLogo: HTMLImageElement | null = null;

const getLogo = async (): Promise<HTMLImageElement> => {
  if (cachedLogo) return cachedLogo;
  cachedLogo = await loadImage(madarLogo.url);
  return cachedLogo;
};

export const addZoolWatermark = async (imageDataUrl: string): Promise<string> => {
  try {
    const [img, logo] = await Promise.all([loadImage(imageDataUrl), getLogo()]);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return imageDataUrl;
    ctx.drawImage(img, 0, 0);

    // Logo sized to ~14% of width, anchored bottom-right with padding.
    const targetW = Math.max(72, Math.round(canvas.width * 0.14));
    const ratio = (logo.naturalHeight || logo.height) / (logo.naturalWidth || logo.width || 1);
    const targetH = Math.round(targetW * ratio);
    const padding = Math.round(Math.min(canvas.width, canvas.height) * 0.025);

    const x = canvas.width - targetW - padding;
    const y = canvas.height - targetH - padding;

    // Soft dark glass pill behind the logo
    const pillPad = Math.round(targetH * 0.25);
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    roundRect(
      ctx,
      x - pillPad,
      y - pillPad,
      targetW + pillPad * 2,
      targetH + pillPad * 2,
      (targetH + pillPad * 2) * 0.28,
    );
    ctx.fill();

    // Thin gold border
    ctx.strokeStyle = "rgba(212,175,55,0.75)";
    ctx.lineWidth = Math.max(1, Math.round(targetW * 0.012));
    roundRect(
      ctx,
      x - pillPad,
      y - pillPad,
      targetW + pillPad * 2,
      targetH + pillPad * 2,
      (targetH + pillPad * 2) * 0.28,
    );
    ctx.stroke();

    // Render logo inverted to white for visibility on dark glass
    const off = document.createElement("canvas");
    off.width = targetW;
    off.height = targetH;
    const octx = off.getContext("2d");
    if (octx) {
      octx.drawImage(logo, 0, 0, targetW, targetH);
      octx.globalCompositeOperation = "source-in";
      const grad = octx.createLinearGradient(0, 0, targetW, 0);
      grad.addColorStop(0, "#F5D27A");
      grad.addColorStop(1, "#E8B547");
      octx.fillStyle = grad;
      octx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(off, x, y);
    } else {
      ctx.drawImage(logo, x, y, targetW, targetH);
    }

    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("watermark failed", e);
    return imageDataUrl;
  }
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};
