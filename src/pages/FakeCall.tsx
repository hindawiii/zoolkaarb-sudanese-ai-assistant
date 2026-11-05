import BackButton from "@/components/BackButton";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PhoneCall,
  Smartphone,
  Repeat,
  Sparkles,
  AlertTriangle,
  Plus,
  Image as ImageIcon,
  Music,
  Mic2,
  X,
  Wand2,
  Camera,
} from "lucide-react";
import { useUser } from "@/store/userStore";
import { useZoolCredits } from "@/lib/zoolCredits";
import ZoolAdModal from "@/components/ZoolAdModal";
import StudioProgress from "@/components/audio/StudioProgress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  saveFakeCall,
  AVATAR_GRADIENT,
  VOICE_LINES_AR,
  VOICE_LINES_AR_FEMALE,
  type FakeCallAvatar,
  type FakeCallStyle,
  type FakeCallVoice,
} from "@/lib/fakeCallStore";

const TOOL_ID = "fake-call";

const DELAYS = [
  { label: "حالاً", labelEn: "Now", sec: 1 },
  { label: "10ث", labelEn: "10s", sec: 10 },
  { label: "30ث", labelEn: "30s", sec: 30 },
  { label: "1د", labelEn: "1m", sec: 60 },
  { label: "5د", labelEn: "5m", sec: 300 },
];

const AVATARS: FakeCallAvatar[] = ["gold", "nile", "earth", "sand"];

const fileToDataUrl = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(f);
  });

