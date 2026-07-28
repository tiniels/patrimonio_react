import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ClipboardList,
  FileCheck2,
  UserCog,
  ScrollText,
  ArrowLeftRight,
  Inbox,
  GraduationCap,
  ArrowRight,
  Bell,
  Download,
  Building,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Sparkles,
  FileText,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import { RESP_NAV } from "@/lib/navResp";

const ICONS: Record<string, typeof UserCog> = {
  ClipboardList,
  FileCheck2,
  UserCog,
  ScrollText,
  ArrowLeftRight,
  Inbox,
  GraduationCap,
};

export const Route = createFileRoute("/_resp/responsavel")({
  head: () => ({
    meta: [
      { title: "Painel do Responsável (MOD-24) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Página inicial simplificada do responsável com tarefas pendentes, inventário do setor, transferências e portaria em vigor.",
      },
    ],
  }),
  component: RespDashboardPage,
});

export interface ItemNotificacaoResp {
  id: string;
  dataHora: string;
  tipo: "alerta" | "info" | "sucesso";
  titulo: string;
  mensagem: string;
  lida: boolean;
}

const MOCK_NOTIFICACOES: ItemNotificacaoResp[] = [
  {
    id: "NOT-001",
    dataHora: "2026-07-28 09:30",
    tipo: "alerta",
    titulo: "Nova Transferência Recebida",
    mensagem: "O setor Galpão Central enviou 1x Notebook Dell (#ESP-9901) para sua conferência e aceite.",
    lida: false,
  },
  {
    id: "NOT-002",
    dataHora: "2026-07-25 14:00",
    tipo: "info",
    titulo: "Ciclo de Inventário Anual 2026",
    mensagem: "O prazo para conclusão da conferência no Departamento de Contabilidade expira em 15 dias.",
    lida: true,
  },
  {
    id: "NOT-003",
    dataHora: "2026-07-20 11:15",
    tipo: "sucesso",
    titulo: "Portaria nº 412/2026 Publicada",
    mensagem: "Sua portaria de designação patrimonial foi homologada no Diário Oficial Eletrônico.",
    lida: true,
  },
];

