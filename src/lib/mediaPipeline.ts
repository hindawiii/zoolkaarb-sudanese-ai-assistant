// Media processing pipeline using ffmpeg.wasm.
// - extractAudioFile: strips audio from a video into AAC (.m4a) for clean playback.
// - renderImageWithAudio: builds an MP4 with the still image as background for
//   the full duration of the supplied audio.

import { getFFmpeg, fetchFile, runMediaJob } from "@/lib/ffmpegClient";

import { validateMedia } from "@/lib/fileValidation";

const safeName = (name: string) => name.replace(/[^a-z0-9.]/gi, "_");

export const extractAudioFile = async (
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<{ blob: Blob; ext: "m4a" | "mp3" }> => {
  validateMedia(file, "video");
  return runMediaJob(async () => {
  const ff = await getFFmpeg(onProgress);
  const jobId = crypto.randomUUID();
  const inputName = `in_${jobId}_${safeName(file.name)}`;
  const outputName = `out_${jobId}.m4a`;

  try {
    await ff.writeFile(inputName, await fetchFile(file));
    const exitCode = await ff.exec(["-i", inputName, "-vn", "-acodec", "aac", "-b:a", "192k", outputName]);
    if (exitCode !== 0) throw new Error("Audio extraction failed");
    const data = (await ff.readFile(outputName)) as Uint8Array;
    return { blob: new Blob([data.buffer as ArrayBuffer], { type: "audio/mp4" }), ext: "m4a" as const };
  } finally {
    await ff.deleteFile(inputName).catch(() => {});
    await ff.deleteFile(outputName).catch(() => {});
  }
  });
};

const detectImageExt = (file: File): string => {
  const m = file.name.match(/\.(png|jpe?g|webp|bmp|gif)$/i);
  if (m) return m[1].toLowerCase().replace("jpeg", "jpg");
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  return "jpg";
};

const detectAudioExt = (file: File): string => {
  const m = file.name.match(/\.(mp3|m4a|aac|wav|ogg|opus|webm)$/i);
  if (m) return m[1].toLowerCase();
  if (file.type.includes("mpeg")) return "mp3";
  if (file.type.includes("wav")) return "wav";
  if (file.type.includes("ogg")) return "ogg";
  if (file.type.includes("webm")) return "webm";
  return "m4a";
};

export const renderImageWithAudio = async (
  image: File,
  audio: File,
  onProgress?: (ratio: number) => void,
): Promise<Blob> => {
  validateMedia(image, "image");
  validateMedia(audio, "audio");
  return runMediaJob(async () => {
  const ff = await getFFmpeg(onProgress);
  const ts = crypto.randomUUID();
  try {
  const imgName = `img_${ts}.${detectImageExt(image)}`;
  const audName = `aud_${ts}.${detectAudioExt(audio)}`;
  const outName = `out_${ts}.mp4`;

  await ff.writeFile(imgName, await fetchFile(image));
  await ff.writeFile(audName, await fetchFile(audio));

  // Loop the still image, end when audio ends, ensure even dimensions, yuv420p
  // for broad compatibility, AAC audio, fast encoding settings for wasm.
  const exitCode = await ff.exec([
    "-loop", "1",
    "-framerate", "2",
    "-i", imgName,
    "-i", audName,
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-tune", "stillimage",
    "-r", "24",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    outName,
  ]);

  if (exitCode !== 0) throw new Error("Video export failed");
  const data = (await ff.readFile(outName)) as Uint8Array;
  return new Blob([data.buffer as ArrayBuffer], { type: "video/mp4" });
  } finally {
    await ff.deleteFile(imgName).catch(() => {});
    await ff.deleteFile(audName).catch(() => {});
    await ff.deleteFile(outName).catch(() => {});
  }
  });
};
