import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileCheck2,
  Search,
  Download,
  Printer,
  FileText,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  UserCheck,
  Layers,
  FileCheck,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/galpao/retiradas/gerenciar")({
  head: () => ({
    meta: [
      { title: "Gerenciamento de Retiradas e PDF (MOD-27) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Central de auditoria e gestão de retiradas: confirmação em lote com prévia de impacto, eventos compensatórios, Livro de Saídas PDF e rastreabilidade.",
      },
    ],
  }),
  component: AdmGerenciarRetiradasPage,
});

export type StatusGerenciamento = "pendente" | "efetivada" | "corrigida_compensada" | "cancelada";

export interface ItemRetiradaGerenciada {
  protocolo: string;
  dataHora: string;
  setorDestino: string;
  nomeRecebedor: string;
  documentoRecebedor: string;
  itensResumo: string;
  totalUnidades: number;
  status: StatusGerenciamento;
  operador: string;
  versaoDocumento: number;
  hashPdf: string;
  historicoEventos: Array<{
    dataHora: string;
    ator: string;
    evento: string;
    detalhe: string;
  }>;
}

const MOCK_GERENCIAMENTO_LIST: ItemRetiradaGerenciada[] = [
  {
    protocolo: "RET-2026-040",
    dataHora: "2026-07-28 09:15",
    setorDestino: "Secretaria de Saúde — Almoxarifado Central",
    nomeRecebedor: "Dra. Helena Castro",
    documentoRecebedor: "CPF 120.441.988-00",
    itensResumo: "5x Monitor LCD 27 IPS Dell, 1x Cabo Cat6",
    totalUnidades: 6,
    status: "pendente",
    operador: "Galpão Operações",
    versaoDocumento: 1,
    hashPdf: "c7d8e94298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b111",
    historicoEventos: [
      { dataHora: "2026-07-28 09:15", ator: "Galpão Operações", evento: "Reserva de Saldo", detalhe: "Itens reservados aguardando efetivação em lote." },
    ],
  },
  {
    protocolo: "RET-2026-039",
    dataHora: "2026-07-27 15:40",
    setorDestino: "Departamento de Tecnologia da Informação",
    nomeRecebedor: "Alexandre Santos",
    documentoRecebedor: "CPF 981.200.412-11",
    itensResumo: "2x Cadeira Giratória Ergonômica Marelli",
    totalUnidades: 2,
    status: "efetivada",
    operador: "Carlos Eduardo",
    versaoDocumento: 1,
    hashPdf: "d9e0f14298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b222",
    historicoEventos: [
      { dataHora: "2026-07-27 15:40", ator: "Carlos Eduardo", evento: "Efetivação de Entrega", detalhe: "Baixa transacional de estoque gravada com sucesso." },
      { dataHora: "2026-07-27 15:42", ator: "Carlos Eduardo", evento: "Emissão de PDF v1", detalhe: "Hash SHA-256 gerado e assinado digitalmente." },
    ],
  },
  {
    protocolo: "RET-2026-038",
    dataHora: "2026-07-26 11:20",
    setorDestino: "Secretaria de Educação — Escola Anexo 01",
    nomeRecebedor: "Prof. Roberto Mendes",
    documentoRecebedor: "CPF 301.882.110-44",
    itensResumo: "1x Ar Condicionado Split 12000 BTU",
    totalUnidades: 1,
    status: "corrigida_compensada",
    operador: "Carlos Eduardo",
    versaoDocumento: 2,
    hashPdf: "e0f1a24298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b333",
    historicoEventos: [
      { dataHora: "2026-07-26 11:20", ator: "Carlos Eduardo", evento: "Efetivação Original", detalhe: "Saída de 1x Ar Condicionado." },
      { dataHora: "2026-07-26 14:10", ator: "Carlos Eduardo", evento: "Evento Compensatório de Ajuste (RN-MOD-27-03)", detalhe: "Ajuste na quantidade por discrepância no laudo de entrega." },
    ],
  },
];