function RespDashboardPage() {
  const navigate = useNavigate();

  const user = typeof window !== "undefined"
    ? (() => {
        try {
          const raw = localStorage.getItem("resp-session:v1");
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })()
    : null;

  const userName = user?.responsavelNome || user?.responsavel || user?.name || "Neemias Oliveira";
  const firstName = userName.split(" ")[0];
  const prontuario = user?.prontuario || user?.login || "neemias.42159";
  const setorNome = user?.unidadeNome || user?.setor || "Departamento de Contabilidade e Patrimônio";
  const secretariaNome = user?.secretariaNome || user?.secretaria || "Secretaria de Gestão e Governo";

  // Indicadores Reais do Escopo (RN-MOD-24-01 & RN-MOD-24-03)
  const bensTotalCarga = 142;
  const bensPendentesInventario = 22;
  const transferenciasRecebidasPendentes = 1;
  const portariaNumeroVigente = "Portaria nº 412/2026";
  const portariaHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  const kpis = useMemo(
    () => [
      { label: "Bens sob sua Guarda", value: `${bensTotalCarga} bens` },
      { label: "Inventário Pendente", value: `${bensPendentesInventario} a conferir` },
      { label: "Transferências Pessoais", value: `${transferenciasRecebidasPendentes} aguardando aceite`, hint: "Ação requerida" },
      { label: "Ato de Designação", value: portariaNumeroVigente },
    ],
    [bensTotalCarga, bensPendentesInventario, transferenciasRecebidasPendentes, portariaNumeroVigente]
  );

  const exportPendenciasPessoaisCsv = () => {
    const lines = [
      ["Servidor", "Prontuario", "Setor", "BensTotal", "InventarioPendente", "TransferenciasPendentes", "PortariaVigente"].join(","),
      [
        `"${userName}"`,
        `"${prontuario}"`,
        `"${setorNome}"`,
        bensTotalCarga,
        bensPendentesInventario,
        transferenciasRecebidasPendentes,
        `"${portariaNumeroVigente}"`,
      ].join(","),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pendencias-pessoais-${prontuario}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* CARD DE BOAS-VINDAS PERSONALIZADAS (RF-MOD-24-01 / RN-MOD-24-01) */}
      <section className="glass-card p-6 border border-primary/30 bg-primary/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-primary uppercase tracking-wide">
            <Sparkles className="h-4 w-4" /> Portal Oficial do Responsável Patrimonial
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Olá, {firstName}!
          </h2>
          <p className="text-xs text-muted-foreground">
            Servidor: <b className="text-foreground">{userName}</b> (Prontuário: <span className="font-mono">{prontuario}</span>) · {setorNome} — {secretariaNome}
          </p>
        </div>

        <button
          onClick={exportPendenciasPessoaisCsv}
          className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted shrink-0"
        >
          <Download className="h-4 w-4" /> Relatório de Pendências (CSV)
        </button>
      </section>

      <KPIGrid items={kpis} />

      {/* BLOCO DE TAREFAS PRIORITÁRIAS E INVENTÁRIO (RF-MOD-24-02 & RF-MOD-24-03) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* INVENTÁRIO PENDENTE (RF-MOD-24-03) */}
        <section className="glass-card p-5 border border-emerald-500/40 bg-emerald-500/5 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <ClipboardList className="h-5 w-5 text-emerald-400" />
              <span>Inventário Anual em Andamento — Ação Requerida</span>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
              85% Concluído
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-muted-foreground">
              Restam <b>{bensPendentesInventario} bens</b> para leitura de QR Code e localização física no seu setor.
            </p>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: "85%" }} />
              <div className="h-full bg-amber-500" style={{ width: "15%" }} />
            </div>

            <div className="flex justify-end pt-2">
              <Link
                to="/_resp/responsavel/inventario"
                className="h-9 px-4 rounded-md bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                Continuar Leitura de Inventário <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* PORTARIA VIGENTE DE DESIGNAÇÃO (RF-MOD-24-05) */}
        <section className="glass-card p-5 border border-border/60 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground border-b border-border pb-3">
            <ScrollText className="h-4 w-4 text-primary" />
            <span>Portaria Vigente</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-primary text-base">{portariaNumeroVigente}</div>
            <p className="text-muted-foreground">Publicada no Diário Oficial Eletrônico nº 1.482</p>
            <div className="p-2 rounded bg-background/60 border border-border font-mono text-[10px] truncate text-muted-foreground">
              Hash: {portariaHash.slice(0, 24)}...
            </div>

            <div className="pt-1">
              <Link
                to="/_resp/responsavel/portaria"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                Visualizar Documento Oficial <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* TRANSFERÊNCIAS RECEBIDAS (RF-MOD-24-04) */}
      {transferenciasRecebidasPendentes > 0 && (
        <section className="glass-card p-5 border border-blue-500/40 bg-blue-500/5 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Inbox className="h-5 w-5 text-blue-400" />
              <span>Transferência Recebida Aguardando Confirmação</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold text-xs">
              1 Pendente
            </span>
          </div>

          <div className="p-3 bg-background/80 border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-foreground">Protocolo #TRF-2026-089 — 1x Notebook Dell Latitude 5540</div>
              <p className="text-muted-foreground">Origem: Galpão Central de Manutenção · Emissor: Carlos Eduardo</p>
            </div>
            <Link
              to="/_resp/responsavel/transferencia"
              className="h-8 px-3 rounded bg-blue-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1 hover:opacity-90 shrink-0"
            >
              Conferir e Aceitar
            </Link>
          </div>
        </section>
      )}

      {/* NAVEGAÇÃO DE MÓDULOS E TUTORIAL (RF-MOD-24-06) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Módulos Principais & Recursos de Apoio
          </h3>

          <Link
            to="/_resp/responsavel/tutorial"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            <GraduationCap className="h-4 w-4" /> Tutorial e Guia do Responsável
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {RESP_NAV.map((it) => {
            const Icon = ICONS[it.icon] ?? UserCog;
            return (
              <Link
                key={it.to}
                to={it.to}
                className="group glass-card p-5 flex flex-col gap-3 border border-border/60 hover:border-primary/60 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{it.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{it.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEED DE NOTIFICAÇÕES RECENTES (RF-MOD-24-07) */}
      <section className="glass-card p-5 border border-border/60 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Bell className="h-4 w-4 text-primary" />
            <span>Central de Notificações Recentes do Responsável</span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {MOCK_NOTIFICACOES.map((n) => (
            <div key={n.id} className="p-3 rounded-lg bg-background/60 border border-border flex items-start gap-3">
              <div className="p-1.5 rounded bg-primary/15 text-primary shrink-0 mt-0.5">
                <Bell className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{n.titulo}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{n.dataHora}</span>
                </div>
                <p className="text-muted-foreground">{n.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
