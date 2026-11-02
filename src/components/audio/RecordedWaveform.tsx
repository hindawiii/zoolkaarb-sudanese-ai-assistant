import { useEffect, useRef } from "react";

export default function RecordedWaveform({ buffer }: { buffer: AudioBuffer | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const tokens = getComputedStyle(document.documentElement);
    context.fillStyle = `hsl(${tokens.getPropertyValue("--gold")})`;
    if (!buffer) {
      context.fillRect(0, canvas.height / 2, canvas.width, 1);
      return;
    }
    const samples = buffer.getChannelData(0);
    const bars = 80;
    for (let bar = 0; bar < bars; bar++) {
      const start = Math.floor(bar * samples.length / bars);
      const end = Math.floor((bar + 1) * samples.length / bars);
      let peak = 0;
      for (let i = start; i < end; i++) peak = Math.max(peak, Math.abs(samples[i]));
      const height = Math.max(2, Math.min(1, peak) * (canvas.height - 12));
      context.fillRect(bar * canvas.width / bars, (canvas.height - height) / 2, 3, height);
    }
  }, [buffer]);

  return <canvas ref={canvasRef} width={400} height={72} className="h-[72px] w-full" aria-label={buffer ? "موجة التسجيل الفعلي" : "لا يوجد تسجيل"} role="img" />;
}