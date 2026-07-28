import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  History,
  AlertTriangle,
  Lock,
  User,
  Clock,
  Globe,
  FileText,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/auditoria")({
  head: () => ({
    meta: [
      { title: "Histórico, Auditoria e Linha do Tempo (MOD-36) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Trilha de auditoria append-only imutável: linha do tempo por recurso, comparação antes/depois mascarada, ID de correlação, alertas de anomalia e exportação protegida.",
      },
    ],
  }),
  component: AdmAuditoriaPage,
});

export interface EventoAuditoria {
  id: string;
  traceId: string; // RF-MOD-36-04 (Correlation ID)
  timestampUtc: string; // RN-MOD-36-03 (Horário Institucional)
  modulo: string;
  recursoAfetado: string;
  acao: string;
  severidade: "INFO" | "WARNING" | "CRITICAL";
  atorProntuario: string;
  atorNome: string;
  atorPerfil: string;
  atorIp: string;
  escopoSetor: string;
  isAnomalia: boolean; // RF-MOD-36-08
  deltaAntes?: Record<string, any>; // RF-MOD-36-02
  deltaDepois?: Record<string, any>;
}

const INITIAL_LOGS_AUDITORIA: EventoAuditoria[] = [
  {
    id: "LOG-2026-9901",
    traceId: "TRACE-2026-8812-A",
    timestampUtc: "2026-07-28 14:32:10",
    modulo: "MOD-34 (Cadastro Mestre)",
    recursoAfetado: "PAT-2026-8801",
    acao: "Alteração de Local Físico e Responsável",
    severidade: "INFO",
    atorProntuario: "42159",
    atorNome: "Neemias Oliveira",
    atorPerfil: "Administrador de Patrimônio",
    atorIp: "189.120.45.12",
    escopoSetor: "Secretaria de Finanças e Patrimônio",
    isAnomalia: false,
    deltaAntes: { localFisico: "Almocharifado Central", responsavel: "João Mendes", piiToken: "***MASCARADO***" },
    deltaDepois: { localFisico: "Centro Administrativo Bandeirantes", responsavel: "Neemias Oliveira", piiToken: "***MASCARADO***" },
  },
  {
    id: "LOG-2026-9902",
    traceId: "TRACE-2026-8815-B",
    timestampUtc: "2026-07-28 12:10:05",
    modulo: "MOD-35 (Plano de Categorias)",
    recursoAfetado: "CAT-100 (4.4.9.0.52.12)",
    acao: "Reclassificação em Massa de 440 Bens",
    severidade: "WARNING",
    atorProntuario: "42159",
    atorNome: "Neemias Oliveira",
    atorPerfil: "Administrador de Patrimônio",
    atorIp: "189.120.45.12",
    escopoSetor: "Secretaria de Finanças e Patrimônio",
    isAnomalia: false,
    deltaAntes: { contaContabil: "4.4.9.0.52.99", totalBens: 440 },
    deltaDepois: { contaContabil: "4.4.9.0.52.12", totalBens: 440 },
  },
  {
    id: "LOG-2026-9903",
    traceId: "TRACE-2026-7710-C",
    timestampUtc: "2026-07-28 03:15:22", // Horário Suspeito (Fora de Expediente)
    modulo: "MOD-31 (Painel de E-mails)",
    recursoAfetado: "CONFIG-SMTP-AUTH",
    acao: "Alteração de Credenciais de Servidor SMTP",
    severidade: "CRITICAL",
    atorProntuario: "99881",
    atorNome: "Usuário Externo (API)",
    atorPerfil: "Integração Externa",
    atorIp: "201.88.99.120",
    escopoSetor: "Sistema Geral",
    isAnomalia: true, // ALERTA DE ANOMALIA (RF-MOD-36-08)
    deltaAntes: { smtpHost: "smtp.santana.sp.gov.br", senhaSmtp: "***MASCARADO***" },
    deltaDepois: { smtpHost: "smtp-relay.externo.com", senhaSmtp: "***MASCARADO***" },
  },
  {
    id: "LOG-2026-9904",
    traceId: "TRACE-2026-6601-D",
    timestampUtc: "2026-07-27 16:45:00",
    modulo: "MOD-32 (Assistente IA)",
    recursoAfetado: "CONSULTA-SEMANTICA",
    acao: "Consulta de Inventário do Setor de Saúde",
    severidade: "INFO",
    atorProntuario: "33890",
    atorNome: "Dra. Patricia Lima",
    atorPerfil: "Responsável de Setor",
    atorIp: "189.120.48.99",
    escopoSetor: "Secretaria de Saúde",
    isAnomalia: false,
    deltaAntes: { query: "Quantos equipamentos de TI existem na USA Fazendinha?" },
    deltaDepois: { status: "Aprovado via Allowlist Semântica", registrosRetornados: 12 },
  },
];

