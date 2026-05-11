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
              {isAr ? "مفكرة الخال الصوتية" : "Al-Khal Voice Notes"}
            </SheetTitle>
            <p className="text-xs text-muted-foreground text-start font-cairo">
              {isAr
                ? "سجّل، فرتق، لخّص، وشارك بسرعة 🎙️"
                : "Record, transcribe, summarize, share."}
            </p>
          </SheetHeader>

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
