import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell,
  Calendar as CalendarIcon,
  CheckSquare,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Mail,
  Smartphone,
  Inbox,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Check,
  Zap,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações, Calendário e Tarefas (MOD-38) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Central unificada de alertas acionáveis, calendário de prazos de inventário, tarefas atribuídas com escalonamento automático e preferências por canal.",
      },
    ],
  }),
  component: AdmNotificacoesPage,
});

export interface NotificacaoItem {
  id: string;
  titulo: string;
  resumo: string; // RN-MOD-38-05 (Resumido se sensível)
  timestamp: string;
  categoria: "Auditoria" | "Inventário" | "Galpão" | "Manutenção" | "Sistema";
  severidade: "NORMAL" | "ALERTA" | "CRITICO";
  lida: boolean; // RF-MOD-38-09
  linkRecurso?: string; // RN-MOD-38-04
}

export interface TarefaAtribuidaItem {
  id: string;
  titulo: string;
  responsavelProntuario: string;
  responsavelNome: string;
  dataLimite: string;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO";
  isEscalonada: boolean; // RF-MOD-38-08 (Escalonada para supervisão)
  setor: string;
}

export interface EventoCalendario {
  id: string;
  data: string;
  titulo: string;
  tipo: "Inventário" | "Devolução" | "Garantia" | "Vistoria";
  destaque: boolean;
}

const INITIAL_NOTIFICACOES: NotificacaoItem[] = [
  {
    id: "NOTIF-101",
    titulo: "Termo de Responsabilidade Pendente de Ateste",
    resumo: "Termo TR-2026-9901 (Bens de TI) aguarda assinatura digital do servidor João Mendes.",
    timestamp: "Há 15 minutos",
    categoria: "Inventário",
    severidade: "ALERTA",
    lida: false,
    linkRecurso: "/_app/adm/bens/cadastro",
  },
  {
    id: "NOTIF-102",
    titulo: "Alerta de Anomalia de Acesso ao Sistema",
    resumo: "Acesso administrativo realizado fora do horário comercial via IP 201.88.99.120.",
    timestamp: "Há 2 horas",
    categoria: "Auditoria",
    severidade: "CRITICO",
    lida: false,
    linkRecurso: "/_app/adm/auditoria",
  },
  {
    id: "NOTIF-103",
    titulo: "Item com Estoque Mínimo no Galpão",
    resumo: "Plaquetas RFID de Alumínio atingiram a margem de segurança (50 unidades restantes).",
    timestamp: "Hoje às 09:00",
    categoria: "Galpão",
    severidade: "NORMAL",
    lida: true,
    linkRecurso: "/_app/adm/relatorios",
  },
];

const INITIAL_TAREFAS: TarefaAtribuidaItem[] = [
  {
    id: "TSK-201",
    titulo: "Realizar Vistoria Física na Unidade de Saúde Fazendinha",
    responsavelProntuario: "42159",
    responsavelNome: "Neemias Oliveira",
    dataLimite: "2026-07-26", // Vencida (Escalonada)
    status: "PENDENTE",
    isEscalonada: true, // RF-MOD-38-08
    setor: "Secretaria de Saúde",
  },
  {
    id: "TSK-202",
    titulo: "Finalizar Conciliação de Nota Fiscal NF-99201",
    responsavelProntuario: "33890",
    responsavelNome: "Dra. Patricia Lima",
    dataLimite: "2026-07-30",
    status: "EM_ANDAMENTO",
    isEscalonada: false,
    setor: "Almoxarifado Central",
  },
  {
    id: "TSK-203",
    titulo: "Emitir Laudo de Baixa do Lote L-2026-12",
    responsavelProntuario: "42159",
    responsavelNome: "Neemias Oliveira",
    dataLimite: "2026-08-05",
    status: "CONCLUIDO",
    isEscalonada: false,
    setor: "Comissão de Desfazimento",
  },
];

const EVENTOS_CALENDARIO: EventoCalendario[] = [
  { id: "EVT-01", data: "2026-07-29", titulo: "Término da Janela do Inventário Anual de TI", tipo: "Inventário", destaque: true },
  { id: "EVT-02", data: "2026-07-31", titulo: "Vencimento da Garantia de 50 Notebooks Dell", tipo: "Garantia", destaque: false },
  { id: "EVT-03", data: "2026-08-04", titulo: "Devolução Programada de Projetores de Evento", tipo: "Devolução", destaque: false },
  { id: "EVT-04", data: "2026-08-10", titulo: "Vistoria Semestral de Segurança Patrimonial", tipo: "Vistoria", destaque: true },
];

