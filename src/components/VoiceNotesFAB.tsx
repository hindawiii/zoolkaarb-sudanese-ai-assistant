import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Sparkles,
  Copy,
  Share2,
  Trash2,
  Loader2,
  Bell,
  X,
  Play,
  Pause,
  Cloud,
  Plus,
  Pencil,
  Clock,
  CheckCircle2,
  StickyNote,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/store/userStore";
import {
  loadNotes,
  upsertNote,
  deleteNote,
  type VoiceNote,
} from "@/lib/voiceNotesStore";
import { cn } from "@/lib/utils";
import {
  loadTextNotes,
  upsertTextNote,
  deleteTextNote,
  createTextNote,
  completeNote,
  toLocalInput,
  fromLocalInput,
  REMINDER_KINDS,
  type TextNote,
  type ReminderKind,
} from "@/lib/remindersStore";

const FAB_KEY = "zoolkaarb-fab-pos";

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

const dataUrlToBase64 = (url: string) => url.split(",")[1] ?? "";

const detectTimePhrase = (text: string): string | null => {
  // simple Arabic time/date detector: "ساعة ٤", "بكرة", "اليوم", "الجمعة"
  const m = text.match(
    /(الساعة|ساعة)\s*[\d٠-٩]+|بكرة|الليلة|الصباح|المغرب|العصر|الجمعة|السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس/u,
  );
  return m ? m[0] : null;
};

