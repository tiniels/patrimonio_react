import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Webhook,
  Code2,
  Inbox,
  AlertTriangle,
  RefreshCw,
  Zap,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Send,
  Layers,
  FileCode,
  SlidersHorizontal,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações e Interoperabilidade (MOD-41) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "APIs versionadas OpenAPI v3, Webhooks assinados HMAC-SHA256, Transactional Outbox, Fila de Falhas DLQ, Circuit Breaker e idempotência.",
      },
    ],
  }),
  component: AdmIntegracoesPage,
});

export interface WebhookConfigItem {
  id: string;
  nome: string;
  urlDestino: string;
  eventoInscrito: string;
  status: "ATIVO" | "PAUSADO";
  secretMasked: string; // RN-MOD-41-02
  ultimoDisparo: string;
}

export interface OutboxMessageItem {
  idMessage: string;
  evento: string;
  payloadResumido: string;
  dataCriacao: string;
  status: "PENDENTE" | "ENVIADO" | "FALHA_DLQ";
  idempotencyKey: string; // RF-MOD-41-09
}

export interface DLQItem {
  idDlq: string;
  evento: string;
  erroMensagem: string;
  tentativas: number;
  dataFalha: string;
  idempotencyKey: string; // RF-MOD-41-09 / RN-MOD-41-04
}

export interface DeParaMappingItem {
  codigoLegado: string;
  descricaoLegado: string;
  codigoNovo: string;
  categoriaNova: string;
}

const INITIAL_WEBHOOKS: WebhookConfigItem[] = [
  {
    id: "WHK-01",
    nome: "Integração Contábil SIAFEM / Governo",
    urlDestino: "https://siafem.sp.gov.br/api/v1/patrimonio/outbox",
    eventoInscrito: "bem.incorporado",
    status: "ATIVO",
    secretMasked: "whsec_***9812a",
    ultimoDisparo: "Há 12 minutos (HTTP 200 OK)",
  },
  {
    id: "WHK-02",
    nome: "Sistema de Protocolo Unificado (SEI)",
    urlDestino: "https://sei.santana.sp.gov.br/webhooks/ateste",
    eventoInscrito: "termo.assinado",
    status: "ATIVO",
    secretMasked: "whsec_***a120f",
    ultimoDisparo: "Há 1 hora (HTTP 200 OK)",
  },
];

const INITIAL_OUTBOX: OutboxMessageItem[] = [
  {
    idMessage: "MSG-8801",
    evento: "bem.incorporado",
    payloadResumido: '{"chapa": "PAT-2026-0089", "valor": 5800.00, "conta": "4.4.9.0.52.35"}',
    dataCriacao: "2026-07-28 14:00:10",
    status: "ENVIADO",
    idempotencyKey: "IDEM-2026-0089-INC",
  },
  {
    idMessage: "MSG-8802",
    evento: "inventario.concluido",
    payloadResumido: '{"idInventario": "INV-2026-01", "totalLidos": 1420, "divergencias": 3}',
    dataCriacao: "2026-07-28 14:15:30",
    status: "PENDENTE",
    idempotencyKey: "IDEM-2026-INV-01",
  },
];

const INITIAL_DLQ: DLQItem[] = [
  {
    idDlq: "DLQ-9901",
    evento: "baixa.efetivada",
    erroMensagem: "HTTP 503 Service Unavailable no barramento remoto.",
    tentativas: 5,
    dataFalha: "2026-07-28 10:20:00",
    idempotencyKey: "IDEM-2026-BAIXA-9901",
  },
];

const DE_PARA_TABLE: DeParaMappingItem[] = [
  { codigoLegado: "CTA-102-TI", descricaoLegado: "Equipamentos de Processamento de Dados", codigoNovo: "4.4.9.0.52.35", categoriaNova: "Equipamentos de Processamento de Dados" },
  { codigoLegado: "CTA-104-MOV", descricaoLegado: "Móveis e Utensílios de Escritório", codigoNovo: "4.4.9.0.52.42", categoriaNova: "Mobiliário em Geral" },
  { codigoLegado: "CTA-108-VEC", descricaoLegado: "Veículos de Transporte de Carga", codigoNovo: "4.4.9.0.52.52", categoriaNova: "Veículos Automotores" },
];

