import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Utensils,
  Truck,
  CheckCircle2,
  Clock,
  Building,
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  ArrowRightLeft,
  RotateCcw,
  PackageCheck,
  AlertTriangle,
  User,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/inventario/merenda")({
  head: () => ({
    meta: [
      { title: "Transferências de Merenda Escolar (MOD-17) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Gestão especializada de movimentação de equipamentos de merenda escolar, comandas de expedição, recebimento e devolução.",
      },
    ],
  }),
  component: AdmMerendaPage,
});

export type StatusMerendaRemessa = "pendente" | "autorizado" | "em_transito" | "entregue" | "devolvido";
export type CategoriaEquipamentoMerenda = "refrigeracao" | "coccao" | "preparo" | "higienizacao";

export interface ItemMerendaRemessa {
  id: string;
  comandaCodigo: string; // Ex: CMD-MER-2026-001
  dataExpedicao: string;
  unidadeOrigem: string; // Ex: Galpão Central de Merenda
  unidadeEscolarDestino: string; // Ex: EMEF Aldeia de Barueri
  nutricionistaResponsavel: string;
  motoristaEntregador: string;
  veiculoPlaca: string;
  bens: { chapa: string; descricao: string; categoria: CategoriaEquipamentoMerenda; estado: string }[];
  status: StatusMerendaRemessa;
  observacoes?: string;
}

const INITIAL_REMESSAS_MERENDA: ItemMerendaRemessa[] = [
  {
    id: "REM-MER-001",
    comandaCodigo: "CMD-MER-2026-001",
    dataExpedicao: "2026-07-28 08:30",
    unidadeOrigem: "Galpão Central de Logística Alimentar",
    unidadeEscolarDestino: "EMEF Aldeia de Barueri (Cozinha 01)",
    nutricionistaResponsavel: "Dra. Helena Castro (CRN-3 48129)",
    motoristaEntregador: "Carlos Eduardo Santos",
    veiculoPlaca: "ABC-4E21",
    bens: [
      { chapa: "MER-1001", descricao: "FREEZER HORIZONTAL 500L DUPLA AÇÃO CONSUL", categoria: "refrigeracao", estado: "NOVO" },
      { chapa: "MER-1002", descricao: "FOGÃO INDUSTRIAL 6 BOCAS COM FORNO ITAJOBI", categoria: "coccao", estado: "BOM" },
      { chapa: "MER-1003", descricao: "BATEDEIRA INDUSTRIAL 20 LITROS PLANETÁRIA", categoria: "preparo", estado: "BOM" },
    ],
    status: "em_transito",
    observacoes: "Remessa prioritária para substituição do freezer queimado da EMEF.",
  },
  {
    id: "REM-MER-002",
    comandaCodigo: "CMD-MER-2026-002",
    dataExpedicao: "2026-07-25 10:15",
    unidadeOrigem: "Galpão Central de Logística Alimentar",
    unidadeEscolarDestino: "CMEI Fazendinha (Cozinha Principal)",
    nutricionistaResponsavel: "Dra. Camila Torres (CRN-3 39102)",
    motoristaEntregador: "Roberto Alves",
    veiculoPlaca: "XYZ-9988",
    bens: [
      { chapa: "MER-2044", descricao: "DESPASCADOR DE BATATAS E LEGUMES 10KG", categoria: "preparo", estado: "BOM" },
      { chapa: "MER-2045", descricao: "LAVADORA DE LOUÇAS INDUSTRIAL HOBART", categoria: "higienizacao", estado: "ÓTIMO" },
    ],
    status: "entregue",
  },
  {
    id: "REM-MER-003",
    comandaCodigo: "CMD-MER-2026-003",
    dataExpedicao: "2026-07-27 14:00",
    unidadeOrigem: "EMEF Professora Maria da Silva",
    unidadeEscolarDestino: "Galpão Central de Logística Alimentar",
    nutricionistaResponsavel: "Dra. Helena Castro (CRN-3 48129)",
    motoristaEntregador: "Carlos Eduardo Santos",
    veiculoPlaca: "ABC-4E21",
    bens: [
      { chapa: "MER-0899", descricao: "FORNO COMBINADO RACIONAL 10 GNS", categoria: "coccao", estado: "AVARIADO" },
    ],
    status: "devolvido",
    observacoes: "Devolução ao Galpão Central para manutenção especializada no fabricante.",
  },
];

