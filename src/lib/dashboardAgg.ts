// Agrega dados reais de `patrimonio_bens` em séries para os gráficos.
import type { PatrimonioRow } from "./patrimonioDb";

export const fmt = new Intl.NumberFormat("pt-BR");

// ----- Normalização -----

export function normStatus(s: string | null | undefined): string {
  const v = (s ?? "").trim().toUpperCase();
  return v || "SEM STATUS";
}

const SITUACAO_MAP: Record<string, string> = {
  localizado: "Localizado",
  nao_localizado: "Não Localizado",
  "não_localizado": "Não Localizado",
  "nao localizado": "Não Localizado",
  retirado: "Retirado",
  transferencia: "Transferência",
  "transferência": "Transferência",
  bo: "B.O",
  "b.o": "B.O",
  "b.o.": "B.O",
};

export type SituacaoLabel =
  | "Localizado"
  | "Não Localizado"
  | "Retirado"
  | "Transferência"
  | "B.O"
  | "Em Branco";

export function normSituacao(s: string | null | undefined): SituacaoLabel {
  const raw = (s ?? "").trim().toLowerCase();
  if (!raw) return "Em Branco";
  return (SITUACAO_MAP[raw] as SituacaoLabel) ?? "Em Branco";
}

export const DIVERG_SET = new Set<SituacaoLabel>([
  "Não Localizado",
  "Retirado",
  "Transferência",
  "B.O",
]);

// Item Especial: número patrimonial contém pelo menos uma letra (A-Z, a-z).
export function isEspecial(chapa: string | null | undefined): boolean {
  return /[A-Za-z]/.test(chapa ?? "");
}



// ----- Paletas -----

const STATUS_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

const SITUACAO_COLORS: Record<SituacaoLabel, string> = {
  "Localizado": "oklch(0.72 0.17 155)",
  "Não Localizado": "oklch(0.78 0.16 65)",
  "Retirado": "oklch(0.68 0.19 30)",
  "Transferência": "oklch(0.7 0.15 250)",
  "B.O": "oklch(0.62 0.22 15)",
  "Em Branco": "oklch(0.55 0.02 260)",
};

// ----- Agregações -----

export type Bucket = { name: string; value: number };
export type ColorBucket = Bucket & { color: string };

export type Aggregates = {
  total: number;
  totalBaixados: number;
  totalEspeciais: number;
  totalEspeciaisBaixa: number;
  statusData: ColorBucket[];
  situacaoData: (Bucket & { color: string; key: SituacaoLabel })[];
  contaContabilData: Bucket[];
  locaisData: Bucket[];
  divergenciasData: Bucket[];
};

export function aggregate(rows: PatrimonioRow[]): Aggregates {
  const statusCount = new Map<string, number>();
  const situacaoCount = new Map<SituacaoLabel, number>();
  const contaCount = new Map<string, number>();
  const localCount = new Map<string, number>();
  const localDiverg = new Map<string, number>();

  let totalEspeciais = 0;
  let totalEspeciaisBaixa = 0;
  let totalBaixados = 0;

  for (const r of rows) {
    const st = normStatus(r.status);
    statusCount.set(st, (statusCount.get(st) ?? 0) + 1);

    const isBaixa = st === "BAIXA" || !!r.data_baixa;
    if (isBaixa) totalBaixados++;
    if (isEspecial(r.chapa)) {
      totalEspeciais++;
      if (isBaixa) totalEspeciaisBaixa++;
    }


    const sit = normSituacao(r.situacao);
    situacaoCount.set(sit, (situacaoCount.get(sit) ?? 0) + 1);

    const cc = (r.conta_contabil_nome ?? "").trim() || "SEM CONTA CONTÁBIL";
    contaCount.set(cc, (contaCount.get(cc) ?? 0) + 1);

    const local = (r.local ?? "").trim() || "SEM LOCAL";
    localCount.set(local, (localCount.get(local) ?? 0) + 1);
    if (DIVERG_SET.has(sit)) {
      localDiverg.set(local, (localDiverg.get(local) ?? 0) + 1);
    }
  }

  const statusData: ColorBucket[] = [...statusCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      color: STATUS_COLORS[i % STATUS_COLORS.length],
    }));

  const SIT_ORDER: SituacaoLabel[] = [
    "Localizado",
    "Não Localizado",
    "Retirado",
    "Transferência",
    "B.O",
    "Em Branco",
  ];
  const situacaoData = SIT_ORDER.map((k) => ({
    key: k,
    name: k,
    value: situacaoCount.get(k) ?? 0,
    color: SITUACAO_COLORS[k],
  }));

  const topN = <T extends Bucket>(m: Map<string, number>, n: number): T[] =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, value]) => ({ name, value })) as T[];

  return {
    total: rows.length,
    totalBaixados,
    totalEspeciais,
    totalEspeciaisBaixa,
    statusData,
    situacaoData,
    contaContabilData: topN(contaCount, 12),
    locaisData: topN(localCount, 12),
    divergenciasData: topN(localDiverg, 12),
  };
}

// ----- Filtros de drill-down -----

export type DrillFilter = {
  status?: string;
  situacao?: SituacaoLabel;
  conta?: string;
  local?: string;
  divergenciasLocal?: string;
};

export function filterRows(rows: PatrimonioRow[], f: DrillFilter): PatrimonioRow[] {
  return rows.filter((r) => {
    if (f.status && normStatus(r.status) !== f.status) return false;
    if (f.situacao && normSituacao(r.situacao) !== f.situacao) return false;
    if (f.conta && ((r.conta_contabil_nome ?? "").trim() || "SEM CONTA CONTÁBIL") !== f.conta)
      return false;
    if (f.local && ((r.local ?? "").trim() || "SEM LOCAL") !== f.local) return false;
    if (f.divergenciasLocal) {
      if (((r.local ?? "").trim() || "SEM LOCAL") !== f.divergenciasLocal) return false;
      if (!DIVERG_SET.has(normSituacao(r.situacao))) return false;
    }
    return true;
  });
}
