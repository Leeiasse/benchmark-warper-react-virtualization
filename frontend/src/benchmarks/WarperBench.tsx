import { useCallback, useEffect, useRef } from "react";
import { useVirtualizer } from "@itsmeadarsh/warper";
import { TransactionRow } from "../components/TransactionRow";
import { OVERSCAN, DEFAULT_ROW_HEIGHT } from "../config";
import { getVariableHeight } from "../utils/getVariableHeight";
import type { BenchProps } from "./types";

export function WarperBench({
  data,
  heightMode,
  containerHeight,
  onScrollContainerReady,
  scrollToIndexRef,
}: BenchProps) {
  const scrollElRef = useRef<HTMLDivElement | null>(null);

  const estimateSize = useCallback(
    (index: number) => {
      if (heightMode === "fixed") return DEFAULT_ROW_HEIGHT;
      return data[index] ? getVariableHeight(data[index]) : DEFAULT_ROW_HEIGHT;
    },
    [data, heightMode]
  );

  const { scrollElementRef, range, totalHeight, isLoading, scrollToIndex } =
    useVirtualizer({
      itemCount: data.length,
      estimateSize,
      overscan: OVERSCAN,
      height: containerHeight,
    });

  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      scrollElementRef(el);
      scrollElRef.current = el;
      if (el) onScrollContainerReady(el);
    },
    [scrollElementRef, onScrollContainerReady]
  );

  useEffect(() => {
    scrollToIndexRef.current = (index: number) => {
      scrollToIndex(index, "auto");
    };
  }, [scrollToIndex, scrollToIndexRef]);

  if (isLoading) {
    return <div className="bench-loading">Initializing WASM...</div>;
  }

  return (
    <div
      ref={combinedRef}
      className="virtual-container"
      style={{ height: containerHeight, overflow: "auto" }}
    >
      {/* Inner: sets total scroll height (min 1px so container is scrollable before first range, matches WarperComponent) */}
      <div style={{ height: totalHeight || 1, position: "relative" }}>
        {/* Viewport: positioned via paddingTop transform (matches WarperComponent) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${range.paddingTop}px)`,
            willChange: "transform",
          }}
        >
          {range.items.map((index, i) => {
            const tx = data[index];
            if (!tx) return null;
            return (
              <TransactionRow
                key={index}
                transaction={tx}
                style={{
                  position: "absolute",
                  top: 0,
                  transform: `translateY(${range.offsets[i]}px)`,
                  height: range.sizes[i],
                  width: "100%",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
