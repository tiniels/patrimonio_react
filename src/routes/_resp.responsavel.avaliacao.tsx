import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  AlertTriangle,
  FileCheck,
  Upload,
  CheckCircle2,
  Clock,
  Building,
  UserCheck,
  Search,
  Download,
  Eye,
  ShieldCheck,
  Paperclip,
  Trash2,
  Check,
  X,
  FileText,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_resp/responsavel/avaliacao")({
  head: () => ({
    meta: [
      { title: "Avaliação de Bens e Baixa (MOD-18) — Responsável" },
      {
        name: "description",
        content:
          "Solicite a avaliação técnica de bens para inservibilidade, alienação ou baixa com laudo técnico e protocolo SISGEP.",
      },
    ],
  }),
  component: RespAvaliacaoPage,
});

export type MotivoAvaliacao = "inservivel" | "obsoleto" | "danificado" | "extravio" | "alienacao";
export type StatusProcessoAvaliacao = "em_analise_comissao" | "aguardando_secretario" | "baixa_efetivada" | "rejeitado";

export interface ItemProcessoAvaliacao {
  id: string;
  protocoloSisgep: string; // Ex: SISGEP-2026-00412
  dataSolicitacao: string;
  chapa: string;
  descricaoBem: string;
  setor: string;
  responsavel: string;
  motivo: MotivoAvaliacao;
  justificativa: string;
  laudoTecnicoNome?: string;
  fotosCount: number;
  parecerComissao?: string;
  secretarioAprovador?: string;
  status: StatusProcessoAvaliacao;
  hashAssinatura?: string;
}

const INITIAL_PROCESSOS_AVALIACAO: ItemProcessoAvaliacao[] = [
  {
    id: "AVAL-2026-001",
    protocoloSisgep: "SISGEP-2026-00192",
    dataSolicitacao: "2026-07-26 11:20",
    chapa: "100120",
    descricaoBem: "AR CONDICIONADO SPLIT 18000 BTU INVERTER",
    setor: "Departamento de Contabilidade e Patrimônio",
    responsavel: "Neemias Oliveira",
    motivo: "danificado",
    justificativa: "Compressor queimado com vazamento de fluido. Laudo técnico indica custo de reparo superior a 75% do valor novo.",
    laudoTecnicoNome: "laudo_tecnico_ar_100120.pdf",
    fotosCount: 3,
    parecerComissao: "Parecer da Comissão nº 42/2026: Favorável à baixa patrimonial por inservibilidade econômica.",
    secretarioAprovador: "Dr. Fernando Ribeiro (Secretário de Administração)",
    status: "aguardando_secretario",
  },
  {
    id: "AVAL-2026-002",
    protocoloSisgep: "SISGEP-2026-00088",
    dataSolicitacao: "2026-07-15 09:00",
    chapa: "100889",
    descricaoBem: "IMPRESSORA MULTIFUNCIONAL HP LASERJET",
    setor: "Departamento de Contabilidade e Patrimônio",
    responsavel: "Neemias Oliveira",
    motivo: "obsoleto",
    justificativa: "Equipamento antigo sem peças de reposição no mercado homologado.",
    laudoTecnicoNome: "parecer_ti_impressora.pdf",
    fotosCount: 1,
    parecerComissao: "Aprovado para baixa e destinação a descarte ecológico eletrônico.",
    secretarioAprovador: "Dr. Fernando Ribeiro (Secretário de Administração)",
    status: "baixa_efetivada",
    hashAssinatura: "8a4f91b2c0199e83017a022419a4ff11",
  },
];