function AdmGerenciarRetiradasPage() {
  const [retiradas, setRetiradas] = useState<ItemRetiradaGerenciada[]>(MOCK_GERENCIAMENTO_LIST);
  const [qSearch, setQSearch] = useState("");
  const [tabState, setTabState] = useState<"todas" | "pendentes" | "efetivadas" | "compensadas">("todas");

  // Seleção Múltipla para Ações em Lote (RF-MOD-27-03)
  const [selectedProtocolos, setSelectedProtocolos] = useState<string[]>([]);
  const [modalLotePreviewOpen, setModalLotePreviewOpen] = useState(false);

  // Modal Evento Compensatório / Correção (RF-MOD-27-06 / RN-MOD-27-03)
  const [selectedCompensacao, setSelectedCompensacao] = useState<ItemRetiradaGerenciada | null>(null);
  const [justificativaCompensacao, setJustificativaCompensacao] = useState("");

  // Modal Livro de Saídas / PDF Oficial (RF-MOD-27-04 / RF-MOD-27-05)
  const [modalLivroSaidasOpen, setModalLivroSaidasOpen] = useState(false);
  const [selectedPdfDetalhe, setSelectedPdfDetalhe] = useState<ItemRetiradaGerenciada | null>(null);

  const filteredRetiradas = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return retiradas.filter((r) => {
      if (tabState === "pendentes" && r.status !== "pendente") return false;
      if (tabState === "efetivadas" && r.status !== "efetivada") return false;
      if (tabState === "compensadas" && r.status !== "corrigida_compensada") return false;
      if (!t) return true;

      return (
        r.protocolo.toLowerCase().includes(t) ||
        r.setorDestino.toLowerCase().includes(t) ||
        r.nomeRecebedor.toLowerCase().includes(t) ||
        r.documentoRecebedor.toLowerCase().includes(t)
      );
    });
  }, [retiradas, qSearch, tabState]);

  const kpis = useMemo(
    () => [
      { label: "Fila de Retiradas Ativa", value: `${retiradas.length} processos` },
      { label: "Aguardando Confirmação em Lote", value: `${retiradas.filter((r) => r.status === "pendente").length} pedidos` },
      { label: "Efetivadas com Hash Assinado", value: `${retiradas.filter((r) => r.status === "efetivada").length} entregas` },
      { label: "Eventos Compensatórios de Ajuste", value: `${retiradas.filter((r) => r.status === "corrigida_compensada").length} correções (RN-MOD-27-03)` },
    ],
    [retiradas]
  );

  const handleToggleSelectAll = () => {
    const pendentes = filteredRetiradas.filter((r) => r.status === "pendente").map((r) => r.protocolo);
    if (selectedProtocolos.length === pendentes.length) {
      setSelectedProtocolos([]);
    } else {
      setSelectedProtocolos(pendentes);
    }
  };

  const handleToggleSelectOne = (protocolo: string) => {
    if (selectedProtocolos.includes(protocolo)) {
      setSelectedProtocolos(selectedProtocolos.filter((p) => p !== protocolo));
    } else {
      setSelectedProtocolos([...selectedProtocolos, protocolo]);
    }
  };

  const handleConfirmarLoteExecutar = () => {
    setRetiradas((prev) =>
      prev.map((r) => {
        if (selectedProtocolos.includes(r.protocolo)) {
          return {
            ...r,
            status: "efetivada",
            historicoEventos: [
              ...r.historicoEventos,
              {
                dataHora: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                ator: "Gestor do Galpão",
                evento: "Confirmação em Lote (RN-MOD-27-04)",
                detalhe: "Baixa em lote de estoque com prévia de impacto validada.",
              },
            ],
          };
        }
        return r;
      })
    );
    setSelectedProtocolos([]);
    setModalLotePreviewOpen(false);
  };

  const handleSalvarEventoCompensatorio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompensacao || !justificativaCompensacao.trim()) return;

    setRetiradas((prev) =>
      prev.map((r) => {
        if (r.protocolo === selectedCompensacao.protocolo) {
          return {
            ...r,
            status: "corrigida_compensada",
            versaoDocumento: r.versaoDocumento + 1,
            historicoEventos: [
              ...r.historicoEventos,
              {
                dataHora: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                ator: "Gestor / Auditoria",
                evento: "Lançamento de Evento Compensatório (RN-MOD-27-03)",
                detalhe: `Motivo: ${justificativaCompensacao}`,
              },
            ],
          };
        }
        return r;
      })
    );

    setSelectedCompensacao(null);
    setJustificativaCompensacao("");
  };

  const exportLivroSaidasCsv = () => {
    const headers = ["Protocolo", "DataHora", "SetorDestino", "Recebedor", "Documento", "TotalUnidades", "Status", "VersaoDoc", "HashPDF"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const r of filteredRetiradas) {
      lines.push(
        [
          escape(r.protocolo),
          escape(r.dataHora),
          escape(r.setorDestino),
          escape(r.nomeRecebedor),
          escape(r.documentoRecebedor),
          r.totalUnidades,
          escape(r.status),
          r.versaoDocumento,
          escape(r.hashPdf),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `livro-saidas-galpao-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gerenciamento de Retiradas e PDF (MOD-27)"
        description="Central de auditoria do depósito: confirmação em lote com prévia de impacto, eventos compensatórios para correções e emissão do Livro de Saídas PDF."
        crumbs={[
          { label: "Painel", to: "/adm" },
          { label: "Galpão" },
          { label: "Retiradas", to: "/adm/galpao/retiradas" },
          { label: "Gerenciar & PDF" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={exportLivroSaidasCsv}
              className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar Livro de Saídas (CSV)
            </button>
            <button
              onClick={() => setModalLivroSaidasOpen(true)}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <FileCheck2 className="h-4 w-4" /> Livro de Saídas PDF (Oficial)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* BARRA DE AÇÃO EM LOTE & ABAS DE FILTRO (RF-MOD-27-01 / RF-MOD-27-03) */}
      <section className="glass-card p-4 border border-border/60 space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTabState("todas")}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${
                tabState === "todas" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Todas ({retiradas.length})
            </button>
            <button
              onClick={() => setTabState("pendentes")}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${
                tabState === "pendentes" ? "bg-amber-500 text-slate-950" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Aguardando Confirmação em Lote ({retiradas.filter((r) => r.status === "pendente").length})
            </button>
            <button
              onClick={() => setTabState("efetivadas")}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${
                tabState === "efetivadas" ? "bg-emerald-500 text-slate-950" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Efetivadas ({retiradas.filter((r) => r.status === "efetivada").length})
            </button>
            <button
              onClick={() => setTabState("compensadas")}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${
                tabState === "compensadas" ? "bg-purple-500 text-slate-950" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Eventos Compensatórios ({retiradas.filter((r) => r.status === "corrigida_compensada").length})
            </button>
          </div>

          {/* BOTAO DE AÇÃO EM LOTE (RN-MOD-27-04) */}
          {selectedProtocolos.length > 0 && (
            <button
              onClick={() => setModalLotePreviewOpen(true)}
              className="h-9 px-4 rounded-md bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 animate-pulse"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirmar em Lote ({selectedProtocolos.length} selecionados)
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={qSearch}
            onChange={(e) => setQSearch(e.target.value)}
            placeholder="Buscar por protocolo, setor de destino, nome do recebedor ou CPF..."
            className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
          />
        </div>
      </section>

      {/* TABELA GERENCIAL DE RETIRADAS (RF-MOD-27-01 / RF-MOD-27-07) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={handleToggleSelectAll} title="Selecionar Todos Pendentes">
                    {selectedProtocolos.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th className="p-3">Protocolo / Data</th>
                <th className="p-3">Setor Solicitante & Recebedor</th>
                <th className="p-3">Resumo dos Itens</th>
                <th className="p-3 text-center">Versão Doc (RN-MOD-27-01)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredRetiradas.map((r) => {
                const isSelected = selectedProtocolos.includes(r.protocolo);
                return (
                  <tr key={r.protocolo} className="hover:bg-accent/10 transition-colors">
                    <td className="p-3 text-center">
                      {r.status === "pendente" && (
                        <button onClick={() => handleToggleSelectOne(r.protocolo)}>
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </td>

                    <td className="p-3 font-semibold text-foreground">
                      <div className="font-mono font-bold text-primary">{r.protocolo}</div>
                      <span className="text-[10px] text-muted-foreground">{r.dataHora}</span>
                    </td>

                    <td className="p-3 font-semibold text-foreground">
                      <div>{r.setorDestino}</div>
                      <span className="text-[10px] text-muted-foreground">
                        Recebedor: <b>{r.nomeRecebedor}</b> ({r.documentoRecebedor})
                      </span>
                    </td>

                    <td className="p-3 font-medium text-foreground">
                      <div>{r.itensResumo}</div>
                      <span className="text-[10px] font-mono text-muted-foreground">Total: {r.totalUnidades} unidades</span>
                    </td>

                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono font-bold">
                        v{r.versaoDocumento}
                      </span>
                    </td>

                    <td className="p-3">
                      <StatusGerenciamentoBadge status={r.status} />
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* DETALHE E REIMPRESSÃO AUDITADA (RN-MOD-27-02) */}
                        <button
                          onClick={() => setSelectedPdfDetalhe(r)}
                          title="Visualizar Comprovante / Reimpressão Auditada"
                          className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>

                        {/* EVENTO COMPENSATÓRIO DE CORREÇÃO (RN-MOD-27-03) */}
                        {r.status === "efetivada" && (
                          <button
                            onClick={() => setSelectedCompensacao(r)}
                            title="Lançar Evento Compensatório de Ajuste (RN-MOD-27-03)"
                            className="p-1.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL CONFIRMAÇÃO EM LOTE COM PRÉVIA DE IMPACTO (RN-MOD-27-04) */}
      {modalLotePreviewOpen && (
        <Dialog open={modalLotePreviewOpen} onOpenChange={setModalLotePreviewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" /> Prévia de Impacto — Confirmação em Lote
              </DialogTitle>
              <DialogDescription>
                Validação de impacto nos saldos físicos do galpão antes da gravação transacional.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-1">
                <div><b>Total de Pedidos Selecionados:</b> {selectedProtocolos.length} retiradas</div>
                <div><b>Protocolos:</b> <span className="font-mono text-emerald-300">{selectedProtocolos.join(", ")}</span></div>
              </div>

              <div className="p-3 bg-background border border-border rounded-lg space-y-1">
                <div className="font-bold text-foreground">Impacto Esperado no Estoque:</div>
                <div className="text-muted-foreground">• Baixa imediata de 6x Monitores LCD Dell</div>
                <div className="text-muted-foreground">• Baixa imediata de 1x Caixa de Cabo Cat6</div>
                <div className="text-emerald-400 font-bold mt-1">✓ Todos os saldos físicos são suficientes.</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setModalLotePreviewOpen(false)}
                  className="px-4 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarLoteExecutar}
                  className="px-4 py-1.5 rounded-md bg-emerald-500 text-slate-950 font-bold hover:opacity-90"
                >
                  Efetivar Lote Agora
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL EVENTO COMPENSATÓRIO (RN-MOD-27-03) */}
      {selectedCompensacao && (
        <Dialog open={!!selectedCompensacao} onOpenChange={() => setSelectedCompensacao(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-purple-400">
                <RotateCcw className="h-5 w-5" /> Lançar Evento Compensatório #{selectedCompensacao.protocolo}
              </DialogTitle>
              <DialogDescription>
                Correção de evento de retirada já efetivado sem alterar a história original.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSalvarEventoCompensatorio} className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-muted/40 border border-border rounded-lg space-y-1">
                <div><b>Protocolo Original:</b> {selectedCompensacao.protocolo}</div>
                <div><b>Versão Atual do Documento:</b> v{selectedCompensacao.versaoDocumento}</div>
                <div><b>Setor:</b> {selectedCompensacao.setorDestino}</div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Justificativa da Correção (Obrigatória)</label>
                <textarea
                  value={justificativaCompensacao}
                  onChange={(e) => setJustificativaCompensacao(e.target.value)}
                  placeholder="Informe a divergência observada na entrega ou motivo do ajuste..."
                  required
                  rows={3}
                  className="w-full p-2.5 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCompensacao(null)}
                  className="px-4 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-purple-500 text-slate-950 font-bold hover:opacity-90"
                >
                  Gravar Evento Compensatório (v{selectedCompensacao.versaoDocumento + 1})
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL LIVRO DE SAÍDAS PDF / DETALHE AUDITADO (RF-MOD-27-04 / RF-MOD-27-05) */}
      {(modalLivroSaidasOpen || selectedPdfDetalhe) && (
        <Dialog
          open={modalLivroSaidasOpen || !!selectedPdfDetalhe}
          onOpenChange={() => {
            setModalLivroSaidasOpen(false);
            setSelectedPdfDetalhe(null);
          }}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileCheck className="h-5 w-5" /> Livro de Saídas do Depósito / Documento Oficial
              </DialogTitle>
              <DialogDescription>
                Registro de movimentação patrimonial e trilha de auditoria digital.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-4 bg-background border border-border rounded-lg space-y-2">
                <div className="flex justify-between border-b border-border pb-2">
                  <span><b>Documento:</b> Livro Oficial de Saídas — Galpão Central</span>
                  <span><b>Data de Emissão:</b> {new Date().toLocaleDateString("pt-BR")}</span>
                </div>

                {selectedPdfDetalhe ? (
                  <>
                    <div><b>Protocolo Específico:</b> <span className="font-mono text-primary font-bold">{selectedPdfDetalhe.protocolo}</span> (v{selectedPdfDetalhe.versaoDocumento})</div>
                    <div><b>Destino:</b> {selectedPdfDetalhe.setorDestino}</div>
                    <div><b>Recebedor:</b> {selectedPdfDetalhe.nomeRecebedor} ({selectedPdfDetalhe.documentoRecebedor})</div>
                    <div><b>Hash do PDF:</b> <span className="font-mono text-[10px] text-muted-foreground">{selectedPdfDetalhe.hashPdf}</span></div>
                  </>
                ) : (
                  <>
                    <div><b>Total de Retiradas Auditadas:</b> {retiradas.length} requisições</div>
                    <div><b>Hash Consolidado do Período:</b> <span className="font-mono text-[10px] text-muted-foreground">f8e7d6c5b4a39281706152433425162738495061728394051627384950617283</span></div>
                  </>
                )}
              </div>

              {/* TRILHA DE AUDITORIA (RF-MOD-27-08) */}
              <div className="space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1">
                  <History className="h-4 w-4 text-primary" /> Trilha de Auditoria Imutável (RN-MOD-27-02)
                </div>
                <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2 max-h-36 overflow-y-auto">
                  {(selectedPdfDetalhe ? selectedPdfDetalhe.historicoEventos : retiradas[0].historicoEventos).map((h, idx) => (
                    <div key={idx} className="border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>{h.evento}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{h.dataHora}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{h.detalhe} (Ator: {h.ator})</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded border border-input bg-background font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
                >
                  <Printer className="h-4 w-4" /> Reimpressão Auditada (RN-MOD-27-02)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalLivroSaidasOpen(false);
                    setSelectedPdfDetalhe(null);
                  }}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Fechar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusGerenciamentoBadge({ status }: { status: StatusGerenciamento }) {
  const map: Record<StatusGerenciamento, { label: string; cls: string }> = {
    pendente: { label: "🟡 Aguardando Confirmação em Lote", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold" },
    efetivada: { label: "🟢 Efetivada (Hash Assinado)", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold" },
    corrigida_compensada: { label: "🟣 Evento Compensatório", cls: "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold" },
    cancelada: { label: "🔴 Cancelada", cls: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold" },
  };
  const item = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
