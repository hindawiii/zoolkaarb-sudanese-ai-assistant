import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mic, Square, Play, Pause, Share2, Loader2, Wand2, Coins } from "lucide-react";
import { toast } from "sonner";
import { useZoolCredits } from "@/lib/zoolCredits";
import ZoolAdModal from "@/components/ZoolAdModal";
import StudioProgress from "@/components/audio/StudioProgress";
import { Slider } from "@/components/ui/slider";
import {
  audioBufferToWavBlob,
  decodeBlobToBuffer,
  renderVoice,
  type VoiceParams,
} from "@/lib/voiceFormant";

const TOOL_ID = "voice-changer";

type VoiceId = "kandaka" | "zol" | "walid" | "habboba";

interface VoicePreset {
  id: VoiceId;
  name: string;
  emoji: string;
  desc: string;
  pitch: number;   // semitones
  reverb: number;  // 0..1
  formant: number; // 0.85..1.15
}

const PRESETS: VoicePreset[] = [
  { id: "kandaka", name: "الكنداكة",   emoji: "👩", desc: "أنثوية دافئة",      pitch: 5,  reverb: 0.25, formant: 1.06 },
  { id: "zol",     name: "الزول",      emoji: "🧑", desc: "ذكورية طبيعية",     pitch: 0,  reverb: 0.15, formant: 1.0 },
  { id: "walid",   name: "الوالد",     emoji: "👨", desc: "عميقة هادئة",       pitch: -3, reverb: 0.2,  formant: 0.95 },
  { id: "habboba", name: "الحبوبة",    emoji: "👵", desc: "حنونة قريبة",        pitch: -1, reverb: 0.35, formant: 0.97 },
];

const PROGRESS_MSG = "الخال بظبط في النبرة.. ثواني وبكون عندك صوت احترافي";

