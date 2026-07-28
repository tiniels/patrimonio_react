import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Warehouse,
  AlertTriangle,
  Search,
  Download,
  Eye,
  Clock,
  Filter,
  BarChart3,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/galpao/graficos")({
  head: () => ({
    meta: [
      { title: "Painel do Galpão (MOD-25) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Indicadores visuais, movimentação mensal, saldo por item com unidades normalizadas, curva de giro e alerta de estoque crítico.",
      },
    ],
  }),
  component: AdmGalpaoGraficosPage,
});

export type UnidadeMedida = "UN" | "CX" | "MTR" | "CJ" | "KG";

export interface ItemEstoqueGalpao {
  codigoSku: string;
  descricao: string;
  categoria: string;
  unidadeMedida: UnidadeMedida;
  saldoAtual: number;
  estoqueMinimo: number;
  tempoMedioDias: number; // Tempo médio em estoque (dias)
  valorUnitarioMedio: number;
  totalEntradasMes: number;
  totalSaidasMes: number;
  historicoMovimentacoes: Array<{
    dataHora: string;
    tipo: "entrada" | "saida" | "ajuste";
    quantidade: number;
    documento: string;
    responsavel: string;
  }>;
}

const MOCK_ESTOQUE_GALPAO: ItemEstoqueGalpao[] = [
  {
    codigoSku: "SKU-EST-001",
    descricao: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA NR-17",
    categoria: "Mobiliário",
    unidadeMedida: "UN",
    saldoAtual: 4,
    estoqueMinimo: 10,
    tempoMedioDias: 18,
    valorUnitarioMedio: 890.0,
    totalEntradasMes: 20,
    totalSaidasMes: 16,
    historicoMovimentacoes: [
      { dataHora: "2026-07-28 10:00", tipo: "saida", quantidade: 2, documento: "RET-2026-044 / Secretaria de Educação", responsavel: "Marcos Viana" },
      { dataHora: "2026-07-20 14:30", tipo: "entrada", quantidade: 10, documento: "NF-99412 / Indústria Marelli", responsavel: "Galpão Operações" },
    ],
  },
  {
    codigoSku: "SKU-EST-002",
    descricao: "MONITOR LCD 27 IPS FULL HD DELL",
    categoria: "Eletrônicos",
    unidadeMedida: "UN",
    saldoAtual: 15,
    estoqueMinimo: 5,
    tempoMedioDias: 12,
    valorUnitarioMedio: 1250.0,
    totalEntradasMes: 30,
    totalSaidasMes: 15,
    historicoMovimentacoes: [
      { dataHora: "2026-07-26 11:20", tipo: "saida", quantidade: 5, documento: "RET-2026-041 / Saúde", responsavel: "João Pedro" },
      { dataHora: "2026-07-15 09:00", tipo: "entrada", quantidade: 20, documento: "EMP-2026-002 / Dell Brasil", responsavel: "Galpão Recebimento" },
    ],
  },
  {
    codigoSku: "SKU-EST-003",
    descricao: "CABO DE REDE UTP CAT6 AZUL (CAIXA 305M)",
    categoria: "Suprimentos TI",
    unidadeMedida: "CX",
    saldoAtual: 2,
    estoqueMinimo: 5,
    tempoMedioDias: 45,
    valorUnitarioMedio: 680.0,
    totalEntradasMes: 5,
    totalSaidasMes: 3,
    historicoMovimentacoes: [
      { dataHora: "2026-07-27 16:00", tipo: "saida", quantidade: 1, documento: "RET-2026-042 / Departamento de TI", responsavel: "Alexandre Santos" },
    ],
  },
  {
    codigoSku: "SKU-EST-004",
    descricao: "AR CONDICIONADO SPLIT 12000 BTU INVERTER",
    categoria: "Climatização",
    unidadeMedida: "UN",
    saldoAtual: 8,
    estoqueMinimo: 3,
    tempoMedioDias: 25,
    valorUnitarioMedio: 3200.0,
    totalEntradasMes: 10,
    totalSaidasMes: 2,
    historicoMovimentacoes: [
      { dataHora: "2026-07-10 15:00", tipo: "entrada", quantidade: 10, documento: "EMP-2026-010 / Midea Carrier", responsavel: "Galpão Recebimento" },
    ],
  },
];

