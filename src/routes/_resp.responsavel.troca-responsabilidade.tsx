import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  UserMinus,
  UserPlus,
  Calendar,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  UserCheck,
  Download,
  Check,
  X,
  FileCheck,
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

export const Route = createFileRoute("/_resp/responsavel/troca-responsabilidade")({
  head: () => ({
    meta: [
      { title: "Troca de Responsabilidade (MOD-19) — Responsável" },
      {
        name: "description",
        content:
          "Solicite o desligamento ou substituição do responsável pelo setor com indicação de substituto e termo de transição.",
      },
    ],
  }),
  component: RespTrocaPage,
});

export type StatusTrocaResponsabilidade = "aguardando_chefia" | "em_conferencia" | "aprovada" | "efetivada" | "rejeitada";

export interface ItemTrocaResponsabilidade {
  id: string;
  protocolo: string;
  dataSolicitacao: string;
  setor: string;
  responsavelAtual: string;
  substitutoNome: string;
  substitutoProntuario: string;
  substitutoCargo: string;
  substitutoEmail: string;
  dataVigenciaEfetiva: string;
  motivoJustificativa: string;
  documentoAnexoUrl?: string;
  pendenciasAtivasCount: number;
  status: StatusTrocaResponsabilidade;
  hashAssinatura?: string;
}

const INITIAL_TROCAS: ItemTrocaResponsabilidade[] = [
  {
    id: "TRC-2026-001",
    protocolo: "TRC-2026-00812",
    dataSolicitacao: "2026-07-27 15:30",
    setor: "Departamento de Contabilidade e Patrimônio",
    responsavelAtual: "Neemias Oliveira",
    substitutoNome: "Mariana Souza Santos",
    substitutoProntuario: "PR-48912",
    substitutoCargo: "Analista de Patrimônio Pleno",
    substitutoEmail: "mariana.48912@santanadeparnaiba.sp.gov.br",
    dataVigenciaEfetiva: "2026-08-01",
    motivoJustificativa: "Transferência a pedido para a Secretaria de Finanças.",
    documentoAnexoUrl: "portaria_remanejamento_48912.pdf",
    pendenciasAtivasCount: 0,
    status: "aguardando_chefia",
  },
  {
    id: "TRC-2026-002",
    protocolo: "TRC-2026-00410",
    dataSolicitacao: "2026-07-10 10:00",
    setor: "Divisão de Almoxarifado Central",
    responsavelAtual: "Neemias Oliveira",
    substitutoNome: "João Roberto Mendes",
    substitutoProntuario: "PR-33102",
    substitutoCargo: "Chefe de Divisão",
    substitutoEmail: "joao.33102@santanadeparnaiba.sp.gov.br",
    dataVigenciaEfetiva: "2026-07-15",
    motivoJustificativa: "Reestruturação organizacional do setor.",
    documentoAnexoUrl: "oficio_oficial_transicao.pdf",
    pendenciasAtivasCount: 0,
    status: "efetivada",
    hashAssinatura: "f912a780bca11e992a0120260715efet",
  },
];

