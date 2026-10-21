import { expect, it } from "vitest";
import { validateDocument, validateMedia } from "@/lib/fileValidation";

it("rejects unsupported document formats before sending a request", () => {
  expect(() => validateDocument(new File(["text"], "test.txt", { type: "text/plain" }), "pdf-to-word")).toThrow();
  expect(() => validateDocument(new File(["pdf"], "test.pdf", { type: "application/pdf" }), "pdf-to-word")).not.toThrow();
});
it("rejects an audio file selected as an image", () => {
  expect(() => validateMedia(new File(["audio"], "test.mp3", { type: "audio/mpeg" }), "image")).toThrow();
});