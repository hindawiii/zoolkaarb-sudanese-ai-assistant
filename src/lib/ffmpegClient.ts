import type { FFmpeg } from "@ffmpeg/ffmpeg";
import wasmAsset from "@/assets/ffmpeg-core.wasm.asset.json";
import classWorkerURL from "../../node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js?worker&url";

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;
let progressCallback: ((ratio: number) => void) | undefined;
let logCallback: ((message: string) => void) | undefined;

export const getFFmpeg = async (
  onProgress?: (ratio: number) => void,
  onLog?: (msg: string) => void,
): Promise<FFmpeg> => {
  progressCallback = onProgress;
  logCallback = onLog;
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ff = new FFmpeg();
    ff.on("progress", ({ progress }) => progressCallback?.(Math.max(0, Math.min(1, progress))));
    ff.on("log", ({ message }) => logCallback?.(message));
    let coreURL: string | undefined;
    let wasmURL: string | undefined;
    try {
      coreURL = await toBlobURL("/ffmpeg/ffmpeg-core.js", "text/javascript");
      wasmURL = await toBlobURL(wasmAsset.url, "application/wasm");
      await ff.load({ coreURL, wasmURL, classWorkerURL });
      ffmpegInstance = ff;
      return ff;
    } catch (error) {
      ff.terminate();
      throw error;
    } finally {
      if (coreURL) URL.revokeObjectURL(coreURL);
      if (wasmURL) URL.revokeObjectURL(wasmURL);
    }
  })();
  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
};

/** Serialize local jobs; one WASM filesystem cannot run two encodes together. */
let jobQueue: Promise<unknown> = Promise.resolve();
export function runMediaJob<T>(job: () => Promise<T>): Promise<T> {
  const next = jobQueue.then(job, job);
  jobQueue = next.catch(() => {});
  return next;
}

export const fetchFile = async (file: File): Promise<Uint8Array> =>
  new Uint8Array(await file.arrayBuffer());