const MOCK_BENS_SETOR = [
  { chapa: "100120", descricao: "AR CONDICIONADO SPLIT 18000 BTU INVERTER", emAvaliacaoAtiva: true },
  { chapa: "100889", descricao: "IMPRESSORA MULTIFUNCIONAL HP LASERJET", emAvaliacaoAtiva: false },
  { chapa: "100452", descricao: "MESA PARA ESCRITÓRIO EM L COM GAVETEIRO", emAvaliacaoAtiva: false },
  { chapa: "100453", descricao: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA", emAvaliacaoAtiva: false },
  { chapa: "ESP-9901", descricao: "NOTEBOOK DELL LATITUDE 5540 CORE I7", emAvaliacaoAtiva: false },
];

function RespAvaliacaoPage() {
  const [processos, setProcessos] = useState<ItemProcessoAvaliacao[]>(INITIAL_PROCESSOS_AVALIACAO);
  const [qSearch, setQSearch] = useState("");

  // Formulário (RF-MOD-18-01 a RF-MOD-18-04)
  const [selectedChapa, setSelectedChapa] = useState("100452");
  const [motivo, setMotivo] = useState<MotivoAvaliacao>("danificado");
  const [justificativa, setJustificativa] = useState("");
  const [laudoNome, setLaudoNome] = useState("");
  const [fotosCount, setFotosCount] = useState(0);
  const [successProtocol, setSuccessProtocol] = useState<string | null>(null);

  // Modais
  const [viewProcesso, setViewProcesso] = useState<ItemProcessoAvaliacao | null>(null);
  const [termoBaixaItem, setTermoBaixaItem] = useState<ItemProcessoAvaliacao | null>(null);

  const kpis = useMemo(
    () => [
      { label: "Processos Em Análise / Comissão", value: String(processos.filter((p) => p.status === "em_analise_comissao" || p.status === "aguardando_secretario").length) },
      { label: "Baixas Efetivadas", value: String(processos.filter((p) => p.status === "baixa_efetivada").length) },
      { label: "Tempo Médio de Decisão", value: "3.2 dias" },
      { label: "Total de Processos SISGEP", value: String(processos.length) },
    ],
    [processos]
  );

  const handleCreateProcesso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justificativa.trim()) {
      alert("Informe a justificativa detalhada para a solicitação de avaliação.");
      return;
    }

    const bemFound = MOCK_BENS_SETOR.find((b) => b.chapa === selectedChapa);
    const newProt = `SISGEP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const dataHora = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const newProcesso: ItemProcessoAvaliacao = {
      id: `AVAL-2026-00${processos.length + 1}`,
      protocoloSisgep: newProt,
      dataSolicitacao: dataHora,
      chapa: selectedChapa,
      descricaoBem: bemFound?.descricao || "BEM PATRIMONIAL DO SETOR",
      setor: "Departamento de Contabilidade e Patrimônio",
      responsavel: "Neemias Oliveira",
      motivo,
      justificativa: justificativa.trim(),
      laudoTecnicoNome: laudoNome || undefined,
      fotosCount: fotosCount || 2,
      status: "em_analise_comissao",
    };

    setProcessos([newProcesso, ...processos]);
    setSuccessProtocol(newProt);
    setJustificativa("");
    setLaudoNome("");
    setFotosCount(0);
  };

  // Simulação de Aprovação pelo Secretário da Pasta (RF-MOD-18-05 & RF-MOD-18-08)
  const handleAprovarSecretario = (processo: ItemProcessoAvaliacao) => {
    const hash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setProcessos((prev) =>
      prev.map((p) =>
        p.id === processo.id
          ? {
              ...p,
              status: "baixa_efetivada",
              secretarioAprovador: "Dr. Fernando Ribeiro (Secretário de Administração)",
              parecerComissao: "Aprovado integralmente pela Comissão e Secretário da Pasta.",
              hashAssinatura: hash,
            }
          : p
      )
    );
    setTermoBaixaItem({
      ...processo,
      status: "baixa_efetivada",
      secretarioAprovador: "Dr. Fernando Ribeiro (Secretário de Administração)",
      hashAssinatura: hash,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Avaliação de Bens e Baixa Patrimonial (MOD-18)"
        description="Solicite laudo e avaliação técnica para baixa, alienação ou descarte com protocolo SISGEP e assinatura do Secretário da Pasta."
        crumbs={[{ label: "Responsável", to: "/responsavel" }, { label: "Avaliação de Bens" }]}
      />

      <KPIGrid items={kpis} />

      {/* AVISO IMPORTANTE DE ASSINATURA DO SECRETÁRIO */}
      <div className="glass-card p-4 border border-warning/40 bg-warning/10 flex gap-3 text-xs text-foreground">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <strong className="text-warning font-bold">Atenção ao Fluxo Legal (RN-MOD-18-01 / RN-MOD-18-02):</strong>
          <p className="mt-0.5 text-muted-foreground">
            A simples abertura do pedido de avaliação <b>não altera o status oficial do patrimônio</b> nem realiza a baixa automática.
            O processo tramita pela Comissão de Avaliação e a baixa só é efetivada após a emissão do parecer e a <b>assinatura digital do Secretário da Pasta</b> via SISGEP.
          </p>
        </div>
      </div>

      {/* FEEDBACK DE REGISTRO DE PROCESSO */}
      {successProtocol && (
        <div className="p-4 bg-success/20 border border-success/40 rounded-xl text-success font-semibold text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Processo de Avaliação registrado no SISGEP com sucesso! <b>Protocolo: {successProtocol}</b>. Encaminhado para a Comissão.</span>
          </div>
          <button onClick={() => setSuccessProtocol(null)} className="text-xs underline">Fechar</button>
        </div>
      )}

      {/* FORMULÁRIO DE SOLICITAÇÃO (RF-MOD-18-01 a RF-MOD-18-04) */}
      <section className="glass-card p-5 border border-border/60">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-foreground border-b border-border pb-3">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          <span>Novo Pedido de Avaliação Técnica de Bem</span>
        </div>

        <form onSubmit={handleCreateProcesso} className="grid gap-4 md:grid-cols-2 text-xs">
          {/* SELEÇÃO DO BEM DO SETOR */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">1. Selecionar Bem do Setor Origem *</label>
            <select
              value={selectedChapa}
              onChange={(e) => setSelectedChapa(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
            >
              {MOCK_BENS_SETOR.map((b) => (
                <option key={b.chapa} value={b.chapa} disabled={b.emAvaliacaoAtiva}>
                  #{b.chapa} — {b.descricao} {b.emAvaliacaoAtiva ? "(⚠️ Em Avaliação Ativa - RN-MOD-18-03)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* MOTIVO DA AVALIAÇÃO (RF-MOD-18-02) */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">2. Motivo da Avaliação / Baixa *</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as MotivoAvaliacao)}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
            >
              <option value="danificado">Bem Danificado / Avariado sem Reparo Viável</option>
              <option value="inservivel">Bem Inservível / Sucata</option>
              <option value="obsoleto">Bem Obsoleto / Sem Utilidade Tecnológica</option>
              <option value="extravio">Extravio / Abertura de Sindicância</option>
              <option value="alienacao">Alienação / Doação Institucional</option>
            </select>
          </div>

          {/* JUSTIFICATIVA */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="font-bold text-foreground">3. Justificativa Detalhada e Condição Física do Bem *</label>
            <textarea
              required
              rows={3}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva o estado de conservação, histórico de avarias e o motivo técnico da solicitação de baixa..."
              className="p-2.5 rounded-md border border-input bg-background/60 text-xs"
            />
          </div>

          {/* ANEXOS DE FOTOS E LAUDO TÉCNICO (RF-MOD-18-03 / RF-MOD-18-04) */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">4. Anexo de Laudo Técnico (PDF)</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="fileLaudo"
                onChange={(e) => setLaudoNome(e.target.files?.[0]?.name || "")}
                className="hidden"
              />
              <label
                htmlFor="fileLaudo"
                className="h-9 px-3 rounded border border-input bg-background/60 hover:bg-muted text-muted-foreground font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Paperclip className="h-3.5 w-3.5 text-primary" /> Anexar Laudo de Engenharia/TI
              </label>
              {laudoNome && <span className="font-mono text-primary text-xs truncate max-w-xs">{laudoNome}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">5. Fotos da Avaria / Evidências Físicas</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                multiple
                id="fileFotos"
                onChange={(e) => setFotosCount(e.target.files?.length || 0)}
                className="hidden"
              />
              <label
                htmlFor="fileFotos"
                className="h-9 px-3 rounded border border-input bg-background/60 hover:bg-muted text-muted-foreground font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-primary" /> Anexar Fotos do Bem
              </label>
              {fotosCount > 0 && <span className="font-mono text-primary text-xs">{fotosCount} foto(s) anexada(s)</span>}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end pt-2 border-t border-border">
            <button
              type="submit"
              className="h-10 px-6 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <FileSpreadsheet className="h-4 w-4" /> Registrar Processo SISGEP & Solicitar Avaliação
            </button>
          </div>
        </form>
      </section>

      {/* HISTÓRICO DOS PROCESSOS DE AVALIAÇÃO (REL-MOD-18-01 a REL-MOD-18-03) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="p-4 border-b border-border/60 font-bold text-sm text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Processos de Avaliação Tramitados ({processos.length})
          </span>
          <span className="text-xs font-normal text-muted-foreground">Acompanhamento via Protocolo SISGEP</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Protocolo SISGEP</th>
                <th className="p-3">Data / Chapa</th>
                <th className="p-3">Descrição do Bem</th>
                <th className="p-3">Motivo Declarado</th>
                <th className="p-3">Status da Avaliação</th>
                <th className="p-3 text-right">Ação / Documento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {processos.map((item) => (
                <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">
                    <div>{item.protocoloSisgep}</div>
                    <span className="text-[10px] text-muted-foreground font-normal">{item.id}</span>
                  </td>

                  <td className="p-3 font-medium text-foreground">
                    <div className="font-mono text-primary font-bold">#{item.chapa}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.dataSolicitacao}</span>
                  </td>

                  <td className="p-3 font-semibold text-foreground">
                    <div>{item.descricaoBem}</div>
                    <span className="text-[10px] text-muted-foreground font-normal">{item.setor}</span>
                  </td>

                  <td className="p-3 font-medium text-foreground uppercase">
                    <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-bold">
                      {item.motivo}
                    </span>
                  </td>

                  <td className="p-3">
                    <StatusAvaliacaoBadge status={item.status} />
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewProcesso(item)}
                        title="Ver Detalhes e Pareceres"
                        className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {item.status === "aguardando_secretario" && (
                        <button
                          onClick={() => handleAprovarSecretario(item)}
                          title="Simular Assinatura Digital do Secretário (RF-MOD-18-05)"
                          className="px-2.5 py-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors text-[11px] font-bold inline-flex items-center gap-1 border border-success/30"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" /> Assinar & Efetivar
                        </button>
                      )}

                      {item.status === "baixa_efetivada" && (
                        <button
                          onClick={() => setTermoBaixaItem(item)}
                          title="Ver Termo de Baixa Patrimonial"
                          className="px-2.5 py-1 rounded bg-primary/15 text-primary hover:bg-primary/25 transition-colors text-[11px] font-bold inline-flex items-center gap-1 border border-primary/30"
                        >
                          <FileCheck className="h-3.5 w-3.5" /> Termo Baixa (PDF)
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL DETALHE DO PROCESSO (RF-MOD-18-04) */}
      {viewProcesso && (
        <Dialog open={!!viewProcesso} onOpenChange={() => setViewProcesso(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" /> Processo {viewProcesso.protocoloSisgep}
              </DialogTitle>
              <DialogDescription>
                Detalhamento técnico da solicitação de avaliação.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <div><b>Bem:</b> #{viewProcesso.chapa} — {viewProcesso.descricaoBem}</div>
                <div><b>Solicitante:</b> {viewProcesso.responsavel} ({viewProcesso.setor})</div>
                <div><b>Motivo:</b> <span className="uppercase font-bold">{viewProcesso.motivo}</span></div>
                <div className="text-muted-foreground mt-1"><b>Justificativa:</b> "{viewProcesso.justificativa}"</div>
              </div>

              {viewProcesso.parecerComissao && (
                <div className="p-3 bg-primary/10 border border-primary/30 text-foreground rounded-lg">
                  <div className="font-bold text-primary">Parecer da Comissão de Avaliação:</div>
                  <div>{viewProcesso.parecerComissao}</div>
                </div>
              )}

              {viewProcesso.secretarioAprovador && (
                <div className="p-2.5 bg-success/15 border border-success/30 text-success rounded-lg font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Aprovado por: {viewProcesso.secretarioAprovador}
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL TERMO DE BAIXA PATRIMONIAL PDF (RF-MOD-18-07 / RF-MOD-18-08) */}
      {termoBaixaItem && (
        <Dialog open={!!termoBaixaItem} onOpenChange={() => setTermoBaixaItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-success">
                <FileCheck className="h-5 w-5" /> Termo Oficial de Baixa Patrimonial (PDF)
              </DialogTitle>
              <DialogDescription>
                Documento de efetivação da baixa assinado pelo Secretário da Pasta.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-800 flex flex-col gap-2 font-mono">
                <div className="text-[10px] text-slate-400 font-sans">Prefeitura de Santana de Parnaíba</div>
                <div className="text-sm font-bold text-rose-400">TERMO DE BAIXA PATRIMONIAL DEFINITIVA</div>
                <div className="text-[11px] text-slate-300">Protocolo SISGEP: {termoBaixaItem.protocoloSisgep}</div>
                <div className="text-[11px] text-slate-300">Bem Baixado: #{termoBaixaItem.chapa} — {termoBaixaItem.descricaoBem}</div>
                <div className="text-[11px] text-slate-300">Motivo Legal: {termoBaixaItem.motivo.toUpperCase()}</div>
                <div className="text-[11px] text-slate-300">Autoridade Aprovadora: {termoBaixaItem.secretarioAprovador}</div>
                <div className="text-[9px] text-slate-500 border-t border-slate-800 pt-2 break-all">
                  Hash de Assinatura Digital: {termoBaixaItem.hashAssinatura || "8a4f91b2c0199e83017a022419a4ff11"}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setTermoBaixaItem(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert("Termo de Baixa Patrimonial baixado em PDF!");
                    setTermoBaixaItem(null);
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

function StatusAvaliacaoBadge({ status }: { status: StatusProcessoAvaliacao }) {
  const map: Record<StatusProcessoAvaliacao, { label: string; cls: string }> = {
    em_analise_comissao: { label: "⏳ Análise da Comissão", cls: "bg-warning/20 text-warning border-warning/40 font-bold" },
    aguardando_secretario: { label: "🖊️ Aguardando Secretário", cls: "bg-primary/20 text-primary border-primary/40 font-bold" },
    baixa_efetivada: { label: "🔴 Baixa Efetivada", cls: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold" },
    rejeitado: { label: "⚪ Pedido Rejeitado", cls: "bg-muted text-muted-foreground border-border" },
  };
  const item = map[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
