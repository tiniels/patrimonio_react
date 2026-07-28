import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  PackageCheck,
  Search,
  Download,
  FileText,
  ArrowLeftRight,
  Trash2,
  Eye,
  Building,
  Tag,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  MapPin,
  Clock,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import { getRespAuthSession } from "@/lib/authStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/locais/bens-setor")({
  head: () => ({
    meta: [
      { title: "Bens do Setor (MOD-22) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Gestão operacional do inventário do setor com busca, filtros de situação, ficha completa e atalhos de transferência.",
      },
    ],
  }),
  component: AdmBensSetorPage,
});

export type StatusOperacionalBem = "em_uso" | "em_transferencia" | "em_avaliacao_baixa" | "em_manutencao";
export type SituacaoFisicaBem = "bom" | "regular" | "danificado" | "inservivel";

export interface ItemBemSetor {
  chapa: string;
  descricao: string;
  marcaModelo: string;
  numeroSerie: string;
  contaContabil: string;
  codigoConta: string;
  localizacaoFisica: string; // Ex: Sala 102 - Bloco A
  valorIncorporado: number;
  dataIncorporacao: string;
  notaFiscal: string;
  statusOperacional: StatusOperacionalBem;
  situacaoFisica: SituacaoFisicaBem;
  historicoMovimentacoesCount: number;
}

const MOCK_BENS_SETOR_LIST: ItemBemSetor[] = [
  {
    chapa: "100120",
    descricao: "AR CONDICIONADO SPLIT 18000 BTU INVERTER",
    marcaModelo: "LG Dual Inverter / S4-Q18KL31A",
    numeroSerie: "SN-LG-984120",
    contaContabil: "Aparelhos e Utensílios de Refrigeração",
    codigoConta: "1.2.3.1.1.05",
    localizacaoFisica: "Sala de Reunião 02 — Térreo",
    valorIncorporado: 4500.0,
    dataIncorporacao: "2023-04-10",
    notaFiscal: "NF-89124 / Distribuidora SP",
    statusOperacional: "em_avaliacao_baixa",
    situacaoFisica: "danificado",
    historicoMovimentacoesCount: 3,
  },
  {
    chapa: "100889",
    descricao: "IMPRESSORA MULTIFUNCIONAL HP LASERJET PRO",
    marcaModelo: "HP LaserJet M428fdw",
    numeroSerie: "CNB1M84102",
    contaContabil: "Equipamentos de Processamento de Dados",
    codigoConta: "1.2.3.1.1.01",
    localizacaoFisica: "Recepção Central",
    valorIncorporado: 2800.0,
    dataIncorporacao: "2022-08-15",
    notaFiscal: "NF-44120 / TechStore Ltd",
    statusOperacional: "em_uso",
    situacaoFisica: "regular",
    historicoMovimentacoesCount: 1,
  },
  {
    chapa: "100452",
    descricao: "MESA PARA ESCRITÓRIO EM L COM GAVETEIRO",
    marcaModelo: "Marelli Executiva Madeira Nobre",
    numeroSerie: "S/N",
    contaContabil: "Mobiliário em Geral",
    codigoConta: "1.2.3.1.1.02",
    localizacaoFisica: "Estação de Trabalho 04",
    valorIncorporado: 1450.0,
    dataIncorporacao: "2021-11-20",
    notaFiscal: "NF-12004 / Móveis Escritório SP",
    statusOperacional: "em_uso",
    situacaoFisica: "bom",
    historicoMovimentacoesCount: 2,
  },
  {
    chapa: "100453",
    descricao: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA NR-17",
    marcaModelo: "Cavaletti Flexa 16001",
    numeroSerie: "S/N",
    contaContabil: "Mobiliário em Geral",
    codigoConta: "1.2.3.1.1.02",
    localizacaoFisica: "Estação de Trabalho 04",
    valorIncorporado: 890.0,
    dataIncorporacao: "2022-01-10",
    notaFiscal: "NF-12500 / Móveis Escritório SP",
    statusOperacional: "em_uso",
    situacaoFisica: "bom",
    historicoMovimentacoesCount: 1,
  },
  {
    chapa: "ESP-9901",
    descricao: "NOTEBOOK DELL LATITUDE 5540 CORE I7 16GB",
    marcaModelo: "Dell Latitude 5540 Core i7-1355U",
    numeroSerie: "DELL-SERVICE-88120",
    contaContabil: "Equipamentos de Processamento de Dados",
    codigoConta: "1.2.3.1.1.01",
    localizacaoFisica: "Gabinete do Gestor",
    valorIncorporado: 6800.0,
    dataIncorporacao: "2024-02-01",
    notaFiscal: "NF-99412 / Dell Computadores Brasil",
    statusOperacional: "em_transferencia",
    situacaoFisica: "bom",
    historicoMovimentacoesCount: 4,
  },
];

