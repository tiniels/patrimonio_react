import { useEffect, useState } from "react";
import { fetchAllPatrimonio, getCached, type PatrimonioRow } from "@/lib/patrimonioDb";

export type LoadState = {
  rows: PatrimonioRow[] | null;
  loading: boolean;
  loaded: number;
  total: number;
  error: string | null;
};

export function usePatrimonioData(): LoadState {
  const [state, setState] = useState<LoadState>(() => {
    const cached = getCached();
    return {
      rows: cached,
      loading: !cached,
      loaded: cached?.length ?? 0,
      total: cached?.length ?? 0,
      error: null,
    };
  });

  useEffect(() => {
    if (state.rows) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchAllPatrimonio((loaded, total) => {
          if (cancelled) return;
          setState((s) => ({ ...s, loaded, total, loading: true }));
        });
        if (cancelled) return;
        setState({ rows, loading: false, loaded: rows.length, total: rows.length, error: null });
      } catch (e: unknown) {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