function AdmNotificacoesPage() {
  const [activeTab, setActiveTab] = useState<"inbox" | "calendario" | "tarefas">("inbox");
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>(INITIAL_NOTIFICACOES);
  const [tarefas, setTarefas] = useState<TarefaAtribuidaItem[]>(INITIAL_TAREFAS);
  const [showPreferenciasModal, setShowPreferenciasModal] = useState(false);

  // Filter Inbox
  const [inboxFilter, setInboxFilter] = useState<"TODAS" | "NAO_LIDAS" | "CRITICAS">("TODAS");

  // State Preferências de Canais (RF-MOD-38-04)
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefPush, setPrefPush] = useState(true);

  const filteredNotificacoes = useMemo(() => {
    return notificacoes.filter((n) => {
      if (inboxFilter === "NAO_LIDAS") return !n.lida;
      if (inboxFilter === "CRITICAS") return n.severidade === "CRITICO";
      return true;
    });
  }, [notificacoes, inboxFilter]);

  const unreadCount = useMemo(() => notificacoes.filter((n) => !n.lida).length, [notificacoes]);

  const kpis = useMemo(
    () => [
      { label: "Notificações Não Lidas", value: `${unreadCount} alertas`, hint: "Inbox interno acionável" },
      { label: "Tarefas Pendentes / Em Curso", value: `${tarefas.filter((t) => t.status !== "CONCLUIDO").length} tarefas` },
      {
        label: "Tarefas Escalonadas por Atraso",
        value: `${tarefas.filter((t) => t.isEscalonada).length} escalonadas`,
        hint: "Aviso enviado à supervisão (RF-MOD-38-08)",
      },
      { label: "Canais Ativos", value: "Inbox, E-mail & Push", hint: "Conforme preferências (RF-MOD-38-04)" },
    ],
    [unreadCount, tarefas]
  );

  const handleMarcarTodasComoLidas = () => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  const handleMarcarLida = (id: string) => {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  };

  const handleToggleStatusTarefa = (id: string) => {
    setTarefas((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const newStatus = t.status === "CONCLUIDO" ? "PENDENTE" : "CONCLUIDO";
        return { ...t, status: newStatus, isEscalonada: newStatus === "CONCLUIDO" ? false : t.isEscalonada };
      })
    );
  };

  const exportNotificacoesCsv = () => {
    const headers = ["IDNotificacao", "Titulo", "Resumo", "Categoria", "Severidade", "Timestamp", "StatusLeitura"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const n of notificacoes) {
      lines.push(
        [
          escape(n.id),
          escape(n.titulo),
          escape(n.resumo),
          escape(n.categoria),
          escape(n.severidade),
          escape(n.timestamp),
          escape(n.lida ? "Lida" : "Nao Lida"),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-notificacoes-pendentes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notificações, Calendário e Tarefas (MOD-38)"
        description="Inbox acionável de alertas, agenda operacional de prazos de inventário, tarefas atribuídas com escalonamento por atraso e preferências por canal."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Comunicação & Prazos" }, { label: "Central Unificada" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowPreferenciasModal(true)}
              className="h-9 px-3 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Sliders className="h-4 w-4 text-primary" /> Preferências de Canais (RF-MOD-38-04)
            </button>
            <button
              onClick={exportNotificacoesCsv}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Download className="h-4 w-4" /> Exportar Alertas (CSV)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* NAVEGAÇÃO ENTRE ABAS */}
      <section className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "inbox"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Inbox className="h-4 w-4" /> Inbox de Alertas {unreadCount > 0 && `(${unreadCount})`}
        </button>

        <button
          onClick={() => setActiveTab("calendario")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "calendario"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <CalendarIcon className="h-4 w-4" /> Calendário de Prazos (RF-MOD-38-05)
        </button>

        <button
          onClick={() => setActiveTab("tarefas")}
          className={`h-9 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-all ${
            activeTab === "tarefas"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <CheckSquare className="h-4 w-4" /> Tarefas Atribuídas (RF-MOD-38-07)
        </button>
      </section>

      {/* ABA 1: INBOX INTERNO DE NOTIFICAÇÕES (RF-MOD-38-01 / RF-MOD-38-09 / RN-MOD-38-04) */}
      {activeTab === "inbox" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-foreground">Filtrar Inbox:</span>
              <div className="flex items-center gap-1">
                {(["TODAS", "NAO_LIDAS", "CRITICAS"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setInboxFilter(f)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                      inboxFilter === f
                        ? "bg-primary/20 text-primary border-primary/40"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {f === "TODAS" ? "Todas" : f === "NAO_LIDAS" ? "Não Lidas" : "Alertas Críticos"}
                  </button>
                ))}
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarcarTodasComoLidas}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" /> Marcar todas como lidas (RF-MOD-38-09)
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredNotificacoes.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  !n.lida ? "bg-accent/10 border-accent/30 font-semibold" : "bg-background/40 border-border/60 opacity-80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      n.severidade === "CRITICO"
                        ? "bg-rose-500/20 text-rose-400"
                        : n.severidade === "ALERTA"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs text-foreground">{n.titulo}</h4>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground">
                        {n.categoria}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">• {n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{n.resumo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {!n.lida && (
                    <button
                      onClick={() => handleMarcarLida(n.id)}
                      className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground font-bold text-[11px]"
                      title="Marcar como lida"
                    >
                      Marcar como lida
                    </button>
                  )}

                  {n.linkRecurso && (
                    <Link
                      to={n.linkRecurso as any}
                      className="px-3 py-1 rounded bg-primary text-primary-foreground font-bold text-[11px] inline-flex items-center gap-1 hover:opacity-90"
                    >
                      Acessar Recurso <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABA 2: CALENDÁRIO DE PRAZOS E VISTORIAS (RF-MOD-38-05 / RF-MOD-38-06) */}
      {activeTab === "calendario" && (
        <section className="glass-card p-6 border border-border/60 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" /> Agenda e Calendário de Prazos Patrimoniais
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Julho / Agosto 2026</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {EVENTOS_CALENDARIO.map((evt) => (
              <div
                key={evt.id}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  evt.destaque ? "bg-primary/10 border-primary/30" : "bg-background/50 border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-muted rounded-xl text-center shrink-0 border border-border">
                    <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                      {evt.data.slice(5, 7) === "07" ? "JUL" : "AGO"}
                    </span>
                    <span className="block font-bold text-sm text-primary font-mono">{evt.data.slice(8, 10)}</span>
                  </div>

                  <div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground">
                      {evt.tipo}
                    </span>
                    <h4 className="font-bold text-xs text-foreground mt-1 leading-snug">{evt.titulo}</h4>
                    <span className="text-[10px] font-mono text-muted-foreground">Data Limite: {evt.data}</span>
                  </div>
                </div>

                {evt.destaque && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    Alerta Crítico
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABA 3: TAREFAS ATRIBUÍDAS E ESCALONAMENTO (RF-MOD-38-07 / RF-MOD-38-08) */}
      {activeTab === "tarefas" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-accent" /> Gestão de Tarefas & Escalonamento por Atraso
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              Escalonamento automático ativado (+48h vencida)
            </span>
          </div>

          <div className="space-y-3">
            {tarefas.map((t) => (
              <div
                key={t.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  t.isEscalonada ? "bg-rose-500/10 border-rose-500/30" : "bg-background border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatusTarefa(t.id)}
                    className={`p-1 rounded border mt-0.5 transition-colors ${
                      t.status === "CONCLUIDO"
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-background border-input hover:border-primary"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-bold text-xs ${t.status === "CONCLUIDO" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {t.titulo}
                      </h4>
                      {t.isEscalonada && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                          ESCALONADO PARA SUPERVISÃO (RF-MOD-38-08)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      <b>Responsável:</b> {t.responsavelNome} ({t.responsavelProntuario}) • <b>Setor:</b> {t.setor} • <b>Prazo:</b> <span className="font-mono">{t.dataLimite}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-end md:self-center">
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      t.status === "CONCLUIDO"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : t.status === "EM_ANDAMENTO"
                        ? "bg-sky-500/20 text-sky-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {t.status === "CONCLUIDO" ? "Concluído" : t.status === "EM_ANDAMENTO" ? "Em Andamento" : "Pendente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODAL PREFERÊNCIAS DE CANAIS (RF-MOD-38-04 / RN-MOD-38-02) */}
      {showPreferenciasModal && (
        <Dialog open={showPreferenciasModal} onOpenChange={setShowPreferenciasModal}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Sliders className="h-5 w-5" /> Preferências de Canais de Notificação
              </DialogTitle>
              <DialogDescription>
                Configure os canais de recebimento de alertas patrimoniais.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-2">
              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground block">E-mail Transacional (RF-MOD-38-02)</span>
                    <span className="text-[11px] text-muted-foreground">Receber resumos diários por e-mail</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefEmail}
                    onChange={(e) => setPrefEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground block">Push Web no Navegador (RF-MOD-38-03)</span>
                    <span className="text-[11px] text-muted-foreground">Alertas instantâneos na área de trabalho</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefPush}
                    onChange={(e) => setPrefPush(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-amber-300">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <ShieldAlert className="h-4 w-4" /> Comunicação Obrigatória (RN-MOD-38-02)
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Alertas de segurança, auditoria e vistorias mandatórias são sempre entregues no Inbox interno e não podem ser desativados.
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPreferenciasModal(false)}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Salvar Preferências
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
