import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Props {
  children: React.ReactNode;
  isRtl?: boolean;
}

/** Pinch / wheel zoom + pan viewer for the Quick Tools image preview. */
const ZoomPanViewer = ({ children, isRtl }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const panRef = useRef<{ x: number; y: number } | null>(null);

  const zoomAt = useCallback((px: number, py: number, next: number) => {
    const { zoom: z, offset: o } = stateRef.current;
    const nz = clamp(next, MIN_ZOOM, MAX_ZOOM);
    const k = nz / z;
    const no = { x: px - (px - o.x) * k, y: py - (py - o.y) * k };
    setZoom(nz);
    setOffset(nz === 1 ? { x: 0, y: 0 } : no);
  }, []);

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      zoomAtRef.current(
        e.clientX - rect.left,
        e.clientY - rect.top,
        stateRef.current.zoom * Math.exp(-dy * 0.0018),
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const localPoint = (cx: number, cy: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const mid = localPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: mid.x, cy: mid.y };
      panRef.current = null;
    } else if (stateRef.current.zoom > 1) {
      panRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchRef.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = localPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
      const ratio = dist / (pinchRef.current.dist || dist);
      zoomAtRef.current(mid.x, mid.y, stateRef.current.zoom * ratio);
      // pan with the moving midpoint
      const dx = mid.x - pinchRef.current.cx;
      const dy = mid.y - pinchRef.current.cy;
      if (stateRef.current.zoom > 1) setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      pinchRef.current = { dist, cx: mid.x, cy: mid.y };
      return;
    }

    if (panRef.current && stateRef.current.zoom > 1) {
      const dx = e.clientX - panRef.current.x;
      const dy = e.clientY - panRef.current.y;
      panRef.current = { x: e.clientX, y: e.clientY };
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) panRef.current = null;
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const stepZoom = (factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, stateRef.current.zoom * factor);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => (zoom > 1 ? reset() : stepZoom(2))}
    >
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        {children}
      </div>

      <div className="absolute bottom-2 end-2 flex items-center gap-1 rounded-xl bg-black/55 backdrop-blur-md px-1 py-1">
        <button
          onClick={() => stepZoom(1 / 1.4)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/90 active:scale-90"
          aria-label="zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-cairo text-white/80 w-9 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => stepZoom(1.4)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/90 active:scale-90"
          aria-label="zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={reset}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gold active:scale-90"
          aria-label="reset zoom"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {zoom === 1 && (
        <div className="absolute top-2 start-2 rounded-lg bg-black/50 backdrop-blur-md px-2 py-1 pointer-events-none">
          <p className="text-[9.5px] font-cairo text-white/80">
            {isRtl ? "قرّب بإصبعين للتكبير" : "Pinch to zoom"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ZoomPanViewer;
