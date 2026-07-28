import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sparkles,
  Send,
  Download,
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  ShieldCheck,
  Search,
  FileText,
  PieChart,
  Table,
  CheckCircle2,
  HelpCircle,
  Clock,
  ExternalLink,
  Bot,
  User,
  Lock,
  RotateCcw,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";

export const Route = createFileRoute("/_app/adm/ia")({
  head: () => ({
    meta: [
      { title: "Assistente de IA para Consulta Patrimonial (MOD-32) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Assistente conversacional com processamento de linguagem natural, camada semântica com allowlist, respostas em gráficos/tabelas e bloqueio de escopo.",
      },
    ],
  }),
  component: AdmIAPage,
});

export interface MensagemChatIA {
  id: string;
  remetente: "usuario" | "ia";
  texto: string;
  timestamp: string;
  intencaoSemantica?: string;
  fonteCitacao?: string;
  dataCorte?: string;
  bloqueadoPorEscopo?: boolean;
  dadosTabela?: { chapa: string; descricao: string; setor: string; status: string; valor: string }[];
  dadosKpi?: { label: string; value: string; hint?: string }[];
  feedbackFornecido?: "util" | "nao_util";
}

const INITIAL_CHAT_MESSAGES: MensagemChatIA[] = [
  {
    id: "MSG-001",
    remetente: "ia",
    texto:
      "Olá! Sou o Assistente de Inteligência Patrimonial. Posso responder a dúvidas sobre localização de bens, pendências de inventário, materiais no galpão e termos de transferência através da nossa Camada Semântica Segura (sem SQL livre). Em que posso ajudar hoje?",
    timestamp: "14:00",
    dataCorte: "28/07/2026 14:00 (Camada Semântica Allowlist - RN-MOD-32-02)",
  },
];

const SUGGESTED_CHIPS = [
  "Quantos bens estão pendentes de inventário na Saúde?",
  "Listar itens sem movimentação no Galpão há > 180 dias",
  "Resumo dos bens de alto valor alocados na Educação",
  "Solicitar dados confidenciais fora do meu escopo (Teste Bloqueio)",
];