function AdmMerendaPage() {
  const [remessas, setRemessas] = useState<ItemMerendaRemessa[]>(INITIAL_REMESSAS_MERENDA);
  const [qSearch, setQSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modais
  const [selectedComanda, setSelectedComanda] = useState<ItemMerendaRemessa | null>(null);
  const [selectedDevolucao, setSelectedDevolucao] = useState<ItemMerendaRemessa | null>(null);
  const [motivoDevolucao, setMotivoDevolucao] = useState("");

  const filteredRemessas = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return remessas.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (
        categoriaFilter &&
        !r.bens.some((b) => b.categoria === categoriaFilter)
      ) {
        return false;
      }
      if (!t) return true;

      return (
        r.comandaCodigo.toLowerCase().includes(t) ||
        r.unidadeEscolarDestino.toLowerCase().includes(t) ||
        r.nutricionistaResponsavel.toLowerCase().includes(t) ||
        r.bens.some((b) => b.chapa.toLowerCase().includes(t) || b.descricao.toLowerCase().includes(t))
      );
    });
  }, [remessas, qSearch, categoriaFilter, statusFilter]);

  const kpis = useMemo(
    () => [
      { label: "Remessas Em Trânsito", value: String(remessas.filter((r) => r.status === "em_transito").length) },
      { label: "Entregas Concluídas nas Escolas", value: String(remessas.filter((r) => r.status === "entregue").length) },
      { label: "Devoluções ao Galpão (Avarias)", value: String(remessas.filter((r) => r.status === "devolvido").length) },
      { label: "Total de Lotes Expedidos", value: String(remessas.length) },
    ],
    [remessas]
  );

  // RF-MOD-17-03: Recebimento na Escola
  const handleConfirmarRecebimentoEscola = (remessaId: string) => {
    setRemessas((prev) =>
      prev.map((r) => (r.id === remessaId ? { ...r, status: "entregue" } : r))
    );
    alert("Recebimento dos equipamentos de merenda confirmado pela equipe da cozinha escolar!");
  };

  // RF-MOD-17-03: Devolução ao Galpão
  const handleConfirmarDevolucao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevolucao || !motivoDevolucao.trim()) return;

    setRemessas((prev) =>
      prev.map((r) =>
        r.id === selectedDevolucao.id
          ? { ...r, status: "devolvido", observacoes: `Devolução: ${motivoDevolucao.trim()}` }
          : r
      )
    );

    alert(`Devolução do lote ${selectedDevolucao.comandaCodigo} registrada ao Galpão Central de Merenda!`);
    setSelectedDevolucao(null);
    setMotivoDevolucao("");
  };

  const exportMerendaCsv = () => {
    const headers = ["ComandaCodigo", "DataExpedicao", "Origem", "EscolaDestino", "Nutricionista", "BensQtde", "Status"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const r of remessas) {
      lines.push(
        [
          escape(r.comandaCodigo),
          escape(r.dataExpedicao),
          escape(r.unidadeOrigem),
          escape(r.unidadeEscolarDestino),
          escape(r.nutricionistaResponsavel),
          r.bens.length,
          escape(r.status),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-movimentacoes-merenda-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transferências Especializadas de Merenda Escolar (MOD-17)"
        description="Controle de remessas e lotes de equipamentos de cozinha industrial escolar, emissão de comandas de expedição e recebimento/devolução."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Inventário" }, { label: "Merenda Escolar" }]}
        actions={
          <button
            onClick={exportMerendaCsv}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4" /> Exportar Merenda (CSV)
          </button>
        }
      />

      <KPIGrid items={kpis} />

      {/* FILTROS ESPECIALIZADOS (RF-MOD-17-01 / RF-MOD-17-07) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Buscar por comanda, escola de destino, nutricionista ou chapa..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
          >
            <option value="">Todas as Categoria de Cozinha</option>
            <option value="refrigeracao">❄️ Refrigeração (Freezers/Geladeiras)</option>
            <option value="coccao">🔥 Cocção (Fogões/Fornos Industrial)</option>
            <option value="preparo">🥣 Preparo (Batedeiras/Descascadores)</option>
            <option value="higienizacao">🫧 Higienização (Lavadouras)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
          >
            <option value="">Todos os Status</option>
            <option value="em_transito">🚚 Em Trânsito</option>
            <option value="entregue">🟢 Entregue na Escola</option>
            <option value="devolvido">🔄 Devolvido ao Galpão</option>
            <option value="pendente">⏳ Pendente Expedição</option>
          </select>
        </div>
      </section>

      {/* TABELA DE REMESSAS DA MERENDA */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Comanda de Remessa</th>
                <th className="p-3">Data / Galpão Origem</th>
                <th className="p-3">Escola Destino / Cozinha</th>
                <th className="p-3">Nutricionista Responsável</th>
                <th className="p-3">Lote de Equipamentos (Merenda)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Comanda / Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredRemessas.map((remessa) => (
                <tr key={remessa.id} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">
                    <div className="flex items-center gap-1.5">
                      <Utensils className="h-4 w-4 text-primary shrink-0" />
                      <span>{remessa.comandaCodigo}</span>
                    </div>
                  </td>

                  <td className="p-3 font-medium text-foreground">
                    <div className="font-mono text-muted-foreground">{remessa.dataExpedicao}</div>
                    <span className="text-[10px] text-muted-foreground/80">{remessa.unidadeOrigem}</span>
                  </td>

                  <td className="p-3 font-semibold text-foreground">
                    <div>{remessa.unidadeEscolarDestino}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Placa {remessa.veiculoPlaca} ({remessa.motoristaEntregador})
                    </span>
                  </td>

                  <td className="p-3 font-medium text-foreground">
                    <div>{remessa.nutricionistaResponsavel}</div>
                  </td>

                  <td className="p-3 font-medium text-foreground">
                    <span className="font-bold text-primary">{remessa.bens.length} item(ns) em lote</span>
                    <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                      {remessa.bens.map((b) => b.descricao).join(", ")}
                    </div>
                  </td>

                  <td className="p-3">
                    <StatusMerendaBadge status={remessa.status} />
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedComanda(remessa)}
                        title="Gerar Comanda de Expedição (PDF) - RF-MOD-17-04"
                        className="px-2.5 py-1 rounded bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-bold text-[11px] inline-flex items-center gap-1 border border-primary/30"
                      >
                        <Printer className="h-3.5 w-3.5" /> Comanda (PDF)
                      </button>

                      {remessa.status === "em_transito" && (
                        <button
                          onClick={() => handleConfirmarRecebimentoEscola(remessa.id)}
                          title="Confirmar Recebimento na Escola"
                          className="px-2 py-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors text-[11px] font-bold inline-flex items-center gap-1 border border-success/30"
                        >
                          <PackageCheck className="h-3.5 w-3.5" /> Recebido
                        </button>
                      )}

                      {remessa.status !== "devolvido" && (
                        <button
                          onClick={() => setSelectedDevolucao(remessa)}
                          title="Devolução ao Galpão Central"
                          className="p-1.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRemessas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhuma remessa especializada de merenda encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL GERADOR DE COMANDA DE EXPEDIÇÃO PDF (RF-MOD-17-04 / REL-MOD-17-03) */}
      {selectedComanda && (
        <Dialog open={!!selectedComanda} onOpenChange={() => setSelectedComanda(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Printer className="h-5 w-5" /> Comanda de Expedição / Guia de Remessa de Merenda (PDF)
              </DialogTitle>
              <DialogDescription>
                Documento de remessa de equipamentos de alimentação escolar.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 text-xs mt-2 max-h-[65vh] overflow-y-auto pr-1">
              <div className="p-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                  <div>
                    <div className="text-[10px] text-slate-400 font-sans">PREFEITURA DE SANTANA DE PARNAÍBA</div>
                    <div className="text-sm font-bold text-amber-400">GUIA DE REMESSA — MERENDA ESCOLAR</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-200">{selectedComanda.comandaCodigo}</div>
                    <div className="text-[10px] text-slate-400">{selectedComanda.dataExpedicao}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div><b>Origem:</b> {selectedComanda.unidadeOrigem}</div>
                  <div><b>Destino:</b> {selectedComanda.unidadeEscolarDestino}</div>
                  <div><b>Nutricionista:</b> {selectedComanda.nutricionistaResponsavel}</div>
                  <div><b>Veículo/Placa:</b> {selectedComanda.veiculoPlaca} ({selectedComanda.motoristaEntregador})</div>
                </div>

                <div className="border-t border-slate-800 pt-2 space-y-1">
                  <div className="font-bold text-amber-400 text-xs">LOTE DE EQUIPAMENTOS EXPEDIDOS:</div>
                  {selectedComanda.bens.map((b) => (
                    <div key={b.chapa} className="flex justify-between text-[11px] bg-slate-900/60 p-1.5 rounded">
                      <span><b className="text-amber-400">#{b.chapa}</b> — {b.descricao}</span>
                      <span className="text-slate-400 font-bold uppercase">{b.categoria}</span>
                    </div>
                  ))}
                </div>

                {selectedComanda.observacoes && (
                  <div className="text-[10px] text-slate-400 italic bg-slate-900 p-2 rounded">
                    Obs: "{selectedComanda.observacoes}"
                  </div>
                )}

                <div className="border-t border-slate-800 pt-4 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-400">
                  <div className="border-t border-slate-700 pt-1">
                    Assinatura Motorista/Entregador<br />
                    <b>{selectedComanda.motoristaEntregador}</b>
                  </div>
                  <div className="border-t border-slate-700 pt-1">
                    Assinatura Recebedor/Cozinha Escolar<br />
                    <b>{selectedComanda.nutricionistaResponsavel}</b>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedComanda(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    setSelectedComanda(null);
                  }}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Imprimir Comanda (PDF)
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL DEVOLUÇÃO AO GALPÃO CENTRAL (RF-MOD-17-03) */}
      {selectedDevolucao && (
        <Dialog open={!!selectedDevolucao} onOpenChange={() => setSelectedDevolucao(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-warning">
                <RotateCcw className="h-5 w-5" /> Devolução de Equipamento ao Galpão (RF-MOD-17-03)
              </DialogTitle>
              <DialogDescription>
                Registrar o retorno do lote de merenda escolar ao Galpão Central.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmarDevolucao} className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-muted/30 border border-border rounded-lg">
                <div className="font-bold">Comanda: {selectedDevolucao.comandaCodigo}</div>
                <div>Unidade: {selectedDevolucao.unidadeEscolarDestino}</div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Motivo da Devolução *</label>
                <textarea
                  required
                  rows={3}
                  value={motivoDevolucao}
                  onChange={(e) => setMotivoDevolucao(e.target.value)}
                  placeholder="Ex: Equipamento necessita de manutenção no fabricante / encerramento do ano letivo..."
                  className="p-2.5 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDevolucao(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-warning text-warning-foreground font-bold hover:opacity-90"
                >
                  Confirmar Devolução ao Galpão
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusMerendaBadge({ status }: { status: StatusMerendaRemessa }) {
  const map: Record<StatusMerendaRemessa, { label: string; cls: string }> = {
    pendente: { label: "⏳ Pendente", cls: "bg-warning/20 text-warning border-warning/40 font-bold" },
    autorizado: { label: "🔵 Autorizado", cls: "bg-primary/20 text-primary border-primary/40 font-bold" },
    em_transito: { label: "🚚 Em Trânsito", cls: "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold" },
    entregue: { label: "🟢 Entregue na Escola", cls: "bg-success/20 text-success border-success/40 font-bold" },
    devolvido: { label: "🔄 Devolvido ao Galpão", cls: "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold" },
  };
  const item = map[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
