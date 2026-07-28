import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  Shield,
  Activity,
  Cpu,
  RefreshCw,
  RotateCcw,
  AlertOctagon,
  Lock,
  Database,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Download,
  Server,
  Layers,
  Clock,
  Key,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/configuracoes")({
  head: () => ({
    meta: [
      { title: "Administração e Configurações (MOD-39) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Central de parâmetros versionados com rollback, feature flags, saúde de integrações, fila de jobs, modo manutenção e segredos em vault.",
      },
    ],
  }),
  component: AdmConfiguracoesPage,
});

export interface FeatureFlagItem {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
  categoria: "IA & Automação" | "Dispositivos & Leitura" | "Segurança" | "Performance";
}

export interface IntegracaoHealthItem {
  servico: string;
  endpoint: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  latenciaMs: number;
  ultimoPing: string;
  secretVaultMasked: string; // RN-MOD-39-01
}

export interface JobBackgroundItem {
  id: string;
  tipo: string;
  status: "CONCLUIDO" | "EM_PROGRESSO" | "FALHA";
  horarioExecucao: string;
  tentativas: number;
  detalheErro?: string;
}

const INITIAL_FLAGS: FeatureFlagItem[] = [
  { id: "FLAG-01", nome: "Assistente de IA Patrimonial (MOD-32)", descricao: "Habilita a interface de consulta semântica em linguagem natural.", ativa: true, categoria: "IA & Automação" },
  { id: "FLAG-02", nome: "Leitura Rápida Web RFID (MOD-23)", descricao: "Ativa suporte a leitores RFID físicos via WebUSB no inventário.", ativa: true, categoria: "Dispositivos & Leitura" },
  { id: "FLAG-03", nome: "Modo Estrito de Auditoria (RN-MOD-36)", descricao: "Exige justificativa obrigatória para qualquer alteração cadastral.", ativa: true, categoria: "Segurança" },
  { id: "FLAG-04", nome: "Processamento Assíncrono de Imagens (MOD-29)", descricao: "Compacta e gera thumbnails de fotos em background via Jobs.", ativa: true, categoria: "Performance" },
  { id: "FLAG-05", nome: "Web Push Notifications (MOD-38)", descricao: "Habilita envio de alertas em tempo real no navegador dos usuários.", ativa: false, categoria: "IA & Automação" },
];

const INITIAL_INTEGRACOES: IntegracaoHealthItem[] = [
  { servico: "SMTP Governamental (MOD-31)", endpoint: "smtp.santana.sp.gov.br:587", status: "ONLINE", latenciaMs: 42, ultimoPing: "Há 1 minuto", secretVaultMasked: "***SEGREDO EM VAULT***" },
  { servico: "S3 Storage de Fotos (MOD-29)", endpoint: "s3.sa-east-1.amazonaws.com/patrimonio-fotos", status: "ONLINE", latenciaMs: 85, ultimoPing: "Há 30 segundos", secretVaultMasked: "***SEGREDO EM VAULT***" },
  { servico: "Servidor de IA Ollama Local (MOD-32)", endpoint: "http://localhost:11434", status: "ONLINE", latenciaMs: 120, ultimoPing: "Há 2 minutos", secretVaultMasked: "***SEGREDO EM VAULT***" },
  { servico: "Barramento Transacional SP (MOD-28)", endpoint: "api.barramento.sp.gov.br/v1", status: "DEGRADED", latenciaMs: 450, ultimoPing: "Há 5 minutos", secretVaultMasked: "***SEGREDO EM VAULT***" },
];

const INITIAL_JOBS: JobBackgroundItem[] = [
  { id: "JOB-7701", tipo: "Recálculo Mensal de Depreciação (MOD-35)", status: "CONCLUIDO", horarioExecucao: "2026-07-28 02:00:00", tentativas: 1 },
  { id: "JOB-7702", tipo: "Limpeza de Downloads Temporários (MOD-37)", status: "CONCLUIDO", horarioExecucao: "2026-07-28 04:00:00", tentativas: 1 },
  { id: "JOB-7703", tipo: "Sincronização de Carga com Legado (MOD-34)", status: "FALHA", horarioExecucao: "2026-07-28 11:30:00", tentativas: 3, detalheErro: "Timeout de conexão com o banco legado após 30s." },
];

function AdmConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<"parametros" | "flags" | "integracoes" | "jobs">("parametros");

  // State Parâmetros Versionados (RF-MOD-39-01 / RN-MOD-39-03)
  const [paramVersao, setParamVersao] = useState("v3.2.1");
  const [paramFormatoChapa, setParamFormatoChapa] = useState("PAT-YYYY-NNNN");
  const [paramRetencaoHot, setParamRetencaoHot] = useState("90");
  const [paramLimiteDeprec, setParamLimiteDeprec] = useState("10.0");

  // State Modo Manutenção (RF-MOD-39-09 / RN-MOD-39-02)
  const [modoManutencao, setModoManutencao] = useState(false);
  const [showManutencaoModal, setShowManutencaoModal] = useState(false);
  const [motivoManutencao, setMotivoManutencao] = useState("");

  // Feature Flags
  const [flags, setFlags] = useState<FeatureFlagItem[]>(INITIAL_FLAGS);
  const [integracoes, setIntegracoes] = useState<IntegracaoHealthItem[]>(INITIAL_INTEGRACOES);
  const [jobs, setJobs] = useState<JobBackgroundItem[]>(INITIAL_JOBS);

  const kpis = useMemo(
    () => [
      { label: "Versão do Schema de Parâmetros", value: paramVersao, hint: "Ambiente: Produção (RN-MOD-39-03)" },
      { label: "Feature Flags Ativas", value: `${flags.filter((f) => f.ativa).length} de ${flags.length}` },
      { label: "Saúde das Integrações", value: `${integracoes.filter((i) => i.status === "ONLINE").length} / ${integracoes.length} Online` },
      {
        label: "Modo de Manutenção",
        value: modoManutencao ? "ATIVADO (TRAVADO)" : "Desativado (Normal)",
        hint: modoManutencao ? "Apenas administradores" : "Operação livre",
      },
    ],
    [paramVersao, flags, integracoes, modoManutencao]
  );

  const handleToggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ativa: !f.ativa } : f))
    );
  };

  // ROLLBACK DE CONFIGURAÇÃO PARA A VERSÃO ANTERIOR (RN-MOD-39-05)
  const handleRollbackParametros = () => {
    if (confirm("Confirmar ROLLBACK dos parâmetros de configuração para a versão anterior 'v3.2.0'?")) {
      setParamVersao("v3.2.0");
      setParamFormatoChapa("PAT-YYYY-NNNN");
      setParamRetencaoHot("90");
      setParamLimiteDeprec("10.0");
      alert("Rollback de configuração executado com sucesso! Restaurada a versão v3.2.0 (RN-MOD-39-05).");
    }
  };

  const handleConfirmarManutencao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoManutencao.trim()) return;

    setModoManutencao(true);
    setShowManutencaoModal(false);
    alert(`Modo de Manutenção ativado com sucesso! Motivo auditado: ${motivoManutencao}`);
    setMotivoManutencao("");
  };

  const exportConfiguracoesCsv = () => {
    const headers = ["IDFlag", "NomeFlag", "Categoria", "StatusAtiva"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const f of flags) {
      lines.push([escape(f.id), escape(f.nome), escape(f.categoria), f.ativa ? "Ativa" : "Inativa"].join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-feature-flags-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administração e Configurações do Sistema (MOD-39)"
        description="Parâmetros versionados com rollback, alternadores de feature flags, saúde de integrações, monitor de jobs e modo de manutenção."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Configurações" }, { label: "Painel Geral" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {modoManutencao ? (
              <button
                onClick={() => setModoManutencao(false)}
                className="h-9 px-3 rounded-md bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" /> Desativar Modo Manutenção
              </button>
            ) : (
              <button
                onClick={() => setShowManutencaoModal(true)}
                className="h-9 px-3 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-rose-500/30"
              >
                <AlertOctagon className="h-4 w-4 text-rose-400" /> Modo Manutenção (RF-MOD-39-09)
              </button>
            )}

            <button
              onClick={exportConfiguracoesCsv}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Download className="h-4 w-4" /> Exportar Flags (CSV)
            </button>
          </div>
        }
      />

      {/* BANNER DE ALERTA MODO MANUTENÇÃO ATIVO */}
      {modoManutencao && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-center justify-between gap-4 text-rose-300 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertOctagon className="h-6 w-6 text-rose-400 shrink-0" />
            <div>
              <h4 className="font-bold text-xs">SISTEMA EM MODO DE MANUTENÇÃO PROGRAMADA (RF-MOD-39-09)</h4>
              <p className="text-[11px] text-muted-foreground">
                O acesso geral está bloqueado para usuários comuns. Apenas administradores técnicos autorizados têm permissão de escrita.
              </p>
            </div>
          </div>
        </div>
      )}

      <KPIGrid items={kpis} />

      {/* ABAS DE CONFIGURAÇÃO */}
      <section className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("parametros")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "parametros"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Sliders className="h-4 w-4" /> Parâmetros Versionados (RF-MOD-39-01)
        </button>

        <button
          onClick={() => setActiveTab("flags")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "flags"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <ToggleRight className="h-4 w-4" /> Feature Flags (RF-MOD-39-04)
        </button>

        <button
          onClick={() => setActiveTab("integracoes")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "integracoes"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Activity className="h-4 w-4" /> Saúde de Integrações (RF-MOD-39-06)
        </button>

        <button
          onClick={() => setActiveTab("jobs")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "jobs"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Cpu className="h-4 w-4" /> Fila de Jobs (RF-MOD-39-07)
        </button>
      </section>

      {/* ABA 1: PARÂMETROS VERSIONADOS & ROLLBACK (RF-MOD-39-01 / RN-MOD-39-03 / RN-MOD-39-05) */}
      {activeTab === "parametros" && (
        <section className="glass-card p-6 border border-border/60 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" /> Parâmetros Globais do Sistema (Schema {paramVersao})
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Ambiente: Produção (RN-MOD-39-03). Qualquer edição eleva a versão para {paramVersao.slice(0, 4)}2.
              </span>
            </div>

            <button
              onClick={handleRollbackParametros}
              className="h-8 px-3 rounded bg-accent/15 text-accent-foreground border border-accent/30 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-accent/25"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Rollback para v3.2.0 (RN-MOD-39-05)
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setParamVersao("v3.2.2"); alert("Parâmetros salvos! Versão atualizada para v3.2.2."); }} className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-foreground">Máscara Padrão da Chapa Patrimonial</label>
              <input
                value={paramFormatoChapa}
                onChange={(e) => setParamFormatoChapa(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Retenção de Logs em Hot Storage (Dias)</label>
              <input
                type="number"
                value={paramRetencaoHot}
                onChange={(e) => setParamRetencaoHot(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-bold text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Taxa Limite de Depreciação Residual (%)</label>
              <input
                type="number"
                step="0.1"
                value={paramLimiteDeprec}
                onChange={(e) => setParamLimiteDeprec(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-bold text-xs"
              />
            </div>

            <div className="flex items-end justify-end">
              <button
                type="submit"
                className="h-9 px-5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-sm"
              >
                Salvar Nova Versão dos Parâmetros
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ABA 2: FEATURE FLAGS (RF-MOD-39-04) */}
      {activeTab === "flags" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ToggleRight className="h-5 w-5 text-primary" /> Central de Alternadores de Feature Flags
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Alterações aplicadas instantaneamente</span>
          </div>

          <div className="space-y-3">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="p-4 rounded-xl border border-border bg-background flex items-center justify-between gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                      {flag.id}
                    </span>
                    <h4 className="font-bold text-xs text-foreground">{flag.nome}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {flag.categoria}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{flag.descricao}</p>
                </div>

                <button
                  onClick={() => handleToggleFlag(flag.id)}
                  className={`p-2 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition-all shrink-0 ${
                    flag.ativa
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {flag.ativa ? (
                    <>
                      <ToggleRight className="h-5 w-5 text-emerald-400" /> Ativada
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" /> Desativada
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABA 3: SAÚDE DE INTEGRAÇÕES & SEGREDO EM VAULT (RF-MOD-39-06 / RN-MOD-39-01) */}
      {activeTab === "integracoes" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" /> Monitor de Saúde de Serviços e Integrações Externa
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Ping automático a cada 60s</span>
          </div>

          <div className="space-y-3">
            {integracoes.map((item) => (
              <div
                key={item.servico}
                className="p-4 rounded-xl border border-border bg-background flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary shrink-0" />
                    <h4 className="font-bold text-xs text-foreground">{item.servico}</h4>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">Endpoint: {item.endpoint}</div>
                  <div className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                    <Key className="h-3 w-3" /> Credenciais: <b>{item.secretVaultMasked}</b> (RN-MOD-39-01)
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-[11px] font-mono">
                    <span className="block font-bold text-foreground">{item.latenciaMs} ms</span>
                    <span className="text-muted-foreground text-[10px]">{item.ultimoPing}</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded text-[10px] font-bold ${
                      item.status === "ONLINE"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABA 4: FILA DE JOBS EM BACKGROUND (RF-MOD-39-07) */}
      {activeTab === "jobs" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Cpu className="h-5 w-5 text-accent" /> Fila e Histórico de Execução de Jobs em Background
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Worker Queue Ativa</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Tipo de Processamento</th>
                  <th className="p-3">Horário Execução</th>
                  <th className="p-3 text-center">Tentativas</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Detalhes / Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-accent/10 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">{j.id}</td>
                    <td className="p-3 font-semibold text-foreground">{j.tipo}</td>
                    <td className="p-3 font-mono text-muted-foreground">{j.horarioExecucao}</td>
                    <td className="p-3 text-center font-mono font-bold">{j.tentativas}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          j.status === "CONCLUIDO"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">
                      {j.detalheErro ? <span className="text-rose-400 font-bold">{j.detalheErro}</span> : "Sem ocorrências."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL CONFIRMAÇÃO MODO MANUTENÇÃO (RF-MOD-39-09 / RN-MOD-39-02) */}
      {showManutencaoModal && (
        <Dialog open={showManutencaoModal} onOpenChange={setShowManutencaoModal}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-rose-400">
                <AlertOctagon className="h-5 w-5" /> Ativar Modo de Manutenção (RN-MOD-39-02)
              </DialogTitle>
              <DialogDescription>
                Esta ação bloqueia o acesso geral do sistema para usuários comuns.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmarManutencao} className="space-y-3 text-xs mt-2">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Motivo da Manutenção (Auditado) *</label>
                <textarea
                  value={motivoManutencao}
                  onChange={(e) => setMotivoManutencao(e.target.value)}
                  required
                  placeholder="Ex: Atualização programada de banco de dados e virada de lote."
                  className="w-full h-20 p-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowManutencaoModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-rose-500 text-white font-bold hover:opacity-90"
                >
                  Confirmar & Ativar Manutenção
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
