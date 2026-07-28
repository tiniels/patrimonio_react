import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Send,
  ArrowRight,
  Building,
  UserCheck,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  FileCheck,
  XCircle,
  Paperclip,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import { getRespAuthSession } from "@/lib/authStore";

export const Route = createFileRoute("/_resp/responsavel/transferencia")({
  head: () => ({
    meta: [
      { title: "Solicitação de Transferência (MOD-14) — Responsável" },
      {
        name: "description",
        content:
          "Crie solicitações de transferência de bens com indicação de destino, justificativa, anexo oficial e protocolo.",
      },
    ],
  }),
  component: RespTransferenciaPage,
});

export type StatusTransferencia = "aguardando_aceite" | "efetivada" | "rejeitada" | "cancelada";

export interface ItemSolicitacaoTransferencia {
  protocolo: string;
  dataSolicitacao: string;
  setorOrigem: string;
  responsavelOrigem: string;
  secretariaDestino: string;
  setorDestino: string;
  responsavelDestino: string;
  chapas: string[];
  descricoesBens: string;
  justificativa: string;
  documentoAnexoUrl?: string;
  status: StatusTransferencia;
  motivoRejeicao?: string;
}

const INITIAL_SOLICITACOES: ItemSolicitacaoTransferencia[] = [
  {
    protocolo: "TRF-2026-001",
    dataSolicitacao: "2026-07-28 09:30",
    setorOrigem: "Departamento de Contabilidade e Patrimônio",
    responsavelOrigem: "Neemias Oliveira",
    secretariaDestino: "Secretaria de Serviços Municipais",
    setorDestino: "Galpão Central de Manutenção",
    responsavelDestino: "João Roberto Mendes",
    chapas: ["100452", "100453"],
    descricoesBens: "MESA EM L + CADEIRA ERGONÔMICA",
    justificativa: "Readequação de mobiliário administrativo para nova equipe de campo.",
    documentoAnexoUrl: "oficio_oficial_42159.pdf",
    status: "aguardando_aceite",
  },
  {
    protocolo: "TRF-2026-002",
    dataSolicitacao: "2026-07-20 14:00",
    setorOrigem: "Departamento de Contabilidade e Patrimônio",
    responsavelOrigem: "Neemias Oliveira",
    secretariaDestino: "Secretaria de Saúde",
    setorDestino: "USA Fazendinha",
    responsavelDestino: "Dra. Patricia Lima",
    chapas: ["ESP-9901"],
    descricoesBens: "NOTEBOOK DELL LATITUDE 5540 CORE I7",
    justificativa: "Empréstimo temporário homologado para treinamento do sistema.",
    status: "efetivada",
  },
];

