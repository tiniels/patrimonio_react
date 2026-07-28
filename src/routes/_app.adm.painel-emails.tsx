import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Mail,
  Send,
  RefreshCw,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Paperclip,
  Users,
  Eye,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Inbox,
  XCircle,
  FileCode,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/painel-emails")({
  head: () => ({
    meta: [
      { title: "Painel de E-mails e Comunicações (MOD-31) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Gestão transacional de e-mails: templates versionados, envio por regra de escopo, anexos PDF, fila com retentativa backoff e relatórios de entrega.",
      },
    ],
  }),
  component: AdmPainelEmailsPage,
});

export type StatusEnvioEmail = "entregue" | "processando" | "bounce_soft" | "bounce_hard" | "falha_retentando";

export interface TemplateEmail {
  idTemplate: string;
  nome: string;
  assunto: string;
  versao: number;
  variaveisDisponiveis: string[];
  corpoHtml: string;
}

export interface RegistroMensagemEmail {
  idMensagem: string;
  protocoloProcesso: string;
  destinatarioNome: string;
  destinatarioEmail: string;
  assunto: string;
  anexoPdfNome?: string;
  dataEnvio: string;
  status: StatusEnvioEmail;
  tentativas: number;
  proximaRetentativa?: string;
  erroLogSanitizado?: string;
}

const MOCK_TEMPLATES: TemplateEmail[] = [
  {
    idTemplate: "TPL-INV-PENDENTE",
    nome: "Notificação de Inventário Pendente",
    assunto: "Aviso: Inventário Patrimonial Pendente de Confirmação — {setor}",
    versao: 2,
    variaveisDisponiveis: ["{nome}", "{setor}", "{prazo}", "{link_inventario}"],
    corpoHtml: `Olá {nome},\n\nConstamos que o inventário patrimonial da unidade {setor} encontra-se pendente de confirmação.\nPor favor, acesse o sistema no prazo limite de {prazo} para assinar o termo.\n\nLink de Acesso: {link_inventario}`,
  },
  {
    idTemplate: "TPL-TERMO-TRANSF",
    nome: "Termo de Transferência Disponível",
    assunto: "Termo Oficial de Transferência de Bens — Protocolo {protocolo}",
    versao: 1,
    variaveisDisponiveis: ["{nome}", "{protocolo}", "{origem}", "{destino}", "{chapa}"],
    corpoHtml: `Prezado(a) {nome},\n\nO Termo de Transferência para a chapa {chapa} ({origem} -> {destino}) foi assinado e encontra-se disponível em anexo.\n\nAtenciosamente,\nDiretoria de Patrimônio`,
  },
  {
    idTemplate: "TPL-COMP-RETIRADA",
    nome: "Comprovante de Retirada de Material",
    assunto: "Comprovante de Retirada de Material do Galpão — {protocolo}",
    versao: 3,
    variaveisDisponiveis: ["{nome}", "{protocolo}", "{setor}", "{hash_pdf}"],
    corpoHtml: `Olá {nome},\n\nSua retirada de material (Protocolo {protocolo}) foi concluída no depósito. O comprovante oficial com hash SHA-256 {hash_pdf} está anexado a esta mensagem.`,
  },
];

const MOCK_MENSAGENS: RegistroMensagemEmail[] = [
  {
    idMensagem: "MSG-2026-8801",
    protocoloProcesso: "INV-2026-042",
    destinatarioNome: "Dra. Helena Castro",
    destinatarioEmail: "helena.castro@saude.gov.br",
    assunto: "Aviso: Inventário Patrimonial Pendente de Confirmação — Almoxarifado Central",
    anexoPdfNome: "Relatorio_Pendencias_Saude.pdf",
    dataEnvio: "2026-07-28 14:10",
    status: "entregue",
    tentativas: 1,
  },
  {
    idMensagem: "MSG-2026-8802",
    protocoloProcesso: "TRF-2026-019",
    destinatarioNome: "Alexandre Santos",
    destinatarioEmail: "alexandre.santos@educacao.gov.br",
    assunto: "Termo Oficial de Transferência de Bens — Protocolo TRF-2026-019",
    anexoPdfNome: "Termo_Transferencia_TRF-2026-019.pdf",
    dataEnvio: "2026-07-28 14:25",
    status: "falha_retentando",
    tentativas: 2,
    proximaRetentativa: "2026-07-28 14:35 (Backoff Exponencial)",
    erroLogSanitizado: "SMTP 451 4.4.0 Timeout de resposta do servidor de e-mail de destino (Sem exibição de senhas - RN-MOD-31-05).",
  },
  {
    idMensagem: "MSG-2026-8803",
    protocoloProcesso: "RET-2026-039",
    destinatarioNome: "Carlos Eduardo",
    destinatarioEmail: "carlos.inexistente@dominio-inv.gov.br",
    assunto: "Comprovante de Retirada de Material do Galpão — RET-2026-039",
    anexoPdfNome: "Comprovante_RET-2026-039.pdf",
    dataEnvio: "2026-07-27 16:00",
    status: "bounce_hard",
    tentativas: 3,
    erroLogSanitizado: "SMTP 550 5.1.1 Caixa postal de destino não encontrada (Hard Bounce).",
  },
];

