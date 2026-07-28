// Filtros compartilhados entre dashboard e drill-down.
import type { PatrimonioRow } from "./patrimonioDb";
import { normStatus, normSituacao, isEspecial, DIVERG_SET, type SituacaoLabel } from "./dashboardAgg";

export type ChapaMode = "contem" | "eq" | "starts" | "ends";
export type EspecialFilter = "all" | "only" | "numeric";

export type Filters = {
  q?: string; // pesquisa geral
  chapaMode?: ChapaMode;
  chapa?: string;
  descricao?: string;
  status?: string[];
  situacao?: SituacaoLabel[];
  local?: string[];
  conta?: string[];
  especial?: EspecialFilter;
  baixaOnly?: boolean; // apenas com data_baixa
  baixaAno?: number;
  divergencias?: boolean; // situação ∈ DIVERG_SET
};

export const EMPTY: Filters = {};

export function hasAnyFilter(f: Filters): boolean {
  return !!(
    (f.q && f.q.trim()) ||
    (f.chapa && f.chapa.trim()) ||
    (f.descricao && f.descricao.trim()) ||
    (f.status && f.status.length) ||
    (f.situacao && f.situacao.length) ||
    (f.local && f.local.length) ||
    (f.conta && f.conta.length) ||
    (f.especial && f.especial !== "all") ||
    f.baixaOnly ||
    f.baixaAno ||
    f.divergencias
  );
}

export function applyFilters(rows: PatrimonioRow[], f: Filters): PatrimonioRow[] {
  const q = f.q?.trim().toLowerCase();
  const chapaQ = f.chapa?.trim().toLowerCase();
  const descQ = f.descricao?.trim().toLowerCase();
  const stSet = f.status?.length ? new Set(f.status) : null;
  const sitSet = f.situacao?.length ? new Set(f.situacao) : null;
  const localSet = f.local?.length ? new Set(f.local) : null;
  const contaSet = f.conta?.length ? new Set(f.conta) : null;
  const mode: ChapaMode = f.chapaMode ?? "contem";

  return rows.filter((r) => {
    if (chapaQ) {
      const c = (r.chapa ?? "").toLowerCase();
      if (mode === "eq" && c !== chapaQ) return false;
      if (mode === "starts" && !c.startsWith(chapaQ)) return false;
      if (mode === "ends" && !c.endsWith(chapaQ)) return false;
      if (mode === "contem" && !c.includes(chapaQ)) return false;
    }
    if (descQ && !(r.descricao ?? "").toLowerCase().includes(descQ)) return false;
    if (stSet && !stSet.has(normStatus(r.status))) return false;
    if (sitSet && !sitSet.has(normSituacao(r.situacao))) return false;
    if (localSet) {
      const l = (r.local ?? "").trim() || "SEM LOCAL";
      if (!localSet.has(l)) return false;
    }
    if (contaSet) {
      const c = (r.conta_contabil_nome ?? "").trim() || "SEM CONTA CONTÁBIL";
      if (!contaSet.has(c)) return false;
    }
    if (f.especial === "only" && !isEspecial(r.chapa)) return false;
    if (f.especial === "numeric" && isEspecial(r.chapa)) return false;
    if (f.baixaOnly && !r.data_baixa) return false;
    if (f.baixaAno) {
      if (!r.data_baixa) return false;
      const y = Number(r.data_baixa.slice(0, 4));
      if (y !== f.baixaAno) return false;
    }
    if (f.divergencias && !DIVERG_SET.has(normSituacao(r.situacao))) return false;
    if (q) {
      const hay = [
        r.chapa,
        r.descricao,
        r.local,
        r.local_codigo,
        r.conta_contabil_nome,
        r.status,
        r.situacao,
        r.localizacao,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ----- URL encoding -----

export function encodeFilters(f: Filters): Record<string, string> {
  const s: Record<string, string> = {};
  if (f.q) s.q = f.q;
  if (f.chapa) s.chapa = f.chapa;
  if (f.chapaMode && f.chapaMode !== "contem") s.chapaMode = f.chapaMode;
  if (f.descricao) s.descricao = f.descricao;
  if (f.status?.length) s.status = f.status.join("|");
  if (f.situacao?.length) s.situacao = f.situacao.join("|");
  if (f.local?.length) s.local = f.local.join("|");
  if (f.conta?.length) s.conta = f.conta.join("|");
  if (f.especial && f.especial !== "all") s.especial = f.especial;
  if (f.baixaOnly) s.baixaOnly = "1";
  if (f.baixaAno) s.baixaAno = String(f.baixaAno);
  if (f.divergencias) s.divergencias = "1";
  return s;
}

export function decodeFilters(sp: Record<string, unknown>): Filters {
  const arr = (v: unknown): string[] | undefined => {
    if (typeof v !== "string" || !v) return undefined;
    return v.split("|").filter(Boolean);
  };
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  return {
    q: str(sp.q),
    chapa: str(sp.chapa),
    chapaMode: (str(sp.chapaMode) as ChapaMode) ?? undefined,
    descricao: str(sp.descricao),
    status: arr(sp.status),
    situacao: arr(sp.situacao) as SituacaoLabel[] | undefined,
    local: arr(sp.local),
    conta: arr(sp.conta),
    especial: (str(sp.especial) as EspecialFilter) ?? undefined,
    baixaOnly: sp.baixaOnly === "1" || sp.baixaOnly === true,
    baixaAno: sp.baixaAno ? Number(sp.baixaAno) : undefined,
    divergencias: sp.divergencias === "1" || sp.divergencias === true,
  };
}

// ----- Sorting -----

export type SortKey = "chapa" | "descricao" | "local" | "conta_contabil_nome" | "status" | "situacao" | "data_baixa";
export type SortDir = "asc" | "desc";

export function sortRows(rows: PatrimonioRow[], key: SortKey, dir: SortDir): PatrimonioRow[] {
  const mult = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = (a[key] ?? "") as string;
    const bv = (b[key] ?? "") as string;
    if (av < bv) return -1 * mult;
    if (av > bv) return 1 * mult;
    return 0;
  });
}

// ----- CSV -----

export function rowsToCsv(rows: PatrimonioRow[]): string {
  const cols: (keyof PatrimonioRow)[] = [
    "chapa",
    "descricao",
    "status",
    "situacao",
    "local",
    "local_codigo",
    "conta_contabil_nome",
    "data_baixa",
    "localizacao",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  return head + "\n" + body;
}

export function downloadCsv(rows: PatrimonioRow[], filename: string) {
  const blob = new Blob(["\uFEFF" + rowsToCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