function AdmBensSetorPage() {
  const navigate = useNavigate();
  const session = getRespAuthSession();
  const setorAtual = session?.unidadeNome || session?.setor || "Departamento de Contabilidade e Patrimônio";

  const [bens] = useState<ItemBemSetor[]>(MOCK_BENS_SETOR_LIST);
  const [qSearch, setQSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [situacaoFilter, setSituacaoFilter] = useState<string>("");

  // Modal Ficha do Bem (RF-MOD-22-04)
  const [selectedBemFicha, setSelectedBemFicha] = useState<ItemBemSetor | null>(null);

  const dataAtualizacaoCarimbo = useMemo(
    () => new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    []
  );

  const filteredBens = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return bens.filter((b) => {
      if (statusFilter && b.statusOperacional !== statusFilter) return false;
      if (situacaoFilter && b.situacaoFisica !== situacaoFilter) return false;
      if (!t) return true;

      return (
        b.chapa.toLowerCase().includes(t) ||
        b.descricao.toLowerCase().includes(t) ||
        b.marcaModelo.toLowerCase().includes(t) ||
        b.numeroSerie.toLowerCase().includes(t) ||
        b.localizacaoFisica.toLowerCase().includes(t) ||
        b.contaContabil.toLowerCase().includes(t)
      );
    });
  }, [bens, qSearch, statusFilter, situacaoFilter]);

  const valorTotalCarga = useMemo(
    () => bens.reduce((acc, b) => acc + b.valorIncorporado, 0),
    [bens]
  );

  const kpis = useMemo(
    () => [
      { label: "Setor Ativo", value: setorAtual },
      { label: "Total de Bens na Carga", value: `${bens.length} itens` },
      { label: "Valor Total da Carga", value: `R$ ${valorTotalCarga.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
      { label: "Bens Bloqueados (Trânsito / Baixa)", value: `${bens.filter((b) => b.statusOperacional !== "em_uso").length} itens` },
    ],
    [bens, setorAtual, valorTotalCarga]
  );

  const exportBensCsv = () => {
    const headers = ["Chapa", "Descricao", "MarcaModelo", "NumeroSerie", "ContaContabil", "Localizacao", "Valor", "Status", "Situacao", "DataCarimbo"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const b of filteredBens) {
      lines.push(
        [
          escape(b.chapa),
          escape(b.descricao),
          escape(b.marcaModelo),
          escape(b.numeroSerie),
          escape(b.contaContabil),
          escape(b.localizacaoFisica),
          String(b.valorIncorporado),
          escape(b.statusOperacional),
          escape(b.situacaoFisica),
          escape(dataAtualizacaoCarimbo),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bens-setor-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bens do Setor (MOD-22)"
        description="Gestão operacional do inventário de carga patrimonial associado à unidade com atalhos de movimentação."
        crumbs={[{ label: "Locais", to: "/adm/locais/fichas" }, { label: "Bens do Setor" }]}
        actions={
          <button
            onClick={exportBensCsv}
            className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Exportar Relação (CSV)
          </button>
        }
      />

      <KPIGrid items={kpis} />

      {/* CARIMBO DE TEMPO RECONCILIADO (RN-MOD-22-04) */}
      <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span>Sincronização oficial de dados: <b>{dataAtualizacaoCarimbo}</b></span>
        </span>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">✓ Carga do Setor Auditada</span>
      </div>

      {/* PESQUISA E FILTROS (RF-MOD-22-02 & RF-MOD-22-03) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Buscar por chapa, descrição, marca, número de série ou sala..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
          >
            <option value="">Todos os Status Operacionais</option>
            <option value="em_uso">🟢 Em Uso / Operacional</option>
            <option value="em_transferencia">🔵 Em Transferência Ativa</option>
            <option value="em_avaliacao_baixa">⏳ Em Avaliação de Baixa</option>
            <option value="em_manutencao">🛠️ Em Manutenção</option>
          </select>

          <select
            value={situacaoFilter}
            onChange={(e) => setSituacaoFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
          >
            <option value="">Todas as Situações Físicas</option>
            <option value="bom">Bom Estado</option>
            <option value="regular">Estado Regular</option>
            <option value="danificado">Avariado / Danificado</option>
            <option value="inservivel">Inservível</option>
          </select>
        </div>
      </section>

      {/* TABELA DE BENS DO SETOR (RF-MOD-22-01 / RF-MOD-22-05) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Chapa</th>
                <th className="p-3">Descrição do Bem / Marca</th>
                <th className="p-3">Localização Física</th>
                <th className="p-3">Conta Contábil</th>
                <th className="p-3">Valor Incorporado</th>
                <th className="p-3">Status / Situação</th>
                <th className="p-3 text-right">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredBens.map((item) => (
                <tr key={item.chapa} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">#{item.chapa}</td>

                  <td className="p-3 font-semibold text-foreground">
                    <div>{item.descricao}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.marcaModelo}</span>
                  </td>

                  <td className="p-3 font-medium text-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{item.localizacaoFisica}</span>
                    </div>
                  </td>

                  <td className="p-3 font-medium text-foreground">
                    <div>{item.contaContabil}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.codigoConta}</span>
                  </td>

                  <td className="p-3 font-mono font-bold text-foreground">
                    R$ {item.valorIncorporado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>

                  <td className="p-3 space-y-1">
                    <StatusOperacionalBadge status={item.statusOperacional} />
                    <div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold uppercase">
                        Condição: {item.situacaoFisica}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedBemFicha(item)}
                        title="Ver Ficha do Bem"
                        className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {/* ATALHO DE TRANSFERÊNCIA (MOD-14 / RN-MOD-22-02) */}
                      <button
                        disabled={item.statusOperacional !== "em_uso"}
                        onClick={() => navigate({ to: "/_resp/responsavel/transferencia" as any })}
                        title={
                          item.statusOperacional === "em_uso"
                            ? "Solicitar Transferência do Bem (MOD-14)"
                            : "Bem Bloqueado para Transferência (RN-MOD-22-02)"
                        }
                        className={`p-1.5 rounded transition-colors ${
                          item.statusOperacional === "em_uso"
                            ? "bg-primary/20 text-primary hover:bg-primary/30"
                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                      </button>

                      {/* ATALHO DE AVALIAÇÃO E BAIXA (MOD-18 / RN-MOD-22-02) */}
                      <button
                        disabled={item.statusOperacional !== "em_uso"}
                        onClick={() => navigate({ to: "/_resp/responsavel/avaliacao" as any })}
                        title={
                          item.statusOperacional === "em_uso"
                            ? "Solicitar Avaliação e Baixa (MOD-18)"
                            : "Bem Bloqueado para Avaliação (RN-MOD-22-02)"
                        }
                        className={`p-1.5 rounded transition-colors ${
                          item.statusOperacional === "em_uso"
                            ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL FICHA DO BEM (RF-MOD-22-04) */}
      {selectedBemFicha && (
        <Dialog open={!!selectedBemFicha} onOpenChange={() => setSelectedBemFicha(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Tag className="h-5 w-5" /> Ficha do Bem Patrimonial #{selectedBemFicha.chapa}
              </DialogTitle>
              <DialogDescription>
                Histórico cadastral e informações de incorporação patrimonial.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <div><b>Descrição:</b> {selectedBemFicha.descricao}</div>
                <div><b>Marca / Modelo:</b> {selectedBemFicha.marcaModelo}</div>
                <div><b>Nº de Série:</b> <span className="font-mono">{selectedBemFicha.numeroSerie}</span></div>
                <div><b>Conta Contábil:</b> {selectedBemFicha.contaContabil} ({selectedBemFicha.codigoConta})</div>
                <div><b>Localização Física:</b> {selectedBemFicha.localizacaoFisica}</div>
              </div>

              <div className="p-3 bg-background border border-border rounded-lg space-y-1">
                <div><b>Nota Fiscal:</b> {selectedBemFicha.notaFiscal}</div>
                <div><b>Data de Incorporação:</b> {selectedBemFicha.dataIncorporacao}</div>
                <div><b>Valor de Aquisição:</b> R$ {selectedBemFicha.valorIncorporado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                <div><b>Histórico de Movimentações:</b> {selectedBemFicha.historicoMovimentacoesCount} registros</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBemFicha(null)}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Fechar Ficha
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusOperacionalBadge({ status }: { status: StatusOperacionalBem }) {
  const map: Record<StatusOperacionalBadgeType, { label: string; cls: string }> = {
    em_uso: { label: "🟢 Em Uso", cls: "bg-success/20 text-success border-success/40 font-bold" },
    em_transferencia: { label: "🔵 Em Transferência", cls: "bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold" },
    em_avaliacao_baixa: { label: "⏳ Em Avaliação Baixa", cls: "bg-warning/20 text-warning border-warning/40 font-bold" },
    em_manutencao: { label: "🛠️ Em Manutenção", cls: "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold" },
  } as any;
  const item = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}

type StatusOperacionalBadgeType = StatusOperacionalBem;
