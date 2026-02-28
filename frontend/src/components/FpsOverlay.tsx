import type { FpsStats } from "../hooks/useFpsMonitor";

interface FpsOverlayProps {
  fps: FpsStats;
  visible: boolean;
}

function getFpsColor(fps: number): string {
  if (fps > 55) return "#22c55e";
  if (fps > 30) return "#eab308";
  return "#ef4444";
}

export function FpsOverlay({ fps, visible }: FpsOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fps-overlay">
      <div className="fps-current" style={{ color: getFpsColor(fps.current) }}>
        {fps.current} FPS
      </div>
      <div className="fps-details">
        <span>avg: {fps.avg}</span>
        <span>min: {fps.min}</span>
        <span>max: {fps.max}</span>
      </div>
    </div>
  );
}