function RespTrocaPage() {
  const session = getRespAuthSession();
  const setorAtual = session?.unidadeNome || session?.setor || "Departamento de Contabilidade e Patrimônio";
  const responsavelAtual = session?.responsavelNome || session?.responsavel || "Neemias Oliveira";

  const [trocas, setTrocas] = useState<ItemTrocaResponsabilidade[]>(INITIAL_TROCAS);

  // Form State (RF-MOD-19-01 a RF-MOD-19-04)
  const [substitutonome, setSubstitutoNome] = useState("");
  const [substitutoprontuario, setSubstitutoProntuario] = useState("");
  const [substitutocargo, setSubstitutoCargo] = useState("");
  const [substitutoemail, setSubstitutoEmail] = useState("");
  const [dataVigencia, setDataVigencia] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState("");
  const [anexoNome, setAnexoNome] = useState("");
  const [successProtocol, setSuccessProtocol] = useState<string | null>(null);

  // Modais
  const [termoTransitoItem, setTermoTransitoItem] = useState<ItemTrocaResponsabilidade | null>(null);

  const kpis = useMemo(
    () => [
      { label: "Solicitações de Troca em Andamento", value: String(trocas.filter((t) => t.status !== "efetivada" && t.status !== "rejeitada").length) },
      { label: "Trocas Efetivadas", value: String(trocas.filter((t) => t.status === "efetivada").length) },
      { label: "Pendências Ativas de Guarda", value: "0 pendências" },
      { label: "Total de Processos de Transição", value: String(trocas.length) },
    ],
    [trocas]
  );

  const handleCreateTroca = (e: React.FormEvent) => {
    e.preventDefault();
    if (!substitutonome.trim() || !substitutoprontuario.trim()) {
      alert("Informe o nome e o prontuário do substituto.");
      return;
    }
    if (!motivo.trim()) {
      alert("Informe a justificativa ou motivo da troca de responsabilidade.");
      return;
    }

    const newProt = `TRC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const dataHora = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const newTroca: ItemTrocaResponsabilidade = {
      id: `TRC-2026-00${trocas.length + 1}`,
      protocolo: newProt,
      dataSolicitacao: dataHora,
      setor: setorAtual,
      responsavelAtual: responsavelAtual,
      substitutoNome: substitutonome.trim(),
      substitutoProntuario: substitutoprontuario.trim(),
      substitutoCargo: substitutocargo.trim() || "Servidor Designado",
      substitutoEmail: substitutoemail.trim() || `${substitutoprontuario.toLowerCase()}@santanadeparnaiba.sp.gov.br`,
      dataVigenciaEfetiva: dataVigencia,
      motivoJustificativa: motivo.trim(),
      documentoAnexoUrl: anexoNome ? `anexo_${newProt}.pdf` : undefined,
      pendenciasAtivasCount: 0,
      status: "aguardando_chefia",
    };

    setTrocas([newTroca, ...trocas]);
    setSuccessProtocol(newProt);
    setSubstitutoNome("");
    setSubstitutoProntuario("");
    setSubstitutoCargo("");
    setSubstitutoEmail("");
    setMotivo("");
    setAnexoNome("");
  };

  // Simulação de Aprovação da Chefia (RF-MOD-19-05 & RF-MOD-19-07)
  const handleAprovarChefia = (troca: ItemTrocaResponsabilidade) => {
    const hash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setTrocas((prev) =>
      prev.map((t) => (t.id === troca.id ? { ...t, status: "efetivada", hashAssinatura: hash } : t))
    );
    setTermoTransitoItem({ ...troca, status: "efetivada", hashAssinatura: hash });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Troca de Responsabilidade Patrimonial (MOD-19)"
        description="Formalize a transferência da carga de bens do setor para um novo responsável, com checagem de pendências e emissão de termo de guarda."
        crumbs={[{ label: "Responsável", to: "/responsavel" }, { label: "Troca de Responsabilidade" }]}
      />

      <KPIGrid items={kpis} />

      {/* AVISO LEGAL DE TRANSIÇÃO (RN-MOD-19-01 / RN-MOD-19-03) */}
      <div className="glass-card p-4 border border-primary/40 bg-primary/10 flex gap-3 text-xs text-foreground">
        <UserCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-primary font-bold">Garantia de Guarda Ininterrupta (RN-MOD-19-01 & RN-MOD-19-03):</strong>
          <p className="mt-0.5 text-muted-foreground">
            A troca de responsabilidade exige a conferência prévia do inventário e das pendências ativas.
            O acesso e a responsabilidade civil/administrativa sobre os bens só serão transferidos na <b>Data Efetiva de Vigência</b> após aprovação formal da Chefia Imediata.
          </p>
        </div>
      </div>

      {/* FEEDBACK DE SOLICITAÇÃO */}
      {successProtocol && (
        <div className="p-4 bg-success/20 border border-success/40 rounded-xl text-success font-semibold text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Solicitação de Troca de Responsabilidade registrada com sucesso! <b>Protocolo: {successProtocol}</b>. Aguardando validação da Chefia.</span>
          </div>
          <button onClick={() => setSuccessProtocol(null)} className="text-xs underline">Fechar</button>
        </div>
      )}

      {/* FORMULÁRIO DE TROCA DE RESPONSÁVEL (RF-MOD-19-01 a RF-MOD-19-04) */}
      <section className="glass-card p-5 border border-border/60">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-foreground border-b border-border pb-3">
          <UserPlus className="h-4 w-4 text-primary" />
          <span>Indicar Novo Responsável Substituto</span>
        </div>

        <form onSubmit={handleCreateTroca} className="grid gap-4 md:grid-cols-2 text-xs">
          {/* DADOS DO RESPONSÁVEL ATUAL (ESTÁTICO) */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
            <div className="font-bold text-foreground">Setor Atual: {setorAtual}</div>
            <div className="text-muted-foreground">Responsável Vigente: <b>{responsavelAtual}</b></div>
            <div className="text-[11px] text-emerald-400 font-mono font-bold mt-1">
              ✓ 0 Pendências Ativas de Inventário no Setor
            </div>
          </div>

          {/* DATA DA VIGÊNCIA EFETIVA (RF-MOD-19-03) */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">Data Desejada para Vigência Efetiva *</label>
            <input
              type="date"
              required
              value={dataVigencia}
              onChange={(e) => setDataVigencia(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
            />
          </div>

          {/* DADOS DO SUBSTITUTO (RF-MOD-19-02) */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">Nome Completo do Substituto *</label>
            <input
              required
              placeholder="Ex: Mariana Souza Santos"
              value={substitutonome}
              onChange={(e) => setSubstitutoNome(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">Prontuário / Matrícula *</label>
            <input
              required
              placeholder="Ex: PR-48912"
              value={substitutoprontuario}
              onChange={(e) => setSubstitutoProntuario(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">Cargo / Função Oficial *</label>
            <input
              required
              placeholder="Ex: Analista de Patrimônio Pleno"
              value={substitutocargo}
              onChange={(e) => setSubstitutoCargo(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">E-mail Institutional do Substituto *</label>
            <input
              type="email"
              required
              placeholder="Ex: mariana.48912@santanadeparnaiba.sp.gov.br"
              value={substitutoemail}
              onChange={(e) => setSubstitutoEmail(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs"
            />
          </div>

          {/* MOTIVO E ANEXO (RF-MOD-19-04) */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="font-bold text-foreground">Motivo / Justificativa da Troca de Responsabilidade *</label>
            <textarea
              required
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Informe a justificativa oficial (ex: Exoneração a pedido, remanejamento de unidade, nomeação de novo chefe...)"
              className="p-2.5 rounded-md border border-input bg-background/60 text-xs"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="font-bold text-foreground">Documento / Portaria de Remanejamento Anexo (Opcional)</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="fileAnexoTroca"
                onChange={(e) => setAnexoNome(e.target.files?.[0]?.name || "")}
                className="hidden"
              />
              <label
                htmlFor="fileAnexoTroca"
                className="h-9 px-3 rounded border border-input bg-background/60 hover:bg-muted text-muted-foreground font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Paperclip className="h-3.5 w-3.5 text-primary" /> Anexar Documento PDF
              </label>
              {anexoNome && <span className="font-mono text-primary text-xs">{anexoNome}</span>}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end pt-2 border-t border-border">
            <button
              type="submit"
              className="h-10 px-6 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <UserPlus className="h-4 w-4" /> Registrar Solicitação de Troca
            </button>
          </div>
        </form>
      </section>

      {/* HISTÓRICO DE TROCAS DE RESPONSABILIDADE (REL-MOD-19-01 a REL-MOD-19-03) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="p-4 border-b border-border/60 font-bold text-sm text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Processos de Transição de Guarda ({trocas.length})
          </span>
          <span className="text-xs font-normal text-muted-foreground">Histórico de saídas e nomeações de responsáveis</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Protocolo</th>
                <th className="p-3">Data Solicitação</th>
                <th className="p-3">Responsável Atual</th>
                <th className="p-3">Substituto Designado</th>
                <th className="p-3">Data Vigência Efetiva</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação / Termo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {trocas.map((item) => (
                <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{item.protocolo}</td>

                  <td className="p-3 font-mono text-muted-foreground">{item.dataSolicitacao}</td>

                  <td className="p-3 font-semibold text-foreground">{item.responsavelAtual}</td>

                  <td className="p-3 font-semibold text-foreground">
                    <div>{item.substitutoNome}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {item.substitutoProntuario} · {item.substitutoCargo}
                    </span>
                  </td>

                  <td className="p-3 font-mono font-bold text-primary">{item.dataVigenciaEfetiva}</td>

                  <td className="p-3">
                    <StatusTrocaBadge status={item.status} />
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === "aguardando_chefia" && (
                        <button
                          onClick={() => handleAprovarChefia(item)}
                          title="Simular Aprovação da Chefia (RF-MOD-19-05)"
                          className="px-2.5 py-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors text-[11px] font-bold inline-flex items-center gap-1 border border-success/30"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" /> Aprovar Transição
                        </button>
                      )}

                      {item.status === "efetivada" && (
                        <button
                          onClick={() => setTermoTransitoItem(item)}
                          title="Ver Termo de Transição e Guarda Patrimonial"
                          className="px-2.5 py-1 rounded bg-primary/15 text-primary hover:bg-primary/25 transition-colors text-[11px] font-bold inline-flex items-center gap-1 border border-primary/30"
                        >
                          <FileCheck className="h-3.5 w-3.5" /> Termo Transição (PDF)
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

      {/* MODAL TERMO DE TRANSIÇÃO E GUARDA PATRIMONIAL PDF (RF-MOD-19-07) */}
      {termoTransitoItem && (
        <Dialog open={!!termoTransitoItem} onOpenChange={() => setTermoTransitoItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-success">
                <FileCheck className="h-5 w-5" /> Termo de Transição e Guarda Patrimonial (PDF)
              </DialogTitle>
              <DialogDescription>
                Documento formal de encerramento e assunção de carga patrimonial.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-800 flex flex-col gap-2 font-mono">
                <div className="text-[10px] text-slate-400 font-sans">Prefeitura de Santana de Parnaíba</div>
                <div className="text-sm font-bold text-emerald-400">TERMO DE TRANSIÇÃO DE GUARDA E CARGA</div>
                <div className="text-[11px] text-slate-300">Protocolo: {termoTransitoItem.protocolo}</div>
                <div className="text-[11px] text-slate-300">Setor: {termoTransitoItem.setor}</div>
                <div className="text-[11px] text-slate-300">Sainte (Cedente): {termoTransitoItem.responsavelAtual}</div>
                <div className="text-[11px] text-slate-300">Entrante (Substituto): {termoTransitoItem.substitutoNome} ({termoTransitoItem.substitutoProntuario})</div>
                <div className="text-[11px] text-slate-300">Data de Vigência Efetiva: {termoTransitoItem.dataVigenciaEfetiva}</div>
                <div className="text-[9px] text-slate-500 border-t border-slate-800 pt-2 break-all">
                  Hash de Assinatura Eletrônica: {termoTransitoItem.hashAssinatura || "f912a780bca11e992a0120260715efet"}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setTermoTransitoItem(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert("Termo de Transição e Guarda baixado em PDF!");
                    setTermoTransitoItem(null);
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

function StatusTrocaBadge({ status }: { status: StatusTrocaResponsabilidade }) {
  const map: Record<StatusTrocaResponsabilidade, { label: string; cls: string }> = {
    aguardando_chefia: { label: "⏳ Aguardando Chefia", cls: "bg-warning/20 text-warning border-warning/40 font-bold" },
    em_conferencia: { label: "🔍 Em Conferência", cls: "bg-primary/20 text-primary border-primary/40 font-bold" },
    aprovada: { label: "🔵 Aprovada", cls: "bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold" },
    efetivada: { label: "🟢 Efetivada / Ativa", cls: "bg-success/20 text-success border-success/40 font-bold" },
    rejeitada: { label: "⚪ Rejeitada", cls: "bg-muted text-muted-foreground border-border" },
  };
  const item = map[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
