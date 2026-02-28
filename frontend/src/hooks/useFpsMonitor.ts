import { useCallback, useEffect, useRef, useState } from "react";
import { FPS_DISPLAY_INTERVAL, FPS_WINDOW_SIZE, JANK_THRESHOLD_MS } from "../config";

export interface FpsStats {
  current: number;
  avg: number;
  min: number;
  max: number;
  samples: number[];
}

export interface FpsResult {
  current: number;
  avg: number;
  min: number;
  max: number;
  samples: number[];
  /** Average frame time in ms */
  avgFrameMs: number;
  /** Max frame time in ms */
  maxFrameMs: number;
  /** Number of frames that exceeded the 60Hz budget (jank) */
  jankCount: number;
}

export function useFpsMonitor(active: boolean) {
  const [display, setDisplay] = useState<FpsStats>({
    current: 0,
    avg: 0,
    min: 0,
    max: 0,
    samples: [],
  });

  const statsRef = useRef<FpsStats>({
    current: 0,
    avg: 0,
    min: Infinity,
    max: 0,
    samples: [],
  });
  const frameTimes = useRef<number[]>([]);
  const frameTimesMs = useRef<number[]>([]);
  const lastFrameTime = useRef(0);
  const rafId = useRef(0);
  const displayTimerId = useRef(0);
  const allSamples = useRef<number[]>([]);
  const allFrameTimesMs = useRef<number[]>([]);

  const reset = useCallback(() => {
    statsRef.current = { current: 0, avg: 0, min: Infinity, max: 0, samples: [] };
    frameTimes.current = [];
    frameTimesMs.current = [];
    allSamples.current = [];
    allFrameTimesMs.current = [];
    lastFrameTime.current = 0;
    setDisplay({ current: 0, avg: 0, min: 0, max: 0, samples: [] });
  }, []);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafId.current);
      clearInterval(displayTimerId.current);
      return;
    }

    reset();
    lastFrameTime.current = performance.now();

    const loop = (now: number) => {
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;

      if (delta > 0) {
        const fps = 1000 / delta;
        const times = frameTimes.current;
        times.push(fps);
        if (times.length > FPS_WINDOW_SIZE) times.shift();

        const timesMs = frameTimesMs.current;
        timesMs.push(delta);
        if (timesMs.length > FPS_WINDOW_SIZE) timesMs.shift();
        allFrameTimesMs.current.push(delta);

        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);

        statsRef.current.current = Math.round(fps);
        statsRef.current.avg = Math.round(avg);
        statsRef.current.min = Math.round(min);
        statsRef.current.max = Math.round(max);

        allSamples.current.push(Math.round(fps));
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);

    // Throttled display update to avoid re-renders
    displayTimerId.current = window.setInterval(() => {
      setDisplay({
        ...statsRef.current,
        samples: [...allSamples.current],
      });
    }, FPS_DISPLAY_INTERVAL);

    return () => {
      cancelAnimationFrame(rafId.current);
      clearInterval(displayTimerId.current);
    };
  }, [active, reset]);

  const getResults = useCallback((): FpsResult => {
    const samples = allSamples.current;
    const allMs = allFrameTimesMs.current;
    const avgFrameMs =
      allMs.length > 0 ? allMs.reduce((a, b) => a + b, 0) / allMs.length : 0;
    const maxFrameMs = allMs.length > 0 ? Math.max(...allMs) : 0;
    const jankCount = allMs.filter((t) => t > JANK_THRESHOLD_MS).length;
    return {
      ...statsRef.current,
      samples: [...samples],
      avgFrameMs: Math.round(avgFrameMs * 100) / 100,
      maxFrameMs: Math.round(maxFrameMs * 100) / 100,
      jankCount,
    };
  }, []);

  return { fps: display, reset, getResults };
}
