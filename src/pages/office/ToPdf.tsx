import { ArrowLeft, FileImage, FileType, Loader2, Plus, Trash2, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useUser } from "@/store/userStore";
import { useZoolCredits } from "@/lib/zoolCredits";
import { imagesToPdf, textToPdf } from "@/lib/officeTools";
import ZoolAdModal from "@/components/ZoolAdModal";
import { toast } from "@/hooks/use-toast";

type Tab = "images" | "text";

const ToPdf = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const { credits, consume } = useZoolCredits("office");
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("images");
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAd, setShowAd] = useState(false);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = Array.from(e.target.files ?? []);
    if (fl.length) setFiles((p) => [...p, ...fl]);
    e.target.value = "";
  };

  const removeAt = (i: number) => setFiles((p) => p.filter((_, idx) => idx !== i));

  const doExport = async () => {
    if (credits <= 0) {
      setShowAd(true);
      return;
    }
    setBusy(true);
    try {
      if (tab === "images") {
        if (!files.length) throw new Error(isRtl ? "اختر صورة على الأقل" : "Pick at least one image");
        await imagesToPdf(files);
      } else {
        if (!text.trim()) throw new Error(isRtl ? "اكتب أي نص" : "Type some text");
        await textToPdf(text);
      }
      consume();
      toast({ title: isRtl ? "تمام يا هندسة!" : "Done!", description: "PDF saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed", variant: "destructive" });
    } finally {
      setBusy(false);
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
              صور / نص → PDF
            </h1>
            <p className="text-[10px] text-muted-foreground">Image / Text → PDF</p>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-[11px] font-bold text-gold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {credits}
        </div>
      </header>

      <div className="px-5 mt-5">
        <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border p-1 grid grid-cols-2 gap-1">
          <button
            onClick={() => setTab("images")}
            className={`py-2 rounded-xl text-xs font-semibold font-cairo flex items-center justify-center gap-1.5 transition-colors ${
              tab === "images" ? "gradient-gold text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            {isRtl ? "صور" : "Images"}
          </button>
          <button
            onClick={() => setTab("text")}
            className={`py-2 rounded-xl text-xs font-semibold font-cairo flex items-center justify-center gap-1.5 transition-colors ${
              tab === "text" ? "gradient-gold text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <FileType className="w-3.5 h-3.5" />
            {isRtl ? "نص" : "Text"}
          </button>
        </div>

        {tab === "images" && (
          <div className="mt-4 space-y-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-border bg-card p-6 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 rounded-xl bg-nile/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-nile" />
              </div>
              <p className="text-sm font-semibold font-cairo text-foreground">
                {isRtl ? "أضف صور" : "Add images"}
              </p>
              <p className="text-[10px] text-muted-foreground font-cairo">
                {isRtl ? "كل صورة بتطلع في صفحة" : "One image per page"}
              </p>
            </button>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-card border border-border p-3 flex items-center gap-3"
                  >
                    <span className="text-xs w-6 h-6 rounded-md bg-muted flex items-center justify-center font-mono">
                      {i + 1}
                    </span>
                    <p className="text-xs flex-1 truncate text-foreground">{f.name}</p>
                    <button
                      onClick={() => removeAt(i)}
                      className="p-1.5 rounded-lg hover:bg-muted text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPick}
            />
          </div>
        )}

        {tab === "text" && (
          <div className="mt-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              dir="auto"
              rows={10}
              placeholder={isRtl ? "اكتب أو الصق النص هنا..." : "Type or paste text..."}
              className="w-full rounded-2xl bg-card border border-border p-4 text-sm font-cairo text-foreground resize-y"
            />
          </div>
        )}

        <button
          onClick={doExport}
          disabled={busy}
          className="mt-5 w-full rounded-full gradient-gold text-primary-foreground py-3.5 font-bold font-cairo flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {credits > 0
            ? isRtl
              ? "حوّل لـ PDF"
              : "Export PDF"
            : isRtl
            ? "شوف إعلان عشان تواصل"
            : "Watch ad to continue"}
        </button>

        {credits === 0 && (
          <p className="mt-3 text-center text-xs font-cairo text-muted-foreground" dir="rtl">
            {isRtl ? "يا هندسة، الورق كتر؟ أحضر إعلان وسلك أمورك مع الخال!" : "Out of credits — watch an ad to continue."}
          </p>
        )}
      </div>

      <ZoolAdModal
        open={showAd}
        toolId="office"
        isRtl={isRtl}
        onClose={() => setShowAd(false)}
      />
    </div>
  );
};

export default ToPdf;
