import BackButton from "@/components/BackButton";
import { useUser } from "@/store/userStore";
import { Upload, Download, Loader2, Share2, Facebook, Sparkles, Image as ImageIcon, Video, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { pickSudaneseMessage } from "@/lib/sudaneseLoading";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { getFFmpeg, fetchFile, runMediaJob } from "@/lib/ffmpegClient";

type MediaKind = "image" | "video" | "audio";
type VideoProfile = "whatsapp" | "balanced";

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
};

const detectKind = (f: File): MediaKind | null => {
  if (f.type.startsWith("image/")) return "image";
  if (f.type.startsWith("video/")) return "video";
  if (f.type.startsWith("audio/")) return "audio";
  const n = f.name.toLowerCase();
  if (/\.(mp4|mov|webm|mkv|avi)$/.test(n)) return "video";
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(n)) return "audio";
  if (/\.(jpg|jpeg|png|webp|gif|bmp)$/.test(n)) return "image";
  return null;
};

const DataSaver = () => {
  const isAr = useUser().language === "ar";
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [original, setOriginal] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [kind, setKind] = useState<MediaKind | null>(null);
  const [compressed, setCompressed] = useState<File | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [videoProfile, setVideoProfile] = useState<VideoProfile>("whatsapp");

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalUrl, compressedUrl]);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || loading) return;
    if (f.size > 100 * 1024 * 1024) { toast({ title: (isAr ? "الحد الأقصى 100 ميجابايت" : "Maximum size is 100 MB"), variant: "destructive" }); return; }
    const k = detectKind(f);
    if (!k) {
      toast({ title: (isAr ? "صيغة غير مدعومة" : "Unsupported format"), description: (isAr ? "ارفع صورة، فيديو أو صوت" : "Upload an image, video, or audio file"), variant: "destructive" });
      return;
    }
    setOriginal(f);
    setOriginalUrl(URL.createObjectURL(f));
    setKind(k);
    setCompressed(null);
    setCompressedUrl(null);
    setProgress(0);
    if (k === "image") await compressImage(f);
  };

  const compressImage = async (f: File) => {
    setLoading(true);
    setMsg(pickSudaneseMessage());
    try {
      const out = await imageCompression(f, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8,
        onProgress: (p: number) => setProgress(p),
      });
      const file = new File([out], `compressed-${f.name}`, { type: out.type });
      setCompressed(file);
      setCompressedUrl(URL.createObjectURL(file));
    } catch (err) {
      toast({
        title: (isAr ? "حصل خطأ" : "Something went wrong"),
        description: err instanceof Error ? err.message : "Compression failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const compressVideo = async () => {
    if (!original || loading) return;
    setLoading(true);
    setProgress(0);
    setMsg((isAr ? "الخال شغال بضغط في الفيديو.. ثواني وبجهز ليك 🎬" : "Compressing your video… just a moment 🎬"));
    try {
      await runMediaJob(async () => {
      const ff = await getFFmpeg((ratio) => setProgress(Math.max(0, Math.min(1, ratio))));
      const jobId = crypto.randomUUID();
      const inputName = `input-${jobId}` + (original.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".mp4");
      const outputName = `output-${jobId}.mp4`;
      try {
      await ff.writeFile(inputName, await fetchFile(original));

      const args = videoProfile === "whatsapp"
        ? ["-i", inputName, "-vf", "scale='min(640,iw)':-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", outputName]
        : ["-i", inputName, "-vf", "scale='min(960,iw)':-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", outputName];

      if (await ff.exec(args) !== 0) throw new Error("Compression failed");
      const data = await ff.readFile(outputName);
      const bytes = new Uint8Array(data as Uint8Array);
      const blob = new Blob([bytes.buffer], { type: "video/mp4" });
      const file = new File([blob], `compressed-${original.name.replace(/\.[^.]+$/, "")}.mp4`, { type: "video/mp4" });
      setCompressed(file);
      setCompressedUrl(URL.createObjectURL(file));
      setProgress(1);
      } finally {
        await ff.deleteFile(inputName).catch(() => {});
        await ff.deleteFile(outputName).catch(() => {});
      }
      });
    } catch (err) {
      toast({
        title: (isAr ? "ما قدرنا نضغط الفيديو" : "Could not compress the video"),
        description: err instanceof Error ? err.message : "Video compression failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const compressAudio = async () => {
    if (!original || loading) return;
    setLoading(true);
    setProgress(0);
    setMsg((isAr ? "الخال بضغط الصوت.. لحظات 🎵" : "Compressing your audio… 🎵"));
    try {
      await runMediaJob(async () => {
      const ff = await getFFmpeg((ratio) => setProgress(Math.max(0, Math.min(1, ratio))));
      const jobId = crypto.randomUUID();
      const inputName = `input-${jobId}` + (original.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".mp3");
      const outputName = `output-${jobId}.mp3`;
      try {
      await ff.writeFile(inputName, await fetchFile(original));
      if (await ff.exec(["-i", inputName, "-vn", "-c:a", "libmp3lame", "-b:a", "128k", outputName]) !== 0) throw new Error("Compression failed");
      const data = await ff.readFile(outputName);
      const bytes = new Uint8Array(data as Uint8Array);
      const blob = new Blob([bytes.buffer], { type: "audio/mpeg" });
      const file = new File([blob], `compressed-${original.name.replace(/\.[^.]+$/, "")}.mp3`, { type: "audio/mpeg" });
      setCompressed(file);
      setCompressedUrl(URL.createObjectURL(file));
      setProgress(1);
      } finally {
        await ff.deleteFile(inputName).catch(() => {});
        await ff.deleteFile(outputName).catch(() => {});
      }
      });
    } catch (err) {
      toast({
        title: (isAr ? "ما قدرنا نضغط الصوت" : "Could not compress the audio"),
        description: err instanceof Error ? err.message : "Audio compression failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startCompression = () => {
    if (!kind) return;
    if (kind === "image" && original) compressImage(original);
    else if (kind === "video") compressVideo();
    else if (kind === "audio") compressAudio();
  };

  const download = () => {
    if (!compressed || !compressedUrl) return;
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = compressed.name;
    a.click();
  };

  const shareFile = async (network: "whatsapp" | "facebook") => {
    if (!compressed) return;
    const text =
      network === "whatsapp"
        ? "📲 مضغوطة بـ Rasma — توفير في الباقة!"
        : "🌍 ملف مضغوط من Rasma";
    try {
      const navAny = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (navAny.canShare && navAny.canShare({ files: [compressed] })) {
        await navigator.share({ files: [compressed], text, title: "Rasma" });
        return;
      }
    } catch {
      /* fallthrough */
    }
    if (network === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`,
        "_blank",
      );
    }
    toast({
      title: (isAr ? "حمّل الملف الأول" : "Download the file first"),
      description: "متصفحك ما بيدعم مشاركة الملف مباشرة — نزّله وارفعه في التطبيق.",
    });
  };

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setOriginal(null);
    setOriginalUrl(null);
    setKind(null);
    setCompressed(null);
    setCompressedUrl(null);
    setProgress(0);
  };

  const savedPct =
    original && compressed ? Math.max(0, Math.round((1 - compressed.size / original.size) * 100)) : 0;

  const KindIcon = kind === "video" ? Video : kind === "audio" ? Music : ImageIcon;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <BackButton onClick={() => navigate("/")} />
        <div>
          <h1 className="text-base font-bold font-cairo text-foreground">{isAr ? "موفر البيانات" : "Data Saver"}</h1>
          <p className="text-[10px] text-muted-foreground">Image · Video · Audio Compression</p>
        </div>
      </header>

      <div className="px-5 mt-5 space-y-4">
        {!original && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-3xl border-2 border-dashed border-border bg-card p-10 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-gold" />
              </div>
              <p className="text-sm font-semibold text-foreground">Upload media</p>
              <p className="text-xs text-muted-foreground font-cairo">{isAr ? "صورة · فيديو · صوت" : "Image · Video · Audio"}</p>
            </button>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-card border border-border p-3 flex flex-col items-center gap-1">
                <ImageIcon className="w-4 h-4 text-gold" />
                <span className="text-[10px] text-muted-foreground">JPG · PNG</span>
              </div>
              <div className="rounded-xl bg-card border border-border p-3 flex flex-col items-center gap-1">
                <Video className="w-4 h-4 text-nile" />
                <span className="text-[10px] text-muted-foreground">MP4 · MOV</span>
              </div>
              <div className="rounded-xl bg-card border border-border p-3 flex flex-col items-center gap-1">
                <Music className="w-4 h-4 text-gold" />
                <span className="text-[10px] text-muted-foreground">MP3 · WAV</span>
              </div>
            </div>
          </>
        )}

        {original && (
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            {kind === "image" && (
              <img src={compressedUrl ?? originalUrl ?? ""} alt="preview" className="w-full aspect-square object-contain bg-muted" />
            )}
            {kind === "video" && (
              <video src={compressedUrl ?? originalUrl ?? ""} controls className="w-full aspect-video bg-black" />
            )}
            {kind === "audio" && (
              <div className="p-5 bg-muted/40 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center">
                  <Music className="w-7 h-7 text-primary-foreground" />
                </div>
                <audio src={compressedUrl ?? originalUrl ?? ""} controls className="w-full" />
              </div>
            )}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <KindIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground truncate flex-1">{original.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Original</span>
                <span className="font-semibold text-foreground">{formatBytes(original.size)}</span>
              </div>
              {compressed && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Compressed</span>
                    <span className="font-semibold text-gold">{formatBytes(compressed.size)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-border">
                    <span className="text-muted-foreground">Saved</span>
                    <span className="font-bold text-nile">{savedPct}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {kind === "video" && !compressed && !loading && (
          <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <p className="text-xs font-semibold font-cairo text-foreground">{isAr ? "اختار جودة الضغط" : "Choose compression quality"}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setVideoProfile("whatsapp")}
                className={`rounded-xl border p-3 text-xs font-cairo transition ${videoProfile === "whatsapp" ? "border-gold bg-gold/10 text-foreground" : "border-border text-muted-foreground"}`}
               
              >
                <div className="font-bold">{isAr ? "جودة الواتساب" : "WhatsApp quality"}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{isAr ? "ضغط عالي · 640p" : "High compression · 640p"}</div>
              </button>
              <button
                onClick={() => setVideoProfile("balanced")}
                className={`rounded-xl border p-3 text-xs font-cairo transition ${videoProfile === "balanced" ? "border-gold bg-gold/10 text-foreground" : "border-border text-muted-foreground"}`}
               
              >
                <div className="font-bold">{isAr ? "جودة متوسطة" : "Medium quality"}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{isAr ? "متوازنة · 960p" : "Balanced · 960p"}</div>
              </button>
            </div>
            <button
              onClick={startCompression}
              className="w-full rounded-full gradient-gold text-primary-foreground py-3 text-sm font-bold active:scale-95 transition-transform"
             
            >
              {isAr ? "ابدأ الضغط" : "Start compression"}
            </button>
          </div>
        )}

        {kind === "audio" && !compressed && !loading && (
          <button
            onClick={startCompression}
            className="w-full rounded-full gradient-gold text-primary-foreground py-3.5 text-sm font-bold active:scale-95 transition-transform"
           
          >
            {isAr ? "ضغط الصوت إلى 128kbps" : "Compress audio to 128 kbps"}
          </button>
        )}

        {loading && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-gold animate-spin shrink-0" />
              <p className="text-sm font-cairo text-foreground">{msg}</p>
            </div>
            {(kind === "video" || kind === "audio") && (
              <>
                <Progress value={Math.round(progress * 100)} className="h-2" />
                <p className="text-[10px] text-muted-foreground text-center font-mono">{Math.round(progress * 100)}%</p>
              </>
            )}
          </div>
        )}

        {compressed && !loading && (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-gold/15 via-card to-nile/10 border border-gold/30 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <p className="text-xs font-cairo text-foreground leading-relaxed">
                الباقة غالية.. ضغطنا ليك الملف ده عشان يطير في الواتساب بلمحة بصر — وفّرت{" "}
                <span className="font-bold text-nile">{savedPct}%</span> من حجمه.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => shareFile("whatsapp")}
                className="rounded-2xl bg-[hsl(142_70%_45%)] text-white py-3.5 font-semibold flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform shadow-md"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-xs font-cairo">{isAr ? "مشاركة فورية للواتساب" : "Share to WhatsApp"}</span>
              </button>
              <button
                onClick={() => shareFile("facebook")}
                className="rounded-2xl bg-[hsl(220_70%_50%)] text-white py-3.5 font-semibold flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform shadow-md"
              >
                <Facebook className="w-5 h-5" />
                <span className="text-xs font-cairo">{isAr ? "نشر على فيسبوك" : "Share to Facebook"}</span>
              </button>
            </div>

            <button
              onClick={download}
              className="w-full rounded-full border border-gold/40 bg-card py-3 text-sm font-semibold text-foreground flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4 text-gold" /> {isAr ? "تحميل الملف المضغوط" : "Download compressed file"}
            </button>
          </>
        )}

        {original && !loading && (
          <button
            onClick={reset}
            className="w-full rounded-full border border-border py-3 text-sm font-semibold text-foreground flex items-center justify-center gap-2"
           
          >
            <Upload className="w-4 h-4" /> ملف جديد
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={handlePick}
        />
      </div>
    </div>
  );
};

export default DataSaver;
