import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  ChevronsUpDown,
  ClipboardList,
  Download,
  Eye,
  ImageOff,
  Info,
  Loader2,
  Printer,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/PageStub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { usePatrimonioData } from "@/hooks/usePatrimonioData";
import { fmt } from "@/lib/dashboardAgg";
import { patrimonioDb, type PatrimonioRow } from "@/lib/patrimonioDb";
import {
  useChefiaActions,
  STATUS_LABEL,
  STATUS_TEXT_CLASS,
  STATUS_BADGE_CLASS,
  type ActionStatus,
  type ChefiaAction,
} from "@/lib/chefiaActions";


export const Route = createFileRoute("/_app/chefia")({
  head: () => ({
    meta: [
      { title: "Chefia — Bens pendentes — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Painel executivo para chefias das secretarias: bens com situação diferente de LOCALIZADO por unidade.",
      },
    ],
  }),
  component: AdmChefia,
});

// ---------------- Helpers ----------------

type Unit = { codigo: string; nome: string; label: string };

const norm = (s: string | null | undefined) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isLocalizado = (r: PatrimonioRow) => norm(r.situacao) === "localizado";

const situacaoLabel = (s: string | null | undefined) => {
  const v = norm(s);
  if (!v) return "Sem situação";
  if (v === "localizado") return "Localizado";
  if (v.includes("nao") && v.includes("localiz")) return "Não Localizado";
  if (v.includes("transfer")) return "Transferência";
  if (v === "bo" || v.startsWith("b.o") || v.startsWith("bo")) return "B.O.";
  if (v.includes("retirad")) return "Retirado";
  if (v.includes("manuten")) return "Em Manutenção";
  if (v.includes("desfaz")) return "Em Desfazimento";
  if (v.includes("baixa")) return "Baixa Pendente";
  return (s ?? "").toString().toUpperCase();
};

function situacaoBadgeClasses(label: string): string {
  switch (label) {
    case "Não Localizado":
      return "bg-destructive/15 text-destructive border border-destructive/30";
    case "Transferência":
      return "bg-primary/15 text-primary border border-primary/30";
    case "B.O.":
      return "bg-[oklch(0.62_0.22_300)]/15 text-[oklch(0.78_0.22_300)] border border-[oklch(0.62_0.22_300)]/30";
    case "Retirado":
      return "bg-muted/60 text-muted-foreground border border-border";
    case "Em Manutenção":
      return "bg-warning/15 text-warning border border-warning/30";
    case "Em Desfazimento":
      return "bg-[oklch(0.68_0.18_30)]/15 text-[oklch(0.78_0.18_30)] border border-[oklch(0.68_0.18_30)]/30";
    case "Baixa Pendente":
      return "bg-warning/15 text-warning border border-warning/30";
    default:
      return "bg-muted/40 text-foreground/80 border border-border";
  }
}

function truncate(t: string, n = 60) {
  if (!t) return "";
  return t.length > n ? t.slice(0, n).trimEnd() + "…" : t;
}

