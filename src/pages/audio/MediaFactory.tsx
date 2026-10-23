import { ArrowLeft, Download, Film, Music2, Image as ImageIcon, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useUser } from "@/store/userStore";
import { useZoolCredits } from "@/lib/zoolCredits";
import ZoolAdModal from "@/components/ZoolAdModal";
import StudioProgress from "@/components/audio/StudioProgress";
import { isVideoFile, downloadBlob } from "@/lib/audioMixer";
import { extractAudioFile, renderImageWithAudio } from "@/lib/mediaPipeline";
import { toast } from "sonner";

const TOOL_ID = "media-factory";

const MediaFactory = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const { credits, consume } = useZoolCredits(TOOL_ID);

  const [mode, setMode] = useState<"video2audio" | "photo+audio">("video2audio");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const videoRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const startExport = async () => {
    if (busy) return;
    if (credits <= 0) {
      setAdOpen(true);
      return;
    }
    if (mode === "video2audio" && !videoFile) {
      toast.error(isRtl ? "اختار فيديو الأول يا هندسة" : "Pick a video first");
      return;
    }
    if (mode === "photo+audio" && (!imageFile || !audioFile)) {
      toast.error(isRtl ? "محتاج صورة وملف صوتي" : "Need both image and audio");
      return;
    }

    setBusy(true);
    setProgress(0.05);
    try {
      if (mode === "video2audio") {
        if (!videoFile) return;
        if (!isVideoFile(videoFile)) {
          toast.error(isRtl ? "الملف لازم يكون فيديو" : "Must be a video file");
          setBusy(false);
          return;
        }
        const { blob, ext } = await extractAudioFile(videoFile, (r) =>
          setProgress(0.1 + r * 0.85),
        );
        downloadBlob(blob, `rasma-audio-${Date.now()}.${ext}`);
        consume();
      } else {
        if (!imageFile || !audioFile) return;
        const blob = await renderImageWithAudio(imageFile, audioFile, (r) =>
          setProgress(0.1 + r * 0.85),
        );
        downloadBlob(blob, `rasma-video-${Date.now()}.mp4`);
        consume();
      }
      toast.success(isRtl ? "تم الكرب! ✓" : "Exported!");
    } catch (e) {
      console.error(e);
      toast.error(isRtl ? "في خلل بسيط، جرب تاني" : "Something failed, try again");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-24" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/audio-studio")} className="p-1.5 rounded-xl hover:bg-muted" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground">
            {isRtl ? "مصنع الميديا" : "Media Factory"}
          </h1>
          <p className="text-[10px] text-muted-foreground">
            {isRtl ? `متبقي ${credits} فزعات` : `${credits} uses left`}
          </p>
        </div>
      </header>

      {/* Mode toggle */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border p-1 grid grid-cols-2 gap-1">
          {(["video2audio", "photo+audio"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2.5 rounded-xl text-xs font-bold font-cairo transition-all ${
                mode === m
                  ? "gradient-gold text-primary-foreground shadow"
                  : "text-foreground/70 hover:bg-muted"
              }`}
            >
              {m === "video2audio"
                ? isRtl ? "فيديو ← صوت" : "Video → Audio"
                : isRtl ? "صورة + صوت ← فيديو" : "Photo + Audio → Video"}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="px-4 mt-4 space-y-3">
        {mode === "video2audio" ? (
          <UploadCard
            icon={Film}
            label={isRtl ? "اختار فيديو" : "Pick a video"}
            sub={videoFile?.name}
            onClick={() => videoRef.current?.click()}
          />
        ) : (
          <>
            <UploadCard
              icon={ImageIcon}
              label={isRtl ? "اختار صورة" : "Pick a photo"}
              sub={imageFile?.name}
              onClick={() => imageRef.current?.click()}
            />
            <UploadCard
              icon={Music2}
              label={isRtl ? "اختار ملف صوتي" : "Pick audio"}
              sub={audioFile?.name}
              onClick={() => audioRef.current?.click()}
            />
          </>
        )}
        <input ref={videoRef} type="file" accept="video/*" className="hidden"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
        <input ref={imageRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
        <input ref={audioRef} type="file" accept="audio/*" className="hidden"
          onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} />
      </div>

      {/* Export */}
      <div className="px-4 mt-5">
        <button
          onClick={startExport}
          disabled={busy}
          className="w-full py-3.5 rounded-2xl gradient-gold text-primary-foreground font-bold font-cairo flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {credits > 0
            ? isRtl ? "صدّر الكرب" : "Export"
            : isRtl ? "شوف إعلان لتفتح الإكسبورت" : "Watch ad to unlock export"}
        </button>
      </div>

      <StudioProgress
        open={busy}
        progress={progress}
        isRtl={isRtl}
        message={isRtl ? "الخال شغال.. بجهز ليك الفزعة" : "Processing your media..."}
      />
      <ZoolAdModal open={adOpen} toolId={TOOL_ID} isRtl={isRtl} onClose={() => setAdOpen(false)} />
    </div>
  );
};

const UploadCard = ({ icon: Icon, label, sub, onClick }: { icon: typeof Upload; label: string; sub?: string; onClick: () => void }) => (
  <button onClick={onClick} className="w-full rounded-2xl border border-dashed border-gold/40 bg-card/40 backdrop-blur p-4 flex items-center gap-3 active:scale-[0.99] transition-transform">
    <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center">
      <Icon className="w-5 h-5 text-gold" />
    </div>
    <div className="flex-1 text-start min-w-0">
      <p className="text-sm font-bold font-cairo text-foreground">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground font-cairo truncate">{sub}</p>}
    </div>
  </button>
);

export const SignatureToggle = ({ value, onChange, isRtl }: { value: boolean; onChange: (v: boolean) => void; isRtl: boolean }) => (
  <div className="px-4 mt-4">
    <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent backdrop-blur p-3.5 flex items-center gap-3">
      <span className="text-2xl">✦</span>
      <div className="flex-1">
        <p className="text-sm font-bold font-cairo text-foreground">{isRtl ? "بصمة الخال" : "Al-Khal Signature"}</p>
        <p className="text-[10.5px] text-muted-foreground font-cairo">
          {isRtl ? "يضيف عبارة سودانية ساخنة في نهاية المقطع" : "Adds a Sudanese sign-off at the end"}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full relative transition-colors ${value ? "bg-gold" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-background transition-all ${value ? (isRtl ? "right-0.5" : "left-[calc(100%-1.375rem)]") : (isRtl ? "right-[calc(100%-1.375rem)]" : "left-0.5")}`} />
      </button>
    </div>
  </div>
);

export default MediaFactory;
