import { useEffect, useRef, useState } from "react";
import { Music, Play, Square, Trash2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/store/userStore";
import {
  MAX_TONE_BYTES,
  clearReminderTone,
  getReminderTone,
  getReminderToneName,
  setReminderTone,
} from "@/lib/reminderTone";
import { startRingtone, stopRingtone } from "@/lib/ringtone";

/** Lets the user pick a ringtone from their phone as the reminder alarm sound. */
const ReminderTonePicker = () => {
  const { language } = useUser();
  const isAr = language === "ar";
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(getReminderToneName());
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const sync = () => setName(getReminderToneName());
    window.addEventListener("madar:tone-changed", sync);
    return () => {
      window.removeEventListener("madar:tone-changed", sync);
      stopRingtone();
    };
  }, []);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({ title: isAr ? "لازم ملف صوتي" : "Audio file required", variant: "destructive" });
      return;
    }
    if (file.size > MAX_TONE_BYTES) {
      toast({
        title: isAr ? "الملف كبير (أقصى 2 ميجا)" : "File too large (max 2MB)",
        variant: "destructive",
      });
      return;
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    try {
      setReminderTone(dataUrl, file.name);
      setName(file.name);
      toast({ title: isAr ? "تم ضبط نغمة التذكير 🎵" : "Reminder tone set 🎵" });
    } catch {
      toast({ title: isAr ? "ما قدرنا نحفظ النغمة" : "Could not save tone", variant: "destructive" });
    }
  };

  const toggleTest = () => {
    if (playing) {
      stopRingtone();
      setPlaying(false);
      return;
    }
    startRingtone(getReminderTone());
    setPlaying(true);
    window.setTimeout(() => {
      stopRingtone();
      setPlaying(false);
    }, 5000);
  };

  return (
    <div className="rounded-2xl border border-gold/30 bg-card/70 p-3" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-2">
        <Music className="w-4 h-4 text-gold" />
        <p className="text-[12px] font-cairo font-bold text-foreground">
          {isAr ? "نغمة تنبيه التذكير" : "Reminder alarm tone"}
        </p>
      </div>
      <p className="text-[10px] font-cairo text-muted-foreground mb-2 leading-relaxed">
        {name
          ? (isAr ? `النغمة الحالية: ${name}` : `Current tone: ${name}`)
          : (isAr ? "النغمة الافتراضية: رنين الخال. تقدر ترفع نغمة من هاتفك." : "Default: Al-Khal ring. Upload a tone from your phone.")}
      </p>
      <input ref={inputRef} type="file" accept="audio/*" onChange={pick} className="hidden" />
      <div className="flex gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          className="flex-1 py-2 rounded-xl gradient-gold text-primary-foreground text-[11px] font-cairo font-bold active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          {isAr ? "اختر نغمة" : "Pick tone"}
        </button>
        <button
          onClick={toggleTest}
          className="px-3 py-2 rounded-xl border border-gold/40 bg-background/60 text-[11px] font-cairo font-bold text-foreground active:scale-95 flex items-center gap-1.5"
        >
          {playing ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isAr ? "تجربة" : "Test"}
        </button>
        {name && (
          <button
            onClick={() => { clearReminderTone(); setName(null); }}
            className="px-3 py-2 rounded-xl border border-border bg-background/60 text-muted-foreground active:scale-95"
            aria-label={isAr ? "حذف النغمة" : "Remove tone"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ReminderTonePicker;
