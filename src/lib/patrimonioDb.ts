// Cliente somente-leitura para a base pública "Patrimônio Inteligente".
// Usa a chave publishable (anon) — segura para o navegador.
import { createClient } from "@supabase/supabase-js";

const URL = "https://wrgeaziiycvqymkbfokt.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZ2VhemlpeWN2cXlta2Jmb2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTMzMjcsImV4cCI6MjA5MzAyOTMyN30.teHOTfUm5yRek826gvmw0ejLqZL8VB1u9x2ZFZExOm8";

export const patrimonioDb = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type PatrimonioRow = {
  chapa: string;
  descricao: string | null;
  status: string | null;
  situacao: string | null;
  local: string | null;
  local_codigo: string | null;
  conta_contabil_nome: string | null;
  data_baixa: string | null;
  localizacao: string | null;
};

const COLS =
  "chapa,descricao,status,situacao,local,local_codigo,conta_contabil_nome,data_baixa,localizacao";

const PAGE = 1000;

// Cache em memória (módulo) — evita refazer os 270+ requests.
let CACHE: PatrimonioRow[] | null = null;

export function getCached(): PatrimonioRow[] | null {
  return CACHE;
}

export async function fetchTotalCount(): Promise<number> {
  const { count, error } = await patrimonioDb
    .from("patrimonio_bens")
    .select("chapa", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function fetchAllPatrimonio(
  onProgress?: (loaded: number, total: number) => void,
): Promise<PatrimonioRow[]> {
  if (CACHE) {
    onProgress?.(CACHE.length, CACHE.length);
    return CACHE;
  }
  const total = await fetchTotalCount();
  const acc: PatrimonioRow[] = [];
  let from = 0;
  onProgress?.(0, total);
  while (from < total) {
    const to = from + PAGE - 1;
    const { data, error } = await patrimonioDb
      .from("patrimonio_bens")
      .select(COLS)
      .order("chapa", { ascending: true })
      .range(from, to);
    if (error) throw error;
    if (!data || data.length === 0) break;
    acc.push(...(data as unknown as PatrimonioRow[]));
    onProgress?.(acc.length, total);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  CACHE = acc;
  return acc;
}
