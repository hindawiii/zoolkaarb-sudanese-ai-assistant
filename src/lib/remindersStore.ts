// Al-Khal notepad: text notes + scheduled reminders (LocalStorage)
export type ReminderKind = "meeting" | "appointment" | "event" | "task";

export interface TextNote {
  id: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  body: string;
  kind: ReminderKind;
  /** epoch ms of the reminder, undefined = no reminder */
  dueAt?: number;
  done?: boolean;
  /** last time the fullscreen alert fired for this note */
  firedAt?: number;
}

const KEY = "madar-text-notes";

export const REMINDER_KINDS: { id: ReminderKind; ar: string; en: string; emoji: string }[] = [
  { id: "meeting", ar: "اجتماع", en: "Meeting", emoji: "🤝" },
  { id: "appointment", ar: "موعد", en: "Appointment", emoji: "📅" },
  { id: "event", ar: "مناسبة", en: "Event", emoji: "🎉" },
  { id: "task", ar: "مهمة", en: "Task", emoji: "✅" },
];

export const loadTextNotes = (): TextNote[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as TextNote[]) : [];
    return list.sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) || b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
};

export const saveTextNotes = (notes: TextNote[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes.slice(0, 200)));
    window.dispatchEvent(new CustomEvent("madar:notes-changed"));
  } catch (e) {
    console.error("Failed saving text notes", e);
  }
};

export const upsertTextNote = (note: TextNote) => {
  const all = loadTextNotes();
  const idx = all.findIndex((n) => n.id === note.id);
  if (idx >= 0) all[idx] = note;
  else all.unshift(note);
  saveTextNotes(all);
};

export const deleteTextNote = (id: string) => {
  saveTextNotes(loadTextNotes().filter((n) => n.id !== id));
};

export const createTextNote = (
  partial: Partial<TextNote> & { title: string },
): TextNote => ({
  id: crypto.randomUUID(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  body: "",
  kind: "task",
  ...partial,
});

/** Notes whose reminder time has arrived and haven't been dismissed yet. */
export const dueReminders = (now = Date.now()): TextNote[] =>
  loadTextNotes().filter((n) => !n.done && n.dueAt !== undefined && n.dueAt <= now && !n.firedAt);

/** Push a reminder forward by `minutes` (snooze). */
export const snoozeNote = (id: string, minutes: number) => {
  const all = loadTextNotes();
  const n = all.find((x) => x.id === id);
  if (!n) return;
  n.dueAt = Date.now() + minutes * 60_000;
  n.firedAt = undefined;
  n.updatedAt = Date.now();
  saveTextNotes(all);
};

export const markFired = (id: string) => {
  const all = loadTextNotes();
  const n = all.find((x) => x.id === id);
  if (!n) return;
  n.firedAt = Date.now();
  saveTextNotes(all);
};

export const completeNote = (id: string) => {
  const all = loadTextNotes();
  const n = all.find((x) => x.id === id);
  if (!n) return;
  n.done = true;
  n.firedAt = Date.now();
  n.updatedAt = Date.now();
  saveTextNotes(all);
};

/** "2026-08-12T19:40" <-> epoch helpers for <input type="datetime-local"> */
export const toLocalInput = (ms?: number) => {
  if (!ms) return "";
  const d = new Date(ms - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

export const fromLocalInput = (v: string) => (v ? new Date(v).getTime() : undefined);
