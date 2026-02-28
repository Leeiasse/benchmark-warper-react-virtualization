import { useCallback, useEffect, useRef } from "react";
import { SCROLL_SPEEDS, PROGRAMMATIC_INTERVAL } from "../config";
import { createSeededRandom } from "../utils/seededRandom";
import type { ScrollMode } from "../config";

interface ScrollSimulationOptions {
  mode: ScrollMode;
  active: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  totalItems: number;
  scrollToIndex?: (index: number) => void;
}

export interface ScrollStats {
  frameCount: number;
  startScrollTop: number;
}

/**
 * Delta-based scroll simulation.
 * Uses performance.now() deltas so frame drops don't slow the scroll.
 * Tracks scroll frame count and start scroll position for stats.
 */
export function useScrollSimulation({
  mode,
  active,
  containerRef,
  totalItems,
  scrollToIndex,
}: ScrollSimulationOptions) {
  const rafId = useRef(0);
  const lastTime = useRef(0);
  const randomFn = useRef(createSeededRandom(42));
  const intervalId = useRef(0);
  const frameCountRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const startScrollTopSetRef = useRef(false);

  const stopScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    clearInterval(intervalId.current);
    rafId.current = 0;
    intervalId.current = 0;
  }, []);

  const getScrollStats = useCallback((): ScrollStats => {
    return {
      frameCount: frameCountRef.current,
      startScrollTop: startScrollTopRef.current,
    };
  }, []);

  useEffect(() => {
    if (!active) {
      stopScroll();
      frameCountRef.current = 0;
      startScrollTopSetRef.current = false;
      return;
    }

    frameCountRef.current = 0;
    startScrollTopSetRef.current = false;

    if (mode === "programmatic") {
      // Programmatic: jump to random indices at fixed intervals
      randomFn.current = createSeededRandom(42);

      intervalId.current = window.setInterval(() => {
        if (scrollToIndex && totalItems > 0) {
          const targetIndex = Math.floor(randomFn.current() * totalItems);
          scrollToIndex(targetIndex);
        }
      }, PROGRAMMATIC_INTERVAL);

      return stopScroll;
    }

    // Continuous scroll (slow or fast)
    const speed = SCROLL_SPEEDS[mode];
    lastTime.current = performance.now();

    const loop = (now: number) => {
      const el = containerRef.current;
      if (!el) {
        rafId.current = requestAnimationFrame(loop);
        return;
      }

      if (!startScrollTopSetRef.current) {
        startScrollTopRef.current = el.scrollTop;
        startScrollTopSetRef.current = true;
      }
      frameCountRef.current += 1;

      const delta = (now - lastTime.current) / 1000; // seconds
      lastTime.current = now;

      const pixels = speed * delta;
      el.scrollTop += pixels;

      // If we've reached the bottom, stop
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        stopScroll();
        return;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);

    return stopScroll;
  }, [mode, active, containerRef, totalItems, scrollToIndex, stopScroll]);

  return { stop: stopScroll, getScrollStats };
}
