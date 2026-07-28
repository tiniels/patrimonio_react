import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Printer,
  QrCode,
  Barcode,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Tag,
  Building,
  Filter,
  FileText,
  ShieldCheck,
  Check,
  Clock,
  Eye,
  Plus,
  RefreshCw,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { usePatrimonioData } from "@/hooks/usePatrimonioData";

export const Route = createFileRoute("/_app/adm/etiqueta")({
  head: () => ({
    meta: [
      { title: "Etiquetas Patrimoniais (MOD-10) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Solicitação, geração, pré-visualização, impressões térmicas, reimpressão auditada e controle de aplicação física de etiquetas.",
      },
    ],
  }),
  component: AdmEtiquetasPage,
});

export type ModeloEtiqueta = "padrao" | "especial" | "dupla";
export type StatusEtiqueta = "aguardando" | "impressa" | "aplicada" | "reimpressa";

export interface ItemEtiqueta {
  id: string;
  chapa: string;
  descricao: string;
  local: string;
  modelo: ModeloEtiqueta;
  status: StatusEtiqueta;
  dataSolicitacao: string;
  dataAplicacao?: string;
  motivoReimpressao?: string;
  historicoAuditoria?: { data: string; motivo: string; operador: string }[];
}

const DUMMY_QUEUE: ItemEtiqueta[] = [
  {
    id: "ETQ-001",
    chapa: "100452",
    descricao: "MESA PARA ESCRITÓRIO EM L COM GAVETEIRO",
    local: "Departamento de Contabilidade e Patrimônio",
    modelo: "padrao",
    status: "aguardando",
    dataSolicitacao: "2026-07-28 14:00",
  },
  {
    id: "ETQ-002",
    chapa: "100453",
    descricao: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA",
    local: "Departamento de Contabilidade e Patrimônio",
    modelo: "padrao",
    status: "aguardando",
    dataSolicitacao: "2026-07-28 14:00",
  },
  {
    id: "ETQ-003",
    chapa: "ESP-9901",
    descricao: "NOTEBOOK DELL LATITUDE 5540 CORE I7 16GB",
    local: "Secretaria de Finanças e Patrimônio",
    modelo: "especial",
    status: "impressa",
    dataSolicitacao: "2026-07-28 10:15",
  },
  {
    id: "ETQ-004",
    chapa: "100120",
    descricao: "AR CONDICIONADO SPLIT 18000 BTU INVERTER",
    local: "EMEF Aldeia de Barueri",
    modelo: "dupla",
    status: "aplicada",
    dataSolicitacao: "2026-07-27 16:30",
    dataAplicacao: "2026-07-28 09:00",
  },
];

