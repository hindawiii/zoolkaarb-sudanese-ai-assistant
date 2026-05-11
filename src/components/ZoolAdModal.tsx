import { useEffect, useState } from "react";
import { Play, Gift, X, Sparkles } from "lucide-react";
import { getRewardAmount, grantReward } from "@/lib/zoolCredits";

interface Props {
  open: boolean;
  isRtl?: boolean;
  toolId: string;
  onClose: () => void;
  /** Called after the user finishes the ad. Receives the new credit balance. */
  onRewarded?: (newBalance: number) => void;
}

const DURATION = 5;

/**
 * Universal mock rewarded-ad modal. Used by every tool in the app.
 * On completion: grants the per-tool reward via `grantReward()` and notifies parent.
 */
const ZoolAdModal = ({ open, isRtl = true, toolId, onClose, onRewarded }: Props) => {
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [watching, setWatching] = useState(false);
  const [done, setDone] = useState(false);
  const reward = getRewardAmount(toolId);

  useEffect(() => {
    if (!open) {
      setSecondsLeft(DURATION);
      setWatching(false);
      setDone(false);
    }
  }, [open]);

  useEffect(() => {
    if (!watching || done) return;
    if (secondsLeft <= 0) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [watching, secondsLeft, done]);

  if (!open) return null;

  const handleClaim = () => {
    const newBalance = grantReward(toolId);
    onRewarded?.(newBalance);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground font-cairo flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            {isRtl ? "نظام رصيد مدار" : "Madar Credits"}
          </p>
          {!watching && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted" aria-label="Close">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="p-6 text-center">
          {!watching && !done && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full gradient-gold flex items-center justify-center animate-pulse-glow">
                <Gift className="w-9 h-9 text-primary-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-bold font-cairo text-foreground">
                {isRtl ? "خلصت تجاربك المجانية" : "Free trials finished"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground font-cairo leading-relaxed">
                {isRtl
                  ? "ثواني يا هندسة.. الخال بيتمسح بالإعلان ده وبيرجع ليك الفزعة!"
                  : `Watch a quick ad and Al-Khal will give you ${reward} more uses!`}
              </p>
              <button
                onClick={() => setWatching(true)}
                className="mt-5 w-full py-3 rounded-2xl gradient-gold text-primary-foreground font-bold font-cairo flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Play className="w-4 h-4" />
                {isRtl ? `شوف الإعلان (+${reward} فزعات)` : `Watch Ad (+${reward} uses)`}
              </button>
            </>
          )}

          {watching && !done && (
            <>
              <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-earth to-earth-light flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--gold-glow)/0.3),transparent_60%)]" />
                <p className="text-primary-foreground font-bold text-xl font-cairo z-10 px-4 text-center leading-relaxed">
                  {isRtl ? "إعلان تجريبي" : "Demo Ad"}
                </p>
                <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-mono">
                  {secondsLeft}s
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground font-cairo">
                {isRtl ? "خليك معانا.. شوية وبتخلص" : "Hang on, almost done..."}
              </p>
            </>
          )}

          {done && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center">
                <Gift className="w-9 h-9 text-secondary-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-bold font-cairo text-foreground">
                {isRtl ? "تمام يا هندسة!" : "Nice!"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground font-cairo">
                {isRtl
                  ? `حصلت على ${reward} فزعات إضافية 🎉`
                  : `You earned ${reward} more uses 🎉`}
              </p>
              <button
                onClick={handleClaim}
                className="mt-5 w-full py-3 rounded-2xl bg-secondary text-secondary-foreground font-bold font-cairo active:scale-95 transition-transform"
              >
                {isRtl ? "يلا نواصل" : "Continue"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoolAdModal;
