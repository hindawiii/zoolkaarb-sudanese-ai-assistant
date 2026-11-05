import { Button } from "@/components/ui/button";
import RecordedWaveform from "@/components/audio/RecordedWaveform";
import BackButton from "@/components/BackButton";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Square, Play, Pause, Share2, Loader2, Wand2, Coins } from "lucide-react";
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
  const [previewName, setPreviewName] = useState("");
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
      audioElRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    if (!isRecording) return;
    drawWave();
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
      const tokens = getComputedStyle(document.documentElement);
      grad.addColorStop(0, `hsl(${tokens.getPropertyValue("--gold")})`);
      grad.addColorStop(1, `hsl(${tokens.getPropertyValue("--nile-green")})`);
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
    const preset = PRESETS.find((p) => p.id === selected);
    if (!preset) return;
    audioElRef.current?.pause();
    const params: VoiceParams = { pitch, reverb, formant: preset.formant };
    setIsProcessing(true);
    setProgress(0.05);
    try {
      const out = await renderVoice(originalBuffer, params, (r) => setProgress(0.1 + r * 0.85));
      const wav = audioBufferToWavBlob(out);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(wav);
      setPreviewName(preset.name);
      setPreviewBlob(wav);
      setPreviewUrl(url);
      consume();

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
    if (el.paused) { el.play().then(() => setIsPlaying(true)).catch(() => toast.error("تعذر تشغيل المعاينة")); }
    else { el.pause(); setIsPlaying(false); }
  };

  const shareToWhatsApp = async () => {
    if (!previewBlob) return;
    const file = new File([previewBlob], `zoolkaarb-${selected}.wav`, { type: "audio/wav" });
    const text = "صوت احترافي من رسمة 🎤";
    try {
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: "Rasma" });
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
    <div className="min-h-screen bg-background max-w-md mx-auto pb-28 font-cairo">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/70 backdrop-blur-2xl border-b border-gold/20 px-5 py-4 flex items-center gap-3">
        <BackButton onClick={() => navigate("/")} />
        <div className="flex-1 text-start">
          <h1 className="text-base font-bold text-foreground">غيّر صوتك — استوديو</h1>
          <p className="text-[11px] text-muted-foreground">حفظ النبرة الطبيعية بدون تشويه</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gold/15 border border-gold/40">
          <Coins className="w-3.5 h-3.5 text-gold" />
          <span className="text-[11px] font-bold text-gold">{credits} متبقية</span>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-5">
        <section aria-labelledby="voices-title">
          <div className="flex items-center justify-between mb-3">
            <h2 id="voices-title" className="text-sm font-bold text-foreground">مكتبة الأصوات</h2>
            <span className="text-xs text-muted-foreground">٤ شخصيات</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {PRESETS.map((preset) => (
              <Button key={preset.id} variant="ghost" aria-pressed={selected === preset.id}
                aria-label={preset.name} onClick={() => pickPreset(preset)} disabled={isProcessing}
                className={`h-auto min-h-[80px] whitespace-normal rounded-lg border p-3 gap-3 justify-start text-start ${selected === preset.id ? "border-primary bg-primary/10" : "border-border bg-card/60"}`}>
                <span className="text-2xl shrink-0" aria-hidden="true">{preset.emoji}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">{preset.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{preset.desc}</span>
                </span>
              </Button>
            ))}
          </div>
        </section>

        <section aria-labelledby="recording-title" className="border-y border-border py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 id="recording-title" className="text-sm font-bold">التسجيل</h2>
            <span role="status" className="text-xs text-muted-foreground">{isRecording ? "جارٍ التسجيل" : originalBuffer ? "تسجيلك جاهز" : "جاهز للتسجيل"}</span>
          </div>
          <div className="h-[72px] bg-muted/40 rounded-lg overflow-hidden">
            {isRecording ? <canvas ref={canvasRef} width={400} height={72} className="w-full h-full" aria-label="موجة الميكروفون المباشرة" role="img" /> : <RecordedWaveform buffer={originalBuffer} />}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-mono tabular-nums" dir="ltr">{fmt(elapsed)}</span>
            <Button onClick={isRecording ? stopRecording : startRecording} disabled={isProcessing}
              className={`h-12 rounded-full px-5 gap-2 ${isRecording ? "bg-destructive text-destructive-foreground" : "gradient-gold text-primary-foreground"}`}
              aria-label={isRecording ? "إيقاف التسجيل" : "تسجيل"}>
              {isRecording ? <Square /> : <Mic />}{isRecording ? "إيقاف التسجيل" : originalBuffer ? "تسجيل جديد" : "تسجيل صوتي"}
            </Button>
          </div>
        </section>

        <section aria-labelledby="settings-title" className="space-y-4">
          <h2 id="settings-title" className="text-sm font-bold">ضبط النبرة</h2>
          <div>
            <div className="flex justify-between mb-2 text-xs"><span>حدّة النبرة</span><span className="text-primary font-mono" dir="ltr">{pitch > 0 ? `+${pitch}` : pitch} st</span></div>
            <Slider aria-label="حدّة النبرة" value={[pitch]} onValueChange={(v) => setPitch(v[0])} min={-12} max={12} step={1} disabled={isProcessing} />
          </div>
          <div>
            <div className="flex justify-between mb-2 text-xs"><span>صدى الاستوديو</span><span className="text-primary font-mono">{Math.round(reverb * 100)}%</span></div>
            <Slider aria-label="صدى الاستوديو" value={[reverb]} onValueChange={(v) => setReverb(v[0])} min={0} max={1} step={0.05} disabled={isProcessing} />
          </div>
          <Button onClick={convert} disabled={!originalBuffer || isProcessing || isRecording}
            className="w-full h-12 rounded-lg gradient-gold text-primary-foreground font-bold">
            {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {credits > 0 ? "حوّل الصوت" : "مكافأة تجريبية لاستكمال التحويل"}
          </Button>
        </section>

        {previewUrl && (
          <section className="border-t border-border pt-4 space-y-3" aria-labelledby="preview-title">
            <audio ref={audioElRef} src={previewUrl} onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} />
            <div className="flex items-center gap-3">
              <Button onClick={togglePlay} variant="secondary" size="icon" className="rounded-full h-12 w-12" aria-label={isPlaying ? "إيقاف المعاينة" : "تشغيل المعاينة"}>
                {isPlaying ? <Pause /> : <Play />}
              </Button>
              <div className="flex-1"><h2 id="preview-title" className="text-sm font-bold">معاينة التسجيل المحوّل</h2><p className="text-xs text-muted-foreground">{previewName}</p></div>
              <Button variant="outline" size="icon" onClick={shareToWhatsApp} disabled={!previewBlob} aria-label="مشاركة التسجيل" title="مشاركة التسجيل"><Share2 /></Button>
            </div>
          </section>
        )}
      </main>

      <StudioProgress open={isProcessing} progress={progress} isRtl message={PROGRESS_MSG} />
      <ZoolAdModal open={adOpen} toolId={TOOL_ID} isRtl onClose={() => setAdOpen(false)} />
    </div>
  );
};

export default VoiceChanger;
