import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  PackageCheck,
  ArrowLeftRight,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ChevronRight,
  UserCheck,
  FileText,
  FileCheck,
  ShieldCheck,
  Activity,
  Calendar,
  Layers,
  Zap,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import { getRespAuthSession } from "@/lib/authStore";

export const Route = createFileRoute("/_app/painel-setor")({
  head: () => ({
    meta: [
      { title: "Painel do Setor (MOD-23) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Cockpit gerencial da unidade: resumo de bens, progresso de inventário, pendências, alertas e aprovações da chefia.",
      },
    ],
  }),
  component: AdmPainelSetorPage,
});

export interface ItemMovimentacaoFeed {
  id: string;
  dataHora: string;
  tipo: "transferencia" | "inventario" | "avaliacao" | "portaria";
  titulo: string;
  descricao: string;
  autor: string;
}

const MOCK_ULTIMAS_MOVIMENTACOES: ItemMovimentacaoFeed[] = [
  {
    id: "MOV-001",
    dataHora: "2026-07-28 14:10",
    tipo: "transferencia",
    titulo: "Transferência Recebida #TRF-2026-089",
    descricao: "Transferência de 1x Notebook Dell efetuada pelo Almoxarifado Central.",
    autor: "Carlos Eduardo Silva",
  },
  {
    id: "MOV-002",
    dataHora: "2026-07-27 16:45",
    tipo: "inventario",
    titulo: "Item Conferido no Inventário #INV-2026",
    descricao: "Chapa #100452 (Mesa em L) confirmada no local Sala 102.",
    autor: "Neemias Oliveira",
  },
  {
    id: "MOV-003",
    dataHora: "2026-07-25 10:20",
    tipo: "avaliacao",
    titulo: "Laudo de Baixa Submetido #AVAL-2026-004",
    descricao: "Laudo técnico anexado para o Ar Condicionado Chapa #100120.",
    autor: "Eng. Marcos Roberto",
  },
];

