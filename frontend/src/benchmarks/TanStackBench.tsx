import { useCallback, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TransactionRow } from "../components/TransactionRow";
import { OVERSCAN, DEFAULT_ROW_HEIGHT } from "../config";
import { getVariableHeight } from "../utils/getVariableHeight";
import type { BenchProps } from "./types";

export function TanStackBench({
  data,
  heightMode,
  containerHeight,
  onScrollContainerReady,
  scrollToIndexRef,
}: BenchProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const estimateSize = useCallback(
    (index: number) => {
      if (heightMode === "fixed") return DEFAULT_ROW_HEIGHT;
      return data[index] ? getVariableHeight(data[index]) : DEFAULT_ROW_HEIGHT;
    },
    [data, heightMode]
  );

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: OVERSCAN,
  });

  // Expose scroll container
  useEffect(() => {
    if (parentRef.current) onScrollContainerReady(parentRef.current);
  }, [onScrollContainerReady]);

  // Expose scrollToIndex
  useEffect(() => {
    scrollToIndexRef.current = (index: number) => {
      virtualizer.scrollToIndex(index, { align: "start" });
    };
  }, [virtualizer, scrollToIndexRef]);

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="virtual-container"
      style={{ height: containerHeight, overflow: "auto" }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {items.map((virtualRow) => {
          const tx = data[virtualRow.index];
          if (!tx) return null;
          return (
            <TransactionRow
              key={virtualRow.key}
              transaction={tx}
              style={{
                position: "absolute",
                top: 0,
                transform: `translateY(${virtualRow.start}px)`,
                height: virtualRow.size,
                width: "100%",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
