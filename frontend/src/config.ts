export const OVERSCAN = 5;
export const DEFAULT_ROW_HEIGHT = 50;
export const CONTAINER_HEIGHT = 600;

export const SCROLL_SPEEDS = {
  slow: 300,   // px/s
  fast: 5000,  // px/s
} as const;

export const PROGRAMMATIC_INTERVAL = 500; // ms between random scrollToIndex calls

export const VOLUMES = [100_000, 500_000, 1_000_000] as const;
export type Volume = (typeof VOLUMES)[number];

export const LIBRARIES = ["warper", "tanstack", "react-window", "virtuoso"] as const;
export type Library = (typeof LIBRARIES)[number];

export const LIBRARY_LABELS: Record<Library, string> = {
  warper: "Warper (Rust/WASM)",
  tanstack: "TanStack Virtual",
  "react-window": "react-window",
  virtuoso: "React Virtuoso",
};

export type ScrollMode = "slow" | "fast" | "programmatic";

/** In dev: Vite proxy handles /api → localhost:3001. In Docker: nginx handles /api → api:3001. */
export const API_BASE = import.meta.env.VITE_API_URL || "/api";
export const PAGE_SIZE = 10_000;

export const FPS_DISPLAY_INTERVAL = 500; // ms between FPS display updates
export const FPS_WINDOW_SIZE = 60; // frames for sliding window average

/** Frame time above this (ms) is considered jank (~60Hz = 16.67ms per frame) */
export const JANK_THRESHOLD_MS = 16.67;
