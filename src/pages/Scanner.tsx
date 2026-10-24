import { ArrowLeft, Camera, Download, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import { pickSudaneseMessage } from "@/lib/sudaneseLoading";
import { toast } from "@/hooks/use-toast";

type Filter = "bw" | "contrast" | "none";

const applyFilter = (img: HTMLImageElement, filter: Filter): string => {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  if (filter === "none") return canvas.toDataURL("image/jpeg", 0.92);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const gray = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
    if (filter === "bw") {
      const v = gray > 140 ? 255 : 0;
      px[i] = px[i + 1] = px[i + 2] = v;
    } else {
      // high contrast grayscale
      const c = Math.max(0, Math.min(255, (gray - 128) * 1.6 + 128));
      px[i] = px[i + 1] = px[i + 2] = c;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
};

const Scanner = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawUrl, setRawUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("contrast");
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawUrl(reader.result as string);
      processImage(reader.result as string, filter);
    };
    reader.readAsDataURL(f);
  };

  const processImage = (url: string, f: Filter) => {
    setLoading(true);
    setMsg(pickSudaneseMessage());
    const img = new Image();
    img.onload = () => {
      try {
        setProcessedUrl(applyFilter(img, f));
      } finally {
        setLoading(false);
      }
    };
    img.onerror = () => setLoading(false);
    img.src = url;
  };

  const changeFilter = (f: Filter) => {
    setFilter(f);
    if (rawUrl) processImage(rawUrl, f);
  };

  const exportPdf = () => {
    if (!processedUrl) return;
    const img = new Image();
    img.onload = () => {
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / img.width, pageH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      pdf.addImage(processedUrl, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
      pdf.save(`scan-${Date.now()}.pdf`);
      toast({ title: "تمام!", description: "PDF saved" });
    };
    img.src = processedUrl;
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/office")} aria-label="العودة إلى المكتب" className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-bold font-cairo text-foreground" dir="rtl">ماسح المستندات</h1>
          <p className="text-[10px] text-muted-foreground">Document Scanner</p>
        </div>
      </header>

      <div className="px-5 mt-5 space-y-4">
        {!rawUrl && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-3xl border-2 border-dashed border-border bg-card p-10 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-nile/20 flex items-center justify-center">
              <Camera className="w-6 h-6 text-nile" />
            </div>
            <p className="text-sm font-semibold text-foreground">Capture a document</p>
            <p className="text-xs text-muted-foreground font-cairo" dir="rtl">صور المستند بالكاميرا</p>
          </button>
        )}

        {processedUrl && (
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <img src={processedUrl} alt="scan" className="w-full object-contain bg-muted" />
          </div>
        )}

        {loading && (
          <div className="rounded-2xl bg-card border border-border p-5 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-gold animate-spin shrink-0" />
            <p className="text-sm font-cairo text-foreground" dir="rtl">{msg}</p>
          </div>
        )}

        {rawUrl && (
          <>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Filter
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "contrast", label: "Scan" },
                  { id: "bw", label: "B&W" },
                  { id: "none", label: "Original" },
                ] as const).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => changeFilter(f.id)}
                    className={`rounded-xl py-2.5 text-xs font-semibold transition-colors ${
                      filter === f.id
                        ? "gradient-gold text-primary-foreground"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={exportPdf}
              disabled={!processedUrl || loading}
              className="w-full rounded-full gradient-gold text-primary-foreground py-3.5 font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
            >
              <Download className="w-4 h-4" /> Save as PDF
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-full border border-border py-3 text-sm font-semibold text-foreground"
            >
              Capture another
            </button>
          </>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPick}
        />
      </div>
    </div>
  );
};

export default Scanner;
