import { useState } from "react";
import type { Library } from "../config";
import { LIBRARY_LABELS } from "../config";
import type { BenchmarkResult } from "../benchmarks/types";

export type { BenchmarkResult };

interface ResultsTableProps {
  results: BenchmarkResult[];
}

type SortKey = keyof BenchmarkResult;

export function ResultsTable({ results }: ResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("avgFps");
  const [sortAsc, setSortAsc] = useState(false);

  if (results.length === 0) {
    return <div className="results-empty">No results yet. Run a benchmark.</div>;
  }

  const sorted = [...results].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIcon = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " ▲" : " ▼") : "";

  return (
    <div className="results-table-wrap">
      <table className="results-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("library")}>
              Library{sortIcon("library")}
            </th>
            <th onClick={() => handleSort("volume")}>
              Volume{sortIcon("volume")}
            </th>
            <th onClick={() => handleSort("scrollMode")}>
              Mode{sortIcon("scrollMode")}
            </th>
            <th onClick={() => handleSort("avgFps")}>
              Avg FPS{sortIcon("avgFps")}
            </th>
            <th onClick={() => handleSort("minFps")}>
              Min FPS{sortIcon("minFps")}
            </th>
            <th onClick={() => handleSort("maxFps")}>
              Max FPS{sortIcon("maxFps")}
            </th>
            <th onClick={() => handleSort("duration")}>
              Duration{sortIcon("duration")}
            </th>
            <th onClick={() => handleSort("linesTraversed")}>
              Lines{sortIcon("linesTraversed")}
            </th>
            <th onClick={() => handleSort("scrollFrames")}>
              Frames{sortIcon("scrollFrames")}
            </th>
            <th onClick={() => handleSort("avgFrameMs")}>
              Avg ms{sortIcon("avgFrameMs")}
            </th>
            <th onClick={() => handleSort("maxFrameMs")}>
              Max ms{sortIcon("maxFrameMs")}
            </th>
            <th onClick={() => handleSort("jankCount")}>
              Jank{sortIcon("jankCount")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i}>
              <td>{LIBRARY_LABELS[r.library as Library]}</td>
              <td>{r.volume.toLocaleString()}</td>
              <td>{r.scrollMode}</td>
              <td style={{ color: r.avgFps > 55 ? "#22c55e" : r.avgFps > 30 ? "#eab308" : "#ef4444" }}>
                {r.avgFps}
              </td>
              <td>{r.minFps}</td>
              <td>{r.maxFps}</td>
              <td>{(r.duration / 1000).toFixed(1)}s</td>
              <td>{r.linesTraversed.toLocaleString()}</td>
              <td>{r.scrollFrames.toLocaleString()}</td>
              <td>{r.avgFrameMs.toFixed(2)}</td>
              <td>{r.maxFrameMs.toFixed(2)}</td>
              <td style={{ color: r.jankCount > 0 ? "#eab308" : undefined }}>
                {r.jankCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
