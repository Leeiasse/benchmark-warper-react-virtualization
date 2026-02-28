import { useCallback, useEffect, useRef, useState } from "react";
import { VolumeSelector } from "./components/VolumeSelector";
import { ResultsTable, type BenchmarkResult } from "./components/ResultsTable";
import {
  LIBRARIES,
  LIBRARY_LABELS,
  type Library,
  type ScrollMode,
  type Volume,
} from "./config";
import type { ChildMessage, ParentMessage } from "./benchmarks/types";

export function Dashboard() {
  const [volume, setVolume] = useState<Volume>(100_000);
  const [selectedLibs, setSelectedLibs] = useState<Library[]>([...LIBRARIES]);
  const [scrollMode, setScrollMode] = useState<ScrollMode>("slow");
  const [heightMode, setHeightMode] = useState<"fixed" | "variable">("variable");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [readyIframes, setReadyIframes] = useState<Set<string>>(new Set());
  const [loadingProgress, setLoadingProgress] = useState<Record<string, number>>({});

  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});

  const toggleLib = (lib: Library) => {
    setSelectedLibs((prev) =>
      prev.includes(lib) ? prev.filter((l) => l !== lib) : [...prev, lib]
    );
  };

  // Listen for messages from iframes
  useEffect(() => {
    const handler = (e: MessageEvent<ChildMessage>) => {
      const msg = e.data;
      if (!msg?.type) return;

      switch (msg.type) {
        case "READY":
          setReadyIframes((prev) => new Set(prev).add(msg.library));
          break;
        case "RESULT":
          setResults((prev) => [...prev, msg.result as BenchmarkResult]);
          break;
        case "LOADING":
          setLoadingProgress((prev) => ({
            ...prev,
            // We need the library name from the source iframe
          }));
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const sendToIframes = useCallback(
    (msg: ParentMessage) => {
      for (const lib of selectedLibs) {
        const iframe = iframeRefs.current[lib];
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(msg, "*");
        }
      }
    },
    [selectedLibs]
  );

  const startAll = useCallback(() => {
    setRunning(true);
    sendToIframes({
      type: "START",
      scrollMode,
      volume,
      heightMode,
    });
  }, [sendToIframes, scrollMode, volume, heightMode]);

  const stopAll = useCallback(() => {
    setRunning(false);
    sendToIframes({ type: "STOP" });
  }, [sendToIframes]);

  const exportResults = useCallback(() => {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bench-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const allReady = selectedLibs.every((lib) => readyIframes.has(lib));

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>React Virtualization Benchmark</h1>
        <p>Warper vs TanStack Virtual vs react-window vs React Virtuoso</p>
      </header>

      <section className="dashboard-controls">
        <VolumeSelector value={volume} onChange={setVolume} disabled={running} />

        <div className="lib-selector">
          <label>Libraries:</label>
          <div className="lib-checkboxes">
            {LIBRARIES.map((lib) => (
              <label key={lib} className="lib-checkbox">
                <input
                  type="checkbox"
                  checked={selectedLibs.includes(lib)}
                  onChange={() => toggleLib(lib)}
                  disabled={running}
                />
                {LIBRARY_LABELS[lib]}
              </label>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>Scroll mode:</label>
          <select
            value={scrollMode}
            onChange={(e) => setScrollMode(e.target.value as ScrollMode)}
            disabled={running}
          >
            <option value="slow">Slow (300 px/s)</option>
            <option value="fast">Fast (5000 px/s)</option>
            <option value="programmatic">Programmatic (random jumps)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Height mode:</label>
          <select
            value={heightMode}
            onChange={(e) =>
              setHeightMode(e.target.value as "fixed" | "variable")
            }
            disabled={running}
          >
            <option value="fixed">Fixed (50px)</option>
            <option value="variable">Variable (40-90px)</option>
          </select>
        </div>

        <div className="control-group">
          {!running ? (
            <button
              className="btn btn-start"
              onClick={startAll}
              disabled={selectedLibs.length === 0 || !allReady}
            >
              {allReady ? "Start All" : "Waiting for iframes..."}
            </button>
          ) : (
            <button className="btn btn-stop" onClick={stopAll}>
              Stop All
            </button>
          )}
          <button
            className="btn btn-export"
            onClick={exportResults}
            disabled={running || results.length === 0}
          >
            Export JSON
          </button>
          {results.length > 0 && (
            <button
              className="btn"
              onClick={() => setResults([])}
              disabled={running}
            >
              Clear Results
            </button>
          )}
        </div>
      </section>

      <section className="iframe-grid">
        {selectedLibs.map((lib) => (
          <div key={lib} className="iframe-cell">
            <div className="iframe-label">{LIBRARY_LABELS[lib]}</div>
            <iframe
              ref={(el) => {
                iframeRefs.current[lib] = el;
              }}
              src={`/bench/${lib}?volume=${volume}&embedded=true`}
              title={LIBRARY_LABELS[lib]}
              className="bench-iframe"
            />
          </div>
        ))}
      </section>

      <section className="dashboard-results">
        <h2>Results</h2>
        <ResultsTable results={results} />
      </section>
    </div>
  );
}
