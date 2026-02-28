import type { ScrollMode } from "../config";

interface BenchmarkControlsProps {
  scrollMode: ScrollMode;
  onScrollModeChange: (mode: ScrollMode) => void;
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onExport: () => void;
  dataLoaded: boolean;
}

export function BenchmarkControls({
  scrollMode,
  onScrollModeChange,
  running,
  onStart,
  onStop,
  onExport,
  dataLoaded,
}: BenchmarkControlsProps) {
  return (
    <div className="bench-controls">
      <div className="control-group">
        <label>Scroll mode:</label>
        <select
          value={scrollMode}
          onChange={(e) => onScrollModeChange(e.target.value as ScrollMode)}
          disabled={running}
        >
          <option value="slow">Slow (300 px/s)</option>
          <option value="fast">Fast (5000 px/s)</option>
          <option value="programmatic">Programmatic (random jumps)</option>
        </select>
      </div>

      <div className="control-group">
        {!running ? (
          <button
            className="btn btn-start"
            onClick={onStart}
            disabled={!dataLoaded}
          >
            Start Benchmark
          </button>
        ) : (
          <button className="btn btn-stop" onClick={onStop}>
            Stop
          </button>
        )}
        <button className="btn btn-export" onClick={onExport} disabled={running}>
          Export JSON
        </button>
      </div>
    </div>
  );
}
