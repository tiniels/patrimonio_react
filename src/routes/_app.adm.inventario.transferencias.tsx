import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  ShieldAlert,
  FileCheck,
  Edit,
  ArrowRight,
  Eye,
  Wrench,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/inventario/transferencias")({
  head: () => ({
    meta: [
      { title: "Gestão Administrativa de Transferências (MOD-16) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Supervisão do pipeline de transferências, aprovação extraordinária auditada, retificação e conciliação documental.",
      },
    ],
  }),
  component: AdmTransferenciasPage,
});

export type StatusAdmTransferencia = "aguardando_aceite" | "efetivada" | "rejeitada" | "cancelada";

export interface ItemAdmTransferencia {
  id: string;
  protocolo: string;
  dataSolicitacao: string;
  setorOrigem: string;
  responsavelOrigem: string;
  setorDestino: string;
  responsavelDestino: string;
  chapas: string[];
  descricoesBens: string;
  justificativa: string;
  status: StatusAdmTransferencia;
  intervencaoAdm?: boolean; // RN-MOD-16-01
  motivoIntervencao?: string;
}

const INITIAL_ADM_TRANSFERENCIAS: ItemAdmTransferencia[] = [
  {
    id: "ADM-TRF-001",
    protocolo: "TRF-2026-001",
    dataSolicitacao: "2026-07-28 09:30",
    setorOrigem: "Departamento de Contabilidade e Patrimônio",
    responsavelOrigem: "Neemias Oliveira",
    setorDestino: "Galpão Central de Manutenção",
    responsavelDestino: "João Roberto Mendes",
    chapas: ["100452", "100453"],
    descricoesBens: "MESA EM L + CADEIRA ERGONÔMICA",
    justificativa: "Readequação de mobiliário administrativo para nova equipe de campo.",
    status: "aguardando_aceite",
  },
  {
    id: "ADM-TRF-002",
    protocolo: "TRF-2026-002",
    dataSolicitacao: "2026-07-20 14:00",
    setorOrigem: "Departamento de Contabilidade e Patrimônio",
    responsavelOrigem: "Neemias Oliveira",
    setorDestino: "USA Fazendinha",
    responsavelDestino: "Dra. Patricia Lima",
    chapas: ["ESP-9901"],
    descricoesBens: "NOTEBOOK DELL LATITUDE 5540 CORE I7",
    justificativa: "Empréstimo temporário homologado para treinamento do sistema.",
    status: "efetivada",
  },
  {
    id: "ADM-TRF-003",
    protocolo: "TRF-2026-089",
    dataSolicitacao: "2026-07-22 11:00",
    setorOrigem: "Secretaria de Educação — Almoxarifado",
    responsavelOrigem: "Marcos Antonio da Silva",
    setorDestino: "USA Fazendinha",
    responsavelDestino: "Dra. Patricia Lima",
    chapas: ["ESP-8812"],
    descricoesBens: "PROJETOR MULTIMÍDIA EPSON 4000 LUMENS",
    justificativa: "Transferência definitiva para uso no auditório.",
    status: "aguardando_aceite",
  },
];