const VoiceChanger = () => {
  const navigate = useNavigate();
  const { credits, consume } = useZoolCredits(TOOL_ID);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [selected, setSelected] = useState<VoiceId>("kandaka");
  const [pitch, setPitch] = useState(5);
  const [reverb, setReverb] = useState(0.25);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [adOpen, setAdOpen] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 200);
    return () => clearInterval(id);
  }, [isRecording]);

  // When user picks a preset, sync sliders to its defaults
  const pickPreset = (p: VoicePreset) => {
    setSelected(p.id);
    setPitch(p.pitch);
    setReverb(p.reverb);
  };

  const drawWave = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const render = () => {
      analyser.getByteTimeDomainData(data);
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "hsl(45 90% 55%)");
      grad.addColorStop(1, "hsl(150 60% 45%)");
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = grad;
      ctx.beginPath();
      const slice = w / data.length;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = (v * h) / 2;
        const x = i * slice;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const candidates = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm"];
      const mime = candidates.find((c) => MediaRecorder.isTypeSupported(c)) || "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        try {
          const buf = await decodeBlobToBuffer(blob);
          setOriginalBuffer(buf);
          toast.success("تم الحفظ.. اختار شخصية!");
        } catch {
          toast.error("ما قدرنا نقرأ التسجيل");
        }
      };

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setElapsed(0);
      setOriginalBuffer(null);
      setPreviewBlob(null);
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      drawWave();
    } catch (e) {
      console.error(e);
      toast.error("ما قدرنا نفتح المايك");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    setIsRecording(false);
  };

  const convert = async () => {
    if (!originalBuffer) return toast.error("سجل صوتك الأول");
    if (credits <= 0) { setAdOpen(true); return; }
    const preset = PRESETS.find((p) => p.id === selected)!;
    const params: VoiceParams = { pitch, reverb, formant: preset.formant };
    setIsProcessing(true);
    setProgress(0.05);
    try {
      const out = await renderVoice(originalBuffer, params, (r) => setProgress(0.1 + r * 0.85));
      const wav = audioBufferToWavBlob(out);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(wav);
      setPreviewBlob(wav);
      setPreviewUrl(url);
      consume();
      requestAnimationFrame(() => {
        if (audioElRef.current) {
          audioElRef.current.src = url;
          audioElRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      });
    } catch (e) {
      console.error(e);
      toast.error("في خلل، جرب تاني");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const togglePlay = () => {
    const el = audioElRef.current;
    if (!el || !previewUrl) return;
    if (el.paused) { el.play(); setIsPlaying(true); }
    else { el.pause(); setIsPlaying(false); }
  };

  const shareToWhatsApp = async () => {
    if (!previewBlob) return;
    const file = new File([previewBlob], `zoolkaarb-${selected}.wav`, { type: "audio/wav" });
    const text = "صوت احترافي من مدار 🎤";
    try {
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: "Madar" });
        return;
      }
    } catch (e) { console.warn(e); }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank"), 500);
    toast("نزّلنا ليك الملف.. ارفقه في الواتساب");
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div dir="rtl" className="min-h-screen bg-background max-w-md mx-auto pb-28 font-cairo">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/70 backdrop-blur-2xl border-b border-gold/20 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-card/80 border border-border flex items-center justify-center active:scale-95 transition-transform"
          aria-label="رجوع">
          <ArrowRight className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1 text-start">
          <h1 className="text-base font-bold text-foreground">غيّر صوتك — استوديو</h1>
          <p className="text-[11px] text-muted-foreground">حفظ النبرة الطبيعية بدون تشويه</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gold/15 border border-gold/40">
          <Coins className="w-3.5 h-3.5 text-gold" />
          <span className="text-[11px] font-bold text-gold">رصيد الفزعة: {credits}</span>
        </div>
      </header>

      {/* Tip */}
      <div className="mx-5 mt-4 rounded-2xl border border-gold/30 bg-card/50 backdrop-blur-xl p-3 flex gap-2.5 items-start">
        <Wand2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        <p className="text-xs text-foreground leading-relaxed">
          الصوت بيتعالج بتقنية حفظ الـ<span className="text-gold font-bold"> Formant </span>
          عشان ما يطلع روبوتي.
        </p>
      </div>

      {/* Recorder */}
      <section className="mx-5 mt-4 rounded-3xl border border-gold/25 bg-card/60 backdrop-blur-2xl p-5 text-center shadow-xl">
        <div className="h-24 rounded-2xl bg-background/60 border border-border/60 overflow-hidden flex items-center justify-center">
          {isRecording ? (
            <canvas ref={canvasRef} width={400} height={96} className="w-full h-full" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {originalBuffer ? "تسجيلك جاهز ✅" : "اضغط لبدء التسجيل (Opus / WebM)"}
            </p>
          )}
        </div>
        <p className="mt-3 text-sm font-mono text-foreground tabular-nums">{fmt(elapsed)}</p>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`mt-4 mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
            isRecording
              ? "bg-destructive text-destructive-foreground animate-pulse shadow-[0_0_30px_hsl(var(--destructive)/0.5)]"
              : "gradient-gold text-primary-foreground shadow-[0_0_30px_hsl(45_90%_55%/0.45)]"
          }`}
          aria-label={isRecording ? "إيقاف" : "تسجيل"}
        >
          {isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-8 h-8" />}
        </button>
      </section>

      {/* Voice library */}
      {originalBuffer && (
        <>
          <section className="mx-5 mt-5">
            <h2 className="text-sm font-bold text-foreground mb-3 text-start">🎙️ مكتبة الأصوات</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {PRESETS.map((p) => {
                const active = selected === p.id;
                return (
                  <button key={p.id} onClick={() => pickPreset(p)}
                    className={`rounded-2xl border p-3 flex items-center gap-3 text-start transition-all active:scale-95 backdrop-blur-xl ${
                      active
                        ? "border-gold bg-gold/15 shadow-[0_0_18px_hsl(45_90%_55%/0.35)]"
                        : "border-border/60 bg-card/50 hover:border-gold/40"
                    }`}>
                    <span className="text-2xl leading-none">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Sliders */}
          <section className="mx-5 mt-5 rounded-3xl border border-gold/25 bg-card/60 backdrop-blur-2xl p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-foreground">حدّة النبرة (Pitch)</label>
                <span className="text-[11px] text-gold font-mono">{pitch > 0 ? `+${pitch}` : pitch} st</span>
              </div>
              <Slider value={[pitch]} onValueChange={(v) => setPitch(v[0])} min={-12} max={12} step={1} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-foreground">صدى الاستوديو (Reverb)</label>
                <span className="text-[11px] text-gold font-mono">{Math.round(reverb * 100)}%</span>
              </div>
              <Slider value={[reverb]} onValueChange={(v) => setReverb(v[0])} min={0} max={1} step={0.05} />
            </div>
          </section>

          {/* Convert */}
          <div className="px-5 mt-5">
            <button onClick={convert} disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl gradient-gold text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {credits > 0 ? "حوّل الصوت" : "شوف إعلان واحصل على 5 فزعات"}
            </button>
          </div>
        </>
      )}

      {/* Preview & Share */}
      {previewUrl && (
        <section className="mx-5 mt-5 rounded-3xl border border-nile/30 bg-card/50 backdrop-blur-2xl p-4">
          <audio ref={audioElRef}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="hidden" />
          <div className="flex items-center gap-3">
            <button onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-nile text-primary-foreground flex items-center justify-center active:scale-95"
              aria-label={isPlaying ? "إيقاف" : "تشغيل"}>
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ms-0.5" />}
            </button>
            <div className="flex-1 text-start">
              <p className="text-sm font-bold text-foreground">معاينة احترافية</p>
              <p className="text-[11px] text-muted-foreground">{PRESETS.find((p) => p.id === selected)?.name}</p>
            </div>
          </div>
          <button onClick={shareToWhatsApp} disabled={!previewBlob}
            className="mt-4 w-full py-3 rounded-2xl gradient-gold text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50">
            <Share2 className="w-4 h-4" />
            أرسل (واتساب)
          </button>
        </section>
      )}

      <StudioProgress open={isProcessing} progress={progress} isRtl message={PROGRESS_MSG} />
      <ZoolAdModal open={adOpen} toolId={TOOL_ID} isRtl onClose={() => setAdOpen(false)} />
    </div>
  );
};

export default VoiceChanger;
