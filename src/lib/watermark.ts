// Apply a subtle "Madar" watermark to a base64/dataURL image.
// Returns a new PNG dataURL. Falls back to original on failure.

export const addZoolWatermark = async (imageDataUrl: string): Promise<string> => {
  try {
    const img = await loadImage(imageDataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return imageDataUrl;
    ctx.drawImage(img, 0, 0);

    const fontSize = Math.max(14, Math.round(canvas.width * 0.025));
    const padding = Math.round(fontSize * 0.8);
    const text = "✦ Madar";
    ctx.font = `700 ${fontSize}px Tajawal, Inter, sans-serif`;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "right";

    // soft dark backdrop pill
    const metrics = ctx.measureText(text);
    const tw = metrics.width;
    const th = fontSize * 1.25;
    const x = canvas.width - padding;
    const y = canvas.height - padding;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRect(ctx, x - tw - padding * 0.6, y - th - padding * 0.15, tw + padding * 1.2, th + padding * 0.3, th * 0.4);
    ctx.fill();

    // gold gradient text
    const grad = ctx.createLinearGradient(x - tw, 0, x, 0);
    grad.addColorStop(0, "#F5D27A");
    grad.addColorStop(1, "#E8B547");
    ctx.fillStyle = grad;
    ctx.fillText(text, x, y - padding * 0.1);

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