function AdmPainelSetorPage() {
  const navigate = useNavigate();
  const session = getRespAuthSession();
  const setorNome = session?.unidadeNome || session?.setor || "Departamento de Contabilidade e Patrimônio";
  const responsavelNome = session?.responsavelNome || session?.responsavel || "Neemias Oliveira";

  // Módulos do Escopo (RN-MOD-23-01)
  const totalBens = 142;
  const bensConferidos = 120;
  const bensPendentesConferencia = 22;
  const bensDivergentes = 0;
  const percentualProgresso = Math.round((bensConferidos / totalBens) * 100);

  const transferenciasPendentesCount = 2; // TRF-2026-089 e TRF-2026-092
  const avaliacoesAndamentoCount = 1; // AVAL-2026-004

  const dataCorteMétricas = useMemo(
    () => new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    []
  );

  const kpis = useMemo(
    () => [
      { label: "Unidade sob Guarda", value: setorNome },
      { label: "Total de Bens na Carga", value: `${totalBens} bens` },
      { label: "Progresso do Inventário Ativo", value: `${percentualProgresso}% conferido` },
      { label: "Pendências Operacionais", value: `${transferenciasPendentesCount + avaliacoesAndamentoCount} tarefas` },
    ],
    [setorNome, totalBens, percentualProgresso, transferenciasPendentesCount, avaliacoesAndamentoCount]
  );

  const exportResumoMensalCsv = () => {
    const lines = [
      ["Setor", "Responsavel", "TotalBens", "Conferidos", "Pendentes", "Divergentes", "ProgressoInventario", "DataCorte"].join(","),
      [
        `"${setorNome}"`,
        `"${responsavelNome}"`,
        totalBens,
        bensConferidos,
        bensPendentesConferencia,
        bensDivergentes,
        `"${percentualProgresso}%"`,
        `"${dataCorteMétricas}"`,
      ].join(","),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumo-mensal-setor-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel do Setor (MOD-23)"
        description="Central unificada da unidade: acompanhamento do inventário, pendências de transferências, avaliações e aprovações da chefia."
        crumbs={[{ label: "Painel do Setor" }]}
        actions={
          <button
            onClick={exportResumoMensalCsv}
            className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Exportar Resumo Mensal (CSV)
          </button>
        }
      />

      <KPIGrid items={kpis} />

      {/* CARIMBO TEMPORAL & DATA DE CORTE (RN-MOD-23-04) */}
      <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span>Data de corte das métricas: <b>{dataCorteMétricas}</b></span>
        </span>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">✓ Métricas Exclusivas do Setor (RN-MOD-23-01)</span>
      </div>

      {/* ALERTAS DE PRAZO VENCIDO & AÇÕES DA CHEFIA (RF-MOD-23-05 / RF-MOD-23-06 / RN-MOD-23-03) */}
      <section className="glass-card p-5 border border-amber-500/40 bg-amber-500/5 space-y-3">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Central de Alertas & Aprovações Pendentes da Chefia</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs uppercase">
            PRIORIDADE ALTA (RN-MOD-23-03)
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 text-xs">
          <div className="p-3 rounded-lg bg-background/80 border border-border flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Aprovação de Transferência #TRF-2026-089</span>
              <p className="text-muted-foreground text-[11px]">1x Notebook Dell em trânsito aguardando confirmação.</p>
              <div className="text-[10px] text-amber-400 font-semibold">Prazo de aceite expira em 48h</div>
            </div>
            <button
              onClick={() => navigate({ to: "/_resp/responsavel/transferencia" as any })}
              className="px-3 py-1.5 rounded bg-primary text-primary-foreground font-bold text-[11px] hover:opacity-90 inline-flex items-center gap-1"
            >
              Analisar Aceite <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="p-3 rounded-lg bg-background/80 border border-border flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Ciclo de Inventário 2026 — Encerramento Próximo</span>
              <p className="text-muted-foreground text-[11px]">Faltam 22 bens para atingir 100% de conferência.</p>
              <div className="text-[10px] text-emerald-400 font-semibold">85% da meta concluída</div>
            </div>
            <button
              onClick={() => navigate({ to: "/_resp/responsavel/inventario" as any })}
              className="px-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-bold text-[11px] hover:opacity-90 inline-flex items-center gap-1"
            >
              Conferir Agora <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* PROGRESSO DO INVENTÁRIO DO SETOR (RF-MOD-23-02) */}
      <section className="glass-card p-5 border border-border/60 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Activity className="h-4 w-4 text-primary" />
            <span>Progresso da Conferência de Inventário da Unidade</span>
          </div>
          <span className="font-mono font-bold text-primary text-sm">{percentualProgresso}% Concluído</span>
        </div>

        {/* BARRA DE PROGRESSO VISUAL */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${percentualProgresso}%` }}
              title={`${bensConferidos} bens conferidos`}
            />
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${100 - percentualProgresso}%` }}
              title={`${bensPendentesConferencia} bens pendentes`}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
            <span className="text-emerald-400">🟢 {bensConferidos} Bens Conferidos e Localizados</span>
            <span className="text-amber-400">⏳ {bensPendentesConferencia} Bens Pendentes de Leitura</span>
            <span className="text-foreground">Total: {totalBens} bens</span>
          </div>
        </div>
      </section>

      {/* GRADE DE ATALHOS CONTEXTUAIS (RF-MOD-23-07 / RN-MOD-23-02) */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          Atalhos Rápidos de Acesso ao Escopo da Unidade
        </h3>

        <div className="grid gap-3 md:grid-cols-4">
          <button
            onClick={() => navigate({ to: "/_resp/responsavel/inventario" as any })}
            className="p-4 glass-card border border-border/60 hover:border-primary/50 text-left transition-all group flex flex-col gap-2"
          >
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 w-fit border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Inventário do Setor
            </div>
            <p className="text-xs text-muted-foreground">Realizar leitura de QR Code e conferência física dos bens.</p>
          </button>

          <button
            onClick={() => navigate({ to: "/_app/locais/bens-setor" as any })}
            className="p-4 glass-card border border-border/60 hover:border-primary/50 text-left transition-all group flex flex-col gap-2"
          >
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 w-fit border border-blue-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Bens da Carga (MOD-22)
            </div>
            <p className="text-xs text-muted-foreground">Listagem completa da carga patrimonial com busca e filtros.</p>
          </button>

          <button
            onClick={() => navigate({ to: "/_app/adm/locais/fichas" as any })}
            className="p-4 glass-card border border-border/60 hover:border-primary/50 text-left transition-all group flex flex-col gap-2"
          >
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 w-fit border border-purple-500/30">
              <FileCheck className="h-5 w-5" />
            </div>
            <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Ficha do Local (MOD-21)
            </div>
            <p className="text-xs text-muted-foreground">Consultar dossiê da unidade e emitir Termo de Guarda PDF.</p>
          </button>

          <button
            onClick={() => navigate({ to: "/_resp/responsavel/transferencia" as any })}
            className="p-4 glass-card border border-border/60 hover:border-primary/50 text-left transition-all group flex flex-col gap-2"
          >
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 w-fit border border-amber-500/30">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Solicitar Transferência
            </div>
            <p className="text-xs text-muted-foreground">Transferir bens elegíveis para outro setor ou unidade.</p>
          </button>
        </div>
      </section>

      {/* FEED DE ÚLTIMAS MOVIMENTAÇÕES (RF-MOD-23-08) */}
      <section className="glass-card p-5 border border-border/60 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Zap className="h-4 w-4 text-primary" />
            <span>Últimas Movimentações e Eventos Registrados na Unidade</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {MOCK_ULTIMAS_MOVIMENTACOES.map((mov) => (
            <div key={mov.id} className="p-3 rounded-lg bg-background/60 border border-border flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted text-primary shrink-0 font-mono text-[10px] font-bold">
                {mov.dataHora.split(" ")[1]}
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{mov.titulo}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{mov.dataHora.split(" ")[0]}</span>
                </div>
                <p className="text-muted-foreground">{mov.descricao}</p>
                <div className="text-[10px] text-primary font-medium">Por: {mov.autor}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