function toCsv(rows: PatrimonioRow[], getAction: (chapa: string) => ChefiaAction | undefined): string {
  const head = ["chapa", "descricao", "local", "situacao", "acao_status", "acao_texto", "atribuido_a"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [head.join(",")].concat(
    rows.map((r) => {
      const a = getAction(r.chapa);
      return [
        r.chapa,
        r.descricao,
        r.local,
        situacaoLabel(r.situacao),
        a ? STATUS_LABEL[a.status] : "",
        a?.texto ?? "",
        a?.atribuidoA ?? "",
      ]
        .map(esc)
        .join(",");
    }),
  );
  return lines.join("\n");
}


// ---------------- Component ----------------

function AdmChefia() {
  const state = usePatrimonioData();
  const [selected, setSelected] = useState<Unit | null>(null);
  const [comboOpen, setComboOpen] = useState(false);

  // Build unit list from cached rows.
  const units: Unit[] = useMemo(() => {
    if (!state.rows) return [];
    const map = new Map<string, Unit>();
    for (const r of state.rows) {
      const code = (r.local_codigo ?? "").trim();
      if (!code) continue;
      if (!map.has(code)) {
        const local = (r.local ?? "").trim();
        const nome = local.replace(new RegExp(`^${code}\\s*-\\s*`), "");
        map.set(code, { codigo: code, nome, label: local || `${code}` });
      }
    }
    return [...map.values()].sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR", { numeric: true }));
  }, [state.rows]);

  // Rows of the selected unit (all situacoes, plus filtered pending later).
  const unitRows = useMemo(() => {
    if (!state.rows || !selected) return [];
    return state.rows.filter((r) => (r.local_codigo ?? "").trim() === selected.codigo);
  }, [state.rows, selected]);

  const pendingRows = useMemo(() => unitRows.filter((r) => !isLocalizado(r)), [unitRows]);

  // Counts by situacao (pending).
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of pendingRows) {
      const k = situacaoLabel(r.situacao);
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [pendingRows]);

  // Filters
  const [search, setSearch] = useState("");
  const [descSearch, setDescSearch] = useState("");
  const [sitFilter, setSitFilter] = useState<string>("todas");
  const [sortBy, setSortBy] = useState<"chapa" | "descricao" | "situacao">("chapa");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [selection, setSelection] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPage(1);
    setSelection(new Set());
  }, [selected, search, descSearch, sitFilter, sortBy, sortDir]);

  const filtered = useMemo(() => {
    const s = norm(search);
    const d = norm(descSearch);
    let list = pendingRows.filter((r) => {
      if (s && !norm(r.chapa).includes(s)) return false;
      if (d && !norm(r.descricao).includes(d)) return false;
      if (sitFilter !== "todas" && situacaoLabel(r.situacao) !== sitFilter) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      let av: string, bv: string;
      if (sortBy === "chapa") {
        av = a.chapa ?? "";
        bv = b.chapa ?? "";
      } else if (sortBy === "descricao") {
        av = a.descricao ?? "";
        bv = b.descricao ?? "";
      } else {
        av = situacaoLabel(a.situacao);
        bv = situacaoLabel(b.situacao);
      }
      const cmp = av.localeCompare(bv, "pt-BR", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [pendingRows, search, descSearch, sitFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const situacaoOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of pendingRows) set.add(situacaoLabel(r.situacao));
    return [...set].sort();
  }, [pendingRows]);

  // Detail sheet
  const [detailChapa, setDetailChapa] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!detailChapa) {
      setDetailRow(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      const { data, error } = await patrimonioDb
        .from("patrimonio_bens")
        .select(
          "chapa,descricao,conta_contabil,conta_contabil_nome,fornecedor,nota_fiscal,valor_aquisicao,valor_do_bem,valor_residual,data_aquisicao,data_baixa,local,local_codigo,local_nome,localizacao,status,situacao,resultado,observacao,link,atualizado_em,criado_em",
        )
        .eq("chapa", detailChapa)
        .maybeSingle();
      if (cancelled) return;
      setDetailLoading(false);
      if (!error) setDetailRow(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [detailChapa]);

  // Photo dialog
  const [photoRow, setPhotoRow] = useState<PatrimonioRow | null>(null);

  // Ações (fazer / fazendo / feito)
  const actions = useChefiaActions();
  const [editorChapa, setEditorChapa] = useState<string | null>(null);
  const editorRow = useMemo(
    () => (editorChapa ? unitRows.find((r) => r.chapa === editorChapa) ?? null : null),
    [editorChapa, unitRows],
  );

  // Export helpers
  const downloadCsv = (rows: PatrimonioRow[]) => {
    const blob = new Blob([toCsv(rows, actions.get)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chefia-${selected?.codigo ?? "unidade"}-acoes.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const pct =
    state.total > 0 ? Math.min(100, Math.round((state.loaded / state.total) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Chefia — Bens pendentes de inventário"
        description="Painel executivo por unidade. Consulte, analise fotos, revise observações e tome providências sobre bens não localizados."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Chefia" }]}
      />

      {state.error && (
        <div className="glass-card p-4 border border-destructive/40 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
          <div>
            <div className="font-medium">Não foi possível carregar os dados.</div>
            <div className="text-muted-foreground">{state.error}. Tente novamente.</div>
          </div>
        </div>
      )}

      {state.loading && !state.rows && (
        <div className="glass-card p-6 flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div className="text-sm text-muted-foreground">
            Preparando base de patrimônio — {fmt.format(state.loaded)} de{" "}
            {fmt.format(state.total || 0)}…
          </div>
          <div className="w-full max-w-md h-2 bg-muted/40 rounded overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Unit picker */}
      <section className="glass-card p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 min-w-0">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Unidade / Local
            </label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={!state.rows}
                  className="mt-1 w-full justify-between h-12 text-left font-normal"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                    {selected ? (
                      <span className="truncate">
                        <span className="tabular text-primary font-semibold">{selected.codigo}</span>{" "}
                        <span className="text-muted-foreground">·</span> {selected.nome}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Pesquisar por código, sigla ou nome da unidade…
                      </span>
                    )}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-60 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[min(92vw,640px)]" align="start">
                <Command
                  filter={(value, s) => {
                    const nv = norm(value);
                    const ns = norm(s);
                    return nv.includes(ns) ? 1 : 0;
                  }}
                >
                  <CommandInput placeholder="Ex.: 237, SMTI, Tecnologia, Secretaria…" />
                  <CommandList className="max-h-80">
                    <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                    <CommandGroup heading={`${fmt.format(units.length)} unidades`}>
                      {units.map((u) => (
                        <CommandItem
                          key={u.codigo}
                          value={`${u.codigo} ${u.nome} ${u.label}`}
                          onSelect={() => {
                            setSelected(u);
                            setComboOpen(false);
                          }}
                        >
                          <span className="tabular text-primary font-semibold w-14 shrink-0">
                            {u.codigo}
                          </span>
                          <span className="truncate">{u.nome}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selected && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:w-[420px]">
              <InfoLine
                icon={Building2}
                label="Local"
                value={`${selected.codigo} · ${selected.nome}`}
              />
              <InfoLine icon={UserRound} label="Responsável" value="—" hint="RLS por unidade" />
            </div>
          )}
        </div>
      </section>

      {!selected && state.rows && (
        <section className="glass-card p-10 text-center">
          <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="text-base font-medium">Selecione uma unidade para começar</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Utilize o campo acima para pesquisar por código (ex.: <b>237</b>), sigla (<b>SMTI</b>)
            ou parte do nome (<b>Tecnologia</b>).
          </p>
        </section>
      )}

      {selected && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi label="Total de bens" value={unitRows.length} tone="text-primary" />
            <Kpi label="Pendências" value={pendingRows.length} tone="text-warning" />
            <Kpi label="Não localizados" value={counts["Não Localizado"] ?? 0} tone="text-destructive" />
            <Kpi label="Transferências" value={counts["Transferência"] ?? 0} tone="text-primary" />
            <Kpi label="B.O." value={counts["B.O."] ?? 0} tone="text-[oklch(0.78_0.22_300)]" />
            <Kpi
              label="Outros"
              value={
                pendingRows.length -
                (counts["Não Localizado"] ?? 0) -
                (counts["Transferência"] ?? 0) -
                (counts["B.O."] ?? 0)
              }
              tone="text-muted-foreground"
            />
          </div>

          {/* Filters */}
          <section className="glass-card p-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-muted-foreground">Pesquisar chapa</label>
              <div className="relative mt-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ex.: 167094"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs text-muted-foreground">Pesquisar descrição</label>
              <div className="relative mt-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={descSearch}
                  onChange={(e) => setDescSearch(e.target.value)}
                  placeholder="Ex.: estante, notebook, cadeira"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="min-w-[180px]">
              <label className="text-xs text-muted-foreground">Situação</label>
              <Select value={sitFilter} onValueChange={setSitFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {situacaoOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[170px]">
              <label className="text-xs text-muted-foreground">Ordenar por</label>
              <Select
                value={`${sortBy}:${sortDir}`}
                onValueChange={(v) => {
                  const [b, d] = v.split(":") as [typeof sortBy, typeof sortDir];
                  setSortBy(b);
                  setSortDir(d);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chapa:asc">Chapa ↑</SelectItem>
                  <SelectItem value="chapa:desc">Chapa ↓</SelectItem>
                  <SelectItem value="descricao:asc">Descrição A–Z</SelectItem>
                  <SelectItem value="descricao:desc">Descrição Z–A</SelectItem>
                  <SelectItem value="situacao:asc">Situação ↑</SelectItem>
                  <SelectItem value="situacao:desc">Situação ↓</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCsv(filtered)}
                disabled={filtered.length === 0}
              >
                <Download className="h-4 w-4 mr-1" /> Exportar
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" /> Imprimir
              </Button>
            </div>
          </section>

          {/* Table */}
          <section className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {fmt.format(filtered.length)} bens pendentes{" "}
                {selection.size > 0 && (
                  <>
                    · <b className="text-foreground">{selection.size}</b> selecionados
                  </>
                )}
              </span>
              <span>
                Página <b className="text-foreground">{page}</b> de{" "}
                <b className="text-foreground">{totalPages}</b>
              </span>
            </div>

            {pendingRows.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide">
                    <tr>
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          aria-label="Selecionar todos"
                          checked={pageRows.length > 0 && pageRows.every((r) => selection.has(r.chapa))}
                          onChange={(e) => {
                            const next = new Set(selection);
                            if (e.target.checked) pageRows.forEach((r) => next.add(r.chapa));
                            else pageRows.forEach((r) => next.delete(r.chapa));
                            setSelection(next);
                          }}
                        />
                      </th>
                      <ThSort label="Chapa" active={sortBy === "chapa"} dir={sortDir} onClick={() => toggleSort("chapa", sortBy, sortDir, setSortBy, setSortDir)} />
                      <ThSort label="Descrição" active={sortBy === "descricao"} dir={sortDir} onClick={() => toggleSort("descricao", sortBy, sortDir, setSortBy, setSortDir)} />
                      <th className="p-3">Localização</th>
                      <ThSort label="Situação" active={sortBy === "situacao"} dir={sortDir} onClick={() => toggleSort("situacao", sortBy, sortDir, setSortBy, setSortDir)} />
                      <th className="p-3 w-20 text-center">Foto</th>
                      <th className="p-3 min-w-[280px]">Ação</th>
                      <th className="p-3 w-24"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => {
                      const sit = situacaoLabel(r.situacao);
                      const act = actions.get(r.chapa);
                      const rowTone = act && act.texto.trim() ? STATUS_TEXT_CLASS[act.status] : "";
                      return (
                        <tr
                          key={r.chapa}
                          className={`border-t border-border hover:bg-accent/15 ${rowTone}`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selection.has(r.chapa)}
                              onChange={(e) => {
                                const next = new Set(selection);
                                if (e.target.checked) next.add(r.chapa);
                                else next.delete(r.chapa);
                                setSelection(next);
                              }}
                              aria-label={`Selecionar ${r.chapa}`}
                            />
                          </td>
                          <td className={`p-3 tabular font-semibold ${rowTone || "text-primary"}`}>
                            {r.chapa}
                          </td>
                          <td className="p-3 max-w-[320px]">
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="line-clamp-2 cursor-help">
                                    {r.descricao ?? "—"}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md">
                                  {r.descricao ?? "—"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="p-3 text-xs opacity-80">
                            {r.localizacao ?? "—"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${situacaoBadgeClasses(sit)}`}
                            >
                              {sit}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPhotoRow(r)}
                              title="Ver foto"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                          <td className="p-3 max-w-[320px] align-top">
                            <ActionCell
                              action={act}
                              onCycle={() => actions.cycle(r.chapa)}
                              onEdit={() => setEditorChapa(r.chapa)}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <Button size="sm" variant="outline" onClick={() => setDetailChapa(r.chapa)}>
                              <Info className="h-3.5 w-3.5 mr-1" />
                              Detalhes
                            </Button>
                          </td>
                        </tr>
                      );

                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pendingRows.length > 0 && (
              <div className="p-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} de{" "}
                  {fmt.format(filtered.length)}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(1)}>
                    «
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </Button>
                  <span className="px-2 tabular">
                    {page} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    ›
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(totalPages)}
                  >
                    »
                  </Button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* Photo dialog */}
      <Dialog open={!!photoRow} onOpenChange={(o) => !o && setPhotoRow(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Fotografia · <span className="tabular text-primary">{photoRow?.chapa}</span>
            </DialogTitle>
            <DialogDescription className="line-clamp-2">
              {photoRow?.descricao ?? ""}
            </DialogDescription>
          </DialogHeader>
          <PhotoContent chapa={photoRow?.chapa ?? null} />
        </DialogContent>
      </Dialog>

      {/* Detail sheet */}
      <Sheet open={!!detailChapa} onOpenChange={(o) => !o && setDetailChapa(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Detalhes do bem{" "}
              <span className="tabular text-primary">{detailChapa}</span>
            </SheetTitle>
            <SheetDescription>Informações completas para tomada de decisão.</SheetDescription>
          </SheetHeader>

          {detailLoading && (
            <div className="mt-6 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-40 w-full mt-4" />
            </div>
          )}

          {!detailLoading && detailRow && (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Detail label="Chapa" value={detailRow.chapa} tabular />
              <Detail label="Situação" value={situacaoLabel(detailRow.situacao)} />
              <Detail
                label="Descrição"
                value={detailRow.descricao}
                full
              />
              <Detail label="Conta contábil" value={`${detailRow.conta_contabil ?? "—"} · ${detailRow.conta_contabil_nome ?? ""}`} full />
              <Detail label="Fornecedor" value={detailRow.fornecedor} full />
              <Detail label="Nota fiscal" value={detailRow.nota_fiscal} />
              <Detail label="Valor aquisição" value={detailRow.valor_aquisicao != null ? `R$ ${Number(detailRow.valor_aquisicao).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"} />
              <Detail label="Valor atual" value={detailRow.valor_do_bem != null ? `R$ ${Number(detailRow.valor_do_bem).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"} />
              <Detail label="Data aquisição" value={detailRow.data_aquisicao} />
              <Detail label="Data baixa" value={detailRow.data_baixa ?? "—"} />
              <Detail label="Local" value={detailRow.local} full />
              <Detail label="Localização física" value={detailRow.localizacao} />
              <Detail label="Status" value={detailRow.status} />
              <Detail label="Resultado" value={detailRow.resultado} />
              <Detail label="Último inventário" value={detailRow.atualizado_em?.slice(0, 10) ?? "—"} />
              <Detail label="Observação (dado original)" value={detailRow.observacao ?? "—"} full />
              <div className="col-span-2 mt-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Ação da chefia
                </div>
                <ActionCell
                  action={actions.get(detailRow.chapa)}
                  onCycle={() => actions.cycle(detailRow.chapa)}
                  onEdit={() => setEditorChapa(detailRow.chapa)}
                />
              </div>
              <div className="col-span-2 mt-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Fotografia
                </div>
                <PhotoInline link={detailRow.link} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Action editor */}
      <ActionEditor
        open={!!editorChapa}
        chapa={editorChapa}
        descricao={editorRow?.descricao ?? null}
        current={editorChapa ? actions.get(editorChapa) : undefined}
        onClose={() => setEditorChapa(null)}
        onSave={(patch) => {
          if (editorChapa) actions.upsert(editorChapa, patch);
        }}
        onClear={() => {
          if (editorChapa) actions.clear(editorChapa);
        }}
      />
    </div>
  );
}


// ---------------- Small pieces ----------------

function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="stat-card">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular ${tone}`}>{fmt.format(value)}</div>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="glass-card p-3 border border-border/70">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-sm font-medium truncate" title={value}>
        {value}
      </div>
      {hint && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</div>}
    </div>
  );
}

function ThSort({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="p-3 select-none">
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? "opacity-100" : "opacity-40"}`} />
        {active && <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

function toggleSort(
  col: "chapa" | "descricao" | "situacao",
  sortBy: string,
  sortDir: "asc" | "desc",
  setSortBy: (v: any) => void,
  setSortDir: (v: any) => void,
) {
  if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
  else {
    setSortBy(col);
    setSortDir("asc");
  }
}

function Detail({
  label,
  value,
  full,
  tabular,
}: {
  label: string;
  value: any;
  full?: boolean;
  tabular?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm ${tabular ? "tabular" : ""}`}>{value ?? "—"}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-success/15 text-success flex items-center justify-center mb-3">
        ✓
      </div>
      <div className="text-base font-medium">Nenhum patrimônio pendente nesta unidade.</div>
      <p className="text-sm text-muted-foreground mt-1">
        Todos os bens encontram-se localizados.
      </p>
    </div>
  );
}

// Convert Google Drive share/view links into embeddable image URLs when possible.
function driveThumb(link: string | null | undefined): string | null {
  if (!link) return null;
  const m =
    link.match(/\/file\/d\/([^/]+)/) || link.match(/[?&]id=([^&]+)/);
  const id = m?.[1];
  if (!id) return null;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
}

function PhotoContent({ chapa }: { chapa: string | null }) {
  const [link, setLink] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (!chapa) return;
    let cancelled = false;
    (async () => {
      const { data } = await patrimonioDb
        .from("patrimonio_bens")
        .select("link")
        .eq("chapa", chapa)
        .maybeSingle();
      if (!cancelled) setLink((data as any)?.link ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [chapa]);

  if (link === undefined) return <Skeleton className="h-80 w-full" />;
  return <PhotoInline link={link} />;
}

function PhotoInline({ link }: { link: string | null | undefined }) {
  const thumb = driveThumb(link);
  if (!link || !thumb) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-10 bg-muted/30 rounded-md border border-dashed border-border text-muted-foreground">
        <ImageOff className="h-8 w-8" />
        <span className="text-sm">Sem fotografia cadastrada</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="rounded-md overflow-hidden bg-black/40 border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt="Fotografia do bem"
          className="w-full max-h-[70vh] object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <div className="flex items-center justify-end gap-2 text-xs">
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <Download className="h-3 w-3" /> Abrir original
        </a>
      </div>
    </div>
  );
}

// ---------------- Action components ----------------

function ActionCell({
  action,
  onCycle,
  onEdit,
}: {
  action: ChefiaAction | undefined;
  onCycle: () => void;
  onEdit: () => void;
}) {
  const hasText = !!action?.texto?.trim();
  const status: ActionStatus = action?.status ?? "fazer";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        {(["fazer", "fazendo", "feito"] as ActionStatus[]).map((s) => {
          const active = hasText && status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={onCycle}
              disabled={!hasText}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                active
                  ? STATUS_BADGE_CLASS[s]
                  : "border-border/60 text-muted-foreground/70 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
              title={hasText ? "Clique para avançar o status" : "Adicione uma ação primeiro"}
            >
              <span
                className={`inline-block h-3 w-3 rounded-[3px] border ${
                  active
                    ? "bg-current border-current"
                    : "border-muted-foreground/50"
                }`}
              />
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>
      {hasText ? (
        <button
          type="button"
          onClick={onEdit}
          className="text-left text-xs leading-snug hover:underline"
          title="Editar ação"
        >
          {action!.texto}
          {action!.atribuidoA && (
            <span className="ml-1 opacity-70">· @{action!.atribuidoA}</span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Definir ação
        </button>
      )}
    </div>
  );
}

function ActionEditor({
  open,
  chapa,
  descricao,
  current,
  onClose,
  onSave,
  onClear,
}: {
  open: boolean;
  chapa: string | null;
  descricao: string | null;
  current: ChefiaAction | undefined;
  onClose: () => void;
  onSave: (patch: Partial<Omit<ChefiaAction, "chapa" | "atualizadoEm">>) => void;
  onClear: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [atribuidoA, setAtribuidoA] = useState("");
  const [status, setStatus] = useState<ActionStatus>("fazer");

  useEffect(() => {
    if (open) {
      setTexto(current?.texto ?? "");
      setAtribuidoA(current?.atribuidoA ?? "");
      setStatus(current?.status ?? "fazer");
    }
  }, [open, current]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Ação para <span className="tabular text-primary">{chapa}</span>
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            {descricao ?? "Descreva a providência a ser tomada e, se desejar, atribua a um usuário."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Descrição da ação
            </label>
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex.: Localizar o bem no depósito B; conferir NF; abrir B.O."
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Atribuir a (usuário)
              </label>
              <Input
                value={atribuidoA}
                onChange={(e) => setAtribuidoA(e.target.value)}
                placeholder="Ex.: joao.silva"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </label>
              <Select value={status} onValueChange={(v) => setStatus(v as ActionStatus)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fazer">Fazer</SelectItem>
                  <SelectItem value="fazendo">Fazendo</SelectItem>
                  <SelectItem value="feito">Feito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {current && (
            <div className="text-[11px] text-muted-foreground">
              Última atualização: {new Date(current.atualizadoEm).toLocaleString("pt-BR")}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClear();
              onClose();
            }}
            disabled={!current}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Remover ação
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!texto.trim()) {
                  onClear();
                } else {
                  onSave({ texto: texto.trim(), atribuidoA: atribuidoA.trim(), status });
                }
                onClose();
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Suppress unused-import warnings for icons kept for future actions.
void truncate;

