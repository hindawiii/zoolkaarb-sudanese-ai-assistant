import { ArrowLeft, ArrowRightLeft, FileType2, Loader2, Sparkles, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useUser } from "@/store/userStore";
import { useZoolCredits } from "@/lib/zoolCredits";
import { convertViaAi, markdownToDocx, textToPdf } from "@/lib/officeTools";
import ZoolAdModal from "@/components/ZoolAdModal";
import StudioProgress from "@/components/audio/StudioProgress";
import { toast } from "@/hooks/use-toast";

type Mode = "pdf-to-word" | "word-to-pdf";

const Converter = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const { credits, consume } = useZoolCredits("office");
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("pdf-to-word");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAd, setShowAd] = useState(false);

  const accept = mode === "pdf-to-word" ? "application/pdf,image/*" : ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = "";
  };

  const swap = () => {
    setMode((m) => (m === "pdf-to-word" ? "word-to-pdf" : "pdf-to-word"));
    setFile(null);
  };

  const run = async () => {
    if (!file) {
      toast({ title: isRtl ? "اختر ملف" : "Pick a file", variant: "destructive" });
      return;
    }
    if (credits <= 0) {
      setShowAd(true);
      return;
    }
    setBusy(true);
    setProgress(0.15);
    let ticker: ReturnType<typeof setInterval> | undefined;
    try {
      // Animate up while we wait on the server.
      ticker = setInterval(() => {
        setProgress((p) => (p < 0.85 ? p + 0.05 : p));
      }, 400);
      const md = await convertViaAi(file, mode);
      clearInterval(ticker);
      setProgress(0.95);

      if (mode === "pdf-to-word") {
        await markdownToDocx(md, `zool-karb-${Date.now()}.docx`);
      } else {
        await textToPdf(md, `zool-karb-${Date.now()}.pdf`);
      }
      setProgress(1);
      consume();
      toast({ title: isRtl ? "تمام يا هندسة!" : "Done!", description: isRtl ? "تم حفظ الملف" : "File saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed", variant: "destructive" });
    } finally {
      clearInterval(ticker);
      setTimeout(() => {
        setBusy(false);
        setProgress(0);
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-12">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/office")} className="p-1.5 rounded-xl hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-base font-bold font-cairo text-foreground" dir="rtl">
              محوّل PDF ↔ Word
            </h1>
            <p className="text-[10px] text-muted-foreground">Arabic-optimized</p>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-[11px] font-bold text-gold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {credits}
        </div>
      </header>

      <div className="px-5 mt-5 space-y-4">
        <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border p-4 flex items-center justify-between gap-3">
          <div className="flex-1 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
            <p className="font-bold font-cairo text-foreground mt-1">
              {mode === "pdf-to-word" ? "PDF" : "Word"}
            </p>
          </div>
          <button
            onClick={swap}
            className="w-10 h-10 rounded-full gradient-gold text-primary-foreground flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Swap"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To</p>
            <p className="font-bold font-cairo text-foreground mt-1">
              {mode === "pdf-to-word" ? "Word" : "PDF"}
            </p>
          </div>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-border bg-card p-6 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center">
            <Upload className="w-5 h-5 text-gold" />
          </div>
          <p className="text-sm font-semibold font-cairo text-foreground">
            {file ? file.name : isRtl ? "ارفع ملف" : "Upload file"}
          </p>
          <p className="text-[10px] text-muted-foreground font-cairo">
            {mode === "pdf-to-word" ? "PDF / صورة" : ".doc / .docx"}
          </p>
        </button>

        <div className="rounded-2xl bg-card/40 border border-border/60 p-3 flex items-start gap-2">
          <FileType2 className="w-4 h-4 text-gold mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground font-cairo leading-relaxed" dir="rtl">
            {isRtl
              ? "بنستخدم ذكاء الخال علشان النص العربي يطلع مظبوط، مش مقلوب."
              : "Powered by AI OCR — Arabic stays in correct order."}
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onPick}
        />

        <button
          onClick={run}
          disabled={busy || !file}
          className="w-full rounded-full gradient-gold text-primary-foreground py-3.5 font-bold font-cairo flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {credits > 0
            ? isRtl
              ? "ابدأ التحويل"
              : "Convert"
            : isRtl
            ? "شوف إعلان عشان تواصل"
            : "Watch ad to continue"}
        </button>

        {credits === 0 && (
          <p className="text-center text-xs font-cairo text-muted-foreground" dir="rtl">
            {isRtl ? "يا هندسة، الورق كتر؟ أحضر إعلان وسلك أمورك مع الخال!" : "Out of credits — watch an ad to continue."}
          </p>
        )}
      </div>

      <StudioProgress
        open={busy}
        progress={progress}
        isRtl={isRtl}
        message={isRtl ? "الخال شغال في المكتب.. بظبط ليك الورق" : "Al-Khal is processing your document..."}
      />
      <ZoolAdModal
        open={showAd}
        toolId="office"
        isRtl={isRtl}
        onClose={() => setShowAd(false)}
      />
    </div>
  );
};

export default Converter;
