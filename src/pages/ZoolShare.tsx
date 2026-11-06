import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import {
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

const L = () => document.documentElement.lang !== "en";

type Role = "sender" | "receiver" | null;
type Mode = "code" | "qr" | null; // sender: generate code | scan qr ; receiver: enter code | show qr

const QR_PREFIX = "zoolshare:";

const resolveQrColor = (token: string) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error((L() ? "تعذر تجهيز الباركود" : "Could not prepare the QR code"));
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  context.fillStyle = `hsl(${value})`;
  return context.fillStyle;
};

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
      toast({ title: (L() ? "ما زبط" : "Didn't work"), description: (e as Error).message });
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
        color: {
          dark: resolveQrColor("--qr-ink"),
          light: resolveQrColor("--qr-paper"),
        },
      });
      setQrDataUrl(url);
    } catch (e) {
      toast({ title: (L() ? "ما زبط" : "Didn't work"), description: (e as Error).message });
    }
  };

  // ===== Receiver: Enter Code (join existing host session) =====
  const handleReceiverEnterCode = () => {
    setRole("receiver");
    setMode("code");
  };

  const submitJoinCode = async () => {
    if (joinCode.length !== 6) {
      toast({ title: (L() ? "كود ناقص" : "Incomplete code"), description: (L() ? "أدخل 6 أرقام" : "Enter 6 digits") });
      return;
    }
    try {
      await p2p.startJoin(joinCode);
    } catch (e) {
      toast({ title: (L() ? "ما زبط" : "Didn't work"), description: (e as Error).message });
    }
  };

  // ===== Sender: Scan QR (camera → decode → join) =====
  const handleSenderScanQR = async () => {
    setRole("sender");
    setMode("qr");
  };

  useEffect(() => {
    if (role === "sender" && mode === "qr" && videoRef.current && p2p.status === "idle") {
      const video = videoRef.current;
      const reader = new BrowserQRCodeReader();
      let stopped = false;
      (async () => {
        try {
          const controls = await reader.decodeFromVideoDevice(
            undefined,
            video,
            (result) => {
              if (!result || stopped) return;
              const text = result.getText();
              const code = text.startsWith(QR_PREFIX) ? text.slice(QR_PREFIX.length) : text;
              if (/^\d{6}$/.test(code)) {
                stopped = true;
                controls.stop();
                p2p.startJoin(code).catch((e) =>
                  toast({ title: (L() ? "ما زبط" : "Didn't work"), description: (e as Error).message }),
                );
              }
            },
          );
          scannerRef.current = controls;
        } catch (e) {
          toast({ title: (L() ? "الكاميرا ما اشتغلت" : "Camera didn't start"), description: (e as Error).message });
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
    toast({ title: (L() ? "اتنسخ!" : "Copied!"), description: p2p.code });
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
      className="min-h-screen bg-background text-foreground max-w-md mx-auto pb-10 font-cairo relative"
    >
      {/* Header */}
      <header className="relative flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-2xl sticky top-0 z-20">
        <BackButton
          onClick={() => (role ? resetAll() : navigate("/"))} />
        <div className="flex-1">
          <h1 className="text-base font-bold text-foreground">{L() ? "رسمة شير" : "Rasma Share"}</h1>
          <p className="text-[10px] text-muted-foreground">{L() ? "Local P2P · بدون رصيد" : "Local P2P · No credits"}</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-border">
          <Wifi className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold text-primary">LAN</span>
        </div>
      </header>

      {/* Loading bar */}
      {showProgressBar && (
        <div className="relative px-5 mt-3">
          <div className="rounded-lg border border-border bg-card/80 backdrop-blur-xl p-3">
            <p className="text-[11px] text-primary mb-2 font-bold">
              {L() ? "الخال شغال.. بربط في الأجهزة" : "Connecting the devices…"}
            </p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full gradient-gold transition-all duration-500"
                style={{
                  width: `${barPct}%`
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
            <p className="text-xs text-muted-foreground">{L() ? "اختر دورك" : "Choose your role"}</p>
            <h2 className="text-xl font-bold text-foreground mt-1">{L() ? "مرسل ولا مستلم؟" : "Sender or receiver?"}</h2>
          </div>

          <Button variant="ghost"
            onClick={() => setRole("sender")}
            className="h-auto whitespace-normal w-full rounded-lg p-5 border border-border bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl active:scale-[0.98] transition-transform flex items-center gap-4"
          >
            <div className="shrink-0 w-14 h-14 rounded-lg gradient-gold flex items-center justify-center">
              <Send className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-right flex-1">
              <p className="text-base font-bold text-foreground">{L() ? "مرسل" : "Sender"}</p>
              <p className="text-[11px] text-muted-foreground">{L() ? "عندك ملف وعايز تبعتو" : "You have a file to send"}</p>
            </div>
          </Button>

          <Button variant="ghost"
            onClick={() => setRole("receiver")}
            className="h-auto whitespace-normal w-full rounded-lg p-5 border border-border bg-gradient-to-br from-muted to-transparent backdrop-blur-xl active:scale-[0.98] transition-transform flex items-center gap-4"
          >
            <div className="shrink-0 w-14 h-14 rounded-lg flex items-center justify-center bg-muted border border-primary/30">
              <Inbox className="w-7 h-7 text-primary" />
            </div>
            <div className="text-right flex-1">
              <p className="text-base font-bold text-foreground">{L() ? "مستلم" : "Receiver"}</p>
              <p className="text-[11px] text-muted-foreground">{L() ? "عايز تستقبل ملف من زول" : "You want to receive a file"}</p>
            </div>
          </Button>

          <p className="text-[10px] text-muted-foreground text-center pt-3">
            {L() ? "الملف بيتنقل مباشرة بين الأجهزة عبر WebRTC. على نفس الواي فاي = سرعة فائقة بدون إنترنت." : "Files move directly between devices via WebRTC. Same Wi‑Fi = super fast, no internet needed."}
          </p>
        </div>
      )}

      {/* === SENDER: choose mode === */}
      {role === "sender" && !mode && (
        <ModeChoices
          title=(L() ? "كيف تربط؟" : "How to connect?")
          options={[
            { id: "code", icon: <KeyRound className="w-6 h-6" />, label: (L() ? "إنشاء كود" : "Create code"), sub: (L() ? "ولّد 6 أرقام للمستلم" : "Generate 6 digits for the receiver") },
            { id: "qr", icon: <ScanLine className="w-6 h-6" />, label: (L() ? "مسح الباركود" : "Scan QR"), sub: (L() ? "افتح الكاميرا واسحب باركود المستلم" : "Open the camera and scan the receiver's QR") },
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
          title=(L() ? "كيف تستقبل؟" : "How to receive?")
          options={[
            { id: "code", icon: <Hash className="w-6 h-6" />, label: (L() ? "إدخال كود" : "Enter code"), sub: (L() ? "اكتب الكود من المرسل" : "Type the sender's code") },
            { id: "qr", icon: <QrCode className="w-6 h-6" />, label: (L() ? "عرض الباركود" : "Show QR"), sub: (L() ? "ورّي المرسل الباركود ليمسحو" : "Show your QR to the sender") },
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
            <p className="text-[11px] text-muted-foreground text-center">{L() ? "شارك الكود ده مع المستلم" : "Share this code with the receiver"}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <p
                className="text-3xl font-bold tracking-normal font-mono text-primary"
                
              >
                {p2p.code || "------"}
              </p>
              {p2p.code && (
                <Button variant="ghost"
                  onClick={copyCode}
                  aria-label=(L() ? "نسخ الكود" : "Copy code")
                  className="h-auto whitespace-normal p-2 rounded-xl bg-muted border border-border hover:bg-muted"
                >
                  {copied ? <Check className="h-auto whitespace-normal w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-primary" />}
                </Button>
              )}
            </div>
            <StatusPill status={p2p.status} role="sender" />
          </GlassCard>

          {!pendingFile ? (
            <Button variant="ghost"
              onClick={() => fileRef.current?.click()}
              className="h-auto whitespace-normal w-full rounded-lg border-2 border-dashed border-primary/30 bg-card/60 backdrop-blur-xl p-8 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Upload className="w-7 h-7 text-primary" />
              <p className="text-sm font-bold text-foreground">{L() ? "اختار الملف" : "Choose a file"}</p>
              <p className="text-[11px] text-muted-foreground">{L() ? "يبدأ الإرسال تلقائياً لما يتصل المستلم" : "Sending starts once the receiver connects"}</p>
            </Button>
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
            <p className="text-[11px] text-muted-foreground text-center mb-3">{L() ? "صوّب على باركود المستلم" : "Point at the receiver's QR"}</p>
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-square border border-primary/30">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {/* viewfinder */}
              <div className="absolute inset-6 border-2 border-primary rounded-lg pointer-events-none" />
            </div>
            <StatusPill status={p2p.status} role="sender" />
          </GlassCard>

          {p2p.status === "connected" && !pendingFile && (
            <Button variant="ghost"
              onClick={() => fileRef.current?.click()}
              className="h-auto whitespace-normal w-full rounded-lg border-2 border-dashed border-primary/30 bg-card/60 backdrop-blur-xl p-6 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Upload className="w-7 h-7 text-primary" />
              <p className="text-sm font-bold text-foreground">{L() ? "اختار الملف للإرسال" : "Choose a file to send"}</p>
            </Button>
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
              <p className="text-sm font-bold text-foreground text-center">{L() ? "أدخل الكود من المرسل" : "Enter the sender's code"}</p>
              <input
                inputMode="numeric"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                aria-label=(L() ? "كود الاتصال" : "Connection code")
                className="mt-4 w-full text-center text-3xl font-mono tracking-normal py-3 rounded-xl bg-card/80 border border-primary/30 text-primary focus:outline-none focus:border-ring"
                placeholder="------"
                dir="ltr"
                
              />
              <Button variant="ghost"
                onClick={submitJoinCode}
                className="h-auto whitespace-normal mt-4 w-full rounded-full py-3 gradient-gold font-bold text-primary-foreground active:scale-95 transition-transform"
              >
                {L() ? "اتصل" : "Connect"}
              </Button>
            </GlassCard>
          )}

          {p2p.status !== "idle" && <ReceiverPanel p2p={p2p} onDownload={downloadReceived} onPickFile={() => fileRef.current?.click()} pendingFile={pendingFile} />}
          <ResetButton onClick={resetAll} />
        </div>
      )}

      {/* === RECEIVER · QR show flow === */}
      {role === "receiver" && mode === "qr" && (
        <div className="h-auto whitespace-normal relative px-5 mt-5 space-y-4">
          <GlassCard>
            <p className="text-[11px] text-muted-foreground text-center">{L() ? "ورّي المرسل الباركود ده" : "Show this QR to the sender"}</p>
            <div className="mt-3 mx-auto w-full max-w-64 aspect-square rounded-lg qr-surface flex items-center justify-center overflow-hidden">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" className="w-full h-full" />
              ) : (
                <div className="text-xs">{L() ? "جارٍ التوليد..." : "Generating..."}</div>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">{L() ? "أو الكود يدوياً" : "Or the code manually"}</p>
            <p className="text-center text-2xl font-mono tracking-normal mt-1 text-primary">
              {p2p.code || "------"}
            </p>
            <StatusPill status={p2p.status} role="receiver" />
          </GlassCard>

          {p2p.status === "connected" && !pendingFile && (
            <p className="text-center text-xs text-primary">{L() ? "في انتظار الملف من المرسل..." : "Waiting for the sender's file..."}</p>
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
  <div className="rounded-lg border border-border bg-card/80 backdrop-blur-2xl p-5">
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
      <p className="text-xs text-muted-foreground">{title}</p>
    </div>
    {options.map((o) => (
      <Button variant="ghost"
        key={o.id}
        onClick={() => onPick(o.id)}
        className="h-auto whitespace-normal w-full rounded-lg p-4 border border-border bg-card/80 backdrop-blur-xl active:scale-[0.98] transition-transform flex items-center gap-4"
      >
        <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-border">
          {o.icon}
        </div>
        <div className="text-right flex-1">
          <p className="text-sm font-bold text-foreground">{o.label}</p>
          <p className="text-[11px] text-muted-foreground">{o.sub}</p>
        </div>
      </Button>
    ))}
    <Button variant="ghost" onClick={onBack} className="h-auto whitespace-normal w-full text-xs text-muted-foreground py-2">{L() ? "رجوع" : "Back"}</Button>
  </div>
);

const StatusPill = ({ status, role }: { status: string; role: "sender" | "receiver" }) => {
  const map: Record<string, string> = {
    idle: (L() ? "جاهز" : "Ready"),
    waiting: (L() ? "في انتظار الطرف الآخر..." : "Waiting for the other device..."),
    connecting: (L() ? "جاري الربط..." : "Connecting..."),
    connected: role === "sender" ? "متصل ✓ ابعت الملف" : (L() ? "متصل ✓ في انتظار الملف" : "Connected ✓ waiting for file"),
    transferring: (L() ? "جاري النقل..." : "Transferring..."),
    done: (L() ? "خلصنا ✓" : "Done ✓"),
    error: (L() ? "خطأ" : "Error"),
    fallback: (L() ? "تعذر الربط المباشر" : "Direct connection failed"),
  };
  const ok = status === "connected" || status === "transferring" || status === "done";
  return (
    <div className="h-auto whitespace-normal mt-3 flex items-center justify-center">
      <span className={`text-[10px] px-3 py-1 rounded-full border ${
        ok ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"
      }`}>
        {map[status] ?? status}
      </span>
    </div>
  );
};

const FilePreview = ({ file, progress, status }: { file: File; progress: number; status: string }) => (
  <GlassCard>
    <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
    {(status === "transferring" || status === "done") && (
      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full gradient-gold transition-all"
          style={{ width: `${progress}%` }} />
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
        <p className="text-sm font-bold text-foreground truncate">{p2p.incoming.name}</p>
        <p className="text-xs text-muted-foreground">{(p2p.incoming.size / 1024).toFixed(1)} KB</p>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-gold transition-all"
            style={{ width: `${p2p.progress}%` }} />
        </div>
      </>
    ) : (
      <p className="text-sm text-muted-foreground text-center">{p2p.status === "connected" ? "متصل — في انتظار الملف" : "..."}</p>
    )}
    {p2p.status === "done" && p2p.receivedUrl && (
      <Button variant="ghost"
        onClick={onDownload}
        className="h-auto whitespace-normal mt-4 w-full rounded-full py-3 gradient-gold font-bold text-primary-foreground flex items-center justify-center gap-2 active:scale-95"
      >
        <Download className="h-auto whitespace-normal w-4 h-4" /> {L() ? "حفظ الملف" : "Save file"}
      </Button>
    )}
    {p2p.status === "connected" && !pendingFile && (
      <Button variant="ghost" onClick={onPickFile} className="h-auto whitespace-normal mt-3 w-full text-[11px] text-muted-foreground py-2 underline">
        {L() ? "تبعت ملف عكسي؟" : "Send a file back?"}
      </Button>
    )}
  </GlassCard>
);

const ResetButton = ({ onClick }: { onClick: () => void }) => (
  <Button variant="ghost"
    onClick={onClick}
    className="h-auto whitespace-normal w-full rounded-full border border-border bg-card/60 py-3 text-sm font-bold text-primary flex items-center justify-center gap-2 active:scale-95"
  >
    <RefreshCw className="h-auto whitespace-normal w-4 h-4" /> {L() ? "إعادة" : "Restart"}
  </Button>
);

export default ZoolShare;