function AdmPainelEmailsPage() {
  const [templates, setTemplates] = useState<TemplateEmail[]>(MOCK_TEMPLATES);
  const [mensagens, setMensagens] = useState<RegistroMensagemEmail[]>(MOCK_MENSAGENS);
  const [qSearch, setQSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"fila" | "templates" | "bounces" | "disparo_massa">("fila");

  // Modal Prévia de Template (RF-MOD-31-02)
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<TemplateEmail | null>(null);

  // Modal Disparo em Massa por Regra (RF-MOD-31-03 / RN-MOD-31-03)
  const [regraDisparo, setRegraDisparo] = useState("pendentes_inventario");
  const [templateDisparo, setTemplateDisparo] = useState("TPL-INV-PENDENTE");

  const filteredMensagens = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return mensagens.filter((m) => {
      if (!t) return true;
      return (
        m.destinatarioNome.toLowerCase().includes(t) ||
        m.destinatarioEmail.toLowerCase().includes(t) ||
        m.protocoloProcesso.toLowerCase().includes(t) ||
        m.assunto.toLowerCase().includes(t)
      );
    });
  }, [mensagens, qSearch]);

  const kpis = useMemo(
    () => [
      { label: "Total de Comunicações Enviadas", value: `${mensagens.length} mensagens` },
      { label: "Entregues com Sucesso", value: `${mensagens.filter((m) => m.status === "entregue").length} entregas` },
      { label: "Fila em Retentativa (Backoff - RN-MOD-31-04)", value: `${mensagens.filter((m) => m.status === "falha_retentando").length} falhas` },
      { label: "Bounces e Caixas Inexistentes", value: `${mensagens.filter((m) => m.status === "bounce_hard" || m.status === "bounce_soft").length} erros` },
    ],
    [mensagens]
  );

  // Reenviar com Backoff Exponencial (RF-MOD-31-06 / RN-MOD-31-04)
  const handleReenviarComBackoff = (idMensagem: string) => {
    setMensagens((prev) =>
      prev.map((m) => {
        if (m.idMensagem === idMensagem) {
          return {
            ...m,
            status: "entregue",
            tentativas: m.tentativas + 1,
            proximaRetentativa: undefined,
            erroLogSanitizado: undefined,
          };
        }
        return m;
      })
    );
  };

  const handleDispararMassaRegra = (e: React.FormEvent) => {
    e.preventDefault();
    const tpl = templates.find((t) => t.idTemplate === templateDisparo);

    const novaMensagem: RegistroMensagemEmail = {
      idMensagem: `MSG-2026-${Math.floor(9000 + Math.random() * 900)}`,
      protocoloProcesso: "NOT-MASSA-2026",
      destinatarioNome: "Envio por Regra: " + regraDisparo.toUpperCase(),
      destinatarioEmail: "destinatarios.regra@saude.gov.br",
      assunto: tpl ? tpl.assunto : "Comunicação Transacional",
      anexoPdfNome: "Documento_Oficial_Anexo.pdf",
      dataEnvio: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      status: "entregue",
      tentativas: 1,
    };

    setMensagens([novaMensagem, ...mensagens]);
    setActiveTab("fila");
  };

  const exportRelatorioEmailsCsv = () => {
    const headers = ["IDMensagem", "Protocolo", "DestinatarioNome", "DestinatarioEmail", "Assunto", "AnexoPDF", "DataEnvio", "Status", "Tentativas"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const m of filteredMensagens) {
      lines.push(
        [
          escape(m.idMensagem),
          escape(m.protocoloProcesso),
          escape(m.destinatarioNome),
          escape(m.destinatarioEmail),
          escape(m.assunto),
          escape(m.anexoPdfNome || ""),
          escape(m.dataEnvio),
          escape(m.status),
          m.tentativas,
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-emails-transacionais-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel de E-mails e Comunicações (MOD-31)"
        description="Gestão transacional de e-mails: templates versionados, envios por regras de escopo, anexos PDF automáticos, fila com retentativa backoff e monitor de bounces."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Comunicações" }, { label: "Painel de E-mails" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={exportRelatorioEmailsCsv}
              className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar Relatório (CSV)
            </button>
            <button
              onClick={() => setActiveTab("disparo_massa")}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Send className="h-4 w-4" /> Envio por Regra / Escopo
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* ABAS DE NAVEGAÇÃO DO PAINEL */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("fila")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "fila"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📨 Fila Transacional & Status ({mensagens.length})
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "templates"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📑 Templates Versionados ({templates.length})
        </button>

        <button
          onClick={() => setActiveTab("bounces")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "bounces"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          ⚠️ Monitor de Bounces e Falhas ({mensagens.filter((m) => m.status.includes("bounce") || m.status.includes("falha")).length})
        </button>

        <button
          onClick={() => setActiveTab("disparo_massa")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "disparo_massa"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          🚀 Disparo por Regra de Escopo (RN-MOD-31-03)
        </button>
      </div>

      {/* ABA 1: FILA TRANSACIONAL (RF-MOD-31-05 / RF-MOD-31-08) */}
      {activeTab === "fila" && (
        <div className="space-y-4">
          <section className="glass-card p-4 border border-border/60">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                placeholder="Buscar por destinatário, e-mail, protocolo de processo ou assunto..."
                className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
              />
            </div>
          </section>

          <section className="glass-card p-0 overflow-hidden border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
                  <tr>
                    <th className="p-3">ID Mensagem / Data</th>
                    <th className="p-3">Destinatário & Processo</th>
                    <th className="p-3">Assunto & Anexos PDF</th>
                    <th className="p-3 text-center">Tentativas (RN-MOD-31-04)</th>
                    <th className="p-3">Status de Entrega</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredMensagens.map((m) => (
                    <tr key={m.idMensagem} className="hover:bg-accent/10 transition-colors">
                      <td className="p-3 font-semibold text-foreground">
                        <div className="font-mono font-bold text-primary">{m.idMensagem}</div>
                        <span className="text-[10px] text-muted-foreground">{m.dataEnvio}</span>
                      </td>

                      <td className="p-3 font-semibold text-foreground">
                        <div>{m.destinatarioNome}</div>
                        <span className="text-[10px] font-mono text-muted-foreground">{m.destinatarioEmail}</span>
                        <div className="text-[9px] text-primary font-mono font-bold">Proc.: {m.protocoloProcesso}</div>
                      </td>

                      <td className="p-3 font-medium text-foreground">
                        <div className="truncate max-w-[260px] font-semibold" title={m.assunto}>{m.assunto}</div>
                        {m.anexoPdfNome && (
                          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 font-mono mt-0.5">
                            <Paperclip className="h-3 w-3 text-primary" /> {m.anexoPdfNome}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono font-bold">
                          {m.tentativas}x
                        </span>
                      </td>

                      <td className="p-3">
                        <StatusEmailBadge status={m.status} />
                      </td>

                      <td className="p-3 text-right">
                        {m.status === "falha_retentando" && (
                          <button
                            onClick={() => handleReenviarComBackoff(m.idMensagem)}
                            title="Reenviar com Backoff Exponencial"
                            className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[10px] hover:opacity-90 inline-flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" /> Reenviar
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
      )}

      {/* ABA 2: TEMPLATES VERSIONADOS & PRÉVIA (RF-MOD-31-01 / RF-MOD-31-02 / RN-MOD-31-02) */}
      {activeTab === "templates" && (
        <section className="glass-card p-5 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Templates de E-mail Versionados (RN-MOD-31-02)</h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">3 templates publicados</span>
          </div>

          <div className="grid gap-4 md:grid-cols-3 text-xs">
            {templates.map((tpl) => (
              <div key={tpl.idTemplate} className="p-4 bg-background border border-border rounded-xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-primary">{tpl.idTemplate}</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px] font-bold">
                      v{tpl.versao}
                    </span>
                  </div>

                  <h4 className="font-bold text-foreground text-xs">{tpl.nome}</h4>
                  <p className="text-[11px] text-muted-foreground italic line-clamp-2">"{tpl.assunto}"</p>

                  <div className="space-y-1 pt-2 border-t border-border/50">
                    <span className="text-[10px] font-bold text-foreground">Variáveis Interpoladas:</span>
                    <div className="flex flex-wrap gap-1">
                      {tpl.variaveisDisponiveis.map((v) => (
                        <span key={v} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[9px]">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <button
                    onClick={() => setSelectedPreviewTemplate(tpl)}
                    className="w-full h-8 rounded bg-muted hover:bg-muted/80 text-foreground font-bold text-xs inline-flex items-center justify-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" /> Prévia Interativa de E-mail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABA 3: MONITOR DE BOUNCES E FALHAS (RF-MOD-31-07 / RN-MOD-31-05) */}
      {activeTab === "bounces" && (
        <section className="glass-card p-5 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <h3 className="font-bold text-sm text-foreground">Monitoramento de Bounces & Falhas Transitórias</h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">✓ Logs Sanitizados (RN-MOD-31-05)</span>
          </div>

          <div className="space-y-3 text-xs">
            {mensagens
              .filter((m) => m.status.includes("bounce") || m.status.includes("falha"))
              .map((m) => (
                <div key={m.idMensagem} className="p-4 bg-background border border-border rounded-xl space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="font-mono text-primary">{m.idMensagem} — Proc.: {m.protocoloProcesso}</span>
                    <StatusEmailBadge status={m.status} />
                  </div>

                  <div><b>Destinatário:</b> {m.destinatarioNome} ({m.destinatarioEmail})</div>
                  <div><b>Assunto:</b> {m.assunto}</div>

                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg space-y-1">
                    <div className="font-bold text-rose-300">Log de Erro SMTP (Sanitizado):</div>
                    <p className="font-mono text-[11px] text-rose-200">{m.erroLogSanitizado}</p>
                  </div>

                  {m.proximaRetentativa && (
                    <div className="text-[11px] text-amber-300 font-semibold">
                      ⏱ Próxima Retentativa Automática: {m.proximaRetentativa}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ABA 4: DISPARO POR REGRA DE ESCOPO (RF-MOD-31-03 / RN-MOD-31-03) */}
      {activeTab === "disparo_massa" && (
        <section className="glass-card p-6 border border-border/60 max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Disparo de E-mail por Regra de Escopo</h3>
          </div>

          <form onSubmit={handleDispararMassaRegra} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-foreground">Regra de Seleção de Destinatários (RN-MOD-31-03)</label>
              <select
                value={regraDisparo}
                onChange={(e) => setRegraDisparo(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
              >
                <option value="pendentes_inventario">Todos os Responsáveis com Inventário Pendente</option>
                <option value="chefias_saude">Chefias da Secretaria de Saúde</option>
                <option value="operadores_galpao">Operadores do Galpão de Materiais</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Template de E-mail a ser Utilizado</label>
              <select
                value={templateDisparo}
                onChange={(e) => setTemplateDisparo(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
              >
                {templates.map((t) => (
                  <option key={t.idTemplate} value={t.idTemplate}>
                    {t.nome} (v{t.versao})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-muted/40 border border-border rounded-lg text-[11px] space-y-1 text-muted-foreground">
              <div>• <b>Opt-out & Limites:</b> O envio respeita descadastramentos e os limites de taxa por hora (RN-MOD-31-03).</div>
              <div>• <b>Anexos Automáticos:</b> O documento PDF do processo será anexado individualmente a cada e-mail.</div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveTab("fila")}
                className="px-4 py-2 rounded-md border border-input bg-background font-bold hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-sm"
              >
                Iniciar Disparo da Fila
              </button>
            </div>
          </form>
        </section>
      )}

      {/* MODAL PRÉVIA DE TEMPLATE (RF-MOD-31-02) */}
      {selectedPreviewTemplate && (
        <Dialog open={!!selectedPreviewTemplate} onOpenChange={() => setSelectedPreviewTemplate(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Eye className="h-5 w-5" /> Prévia de E-mail — {selectedPreviewTemplate.nome} (v{selectedPreviewTemplate.versao})
              </DialogTitle>
              <DialogDescription>
                Visualização do e-mail com variáveis simuladas.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-background border border-border rounded-lg space-y-1">
                <div><b>Assunto:</b> {selectedPreviewTemplate.assunto}</div>
                <div><b>De:</b> patrimonio@municipio.gov.br</div>
                <div><b>Para:</b> dra.helena@saude.gov.br</div>
              </div>

              <div className="p-4 bg-muted/30 border border-border rounded-lg font-mono text-[11px] whitespace-pre-wrap leading-relaxed text-foreground">
                {selectedPreviewTemplate.corpoHtml
                  .replace("{nome}", "Dra. Helena Castro")
                  .replace("{setor}", "Almoxarifado Central — Saúde")
                  .replace("{prazo}", "30/07/2026")
                  .replace("{protocolo}", "TRF-2026-019")
                  .replace("{chapa}", "PAT-2026-8801")
                  .replace("{link_inventario}", "http://localhost:8081/inventario/confirmer")
                  .replace("{hash_pdf}", "c7d8e94298fc1c149afbf4c8996fb924")}
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedPreviewTemplate(null)}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Fechar Prévia
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusEmailBadge({ status }: { status: StatusEnvioEmail }) {
  const map: Record<StatusEnvioEmail, { label: string; cls: string }> = {
    entregue: { label: "🟢 Entregue", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold" },
    processando: { label: "🟡 Na Fila de Envio", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold" },
    falha_retentando: { label: "🟠 Retentando (Backoff)", cls: "bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold" },
    bounce_soft: { label: "🔴 Soft Bounce", cls: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold" },
    bounce_hard: { label: "⛔ Hard Bounce (Inexistente)", cls: "bg-rose-700/20 text-rose-400 border-rose-700/40 font-bold" },
  };
  const item = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
