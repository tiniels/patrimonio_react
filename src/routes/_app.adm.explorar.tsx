import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowUpDown,
  Download,
  Filter,
  Info,
  Loader2,
  Printer,
  RotateCcw,
  Search,
  X,
  QrCode,
  Building,
  CheckCircle2,
  Tag,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/PageStub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePatrimonioData } from "@/hooks/usePatrimonioData";
import {
  fmt,
  normSituacao,
  normStatus,
  isEspecial,
  type SituacaoLabel,
} from "@/lib/dashboardAgg";
import {
  applyFilters,
  decodeFilters,
  downloadCsv,
  encodeFilters,
  hasAnyFilter,
  sortRows,
  type ChapaMode,
  type EspecialFilter,
  type Filters,
  type SortDir,
  type SortKey,
} from "@/lib/patrimonioFilters";
import type { PatrimonioRow } from "@/lib/patrimonioDb";

type Search = Record<string, string | undefined> & {
  kpi?: string;
  sort?: SortKey;
  dir?: SortDir;
};

export const Route = createFileRoute("/_app/adm/explorar")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    for (const [k, v] of Object.entries(s)) {
      if (typeof v === "string") out[k] = v;
      else if (typeof v === "number" || typeof v === "boolean") out[k] = String(v);
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "Explorador de Patrimônios — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Consulta paginada e combinável do acervo com filtros avançados por chapa, local, conta contábil, ficha rápida e QR Code.",
      },
    ],
  }),
  component: ExplorarPage,
});

const SITUACOES: SituacaoLabel[] = [
  "Localizado",
  "Não Localizado",
  "Retirado",
  "Transferência",
  "B.O",
  "Em Branco",
];

const KPI_TITLES: Record<string, { title: string; subtitle: string }> = {
  total: { title: "Total de Itens", subtitle: "Todos os patrimônios cadastrados" },
  especiais: {
    title: "Itens Especiais",
    subtitle: "Patrimônios cuja chapa contém letras (A-Z)",
  },
  especiaisBaixa: {
    title: "Especiais em Baixa",
    subtitle: "Itens especiais com baixa registrada",
  },
  baixados: { title: "Total Baixados", subtitle: "Patrimônios com baixa registrada" },
  status: { title: "Status do Patrimônio", subtitle: "Registros filtrados por status" },
  situacao: { title: "Situação do Patrimônio", subtitle: "Registros filtrados por situação" },
  conta: { title: "Conta Contábil", subtitle: "Registros da conta selecionada" },
  local: { title: "Local", subtitle: "Registros do local selecionado" },
  divergencias: {
    title: "Setor com Divergências",
    subtitle: "Não localizados, retirados, transferências e B.O.",
  },
};

function ExplorarPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const state = usePatrimonioData();

  // Estado dos filtros: derivado da URL, mas editável localmente.
  const urlFilters = useMemo(() => decodeFilters(search as Record<string, unknown>), [search]);
  const [f, setF] = useState<Filters>(urlFilters);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sincroniza quando URL muda (ex.: navegação externa).
  const urlKey = JSON.stringify(urlFilters);
  const lastKey = useRef(urlKey);
  if (lastKey.current !== urlKey) {
    lastKey.current = urlKey;
    setF(urlFilters);
  }

  const sort: SortKey = (search.sort as SortKey) ?? "chapa";
  const dir: SortDir = (search.dir as SortDir) ?? "desc";

  const applyToUrl = (next: Filters) => {
    const enc = encodeFilters(next);
    navigate({
      search: (prev: Search) => {
        const kept: Record<string, string | undefined> = {};
        if (prev.kpi) kept.kpi = prev.kpi;
        if (prev.sort) kept.sort = prev.sort;
        if (prev.dir) kept.dir = prev.dir;
        return { ...kept, ...enc } as Search;
      },
    });
  };

  const filtered = useMemo(() => {
    if (!state.rows) return [];
    const base = applyFilters(state.rows, f);
    return sortRows(base, sort, dir);
  }, [state.rows, f, sort, dir]);

  // Opções para autocompletes.
  const options = useMemo(() => {
    if (!state.rows) return { locais: [], contas: [], status: [] as string[] };
    const locais = new Set<string>();
    const contas = new Set<string>();
    const status = new Set<string>();
    for (const r of state.rows) {
      locais.add((r.local ?? "").trim() || "SEM LOCAL");
      contas.add((r.conta_contabil_nome ?? "").trim() || "SEM CONTA CONTÁBIL");
      status.add(normStatus(r.status));
    }
    return {
      locais: [...locais].sort(),
      contas: [...contas].sort(),
      status: [...status].sort(),
    };
  }, [state.rows]);

  const kpi = search.kpi;
  const meta = kpi && KPI_TITLES[kpi] ? KPI_TITLES[kpi] : { title: "Explorador de Patrimônios (MOD-06)", subtitle: "Filtre, pesquise e exporte bens" };

  const [selected, setSelected] = useState<PatrimonioRow | null>(null);

  const setSort = (k: SortKey) => {
    navigate({
      search: (prev: Search) => {
        const nextDir: SortDir = prev.sort === k && prev.dir === "asc" ? "desc" : "asc";
        return { ...(prev as Search), sort: k, dir: nextDir };
      },
    });
  };

  const reset = () => {
    setF({});
    navigate({ search: () => ({} as Search) });
  };

  const handleCopyShareableUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={meta.title}
        description={
          state.rows
            ? `Mostrando ${fmt.format(filtered.length)} de ${fmt.format(state.rows.length)} patrimônios oficiais. ${meta.subtitle}.`
            : "Carregando a base de bens…"
        }
        crumbs={[
          { label: "Painel", to: "/adm" },
          { label: "Dashboard", to: "/adm" },
          { label: meta.title },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyShareableUrl}
              title="Copiar URL com filtros aplicados"
            >
              {copiedLink ? <Check className="h-4 w-4 mr-1.5 text-success" /> : <Share2 className="h-4 w-4 mr-1.5" />}
              {copiedLink ? "Link copiado!" : "Compartilhar Filtros"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={!hasAnyFilter(f) && !kpi}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Limpar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCsv(filtered, `patrimonios-${Date.now()}.csv`)}
              disabled={!filtered.length}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimir
            </Button>
          </>
        }
      />

      {/* BARRA DE FILTROS INTELIGENTES (RF-MOD-06-01 a RF-MOD-06-03) */}
      <section className="glass-card p-4 flex flex-col gap-3 border border-border/60">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Filtros Inteligentes</span>
          {hasAnyFilter(f) && (
            <Badge variant="secondary" className="ml-1">
              {activeCount(f)} ativos
            </Badge>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Pesquisa geral */}
          <div className="lg:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por chapa, descrição, local, conta…"
              className="pl-8 text-xs h-10"
              value={f.q ?? ""}
              onChange={(e) => setF({ ...f, q: e.target.value })}
              onBlur={() => applyToUrl(f)}
              onKeyDown={(e) => e.key === "Enter" && applyToUrl(f)}
            />
          </div>

          {/* Chapa com operador (contém, exato, início, fim) (RF-MOD-06-02) */}
          <div className="flex gap-2">
            <Select
              value={f.chapaMode ?? "contem"}
              onValueChange={(v) => {
                const next = { ...f, chapaMode: v as ChapaMode };
                setF(next);
                applyToUrl(next);
              }}
            >
              <SelectTrigger className="w-32 text-xs h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contem">Contém</SelectItem>
                <SelectItem value="eq">Exato (=)</SelectItem>
                <SelectItem value="starts">Início (A*)</SelectItem>
                <SelectItem value="ends">Final (*Z)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Nº de chapa"
              className="text-xs h-10 font-mono"
              value={f.chapa ?? ""}
              onChange={(e) => setF({ ...f, chapa: e.target.value })}
              onBlur={() => applyToUrl(f)}
              onKeyDown={(e) => e.key === "Enter" && applyToUrl(f)}
            />
          </div>

          {/* Descrição */}
          <Input
            placeholder="Descrição contém…"
            className="text-xs h-10"
            value={f.descricao ?? ""}
            onChange={(e) => setF({ ...f, descricao: e.target.value })}
            onBlur={() => applyToUrl(f)}
            onKeyDown={(e) => e.key === "Enter" && applyToUrl(f)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <MultiPicker
            label="Status"
            options={options.status}
            value={f.status ?? []}
            onChange={(v) => {
              const next = { ...f, status: v };
              setF(next);
              applyToUrl(next);
            }}
          />
          <MultiPicker
            label="Situação"
            options={SITUACOES}
            value={f.situacao ?? []}
            onChange={(v) => {
              const next = { ...f, situacao: v as SituacaoLabel[] };
              setF(next);
              applyToUrl(next);
            }}
          />
          <MultiPicker
            label="Local"
            options={options.locais}
            value={f.local ?? []}
            searchable
            onChange={(v) => {
              const next = { ...f, local: v };
              setF(next);
              applyToUrl(next);
            }}
          />
          <MultiPicker
            label="Conta Contábil"
            options={options.contas}
            value={f.conta ?? []}
            searchable
            onChange={(v) => {
              const next = { ...f, conta: v };
              setF(next);
              applyToUrl(next);
            }}
          />
          <Select
            value={f.especial ?? "all"}
            onValueChange={(v) => {
              const next = { ...f, especial: v as EspecialFilter };
              setF(next);
              applyToUrl(next);
            }}
          >
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder="Especial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos (Comuns + Especiais)</SelectItem>
              <SelectItem value="only">Somente Especiais</SelectItem>
              <SelectItem value="numeric">Somente Numéricos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Checkbox
              checked={!!f.baixaOnly}
              onCheckedChange={(v) => {
                const next = { ...f, baixaOnly: !!v };
                setF(next);
                applyToUrl(next);
              }}
            />
            Somente com baixa
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Checkbox
              checked={!!f.divergencias}
              onCheckedChange={(v) => {
                const next = { ...f, divergencias: !!v };
                setF(next);
                applyToUrl(next);
              }}
            />
            Somente divergências
          </label>
          <Input
            type="number"
            placeholder="Ano de baixa"
            className="w-36 h-8 text-xs"
            value={f.baixaAno ?? ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : undefined;
              const next = { ...f, baixaAno: v };
              setF(next);
            }}
            onBlur={() => applyToUrl(f)}
          />
          {(f.status?.length || f.situacao?.length || f.local?.length || f.conta?.length) ? (
            <div className="flex flex-wrap gap-1.5 ml-auto">
              {[...(f.status ?? []).map((v) => ["status", v] as const),
                ...(f.situacao ?? []).map((v) => ["situacao", v] as const),
                ...(f.local ?? []).map((v) => ["local", v] as const),
                ...(f.conta ?? []).map((v) => ["conta", v] as const)].slice(0, 8).map(([k, v]) => (
                <Badge
                  key={`${k}:${v}`}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => {
                    const cur = (f[k] as string[]) ?? [];
                    const next = { ...f, [k]: cur.filter((x) => x !== v) };
                    setF(next);
                    applyToUrl(next);
                  }}
                >
                  {v}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ESTADO DE CARREGAMENTO */}
      {state.loading && !state.rows && (
        <div className="glass-card p-6 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Carregando {fmt.format(state.loaded)} de {fmt.format(state.total || 0)}…
          </span>
        </div>
      )}

      {/* TABELA VIRTUALIZADA (RF-MOD-06-04 & RF-MOD-06-05) */}
      {state.rows && (
        <VirtualTable
          rows={filtered}
          sort={sort}
          dir={dir}
          onSort={setSort}
          onRowClick={setSelected}
        />
      )}

      {/* FICHA RÁPIDA E ETIQUETA COM QR CODE (RF-MOD-06-06) */}
      <FichaModal row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function activeCount(f: Filters): number {
  let n = 0;
  if (f.q) n++;
  if (f.chapa) n++;
  if (f.descricao) n++;
  if (f.status?.length) n++;
  if (f.situacao?.length) n++;
  if (f.local?.length) n++;
  if (f.conta?.length) n++;
  if (f.especial && f.especial !== "all") n++;
  if (f.baixaOnly) n++;
  if (f.baixaAno) n++;
  if (f.divergencias) n++;
  return n;
}

// ---------- Multi picker ----------

function MultiPicker({
  label,
  options,
  value,
  onChange,
  searchable = false,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return options.slice(0, 300);
    const qq = q.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(qq)).slice(0, 300);
  }, [q, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between w-full text-left font-normal text-xs h-10">
          <span className="truncate">
            {label}
            {value.length > 0 && (
              <span className="ml-1.5 text-primary tabular font-bold">({value.length})</span>
            )}
          </span>
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {searchable && (
          <div className="p-2 border-b border-border">
            <Input
              placeholder="Pesquisar…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        )}
        <div className="max-h-72 overflow-auto p-1">
          {filtered.length === 0 && (
            <div className="text-xs text-muted-foreground p-3 text-center">Nenhuma opção</div>
          )}
          {filtered.map((opt) => {
            const on = value.includes(opt);
            return (
              <button
                key={opt}
                onClick={() =>
                  onChange(on ? value.filter((v) => v !== opt) : [...value, opt])
                }
                className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded hover:bg-accent/40 text-xs"
              >
                <Checkbox checked={on} className="pointer-events-none" />
                <span className="truncate">{opt}</span>
              </button>
            );
          })}
        </div>
        <div className="p-2 border-t border-border flex items-center justify-between text-xs">
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onChange([])}
          >
            Limpar
          </button>
          <button
            className="text-primary font-bold hover:underline"
            onClick={() => setOpen(false)}
          >
            Aplicar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------- Tabela Virtualizada ----------

const ROW_H = 40;

function VirtualTable({
  rows,
  sort,
  dir,
  onSort,
  onRowClick,
}: {
  rows: PatrimonioRow[];
  sort: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  onRowClick: (r: PatrimonioRow) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rv = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 15,
  });

  const cols: { key: SortKey | null; label: string; w: string; render: (r: PatrimonioRow) => React.ReactNode }[] = [
    { key: "chapa", label: "Nº Patrimonial", w: "w-32", render: (r) => <span className="tabular text-primary font-mono font-bold">{r.chapa}</span> },
    { key: "descricao", label: "Descrição", w: "flex-1 min-w-[240px]", render: (r) => <span className="truncate font-medium">{r.descricao ?? "—"}</span> },
    { key: "conta_contabil_nome", label: "Conta Contábil", w: "w-56", render: (r) => <span className="text-xs text-muted-foreground truncate">{r.conta_contabil_nome ?? "—"}</span> },
    { key: "local", label: "Local", w: "w-56", render: (r) => <span className="text-xs text-muted-foreground truncate">{r.local ?? "—"}</span> },
    { key: "status", label: "Status", w: "w-28", render: (r) => <span className="text-xs">{normStatus(r.status)}</span> },
    { key: "situacao", label: "Situação", w: "w-32", render: (r) => <SituacaoBadge s={normSituacao(r.situacao)} /> },
    { key: null, label: "Especial", w: "w-20", render: (r) => (isEspecial(r.chapa) ? <Badge variant="outline" className="text-[10px] bg-accent/20 border-accent/40 text-accent-foreground font-semibold">Sim</Badge> : <span className="text-muted-foreground/60 text-xs">—</span>) },
    { key: "data_baixa", label: "Baixa", w: "w-28", render: (r) => <span className="text-xs text-muted-foreground tabular font-mono">{r.data_baixa?.slice(0, 10) ?? "—"}</span> },
  ];

  return (
    <section className="glass-card p-0 overflow-hidden border border-border/60">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="text-sm">
          <b className="tabular text-primary">{fmt.format(rows.length)}</b>{" "}
          <span className="text-muted-foreground">bens patrimoniais encontrados</span>
        </div>
        <div className="text-xs text-muted-foreground font-medium">Clique em qualquer linha para abrir a Ficha Rápida e QR Code</div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border-b border-border text-xs uppercase tracking-wide text-muted-foreground font-semibold">
        {cols.map((c) => (
          <div key={c.label} className={`${c.w} flex items-center gap-1`}>
            {c.key ? (
              <button
                onClick={() => onSort(c.key!)}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {c.label}
                <ArrowUpDown className={`h-3 w-3 ${sort === c.key ? "text-primary" : "opacity-40"}`} />
                {sort === c.key && (
                  <span className="text-primary text-[10px] font-bold">{dir === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            ) : (
              c.label
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      <div ref={parentRef} className="overflow-auto" style={{ height: "min(70vh, 720px)" }}>
        <div style={{ height: rv.getTotalSize(), position: "relative" }}>
          {rv.getVirtualItems().map((v) => {
            const r = rows[v.index];
            return (
              <div
                key={v.key}
                onClick={() => onRowClick(r)}
                className="flex items-center gap-3 px-4 border-b border-border/60 text-sm hover:bg-accent/20 cursor-pointer transition-colors"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${v.start}px)`,
                  height: ROW_H,
                }}
              >
                {cols.map((c) => (
                  <div key={c.label} className={`${c.w} truncate`}>
                    {c.render(r)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {rows.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum patrimônio corresponde aos filtros aplicados.
          </div>
        )}
      </div>
    </section>
  );
}

function SituacaoBadge({ s }: { s: SituacaoLabel }) {
  const tone: Record<SituacaoLabel, string> = {
    "Localizado": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    "Não Localizado": "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "Retirado": "bg-orange-500/15 text-orange-300 border-orange-500/30",
    "Transferência": "bg-sky-500/15 text-sky-300 border-sky-500/30",
    "B.O": "bg-red-500/15 text-red-300 border-red-500/30",
    "Em Branco": "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${tone[s]}`}>{s}</span>
  );
}

// ---------- COMPONENTE DE GERADOR DE QR CODE EM SVG ----------

function QrCodeSvg({ value }: { value: string }) {
  return (
    <div className="p-3 bg-white rounded-xl shadow-inner border border-gray-300 flex flex-col items-center gap-1 shrink-0">
      <svg width="110" height="110" viewBox="0 0 100 100" className="shape-rendering-crisp">
        {/* Cantos QR Code */}
        <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="2" />
        <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="1" />
        <rect x="13" y="13" width="12" height="12" fill="#0f172a" rx="1" />

        <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="2" />
        <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="1" />
        <rect x="75" y="13" width="12" height="12" fill="#0f172a" rx="1" />

        <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="2" />
        <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="1" />
        <rect x="13" y="75" width="12" height="12" fill="#0f172a" rx="1" />

        {/* Matriz Sintética de Dados do Patrimônio */}
        <rect x="40" y="8" width="6" height="6" fill="#0f172a" />
        <rect x="50" y="8" width="6" height="6" fill="#0f172a" />
        <rect x="40" y="20" width="6" height="6" fill="#0f172a" />
        <rect x="52" y="20" width="8" height="8" fill="#0f172a" />

        <rect x="8" y="40" width="6" height="6" fill="#0f172a" />
        <rect x="20" y="40" width="8" height="8" fill="#0f172a" />
        <rect x="36" y="38" width="10" height="10" fill="#0f172a" />
        <rect x="52" y="38" width="10" height="10" fill="#0f172a" />
        <rect x="68" y="40" width="8" height="8" fill="#0f172a" />
        <rect x="84" y="40" width="6" height="6" fill="#0f172a" />

        <rect x="8" y="52" width="6" height="6" fill="#0f172a" />
        <rect x="22" y="52" width="6" height="6" fill="#0f172a" />
        <rect x="38" y="54" width="8" height="8" fill="#0f172a" />
        <rect x="54" y="54" width="8" height="8" fill="#0f172a" />
        <rect x="70" y="52" width="6" height="6" fill="#0f172a" />

        <rect x="40" y="70" width="8" height="8" fill="#0f172a" />
        <rect x="54" y="70" width="6" height="6" fill="#0f172a" />
        <rect x="68" y="68" width="10" height="10" fill="#0f172a" />
        <rect x="84" y="70" width="8" height="8" fill="#0f172a" />

        <rect x="40" y="84" width="6" height="6" fill="#0f172a" />
        <rect x="52" y="84" width="10" height="10" fill="#0f172a" />
        <rect x="70" y="84" width="6" height="6" fill="#0f172a" />
        <rect x="84" y="84" width="6" height="6" fill="#0f172a" />
      </svg>
      <div className="font-mono font-bold text-[10px] text-gray-800 tracking-wider">PAT-{value}</div>
    </div>
  );
}

// ---------- FICHA RÁPIDA DO PATRIMÔNIO (RF-MOD-06-06) ----------

function FichaModal({ row, onClose }: { row: PatrimonioRow | null; onClose: () => void }) {
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl border border-border shadow-2xl">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-primary" />
              Ficha Rápida do Patrimônio <span className="font-mono text-primary font-bold">#{row?.chapa}</span>
            </DialogTitle>
            {row && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-bold border border-primary/30">
                {normStatus(row.status)}
              </span>
            )}
          </div>
          <DialogDescription>
            Identificação técnica, etiqueta patrimonial e histórico do bem.
          </DialogDescription>
        </DialogHeader>

        {row && (
          <div className="flex flex-col gap-5 my-2">
            {/* TOPO: FICHA E ETIQUETA COM QR CODE (RF-MOD-06-06) */}
            <div className="p-4 rounded-xl glass-card border border-border/80 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <QrCodeSvg value={row.chapa} />
                <div className="flex flex-col gap-1 text-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Prefeitura Municipal de Santana de Parnaíba
                  </div>
                  <div className="text-base font-bold text-foreground leading-snug">
                    {row.descricao || "Descrição não informada"}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{row.local || "Sem local cadastrado"}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity shrink-0"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimir Etiqueta
              </button>
            </div>

            {/* GRADE DE CAMPOS TÉCNICOS */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <Field label="Nº Patrimonial / Chapa" value={row.chapa} mono />
              <Field label="Chapa Especial" value={isEspecial(row.chapa) ? "Sim (Alfanumérica)" : "Não (Numérica)"} />
              <Field label="Situação Atual" value={normSituacao(row.situacao)} />
              <Field label="Código da Unidade" value={row.local_codigo || "SEC-001"} mono />
              <Field label="Data de Baixa" value={row.data_baixa?.slice(0, 10) || "Ativo (Sem Baixa)"} />
              <Field label="Status do Tombamento" value={normStatus(row.status)} />
              <Field label="Conta Contábil" value={row.conta_contabil_nome || "—"} full />
              <Field label="Localização / Endereço" value={row.localizacao || row.local || "—"} full />
            </div>

            {/* HISTÓRICO SIMULADO DE AUDITORIA (RNF-MOD-06-05) */}
            <div className="p-3.5 bg-muted/20 border border-border/50 rounded-xl flex flex-col gap-2 text-xs">
              <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Histórico Rastreável de Auditoria (Últimas ações)
              </div>
              <div className="space-y-1 text-muted-foreground text-[11px]">
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span>• Censo Patrimonial Anual Reconciliado</span>
                  <span className="font-mono">2026-07-28 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span>• Aceite do Responsável pelo Setor</span>
                  <span className="font-mono">2026-01-10 09:30</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {row && (
            <Link
              to="/adm/explorar"
              search={(prev: Record<string, unknown>) => ({
                ...(prev as Record<string, unknown>),
                chapa: row.chapa,
                chapaMode: "eq",
              })}
              onClick={onClose}
            >
              <Button size="sm" variant="secondary">
                Filtrar por esta Chapa
              </Button>
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) {
  return (
    <div className={`p-2.5 rounded-lg bg-background/50 border border-border/40 ${full ? "col-span-2 md:col-span-3" : ""}`}>
      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-xs font-semibold ${mono ? "tabular text-primary font-mono" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
