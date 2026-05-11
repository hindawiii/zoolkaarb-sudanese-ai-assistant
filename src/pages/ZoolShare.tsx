import {
  ArrowLeft,
  Upload,
  Download,
  RefreshCw,
  QrCode,
  ScanLine,
  KeyRound,
  Hash,
  Wifi,
  Send,
  Inbox,
  Copy,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useP2PShare } from "@/hooks/useP2PShare";
import QRCode from "qrcode";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

type Role = "sender" | "receiver" | null;
type Mode = "code" | "qr" | null; // sender: generate code | scan qr ; receiver: enter code | show qr

const QR_PREFIX = "zoolshare:";

const ZoolShare = () => {
  const navigate = useNavigate();
  const p2p = useP2PShare();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<IScannerControls | null>(null);

  const [role, setRole] = useState<Role>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [joinCode, setJoinCode] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ===== Sender: Generate Code =====
  const handleSenderGenerateCode = async () => {
    setRole("sender");
    setMode("code");
    try {
      await p2p.startHost();
    } catch (e) {
      toast({ title: "ما زبط", description: (e as Error).message });
    }
  };

  // ===== Receiver: Show QR (host the session, encode code as QR) =====
  const handleReceiverShowQR = async () => {
    setRole("receiver");
    setMode("qr");
    try {
      const code = await p2p.startHost();
      const url = await QRCode.toDataURL(`${QR_PREFIX}${code}`, {
        width: 320,
        margin: 1,
        color: { dark: "#0a0a0a", light: "#D4AF37" },
      });
      setQrDataUrl(url);
    } catch (e) {
      toast({ title: "ما زبط", description: (e as Error).message });
    }
  };

  // ===== Receiver: Enter Code (join existing host session) =====
  const handleReceiverEnterCode = () => {
    setRole("receiver");
    setMode("code");
  };

  const submitJoinCode = async () => {
    if (joinCode.length !== 6) {
      toast({ title: "كود ناقص", description: "أدخل 6 أرقام" });
      return;
    }
    try {
      await p2p.startJoin(joinCode);
    } catch (e) {
      toast({ title: "ما زبط", description: (e as Error).message });
    }
  };

  // ===== Sender: Scan QR (camera → decode → join) =====
  const handleSenderScanQR = async () => {
    setRole("sender");
    setMode("qr");
  };

  useEffect(() => {
    if (role === "sender" && mode === "qr" && videoRef.current && p2p.status === "idle") {
      const reader = new BrowserQRCodeReader();
      let stopped = false;
      (async () => {
        try {
          const controls = await reader.decodeFromVideoDevice(
            undefined,
            videoRef.current!,
            (result) => {
              if (!result || stopped) return;
              const text = result.getText();
              const code = text.startsWith(QR_PREFIX) ? text.slice(QR_PREFIX.length) : text;
              if (/^\d{6}$/.test(code)) {
                stopped = true;
                controls.stop();
                p2p.startJoin(code).catch((e) =>
                  toast({ title: "ما زبط", description: (e as Error).message }),
                );
              }
            },
          );
          scannerRef.current = controls;
        } catch (e) {
          toast({ title: "الكاميرا ما اشتغلت", description: (e as Error).message });
        }
      })();
      return () => {
        stopped = true;
        scannerRef.current?.stop();
        scannerRef.current = null;
      };
    }
  }, [role, mode, p2p.status, p2p]);

  // Sender auto-pushes file once channel is open
  useEffect(() => {
    if (role === "sender" && p2p.status === "connected" && pendingFile) {
      p2p.sendFile(pendingFile);
    }
  }, [p2p.status, role, pendingFile, p2p]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
  };

  const downloadReceived = () => {
    if (!p2p.receivedUrl) return;
    const a = document.createElement("a");
    a.href = p2p.receivedUrl;
    a.download = p2p.receivedName || "zool-share-file";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyCode = async () => {
    if (!p2p.code) return;
    await navigator.clipboard.writeText(p2p.code);
    setCopied(true);
    toast({ title: "اتنسخ!", description: p2p.code });
    setTimeout(() => setCopied(false), 1500);
  };

  const resetAll = () => {
    p2p.reset();
    setRole(null);
    setMode(null);
    setJoinCode("");
    setPendingFile(null);
    setQrDataUrl(null);
    scannerRef.current?.stop();
    scannerRef.current = null;
  };

  // ===== Loading bar (during connecting / transferring) =====
  const showProgressBar =
    p2p.status === "waiting" ||
    p2p.status === "connecting" ||
    p2p.status === "transferring";
  const barPct =
    p2p.status === "transferring"
      ? p2p.progress
      : p2p.status === "connecting"
        ? 60
        : 25;

  return (
    <div
      className="min-h-screen max-w-md mx-auto pb-10 font-cairo relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 50% -10%, hsl(45 60% 18% / 0.45), transparent 60%), linear-gradient(180deg, hsl(0 0% 5%), hsl(0 0% 8%))",
      }}
      dir="rtl"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent 70%)" }} />
      <div className="pointer-events-none absolute -bottom-32 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent 70%)" }} />

      {/* Header */}
      <header className="relative flex items-center gap-3 px-4 py-3 border-b border-[#D4AF37]/20 bg-black/40 backdrop-blur-2xl sticky top-0 z-20">
        <button
          onClick={() => (role ? resetAll() : navigate("/"))}
          className="p-1.5 rounded-xl hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#D4AF37]" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-white">مدار شير</h1>
          <p className="text-[10px] text-[#D4AF37]/70">Local P2P · بدون رصيد</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
          <Wifi className="w-3 h-3 text-[#D4AF37]" />
          <span className="text-[10px] font-bold text-[#D4AF37]">LAN</span>
        </div>
      </header>

      {/* Loading bar */}
      {showProgressBar && (
        <div className="relative px-5 mt-3">
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-black/50 backdrop-blur-xl p-3">
            <p className="text-[11px] text-[#D4AF37] mb-2 font-bold">
              الخال شغال.. بربط في الأجهزة
            </p>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${barPct}%`,
                  background: "linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)",
                  boxShadow: "0 0 12px #D4AF37",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* === ROLE PICKER === */}
      {!role && (
        <div className="relative px-5 mt-6 space-y-4">
          <div className="text-center mb-2">
            <p className="text-xs text-white/60">اختر دورك</p>
            <h2 className="text-xl font-bold text-white mt-1">مرسل ولا مستلم؟</h2>
          </div>

          <button
            onClick={() => setRole("sender")}
            className="w-full rounded-3xl p-5 border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/15 to-transparent backdrop-blur-xl active:scale-[0.98] transition-transform flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", boxShadow: "0 0 24px #D4AF37aa" }}>
              <Send className="w-7 h-7 text-black" />
            </div>
            <div className="text-right flex-1">
              <p className="text-base font-bold text-white">مرسل</p>
              <p className="text-[11px] text-white/60">عندك ملف وعايز تبعتو</p>
            </div>
          </button>

          <button
            onClick={() => setRole("receiver")}
            className="w-full rounded-3xl p-5 border border-[#D4AF37]/30 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl active:scale-[0.98] transition-transform flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-[#D4AF37]/40">
              <Inbox className="w-7 h-7 text-[#D4AF37]" />
            </div>
            <div className="text-right flex-1">
              <p className="text-base font-bold text-white">مستلم</p>
              <p className="text-[11px] text-white/60">عايز تستقبل ملف من زول</p>
            </div>
          </button>

          <p className="text-[10px] text-white/40 text-center pt-3">
            الملف بيتنقل مباشرة بين الأجهزة عبر WebRTC. على نفس الواي فاي = سرعة فائقة بدون إنترنت.
          </p>
        </div>
      )}

      {/* === SENDER: choose mode === */}
      {role === "sender" && !mode && (
        <ModeChoices
          title="كيف تربط؟"
          options={[
            { id: "code", icon: <KeyRound className="w-6 h-6" />, label: "إنشاء كود", sub: "ولّد 6 أرقام للمستلم" },
            { id: "qr", icon: <ScanLine className="w-6 h-6" />, label: "مسح الباركود", sub: "افتح الكاميرا واسحب باركود المستلم" },
          ]}
          onPick={(id) => {
            if (id === "code") handleSenderGenerateCode();
            else handleSenderScanQR();
          }}
          onBack={() => setRole(null)}
        />
      )}

      {/* === RECEIVER: choose mode === */}
      {role === "receiver" && !mode && (
        <ModeChoices
          title="كيف تستقبل؟"
          options={[
            { id: "code", icon: <Hash className="w-6 h-6" />, label: "إدخال كود", sub: "اكتب الكود من المرسل" },
            { id: "qr", icon: <QrCode className="w-6 h-6" />, label: "عرض الباركود", sub: "ورّي المرسل الباركود ليمسحو" },
          ]}
          onPick={(id) => {
            if (id === "code") handleReceiverEnterCode();
            else handleReceiverShowQR();
          }}
          onBack={() => setRole(null)}
        />
      )}

      {/* === SENDER · CODE flow === */}
      {role === "sender" && mode === "code" && (
        <div className="relative px-5 mt-5 space-y-4">
          <GlassCard>
            <p className="text-[11px] text-white/60 text-center">شارك الكود ده مع المستلم</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <p
                className="text-4xl font-bold tracking-[0.4em] font-mono"
                style={{ color: "#D4AF37", textShadow: "0 0 20px #D4AF3766" }}
              >
                {p2p.code || "------"}
              </p>
              {p2p.code && (
                <button
                  onClick={copyCode}
                  className="p-2 rounded-xl bg-white/5 border border-[#D4AF37]/30 hover:bg-white/10"
                >
                  {copied ? <Check className="w-4 h-4 text-[#D4AF37]" /> : <Copy className="w-4 h-4 text-[#D4AF37]" />}
                </button>
              )}
            </div>
            <StatusPill status={p2p.status} role="sender" />
          </GlassCard>

          {!pendingFile ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-3xl border-2 border-dashed border-[#D4AF37]/40 bg-black/30 backdrop-blur-xl p-8 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Upload className="w-7 h-7 text-[#D4AF37]" />
              <p className="text-sm font-bold text-white">اختار الملف</p>
              <p className="text-[11px] text-white/50">يبدأ الإرسال تلقائياً لما يتصل المستلم</p>
            </button>
          ) : (
            <FilePreview file={pendingFile} progress={p2p.progress} status={p2p.status} />
          )}

          <ResetButton onClick={resetAll} />
        </div>
      )}

      {/* === SENDER · QR scan flow === */}
      {role === "sender" && mode === "qr" && (
        <div className="relative px-5 mt-5 space-y-4">
          <GlassCard>
            <p className="text-[11px] text-white/60 text-center mb-3">صوّب على باركود المستلم</p>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square border border-[#D4AF37]/40">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {/* viewfinder */}
              <div className="absolute inset-6 border-2 rounded-2xl pointer-events-none"
                style={{ borderColor: "#D4AF37", boxShadow: "inset 0 0 30px #D4AF3744" }} />
            </div>
            <StatusPill status={p2p.status} role="sender" />
          </GlassCard>

          {p2p.status === "connected" && !pendingFile && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-3xl border-2 border-dashed border-[#D4AF37]/40 bg-black/30 backdrop-blur-xl p-6 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Upload className="w-7 h-7 text-[#D4AF37]" />
              <p className="text-sm font-bold text-white">اختار الملف للإرسال</p>
            </button>
          )}
          {pendingFile && <FilePreview file={pendingFile} progress={p2p.progress} status={p2p.status} />}

          <ResetButton onClick={resetAll} />
        </div>
      )}

      {/* === RECEIVER · CODE flow === */}
      {role === "receiver" && mode === "code" && (
        <div className="relative px-5 mt-5 space-y-4">
          {p2p.status === "idle" && (
            <GlassCard>
              <p className="text-sm font-bold text-white text-center">أدخل الكود من المرسل</p>
              <input
                inputMode="numeric"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-4 w-full text-center text-3xl font-mono tracking-[0.4em] py-3 rounded-xl bg-black/40 border border-[#D4AF37]/40 text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
                placeholder="------"
                dir="ltr"
                style={{ textShadow: "0 0 12px #D4AF3766" }}
              />
              <button
                onClick={submitJoinCode}
                className="mt-4 w-full rounded-full py-3 font-bold text-black active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg, #D4AF37, #FFD700)", boxShadow: "0 6px 20px #D4AF3755" }}
              >
                اتصل
              </button>
            </GlassCard>
          )}

          {p2p.status !== "idle" && <ReceiverPanel p2p={p2p} onDownload={downloadReceived} onPickFile={() => fileRef.current?.click()} pendingFile={pendingFile} />}
          <ResetButton onClick={resetAll} />
        </div>
      )}

      {/* === RECEIVER · QR show flow === */}
      {role === "receiver" && mode === "qr" && (
        <div className="relative px-5 mt-5 space-y-4">
          <GlassCard>
            <p className="text-[11px] text-white/60 text-center">ورّي المرسل الباركود ده</p>
            <div className="mt-3 mx-auto w-64 h-64 rounded-2xl bg-[#D4AF37] flex items-center justify-center overflow-hidden"
              style={{ boxShadow: "0 0 30px #D4AF3766" }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" className="w-full h-full" />
              ) : (
                <div className="text-black text-xs">جارٍ التوليد...</div>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-white/60">أو الكود يدوياً</p>
            <p className="text-center text-2xl font-mono tracking-[0.4em] mt-1" style={{ color: "#D4AF37" }}>
              {p2p.code || "------"}
            </p>
            <StatusPill status={p2p.status} role="receiver" />
          </GlassCard>

          {p2p.status === "connected" && !pendingFile && (
            <p className="text-center text-xs text-[#D4AF37]">في انتظار الملف من المرسل...</p>
          )}
          {(p2p.incoming || p2p.status === "transferring" || p2p.status === "done") && (
            <ReceiverPanel p2p={p2p} onDownload={downloadReceived} onPickFile={() => fileRef.current?.click()} pendingFile={pendingFile} />
          )}
          <ResetButton onClick={resetAll} />
        </div>
      )}

      <input ref={fileRef} type="file" className="hidden" onChange={onPickFile} />
    </div>
  );
};

// ===== Sub-components =====

const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-3xl border border-[#D4AF37]/30 bg-black/50 backdrop-blur-2xl p-5"
    style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.15)" }}>
    {children}
  </div>
);

const ModeChoices = ({
  title, options, onPick, onBack,
}: {
  title: string;
  options: { id: "code" | "qr"; icon: React.ReactNode; label: string; sub: string }[];
  onPick: (id: "code" | "qr") => void;
  onBack: () => void;
}) => (
  <div className="relative px-5 mt-6 space-y-3">
    <div className="text-center">
      <p className="text-xs text-white/50">{title}</p>
    </div>
    {options.map((o) => (
      <button
        key={o.id}
        onClick={() => onPick(o.id)}
        className="w-full rounded-3xl p-4 border border-[#D4AF37]/30 bg-black/40 backdrop-blur-xl active:scale-[0.98] transition-transform flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
          {o.icon}
        </div>
        <div className="text-right flex-1">
          <p className="text-sm font-bold text-white">{o.label}</p>
          <p className="text-[11px] text-white/50">{o.sub}</p>
        </div>
      </button>
    ))}
    <button onClick={onBack} className="w-full text-xs text-white/50 py-2">رجوع</button>
  </div>
);

const StatusPill = ({ status, role }: { status: string; role: "sender" | "receiver" }) => {
  const map: Record<string, string> = {
    idle: "جاهز",
    waiting: "في انتظار الطرف الآخر...",
    connecting: "جاري الربط...",
    connected: role === "sender" ? "متصل ✓ ابعت الملف" : "متصل ✓ في انتظار الملف",
    transferring: "جاري النقل...",
    done: "خلصنا ✓",
    error: "خطأ",
    fallback: "تعذر الربط المباشر",
  };
  const ok = status === "connected" || status === "transferring" || status === "done";
  return (
    <div className="mt-3 flex items-center justify-center">
      <span className={`text-[10px] px-3 py-1 rounded-full border ${
        ok ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40" : "bg-white/5 text-white/60 border-white/10"
      }`}>
        {map[status] ?? status}
      </span>
    </div>
  );
};

const FilePreview = ({ file, progress, status }: { file: File; progress: number; status: string }) => (
  <GlassCard>
    <p className="text-sm font-bold text-white truncate">{file.name}</p>
    <p className="text-xs text-white/50">{(file.size / 1024).toFixed(1)} KB</p>
    {(status === "transferring" || status === "done") && (
      <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full transition-all"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #D4AF37, #FFD700)" }} />
      </div>
    )}
  </GlassCard>
);

const ReceiverPanel = ({
  p2p, onDownload, onPickFile, pendingFile,
}: {
  p2p: ReturnType<typeof useP2PShare>;
  onDownload: () => void;
  onPickFile: () => void;
  pendingFile: File | null;
}) => (
  <GlassCard>
    {p2p.incoming ? (
      <>
        <p className="text-sm font-bold text-white truncate">{p2p.incoming.name}</p>
        <p className="text-xs text-white/50">{(p2p.incoming.size / 1024).toFixed(1)} KB</p>
        <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full transition-all"
            style={{ width: `${p2p.progress}%`, background: "linear-gradient(90deg, #D4AF37, #FFD700)" }} />
        </div>
      </>
    ) : (
      <p className="text-sm text-white/60 text-center">{p2p.status === "connected" ? "متصل — في انتظار الملف" : "..."}</p>
    )}
    {p2p.status === "done" && p2p.receivedUrl && (
      <button
        onClick={onDownload}
        className="mt-4 w-full rounded-full py-3 font-bold text-black flex items-center justify-center gap-2 active:scale-95"
        style={{ background: "linear-gradient(135deg, #D4AF37, #FFD700)" }}
      >
        <Download className="w-4 h-4" /> حفظ الملف
      </button>
    )}
    {p2p.status === "connected" && !pendingFile && (
      <button onClick={onPickFile} className="mt-3 w-full text-[11px] text-white/50 py-2 underline">
        تبعت ملف عكسي؟
      </button>
    )}
  </GlassCard>
);

const ResetButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full rounded-full border border-[#D4AF37]/30 bg-black/30 py-3 text-sm font-bold text-[#D4AF37] flex items-center justify-center gap-2 active:scale-95"
  >
    <RefreshCw className="w-4 h-4" /> إعادة
  </button>
);

export default ZoolShare;
