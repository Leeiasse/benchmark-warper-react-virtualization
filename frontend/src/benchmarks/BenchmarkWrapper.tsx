import { useCallback, useEffect, useRef, useState } from "react";
import { useFpsMonitor } from "../hooks/useFpsMonitor";
import { useTransactionData } from "../hooks/useTransactionData";
import { useScrollSimulation } from "../hooks/useScrollSimulation";
import { FpsOverlay } from "../components/FpsOverlay";
import { BenchmarkControls } from "../components/BenchmarkControls";
import {
  CONTAINER_HEIGHT,
  DEFAULT_ROW_HEIGHT,
  type Library,
  type ScrollMode,
} from "../config";
import type { BenchmarkResult, ParentMessage } from "./types";

interface BenchmarkWrapperProps {
  library: Library;
  volume: number;
  children: (props: {
    data: typeof dataPlaceholder;
    heightMode: "fixed" | "variable";
    containerHeight: number;
    onScrollContainerReady: (el: HTMLElement) => void;
    scrollToIndexRef: React.MutableRefObject<((index: number) => void) | null>;
  }) => React.ReactNode;
  /** If true, listens to parent postMessage (iframe mode) */
  embedded?: boolean;
}

// Type placeholder for inference
const dataPlaceholder = [] as ReturnType<typeof useTransactionData>["data"];

export function BenchmarkWrapper({
  library,
  volume,
  children,
  embedded = false,
}: BenchmarkWrapperProps) {
  const { data, loading, progress, error } = useTransactionData(volume);
  const [scrollMode, setScrollMode] = useState<ScrollMode>("slow");
  const [heightMode, setHeightMode] = useState<"fixed" | "variable">("variable");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);

  const containerRef = useRef<HTMLElement | null>(null);
  const scrollToIndexRef = useRef<((index: number) => void) | null>(null);
  const startTimeRef = useRef(0);
  const startScrollTopRef = useRef(0);

  const { fps, reset: resetFps, getResults: getFpsResults } = useFpsMonitor(running);

  const { stop: stopScroll, getScrollStats } = useScrollSimulation({
    mode: scrollMode,
    active: running,
    containerRef,
    totalItems: data.length,
    scrollToIndex: (index) => scrollToIndexRef.current?.(index),
  });

  // Capture start scroll position on first frame after run starts
  useEffect(() => {
    if (!running) return;
    const id = requestAnimationFrame(() => {
      startScrollTopRef.current = containerRef.current?.scrollTop ?? 0;
    });
    return () => cancelAnimationFrame(id);
  }, [running]);

  const handleScrollContainerReady = useCallback((el: HTMLElement) => {
    containerRef.current = el;
  }, []);

  const start = useCallback(
    (mode?: ScrollMode, hMode?: "fixed" | "variable") => {
      if (mode) setScrollMode(mode);
      if (hMode) setHeightMode(hMode);
      resetFps();
      startTimeRef.current = performance.now();
      setRunning(true);
    },
    [resetFps]
  );

  const stop = useCallback(() => {
    setRunning(false);
    const duration = performance.now() - startTimeRef.current;
    const fpsData = getFpsResults();
    const scrollStats = getScrollStats();
    const endScrollTop = containerRef.current?.scrollTop ?? 0;
    const pixelsScrolled = Math.max(
      0,
      endScrollTop - startScrollTopRef.current
    );
    const linesTraversed = Math.round(pixelsScrolled / DEFAULT_ROW_HEIGHT);

    const result: BenchmarkResult = {
      library,
      volume: data.length,
      scrollMode,
      avgFps: fpsData.avg,
      minFps: fpsData.min === Infinity ? 0 : fpsData.min,
      maxFps: fpsData.max,
      duration: Math.round(duration),
      samples: fpsData.samples,
      timestamp: new Date().toISOString(),
      pixelsScrolled,
      linesTraversed,
      scrollFrames: scrollStats.frameCount,
      avgFrameMs: fpsData.avgFrameMs,
      maxFrameMs: fpsData.maxFrameMs,
      jankCount: fpsData.jankCount,
    };

    setResults((prev) => [...prev, result]);

    // Notify parent if embedded
    if (embedded) {
      window.parent.postMessage({ type: "RESULT", result }, "*");
    }
  }, [library, data.length, scrollMode, getFpsResults, getScrollStats, embedded]);

  const exportResults = useCallback(() => {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bench-${library}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, library]);

  // Listen for parent messages in embedded mode
  useEffect(() => {
    if (!embedded) return;

    // Signal ready
    window.parent.postMessage({ type: "READY", library }, "*");

    const handler = (e: MessageEvent<ParentMessage>) => {
      const msg = e.data;
      if (msg?.type === "START") {
        const { scrollMode: sm, heightMode: hm } = msg;
        setScrollMode(sm as ScrollMode);
        setHeightMode(hm);
        // Small delay to let state settle
        setTimeout(() => start(sm as ScrollMode, hm), 100);
      } else if (msg?.type === "STOP") {
        stop();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [embedded, library, start, stop]);

  // Report loading progress to parent
  useEffect(() => {
    if (embedded && loading) {
      window.parent.postMessage({ type: "LOADING", progress }, "*");
    }
  }, [embedded, loading, progress]);

  if (error) {
    return <div className="bench-error">Error: {error}</div>;
  }

  if (loading) {
    return (
      <div className="bench-loading">
        <div>Loading {library}...</div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div>{Math.round(progress * 100)}%</div>
      </div>
    );
  }

  return (
    <div className="bench-wrapper">
      {!embedded && (
        <>
          <div className="bench-header">
            <h2>{library}</h2>
            <span className="data-count">{data.length.toLocaleString()} rows</span>
          </div>
          <div className="control-group">
            <label>Height mode:</label>
            <select
              value={heightMode}
              onChange={(e) => setHeightMode(e.target.value as "fixed" | "variable")}
              disabled={running}
            >
              <option value="fixed">Fixed (50px)</option>
              <option value="variable">Variable (40-90px)</option>
            </select>
          </div>
          <BenchmarkControls
            scrollMode={scrollMode}
            onScrollModeChange={setScrollMode}
            running={running}
            onStart={() => start()}
            onStop={stop}
            onExport={exportResults}
            dataLoaded={data.length > 0}
          />
        </>
      )}

      <div className="bench-container">
        <FpsOverlay fps={fps} visible={running} />
        {children({
          data,
          heightMode,
          containerHeight: CONTAINER_HEIGHT,
          onScrollContainerReady: handleScrollContainerReady,
          scrollToIndexRef,
        })}
      </div>
    </div>
  );
}
