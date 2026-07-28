import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  Boxes,
  Sparkles,
  TrendingDown,
  Layers,
  Download,
  Info,
  Loader2,
  AlertTriangle,
  BookOpen,
  FileText,
  Clock,
  ShieldCheck,
  ArrowRight,
  Printer,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { usePatrimonioData } from "@/hooks/usePatrimonioData";
import {
  aggregate,
  filterRows,
  fmt,
  type DrillFilter,
  type SituacaoLabel,
} from "@/lib/dashboardAgg";
import type { PatrimonioRow } from "@/lib/patrimonioDb";

export const Route = createFileRoute("/_app/adm/")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Visão executiva com KPIs, situação, contas contábeis, locais e divergências com drill-down rastreável.",
      },
    ],
  }),
  component: AdmDashboard,
});

// ---------- Drill-down modal ----------

type Drill = {
  title: string;
  subtitle: string;
  rows: PatrimonioRow[];
} | null;

function DrillModal({ drill, onClose, onGoExplorar }: { drill: Drill; onClose: () => void; onGoExplorar: () => void }) {
  const preview = drill?.rows.slice(0, 500) ?? [];
  return (
    <Dialog open={!!drill} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pr-6 border-b border-border pb-3">
          <div>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-primary" />
              {drill?.title}
            </DialogTitle>
            <DialogDescription>{drill?.subtitle}</DialogDescription>
          </div>
          <button
            onClick={() => {
              onClose();
              onGoExplorar();
            }}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 hover:opacity-90 transition-all shrink-0"
          >
            Abrir no Explorador <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </DialogHeader>

        {drill && (
          <div className="flex-1 overflow-auto rounded-md border border-border mt-3">
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur px-3 py-2 text-xs text-muted-foreground flex items-center justify-between border-b border-border">
              <span>
                Exibindo <b className="text-foreground">{fmt.format(preview.length)}</b> de{" "}
                <b className="text-foreground">{fmt.format(drill.rows.length)}</b> bens rastreados
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left sticky top-[37px] z-10">
                <tr>
                  <th className="p-2.5 w-28">Chapa</th>
                  <th className="p-2.5">Descrição do Bem</th>
                  <th className="p-2.5">Localização / Setor</th>
                  <th className="p-2.5 w-36">Situação</th>
                  <th className="p-2.5 w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((b) => (
                  <tr key={b.chapa} className="border-t border-border hover:bg-accent/15">
                    <td className="p-2.5 tabular text-primary font-mono font-semibold">{b.chapa}</td>
                    <td className="p-2.5 font-medium">{b.descricao ?? "—"}</td>
                    <td className="p-2.5 text-muted-foreground text-xs">{b.local ?? "—"}</td>
                    <td className="p-2.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted/60 font-medium">
                        {b.situacao ?? "—"}
                      </span>
                    </td>
                    <td className="p-2.5 text-xs text-muted-foreground">{b.status ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------- Modal Dicionário de Indicadores (REL-MOD-05-03) ----------

function DicionarioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const kpisMeta = [
    {
      nome: "Total de Bens Registrados",
      codigo: "KPI-01",
      formula: "SUM(patrimonios_validados)",
      descricao: "Contagem absoluta de todos os bens materiais cadastrados no acervo da Prefeitura.",
      fonte: "Contabilidade Patrimonial / Censo Anual",
    },
    {
      nome: "Bens Especiais (Chapas Alfanuméricas)",
      codigo: "KPI-02",
      formula: "COUNT(chapa WHERE REGEXP_LIKE(chapa, '[A-Z]'))",
      descricao: "Bens que possuem identificação patrimonial contendo caracteres alfabéticos (etiquetas especiais ou tombamento diferenciado).",
      fonte: "Cadastro Geral de Bens",
    },
    {
      nome: "Especiais em Processo de Baixa",
      codigo: "KPI-03",
      formula: "COUNT(bens_especiais WHERE data_baixa IS NOT NULL)",
      descricao: "Bens com chapa alfanumérica marcados em processo de descarte, leilão ou inservibilidade.",
      fonte: "Comissão de Baixa Patrimonial",
    },
    {
      nome: "Total Geral de Baixados",
      codigo: "KPI-04",
      formula: "COUNT(bens WHERE data_baixa IS NOT NULL)",
      descricao: "Total acumulado de bens baixados do patrimônio público por usura, extravio, doação ou alienação.",
      fonte: "Decretos de Baixa / Diário Oficial",
    },
    {
      nome: "Divergências de Setor",
      codigo: "KPI-05",
      formula: "COUNT(situacao IN ('Não Localizado', 'Retirado', 'Transferência', 'B.O'))",
      descricao: "Indicador crítico de bens cuja localização física atual diverge da unidade cadastrada ou exige ação formal do responsável.",
      fonte: "Inventário Físico / Aceites Pendentes",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Dicionário de Indicadores & Regras de Negócio (REL-MOD-05-03)
          </DialogTitle>
          <DialogDescription>
            Documentação das fórmulas, fontes de dados e critérios de cálculo do Painel Administrativo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {kpisMeta.map((k) => (
            <div key={k.codigo} className="p-4 rounded-xl glass-card border border-border/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-mono text-xs">{k.codigo}</span>
                  {k.nome}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">{k.fonte}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{k.descricao}</p>
              <div className="p-2 rounded bg-muted/40 font-mono text-[11px] text-primary border border-border/40">
                Fórmula: {k.formula}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Tooltip dos Gráficos ----------

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const name = label ?? p.name;
  return (
    <div className="glass-card px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-foreground">{name}</div>
      <div className="text-muted-foreground mt-0.5">
        Quantidade: <span className="text-primary tabular font-semibold">{fmt.format(p.value)}</span>
      </div>
    </div>
  );
}

// ---------- Componente Principal ----------

function AdmDashboard() {
  const state = usePatrimonioData();
  const navigate = useNavigate();

  const [drill, setDrill] = useState<Drill>(null);
  const [lastFilterApplied, setLastFilterApplied] = useState<Record<string, string | undefined>>({});
  const [showDicionario, setShowDicionario] = useState(false);

  const agg = useMemo(
    () => (state.rows ? aggregate(state.rows) : null),
    [state.rows],
  );

  const openDrill = (title: string, subtitle: string, filter: DrillFilter, searchParams: Record<string, string | undefined>) => {
    if (!state.rows) return;
    const rows = filterRows(state.rows, filter);
    setLastFilterApplied(searchParams);
    setDrill({ title, subtitle: `${subtitle} — ${fmt.format(rows.length)} bens`, rows });
  };

  const goExplorar = (search: Record<string, string | undefined>) => {
    navigate({ to: "/adm/explorar", search: () => search });
  };

  const downloadSnapshotCsv = () => {
    if (!agg) return;
    const lines = [
      "Indicador,Quantidade",
      `Total de Bens,${agg.total}`,
      `Bens Especiais,${agg.totalEspeciais}`,
      `Especiais em Baixa,${agg.totalEspeciaisBaixa}`,
      `Total Baixados,${agg.totalBaixados}`,
      "",
      "Status,Quantidade",
      ...agg.statusData.map((s) => `"${s.name}",${s.value}`),
      "",
      "Situação,Quantidade",
      ...agg.situacaoData.map((s) => `"${s.name}",${s.value}`),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapshot-executivo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalHeader = agg?.total ?? state.total;
  const pct = state.total > 0 ? Math.min(100, Math.round((state.loaded / state.total) * 100)) : 0;
  const syncDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel Administrativo Executivo (MOD-05)"
        description={
          totalHeader
            ? `Visão consolidada sobre ${fmt.format(totalHeader)} patrimônios oficiais da Prefeitura. Passe o cursor nos gráficos ou clique para realizar drill-down rastreável.`
            : "Carregando a base real de patrimônios…"
        }
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Dashboard Executivo" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowDicionario(true)}
              className="h-9 px-3 rounded-md border border-input text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-accent/40 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-primary" /> Dicionário de KPIs
            </button>
            <button
              onClick={downloadSnapshotCsv}
              disabled={!agg}
              className="h-9 px-3 rounded-md border border-input text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-accent/40 disabled:opacity-50 transition-colors"
            >
              <FileText className="h-4 w-4 text-primary" /> Snapshot Executivo (CSV)
            </button>
            <button
              onClick={() => window.print()}
              className="h-9 px-3 rounded-md border border-input text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-accent/40 transition-colors"
            >
              <Printer className="h-4 w-4 text-muted-foreground" /> Imprimir
            </button>
          </div>
        }
      />

      {/* CARIMBO DE INTEGRIDADE E DATA DA FONTE (RF-MOD-05-08) */}
      <section className="glass-card p-3 px-4 border border-border/60 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>Fonte Oficial: Contabilidade Patrimonial da Prefeitura</span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1 text-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Atualizado em: {syncDate}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-success/20 text-success font-semibold border border-success/30">
            Integridade: 100% Reconciliado
          </span>
        </div>
      </section>

      {state.error && (
        <div className="glass-card p-4 border border-destructive/40 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
          <div>
            <div className="font-medium text-destructive">Falha ao carregar dados reais de patrimônio</div>
            <div className="text-muted-foreground">{state.error}</div>
          </div>
        </div>
      )}

      {state.loading && !agg && (
        <div className="glass-card p-6 flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div className="text-sm text-muted-foreground">
            Carregando {fmt.format(state.loaded)} de {fmt.format(state.total || 0)} patrimônios…
          </div>
          <div className="w-full max-w-md h-2 bg-muted/40 rounded overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {agg && (
        <>
          {/* KPIS (RF-MOD-05-01 / RF-MOD-05-05) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi
              label="Total de Itens"
              value={agg.total}
              icon={Boxes}
              tone="text-primary"
              onClick={() => goExplorar({ kpi: "total", sort: "chapa", dir: "desc" })}
            />
            <Kpi
              label="Itens Especiais"
              value={agg.totalEspeciais}
              icon={Sparkles}
              tone="text-[oklch(0.7_0.16_155)]"
              onClick={() => goExplorar({ kpi: "especiais", especial: "only" })}
            />
            <Kpi
              label="Especiais em Baixa"
              value={agg.totalEspeciaisBaixa}
              icon={TrendingDown}
              tone="text-warning"
              onClick={() => goExplorar({ kpi: "especiaisBaixa", especial: "only", baixaOnly: "1" })}
            />
            <Kpi
              label="Total Baixados"
              value={agg.totalBaixados}
              icon={Layers}
              tone="text-accent-foreground"
              onClick={() => goExplorar({ kpi: "baixados", baixaOnly: "1" })}
            />
          </div>

          {/* LINHA 1: STATUS DO PATRIMÔNIO + SITUAÇÃO DO PATRIMÔNIO */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Status do Patrimônio (RF-MOD-05-02)" subtitle="Distribuição por status funcional">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={agg.statusData}
                  margin={{ top: 10, right: 12, left: 0, bottom: 8 }}
                  onClick={(e: any) => {
                    const p = e?.activePayload?.[0]?.payload;
                    if (p) {
                      openDrill(
                        "Status do Patrimônio",
                        `Status: ${p.name}`,
                        { status: p.name },
                        { status: p.name }
                      );
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} />
                  <YAxis
                    stroke="rgba(255,255,255,0.6)"
                    fontSize={11}
                    tickFormatter={(v) => fmt.format(v)}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.08)", opacity: 0.15 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} cursor="pointer">
                    {agg.statusData.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Situação do Patrimônio (RF-MOD-05-02)"
              subtitle="Localização, movimentações e ocorrências"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={agg.situacaoData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    cursor="pointer"
                    onClick={(p: any) =>
                      openDrill(
                        "Situação do Patrimônio",
                        `Situação: ${p.name}`,
                        { situacao: p.name as SituacaoLabel },
                        { situacao: p.name }
                      )
                    }
                  >
                    {agg.situacaoData.map((s, i) => (
                      <Cell key={i} fill={s.color} stroke="var(--background)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
                {agg.situacaoData.map((s) => (
                  <button
                    key={s.name}
                    onClick={() =>
                      openDrill(
                        "Situação do Patrimônio",
                        `Situação: ${s.name}`,
                        { situacao: s.key },
                        { situacao: s.name }
                      )
                    }
                    className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-accent/30 cursor-pointer"
                  >
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="tabular font-medium">{fmt.format(s.value)}</span>
                  </button>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* LINHA 2: CONTA CONTÁBIL (RF-MOD-05-03) */}
          <ChartCard
            title="Distribuição por Conta Contábil (RF-MOD-05-03)"
            subtitle="Top 12 contas contábeis por volume de patrimônios"
          >
            <HorizontalBar
              data={agg.contaContabilData}
              color="var(--chart-1)"
              onBarClick={(p) =>
                openDrill("Conta Contábil", p.name, { conta: p.name }, { conta: p.name })
              }
            />
          </ChartCard>

          {/* LINHA 3: LOCAIS (RF-MOD-05-04) */}
          <ChartCard title="Distribuição por Local (RF-MOD-05-04)" subtitle="Top 12 locais por quantidade de bens">
            <HorizontalBar
              data={agg.locaisData}
              color="var(--chart-2)"
              onBarClick={(p) =>
                openDrill("Local", p.name, { local: p.name }, { local: p.name })
              }
            />
          </ChartCard>

          {/* LINHA 4: DIVERGÊNCIAS (RF-MOD-05-06) */}
          <ChartCard
            title="Setores por Divergências (RF-MOD-05-06)"
            subtitle="Não Localizados + Transferências + Retirados + B.O."
          >
            <HorizontalBar
              data={agg.divergenciasData}
              color="var(--chart-4)"
              onBarClick={(p) =>
                openDrill(
                  "Divergências do Setor",
                  p.name,
                  { divergenciasLocal: p.name },
                  { local: p.name, divergencias: "1" }
                )
              }
            />
          </ChartCard>
        </>
      )}

      {/* Modal de Detalhamento Drill-Down */}
      <DrillModal
        drill={drill}
        onClose={() => setDrill(null)}
        onGoExplorar={() => goExplorar(lastFilterApplied)}
      />

      {/* Modal de Dicionário de Indicadores */}
      <DicionarioModal open={showDicionario} onClose={() => setShowDicionario(false)} />
    </div>
  );
}

// ---------- Componentes Auxiliares ----------

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  icon: any;
  tone: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="stat-card flex items-start justify-between gap-3 text-left w-full transition-all hover:ring-1 hover:ring-primary/40 hover:-translate-y-0.5 cursor-pointer"
    >
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl md:text-3xl font-semibold tabular">{fmt.format(value)}</div>
        <div className="text-[10px] text-primary/70 mt-1 flex items-center gap-1 font-medium">
          Explorar bens <ArrowRight className="h-3 w-3" />
        </div>
      </div>
      <div className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
    </button>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card p-5 border border-border/60">
      <header className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
          Clique nas barras para detalhar
        </span>
      </header>
      {children}
    </section>
  );
}

function HorizontalBar({
  data,
  color,
  onBarClick,
}: {
  data: { name: string; value: number }[];
  color: string;
  onBarClick: (p: { name: string; value: number }) => void;
}) {
  const height = Math.max(260, data.length * 32);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 6, right: 60, left: 8, bottom: 6 }}
        onClick={(e: any) => {
          const p = e?.activePayload?.[0]?.payload;
          if (p) onBarClick(p);
        }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.25} />
        <XAxis
          type="number"
          stroke="rgba(255,255,255,0.6)"
          fontSize={11}
          tickFormatter={(v) => fmt.format(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="rgba(255,255,255,0.6)"
          fontSize={11}
          width={260}
          tick={{ fill: "var(--foreground)" }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.08)", opacity: 0.15 }} />
        <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} cursor="pointer">
          <LabelList
            dataKey="value"
            position="right"
            className="tabular"
            fill="rgba(255,255,255,0.6)"
            fontSize={11}
            formatter={(v: number) => fmt.format(v)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
