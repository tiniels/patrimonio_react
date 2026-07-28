import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  RotateCcw,
  Building,
  UserCheck,
  FileText,
  ShieldCheck,
  ExternalLink,
  Send,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getAllRespUsers } from "@/lib/authStore";

export const Route = createFileRoute("/_app/adm/inventario/monitoramento")({
  head: () => ({
    meta: [
      { title: "Monitoramento de Inventário por Setor (MOD-11) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Acompanhamento em tempo real do progresso, semáforo de prazo, divergências, reabertura controlada e cobrança de inventários por setor.",
      },
    ],
  }),
  component: AdmMonitoramentoPage,
});

export type SemaforoStatus = "concluido" | "no_prazo" | "atencao" | "atrasado";

export interface MonitoramentoSetorItem {
  id: string;
  secretaria: string;
  setorNome: string;
  responsavelNome: string;
  prontuario: string;
  email: string;
  telefone: string;
  denominadorCiclo: number; // RN-MOD-11-01
  conferidos: number;
  localizados: number;
  naoLocalizados: number;
  transferencias: number;
  boletimOcorrencia: number;
  prazoFinal: string;
  semaforo: SemaforoStatus; // RF-MOD-11-03
  reaberto?: boolean;
  motivoReabertura?: string;
  aprovadorReabertura?: string;
}

const INITIAL_MONITORAMENTO: MonitoramentoSetorItem[] = [
  {
    id: "MON-001",
    secretaria: "Secretaria de Finanças e Patrimônio",
    setorNome: "Departamento de Contabilidade e Patrimônio",
    responsavelNome: "Neemias Oliveira",
    prontuario: "42159",
    email: "neemias.42159@santanadeparnaiba.sp.gov.br",
    telefone: "(11) 4622-7500",
    denominadorCiclo: 1420,
    conferidos: 1420,
    localizados: 1410,
    naoLocalizados: 6,
    transferencias: 4,
    boletimOcorrencia: 0,
    prazoFinal: "2026-08-15",
    semaforo: "concluido",
  },
  {
    id: "MON-002",
    secretaria: "Secretaria de Educação",
    setorNome: "EMEF Aldeia de Barueri",
    responsavelNome: "Marcos Antonio da Silva",
    prontuario: "42157",
    email: "marcos.silva@santanadeparnaiba.sp.gov.br",
    telefone: "(11) 4622-8100",
    denominadorCiclo: 850,
    conferidos: 680,
    localizados: 650,
    naoLocalizados: 20,
    transferencias: 8,
    boletimOcorrencia: 2,
    prazoFinal: "2026-08-10",
    semaforo: "no_prazo",
  },
  {
    id: "MON-003",
    secretaria: "Secretaria de Saúde",
    setorNome: "USA Fazendinha",
    responsavelNome: "Dra. Patricia Lima",
    prontuario: "33890",
    email: "patricia.lima@santanadeparnaiba.sp.gov.br",
    telefone: "(11) 4156-9000",
    denominadorCiclo: 610,
    conferidos: 390,
    localizados: 370,
    naoLocalizados: 15,
    transferencias: 5,
    boletimOcorrencia: 0,
    prazoFinal: "2026-07-30",
    semaforo: "atencao",
  },
  {
    id: "MON-004",
    secretaria: "Secretaria de Serviços Municipais",
    setorNome: "Galpão Central de Manutenção",
    responsavelNome: "João Roberto Mendes",
    prontuario: "11204",
    email: "joao.mendes@santanadeparnaiba.sp.gov.br",
    telefone: "(11) 4156-4400",
    denominadorCiclo: 2310,
    conferidos: 920,
    localizados: 880,
    naoLocalizados: 30,
    transferencias: 10,
    boletimOcorrencia: 0,
    prazoFinal: "2026-07-20",
    semaforo: "atrasado",
  },
];

function AdmMonitoramentoPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MonitoramentoSetorItem[]>(INITIAL_MONITORAMENTO);

  const [qSearch, setQSearch] = useState("");
  const [secFilter, setSecFilter] = useState("");
  const [semaforoFilter, setSemaforoFilter] = useState<string>("all");

  // Modais
  const [selectedPendencias, setSelectedPendencias] = useState<MonitoramentoSetorItem | null>(null);
  const [selectedContato, setSelectedContato] = useState<MonitoramentoSetorItem | null>(null);
  const [reabrirItem, setReabrirItem] = useState<MonitoramentoSetorItem | null>(null);
  const [motivoReabertura, setMotivoReabertura] = useState("");
  const [aprovadorReabertura, setAprovadorReabertura] = useState("Comissão Central de Inventário");
  const [chargeSuccess, setChargeSuccess] = useState<string | null>(null);
  const [showReportsModal, setShowReportsModal] = useState(false);

  const filteredItems = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return items.filter((it) => {
      if (secFilter && it.secretaria !== secFilter) return false;
      if (semaforoFilter !== "all" && it.semaforo !== semaforoFilter) return false;
      if (!t) return true;

      return (
        it.setorNome.toLowerCase().includes(t) ||
        it.responsavelNome.toLowerCase().includes(t) ||
        it.secretaria.toLowerCase().includes(t) ||
        it.prontuario.includes(t)
      );
    });
  }, [items, qSearch, secFilter, semaforoFilter]);

  const secretariasList = useMemo(
    () => [...new Set(items.map((i) => i.secretaria))].sort(),
    [items]
  );

  const totalBensCiclo = useMemo(() => items.reduce((acc, i) => acc + i.denominadorCiclo, 0), [items]);
  const totalBensConferidos = useMemo(() => items.reduce((acc, i) => acc + i.conferidos, 0), [items]);
  const pctGeral = totalBensCiclo > 0 ? Math.round((totalBensConferidos / totalBensCiclo) * 100) : 0;

  const kpis = useMemo(
    () => [
      { label: "Progresso Geral do Ciclo 2026", value: `${pctGeral}%` },
      { label: "Setores Concluídos", value: String(items.filter((i) => i.semaforo === "concluido").length) },
      { label: "Setores em Atenção / Risco", value: String(items.filter((i) => i.semaforo === "atencao").length) },
      { label: "Setores Atrasados / Críticos", value: String(items.filter((i) => i.semaforo === "atrasado").length) },
    ],
    [pctGeral, items]
  );

  const handleExecuteReabertura = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reabrirItem || !motivoReabertura.trim()) return;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === reabrirItem.id) {
          return {
            ...i,
            semaforo: "no_prazo",
            reaberto: true,
            motivoReabertura: motivoReabertura.trim(),
            aprovadorReabertura: aprovadorReabertura.trim(),
          };
        }
        return i;
      })
    );

    setReabrirItem(null);
    setMotivoReabertura("");
    alert(`Inventário da unidade '${reabrirItem.setorNome}' reaberto com sucesso! Auditoria registrada.`);
  };

  const handleSendChargeNotification = (item: MonitoramentoSetorItem) => {
    setChargeSuccess(`Notificação oficial de cobrança enviada com sucesso para ${item.email}!`);
    setTimeout(() => setChargeSuccess(null), 3000);
  };

  const exportProgressCsv = () => {
    const headers = [
      "Secretaria",
      "Setor",
      "Responsavel",
      "Prontuario",
      "DenominadorCiclo",
      "Conferidos",
      "PercentualConferido",
      "Localizados",
      "NaoLocalizados",
      "Transferencias",
      "BoletimOcorrencia",
      "SemaforoPrazo",
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const i of items) {
      const pct = Math.round((i.conferidos / i.denominadorCiclo) * 100);
      lines.push(
        [
          escape(i.secretaria),
          escape(i.setorNome),
          escape(i.responsavelNome),
          escape(i.prontuario),
          i.denominadorCiclo,
          i.conferidos,
          `${pct}%`,
          i.localizados,
          i.naoLocalizados,
          i.transferencias,
          i.boletimOcorrencia,
          escape(i.semaforo),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progresso-inventario-setores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const syncDateCut = new Date().toLocaleDateString("pt-BR") + " 14:00";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Monitoramento de Inventário por Setor (MOD-11)"
        description="Acompanhamento em tempo real da cobertura, prazos, divergências e reabertura controlada dos ciclos de inventário."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Inventário" }, { label: "Monitoramento por Setor" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowReportsModal(true)}
              className="h-9 px-3 rounded-md border border-input text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-accent/40 transition-colors"
            >
              <FileText className="h-4 w-4 text-primary" /> Relatórios do Ciclo
            </button>
            <button
              onClick={exportProgressCsv}
              className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" /> Exportar Progresso (CSV)
            </button>
          </div>
        }
      />

      {/* BANNER DE DATA/HORA DE CORTE (RN-MOD-11-04) */}
      <section className="glass-card p-3 px-4 border border-border/60 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <span>Data/Hora de Corte dos Indicadores: <b>{syncDateCut}</b></span>
          <span className="text-border">|</span>
          <span className="text-foreground font-semibold">Ciclo Anual Reconciliado 2026</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold border border-primary/30 text-[11px]">
            Denominador Congelado (RN-MOD-11-01)
          </span>
        </div>
      </section>

      <KPIGrid items={kpis} />

      {/* FEEDBACK DE COBRANÇA */}
      {chargeSuccess && (
        <div className="p-3.5 bg-success/20 border border-success/40 rounded-xl text-success font-semibold text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {chargeSuccess}
        </div>
      )}

      {/* FILTROS DE MONITORAMENTO (RF-MOD-11-04) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Filtros de Acompanhamento</span>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Buscar por setor, unidade ou responsável..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={secFilter}
            onChange={(e) => setSecFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs"
          >
            <option value="">Todas as secretarias ({secretariasList.length})</option>
            {secretariasList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={semaforoFilter}
            onChange={(e) => setSemaforoFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs font-semibold"
          >
            <option value="all">Todos os semáforos de prazo</option>
            <option value="concluido">🟢 Concluídos (100%)</option>
            <option value="no_prazo">🟢 No Prazo</option>
            <option value="atencao">🟡 Atenção / Em Risco</option>
            <option value="atrasado">🔴 Atrasados / Críticos</option>
          </select>
        </div>
      </section>

      {/* TABELA DE MONITORAMENTO POR SETOR (RF-MOD-11-01 a RF-MOD-11-03) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Unidade / Setor</th>
                <th className="p-3">Responsável Vigente</th>
                <th className="p-3 text-center">Bens no Ciclo</th>
                <th className="p-3">Progresso / % Conferido</th>
                <th className="p-3 text-center">Localizados</th>
                <th className="p-3 text-center">Não Localizados</th>
                <th className="p-3 text-center">Transferências</th>
                <th className="p-3">Semáforo de Prazo</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredItems.map((item) => {
                const pct = Math.round((item.conferidos / item.denominadorCiclo) * 100);

                return (
                  <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                    <td className="p-3 font-semibold text-foreground">
                      <div>{item.setorNome}</div>
                      <span className="text-[11px] font-normal text-muted-foreground">{item.secretaria}</span>
                    </td>

                    <td className="p-3 font-medium text-foreground">
                      <button
                        onClick={() => setSelectedContato(item)}
                        className="hover:underline text-left font-semibold flex items-center gap-1"
                      >
                        {item.responsavelNome} <Phone className="h-3 w-3 text-primary shrink-0" />
                      </button>
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-foreground">
                      {fmtNumber(item.denominadorCiclo)}
                    </td>

                    {/* BARRA DE PROGRESSO VISUAL (RF-MOD-11-01) */}
                    <td className="p-3 w-48">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-bold text-primary">{pct}%</span>
                        <span className="text-muted-foreground">{item.conferidos} / {item.denominadorCiclo}</span>
                      </div>
                      <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            pct === 100 ? "bg-success" : pct > 50 ? "bg-primary" : "bg-warning"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-success">
                      {item.localizados}
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-destructive">
                      {item.naoLocalizados > 0 ? (
                        <button
                          onClick={() => setSelectedPendencias(item)}
                          className="hover:underline text-destructive inline-flex items-center gap-0.5"
                        >
                          {item.naoLocalizados} <AlertTriangle className="h-3 w-3" />
                        </button>
                      ) : (
                        "0"
                      )}
                    </td>

                    <td className="p-3 text-center font-mono text-accent-foreground font-semibold">
                      {item.transferencias}
                    </td>

                    {/* SEMÁFORO DE PRAZO (RF-MOD-11-03) */}
                    <td className="p-3">
                      <SemaforoBadge semaforo={item.semaforo} prazo={item.prazoFinal} />
                      {item.reaberto && (
                        <span className="block text-[10px] text-warning font-mono font-bold mt-0.5">
                          🔄 Reaberto
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSendChargeNotification(item)}
                          title="Enviar notificação de cobrança"
                          className="p-1.5 rounded bg-muted hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setReabrirItem(item)}
                          title="Reabertura controlada do inventário"
                          className="p-1.5 rounded bg-muted hover:bg-warning/20 hover:text-warning transition-colors text-muted-foreground"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    Nenhum setor encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL DETALHE DAS PENDÊNCIAS (RF-MOD-11-05) */}
      {selectedPendencias && (
        <Dialog open={!!selectedPendencias} onOpenChange={() => setSelectedPendencias(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Detalhamento de Pendências — {selectedPendencias.setorNome}
              </DialogTitle>
              <DialogDescription>
                Bens com situação 'Não Localizado' ou aguardando aceite do responsável.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive-foreground">
                <span className="font-bold">Total de Divergências:</span> {selectedPendencias.naoLocalizados} bens não localizados nesta unidade.
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    const sec = selectedPendencias.setorNome;
                    setSelectedPendencias(null);
                    navigate({ to: "/adm/explorar", search: () => ({ local: sec, divergencias: "1" }) });
                  }}
                  className="h-9 px-4 rounded bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1 hover:opacity-90"
                >
                  Abrir no Explorador com Filtro <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL CONTATO DO RESPONSÁVEL (RF-MOD-11-06) */}
      {selectedContato && (
        <Dialog open={!!selectedContato} onOpenChange={() => setSelectedContato(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Contato do Responsável do Setor
              </DialogTitle>
              <DialogDescription>
                Informações para notificação e acompanhamento direto.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="font-bold text-sm text-foreground">{selectedContato.responsavelNome}</div>
                <div className="text-muted-foreground">{selectedContato.setorNome}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 rounded bg-background/50 border border-border/40">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-mono text-foreground">{selectedContato.email}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded bg-background/50 border border-border/40">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-mono text-foreground">{selectedContato.telefone}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedContato(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSendChargeNotification(selectedContato);
                    setSelectedContato(null);
                  }}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 flex items-center gap-1"
                >
                  <Send className="h-3.5 w-3.5" /> Enviar E-mail de Cobrança
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL REABERTURA CONTROLADA (RF-MOD-11-07 / RN-MOD-11-03) */}
      {reabrirItem && (
        <Dialog open={!!reabrirItem} onOpenChange={() => setReabrirItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-warning">
                <RotateCcw className="h-5 w-5" /> Reabertura Controlada de Inventário (RN-MOD-11-03)
              </DialogTitle>
              <DialogDescription>
                A reabertura estende o prazo do ciclo para a unidade e gera evento imutável de auditoria.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleExecuteReabertura} className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-muted/30 border border-border rounded-lg">
                <div className="font-bold text-foreground">{reabrirItem.setorNome}</div>
                <div className="text-muted-foreground">Responsável: {reabrirItem.responsavelNome}</div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Motivo da Reabertura *</label>
                <textarea
                  required
                  rows={2}
                  value={motivoReabertura}
                  onChange={(e) => setMotivoReabertura(e.target.value)}
                  placeholder="Ex: Necessidade de nova vistoria física devido a reformas no bloco..."
                  className="p-2.5 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Autoridade Aprovadora *</label>
                <input
                  required
                  value={aprovadorReabertura}
                  onChange={(e) => setAprovadorReabertura(e.target.value)}
                  className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setReabrirItem(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-warning text-warning-foreground font-bold hover:opacity-90"
                >
                  Confirmar Reabertura
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL RELATÓRIOS DO CICLO (REL-MOD-11-01 a REL-MOD-11-03) */}
      {showReportsModal && (
        <Dialog open={showReportsModal} onOpenChange={setShowReportsModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Relatórios do Ciclo de Inventário
              </DialogTitle>
              <DialogDescription>
                Relatórios executivos de acompanhamento e encerramento.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <button
                onClick={exportProgressCsv}
                className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-accent/15 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-foreground">REL-MOD-11-01 — Progresso por Setor</div>
                  <div className="text-muted-foreground text-[11px]">Relatório completo em CSV do percentual conferido.</div>
                </div>
                <Download className="h-4 w-4 text-primary shrink-0" />
              </button>

              <button
                onClick={() => alert("REL-MOD-11-02: Ranking de pendências gerado.")}
                className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-accent/15 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-foreground">REL-MOD-11-02 — Ranking de Pendências</div>
                  <div className="text-muted-foreground text-[11px]">Ordena os setores pelo volume de bens não localizados.</div>
                </div>
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SemaforoBadge({ semaforo, prazo }: { semaforo: SemaforoStatus; prazo: string }) {
  const map: Record<SemaforoStatus, { label: string; cls: string }> = {
    concluido: { label: "Concluído (100%)", cls: "bg-success/20 text-success border-success/40" },
    no_prazo: { label: `No Prazo (${prazo})`, cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
    atencao: { label: `Atenção (${prazo})`, cls: "bg-warning/20 text-warning border-warning/40" },
    atrasado: { label: `Atrasado (${prazo})`, cls: "bg-destructive/20 text-destructive border-destructive/40" },
  };
  const item = map[semaforo];
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}