function AdmGalpaoGraficosPage() {
  const [estoque] = useState<ItemEstoqueGalpao[]>(MOCK_ESTOQUE_GALPAO);
  const [qSearch, setQSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("");
  const [apenasCriticos, setApenasCriticos] = useState(false);

  // Modal Drill-down (RF-MOD-25-06)
  const [selectedDrillDownItem, setSelectedDrillDownItem] = useState<ItemEstoqueGalpao | null>(null);

  const dataAtualizacaoReconciliada = useMemo(
    () => new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    []
  );

  const filteredEstoque = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return estoque.filter((item) => {
      if (categoriaFilter && item.categoria !== categoriaFilter) return false;
      if (apenasCriticos && item.saldoAtual >= item.estoqueMinimo) return false;
      if (!t) return true;

      return (
        item.codigoSku.toLowerCase().includes(t) ||
        item.descricao.toLowerCase().includes(t) ||
        item.categoria.toLowerCase().includes(t)
      );
    });
  }, [estoque, qSearch, categoriaFilter, apenasCriticos]);

  const totalItensEstoque = useMemo(
    () => estoque.reduce((acc, i) => acc + i.saldoAtual, 0),
    [estoque]
  );

  const totalValorEstoque = useMemo(
    () => estoque.reduce((acc, i) => acc + i.saldoAtual * i.valorUnitarioMedio, 0),
    [estoque]
  );

  const totalItensCriticos = useMemo(
    () => estoque.filter((i) => i.saldoAtual < i.estoqueMinimo).length,
    [estoque]
  );

  const kpis = useMemo(
    () => [
      { label: "Total de Unidades em Estoque", value: `${totalItensEstoque} itens` },
      { label: "Valor Total do Depósito", value: `R$ ${totalValorEstoque.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
      { label: "Itens em Nível Crítico (RN-MOD-25-02)", value: `${totalItensCriticos} alertas`, hint: "Estoque abaixo do mínimo" },
      { label: "Giro Médio no Depósito", value: "22.5 dias" },
    ],
    [totalItensEstoque, totalValorEstoque, totalItensCriticos]
  );

  const exportPosicaoEstoqueCsv = () => {
    const headers = ["SKU", "Descricao", "Categoria", "Unidade", "SaldoAtual", "EstoqueMinimo", "ValorUnitario", "ValorTotal", "TempoMedioDias", "StatusEstoque"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const i of filteredEstoque) {
      const isCritico = i.saldoAtual < i.estoqueMinimo;
      lines.push(
        [
          escape(i.codigoSku),
          escape(i.descricao),
          escape(i.categoria),
          escape(i.unidadeMedida),
          i.saldoAtual,
          i.estoqueMinimo,
          i.valorUnitarioMedio,
          i.saldoAtual * i.valorUnitarioMedio,
          i.tempoMedioDias,
          escape(isCritico ? "CRITICO" : "NORMAL"),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `posicao-estoque-galpao-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel e Indicadores do Galpão (MOD-25)"
        description="Cockpit analítico do depósito: gráficos de movimentação, saldos por item reconciliados, giro de estoque e alertas de ponto de pedido."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Galpão" }, { label: "Gráficos & Indicadores" }]}
        actions={
          <button
            onClick={exportPosicaoEstoqueCsv}
            className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Exportar Posição de Estoque (CSV)
          </button>
        }
      />

      <KPIGrid items={kpis} />

      {/* CARIMBO DE RECONCILIAÇÃO DE SALDO (RN-MOD-25-01 & RN-MOD-25-02) */}
      <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span>Última reconciliação de saldo em banco: <b>{dataAtualizacaoReconciliada}</b></span>
        </span>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">✓ Saldos Auditados no Servidor</span>
      </div>

      {/* PAINEL DE GRÁFICOS ANALÍTICOS (RF-MOD-25-01 / RF-MOD-25-02 / RF-MOD-25-05) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* GRÁFICO DE ENTRADAS VS SAÍDAS */}
        <section className="glass-card p-5 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Entradas por Empenho vs Saídas por Setor (Mês Atual)</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ArrowDownLeft className="h-3.5 w-3.5" /> Entradas por Empenho/Doação
                </span>
                <span>65 Unidades</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "65%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1 text-blue-400">
                  <ArrowUpRight className="h-3.5 w-3.5" /> Saídas Atendidas (Educação)
                </span>
                <span>28 Unidades</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "28%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1 text-purple-400">
                  <ArrowUpRight className="h-3.5 w-3.5" /> Saídas Atendidas (Saúde & Gestão)
                </span>
                <span>18 Unidades</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "18%" }} />
              </div>
            </div>
          </div>
        </section>

        {/* CURVA DE GIRO E PERMANÊNCIA (RF-MOD-25-05 / REL-MOD-25-03) */}
        <section className="glass-card p-5 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Curva de Giro & Permanência Média no Depósito</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-background/60 border border-border rounded-lg space-y-1">
              <span className="text-muted-foreground font-medium">Classe A (Alto Giro)</span>
              <div className="font-bold text-base text-emerald-400">12 dias de giro</div>
              <p className="text-[10px] text-muted-foreground">Monitores e Periféricos de TI</p>
            </div>

            <div className="p-3 bg-background/60 border border-border rounded-lg space-y-1">
              <span className="text-muted-foreground font-medium">Classe B (Giro Médio)</span>
              <div className="font-bold text-base text-blue-400">22 dias de giro</div>
              <p className="text-[10px] text-muted-foreground">Mobiliário de Escritório</p>
            </div>

            <div className="p-3 bg-background/60 border border-border rounded-lg space-y-1 col-span-2">
              <span className="text-muted-foreground font-medium">Classe C (Baixo Giro / Armazenado)</span>
              <div className="font-bold text-base text-amber-400">45+ dias de giro</div>
              <p className="text-[10px] text-muted-foreground">Cabos e Suprimentos de Infraestrutura de Rede</p>
            </div>
          </div>
        </section>
      </div>

      {/* FILTROS E PESQUISA DE SALDO (RF-MOD-25-07) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="grid gap-3 md:grid-cols-4 items-center">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Buscar por SKU, descrição do item ou categoria..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
          >
            <option value="">Todas as Categorias</option>
            <option value="Mobiliário">Mobiliário</option>
            <option value="Eletrônicos">Eletrônicos</option>
            <option value="Suprimentos TI">Suprimentos TI</option>
            <option value="Climatização">Climatização</option>
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={apenasCriticos}
              onChange={(e) => setApenasCriticos(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <span className="text-amber-400">Exibir apenas Itens Críticos</span>
          </label>
        </div>
      </section>

      {/* TABELA DE POSIÇÃO DE ESTOQUE RECONCILIADA (RF-MOD-25-03 / RF-MOD-25-04 / RN-MOD-25-04) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">SKU</th>
                <th className="p-3">Descrição do Item</th>
                <th className="p-3">Categoria</th>
                <th className="p-3 text-center">Unidade (RN-MOD-25-04)</th>
                <th className="p-3 text-right">Saldo Atual</th>
                <th className="p-3 text-right">Estoque Mínimo</th>
                <th className="p-3 text-right">Giro Médio (Dias)</th>
                <th className="p-3 text-right">Ação / Drill-down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredEstoque.map((item) => {
                const isCritico = item.saldoAtual < item.estoqueMinimo;
                return (
                  <tr key={item.codigoSku} className="hover:bg-accent/10 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">{item.codigoSku}</td>

                    <td className="p-3 font-semibold text-foreground">
                      <div>{item.descricao}</div>
                      {isCritico && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase inline-flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3" /> Abaixo do Limite Mínimo
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-medium text-foreground">{item.categoria}</td>

                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono font-bold">
                        {item.unidadeMedida}
                      </span>
                    </td>

                    <td className={`p-3 text-right font-mono font-bold text-sm ${isCritico ? "text-rose-400" : "text-emerald-400"}`}>
                      {item.saldoAtual}
                    </td>

                    <td className="p-3 text-right font-mono text-muted-foreground">{item.estoqueMinimo}</td>

                    <td className="p-3 text-right font-mono font-medium text-foreground">{item.tempoMedioDias}d</td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedDrillDownItem(item)}
                        title="Ver Drill-down de Movimentações"
                        className="px-3 py-1.5 rounded bg-primary/20 text-primary font-bold text-[11px] hover:bg-primary/30 inline-flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> Drill-down
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL DRILL-DOWN DE MOVIMENTAÇÕES DO ITEM (RF-MOD-25-06) */}
      {selectedDrillDownItem && (
        <Dialog open={!!selectedDrillDownItem} onOpenChange={() => setSelectedDrillDownItem(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Warehouse className="h-5 w-5" /> Drill-down de Estoque: {selectedDrillDownItem.codigoSku}
              </DialogTitle>
              <DialogDescription>
                Extrato detalhado de movimentações e reconciliação em tempo real.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <div><b>Descrição:</b> {selectedDrillDownItem.descricao}</div>
                <div><b>Categoria:</b> {selectedDrillDownItem.categoria} · <b>Unidade:</b> {selectedDrillDownItem.unidadeMedida}</div>
                <div><b>Saldo Reconciliado:</b> <b className="text-emerald-400">{selectedDrillDownItem.saldoAtual} {selectedDrillDownItem.unidadeMedida}</b></div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-foreground">Histórico Recente de Entradas e Saídas</div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedDrillDownItem.historicoMovimentacoes.map((h, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-background border border-border flex items-center justify-between">
                      <div>
                        <div className="font-bold text-foreground">{h.documento}</div>
                        <div className="text-[10px] text-muted-foreground">{h.dataHora} · Operador: {h.responsavel}</div>
                      </div>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        h.tipo === "entrada" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                      }`}>
                        {h.tipo === "entrada" ? `+${h.quantidade}` : `-${h.quantidade}`} {selectedDrillDownItem.unidadeMedida}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedDrillDownItem(null)}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Fechar Drill-down
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
