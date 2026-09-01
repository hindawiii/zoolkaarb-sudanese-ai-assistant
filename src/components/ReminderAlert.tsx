import { useEffect, useState } from "react";
import { Bell, Check, Clock, X } from "lucide-react";
import { useUser } from "@/store/userStore";
import {
  completeNote,
  dueReminders,
  markFired,
  REMINDER_KINDS,
  snoozeNote,
  type TextNote,
} from "@/lib/remindersStore";
import { getReminderTone } from "@/lib/reminderTone";
import { startRingtone, stopRingtone } from "@/lib/ringtone";

const SNOOZES = [5, 15, 60];

/** Fullscreen premium Al-Khal reminder alert. Mounted once globally. */
const ReminderAlert = () => {
  const { language } = useUser();
  const isAr = language === "ar";
  const [active, setActive] = useState<TextNote | null>(null);

  useEffect(() => {
    const check = () => {
      if (active) return;
      const due = dueReminders();
      if (due.length) {
        markFired(due[0].id);
        setActive(due[0]);
        try {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(due[0].title, { body: due[0].body || "مدار — تذكير الخال" });
          }
          navigator.vibrate?.([220, 90, 220]);
        } catch { /* ignore */ }
      }
    };
    check();
    const t = window.setInterval(check, 15000);
    window.addEventListener("madar:notes-changed", check);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("madar:notes-changed", check);
    };
  }, [active]);

  if (!active) return null;

  const kind = REMINDER_KINDS.find((k) => k.id === active.kind);
  const when = active.dueAt
    ? new Date(active.dueAt).toLocaleString(isAr ? "ar" : "en", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-2xl px-6"
    >
      <div className="absolute inset-x-0 top-0 h-40 gradient-gold opacity-20 blur-3xl" />

      <div className="relative w-full max-w-sm rounded-3xl border border-gold/40 bg-card/90 backdrop-blur-xl p-6 shadow-2xl shadow-black/40 text-center animate-pulse-glow">
        <div className="mx-auto w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center animate-float">
          <Bell className="w-7 h-7 text-primary-foreground" />
        </div>

        <p className="mt-4 text-[11px] font-cairo font-bold text-gold tracking-wide">
          {isAr ? "تذكير الخال" : "Al-Khal Reminder"} {kind?.emoji}
        </p>
        <h2 className="mt-1 text-xl font-cairo font-bold text-foreground leading-snug break-words">
          {active.title}
        </h2>
        {active.body && (
          <p className="mt-2 text-sm font-cairo text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {active.body}
          </p>
        )}
        <p className="mt-3 text-[11px] font-cairo text-muted-foreground flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gold" /> {when}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {SNOOZES.map((m) => (
            <button
              key={m}
              onClick={() => { snoozeNote(active.id, m); setActive(null); }}
              className="py-2.5 rounded-xl border border-gold/30 bg-background/60 text-[11px] font-cairo font-bold text-foreground active:scale-95"
            >
              {isAr ? `بعد ${m} د` : `+${m}m`}
            </button>
          ))}
        </div>

        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setActive(null)}
            className="flex-1 py-3 rounded-xl bg-background/60 border border-border text-xs font-cairo font-bold text-foreground active:scale-95 flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            {isAr ? "إغلاق" : "Dismiss"}
          </button>
          <button
            onClick={() => { completeNote(active.id); setActive(null); }}
            className="flex-1 py-3 rounded-xl gradient-gold text-primary-foreground text-xs font-cairo font-bold active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {isAr ? "تمّت" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderAlert;