function AdmIAPage() {
  const [mensagens, setMensagens] = useState<MensagemChatIA[]>(INITIAL_CHAT_MESSAGES);
  const [inputQuery, setInputQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const kpis = useMemo(
    () => [
      { label: "Intenções Semânticas Permitidas", value: "32 consultas", hint: "Allowlist 100% segura (RN-MOD-32-02)" },
      { label: "Risco de SQL Injection / Livre", value: "0% (Bloqueado)", hint: "Zero SQL direto (RN-MOD-32-03)" },
      { label: "Consultas Realizadas na Sessão", value: `${mensagens.filter((m) => m.remetente === "usuario").length} perguntas` },
      { label: "Privacidade & Redação de PII", value: "Ativa (RN-MOD-32-05)", hint: "Dados sensíveis redigidos" },
    ],
    [mensagens]
  );

  const handleProcessarPergunta = (queryTexto: string) => {
    if (!queryTexto.trim()) return;

    const novaUserMsg: MensagemChatIA = {
      id: `USER-${Date.now()}`,
      remetente: "usuario",
      texto: queryTexto,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMensagens((prev) => [...prev, novaUserMsg]);
    setInputQuery("");
    setIsProcessing(true);

    setTimeout(() => {
      let respostaIA: MensagemChatIA;

      // DETECÇÃO DE TENTATIVA DE ACESSO FORA DO ESCOPO (RF-MOD-32-08 / RN-MOD-32-01 / RN-MOD-32-05)
      if (
        queryTexto.toLowerCase().includes("fora do meu escopo") ||
        queryTexto.toLowerCase().includes("folha") ||
        queryTexto.toLowerCase().includes("salário") ||
        queryTexto.toLowerCase().includes("senha")
      ) {
        respostaIA = {
          id: `IA-${Date.now()}`,
          remetente: "ia",
          texto:
            "⚠️ Solicitação Negada (Bloqueio de Segurança - RN-MOD-32-01): Seu perfil atual não possui autorização para consultar dados confidenciais ou fora do seu escopo de atribuição. A tentativa foi gravada no log de auditoria.",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          bloqueadoPorEscopo: true,
          intencaoSemantica: "INTENCAO_BLOQUEADA_PERMISSAO_NEGADA",
          dataCorte: "28/07/2026 14:00",
        };
      } else if (queryTexto.toLowerCase().includes("pendentes") || queryTexto.toLowerCase().includes("saúde")) {
        // RESPOSTA RICA PARA INVENTÁRIO NA SAÚDE (RF-MOD-32-03 / RF-MOD-32-04)
        respostaIA = {
          id: `IA-${Date.now()}`,
          remetente: "ia",
          texto:
            "Encontrei 42 bens patrimoniais com inventário pendente na Secretaria de Saúde (Almoxarifado Central e Hospital Municipal). Abaixo está o resumo consolidado e a listagem parcial:",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          intencaoSemantica: "CONSULTA_INVENTARIO_PENDENTE_SETOR",
          fonteCitacao: "[Fonte: Relatório Oficial REL-MOD-15 — Inventário Anual 2026]",
          dataCorte: "28/07/2026 14:00 (Dados Semânticos Reconciliados)",
          dadosKpi: [
            { label: "Bens Pendentes", value: "42 itens", hint: "Prazo: 30/07/2026" },
            { label: "Valor Consolidado", value: "R$ 184.500,00" },
            { label: "Índice de Conclusão", value: "78%" },
          ],
          dadosTabela: [
            { chapa: "PAT-2026-8801", descricao: "MONITOR LCD 27 IPS FULL HD DELL", setor: "Saúde / UTI", status: "Pendente", valor: "R$ 2.400,00" },
            { chapa: "PAT-2026-8802", descricao: "IMPRESSORA MULTIFUNCIONAL HP", setor: "Saúde / Recepção", status: "Pendente", valor: "R$ 1.800,00" },
            { chapa: "PAT-2026-8805", descricao: "NOBREAK 1500VA INTELBRAS", setor: "Saúde / TI", status: "Pendente", valor: "R$ 1.250,00" },
          ],
        };
      } else if (queryTexto.toLowerCase().includes("galpão") || queryTexto.toLowerCase().includes("180 dias")) {
        // RESPOSTA RICA PARA BENS SEM MOVIMENTAÇÃO NO GALPÃO
        respostaIA = {
          id: `IA-${Date.now()}`,
          remetente: "ia",
          texto:
            "Identifiquei 18 itens estocados no Galpão Principal sem nenhuma movimentação há mais de 180 dias. Isso representa R$ 34.200,00 imobilizados sem giro.",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          intencaoSemantica: "CONSULTA_GALPAO_ITENS_SEM_GIRO",
          fonteCitacao: "[Fonte: Módulo Galpão MOD-25 — Indicadores de Giro]",
          dataCorte: "28/07/2026 14:00",
          dadosKpi: [
            { label: "Itens sem Giro (>180d)", value: "18 materiais" },
            { label: "Tempo Médio em Estoque", value: "214 dias" },
          ],
          dadosTabela: [
            { chapa: "MAT-GAL-004", descricao: "LÂMPADA LED 50W INDUSTRIAL", setor: "Galpão / Prateleira B", status: "Sem Movimentação", valor: "R$ 85,00" },
            { chapa: "MAT-GAL-019", descricao: "CABO DE REDE CAT6 305M", setor: "Galpão / Prateleira D", status: "Sem Movimentação", valor: "R$ 450,00" },
          ],
        };
      } else {
        // RESPOSTA PADRÃO DA CAMADA SEMÂNTICA
        respostaIA = {
          id: `IA-${Date.now()}`,
          remetente: "ia",
          texto: `Processando a consulta "${queryTexto}" através da Camada Semântica. Todos os registros locais conferem com as regras de permissão do seu perfil.`,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          intencaoSemantica: "CONSULTA_GERAL_PATRIMONIO",
          fonteCitacao: "[Fonte: Base Central de Dados Patrimoniais]",
          dataCorte: "28/07/2026 14:00",
        };
      }

      setMensagens((prev) => [...prev, respostaIA]);
      setIsProcessing(false);
    }, 600);
  };

  const handleFeedback = (msgId: string, tipo: "util" | "nao_util") => {
    setMensagens((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedbackFornecido: tipo } : m))
    );
  };

  const exportUsoIaCsv = () => {
    const headers = ["ID", "Remetente", "TextoPerguntaResposta", "IntencaoSemantica", "FonteCitacao", "BloqueadoPorEscopo", "Timestamp"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const m of mensagens) {
      lines.push(
        [
          escape(m.id),
          escape(m.remetente),
          escape(m.texto.slice(0, 100)),
          escape(m.intencaoSemantica || ""),
          escape(m.fonteCitacao || ""),
          m.bloqueadoPorEscopo ? "SIM" : "NAO",
          escape(m.timestamp),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-uso-ia-patrimonial-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assistente de IA para Consulta Patrimonial (MOD-32)"
        description="Perguntas em linguagem natural convertidas via camada semântica com allowlist (zero SQL livre), respostas ricas em gráficos e tabelas, citações rastreáveis e bloqueio por escopo."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Inteligência Artificial" }, { label: "Consulta IA" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={exportUsoIaCsv}
              className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar Logs da IA (CSV)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* PAINEL PRINCIPAL DE CONVERSA COM A IA */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* COLUNA ESQUERDA: CHIPS DE SUGESTÃO & REGRAS DE SEGURANÇA (RF-MOD-32-05 / RN-MOD-32-02) */}
        <div className="space-y-4 lg:col-span-1">
          <section className="glass-card p-4 border border-border/60 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-foreground border-b border-border pb-2">
              <Sparkles className="h-4 w-4 text-primary" /> Perguntas Sugeridas (Chips)
            </div>

            <div className="space-y-2">
              {SUGGESTED_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleProcessarPergunta(chip)}
                  disabled={isProcessing}
                  className="w-full p-2.5 rounded-lg bg-background hover:bg-muted border border-border text-left text-xs font-semibold text-foreground transition-colors leading-tight"
                >
                  💡 {chip}
                </button>
              ))}
            </div>
          </section>

          <section className="glass-card p-4 border border-border/60 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground text-emerald-400">
              <ShieldCheck className="h-4 w-4" /> Camada Semântica Ativa
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              • <b>Sem SQL Livre:</b> Consultas são traduzidas para intenções pré-aprovadas (RN-MOD-32-02).<br />
              • <b>Preservação de Escopo:</b> A IA responde apenas com os dados que seu perfil pode ver (RN-MOD-32-01).
            </p>
          </section>
        </div>

        {/* COLUNA DIREITA: FEED DO CHAT CONVERSACIONAL (RF-MOD-32-01 a RF-MOD-32-07) */}
        <div className="lg:col-span-3">
          <div className="glass-card p-4 border border-border/60 flex flex-col h-[560px] bg-slate-950/40">
            {/* CORPO DE MENSAGENS */}
            <div className="flex-1 overflow-y-auto space-y-4 p-2 pr-3">
              {mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs ${
                    msg.remetente === "usuario" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.remetente === "ia" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 space-y-3 shadow-md ${
                      msg.remetente === "usuario"
                        ? "bg-primary text-primary-foreground font-semibold rounded-tr-none"
                        : msg.bloqueadoPorEscopo
                        ? "bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-tl-none"
                        : "bg-slate-900 border border-border text-foreground rounded-tl-none"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b border-border/40 pb-1.5">
                      <span className="font-bold">
                        {msg.remetente === "usuario" ? "Você" : "Assistente de IA Patrimonial"}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.texto}</p>

                    {/* COMPONENTES VISUAIS RICOS: KPIS (RF-MOD-32-03) */}
                    {msg.dadosKpi && (
                      <div className="grid gap-2 grid-cols-3 pt-2">
                        {msg.dadosKpi.map((kpi, kIdx) => (
                          <div key={kIdx} className="p-2.5 bg-slate-950 border border-border/60 rounded-lg">
                            <span className="text-[10px] text-muted-foreground font-semibold block">{kpi.label}</span>
                            <span className="text-sm font-extrabold text-primary">{kpi.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* COMPONENTES VISUAIS RICOS: TABELA DE DATOS (RF-MOD-32-03) */}
                    {msg.dadosTabela && (
                      <div className="border border-border/60 rounded-lg overflow-hidden pt-1">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-slate-950 font-semibold text-muted-foreground">
                            <tr>
                              <th className="p-2">Chapa</th>
                              <th className="p-2">Descrição</th>
                              <th className="p-2">Setor</th>
                              <th className="p-2">Status</th>
                              <th className="p-2 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 bg-slate-900/80">
                            {msg.dadosTabela.map((row, rIdx) => (
                              <tr key={rIdx}>
                                <td className="p-2 font-mono text-primary font-bold">{row.chapa}</td>
                                <td className="p-2 truncate max-w-[140px]">{row.descricao}</td>
                                <td className="p-2">{row.setor}</td>
                                <td className="p-2">
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px]">
                                    {row.status}
                                  </span>
                                </td>
                                <td className="p-2 text-right font-mono font-semibold">{row.valor}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* CITAÇÃO DE FONTES RASTREÁVEIS & CARIMBO DATA DE CORTE (RF-MOD-32-04 / RN-MOD-32-04) */}
                    {msg.fonteCitacao && (
                      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between text-[10px] text-muted-foreground gap-2">
                        <span className="font-bold text-primary">{msg.fonteCitacao}</span>
                        <span>{msg.dataCorte}</span>
                      </div>
                    )}

                    {/* FEEDBACK DO USUÁRIO (RF-MOD-32-06) */}
                    {msg.remetente === "ia" && !msg.bloqueadoPorEscopo && (
                      <div className="pt-2 flex justify-end items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">Esta resposta foi útil?</span>
                        <button
                          onClick={() => handleFeedback(msg.id, "util")}
                          className={`p-1 rounded border transition-colors ${
                            msg.feedbackFornecido === "util"
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                              : "border-input bg-background hover:bg-muted"
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, "nao_util")}
                          className={`p-1 rounded border transition-colors ${
                            msg.feedbackFornecido === "nao_util"
                              ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                              : "border-input bg-background hover:bg-muted"
                          }`}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.remetente === "usuario" && (
                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-primary font-semibold animate-pulse p-2">
                  <Bot className="h-4 w-4" /> Processando pergunta na Camada Semântica Segura...
                </div>
              )}
            </div>

            {/* ENTRADA DE TEXTO DA PERGUNTA (RF-MOD-32-01) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessarPergunta(inputQuery);
              }}
              className="flex gap-2 pt-3 border-t border-border mt-2"
            >
              <input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Digite sua dúvida em linguagem natural (Ex: 'Quais bens estão pendentes de inventário na Saúde?')..."
                className="flex-1 h-10 rounded-md border border-input bg-background/60 px-3 text-xs focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={isProcessing || !inputQuery.trim()}
                className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
