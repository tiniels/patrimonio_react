import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Check,
  X,
  Clock,
  Building,
  UserCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Download,
  Search,
  Eye,
  Paperclip,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_resp/responsavel/transferencias-pendentes")({
  head: () => ({
    meta: [
      { title: "Aceite de Transferências Pendentes (MOD-15) — Responsável" },
      {
        name: "description",
        content:
          "Autorize, recuse ou solicite correções de transferências de bens direcionadas à sua unidade.",
      },
    ],
  }),
  component: RespTransferenciasPendentesPage,
});

export interface TransferenciaPendenteItem {
  id: string;
  protocolo: string;
  dataSolicitacao: string;
  diasAguardando: number;
  setorOrigem: string;
  responsavelOrigem: string;
  bens: { chapa: string; descricao: string; estado: string }[];
  justificativa: string;
  documentoAnexoUrl?: string;
  status: "pendente" | "autorizada" | "rejeitada";
  motivoRejeicao?: string;
}

const INITIAL_PENDENTES: TransferenciaPendenteItem[] = [
  {
    id: "TRF-PEND-001",
    protocolo: "TRF-2026-001",
    dataSolicitacao: "2026-07-28 09:30",
    diasAguardando: 1,
    setorOrigem: "Departamento de Contabilidade e Patrimônio",
    responsavelOrigem: "Neemias Oliveira",
    bens: [
      { chapa: "100452", descricao: "MESA PARA ESCRITÓRIO EM L COM GAVETEIRO", estado: "BOM" },
      { chapa: "100453", descricao: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA", estado: "BOM" },
    ],
    justificativa: "Readequação de mobiliário administrativo para nova equipe de campo.",
    documentoAnexoUrl: "oficio_oficial_42159.pdf",
    status: "pendente",
  },
  {
    id: "TRF-PEND-002",
    protocolo: "TRF-2026-089",
    dataSolicitacao: "2026-07-22 11:00",
    diasAguardando: 6, // SLA em Risco!
    setorOrigem: "Secretaria de Educação — Almoxarifado",
    responsavelOrigem: "Marcos Antonio da Silva",
    bens: [{ chapa: "ESP-8812", descricao: "PROJETOR MULTIMÍDIA EPSON 4000 LUMENS", estado: "ÓTIMO" }],
    justificativa: "Transferência definitiva para uso no auditório da USA Fazendinha.",
    status: "pendente",
  },
];

function RespTransferenciasPendentesPage() {
  const [pendentes, setPendentes] = useState<TransferenciaPendenteItem[]>(INITIAL_PENDENTES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qSearch, setQSearch] = useState("");

  // Modais
  const [viewItem, setViewItem] = useState<TransferenciaPendenteItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<TransferenciaPendenteItem | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [termoAceiteItem, setTermoAceiteItem] = useState<TransferenciaPendenteItem | null>(null);

  const activePendentes = useMemo(() => pendentes.filter((p) => p.status === "pendente"), [pendentes]);

  const filtered = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return activePendentes.filter((p) => {
      if (!t) return true;
      return (
        p.protocolo.toLowerCase().includes(t) ||
        p.setorOrigem.toLowerCase().includes(t) ||
        p.responsavelOrigem.toLowerCase().includes(t) ||
        p.bens.some((b) => b.chapa.toLowerCase().includes(t) || b.descricao.toLowerCase().includes(t))
      );
    });
  }, [activePendentes, qSearch]);

  const kpis = useMemo(
    () => [
      { label: "Pendências de Aceite", value: String(activePendentes.length) },
      { label: "SLA em Risco (> 5 dias)", value: String(activePendentes.filter((p) => p.diasAguardando > 5).length) },
      { label: "Transferências Autorizadas Hoje", value: String(pendentes.filter((p) => p.status === "autorizada").length) },
      { label: "Solicitações Rejeitadas", value: String(pendentes.filter((p) => p.status === "rejeitada").length) },
    ],
    [activePendentes, pendentes]
  );

  // Autorização Transacional (RF-MOD-15-03 & RN-MOD-15-03)
  const handleAutorizar = (item: TransferenciaPendenteItem) => {
    setPendentes((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: "autorizada" } : p))
    );
    setTermoAceiteItem(item);
  };

  const handleAutorizarEmLote = () => {
    if (selectedIds.length === 0) return;
    setPendentes((prev) =>
      prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status: "autorizada" } : p))
    );
    alert(`Efetivação transacional de ${selectedIds.length} transferência(s) realizada com sucesso! Responsabilidade dos bens atualizada.`);
    setSelectedIds([]);
  };

  // Rejeição Motivada (RF-MOD-15-04 & RN-MOD-15-02)
  const handleConfirmRejeicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem || !motivoRejeicao.trim()) return;

    setPendentes((prev) =>
      prev.map((p) =>
        p.id === rejectingItem.id ? { ...p, status: "rejeitada", motivoRejeicao: motivoRejeicao.trim() } : p
      )
    );

    setRejectingItem(null);
    setMotivoRejeicao("");
    alert(`Transferência ${rejectingItem.protocolo} foi rejeitada com justificativa registrada.`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aceite de Transferências Pendentes (MOD-15)"
        description="Caixa de entrada para autorização transacional de bens direcionados ao seu setor, com verificação de SLA e comprovante de aceite."
        crumbs={[{ label: "Responsável", to: "/responsavel" }, { label: "Transferências Pendentes" }]}
        actions={
          selectedIds.length > 0 ? (
            <button
              onClick={handleAutorizarEmLote}
              className="h-9 px-4 rounded-md bg-success text-success-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 animate-in fade-in"
            >
              <Check className="h-4 w-4" /> Autorizar {selectedIds.length} Selecionadas em Lote
            </button>
          ) : undefined
        }
      />

      <KPIGrid items={kpis} />

      {/* FILTROS DA CAIXA DE ENTRADA */}
      <section className="glass-card p-4 border border-border/60">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={qSearch}
            onChange={(e) => setQSearch(e.target.value)}
            placeholder="Buscar pendências por protocolo, setor de origem, responsável ou chapa..."
            className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
          />
        </div>
      </section>

      {/* LISTA DA CAIXA DE ENTRADA (RF-MOD-15-01 / RF-MOD-15-02) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="p-4 border-b border-border/60 font-bold text-sm text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" /> Caixa de Entrada — Pedidos Aguardando Sua Autorização ({filtered.length})
          </span>
          <span className="text-xs font-normal text-muted-foreground">Efetivação imediata de responsabilidade (RN-MOD-15-03)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? filtered.map((f) => f.id) : [])
                    }
                    className="rounded border-input text-primary"
                  />
                </th>
                <th className="p-3">Protocolo / Data</th>
                <th className="p-3">Setor Origem</th>
                <th className="p-3">Solicitante</th>
                <th className="p-3">Bens a Receber</th>
                <th className="p-3">SLA / Idade</th>
                <th className="p-3 text-right">Ações de Decisão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-input text-primary"
                    />
                  </td>

                  <td className="p-3 font-mono font-bold text-primary">
                    <div>{item.protocolo}</div>
                    <span className="text-[10px] text-muted-foreground font-normal">{item.dataSolicitacao}</span>
                  </td>

                  <td className="p-3 font-medium text-foreground">
                    <div>{item.setorOrigem}</div>
                  </td>

                  <td className="p-3 font-semibold text-foreground">{item.responsavelOrigem}</td>

                  <td className="p-3 font-medium text-foreground">
                    <button
                      onClick={() => setViewItem(item)}
                      className="hover:underline text-left inline-flex items-center gap-1 font-bold text-primary"
                    >
                      {item.bens.length} bem(ns) <Eye className="h-3 w-3 shrink-0" />
                    </button>
                    <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                      {item.bens.map((b) => `#${b.chapa}`).join(", ")}
                    </div>
                  </td>

                  {/* SLA / IDADE DA PENDÊNCIA (RF-MOD-15-06) */}
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.diasAguardando > 5
                          ? "bg-destructive/20 text-destructive border-destructive/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      }`}
                    >
                      {item.diasAguardando} dia(s) · {item.diasAguardando > 5 ? "⚠️ SLA em Risco" : "No prazo"}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAutorizar(item)}
                        className="h-8 px-2.5 rounded bg-success/20 text-success border border-success/30 font-bold text-[11px] inline-flex items-center gap-1 hover:bg-success/30 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" /> Autorizar
                      </button>

                      <button
                        onClick={() => setRejectingItem(item)}
                        className="h-8 px-2.5 rounded bg-destructive/20 text-destructive border border-destructive/30 font-bold text-[11px] inline-flex items-center gap-1 hover:bg-destructive/30 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" /> Recusar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhuma transferência pendente de aceite no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL DETALHE E ANEXOS (RF-MOD-15-02) */}
      {viewItem && (
        <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" /> Detalhes da Transferência {viewItem.protocolo}
              </DialogTitle>
              <DialogDescription>
                Bens solicitados pelo setor de origem.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="font-bold text-foreground">Origem: {viewItem.setorOrigem}</div>
                <div className="text-muted-foreground">Solicitante: {viewItem.responsavelOrigem}</div>
                <div className="text-muted-foreground mt-1"><b>Justificativa:</b> "{viewItem.justificativa}"</div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-foreground">Bens Incluídos no Pedido:</span>
                {viewItem.bens.map((b) => (
                  <div key={b.chapa} className="p-2 rounded bg-background/60 border border-border flex justify-between">
                    <div>
                      <span className="font-mono font-bold text-primary">#{b.chapa}</span>
                      <div className="font-medium text-foreground">{b.descricao}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted h-fit">
                      {b.estado}
                    </span>
                  </div>
                ))}
              </div>

              {viewItem.documentoAnexoUrl && (
                <div className="p-2.5 rounded bg-primary/10 border border-primary/30 flex items-center justify-between text-primary font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" /> Termo Anexo: {viewItem.documentoAnexoUrl}
                  </span>
                  <button onClick={() => alert("Baixando anexo...")} className="hover:underline text-[11px]">
                    Baixar
                  </button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL REJEIÇÃO MOTIVADA (RF-MOD-15-04 / RN-MOD-15-02) */}
      {rejectingItem && (
        <Dialog open={!!rejectingItem} onOpenChange={() => setRejectingItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <X className="h-5 w-5" /> Rejeição Motivada da Transferência (RN-MOD-15-02)
              </DialogTitle>
              <DialogDescription>
                Informe o motivo formal da recusa para notificação ao setor solicitante.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmRejeicao} className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive-foreground rounded-lg">
                <div className="font-bold">Protocolo: {rejectingItem.protocolo}</div>
                <div>Origem: {rejectingItem.setorOrigem}</div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Motivo Obrigatório da Recusa *</label>
                <textarea
                  required
                  rows={3}
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  placeholder="Ex: Mobiliário não cabe na sala de destino / divergência na quantidade enviada..."
                  className="p-2.5 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-destructive text-destructive-foreground font-bold hover:opacity-90"
                >
                  Confirmar Rejeição Motivada
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL TERMO DE ACEITE AUTORIZADO (RF-MOD-15-08) */}
      {termoAceiteItem && (
        <Dialog open={!!termoAceiteItem} onOpenChange={() => setTermoAceiteItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-success">
                <FileCheck className="h-5 w-5" /> Termo Oficial de Aceite Efetivado (RN-MOD-15-03)
              </DialogTitle>
              <DialogDescription>
                Transferência autorizada. A responsabilidade dos bens foi alterada no sistema.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-700 flex flex-col gap-2 font-mono">
                <div className="text-[10px] text-slate-400 font-sans">Prefeitura de Santana de Parnaíba</div>
                <div className="text-sm font-bold text-success">TERMO DE ACEITE E EFETIVAÇÃO PATRIMONIAL</div>
                <div className="text-[11px] text-slate-300">Protocolo: {termoAceiteItem.protocolo}</div>
                <div className="text-[11px] text-slate-300">Origem: {termoAceiteItem.setorOrigem}</div>
                <div className="text-[11px] text-slate-300">Bens Transferidos: {termoAceiteItem.bens.length} item(ns)</div>
                <div className="text-[9px] text-slate-500 border-t border-slate-800 pt-2 break-all">
                  Assinatura Eletrônica Hash: 4e912a780bca11e992a01
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setTermoAceiteItem(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert("Termo de Aceite baixado em PDF!");
                    setTermoAceiteItem(null);
                  }}
                  className="px-4 py-1.5 rounded-md bg-success text-success-foreground font-bold hover:opacity-90 flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar Termo (PDF)
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
