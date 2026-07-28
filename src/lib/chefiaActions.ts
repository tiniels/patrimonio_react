// Persistência local (localStorage) de "Ações" da Chefia por chapa.
// Estrutura pronta para migrar para tabela `chefia_acoes` no backend.
import { useCallback, useEffect, useState } from "react";

export type ActionStatus = "fazer" | "fazendo" | "feito";

export type ChefiaAction = {
  chapa: string;
  status: ActionStatus;
  texto: string;
  atribuidoA: string; // usuário responsável pela execução
  atualizadoEm: string; // ISO
};

const KEY = "chefia-actions:v1";

type Store = Record<string, ChefiaAction>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function write(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("chefia-actions-change"));
}

export function useChefiaActions() {
  const [store, setStore] = useState<Store>(() => read());

  useEffect(() => {
    const h = () => setStore(read());
    window.addEventListener("chefia-actions-change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("chefia-actions-change", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const get = useCallback((chapa: string): ChefiaAction | undefined => store[chapa], [store]);

  const upsert = useCallback(
    (chapa: string, patch: Partial<Omit<ChefiaAction, "chapa" | "atualizadoEm">>) => {
      const cur = read();
      const prev = cur[chapa];
      const next: ChefiaAction = {
        chapa,
        status: patch.status ?? prev?.status ?? "fazer",
        texto: patch.texto ?? prev?.texto ?? "",
        atribuidoA: patch.atribuidoA ?? prev?.atribuidoA ?? "",
        atualizadoEm: new Date().toISOString(),
      };
      cur[chapa] = next;
      write(cur);
    },
    [],
  );

  const clear = useCallback((chapa: string) => {
    const cur = read();
    delete cur[chapa];
    write(cur);
  }, []);

  const cycle = useCallback((chapa: string) => {
    const cur = read();
    const prev = cur[chapa];
    if (!prev || !prev.texto.trim()) return; // sem texto não faz sentido ciclar
    const order: ActionStatus[] = ["fazer", "fazendo", "feito"];
    const idx = order.indexOf(prev.status);
    const nextStatus = order[(idx + 1) % order.length];
    cur[chapa] = { ...prev, status: nextStatus, atualizadoEm: new Date().toISOString() };
    write(cur);
  }, []);

  return { get, upsert, clear, cycle };
}

export const STATUS_LABEL: Record<ActionStatus, string> = {
  fazer: "Fazer",
  fazendo: "Fazendo",
  feito: "Feito",
};

// Cores por status — usadas em texto e badges.
export const STATUS_TEXT_CLASS: Record<ActionStatus, string> = {
  fazer: "text-destructive",
  fazendo: "text-warning",
  feito: "text-success",
};

export const STATUS_BADGE_CLASS: Record<ActionStatus, string> = {
  fazer: "bg-destructive/15 text-destructive border border-destructive/30",
  fazendo: "bg-warning/15 text-warning border border-warning/30",
  feito: "bg-success/15 text-success border border-success/30",
};
