import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronUp,
  Video,
  Grid3x3,
  UserPlus,
  Pause,
  MessageSquare,
  BellOff,
  Signal,
  Wifi,
  BatteryFull,
} from "lucide-react";
import {
  loadFakeCall,
  clearFakeCall,
  AVATAR_GRADIENT,
  type FakeCallConfig,
} from "@/lib/fakeCallStore";
import {
  startRingtone,
  stopRingtone,
  speakArabic,
  stopSpeaking,
} from "@/lib/ringtone";

type Phase = "ringing" | "in-call" | "ended";

const formatTimer = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const useClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
};

const StatusBar = ({ ios, dark = true }: { ios: boolean; dark?: boolean }) => {
  const now = useClock();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const tone = dark ? "text-white/90" : "text-black/80";
  return (
    <div
      className={`flex items-center justify-between px-6 pt-2 pb-1 text-[12px] font-semibold ${tone} select-none`}
      dir="ltr"
    >
      <span className="tracking-tight">{time}</span>
      <div className="flex items-center gap-1">
        {ios ? (
          <>
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryFull className="w-4 h-4" />
          </>
        ) : (
          <>
            <span className="text-[10px]">4G+</span>
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <BatteryFull className="w-4 h-4" />
          </>
        )}
      </div>
    </div>
  );
};