const FakeCall = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const { credits, consume } = useZoolCredits(TOOL_ID);

  const [callerName, setCallerName] = useState("الخال");
  const [callerLabel, setCallerLabel] = useState(isRtl ? "جوال" : "Mobile");
  const [avatar, setAvatar] = useState<FakeCallAvatar>("gold");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [ringtoneDataUrl, setRingtoneDataUrl] = useState<string | null>(null);
  const [ringtoneName, setRingtoneName] = useState<string | null>(null);
  const [voice, setVoice] = useState<FakeCallVoice>("khal");
  const [style, setStyle] = useState<FakeCallStyle>("ios");
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [aiLine, setAiLine] = useState<string>("");
  const [aiBusy, setAiBusy] = useState(false);
  const [delaySec, setDelaySec] = useState(10);
  const [autoRedial, setAutoRedial] = useState(false);
  const [redialAfterSec, setRedialAfterSec] = useState(15);
  const [adOpen, setAdOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);

  const photoRef = useRef<HTMLInputElement | null>(null);
  const ringRef = useRef<HTMLInputElement | null>(null);

  const presetLines = useMemo(
    () => (voice === "khala" ? VOICE_LINES_AR_FEMALE : VOICE_LINES_AR),
    [voice],
  );
  const allLines = useMemo(
    () => (aiLine ? [aiLine, ...presetLines] : presetLines),
    [aiLine, presetLines],
  );

  useEffect(() => {
    setVoiceIdx(0);
  }, [voice, aiLine]);

  const onPhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await fileToDataUrl(f);
    setPhotoDataUrl(url);
    setFabOpen(false);
    toast.success(isRtl ? "تم تعيين صورة المتصل" : "Caller photo set");
  };

  const onRingtonePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await fileToDataUrl(f);
    setRingtoneDataUrl(url);
    setRingtoneName(f.name);
    setFabOpen(false);
    toast.success(isRtl ? "تم تعيين النغمة" : "Ringtone set");
  };

  const generateAiLine = async () => {
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("fake-call-line", {
        body: { voice, callerName: callerName || "الخال" },
      });
      if (error) throw error;
      const line = (data as any)?.line as string | undefined;
      if (line) {
        setAiLine(line);
        toast.success(isRtl ? "تم توليد عبارة جديدة" : "New line generated");
      }
    } catch (e) {
      toast.error(isRtl ? "فشل التوليد، استخدمنا عبارة جاهزة" : "Generation failed");
    } finally {
      setAiBusy(false);
    }
  };

  const scheduleCall = () => {
    const cfg = {
      callerName: callerName || (isRtl ? "الخال" : "Al-Khal"),
      callerLabel: callerLabel || (isRtl ? "جوال" : "Mobile"),
      avatar,
      photoDataUrl,
      ringtoneDataUrl,
      voice,
      style,
      voiceLine: allLines[voiceIdx] || presetLines[0],
      autoRedial,
      redialAfterSec,
      scheduledAt: Date.now() + delaySec * 1000,
    };
    saveFakeCall(cfg);
    setScheduling(true);
    setProgress(0.05);
    const totalMs = delaySec * 1000;
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(1, elapsed / totalMs));
      if (elapsed >= totalMs) window.clearInterval(id);
    }, 100);
    setTimeout(() => {
      navigate("/fake-call/incoming");
    }, totalMs);
  };

  const handleStart = () => {
    if (credits <= 0) {
      setAdOpen(true);
      return;
    }
    consume();
    scheduleCall();
  };

  const initial = (callerName || "?").trim().charAt(0);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-32 relative" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-gold/15 px-4 py-3 flex items-center justify-between">
        <BackButton onClick={() => navigate(-1)} />
        <div className="text-center">
          <h1 className="text-base font-bold font-cairo text-foreground">
            {isRtl ? "فزعة الخال — Pro" : "Fake Call Pro"}
          </h1>
          <p className="text-[10px] text-gold font-cairo">
            {isRtl ? `رصيد الفزعة: ${credits}` : `Credits: ${credits}`}
          </p>
        </div>
        <div className="w-9" />
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Live preview card */}
        <div className="relative overflow-hidden rounded-3xl depth-card border border-gold/30 p-5 flex flex-col items-center text-center shadow-2xl bg-gradient-to-br from-card/90 via-card/60 to-background/80 backdrop-blur-xl">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gold/30 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-primary/30 blur-3xl" />
          </div>
          {photoDataUrl ? (
            <img
              src={photoDataUrl}
              alt="caller"
              className="relative w-24 h-24 rounded-full object-cover ring-2 ring-gold/60 shadow-lg animate-pulse-glow"
            />
          ) : (
            <div
              className={`relative w-24 h-24 rounded-full ${AVATAR_GRADIENT[avatar]} flex items-center justify-center text-3xl font-bold text-primary-foreground font-cairo shadow-lg animate-pulse-glow`}
            >
              {initial}
            </div>
          )}
          <p className="relative mt-3 text-lg font-bold font-cairo text-foreground">
            {callerName || (isRtl ? "الخال" : "Al-Khal")}
          </p>
          <p className="relative text-xs text-muted-foreground font-cairo">{callerLabel}</p>
          <div className="relative mt-2 flex gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-cairo uppercase">
              {style === "ios" ? "iOS" : "Android"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold font-cairo">
              {voice === "khala" ? (isRtl ? "الخالة" : "Al-Khala") : isRtl ? "الخال" : "Al-Khal"}
            </span>
          </div>
        </div>

        {/* Inline name + number row */}
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={callerName}
            onChange={(e) => setCallerName(e.target.value)}
            className="px-3 py-2.5 rounded-xl surface-obsidian text-sm font-cairo text-foreground focus:outline-none focus:border-gold"
            placeholder={isRtl ? "الاسم" : "Name"}
          />
          <input
            type="text"
            value={callerLabel}
            onChange={(e) => setCallerLabel(e.target.value)}
            className="px-3 py-2.5 rounded-xl surface-obsidian text-sm font-cairo text-foreground focus:outline-none focus:border-gold"
            placeholder={isRtl ? "الرقم/الوصف" : "Number"}
          />
        </div>

        {/* Style selector */}
        <div className="grid grid-cols-2 gap-2">
          {(["ios", "android"] as FakeCallStyle[]).map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`py-2.5 rounded-xl font-bold font-cairo text-sm flex items-center justify-center gap-2 active:scale-95 transition ${
                style === s
                  ? "gradient-gold text-primary-foreground shadow-lg"
                  : "bg-card/70 backdrop-blur border border-border text-foreground"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              {s === "ios" ? "iOS 18" : "Material You"}
            </button>
          ))}
        </div>

        {/* Voice persona */}
        <div>
          <p className="text-xs font-bold font-cairo text-muted-foreground mb-2 flex items-center gap-1">
            <Mic2 className="w-3 h-3 text-gold" />
            {isRtl ? "اختر الصوت" : "Voice persona"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "khal", ar: "الخال", en: "Al-Khal", sub: isRtl ? "ذكر — سوداني طبيعي" : "Male, natural" },
                { id: "khala", ar: "الخالة", en: "Al-Khala", sub: isRtl ? "أنثى — حازمة دافئة" : "Female, firm" },
              ] as { id: FakeCallVoice; ar: string; en: string; sub: string }[]
            ).map((v) => (
              <button
                key={v.id}
                onClick={() => setVoice(v.id)}
                className={`p-3 rounded-xl text-start active:scale-95 transition ${
                  voice === v.id
                    ? "bg-gold/15 border-2 border-gold"
                    : "bg-card/70 backdrop-blur border border-border"
                }`}
              >
                <p className="font-bold font-cairo text-sm text-foreground">
                  {isRtl ? v.ar : v.en}
                </p>
                <p className="text-[10px] font-cairo text-muted-foreground">{v.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* AI line generator */}
        <div className="rounded-2xl surface-obsidian p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold font-cairo text-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold" />
              {isRtl ? "جملة المكالمة" : "Call line"}
            </p>
            <button
              onClick={generateAiLine}
              disabled={aiBusy}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-gold/20 border border-gold/40 text-gold font-cairo flex items-center gap-1 active:scale-95 disabled:opacity-50"
            >
              <Wand2 className="w-3 h-3" />
              {aiBusy ? (isRtl ? "...يولّد" : "...") : isRtl ? "ولّد بالذكاء" : "AI generate"}
            </button>
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {allLines.map((line, i) => (
              <button
                key={i}
                onClick={() => setVoiceIdx(i)}
                className={`w-full text-start p-2.5 rounded-xl font-cairo text-xs leading-relaxed transition ${
                  voiceIdx === i
                    ? "bg-gold/15 border border-gold text-foreground"
                    : "bg-background/40 border border-border text-muted-foreground"
                }`}
                dir="auto"
              >
                {i === 0 && aiLine && (
                  <span className="inline-block text-[9px] mb-1 px-1.5 py-0.5 rounded-full bg-gold/30 text-gold">
                    AI
                  </span>
                )}
                <span className="block">{line}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Avatar fallback color */}
        {!photoDataUrl && (
          <div>
            <p className="text-xs font-bold font-cairo text-muted-foreground mb-2">
              {isRtl ? "لون الصورة الافتراضية" : "Default avatar"}
            </p>
            <div className="flex gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`w-10 h-10 rounded-full ${AVATAR_GRADIENT[a]} ${
                    avatar === a ? "ring-2 ring-gold ring-offset-2 ring-offset-background" : ""
                  } active:scale-95 transition`}
                  aria-label={a}
                />
              ))}
            </div>
          </div>
        )}

        {/* Delay */}
        <div>
          <p className="text-xs font-bold font-cairo text-muted-foreground mb-2">
            {isRtl ? "متى ترن؟" : "When to ring?"}
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {DELAYS.map((d) => (
              <button
                key={d.sec}
                onClick={() => setDelaySec(d.sec)}
                className={`py-2 rounded-lg text-[11px] font-bold font-cairo active:scale-95 transition ${
                  delaySec === d.sec
                    ? "gradient-gold text-primary-foreground"
                    : "bg-card/70 backdrop-blur border border-border text-foreground"
                }`}
              >
                {isRtl ? d.label : d.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-redial */}
        <div className="rounded-2xl surface-obsidian p-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-gold" />
              <p className="text-sm font-bold font-cairo text-foreground">
                {isRtl ? "إعادة الاتصال تلقائياً" : "Auto-redial"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoRedial}
              onChange={(e) => setAutoRedial(e.target.checked)}
              className="w-5 h-5 accent-[hsl(var(--gold))]"
            />
          </label>
          {autoRedial && (
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground font-cairo mb-1">
                {isRtl ? `يعاود بعد ${redialAfterSec} ثانية` : `Redial after ${redialAfterSec}s`}
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={redialAfterSec}
                onChange={(e) => setRedialAfterSec(Number(e.target.value))}
                className="w-full accent-[hsl(var(--gold))]"
              />
            </div>
          )}
        </div>

        {/* Active customizations */}
        {(photoDataUrl || ringtoneDataUrl) && (
          <div className="flex flex-wrap gap-2">
            {photoDataUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-cairo px-2 py-1 rounded-full bg-gold/15 text-gold border border-gold/30">
                <Camera className="w-3 h-3" />
                {isRtl ? "صورة مخصصة" : "Custom photo"}
                <button onClick={() => setPhotoDataUrl(null)} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {ringtoneDataUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-cairo px-2 py-1 rounded-full bg-gold/15 text-gold border border-gold/30">
                <Music className="w-3 h-3" />
                {ringtoneName?.slice(0, 18) || "ringtone"}
                <button
                  onClick={() => {
                    setRingtoneDataUrl(null);
                    setRingtoneName(null);
                  }}
                  className="ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Start */}
        <button
          onClick={handleStart}
          disabled={scheduling}
          className="w-full py-4 rounded-2xl gradient-gold text-primary-foreground font-bold font-cairo flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-60 shadow-lg"
        >
          <PhoneCall className="w-5 h-5" />
          {scheduling
            ? isRtl
              ? `جاهز... المكالمة بعد ${delaySec}ث`
              : `Ringing in ${delaySec}s`
            : isRtl
              ? "ابدأ الفزعة"
              : "Start Fake Call"}
        </button>

        {credits === 0 && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs font-cairo text-destructive leading-relaxed">
              {isRtl
                ? "خلصت فزعاتك! شاهد إعلان قصير وخد 5 رصيد."
                : "Out of calls! Watch a short ad for 5 credits."}
            </p>
          </div>
        )}
      </div>

      {/* Floating Tools FAB */}
      <div className="fixed bottom-24 right-5 z-30 flex flex-col items-end gap-3" dir="ltr">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-fade-in">
            <button
              onClick={() => photoRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-card/90 backdrop-blur-xl border border-gold/30 shadow-lg font-cairo text-xs text-foreground"
            >
              <ImageIcon className="w-4 h-4 text-gold" />
              {isRtl ? "صورة المتصل" : "Caller photo"}
            </button>
            <button
              onClick={() => ringRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-card/90 backdrop-blur-xl border border-gold/30 shadow-lg font-cairo text-xs text-foreground"
            >
              <Music className="w-4 h-4 text-gold" />
              {isRtl ? "نغمة الرنين" : "Ringtone"}
            </button>
            <button
              onClick={() => {
                setFabOpen(false);
                document.getElementById("voice-persona")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-card/90 backdrop-blur-xl border border-gold/30 shadow-lg font-cairo text-xs text-foreground"
            >
              <Mic2 className="w-4 h-4 text-gold" />
              {isRtl ? "اختر الصوت" : "Pick voice"}
            </button>
          </div>
        )}
        <button
          onClick={() => setFabOpen((o) => !o)}
          className="w-14 h-14 rounded-full gradient-gold shadow-2xl flex items-center justify-center active:scale-90 transition"
          aria-label="Tools"
        >
          {fabOpen ? (
            <X className="w-6 h-6 text-primary-foreground" />
          ) : (
            <Plus className="w-6 h-6 text-primary-foreground" />
          )}
        </button>
      </div>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPhotoPick}
      />
      <input
        ref={ringRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={onRingtonePick}
      />

      <ZoolAdModal
        open={adOpen}
        toolId={TOOL_ID}
        isRtl={isRtl}
        onClose={() => setAdOpen(false)}
        onRewarded={() => {
          consume();
          scheduleCall();
        }}
      />

      <StudioProgress
        open={scheduling}
        progress={progress}
        isRtl={isRtl}
        message={
          isRtl
            ? "الخال بجهز في الفزعة.. ثواني وبكون عندك مكالمة حقيقية"
            : "Preparing your call... seconds away from realism"
        }
      />
    </div>
  );
};

export default FakeCall;