const MOCK_MEUS_BENS = [
  { chapa: "100452", descricao: "MESA PARA ESCRITÓRIO EM L COM GAVETEIRO", emTransferenciaAtiva: true },
  { chapa: "100453", descricao: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA", emTransferenciaAtiva: true },
  { chapa: "ESP-9901", descricao: "NOTEBOOK DELL LATITUDE 5540 CORE I7", emTransferenciaAtiva: false },
  { chapa: "100120", descricao: "AR CONDICIONADO SPLIT 18000 BTU INVERTER", emTransferenciaAtiva: false },
  { chapa: "100889", descricao: "IMPRESSORA MULTIFUNCIONAL HP LASERJET", emTransferenciaAtiva: false },
];

const MOCK_SETORES_DESTINO = [
  { secretaria: "Secretaria de Educação", setor: "EMEF Aldeia de Barueri", responsavel: "Marcos Antonio da Silva" },
  { secretaria: "Secretaria de Saúde", setor: "USA Fazendinha", responsavel: "Dra. Patricia Lima" },
  { secretaria: "Secretaria de Serviços Municipais", setor: "Galpão Central de Manutenção", responsavel: "João Roberto Mendes" },
  { secretaria: "Secretaria de Administração", setor: "Divisão de TI", responsavel: "Luciana Freitas" },
];

function RespTransferenciaPage() {
  const session = getRespAuthSession();
  const setorOrigem = session?.unidadeNome || session?.setor || "Departamento de Contabilidade e Patrimônio";
  const responsavelOrigem = session?.responsavelNome || session?.responsavel || "Neemias Oliveira";

  const [solicitacoes, setSolicitacoes] = useState<ItemSolicitacaoTransferencia[]>(INITIAL_SOLICITACOES);

  // Form State (RF-MOD-14-01 a RF-MOD-14-04)
  const [selectedChapas, setSelectedChapas] = useState<string[]>([]);
  const [targetSetorIndex, setTargetSetorIndex] = useState<number>(0);
  const [justificativa, setJustificativa] = useState("");
  const [dataPrevista, setDataPrevista] = useState(new Date().toISOString().slice(0, 10));
  const [anexoNome, setAnexoNome] = useState("");
  const [successProtocol, setSuccessProtocol] = useState<string | null>(null);

  const kpis = useMemo(
    () => [
      { label: "Solicitações Enviadas", value: String(solicitacoes.length) },
      { label: "Aguardando Aceite", value: String(solicitacoes.filter((s) => s.status === "aguardando_aceite").length) },
      { label: "Concluídas / Efetivadas", value: String(solicitacoes.filter((s) => s.status === "efetivada").length) },
      { label: "Rejeitadas / Canceladas", value: String(solicitacoes.filter((s) => s.status === "rejeitada" || s.status === "cancelada").length) },
    ],
    [solicitacoes]
  );

  const toggleChapa = (chapa: string) => {
    // Regra RN-MOD-14-01: Não permite selecionar se já em transferência ativa
    const found = MOCK_MEUS_BENS.find((b) => b.chapa === chapa);
    if (found?.emTransferenciaAtiva) {
      alert(`O bem #${chapa} já está em processo de transferência ativa (Protocolo Pendente) e não pode participar de nova transferência simultânea.`);
      return;
    }

    setSelectedChapas((prev) =>
      prev.includes(chapa) ? prev.filter((c) => c !== chapa) : [...prev, chapa]
    );
  };

  const handleCreateTransferencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChapas.length === 0) {
      alert("Selecione ao menos um bem elegível para transferência.");
      return;
    }
    if (!justificativa.trim()) {
      alert("Informe a justificativa da transferência.");
      return;
    }

    const dest = MOCK_SETORES_DESTINO[targetSetorIndex];
    const newProt = `TRF-2026-00${solicitacoes.length + 1}`;
    const dataHora = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const newTransferencia: ItemSolicitacaoTransferencia = {
      protocolo: newProt,
      dataSolicitacao: dataHora,
      setorOrigem,
      responsavelOrigem,
      secretariaDestino: dest.secretaria,
      setorDestino: dest.setor,
      responsavelDestino: dest.responsavel,
      chapas: selectedChapas,
      descricoesBens: `${selectedChapas.length} bem(ns) do setor (${selectedChapas.join(", ")})`,
      justificativa: justificativa.trim(),
      documentoAnexoUrl: anexoNome ? `anexo_${newProt}.pdf` : undefined,
      status: "aguardando_aceite",
    };

    setSolicitacoes([newTransferencia, ...solicitacoes]);
    setSuccessProtocol(newProt);
    setSelectedChapas([]);
    setJustificativa("");
    setAnexoNome("");
  };

  const handleCancelSolicitacao = (protocolo: string) => {
    if (!confirm(`Deseja realmente cancelar a solicitação ${protocolo}?`)) return;
    setSolicitacoes((prev) =>
      prev.map((s) => (s.protocolo === protocolo ? { ...s, status: "cancelada" } : s))
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Solicitação de Transferência de Bens (MOD-14)"
        description="Crie solicitações de movimentação de patrimônio para outros setores com termo/ofício anexo e acompanhamento de protocolo."
        crumbs={[{ label: "Responsável", to: "/responsavel" }, { label: "Nova Transferência" }]}
      />

      <KPIGrid items={kpis} />

      {/* FEEDBACK DE SUCESSO DE SOLICITAÇÃO */}
      {successProtocol && (
        <div className="p-4 bg-success/20 border border-success/40 rounded-xl text-success font-semibold text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Solicitação de transferência gerada com sucesso! <b>Protocolo: {successProtocol}</b>. Aguardando aceite da unidade de destino.</span>
          </div>
          <button
            onClick={() => setSuccessProtocol(null)}
            className="text-xs underline hover:opacity-80"
          >
            Fechar
          </button>
        </div>
      )}

      {/* FORMULÁRIO DE NOVA TRANSFERÊNCIA (RF-MOD-14-01 a RF-MOD-14-07) */}
      <section className="glass-card p-5 border border-border/60">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-foreground border-b border-border pb-3">
          <Send className="h-4 w-4 text-primary" />
          <span>Formulário de Solicitação de Transferência</span>
        </div>

        <form onSubmit={handleCreateTransferencia} className="grid gap-4 md:grid-cols-2 text-xs">
          {/* SELEÇÃO MULTI-BENS (RF-MOD-14-01) */}
          <div className="md:col-span-2 space-y-2">
            <label className="font-bold text-foreground flex items-center justify-between">
              <span>1. Selecionar Bens Elegíveis do Setor Origem ({setorOrigem}) *</span>
              <span className="text-muted-foreground font-normal text-[11px]">{selectedChapas.length} selecionado(s)</span>
            </label>
            <div className="border border-border/60 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 bg-background/40">
              {MOCK_MEUS_BENS.map((b) => (
                <div
                  key={b.chapa}
                  onClick={() => toggleChapa(b.chapa)}
                  className={`p-2 rounded flex items-center justify-between cursor-pointer transition-colors ${
                    selectedChapas.includes(b.chapa)
                      ? "bg-primary/20 border border-primary/40 text-foreground"
                      : b.emTransferenciaAtiva
                      ? "opacity-50 bg-muted/40 cursor-not-allowed"
                      : "hover:bg-accent/10 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedChapas.includes(b.chapa)}
                      disabled={b.emTransferenciaAtiva}
                      onChange={() => {}}
                      className="rounded border-input text-primary"
                    />
                    <span className="font-mono font-bold text-primary">#{b.chapa}</span>
                    <span>{b.descricao}</span>
                  </div>

                  {b.emTransferenciaAtiva && (
                    <span className="text-[10px] text-warning font-mono font-bold">
                      ⚠️ Transferência Ativa Pendente (RN-MOD-14-01)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* DESTINO DA TRANSFERÊNCIA (RF-MOD-14-02) */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">2. Setor e Responsável de Destino *</label>
            <select
              value={targetSetorIndex}
              onChange={(e) => setTargetSetorIndex(Number(e.target.value))}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
            >
              {MOCK_SETORES_DESTINO.map((d, idx) => (
                <option key={idx} value={idx}>
                  {d.setor} ({d.secretaria}) — Resp: {d.responsavel}
                </option>
              ))}
            </select>
          </div>

          {/* DATA PREVISTA */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">3. Data Prevista para Movimentação *</label>
            <input
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
            />
          </div>

          {/* JUSTIFICATIVA (RF-MOD-14-03) */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="font-bold text-foreground">4. Justificativa da Transferência *</label>
            <textarea
              required
              rows={2}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva o motivo da movimentação de patrimônio (ex: Readequação física, encerramento de projeto...)"
              className="p-2.5 rounded-md border border-input bg-background/60 text-xs"
            />
          </div>

          {/* ANEXO OFICIAL (RF-MOD-14-04) */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="font-bold text-foreground">5. Documento / Ofício Oficial Anexo (Opcional)</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="fileAnexo"
                onChange={(e) => setAnexoNome(e.target.files?.[0]?.name || "")}
                className="hidden"
              />
              <label
                htmlFor="fileAnexo"
                className="h-9 px-3 rounded border border-input bg-background/60 hover:bg-muted text-muted-foreground font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Paperclip className="h-3.5 w-3.5 text-primary" /> Anexar Termo / Ofício PDF
              </label>
              {anexoNome && <span className="font-mono text-primary text-xs">Anexado: {anexoNome}</span>}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end pt-2 border-t border-border">
            <button
              type="submit"
              className="h-10 px-6 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" /> Gerar Protocolo & Enviar Solicitação
            </button>
          </div>
        </form>
      </section>

      {/* ACOMPANHAMENTO DAS SOLICITAÇÕES ENVIADAS (RF-MOD-14-08 / REL-MOD-14-01) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="p-4 border-b border-border/60 font-bold text-sm text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Transferências Enviadas ({solicitacoes.length})
          </span>
          <span className="text-xs font-normal text-muted-foreground">Acompanhamento do status de aceite</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Protocolo</th>
                <th className="p-3">Data Envio</th>
                <th className="p-3">Setor Destino</th>
                <th className="p-3">Responsável Destino</th>
                <th className="p-3">Bens Solicitados</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {solicitacoes.map((item) => (
                <tr key={item.protocolo} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{item.protocolo}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.dataSolicitacao}</td>
                  <td className="p-3 font-medium text-foreground">
                    <div>{item.setorDestino}</div>
                    <span className="text-[11px] text-muted-foreground">{item.secretariaDestino}</span>
                  </td>
                  <td className="p-3 font-semibold text-foreground">{item.responsavelDestino}</td>
                  <td className="p-3 font-medium text-foreground">
                    <div>{item.descricoesBens}</div>
                    <span className="text-[11px] text-primary font-mono font-bold">Chapas: {item.chapas.join(", ")}</span>
                  </td>
                  <td className="p-3">
                    <StatusTransferenciaBadge status={item.status} />
                  </td>
                  <td className="p-3 text-right">
                    {item.status === "aguardando_aceite" && (
                      <button
                        onClick={() => handleCancelSolicitacao(item.protocolo)}
                        className="px-2 py-1 rounded bg-destructive/15 text-destructive hover:bg-destructive/30 transition-colors text-[11px] font-semibold"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusTransferenciaBadge({ status }: { status: StatusTransferencia }) {
  const map: Record<StatusTransferencia, { label: string; cls: string }> = {
    aguardando_aceite: { label: "⏳ Aguardando Aceite", cls: "bg-warning/20 text-warning border-warning/40 font-bold" },
    efetivada: { label: "🟢 Efetivada", cls: "bg-success/20 text-success border-success/40 font-bold" },
    rejeitada: { label: "🔴 Rejeitada pelo Destino", cls: "bg-destructive/20 text-destructive border-destructive/40 font-bold" },
    cancelada: { label: "⚪ Cancelada", cls: "bg-muted text-muted-foreground border-border" },
  };
  const item = map[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
