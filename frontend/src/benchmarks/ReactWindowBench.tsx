import { useCallback, useEffect, useRef } from "react";
import { FixedSizeList, VariableSizeList } from "react-window";
import { TransactionRow } from "../components/TransactionRow";
import { OVERSCAN, DEFAULT_ROW_HEIGHT } from "../config";
import { getVariableHeight } from "../utils/getVariableHeight";
import type { BenchProps } from "./types";

export function ReactWindowBench({
  data,
  heightMode,
  containerHeight,
  onScrollContainerReady,
  scrollToIndexRef,
}: BenchProps) {
  const listRef = useRef<FixedSizeList | VariableSizeList>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const prevHeightMode = useRef(heightMode);
  const prevDataLength = useRef(data.length);

  const getItemSize = useCallback(
    (index: number) => {
      if (heightMode === "fixed") return DEFAULT_ROW_HEIGHT;
      return data[index] ? getVariableHeight(data[index]) : DEFAULT_ROW_HEIGHT;
    },
    [data, heightMode]
  );

  // Expose scroll container
  useEffect(() => {
    if (outerRef.current) onScrollContainerReady(outerRef.current);
  }, [onScrollContainerReady]);

  // Expose scrollToIndex
  useEffect(() => {
    scrollToIndexRef.current = (index: number) => {
      listRef.current?.scrollToItem(index, "start");
    };
  }, [scrollToIndexRef]);

  // Reset variable list when data or height mode changes
  useEffect(() => {
    if (
      heightMode === "variable" &&
      listRef.current &&
      "resetAfterIndex" in listRef.current &&
      (prevHeightMode.current !== heightMode ||
        prevDataLength.current !== data.length)
    ) {
      (listRef.current as VariableSizeList).resetAfterIndex(0);
    }
    prevHeightMode.current = heightMode;
    prevDataLength.current = data.length;
  }, [heightMode, data.length]);

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const tx = data[index];
      if (!tx) return null;
      return <TransactionRow transaction={tx} style={style} />;
    },
    [data]
  );

  if (heightMode === "fixed") {
    return (
      <FixedSizeList
        ref={listRef as React.Ref<FixedSizeList>}
        outerRef={outerRef}
        className="virtual-container"
        height={containerHeight}
        width="100%"
        itemCount={data.length}
        itemSize={DEFAULT_ROW_HEIGHT}
        overscanCount={OVERSCAN}
      >
        {Row}
      </FixedSizeList>
    );
  }

  return (
    <VariableSizeList
      ref={listRef as React.Ref<VariableSizeList>}
      outerRef={outerRef}
      className="virtual-container"
      height={containerHeight}
      width="100%"
      itemCount={data.length}
      itemSize={getItemSize}
      overscanCount={OVERSCAN}
    >
      {Row}
    </VariableSizeList>
  );
}
