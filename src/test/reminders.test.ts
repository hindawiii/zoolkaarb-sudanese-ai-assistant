import { beforeEach, expect, it } from "vitest";
import { createTextNote, dueReminders, fromLocalInput, markFired, upsertTextNote } from "@/lib/remindersStore";

beforeEach(() => localStorage.clear());
it("returns a saved reminder when due, once only", () => {
  const note = createTextNote({ title: "موعد", dueAt: 1000 });
  upsertTextNote(note);
  expect(dueReminders(999)).toHaveLength(0);
  expect(dueReminders(1000).map(n => n.id)).toEqual([note.id]);
  markFired(note.id);
  expect(dueReminders(1001)).toHaveLength(0);
});
it("does not save an invalid time as NaN", () => {
  expect(fromLocalInput("not a date")).toBeUndefined();
});