const VoiceNotesFAB = () => {
  const { language } = useUser();
  const isAr = language === "ar";
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"text" | "voice">("text");
  const [textNotes, setTextNotes] = useState<TextNote[]>([]);
  const [editing, setEditing] = useState<TextNote | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // FAB drag state
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = localStorage.getItem(FAB_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { x: 16, y: 96 };
  });
  const dragStateRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({ active: false, moved: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => setNotes(loadNotes()), [open]);

  useEffect(() => {
    const refresh = () => setTextNotes(loadTextNotes());
    refresh();
    window.addEventListener("madar:notes-changed", refresh);
    return () => window.removeEventListener("madar:notes-changed", refresh);
  }, [open]);

  const startNewNote = () => {
    setEditing(createTextNote({ title: "", kind: "task" }));
  };

  const saveEditing = () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast({ title: isAr ? "اكتب عنوان الملاحظة" : "Add a title", variant: "destructive" });
      return;
    }
    if (editing.dueAt && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    upsertTextNote({ ...editing, title: editing.title.trim(), updatedAt: Date.now() });
    setTextNotes(loadTextNotes());
    setEditing(null);
    toast({ title: isAr ? "انحفظت 👌" : "Saved" });
  };

  // Allow other components (e.g. BottomNav center button) to open the sheet
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("zoolkaarb:open-voice-notes", handler);
    return () => window.removeEventListener("zoolkaarb:open-voice-notes", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const dataUrl = await blobToDataUrl(blob);
        const dur = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const note: VoiceNote = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          durationSec: dur,
          audioDataUrl: dataUrl,
        };
        upsertNote(note);
        setNotes(loadNotes());
        toast({
          title: isAr ? "تم الحفظ في الخزنة" : "Saved",
          description: isAr ? "كلامك في أمان 🔒" : "Your note is safe.",
        });
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = mr;
      startedAtRef.current = Date.now();
      setElapsed(0);
      tickRef.current = window.setInterval(
        () => setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000)),
        500,
      );
      mr.start();
      setRecording(true);
      toast({
        title: isAr ? "أبشر يا هندسة" : "Listening",
        description: isAr ? "الخال سامعك ومسجل كلامك 🎙️" : "Al-Khal is listening.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: isAr ? "ما قدرنا نفتح المايك" : "Microphone error",
        description: isAr ? "تأكد من إذن الميكروفون" : "Please allow microphone access.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
  };

  const transcribe = async (note: VoiceNote) => {
    setBusyId(note.id);
    try {
      const { data, error } = await supabase.functions.invoke("voice-notes", {
        body: {
          mode: "transcribe",
          audioBase64: dataUrlToBase64(note.audioDataUrl),
          mimeType: note.audioDataUrl.split(";")[0].replace("data:", ""),
        },
      });
      if (error) throw error;
      const updated: VoiceNote = { ...note, transcript: (data as any)?.transcript ?? "" };
      upsertNote(updated);
      setNotes(loadNotes());
      toast({ title: isAr ? "الخال فرتق الكلام ✍️" : "Transcribed" });
    } catch (e: any) {
      console.error(e);
      toast({
        title: isAr ? "ما قدرنا نفرتق" : "Transcription failed",
        description: e?.message ?? "",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const summarize = async (note: VoiceNote) => {
    if (!note.transcript) {
      await transcribe(note);
      return;
    }
    setBusyId(note.id);
    try {
      const { data, error } = await supabase.functions.invoke("voice-notes", {
        body: { mode: "summarize", text: note.transcript },
      });
      if (error) throw error;
      const updated: VoiceNote = {
        ...note,
        summary: (data as any)?.bullets ?? [],
        reminders: (data as any)?.reminders ?? [],
      };
      upsertNote(updated);
      setNotes(loadNotes());
      toast({ title: isAr ? "الخال لخّص ليك" : "Summarized" });
    } catch (e: any) {
      console.error(e);
      toast({
        title: isAr ? "ما قدرنا نلخص" : "Summary failed",
        description: e?.message ?? "",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: isAr ? "تم النسخ" : "Copied" });
  };

  const shareText = async (text: string) => {
    const data = { text, title: "Madar" };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const addReminder = (when: string, text: string) => {
    // Local notification scheduling: show toast guidance
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    toast({
      title: isAr ? "تنبيه محفوظ" : "Reminder set",
      description: `${when} — ${text}`,
    });
  };

  const togglePlay = (note: VoiceNote) => {
    if (playingId === note.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio(note.audioDataUrl);
    audioRef.current = a;
    a.onended = () => setPlayingId(null);
    a.play();
    setPlayingId(note.id);
  };

  // Drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    dragStateRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = dragStateRef.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) s.moved = true;
    const maxX = window.innerWidth - 64;
    const maxY = window.innerHeight - 80;
    setPos({
      x: Math.min(maxX, Math.max(8, s.origX - dx)), // x is from end (right/left depending on dir handled by style)
      y: Math.min(maxY, Math.max(8, s.origY - dy)),
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = dragStateRef.current;
    s.active = false;
    try {
      localStorage.setItem(FAB_KEY, JSON.stringify(pos));
    } catch {}
    if (!s.moved) setOpen(true);
  };

  // Suppress unused-warning for legacy drag handlers (kept for future re-enable)
  void onPointerDown; void onPointerMove; void onPointerUp; void pos;

  return (
    <>
      {/* Floating mic FAB removed — primary entry is now the BottomNav center button */}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl max-h-[85vh] p-0 flex flex-col"
        >
          <SheetHeader className="p-5 pb-3 border-b border-border">
            <SheetTitle className="text-start font-cairo flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {isAr ? "مفكرة الخال" : "Al-Khal Notepad"}
            </SheetTitle>
            <p className="text-xs text-muted-foreground text-start font-cairo">
              {isAr
                ? "اكتب، ذكّر نفسك، سجّل صوت — كله في مكان واحد ✍️🎙️"
                : "Write, set reminders, record voice — all in one place."}
            </p>
            <div className="flex gap-2 pt-2">
              {(["text", "voice"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[11px] font-cairo font-bold border active:scale-95 flex items-center justify-center gap-1.5",
                    tab === t
                      ? "gradient-gold text-primary-foreground border-transparent"
                      : "bg-card border-border text-foreground",
                  )}
                >
                  {t === "text" ? <StickyNote className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {t === "text" ? (isAr ? "كتابة وتذكير" : "Notes & Reminders") : (isAr ? "ملاحظات صوتية" : "Voice notes")}
                </button>
              ))}
            </div>
          </SheetHeader>

          {tab === "text" && (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3" dir={isAr ? "rtl" : "ltr"}>
                {!editing && (
                  <Button onClick={startNewNote} className="w-full gradient-gold text-primary-foreground font-cairo rounded-xl">
                    <Plus className="w-4 h-4" />
                    {isAr ? "ملاحظة أو تذكير جديد" : "New note or reminder"}
                  </Button>
                )}

                {editing && (
                  <div className="rounded-2xl border border-gold/40 bg-card p-3 space-y-2.5">
                    <input
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      placeholder={isAr ? "العنوان — مثلاً: اجتماع مع الخال" : "Title"}
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-cairo text-foreground outline-none focus:border-gold"
                    />
                    <textarea
                      value={editing.body}
                      onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                      placeholder={isAr ? "التفاصيل..." : "Details..."}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-cairo text-foreground outline-none focus:border-gold resize-none"
                    />
                    <div className="grid grid-cols-4 gap-1.5">
                      {REMINDER_KINDS.map((k) => (
                        <button
                          key={k.id}
                          onClick={() => setEditing({ ...editing, kind: k.id as ReminderKind })}
                          className={cn(
                            "py-2 rounded-lg border text-[10px] font-cairo font-bold active:scale-95 flex flex-col items-center gap-0.5",
                            editing.kind === k.id ? "gradient-gold text-primary-foreground border-transparent" : "bg-background border-border text-foreground",
                          )}
                        >
                          <span className="text-sm leading-none">{k.emoji}</span>
                          {isAr ? k.ar : k.en}
                        </button>
                      ))}
                    </div>
                    <div>
                      <p className="text-[11px] font-cairo text-muted-foreground mb-1 flex items-center gap-1">
                        <Bell className="w-3 h-3 text-gold" />
                        {isAr ? "وقت التذكير (التاريخ والساعة)" : "Reminder date & time"}
                      </p>
                      <input
                        type="datetime-local"
                        value={toLocalInput(editing.dueAt)}
                        onChange={(e) => setEditing({ ...editing, dueAt: fromLocalInput(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-cairo text-foreground outline-none focus:border-gold"
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        {[
                          { m: 60, ar: "بعد ساعة", en: "+1h" },
                          { m: 60 * 3, ar: "بعد 3 ساعات", en: "+3h" },
                          { m: 60 * 24, ar: "بكرة", en: "Tomorrow" },
                        ].map((q) => (
                          <button
                            key={q.m}
                            onClick={() => setEditing({ ...editing, dueAt: Date.now() + q.m * 60000 })}
                            className="flex-1 py-1.5 rounded-lg border border-gold/30 bg-background text-[10px] font-cairo font-bold text-foreground active:scale-95"
                          >
                            {isAr ? q.ar : q.en}
                          </button>
                        ))}
                        {editing.dueAt && (
                          <button
                            onClick={() => setEditing({ ...editing, dueAt: undefined })}
                            className="px-2 rounded-lg border border-border bg-background text-muted-foreground active:scale-95"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" className="flex-1 font-cairo rounded-xl" onClick={() => setEditing(null)}>
                        {isAr ? "إلغاء" : "Cancel"}
                      </Button>
                      <Button className="flex-1 gradient-gold text-primary-foreground font-cairo rounded-xl" onClick={saveEditing}>
                        {isAr ? "حفظ" : "Save"}
                      </Button>
                    </div>
                  </div>
                )}

                {textNotes.length === 0 && !editing && (
                  <p className="text-xs text-muted-foreground text-start font-cairo py-6">
                    {isAr ? "ما في ملاحظات لسه — اكتب أول تذكير للخال." : "No notes yet — write your first reminder."}
                  </p>
                )}

                {textNotes.map((n) => {
                  const k = REMINDER_KINDS.find((x) => x.id === n.kind);
                  const overdue = !!n.dueAt && n.dueAt < Date.now() && !n.done;
                  return (
                    <div key={n.id} className={cn("rounded-2xl border bg-card p-3 space-y-1.5", n.done ? "border-border opacity-60" : overdue ? "border-destructive/50" : "border-gold/25")}>
                      <div className="flex items-start gap-2">
                        <span className="text-base leading-none mt-0.5">{k?.emoji}</span>
                        <div className="flex-1 min-w-0 text-start">
                          <p className={cn("text-sm font-cairo font-bold text-foreground break-words", n.done && "line-through")}>{n.title}</p>
                          {n.body && <p className="text-xs font-cairo text-muted-foreground whitespace-pre-wrap">{n.body}</p>}
                          {n.dueAt && (
                            <p className={cn("mt-1 text-[10px] font-cairo flex items-center gap-1", overdue ? "text-destructive" : "text-gold")}>
                              <Clock className="w-3 h-3" />
                              {new Date(n.dueAt).toLocaleString(isAr ? "ar" : "en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!n.done && (
                            <button onClick={() => { completeNote(n.id); setTextNotes(loadTextNotes()); }} className="w-8 h-8 rounded-full text-muted-foreground hover:text-emerald-500 flex items-center justify-center" aria-label="done">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => setEditing(n)} className="w-8 h-8 rounded-full text-muted-foreground hover:text-gold flex items-center justify-center" aria-label="edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { deleteTextNote(n.id); setTextNotes(loadTextNotes()); }} className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive flex items-center justify-center" aria-label="delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {tab === "voice" && (
            <>

          {/* Recorder */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <Button
                onClick={recording ? stopRecording : startRecording}
                size="lg"
                className={cn(
                  "rounded-full w-16 h-16 p-0",
                  recording
                    ? "bg-destructive hover:bg-destructive/90"
                    : "gradient-gold text-primary-foreground",
                  recording && "animate-pulse",
                )}
              >
                {recording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              <div className="flex-1 min-w-0">
                <div className="font-cairo text-sm text-foreground">
                  {recording
                    ? isAr
                      ? "جاري التسجيل..."
                      : "Recording..."
                    : isAr
                      ? "اضغط للتسجيل"
                      : "Tap to record"}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                  {String(elapsed % 60).padStart(2, "0")}
                </div>
              </div>
            </div>
          </div>

          {/* Notes list */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground font-cairo text-start">
                {isAr ? "الملاحظات الأخيرة" : "Recent Notes"}
              </h3>
              {notes.length === 0 && (
                <p className="text-xs text-muted-foreground text-start font-cairo py-6">
                  {isAr ? "ما في ملاحظات لسه. ابدأ التسجيل!" : "No notes yet. Start recording!"}
                </p>
              )}
              {notes.map((note) => {
                const timePhrase = note.transcript ? detectTimePhrase(note.transcript) : null;
                const isBusy = busyId === note.id;
                return (
                  <div
                    key={note.id}
                    className="rounded-2xl bg-card border border-border p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePlay(note)}
                        className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
                      >
                        {playingId === note.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ms-0.5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0 text-start">
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {new Date(note.createdAt).toLocaleString(isAr ? "ar" : "en")} ·{" "}
                          {note.durationSec}s
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          deleteNote(note.id);
                          setNotes(loadNotes());
                        }}
                        className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive flex items-center justify-center"
                        aria-label="delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {note.transcript && (
                      <p className="text-sm text-foreground font-cairo text-start whitespace-pre-wrap">
                        {note.transcript}
                      </p>
                    )}

                    {note.summary && note.summary.length > 0 && (
                      <ul className="text-xs text-muted-foreground font-cairo text-start list-disc ps-5 space-y-1">
                        {note.summary.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}

                    {((note.reminders && note.reminders.length > 0) || timePhrase) && (
                      <div className="flex flex-wrap gap-2">
                        {(note.reminders ?? (timePhrase ? [{ when: timePhrase, text: note.transcript ?? "" }] : []))
                          .map((r, i) => (
                            <button
                              key={i}
                              onClick={() => addReminder(r.when, r.text)}
                              className="text-[11px] rounded-full bg-accent text-accent-foreground px-3 py-1 flex items-center gap-1 font-cairo"
                            >
                              <Bell className="w-3 h-3" />
                              {isAr ? `أعمل ليك تنبيه؟ (${r.when})` : `Remind me (${r.when})`}
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {!note.transcript ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() => transcribe(note)}
                          className="font-cairo"
                        >
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {isAr ? "الخال يفرتق الكلام" : "Transcribe"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() => summarize(note)}
                          className="font-cairo"
                        >
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {isAr ? "لخّص" : "Summarize"}
                        </Button>
                      )}
                      {note.transcript && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copy(note.transcript!)}
                            className="font-cairo"
                          >
                            <Copy className="w-4 h-4" />
                            {isAr ? "نسخ" : "Copy"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => shareText(note.transcript!)}
                            className="font-cairo"
                          >
                            <Share2 className="w-4 h-4" />
                            {isAr ? "مشاركة" : "Share"}
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          toast({
                            title: isAr ? "قريباً" : "Coming soon",
                            description: isAr
                              ? "رفع الملاحظة للسحابة قريباً"
                              : "Cloud upload coming soon",
                          })
                        }
                        className="font-cairo"
                      >
                        <Cloud className="w-4 h-4" />
                        {isAr ? "للسحابة" : "Cloud"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default VoiceNotesFAB;
