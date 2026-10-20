export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

export function validateDocument(file: File, mode: "pdf-to-word" | "word-to-pdf" | "ocr") {
  if (file.size === 0 || file.size > MAX_DOCUMENT_BYTES) throw new Error("حجم الملف يجب أن يكون بين 1 بايت و10 ميجابايت / Max 10 MB");
  const valid = mode === "word-to-pdf"
    ? /\.docx?$/i.test(file.name)
    : mode === "ocr" ? file.type.startsWith("image/") : file.type === "application/pdf" || /\.pdf$/i.test(file.name) || file.type.startsWith("image/");
  if (!valid) throw new Error("نوع الملف غير مناسب للتحويل / Unsupported file type");
}

export function validateMedia(file: File, kind: "video" | "audio" | "image") {
  if (file.size === 0 || file.size > MAX_MEDIA_BYTES) throw new Error("حجم الملف يجب ألا يتجاوز 100 ميجابايت / Max 100 MB");
  if (!file.type.startsWith(`${kind}/`)) throw new Error("نوع ملف الميديا غير مناسب / Unsupported media type");
}