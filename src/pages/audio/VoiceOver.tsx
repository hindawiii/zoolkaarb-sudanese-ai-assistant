import BackButton from "@/components/BackButton";
import { Download, Mic, Music2, Square, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useUser } from "@/store/userStore";
import { useZoolCredits } from "@/lib/zoolCredits";
import ZoolAdModal from "@/components/ZoolAdModal";
import StudioProgress from "@/components/audio/StudioProgress";
import {
  blobToAudioBuffer,
  downloadBlob,
  loadAudioBuffer,
  renderMixWithDucking,
  startVoiceRecording,
  synthesizeArabicToBuffer,
  type VoiceRecorder,
} from "@/lib/audioMixer";
import { pickRandomSignature } from "@/lib/alKhalSignature";
import { SignatureToggle } from "./MediaFactory";
import { toast } from "sonner";

const TOOL_ID = "voice-over";
type Slot = "start" | "middle" | "end";

const VoiceOver = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const { credits, consume } = useZoolCredits(TOOL_ID);

  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [recording, setRecording] = useState<{ slot: Slot } | null>(null);
  const recRef = useRef<VoiceRecorder | null>(null);
  const [voiceBlobs, setVoiceBlobs] = useState<Partial<Record<Slot, Blob>>>({});
  const [signature, setSignature] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [adOpen, setAdOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const voiceFileRef = useRef<HTMLInputElement>(null);
  const [voiceSlot, setVoiceSlot] = useState<Slot>("middle");

  const handleVoiceUpload = (file: File) => {
    setVoiceBlobs((p) => ({ ...p, [voiceSlot]: file }));
    toast.success(isRtl ? "تم رفع البصمة" : "Voice clip added");
  };

  const beginRecord = async (slot: Slot) => {
    try {
      recRef.current = await startVoiceRecording();
      setRecording({ slot });
    } catch {
      toast.error(isRtl ? "ما قدرنا نفتح المايك" : "Mic permission denied");
    }
  };

  const stopRecord = async () => {
    if (!recRef.current || !recording) return;
    const blob = await recRef.current.stop();
    setVoiceBlobs((p) => ({ ...p, [recording.slot]: blob }));
    setRecording(null);
    recRef.current = null;
  };

  const startExport = async () => {
    if (credits <= 0) return setAdOpen(true);
    if (!musicFile) return toast.error(isRtl ? "ضيف أغنية أو صوت أساسي" : "Add a music track");
    setBusy(true);
    setProgress(0.05);
    try {
      const music = await loadAudioBuffer(musicFile, (r) => setProgress(0.05 + r * 0.35));
      setProgress(0.45);

      const voices = [];
      const dur = music.duration;
      const positions: Record<Slot, number> = { start: 0.5, middle: dur / 2, end: Math.max(0, dur - 4) };

      for (const slot of ["start", "middle", "end"] as Slot[]) {
        const b = voiceBlobs[slot];
        if (!b) continue;
        const buf = await blobToAudioBuffer(b);
        voices.push({ buffer: buf, startSec: positions[slot] });
      }
      if (signature) {
        const sigBuf = await synthesizeArabicToBuffer(pickRandomSignature(), 2.5);
        voices.push({ buffer: sigBuf, startSec: Math.max(0, dur - 2.5) });
      }

      const blob = await renderMixWithDucking(
        { music, voices, duckLevel: 0.22 },
        (r) => setProgress(0.5 + r * 0.5),
      );
      consume();
      downloadBlob(blob, `voice-over-${Date.now()}.webm`);
      toast.success(isRtl ? "كارب يا زول!" : "Exported!");
    } catch (e) {
      console.error(e);
      toast.error(isRtl ? "في خلل، جرب تاني" : "Failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-24" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <BackButton onClick={() => navigate("/audio-studio")} />
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground">{isRtl ? "بصمتي الخاصة" : "Voice-over"}</h1>
          <p className="text-[10px] text-muted-foreground">{isRtl ? `متبقي ${credits} فزعات` : `${credits} uses left`}</p>
        </div>
      </header>

      <div className="px-4 pt-4">
        <button onClick={() => fileRef.current?.click()} className="w-full rounded-2xl border border-dashed border-gold/40 bg-card/40 backdrop-blur p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 text-start min-w-0">
            <p className="text-sm font-bold font-cairo text-foreground">{isRtl ? "ضيف الأغنية / الموسيقى" : "Add the music"}</p>
            <p className="text-[11px] text-muted-foreground font-cairo truncate">{musicFile?.name ?? (isRtl ? "MP3, WAV, M4A..." : "MP3, WAV, M4A...")}</p>
          </div>
          <Upload className="w-4 h-4 text-muted-foreground" />
        </button>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden"
          onChange={(e) => setMusicFile(e.target.files?.[0] ?? null)} />

        {/* Direct voice file upload */}
        <div className="mt-3 rounded-2xl border border-gold/30 bg-card/50 backdrop-blur p-3">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-gold" />
            <p className="text-xs font-bold font-cairo text-foreground">
              {isRtl ? "أو ارفع بصمة صوتية جاهزة" : "Or upload a ready voice clip"}
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={voiceSlot}
              onChange={(e) => setVoiceSlot(e.target.value as Slot)}
              className="flex-1 rounded-xl bg-background border border-border px-3 py-2 text-xs font-cairo text-foreground"
            >
              <option value="start">{isRtl ? "البداية" : "Start"}</option>
              <option value="middle">{isRtl ? "الوسط" : "Middle"}</option>
              <option value="end">{isRtl ? "النهاية" : "End"}</option>
            </select>
            <button
              onClick={() => voiceFileRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-gold/20 border border-gold/40 text-gold text-xs font-bold font-cairo flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {isRtl ? "ارفع" : "Upload"}
            </button>
          </div>
          {voiceBlobs[voiceSlot] && (
            <p className="text-[10.5px] text-muted-foreground font-cairo mt-2 truncate">
              ✓ {(voiceBlobs[voiceSlot] as File).name ?? (isRtl ? "تم الرفع" : "Uploaded")}
            </p>
          )}
          <input ref={voiceFileRef} type="file" accept="audio/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVoiceUpload(f); }} />
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">
          {isRtl ? "الخط الزمني — اختار مكان الصوت" : "Timeline — pick voice slots"}
        </p>
        <div className="rounded-2xl border border-gold/30 bg-card/60 backdrop-blur p-5 relative">
          <div className="h-1 rounded-full bg-gradient-to-r from-gold/60 via-gold-glow/70 to-gold/60" />
          <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 flex justify-between">
            {(["start", "middle", "end"] as Slot[]).map((slot) => {
              const has = !!voiceBlobs[slot];
              const isRec = recording?.slot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => (isRec ? stopRecord() : beginRecord(slot))}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                    isRec
                      ? "bg-destructive border-destructive text-destructive-foreground animate-pulse-glow"
                      : has
                      ? "bg-secondary border-secondary text-secondary-foreground"
                      : "bg-card border-gold/50 text-gold hover:bg-gold/10"
                  }`}
                  aria-label={slot}
                >
                  {isRec ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
                </button>
              );
            })}
          </div>
          <div className="mt-9 flex justify-between text-[10.5px] font-cairo text-muted-foreground">
            <span>{isRtl ? "البداية" : "Start"}</span>
            <span>{isRtl ? "الوسط" : "Middle"}</span>
            <span>{isRtl ? "النهاية" : "End"}</span>
          </div>
        </div>
        {recording && (
          <p className="text-center text-xs font-cairo text-destructive mt-2 animate-pulse">
            {isRtl ? "🔴 جاري التسجيل.. اضغط مرة تانية لإيقاف" : "🔴 Recording... tap again to stop"}
          </p>
        )}
      </div>

      <SignatureToggle value={signature} onChange={setSignature} isRtl={isRtl} />

      <div className="px-4 mt-5">
        <button onClick={startExport} disabled={busy}
          className="w-full py-3.5 rounded-2xl gradient-gold text-primary-foreground font-bold font-cairo flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60">
          <Download className="w-4 h-4" />
          {credits > 0 ? (isRtl ? "صدّر الكرب" : "Export") : (isRtl ? "شوف إعلان لتفتح الإكسبورت" : "Watch ad to unlock")}
        </button>
      </div>

      <StudioProgress open={busy} progress={progress} isRtl={isRtl} />
      <ZoolAdModal open={adOpen} toolId={TOOL_ID} isRtl={isRtl} onClose={() => setAdOpen(false)} />
    </div>
  );
};

export default VoiceOver;