function AdmEtiquetasPage() {
  const patrimonioState = usePatrimonioData();

  const [queue, setQueue] = useState<ItemEtiqueta[]>(DUMMY_QUEUE);
  const [selectedModelo, setSelectedModelo] = useState<ModeloEtiqueta>("padrao");
  const [mode, setMode] = useState<"setor" | "faixa" | "manual">("setor");

  // Filtros de seleção
  const [selectedSetor, setSelectedSetor] = useState("");
  const [faixaInicio, setFaixaInicio] = useState("");
  const [faixaFim, setFaixaFim] = useState("");
  const [chapasTexto, setChapasTexto] = useState("");

  // Modais
  const [reimpressaoItem, setReimpressaoItem] = useState<ItemEtiqueta | null>(null);
  const [motivoReimpressao, setMotivoReimpressao] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Lista de locais dinâmicos
  const locaisList = useMemo(() => {
    if (!patrimonioState.rows) return ["Departamento de Contabilidade e Patrimônio", "Secretaria de Educação", "Secretaria de Saúde"];
    const s = new Set<string>();
    for (const r of patrimonioState.rows) {
      if (r.local) s.add(r.local.trim());
    }
    return [...s].sort().slice(0, 100);
  }, [patrimonioState.rows]);

  const kpis = useMemo(
    () => [
      { label: "Etiquetas na Fila", value: String(queue.length) },
      { label: "Aguardando Impressão", value: String(queue.filter((q) => q.status === "aguardando").length) },
      { label: "Pendentes de Aplicação Física", value: String(queue.filter((q) => q.status === "impressa").length) },
      { label: "Aplicadas no Bem", value: String(queue.filter((q) => q.status === "aplicada").length) },
    ],
    [queue]
  );

  const handleGerarLote = (e: React.FormEvent) => {
    e.preventDefault();

    let novos: ItemEtiqueta[] = [];

    if (mode === "setor" && selectedSetor && patrimonioState.rows) {
      const doSetor = patrimonioState.rows.filter((r) => r.local === selectedSetor).slice(0, 30);
      novos = doSetor.map((r, idx) => ({
        id: `ETQ-GEN-${Date.now()}-${idx}`,
        chapa: r.chapa,
        descricao: r.descricao || "PATRIMÔNIO DA PREFEITURA",
        local: r.local || selectedSetor,
        modelo: selectedModelo,
        status: "aguardando",
        dataSolicitacao: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      }));
    } else if (mode === "faixa" && faixaInicio && faixaFim) {
      const ini = parseInt(faixaInicio.replace(/\D/g, ""), 10) || 10000;
      const fim = parseInt(faixaFim.replace(/\D/g, ""), 10) || ini + 5;
      const total = Math.min(50, Math.max(1, fim - ini + 1));

      for (let i = 0; i < total; i++) {
        const num = String(ini + i);
        novos.push({
          id: `ETQ-FX-${Date.now()}-${i}`,
          chapa: num,
          descricao: `PATRIMÔNIO MUNICIPAL #${num}`,
          local: selectedSetor || "Secretaria de Finanças e Patrimônio",
          modelo: selectedModelo,
          status: "aguardando",
          dataSolicitacao: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        });
      }
    } else if (mode === "manual" && chapasTexto) {
      const arr = chapasTexto.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
      novos = arr.map((c, idx) => ({
        id: `ETQ-MAN-${Date.now()}-${idx}`,
        chapa: c,
        descricao: `PATRIMÔNIO # ${c}`,
        local: "Cadastro Manual / Solicitado",
        modelo: selectedModelo,
        status: "aguardando",
        dataSolicitacao: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      }));
    }

    if (novos.length === 0) {
      alert("Nenhum patrimônio selecionado para gerar o lote de etiquetas.");
      return;
    }

    setQueue((prev) => [...novos, ...prev]);
    alert(`${novos.length} etiquetas geradas e adicionadas à Fila de Impressão com sucesso!`);
  };

  const markImpresso = () => {
    setQueue((prev) =>
      prev.map((q) => (q.status === "aguardando" ? { ...q, status: "impressa" } : q))
    );
    window.print();
  };

  const markAplicado = (id: string) => {
    const dataHora = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "aplicada", dataAplicacao: dataHora } : q))
    );
  };

  const handleConfirmReimpressao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reimpressaoItem || !motivoReimpressao.trim()) return;

    const dataHora = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setQueue((prev) =>
      prev.map((q) => {
        if (q.id === reimpressaoItem.id) {
          const hist = q.historicoAuditoria || [];
          return {
            ...q,
            status: "aguardando",
            motivoReimpressao: motivoReimpressao.trim(),
            historicoAuditoria: [
              ...hist,
              { data: dataHora, motivo: motivoReimpressao.trim(), operador: "Neemias (Admin)" },
            ],
          };
        }
        return q;
      })
    );

    setReimpressaoItem(null);
    setMotivoReimpressao("");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestor de Etiquetas Patrimoniais (MOD-10)"
        description="Solicitação por setor/faixa, modelos de etiquetas 50x30mm, pré-visualização A4, reimpressão auditada e controle de aplicação física."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Inventário" }, { label: "Etiquetas Patrimoniais" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowReportModal(true)}
              className="h-9 px-3 rounded-md border border-input text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-accent/40 transition-colors"
            >
              <FileText className="h-4 w-4 text-primary" /> Relatórios de Emissão
            </button>

            <button
              onClick={() => setShowPreviewModal(true)}
              className="h-9 px-3 rounded-md border border-primary/40 bg-primary/10 text-primary text-xs font-bold inline-flex items-center gap-1.5 hover:bg-primary/20 transition-all"
            >
              <Eye className="h-4 w-4" /> Pré-Visualizar Folha A4
            </button>

            <button
              onClick={markImpresso}
              disabled={queue.length === 0}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Printer className="h-4 w-4" /> Imprimir Fila ({queue.filter((q) => q.status === "aguardando").length})
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* PAINEL DE SOLICITAÇÃO & SELEÇÃO DE MODELO (RF-MOD-10-01 & RF-MOD-10-02) */}
      <section className="glass-card p-5 border border-border/60">
        <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
          <Tag className="h-5 w-5 text-primary" /> Seleção de Bens & Modelo de Etiqueta
        </h2>

        <form onSubmit={handleGerarLote} className="flex flex-col gap-4 text-xs">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Opção de Modo */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-foreground">Modo de Seleção *</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setMode("setor")}
                  className={`py-1.5 rounded font-semibold transition-all ${mode === "setor" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Por Setor
                </button>
                <button
                  type="button"
                  onClick={() => setMode("faixa")}
                  className={`py-1.5 rounded font-semibold transition-all ${mode === "faixa" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Por Faixa
                </button>
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={`py-1.5 rounded font-semibold transition-all ${mode === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Chapas
                </button>
              </div>
            </div>

            {/* Modelo de Etiqueta (RF-MOD-10-02) */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-foreground">Modelo Visual da Etiqueta *</label>
              <select
                value={selectedModelo}
                onChange={(e) => setSelectedModelo(e.target.value as ModeloEtiqueta)}
                className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
              >
                <option value="padrao">Padrão Oficial (50x30mm) com QR Code + Code 128</option>
                <option value="especial">Alfanumérico Especial (Destaque Tombamento)</option>
                <option value="dupla">Etiqueta Dupla / Bipartida (Principal + Cabo)</option>
              </select>
            </div>

            {/* Ação de Gerar */}
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                className="h-10 px-4 rounded-md bg-accent text-accent-foreground font-bold text-xs inline-flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              >
                <Plus className="h-4 w-4" /> Adicionar à Fila de Impressão
              </button>
            </div>
          </div>

          {/* CAMPOS ESPECÍFICOS POR MODO */}
          {mode === "setor" && (
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">Selecione a Unidade / Setor *</label>
              <select
                value={selectedSetor}
                onChange={(e) => setSelectedSetor(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs"
              >
                <option value="">Selecione um setor para gerar em lote...</option>
                {locaisList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "faixa" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Chapa Inicial *</label>
                <input
                  required
                  value={faixaInicio}
                  onChange={(e) => setFaixaInicio(e.target.value)}
                  placeholder="Ex: 10001"
                  className="h-10 px-3 rounded-md border border-input bg-background/60 font-mono text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Chapa Final *</label>
                <input
                  required
                  value={faixaFim}
                  onChange={(e) => setFaixaFim(e.target.value)}
                  placeholder="Ex: 10025"
                  className="h-10 px-3 rounded-md border border-input bg-background/60 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {mode === "manual" && (
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">Digite as Chapas (Separadas por vírgula ou linha) *</label>
              <textarea
                rows={2}
                value={chapasTexto}
                onChange={(e) => setChapasTexto(e.target.value)}
                placeholder="Ex: 100452, 100453, ESP-9901"
                className="p-2.5 rounded-md border border-input bg-background/60 font-mono text-xs"
              />
            </div>
          )}
        </form>
      </section>

      {/* PREVIEW EM TEMPO REAL DE 1 ETIQUETA HOMOLOGADA (RN-MOD-10-05) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-bold text-foreground text-xs uppercase tracking-wide flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> Pré-Visualização da Etiqueta Homologada (50x30mm)
          </span>
          <span className="text-[11px] text-muted-foreground">Formato ZPL/EPL & Impressão A4</span>
        </div>

        <div className="flex justify-center p-6 bg-muted/30 border border-border/40 rounded-xl">
          <EtiquetaPreviewCard
            chapa="100452"
            descricao="MESA PARA ESCRITÓRIO EM L COM GAVETEIRO"
            local="Departamento de Contabilidade e Patrimônio"
            modelo={selectedModelo}
          />
        </div>
      </section>

      {/* FILA DE IMPRESSÃO & HISTÓRICO DE APLICAÇÃO FÍSICA (RF-MOD-10-06 a RF-MOD-10-08) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="p-3.5 px-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <span className="font-bold text-sm text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Fila de Impressão & Registro de Aplicação Física ({queue.length})
          </span>

          <span className="text-xs text-muted-foreground">
            Ações de Reimpressão são imutavelmente auditadas (RN-MOD-10-02)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">ID Solicitação</th>
                <th className="p-3">Chapa Patrimonial</th>
                <th className="p-3">Descrição do Bem</th>
                <th className="p-3">Localização</th>
                <th className="p-3">Modelo</th>
                <th className="p-3">Status Fila</th>
                <th className="p-3 text-center">Aplicação Física</th>
                <th className="p-3 text-right">Ação / Reimpressão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {queue.map((item) => (
                <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono text-muted-foreground">{item.id}</td>
                  <td className="p-3 font-mono font-bold text-primary">{item.chapa}</td>
                  <td className="p-3 font-medium text-foreground max-w-xs truncate">{item.descricao}</td>
                  <td className="p-3 text-muted-foreground truncate max-w-xs">{item.local}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-muted text-[10px] uppercase font-mono font-bold">
                      {item.modelo}
                    </span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-3 text-center">
                    {item.status === "aplicada" ? (
                      <span className="text-success font-bold text-[11px] inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aplicada ({item.dataAplicacao?.slice(0, 10)})
                      </span>
                    ) : (
                      <button
                        onClick={() => markAplicado(item.id)}
                        className="px-2.5 py-1 rounded bg-success/20 text-success border border-success/40 hover:bg-success/30 text-[11px] font-bold transition-all"
                      >
                        Confirmar Aplicação
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setReimpressaoItem(item)}
                      className="px-2.5 py-1 rounded bg-muted hover:bg-warning/20 hover:text-warning text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" /> Reimprimir
                    </button>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Fila de impressão vazia. Selecione um setor ou faixa para gerar etiquetas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL REIMPRESSÃO AUDITADA (RF-MOD-10-07 / RN-MOD-10-02) */}
      {reimpressaoItem && (
        <Dialog open={!!reimpressaoItem} onOpenChange={() => setReimpressaoItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-warning">
                <RotateCcw className="h-5 w-5" /> Reimpressão Auditada de Etiqueta (RN-MOD-10-02)
              </DialogTitle>
              <DialogDescription>
                A reimpressão exige justificativa técnica válida para registro permanente na trilha de auditoria.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmReimpressao} className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-muted/30 border border-border rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-bold text-foreground text-sm">Chapa: {reimpressaoItem.chapa}</div>
                  <div className="text-muted-foreground">{reimpressaoItem.descricao}</div>
                </div>
                <span className="font-mono text-primary font-bold">{reimpressaoItem.id}</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Motivo / Justificativa da Reimpressão *</label>
                <select
                  required
                  value={motivoReimpressao}
                  onChange={(e) => setMotivoReimpressao(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
                >
                  <option value="">Selecione a justificativa oficial...</option>
                  <option value="Etiqueta Danificada / Rasgada">Etiqueta Danificada / Rasgada</option>
                  <option value="Desgaste por Ação do Tempo">Desgaste por Ação do Tempo</option>
                  <option value="Substituição por Tombamento Alfanumérico">Substituição por Tombamento Alfanumérico</option>
                  <option value="Perda Física durante Transferência">Perda Física durante Transferência</option>
                </select>
              </div>

              {reimpressaoItem.historicoAuditoria && reimpressaoItem.historicoAuditoria.length > 0 && (
                <div className="p-2.5 rounded bg-warning/10 border border-warning/30 text-[11px]">
                  <span className="font-bold text-warning">Histórico Prévio de Reimpressões:</span>
                  {reimpressaoItem.historicoAuditoria.map((h, i) => (
                    <div key={i} className="text-muted-foreground mt-0.5">
                      • {h.data} — {h.motivo} ({h.operador})
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setReimpressaoItem(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-warning text-warning-foreground font-bold hover:opacity-90"
                >
                  Confirmar & Adicionar à Fila
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL PRÉ-VISUALIZAÇÃO A4 (RF-MOD-10-04) */}
      {showPreviewModal && (
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-3">
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-primary" /> Pré-Visualização de Folha A4 (Pimaco 6281)
                </DialogTitle>
                <button
                  onClick={markImpresso}
                  className="h-8 px-3 rounded bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" /> Enviar para Impressora
                </button>
              </div>
              <DialogDescription>
                Layout de 10 etiquetas por folha A4 com margens homologadas.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 p-6 bg-white rounded-xl shadow-inner my-2">
              {queue.slice(0, 10).map((it) => (
                <div key={it.id} className="p-2 border border-dashed border-gray-400 bg-white rounded flex justify-center">
                  <EtiquetaPreviewCard
                    chapa={it.chapa}
                    descricao={it.descricao}
                    local={it.local}
                    modelo={it.modelo}
                  />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL RELATÓRIOS (REL-MOD-10-01 a REL-MOD-10-03) */}
      {showReportModal && (
        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Relatórios de Emissão de Etiquetas
              </DialogTitle>
              <DialogDescription>
                Relatórios de lotes gerados, pendentes de aplicação e auditoria.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <button
                onClick={() => alert(`REL-MOD-10-01: ${queue.length} etiquetas geradas na fila.`)}
                className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-accent/15 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-foreground">REL-MOD-10-01 — Lotes Gerados</div>
                  <div className="text-muted-foreground text-[11px]">Resumo de emissões e loteamentos por data.</div>
                </div>
                <Printer className="h-4 w-4 text-primary shrink-0" />
              </button>

              <button
                onClick={() => {
                  const pend = queue.filter((q) => q.status === "impressa");
                  alert(`REL-MOD-10-02: ${pend.length} etiquetas pendentes de aplicação física.`);
                }}
                className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-accent/15 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-foreground">REL-MOD-10-02 — Etiquetas Pendentes de Aplicação</div>
                  <div className="text-muted-foreground text-[11px]">Identifica etiquetas impressas que ainda não foram coladas no bem.</div>
                </div>
                <Tag className="h-4 w-4 text-primary shrink-0" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ---------- COMPONENTE VISUAL DA ETIQUETA HOMOLOGADA 50X30MM ----------

function EtiquetaPreviewCard({
  chapa,
  descricao,
  local,
  modelo,
}: {
  chapa: string;
  descricao: string;
  local: string;
  modelo: ModeloEtiqueta;
}) {
  return (
    <div className="w-[320px] h-[180px] bg-white text-slate-950 p-2.5 rounded-lg border-2 border-slate-800 shadow-md flex flex-col justify-between select-none relative overflow-hidden">
      {/* CABEÇALHO COM BRASÃO E PREFEITURA */}
      <div className="flex items-center justify-between border-b border-slate-400 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold">
            SP
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[9px] leading-tight uppercase tracking-tight text-slate-900">
              Prefeitura de Santana de Parnaíba
            </span>
            <span className="text-[7px] text-slate-600 font-semibold uppercase">Patrimônio Público Municipal</span>
          </div>
        </div>

        {modelo === "especial" && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-mono font-bold text-[8px] uppercase">
            ESPECIAL
          </span>
        )}
      </div>

      {/* CORPO DA ETIQUETA: DADOS DO BEM */}
      <div className="flex items-center justify-between gap-2 my-1">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="font-mono font-black text-xl tracking-tight text-slate-900 leading-none">
            {chapa}
          </span>
          <span className="text-[8px] font-bold text-slate-800 line-clamp-2 uppercase leading-tight mt-0.5">
            {descricao}
          </span>
          <span className="text-[7px] text-slate-600 truncate">{local}</span>
        </div>

        {/* QR CODE SINTÉTICO SVG */}
        <div className="p-1 bg-white border border-slate-300 rounded shrink-0">
          <svg width="46" height="46" viewBox="0 0 100 100">
            <rect x="5" y="5" width="28" height="28" fill="#0f172a" />
            <rect x="9" y="9" width="20" height="20" fill="#ffffff" />
            <rect x="13" y="13" width="12" height="12" fill="#0f172a" />

            <rect x="67" y="5" width="28" height="28" fill="#0f172a" />
            <rect x="71" y="9" width="20" height="20" fill="#ffffff" />
            <rect x="75" y="13" width="12" height="12" fill="#0f172a" />

            <rect x="5" y="67" width="28" height="28" fill="#0f172a" />
            <rect x="9" y="71" width="20" height="20" fill="#ffffff" />
            <rect x="13" y="75" width="12" height="12" fill="#0f172a" />

            <rect x="40" y="8" width="8" height="8" fill="#0f172a" />
            <rect x="52" y="20" width="8" height="8" fill="#0f172a" />
            <rect x="38" y="38" width="10" height="10" fill="#0f172a" />
            <rect x="52" y="38" width="10" height="10" fill="#0f172a" />
            <rect x="38" y="54" width="8" height="8" fill="#0f172a" />
            <rect x="54" y="54" width="8" height="8" fill="#0f172a" />
            <rect x="40" y="70" width="8" height="8" fill="#0f172a" />
            <rect x="68" y="68" width="10" height="10" fill="#0f172a" />
          </svg>
        </div>
      </div>

      {/* CÓDIGO DE BARRAS CODE 128 SINTÉTICO SVG */}
      <div className="flex flex-col items-center border-t border-slate-300 pt-1">
        <svg width="220" height="22" viewBox="0 0 220 22">
          {Array.from({ length: 45 }).map((_, i) => (
            <rect
              key={i}
              x={i * 4.8 + 4}
              y="0"
              width={i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1}
              height="20"
              fill="#0f172a"
            />
          ))}
        </svg>
        <span className="font-mono text-[7px] text-slate-700 tracking-widest font-bold -mt-0.5">
          *{chapa}*
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusEtiqueta }) {
  const map: Record<StatusEtiqueta, { label: string; cls: string }> = {
    aguardando: { label: "Aguardando Impressão", cls: "bg-warning/20 text-warning font-semibold border border-warning/30" },
    impressa: { label: "Impressa (Pendente Aplicação)", cls: "bg-accent/20 text-accent-foreground font-semibold border border-accent/30" },
    aplicada: { label: "Aplicada no Bem", cls: "bg-success/20 text-success font-semibold border border-success/30" },
    reimpressa: { label: "Reimpressa / Cancelada", cls: "bg-destructive/20 text-destructive font-semibold border border-destructive/30" },
  };
  const item = map[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded ${item.cls}`}>{item.label}</span>;
}