function AdmTransferenciasPage() {
  const [pipeline, setPipeline] = useState<ItemAdmTransferencia[]>(INITIAL_ADM_TRANSFERENCIAS);
  const [qSearch, setQSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modais
  const [intervencaoItem, setIntervencaoItem] = useState<ItemAdmTransferencia | null>(null);
  const [justificativaIntervencao, setJustificativaIntervencao] = useState("");
  const [editItem, setEditItem] = useState<ItemAdmTransferencia | null>(null);
  const [novoSetorDestino, setNovoSetorDestino] = useState("");

  const filteredPipeline = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return pipeline.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (!t) return true;

      return (
        item.protocolo.toLowerCase().includes(t) ||
        item.setorOrigem.toLowerCase().includes(t) ||
        item.setorDestino.toLowerCase().includes(t) ||
        item.responsavelOrigem.toLowerCase().includes(t) ||
        item.chapas.some((c) => c.toLowerCase().includes(t))
      );
    });
  }, [pipeline, qSearch, statusFilter]);

  const kpis = useMemo(
    () => [
      { label: "Transferências Confirmadas / Efetivadas", value: String(pipeline.filter((p) => p.status === "efetivada").length) },
      { label: "Aguardando Aceite no Pipeline", value: String(pipeline.filter((p) => p.status === "aguardando_aceite").length) },
      { label: "Intervenções da Administração", value: String(pipeline.filter((p) => p.intervencaoAdm).length) },
      { label: "Total de Solicitações", value: String(pipeline.length) },
    ],
    [pipeline]
  );

  // Aprovação Extraordinária Administrativa (RF-MOD-16-03 & RN-MOD-16-01)
  const handleConfirmIntervencao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intervencaoItem || !justificativaIntervencao.trim()) return;

    setPipeline((prev) =>
      prev.map((p) =>
        p.id === intervencaoItem.id
          ? {
              ...p,
              status: "efetivada",
              intervencaoAdm: true,
              motivoIntervencao: justificativaIntervencao.trim(),
            }
          : p
      )
    );

    alert(
      `Aprovação extraordinária realizada pela Administração no protocolo ${intervencaoItem.protocolo}! Evento gravado no log imutável de auditoria.`
    );
    setIntervencaoItem(null);
    setJustificativaIntervencao("");
  };

  // Retificação Controlada (RF-MOD-16-04 & RN-MOD-16-02)
  const handleConfirmRetificacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !novoSetorDestino.trim()) return;

    setPipeline((prev) =>
      prev.map((p) =>
        p.id === editItem.id ? { ...p, setorDestino: novoSetorDestino.trim() } : p
      )
    );

    alert(`Setor de destino do protocolo ${editItem.protocolo} retificado com sucesso para '${novoSetorDestino}'!`);
    setEditItem(null);
    setNovoSetorDestino("");
  };

  const handleCancelAdm = (item: ItemAdmTransferencia) => {
    if (!confirm(`Deseja cancelar administrativamente a transferência ${item.protocolo}?`)) return;
    setPipeline((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: "cancelada" } : p))
    );
  };

  const exportPipelineCsv = () => {
    const headers = ["Protocolo", "Data", "Origem", "Destino", "Bens", "Status", "IntervencaoAdm"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const p of pipeline) {
      lines.push(
        [
          escape(p.protocolo),
          escape(p.dataSolicitacao),
          escape(p.setorOrigem),
          escape(p.setorDestino),
          escape(p.chapas.join(";")),
          escape(p.status),
          p.intervencaoAdm ? "Sim" : "Nao",
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pipeline-transferencias-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão Administrativa de Transferências (MOD-16)"
        description="Painel executivo do pipeline de movimentações patrimoniais, aprovação extraordinária auditada, retificação e conciliação de termos."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Inventário" }, { label: "Gestão de Transferências" }]}
        actions={
          <button
            onClick={exportPipelineCsv}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4" /> Exportar Pipeline (CSV)
          </button>
        }
      />

      <KPIGrid items={kpis} />

      {/* FILTROS E PESQUISA */}
      <section className="glass-card p-4 border border-border/60">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-3 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Buscar por protocolo, setor de origem, destino ou chapa..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
          >
            <option value="">Todos os Status</option>
            <option value="aguardando_aceite">Aguardando Aceite</option>
            <option value="efetivada">Efetivadas / Concluídas</option>
            <option value="rejeitada">Rejeitadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
      </section>

      {/* TABELA DO PIPELINE ADMINISTRATIVO */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Protocolo</th>
                <th className="p-3">Data / Origem</th>
                <th className="p-3">Destino Planejado</th>
                <th className="p-3">Bens Envolvidos</th>
                <th className="p-3">Status do Pipeline</th>
                <th className="p-3 text-right">Ações Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredPipeline.map((item) => (
                <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">
                    <div>{item.protocolo}</div>
                    {item.intervencaoAdm && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-warning font-sans font-bold bg-warning/15 px-1.5 py-0.2 rounded border border-warning/30 mt-0.5">
                        <ShieldAlert className="h-3 w-3" /> Aprovação Adm
                      </span>
                    )}
                  </td>

                  <td className="p-3 font-medium text-foreground">
                    <div>{item.setorOrigem}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.dataSolicitacao}</span>
                  </td>

                  <td className="p-3 font-semibold text-foreground">
                    <div>{item.setorDestino}</div>
                    <span className="text-[11px] text-muted-foreground font-normal">{item.responsavelDestino}</span>
                  </td>

                  <td className="p-3 font-medium text-foreground">
                    <div>{item.descricoesBens}</div>
                    <span className="text-[11px] text-primary font-mono font-bold">Chapas: {item.chapas.join(", ")}</span>
                  </td>

                  <td className="p-3">
                    <StatusAdmBadge status={item.status} />
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === "aguardando_aceite" && (
                        <>
                          <button
                            onClick={() => setIntervencaoItem(item)}
                            title="Aprovação Extraordinária pela Administração (RN-MOD-16-01)"
                            className="px-2 py-1 rounded bg-warning/20 text-warning hover:bg-warning/30 transition-colors text-[11px] font-bold inline-flex items-center gap-1 border border-warning/30"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" /> Aprovação Adm
                          </button>

                          <button
                            onClick={() => {
                              setEditItem(item);
                              setNovoSetorDestino(item.setorDestino);
                            }}
                            title="Retificar dados de destino"
                            className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleCancelAdm(item)}
                            title="Cancelar transferência"
                            className="p-1.5 rounded bg-destructive/15 text-destructive hover:bg-destructive/30 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}

                      {item.status === "efetivada" && (
                        <button
                          onClick={() => alert(`Termo oficial de efetivação da transferência ${item.protocolo} baixado.`)}
                          className="px-2 py-1 rounded bg-success/15 text-success hover:bg-success/30 transition-colors text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <FileCheck className="h-3.5 w-3.5" /> Termo Efetivado
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPipeline.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhuma solicitação de transferência encontrada no pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL APROVAÇÃO EXTRAORDINÁRIA PELA ADM (RF-MOD-16-03 / RN-MOD-16-01) */}
      {intervencaoItem && (
        <Dialog open={!!intervencaoItem} onOpenChange={() => setIntervencaoItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-warning">
                <ShieldAlert className="h-5 w-5" /> Aprovação Extraordinária pela Administração (RN-MOD-16-01)
              </DialogTitle>
              <DialogDescription>
                Aprovação direta sem aguardar aceite do setor de destino. Requer justificativa de auditoria.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmIntervencao} className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-warning/10 border border-warning/30 text-warning-foreground rounded-lg">
                <div className="font-bold">Protocolo: {intervencaoItem.protocolo}</div>
                <div>Destino Planejado: {intervencaoItem.setorDestino}</div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Justificativa da Intervenção Administrativa *</label>
                <textarea
                  required
                  rows={3}
                  value={justificativaIntervencao}
                  onChange={(e) => setJustificativaIntervencao(e.target.value)}
                  placeholder="Ex: Responsável de destino em licença médica prolongada / ordem superior de remanejamento emergencial..."
                  className="p-2.5 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setIntervencaoItem(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-warning text-warning-foreground font-bold hover:opacity-90"
                >
                  Confirmar Aprovação Extraordinária
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL RETIFICAÇÃO CONTROLADA (RF-MOD-16-04 / RN-MOD-16-02) */}
      {editItem && (
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Wrench className="h-5 w-5" /> Retificação Controlada de Destino (RN-MOD-16-02)
              </DialogTitle>
              <DialogDescription>
                Corrija o setor de destino antes da efetivação com registro do histórico.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmRetificacao} className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-muted/30 border border-border rounded-lg">
                <div className="font-bold">Protocolo: {editItem.protocolo}</div>
                <div>Destino Atual: {editItem.setorDestino}</div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Novo Setor de Destino *</label>
                <input
                  required
                  value={novoSetorDestino}
                  onChange={(e) => setNovoSetorDestino(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Salvar Retificação
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusAdmBadge({ status }: { status: StatusAdmTransferencia }) {
  const map: Record<StatusAdmTransferencia, { label: string; cls: string }> = {
    aguardando_aceite: { label: "⏳ Aguardando Aceite", cls: "bg-warning/20 text-warning border-warning/40 font-bold" },
    efetivada: { label: "🟢 Efetivada", cls: "bg-success/20 text-success border-success/40 font-bold" },
    rejeitada: { label: "🔴 Rejeitada", cls: "bg-destructive/20 text-destructive border-destructive/40 font-bold" },
    cancelada: { label: "⚪ Cancelada", cls: "bg-muted text-muted-foreground border-border" },
  };
  const item = map[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