function AdmAuditoriaPage() {
  const [logs, setLogs] = useState<EventoAuditoria[]>(INITIAL_LOGS_AUDITORIA);
  const [qSearch, setQSearch] = useState("");
  const [moduloFilter, setModuloFilter] = useState("");
  const [severidadeFilter, setSeveridadeFilter] = useState("");
  const [onlyAnomalias, setOnlyAnomalias] = useState(false);

  // Modal Delta Antes / Depois (RF-MOD-36-02)
  const [selectedDeltaLog, setSelectedDeltaLog] = useState<EventoAuditoria | null>(null);

  // REGISTRO DE AUDITORIA DO PRÓPRIO ACESSO À TELA (RN-MOD-36-04)
  useEffect(() => {
    const accessLog: EventoAuditoria = {
      id: `LOG-2026-${Math.floor(9905 + Math.random() * 900)}`,
      traceId: `TRACE-2026-AUDIT-${Date.now().toString().slice(-4)}`,
      timestampUtc: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
      modulo: "MOD-36 (Linha do Tempo)",
      recursoAfetado: "TELA-AUDITORIA-GESTAO",
      acao: "Acesso à Tela de Linha do Tempo e Trilhas de Auditoria",
      severidade: "INFO",
      atorProntuario: "42159",
      atorNome: "Neemias Oliveira (Sessão Ativa)",
      atorPerfil: "Administrador de Patrimônio",
      atorIp: "127.0.0.1 (Localhost)",
      escopoSetor: "Secretaria de Finanças e Patrimônio",
      isAnomalia: false,
      deltaAntes: { acaoAudito: "Entrada no Módulo MOD-36" },
      deltaDepois: { resultado: "Acesso Registrado (RN-MOD-36-04)" },
    };

    setLogs((prev) => [accessLog, ...prev]);
  }, []);

  const filteredLogs = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return logs.filter((l) => {
      if (onlyAnomalias && !l.isAnomalia) return false;
      if (moduloFilter && l.modulo !== moduloFilter) return false;
      if (severidadeFilter && l.severidade !== severidadeFilter) return false;
      if (!t) return true;

      return (
        l.id.toLowerCase().includes(t) ||
        l.traceId.toLowerCase().includes(t) ||
        l.recursoAfetado.toLowerCase().includes(t) ||
        l.acao.toLowerCase().includes(t) ||
        l.atorNome.toLowerCase().includes(t) ||
        l.atorProntuario.toLowerCase().includes(t)
      );
    });
  }, [logs, qSearch, moduloFilter, severidadeFilter, onlyAnomalias]);

  const modulosList = useMemo(
    () => [...new Set(logs.map((l) => l.modulo))].sort(),
    [logs]
  );

  const kpis = useMemo(
    () => [
      { label: "Total de Eventos Registrados", value: `${logs.length} eventos`, hint: "Trilha Append-Only (RN-MOD-36-01)" },
      { label: "Alertas de Anomalia (RF-MOD-36-08)", value: `${logs.filter((l) => l.isAnomalia).length} anomalias`, hint: "Ações suspeitas registradas" },
      { label: "Política de Retenção", value: "90d Hot / 5a Cold", hint: "Conforme regra (RN-MOD-36-05)" },
      { label: "Fuso Horário Vigente", value: "UTC-3 (Brasília)", hint: "Exibição institucional (RN-MOD-36-03)" },
    ],
    [logs]
  );

  // EXPORTAÇÃO PROTEGIDA COM LOG DE AUDITORIA SECUNDÁRIO (RF-MOD-36-06 / RN-MOD-36-04)
  const exportAuditoriaCsv = () => {
    // 1. Gravar evento de exportação
    const exportLog: EventoAuditoria = {
      id: `LOG-2026-${Math.floor(9950 + Math.random() * 500)}`,
      traceId: `TRACE-2026-EXPORT-${Date.now().toString().slice(-4)}`,
      timestampUtc: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
      modulo: "MOD-36 (Linha do Tempo)",
      recursoAfetado: "EXPORTACAO-CSV-TRILHA",
      acao: "Exportação de Trilha de Auditoria em CSV Executada",
      severidade: "WARNING",
      atorProntuario: "42159",
      atorNome: "Neemias Oliveira",
      atorPerfil: "Administrador de Patrimônio",
      atorIp: "127.0.0.1",
      escopoSetor: "Secretaria de Finanças e Patrimônio",
      isAnomalia: false,
      deltaAntes: { acaoExport: "Início do Download" },
      deltaDepois: { registrosExportados: filteredLogs.length },
    };

    setLogs((prev) => [exportLog, ...prev]);

    // 2. Gerar CSV
    const headers = ["IDLog", "TraceId", "TimestampUTC", "Modulo", "RecursoAfetado", "Acao", "Severidade", "AtorProntuario", "AtorNome", "AtorIP", "IsAnomalia"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const l of filteredLogs) {
      lines.push(
        [
          escape(l.id),
          escape(l.traceId),
          escape(l.timestampUtc),
          escape(l.modulo),
          escape(l.recursoAfetado),
          escape(l.acao),
          escape(l.severidade),
          escape(l.atorProntuario),
          escape(l.atorNome),
          escape(l.atorIp),
          l.isAnomalia ? "Sim" : "Nao",
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trilha-de-auditoria-patrimonial-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Histórico, Auditoria e Linha do Tempo (MOD-36)"
        description="Trilha imutável append-only de eventos de negócio: comparação antes/depois com redação de PII, ID de correlação, detecção de anomalias e auditoria do acesso."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Segurança & Auditoria" }, { label: "Linha do Tempo" }]}
        actions={
          <button
            onClick={exportAuditoriaCsv}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
          >
            <Download className="h-4 w-4" /> Exportar Trilha Protegida (CSV)
          </button>
        }
      />

      <KPIGrid items={kpis} />

      {/* PAINEL DE ALERTAS DE ANOMALIA (RF-MOD-36-08) */}
      {logs.some((l) => l.isAnomalia) && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 rounded-lg shrink-0">
              <AlertTriangle className="h-6 w-6 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-rose-300">Detecção de Anomalias de Segurança (RF-MOD-36-08)</h4>
              <p className="text-[11px] text-muted-foreground">
                Existem mutações registradas fora do horário comercial ou vindas de IPs não autorizados.
              </p>
            </div>
          </div>

          <button
            onClick={() => setOnlyAnomalias(!onlyAnomalias)}
            className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors shrink-0 ${
              onlyAnomalias ? "bg-rose-500 text-white" : "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
            }`}
          >
            {onlyAnomalias ? "Exibindo Somente Anomalias" : "Filtrar Anomalias"}
          </button>
        </div>
      )}

      {/* BARRA DE FILTROS AVANÇADOS (RF-MOD-36-05) */}
      <section className="glass-card p-4 border border-border/60 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={qSearch}
            onChange={(e) => setQSearch(e.target.value)}
            placeholder="Buscar por ID do Log, Trace ID (ex: TRACE-2026-8812-A), chapa do bem, ação ou operador..."
            className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={moduloFilter}
          onChange={(e) => setModuloFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold shrink-0"
        >
          <option value="">Todos os módulos ({modulosList.length})</option>
          {modulosList.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={severidadeFilter}
          onChange={(e) => setSeveridadeFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold shrink-0"
        >
          <option value="">Todas as severidades</option>
          <option value="INFO">INFO (Operação Normal)</option>
          <option value="WARNING">WARNING (Alerta)</option>
          <option value="CRITICAL">CRITICAL (Crítico)</option>
        </select>
      </section>

      {/* LINHA DO TEMPO CRONOLÓGICA DE EVENTOS (RF-MOD-36-01 a RF-MOD-36-04) */}
      <section className="glass-card p-6 border border-border/60 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Trilha Cronológica de Eventos (Append-Only)
          </h3>
          <span className="text-xs text-muted-foreground font-mono">Total: {filteredLogs.length} eventos</span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {filteredLogs.map((log) => (
            <div key={log.id} className="relative group">
              {/* ÍCONE DE INDICADOR NA LINHA DO TEMPO */}
              <div
                className={`absolute -left-[23px] top-1.5 h-4 w-4 rounded-full border-2 bg-background flex items-center justify-center ${
                  log.isAnomalia
                    ? "border-rose-500 text-rose-500 animate-ping"
                    : log.severidade === "CRITICAL"
                    ? "border-rose-500 text-rose-500"
                    : log.severidade === "WARNING"
                    ? "border-amber-500 text-amber-500"
                    : "border-primary text-primary"
                }`}
              />

              <div className={`p-4 rounded-xl border transition-colors ${log.isAnomalia ? "bg-rose-500/5 border-rose-500/30" : "bg-background border-border"}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/40 pb-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-primary text-xs">{log.id}</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground border border-border">
                      {log.traceId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                      {log.modulo}
                    </span>
                    <SeveridadeBadge severidade={log.severidade} />
                  </div>

                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {log.timestampUtc} (Horário de Brasília)
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1 md:col-span-2">
                    <h4 className="font-bold text-foreground text-xs leading-snug">{log.acao}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      <b>Recurso Afetado:</b> <span className="font-mono text-foreground font-bold">{log.recursoAfetado}</span>
                    </p>
                  </div>

                  <div className="p-2.5 bg-muted/30 rounded-lg border border-border/60 text-[11px] space-y-0.5">
                    <div className="font-bold text-foreground flex items-center gap-1">
                      <User className="h-3 w-3 text-primary" /> {log.atorNome} ({log.atorProntuario})
                    </div>
                    <div className="text-muted-foreground text-[10px]">{log.atorPerfil}</div>
                    <div className="text-muted-foreground text-[10px] font-mono">IP: {log.atorIp}</div>
                  </div>
                </div>

                {log.deltaAntes && (
                  <div className="pt-3 mt-2 border-t border-border/40 flex justify-end">
                    <button
                      onClick={() => setSelectedDeltaLog(log)}
                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver Comparação de Delta ("Antes" vs "Depois")
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL DELTA ANTES / DEPOIS COM REDAÇÃO (RF-MOD-36-02 / RN-MOD-36-02) */}
      {selectedDeltaLog && (
        <Dialog open={!!selectedDeltaLog} onOpenChange={() => setSelectedDeltaLog(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <History className="h-5 w-5" /> Comparação de Delta — {selectedDeltaLog.id}
              </DialogTitle>
              <DialogDescription>
                Registro antes e depois da mutação com mascaramento automático de PII (RN-MOD-36-02).
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 text-xs mt-2">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1.5">
                <span className="font-bold text-rose-400 block border-b border-rose-500/20 pb-1">
                  1. Estado Anterior ("Antes")
                </span>
                <pre className="font-mono text-[10px] text-muted-foreground whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {JSON.stringify(selectedDeltaLog.deltaAntes, null, 2)}
                </pre>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5">
                <span className="font-bold text-emerald-400 block border-b border-emerald-500/20 pb-1">
                  2. Estado Atualizado ("Depois")
                </span>
                <pre className="font-mono text-[10px] text-muted-foreground whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {JSON.stringify(selectedDeltaLog.deltaDepois, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 bg-muted/40 border border-border rounded-lg text-[10px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Dados confidenciais ou tokens sensíveis foram automaticamente substituídos por <b>***MASCARADO***</b>.
              </span>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedDeltaLog(null)}
                className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
              >
                Fechar Comparativo
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SeveridadeBadge({ severidade }: { severidade: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    INFO: { label: "INFO", cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
    WARNING: { label: "WARNING", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
    CRITICAL: { label: "CRITICAL", cls: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold animate-pulse" },
  };
  const item = map[severidade] || { label: severidade, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
