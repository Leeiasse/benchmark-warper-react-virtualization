import { useCallback, useEffect, useState } from "react";
import type { Transaction } from "../types/transaction";
import { API_BASE, PAGE_SIZE } from "../config";

interface DataState {
  data: Transaction[];
  total: number;
  loading: boolean;
  progress: number; // 0 to 1
  error: string | null;
}

export function useTransactionData(volume: number) {
  const [state, setState] = useState<DataState>({
    data: [],
    total: 0,
    loading: false,
    progress: 0,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, progress: 0, error: null, data: [] }));

    try {
      // Get total count
      const countRes = await fetch(`${API_BASE}/transactions/count`);
      if (!countRes.ok) throw new Error("Failed to fetch count");
      const { count } = await countRes.json();
      const total = Math.min(count, volume);

      const allData: Transaction[] = [];
      let offset = 0;

      while (offset < total) {
        const limit = Math.min(PAGE_SIZE, total - offset);
        const res = await fetch(
          `${API_BASE}/transactions?limit=${limit}&offset=${offset}`
        );
        if (!res.ok) throw new Error(`Failed to fetch page at offset ${offset}`);
        const json = await res.json();
        allData.push(...json.data);
        offset += limit;

        setState((s) => ({
          ...s,
          progress: Math.min(offset / total, 1),
        }));
      }

      setState({
        data: allData,
        total,
        loading: false,
        progress: 1,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, [volume]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