const FakeCallIncoming = () => {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<FakeCallConfig | null>(null);
  const [phase, setPhase] = useState<Phase>("ringing");
  const [timer, setTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [onHold, setOnHold] = useState(false);
  const [silenced, setSilenced] = useState(false);
  const [slidePos, setSlidePos] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const redialTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const c = loadFakeCall();
    if (!c) {
      navigate("/fake-call", { replace: true });
      return;
    }
    setCfg(c);
  }, [navigate]);

  useEffect(() => {
    if (phase !== "ringing" || !cfg || silenced) return;
    startRingtone(cfg.ringtoneDataUrl ?? null);
    try {
      const el = document.documentElement as any;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el).catch(() => {});
    } catch {
      /* ignore */
    }
    return () => stopRingtone();
  }, [phase, cfg, silenced]);

  useEffect(() => {
    if (phase !== "in-call" || onHold) return;
    const id = window.setInterval(() => setTimer((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase, onHold]);

  useEffect(() => {
    return () => {
      stopRingtone();
      stopSpeaking();
      if (redialTimerRef.current) window.clearTimeout(redialTimerRef.current);
    };
  }, []);

  const accentBg = useMemo(() => {
    if (!cfg) return "";
    return AVATAR_GRADIENT[cfg.avatar];
  }, [cfg]);

  if (!cfg) return null;

  const initial = cfg.callerName.trim().charAt(0) || "?";
  const isIos = cfg.style === "ios";

  const answer = () => {
    stopRingtone();
    setPhase("in-call");
    setTimer(0);
    speakArabic(cfg.voiceLine, { female: cfg.voice === "khala" });
  };

  const decline = () => {
    stopRingtone();
    if (cfg.autoRedial) {
      redialTimerRef.current = window.setTimeout(() => {
        setSlidePos(0);
        setSilenced(false);
        setPhase("ringing");
      }, cfg.redialAfterSec * 1000);
      setPhase("ended");
    } else {
      clearFakeCall();
      navigate("/", { replace: true });
    }
  };

  const endCall = () => {
    stopSpeaking();
    clearFakeCall();
    navigate("/", { replace: true });
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (next) stopSpeaking();
      else if (!onHold) speakArabic(cfg.voiceLine, { female: cfg.voice === "khala" });
      return next;
    });
  };

  const toggleHold = () => {
    setOnHold((h) => {
      const next = !h;
      if (next) stopSpeaking();
      else if (!muted) speakArabic(cfg.voiceLine, { female: cfg.voice === "khala" });
      return next;
    });
  };

  // iOS slide-to-answer
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const max = rect.width - 56;
    const pos = Math.max(0, Math.min(max, x - 28));
    setSlidePos(pos);
    if (pos >= max - 4) {
      dragging.current = false;
      answer();
    }
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setSlidePos(0);
  };

  /* Avatar with animated rings */
  const Avatar = ({ size, ringing }: { size: number; ringing?: boolean }) => (
    <div className="relative" style={{ width: size, height: size }}>
      {ringing && (
        <>
          <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
          <span
            className="absolute inset-0 rounded-full bg-white/5 animate-ping"
            style={{ animationDelay: "0.6s" }}
          />
        </>
      )}
      {cfg.photoDataUrl ? (
        <img
          src={cfg.photoDataUrl}
          alt=""
          className="relative w-full h-full rounded-full object-cover ring-4 ring-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        />
      ) : (
        <div
          className={`relative w-full h-full rounded-full ${accentBg} flex items-center justify-center font-bold ring-4 ring-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)]`}
          style={{ fontSize: size * 0.38 }}
        >
          {initial}
        </div>
      )}
    </div>
  );

  /* Background — blurred caller photo if any, otherwise rich gradient */
  const Background = () => (
    <>
      {cfg.photoDataUrl ? (
        <>
          <img
            src={cfg.photoDataUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/95" />
        </>
      ) : (
        <div
          className={`absolute inset-0 ${
            isIos
              ? "bg-[radial-gradient(ellipse_at_top,hsl(220_30%_22%)_0%,hsl(220_30%_8%)_55%,#000_100%)]"
              : "bg-[radial-gradient(ellipse_at_top,hsl(150_30%_22%)_0%,hsl(220_25%_10%)_55%,#000_100%)]"
          }`}
        />
      )}
      {/* gold ambient glows */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
    </>
  );

  // ===== Ended (waiting for redial) =====
  if (phase === "ended") {
    return (
      <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold/10 blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-base font-cairo text-foreground">انتهت المكالمة</p>
          <p className="mt-2 text-sm font-cairo text-muted-foreground">
            الخال هيعاود الاتصال بعد {cfg.redialAfterSec} ثانية...
          </p>
          <button
            onClick={() => {
              if (redialTimerRef.current) window.clearTimeout(redialTimerRef.current);
              clearFakeCall();
              navigate("/", { replace: true });
            }}
            className="mt-6 px-6 py-2.5 rounded-full bg-card border border-gold/30 text-sm font-cairo text-foreground active:scale-95"
          >
            إلغاء كلياً
          </button>
        </div>
      </div>
    );
  }

  // ===== In-call =====
  if (phase === "in-call") {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col text-white overflow-hidden" dir="rtl">
        <Background />
        <div className="relative z-10 flex flex-col h-full">
          <StatusBar ios={isIos} />
          {/* Header info */}
          <div className="flex flex-col items-center pt-6 pb-2 px-6 text-center">
            <p className="text-[13px] font-cairo text-white/70">
              {onHold ? "في الانتظار" : "مكالمة جارية"}
            </p>
            <p className="mt-1 text-[28px] font-bold font-cairo tracking-tight">
              {cfg.callerName}
            </p>
            <p className="text-[13px] text-white/55 font-cairo">{cfg.callerLabel}</p>
            <p className="mt-2 text-[15px] font-mono text-white/80 tabular-nums">
              {formatTimer(timer)}
            </p>
          </div>

          {/* Big avatar */}
          <div className="flex-1 flex items-center justify-center">
            <Avatar size={180} />
          </div>

          {/* Action grid */}
          <div className="px-7 pb-10">
            <div className="grid grid-cols-3 gap-y-5 gap-x-3 mb-7">
              {[
                {
                  on: muted,
                  onClick: toggleMute,
                  Icon: muted ? MicOff : Mic,
                  label: muted ? "كاتم" : "كتم",
                },
                {
                  on: false,
                  onClick: () => {},
                  Icon: Grid3x3,
                  label: "لوحة",
                  disabled: true,
                },
                {
                  on: speaker,
                  onClick: () => setSpeaker((s) => !s),
                  Icon: speaker ? Volume2 : VolumeX,
                  label: "سماعة",
                },
                {
                  on: false,
                  onClick: () => {},
                  Icon: UserPlus,
                  label: "إضافة",
                  disabled: true,
                },
                {
                  on: false,
                  onClick: () => {},
                  Icon: Video,
                  label: "فيديو",
                  disabled: true,
                },
                {
                  on: onHold,
                  onClick: toggleHold,
                  Icon: Pause,
                  label: onHold ? "متوقف" : "إيقاف",
                },
              ].map((b, i) => (
                <button
                  key={i}
                  onClick={b.onClick}
                  disabled={b.disabled}
                  className="flex flex-col items-center gap-2 active:scale-95 transition disabled:opacity-40"
                >
                  <span
                    className={`w-[68px] h-[68px] rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10 ${
                      b.on ? "bg-white/85 text-black" : "bg-white/10 text-white"
                    }`}
                  >
                    <b.Icon className="w-6 h-6" />
                  </span>
                  <span className="text-[11px] font-cairo text-white/85">
                    {b.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center">
              <button
                onClick={endCall}
                className="w-[72px] h-[72px] rounded-full bg-[hsl(0_85%_55%)] flex items-center justify-center shadow-[0_15px_40px_rgba(220,38,38,0.55)] active:scale-90 transition"
                aria-label="End call"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <span className="mt-2 text-[11px] font-cairo text-white/70">إنهاء</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== Ringing =====
  return (
    <div className="fixed inset-0 z-[200] flex flex-col text-white overflow-hidden" dir="rtl">
      <Background />

      <div className="relative z-10 flex flex-col h-full">
        <StatusBar ios={isIos} />

        {/* Brand strip */}
        <div className="flex items-center justify-between px-6 mt-2">
          <span className="text-[10px] font-cairo text-white/40 tracking-wide">
            ✦ Madar
          </span>
          <span className="text-[10px] font-cairo text-white/40">
            {isIos ? "iPhone" : "Android"}
          </span>
        </div>

        {/* Caller block */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-[13px] text-white/65 font-cairo mb-1">
            مكالمة واردة
          </p>
          <p className="text-[11px] text-white/40 font-cairo mb-7">
            عبر شبكة الجوال
          </p>

          <Avatar size={156} ringing />

          <p className="mt-7 text-[32px] font-bold font-cairo tracking-tight">
            {cfg.callerName}
          </p>
          <p className="text-[14px] text-white/60 font-cairo mt-1">
            {cfg.callerLabel}
          </p>
        </div>

        {/* Quick actions row */}
        <div className="px-8 pb-3 flex justify-around">
          <button
            onClick={() => {
              setSilenced(true);
              stopRingtone();
            }}
            className="flex flex-col items-center gap-1.5 text-white/75 active:scale-95 transition"
          >
            <span className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center">
              <BellOff className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-cairo">كتم</span>
          </button>
          <button
            onClick={decline}
            className="flex flex-col items-center gap-1.5 text-white/75 active:scale-95 transition"
          >
            <span className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-cairo">رسالة</span>
          </button>
          <button
            onClick={decline}
            className="flex flex-col items-center gap-1.5 text-white/75 active:scale-95 transition"
          >
            <span className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center">
              <ChevronUp className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-cairo">تذكير</span>
          </button>
        </div>

        {/* Primary controls */}
        <div className="px-6 pb-10">
          {isIos ? (
            <div className="space-y-5">
              <div
                ref={sliderRef}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="relative w-full h-[60px] rounded-full bg-white/10 backdrop-blur-2xl border border-white/15 overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-center text-[13px] font-cairo text-white/70 pointer-events-none">
                  <span className="ltr:mr-2 rtl:ml-2 animate-pulse">›››</span>
                  اسحب للرد
                </div>
                <button
                  onPointerDown={onPointerDown}
                  style={{ transform: `translateX(${slidePos}px)` }}
                  className="absolute top-1 left-1 w-[52px] h-[52px] rounded-full bg-[hsl(140_70%_45%)] flex items-center justify-center shadow-[0_8px_25px_rgba(34,197,94,0.55)] touch-none"
                  aria-label="Slide to answer"
                >
                  <Phone className="w-6 h-6 text-white" />
                </button>
              </div>
              <button
                onClick={decline}
                className="w-full py-3.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white/85 text-sm font-cairo active:scale-95 transition flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                رفض
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <button
                onClick={decline}
                className="flex flex-col items-center gap-2 active:scale-90 transition"
              >
                <span className="w-[72px] h-[72px] rounded-full bg-[hsl(0_85%_55%)] flex items-center justify-center shadow-[0_15px_40px_rgba(220,38,38,0.55)] rotate-[135deg]">
                  <Phone className="w-7 h-7 text-white" />
                </span>
                <span className="text-xs font-cairo text-white/75">رفض</span>
              </button>
              <button
                onClick={answer}
                className="flex flex-col items-center gap-2 active:scale-90 transition"
              >
                <span className="relative w-[72px] h-[72px] rounded-full bg-[hsl(140_70%_45%)] flex items-center justify-center shadow-[0_15px_40px_rgba(34,197,94,0.55)]">
                  <span className="absolute inset-0 rounded-full bg-[hsl(140_70%_45%)] animate-ping opacity-60" />
                  <Phone className="relative w-7 h-7 text-white" />
                </span>
                <span className="text-xs font-cairo text-white/75">رد</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FakeCallIncoming;