function AdmIntegracoesPage() {
  const [activeTab, setActiveTab] = useState<"openapi" | "webhooks" | "outbox" | "dlq" | "depara">("webhooks");
  const [webhooks, setWebhooks] = useState<WebhookConfigItem[]>(INITIAL_WEBHOOKS);
  const [outbox, setOutbox] = useState<OutboxMessageItem[]>(INITIAL_OUTBOX);
  const [dlq, setDlq] = useState<DLQItem[]>(INITIAL_DLQ);
  const [showTestWebhookModal, setShowTestWebhookModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfigItem | null>(null);

  const kpis = useMemo(
    () => [
      { label: "Especificação do Contrato", value: "OpenAPI v3.0.3", hint: "REST & AsyncAPI (RN-MOD-41-01)" },
      { label: "Webhooks Ativos Assinados", value: `${webhooks.filter((w) => w.status === "ATIVO").length} endpoints`, hint: "Assinatura HMAC-SHA256 (RF-MOD-41-02)" },
      { label: "Transactional Outbox", value: `${outbox.filter((o) => o.status === "PENDENTE").length} pendentes`, hint: "Garantia de entrega (RF-MOD-41-04)" },
      { label: "Circuit Breaker", value: "CLOSED (Normal)", hint: "Proteção contra falhas (RN-MOD-41-03)" },
    ],
    [webhooks, outbox]
  );

  const handleTestWebhook = (wh: WebhookConfigItem) => {
    setSelectedWebhook(wh);
    setShowTestWebhookModal(true);
  };

  const handleDispararTeste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebhook) return;

    alert(
      `Disparo de teste efetuado para '${selectedWebhook.nome}'!\nAssinatura HMAC-SHA256 gerada e verificada: X-Hub-Signature-256: sha256=a8f5f167...\nHTTP 200 OK.`
    );
    setShowTestWebhookModal(false);
  };

  // REPROCESSAMENTO IDEMPOTENTE NA DLQ (RF-MOD-41-06 / RN-MOD-41-04)
  const handleReprocessarDlq = (idDlq: string) => {
    const item = dlq.find((d) => d.idDlq === idDlq);
    if (!item) return;

    if (confirm(`Confirmar reprocessamento idempotente da mensagem '${idDlq}' (Chave: ${item.idempotencyKey})?`)) {
      setDlq(dlq.filter((d) => d.idDlq !== idDlq));
      setOutbox([
        {
          idMessage: `MSG-900${Math.floor(Math.random() * 10)}`,
          evento: item.evento,
          payloadResumido: `Payload reprocessado via DLQ (${item.idempotencyKey})`,
          dataCriacao: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
          status: "ENVIADO",
          idempotencyKey: item.idempotencyKey,
        },
        ...outbox,
      ]);
      alert("Evento reprocessado com sucesso! Transação concluída de forma idempotente sem duplicar registros (RN-MOD-41-04).");
    }
  };

  const exportDlqCsv = () => {
    const headers = ["ID_DLQ", "Evento", "ErroMensagem", "Tentativas", "DataFalha", "IdempotencyKey"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const d of dlq) {
      lines.push([escape(d.idDlq), escape(d.evento), escape(d.erroMensagem), d.tentativas, escape(d.dataFalha), escape(d.idempotencyKey)].join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-falhas-dlq-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Integrações e Interoperabilidade (MOD-41)"
        description="Contratos OpenAPI v3, Webhooks assinados via HMAC-SHA256, Transactional Outbox, Fila de Falhas DLQ, Circuit Breaker e Idempotência."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Interoperabilidade" }, { label: "Painel de Conectores" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportDlqCsv}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Download className="h-4 w-4" /> Exportar Falhas DLQ (CSV)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* NAVEGAÇÃO ENTRE ABAS */}
      <section className="flex items-center gap-2 border-b border-border pb-2 flex-wrap">
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "webhooks"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Webhook className="h-4 w-4" /> Webhooks Assinados (RF-MOD-41-02)
        </button>

        <button
          onClick={() => setActiveTab("outbox")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "outbox"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Inbox className="h-4 w-4" /> Transactional Outbox (RF-MOD-41-04)
        </button>

        <button
          onClick={() => setActiveTab("dlq")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "dlq"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-amber-400" /> Fila de Falhas DLQ ({dlq.length})
        </button>

        <button
          onClick={() => setActiveTab("openapi")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "openapi"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Code2 className="h-4 w-4" /> Contrato OpenAPI v3 (RF-MOD-41-01)
        </button>

        <button
          onClick={() => setActiveTab("depara")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "depara"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" /> DE-PARA de Códigos (RF-MOD-41-08)
        </button>
      </section>

      {/* ABA 1: WEBHOOKS ASSINADOS HMAC-SHA256 (RF-MOD-41-02 / RN-MOD-41-02) */}
      {activeTab === "webhooks" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" /> Webhooks e Disparadores de Eventos Remotos
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              Assinatura: X-Hub-Signature-256 (HMAC-SHA256)
            </span>
          </div>

          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="p-4 rounded-xl border border-border bg-background flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                      {wh.id}
                    </span>
                    <h4 className="font-bold text-xs text-foreground">{wh.nome}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {wh.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">URL: {wh.urlDestino}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    Evento: <b>{wh.eventoInscrito}</b> • Secret: <b>{wh.secretMasked}</b> • Status: {wh.ultimoDisparo}
                  </div>
                </div>

                <div className="shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleTestWebhook(wh)}
                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1 hover:opacity-90"
                  >
                    <Send className="h-3.5 w-3.5" /> Testar Disparo HMAC
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABA 2: TRANSACTIONAL OUTBOX (RF-MOD-41-04) */}
      {activeTab === "outbox" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Inbox className="h-5 w-5 text-accent" /> Transactional Outbox (Padrão de Mensageria Resiliente)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Transação atômica banco + fila</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
                <tr>
                  <th className="p-3">Message ID</th>
                  <th className="p-3">Evento</th>
                  <th className="p-3">Payload Resumido</th>
                  <th className="p-3">Idempotency Key (RF-MOD-41-09)</th>
                  <th className="p-3">Data Criação</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {outbox.map((o) => (
                  <tr key={o.idMessage} className="hover:bg-accent/10 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">{o.idMessage}</td>
                    <td className="p-3 font-semibold text-foreground">{o.evento}</td>
                    <td className="p-3 font-mono text-[10px] text-muted-foreground truncate max-w-[200px]" title={o.payloadResumido}>
                      {o.payloadResumido}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-amber-300 font-bold">{o.idempotencyKey}</td>
                    <td className="p-3 font-mono text-muted-foreground">{o.dataCriacao}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === "ENVIADO" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ABA 3: FILA DE FALHAS DLQ & REPROCESSAMENTO IDEMPOTENTE (RF-MOD-41-05 / RF-MOD-41-06 / RN-MOD-41-04) */}
      {activeTab === "dlq" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" /> Fila de Falhas (Dead Letter Queue — DLQ)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Reprocessamento sem duplicar efeitos</span>
          </div>

          {dlq.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2 border border-border/60 rounded-xl">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
              <p className="font-bold text-sm text-foreground">Nenhuma falha pendente na DLQ!</p>
              <p className="text-xs">Todas as integrações estão operando sem erros retidos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dlq.map((item) => (
                <div
                  key={item.idDlq}
                  className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-rose-300"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40">
                        {item.idDlq}
                      </span>
                      <h4 className="font-bold text-xs text-foreground">Evento: {item.evento}</h4>
                      <span className="text-[10px] font-mono text-muted-foreground">Tentativas: {item.tentativas}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-rose-400">{item.erroMensagem}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      Data da Falha: {item.dataFalha} • Idempotency Key: <b className="text-amber-300">{item.idempotencyKey}</b>
                    </p>
                  </div>

                  <button
                    onClick={() => handleReprocessarDlq(item.idDlq)}
                    className="px-3 py-1.5 rounded bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1 hover:opacity-90 shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reprocessar Idempotente (RN-MOD-41-04)
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ABA 4: CONTRATO OPENAPI V3 (RF-MOD-41-01 / RN-MOD-41-01) */}
      {activeTab === "openapi" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" /> Especificação OpenAPI v3.0.3 (REST & AsyncAPI)
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText("https://patrimonio.santana.sp.gov.br/api/v1/openapi.json");
                alert("URL da especificação OpenAPI copiada!");
              }}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar OpenAPI JSON URL
            </button>
          </div>

          <div className="p-4 bg-slate-950 border border-border rounded-xl font-mono text-[11px] text-emerald-400 space-y-2 overflow-x-auto">
            <div>openapi: "3.0.3"</div>
            <div>info:</div>
            <div className="pl-4">title: "API REST de Patrimônio Inteligente"</div>
            <div className="pl-4">version: "1.0.0"</div>
            <div className="pl-4">description: "Interoperabilidade oficial com SIAFEM, SEI e Barramento Gov."</div>
            <div>paths:</div>
            <div className="pl-4 text-sky-400">/api/v1/bens:</div>
            <div className="pl-[32px] text-muted-foreground">post: &#123; summary: "Incorporar Bem Patrimonial", security: [&#123; BearerAuth: [] &#125;] &#125;</div>
            <div className="pl-4 text-sky-400">/api/v1/webhooks/outbox:</div>
            <div className="pl-[32px] text-muted-foreground">get: &#123; summary: "Consultar Fila de Eventos Pendentes" &#125;</div>
          </div>
        </section>
      )}

      {/* ABA 5: MAPEAMENTO DE-PARA DE CÓDIGOS (RF-MOD-41-08) */}
      {activeTab === "depara" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" /> Tabela de Mapeamento DE-PARA (Legado -&gt; Novo Padrão)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Tradução automática de contas contábeis</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
                <tr>
                  <th className="p-3">Código Legado</th>
                  <th className="p-3">Descrição do Legado</th>
                  <th className="p-3">Código Novo (Plano Oficial)</th>
                  <th className="p-3">Categoria Nova Equivalente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {DE_PARA_TABLE.map((row) => (
                  <tr key={row.codigoLegado} className="hover:bg-accent/10 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-300">{row.codigoLegado}</td>
                    <td className="p-3 font-semibold text-foreground">{row.descricaoLegado}</td>
                    <td className="p-3 font-mono font-bold text-primary">{row.codigoNovo}</td>
                    <td className="p-3 font-semibold text-foreground">{row.categoriaNova}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL DISPARO DE TESTE WEBHOOK (RF-MOD-41-02) */}
      {showTestWebhookModal && selectedWebhook && (
        <Dialog open={showTestWebhookModal} onOpenChange={setShowTestWebhookModal}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Send className="h-5 w-5" /> Testar Webhook Assinado (HMAC-SHA256)
              </DialogTitle>
              <DialogDescription>{selectedWebhook.nome}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDispararTeste} className="space-y-3 text-xs mt-2">
              <div className="space-y-1">
                <label className="font-bold text-foreground">URL Destino</label>
                <input
                  readOnly
                  value={selectedWebhook.urlDestino}
                  className="w-full h-9 px-3 rounded-md border border-input bg-muted/40 font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Evento de Teste *</label>
                <input
                  readOnly
                  value={selectedWebhook.eventoInscrito}
                  className="w-full h-9 px-3 rounded-md border border-input bg-muted/40 font-mono text-xs font-bold text-primary"
                />
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1 font-mono text-[10px] text-muted-foreground">
                <div>Headers Automáticos:</div>
                <div className="text-emerald-400">X-Hub-Signature-256: sha256=9f8a...</div>
                <div className="text-amber-300">X-Idempotency-Key: IDEM-TEST-{Date.now()}</div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTestWebhookModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 inline-flex items-center gap-1"
                >
                  <Send className="h-3.5 w-3.5" /> Disparar Payload Assinado
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
