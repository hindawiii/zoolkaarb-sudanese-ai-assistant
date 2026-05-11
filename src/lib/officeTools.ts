// Office helpers: client-side image-to-PDF, text-to-PDF, and PDF<->Word via edge function.
import jsPDF from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import { supabase } from "@/integrations/supabase/client";

const WATERMARK_TEXT = "Madar";

const fileToDataUrl = (f: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

const fileToBase64 = async (f: File): Promise<string> => {
  const buf = await f.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

const addWatermark = (pdf: jsPDF) => {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.setTextColor(180, 140, 50);
  pdf.setFontSize(9);
  pdf.text(WATERMARK_TEXT, pageW - 10, pageH - 6, { align: "right" });
};

/** Combine multiple images into one PDF (one image per page, fit-to-page). */
export const imagesToPdf = async (
  files: File[],
  fileName = `zool-karb-${Date.now()}.pdf`,
): Promise<void> => {
  if (!files.length) throw new Error("No files");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < files.length; i++) {
    const url = await fileToDataUrl(files[i]);
    const img = await loadImage(url);
    const ratio = Math.min(pageW / img.width, pageH / img.height) * 0.95;
    const w = img.width * ratio;
    const h = img.height * ratio;
    if (i > 0) pdf.addPage();
    pdf.addImage(url, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    addWatermark(pdf);
  }
  pdf.save(fileName);
};

/** Render Arabic-friendly text into a PDF. Uses jsPDF default font (Latin) +
 *  draws each glyph as-is; for high-quality Arabic shaping, we render lines as
 *  centered text. Long paragraphs are wrapped by line. */
export const textToPdf = (text: string, fileName = `zool-karb-${Date.now()}.pdf`) => {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 40;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);

  const lines = pdf.splitTextToSize(text, pageW - margin * 2);
  let y = margin + 10;
  for (const line of lines) {
    if (y > pageH - margin) {
      addWatermark(pdf);
      pdf.addPage();
      y = margin + 10;
    }
    // RTL: align right
    pdf.text(line, pageW - margin, y, { align: "right" });
    y += 20;
  }
  addWatermark(pdf);
  pdf.save(fileName);
};

/** Convert markdown-ish text to a downloaded .docx file. */
export const markdownToDocx = async (
  md: string,
  fileName = `zool-karb-${Date.now()}.docx`,
) => {
  const lines = md.split(/\r?\n/);
  const children: Paragraph[] = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) {
      children.push(new Paragraph({ children: [new TextRun("")] }));
      continue;
    }
    if (line.startsWith("# ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: line.slice(2), bold: true })],
        }),
      );
    } else if (line.startsWith("## ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: line.slice(3), bold: true })],
        }),
      );
    } else if (line.startsWith("### ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: line.slice(4), bold: true })],
        }),
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bullet: { level: 0 },
          children: [new TextRun(line.slice(2))],
        }),
      );
    } else {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun(line)],
        }),
      );
    }
  }
  // Watermark footer paragraph
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `— ${WATERMARK_TEXT}`, italics: true, color: "B48C32" })],
    }),
  );
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
};

/** Send a PDF/DOCX/image to the edge function and get clean Markdown back. */
export const convertViaAi = async (
  file: File,
  mode: "pdf-to-word" | "word-to-pdf" | "ocr",
): Promise<string> => {
  const base64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke("pdf-convert", {
    body: { mode, file: base64, mimeType: file.type || "application/pdf" },
  });
  if (error) throw new Error(error.message || "AI conversion failed");
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any)?.content ?? "";
};
