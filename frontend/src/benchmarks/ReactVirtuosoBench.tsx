import { useCallback, useEffect, useRef } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { TransactionRow } from "../components/TransactionRow";
import { DEFAULT_ROW_HEIGHT } from "../config";
import { getVariableHeight } from "../utils/getVariableHeight";
import type { BenchProps } from "./types";

// Virtuoso uses pixel-based overscan: 5 items * 50px = 250px
const OVERSCAN_PX = 250;

export function ReactVirtuosoBench({
  data,
  heightMode,
  containerHeight,
  onScrollContainerReady,
  scrollToIndexRef,
}: BenchProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);

  const fixedItemContent = useCallback(
    (index: number) => {
      const tx = data[index];
      if (!tx) return null;
      return (
        <TransactionRow
          transaction={tx}
          style={{ height: DEFAULT_ROW_HEIGHT }}
        />
      );
    },
    [data]
  );

  const variableItemContent = useCallback(
    (index: number) => {
      const tx = data[index];
      if (!tx) return null;
      const height = getVariableHeight(tx);
      return <TransactionRow transaction={tx} style={{ height }} />;
    },
    [data]
  );

  // Expose scrollToIndex
  useEffect(() => {
    scrollToIndexRef.current = (index: number) => {
      virtuosoRef.current?.scrollToIndex({
        index,
        align: "start",
        behavior: "auto",
      });
    };
  }, [scrollToIndexRef]);

  const handleScrollerRef = useCallback(
    (el: HTMLElement | Window | null) => {
      if (el && el instanceof HTMLElement) {
        scrollerRef.current = el;
        onScrollContainerReady(el);
      }
    },
    [onScrollContainerReady]
  );

  return (
    <Virtuoso
      ref={virtuosoRef}
      scrollerRef={handleScrollerRef}
      className="virtual-container"
      style={{ height: containerHeight }}
      totalCount={data.length}
      overscan={OVERSCAN_PX}
      fixedItemHeight={heightMode === "fixed" ? DEFAULT_ROW_HEIGHT : undefined}
      itemContent={
        heightMode === "fixed" ? fixedItemContent : variableItemContent
      }
    />
  );
}
