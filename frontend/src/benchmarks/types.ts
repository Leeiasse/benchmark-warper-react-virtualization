import type { Transaction } from "../types/transaction";

export interface BenchProps {
  data: Transaction[];
  heightMode: "fixed" | "variable";
  containerHeight: number;
  onScrollContainerReady: (el: HTMLElement) => void;
  scrollToIndexRef: React.MutableRefObject<((index: number) => void) | null>;
}

export interface BenchmarkResult {
  library: string;
  volume: number;
  scrollMode: string;
  avgFps: number;
  minFps: number;
  maxFps: number;
  duration: number;
  samples: number[];
  timestamp: string;
  /** Pixels scrolled during the run (continuous mode) */
  pixelsScrolled: number;
  /** Approximate lines traversed (pixelsScrolled / row height) */
  linesTraversed: number;
  /** Number of scroll loop frames executed (continuous mode) */
  scrollFrames: number;
  /** Average frame time in ms */
  avgFrameMs: number;
  /** Max frame time in ms */
  maxFrameMs: number;
  /** Frames that exceeded 60Hz budget (jank) */
  jankCount: number;
}

/** Messages between Dashboard (parent) and BenchmarkPage (iframe) */
export type ParentMessage =
  | { type: "START"; scrollMode: string; volume: number; heightMode: "fixed" | "variable" }
  | { type: "STOP" };

export type ChildMessage =
  | { type: "READY"; library: string }
  | { type: "RESULT"; result: BenchmarkResult }
  | { type: "LOADING"; progress: number }
  | { type: "ERROR"; message: string };
