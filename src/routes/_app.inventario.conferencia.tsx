import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Building,
  UserCheck,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Camera,
  ArrowRight,
  TrendingDown,
  Wrench,
  Lock,
  Layers,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/inventario/conferencia")({
  head: () => ({
    meta: [
      { title: "Conferência Histórica (MOD-13) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Comparativo de ciclos de inventários anteriores, linha do tempo por bem, imutabilidade de dados encerrados e ações corretivas.",
      },
    ],
  }),
  component: ConferenciaHistoricaPage,
});

export interface EventoHistoricoBem {
  cicloAno: number;
  dataConferencia: string;
  secretaria: string;
  setor: string;
  salaFisica: string;
  responsavelNome: string;
  status: "localizado" | "nao_localizado" | "avariado" | "transferido";
  conservacao: string;
  observacao?: string;
  fotoUrl?: string;
}

export interface BemHistoricoItem {
  chapa: string;
  descricao: string;
  secretariaAtual: string;
  setorAtual: string;
  recorrenciaDivergencia: boolean; // REL-MOD-13-02
  historico: EventoHistoricoBem[];
}

const INITIAL_HISTORICO_BENS: BemHistoricoItem[] = [
  {
    chapa: "100452",
    descricao: "MESA PARA ESCRITÓRIO EM L COM GAVETEIRO",
    secretariaAtual: "Secretaria de Finanças e Patrimônio",
    setorAtual: "Departamento de Contabilidade e Patrimônio",
    recorrenciaDivergencia: false,
    historico: [
      {
        cicloAno: 2026,
        dataConferencia: "2026-07-28 10:30",
        secretaria: "Secretaria de Finanças e Patrimônio",
        setor: "Departamento de Contabilidade e Patrimônio",
        salaFisica: "Sala 01 - Recepção Principal",
        responsavelNome: "Neemias Oliveira",
        status: "localizado",
        conservacao: "Bom",
      },
      {
        cicloAno: 2025,
        dataConferencia: "2025-08-14 14:20",
        secretaria: "Secretaria de Finanças e Patrimônio",
        setor: "Departamento de Contabilidade e Patrimônio",
        salaFisica: "Sala 01 - Recepção Principal",
        responsavelNome: "Neemias Oliveira",
        status: "localizado",
        conservacao: "Ótimo",
      },
      {
        cicloAno: 2024,
        dataConferencia: "2024-08-10 09:15",
        secretaria: "Secretaria de Finanças e Patrimônio",
        setor: "Departamento de Contabilidade e Patrimônio",
        salaFisica: "Sala 03 - Arquivo",
        responsavelNome: "Marcos Silva",
        status: "localizado",
        conservacao: "Ótimo",
      },
    ],
  },
  {
    chapa: "100120",
    descricao: "AR CONDICIONADO SPLIT 18000 BTU INVERTER",
    secretariaAtual: "Secretaria de Serviços Municipais",
    setorAtual: "Galpão Central de Manutenção",
    recorrenciaDivergencia: true, // Recorrência!
    historico: [
      {
        cicloAno: 2026,
        dataConferencia: "2026-07-28 12:00",
        secretaria: "Secretaria de Serviços Municipais",
        setor: "Galpão Central de Manutenção",
        salaFisica: "Sala 03 - Arquivo Morto",
        responsavelNome: "João Roberto Mendes",
        status: "avariado",
        conservacao: "Péssimo / Avariado",
        observacao: "Compressor com defeito grave sem reparo.",
        fotoUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
      },
      {
        cicloAno: 2025,
        dataConferencia: "2025-08-20 16:10",
        secretaria: "Secretaria de Serviços Municipais",
        setor: "Galpão Central de Manutenção",
        salaFisica: "Sala 03 - Arquivo Morto",
        responsavelNome: "João Roberto Mendes",
        status: "nao_localizado",
        conservacao: "Regular",
        observacao: "Item ausente durante a vistoria anual de 2025.",
      },
      {
        cicloAno: 2024,
        dataConferencia: "2024-08-12 11:00",
        secretaria: "Secretaria de Serviços Municipais",
        setor: "Galpão Central de Manutenção",
        salaFisica: "Recepção Galpão",
        responsavelNome: "Carlos Andrade",
        status: "localizado",
        conservacao: "Bom",
      },
    ],
  },
  {
    chapa: "ESP-9901",
    descricao: "NOTEBOOK DELL LATITUDE 5540 CORE I7 16GB",
    secretariaAtual: "Secretaria de Finanças e Patrimônio",
    setorAtual: "Departamento de Contabilidade e Patrimônio",
    recorrenciaDivergencia: false,
    historico: [
      {
        cicloAno: 2026,
        dataConferencia: "2026-07-28 11:15",
        secretaria: "Secretaria de Finanças e Patrimônio",
        setor: "Departamento de Contabilidade e Patrimônio",
        salaFisica: "Sala 02 - Chefia / Gabinete",
        responsavelNome: "Neemias Oliveira",
        status: "localizado",
        conservacao: "Ótimo",
      },
      {
        cicloAno: 2025,
        dataConferencia: "2025-08-15 10:00",
        secretaria: "Secretaria de Administração",
        setor: "Divisão de TI",
        salaFisica: "Sala 05 - Suporte",
        responsavelNome: "Dra. Patricia Lima",
        status: "localizado",
        conservacao: "Ótimo",
      },
    ],
  },
];

function ConferenciaHistoricaPage() {
  const [bens] = useState<BemHistoricoItem[]>(INITIAL_HISTORICO_BENS);
  const [selectedCicloAno, setSelectedCicloAno] = useState<number>(2026);
  const [qSearch, setQSearch] = useState("");
  const [onlyRecorrentes, setOnlyRecorrentes] = useState(false);

  // Modais
  const [selectedLinhaTempo, setSelectedLinhaTempo] = useState<BemHistoricoItem | null>(null);
  const [selectedEvidencia, setSelectedEvidencia] = useState<EventoHistoricoBem | null>(null);
  const [selectedAcaoCorretiva, setSelectedAcaoCorretiva] = useState<BemHistoricoItem | null>(null);
  const [tipoAcao, setTipoAcao] = useState<"baixa" | "sindicancia" | "vistoria">("sindicancia");
  const [justificativaAcao, setJustificativaAcao] = useState("");

  const filteredBens = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return bens.filter((b) => {
      if (onlyRecorrentes && !b.recorrenciaDivergencia) return false;
      if (!t) return true;

      return (
        b.chapa.toLowerCase().includes(t) ||
        b.descricao.toLowerCase().includes(t) ||
        b.secretariaAtual.toLowerCase().includes(t) ||
        b.setorAtual.toLowerCase().includes(t)
      );
    });
  }, [bens, qSearch, onlyRecorrentes]);

  const kpis = useMemo(
    () => [
      { label: "Ciclo Ativo no Filtro", value: `Ano ${selectedCicloAno}` },
      { label: "Total de Patrimônios Históricos", value: String(bens.length) },
      { label: "Recorrências de Divergência", value: String(bens.filter((b) => b.recorrenciaDivergencia).length) },
      { label: "Status do Ciclo", value: selectedCicloAno === 2026 ? "Em Aberto" : "Imutável / Encerrado" },
    ],
    [selectedCicloAno, bens]
  );

  const handleCriarAcaoCorretiva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcaoCorretiva || !justificativaAcao.trim()) return;

    alert(
      `Ação corretiva do tipo '${tipoAcao.toUpperCase()}' aberta com sucesso para o bem ${selectedAcaoCorretiva.chapa}! Protocolo de Auditoria registrado.`
    );
    setSelectedAcaoCorretiva(null);
    setJustificativaAcao("");
  };

  const exportHistoricoCsv = () => {
    const headers = ["Chapa", "Descricao", "AnoCiclo", "DataConferencia", "SetorHistorico", "ResponsavelHistorico", "StatusHistorico", "Conservacao"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const b of bens) {
      for (const ev of b.historico) {
        lines.push(
          [
            escape(b.chapa),
            escape(b.descricao),
            ev.cicloAno,
            escape(ev.dataConferencia),
            escape(ev.setor),
            escape(ev.responsavelNome),
            escape(ev.status),
            escape(ev.conservacao),
          ].join(",")
        );
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-conferencias-ciclos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Conferência Histórica de Inventários (MOD-13)"
        description="Comparativo entre ciclos anuais, linha do tempo por bem, imutabilidade de relatórios encerrados e abertura de ações corretivas."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Inventário" }, { label: "Conferência Histórica" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportHistoricoCsv}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" /> Exportar Histórico (CSV)
            </button>
          </div>
        }
      />

      {/* BANNER DE IMUTABILIDADE DO CICLO (RN-MOD-13-01) */}
      <section className="glass-card p-3.5 px-4 border border-border/60 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Lock className="h-4 w-4 text-warning shrink-0" />
          <span>Ciclos de Anos Anteriores (2024, 2025): <b>Imutáveis e Auditados (RN-MOD-13-01)</b></span>
          <span className="text-border">|</span>
          <span className="text-foreground">Retenção de Provas sem Alteração do Passado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-warning/15 text-warning font-bold border border-warning/30 text-[11px]">
            Selo de Integridade Preservada (RN-MOD-13-04)
          </span>
        </div>
      </section>

      <KPIGrid items={kpis} />

      {/* FILTROS & SELETOR DE ANO DO CICLO (RF-MOD-13-02 / RF-MOD-13-03) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Seletor de Ciclos e Filtros</span>
          </div>

          {/* CHIPS DE CICLO ANUAL (RF-MOD-13-02) */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
            {[2026, 2025, 2024].map((ano) => (
              <button
                key={ano}
                onClick={() => setSelectedCicloAno(ano)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedCicloAno === ano
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ciclo {ano} {ano < 2026 && "🔒"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-3 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Buscar por chapa, descrição, secretaria ou setor..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <label className="h-10 px-3 rounded-md border border-input bg-background/60 flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyRecorrentes}
              onChange={(e) => setOnlyRecorrentes(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary"
            />
            <span>Apenas Recorrências (REL-MOD-13-02)</span>
          </label>
        </div>
      </section>

      {/* TABELA DE CONFERÊNCIA HISTÓRICA */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Chapa</th>
                <th className="p-3">Descrição do Patrimônio</th>
                <th className="p-3">Unidade / Setor Atual</th>
                <th className="p-3">Resultado no Ciclo {selectedCicloAno}</th>
                <th className="p-3">Histórico de Ciclos (2024-2026)</th>
                <th className="p-3 text-right">Linha do Tempo / Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredBens.map((bem) => {
                const eventoCicloSel = bem.historico.find((h) => h.cicloAno === selectedCicloAno);

                return (
                  <tr key={bem.chapa} className="hover:bg-accent/10 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">
                      <div>{bem.chapa}</div>
                      {bem.recorrenciaDivergencia && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-destructive font-sans font-bold bg-destructive/10 px-1.5 py-0.2 rounded border border-destructive/30 mt-0.5">
                          <AlertTriangle className="h-3 w-3" /> Divergência Recorrente
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-medium text-foreground">
                      <div>{bem.descricao}</div>
                    </td>

                    <td className="p-3 text-muted-foreground">
                      <div>{bem.setorAtual}</div>
                      <span className="text-[11px] text-muted-foreground/80">{bem.secretariaAtual}</span>
                    </td>

                    {/* RESULTADO NO CICLO SELECIONADO (RF-MOD-13-03) */}
                    <td className="p-3">
                      {eventoCicloSel ? (
                        <div>
                          <StatusHistoricoBadge status={eventoCicloSel.status} />
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {eventoCicloSel.salaFisica} · {eventoCicloSel.responsavelNome}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Não conferido no ciclo {selectedCicloAno}</span>
                      )}
                    </td>

                    {/* RESUMO DOS CICLOS (2024, 2025, 2026) */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {[2024, 2025, 2026].map((ano) => {
                          const ev = bem.historico.find((h) => h.cicloAno === ano);
                          return (
                            <span
                              key={ano}
                              title={ev ? `Ciclo ${ano}: ${ev.status}` : `Ciclo ${ano}: Sem Registro`}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                ev
                                  ? ev.status === "localizado"
                                    ? "bg-success/20 text-success border-success/30"
                                    : "bg-destructive/20 text-destructive border-destructive/30"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {ano}: {ev ? ev.status.slice(0, 3).toUpperCase() : "N/D"}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {bem.recorrenciaDivergencia && (
                          <button
                            onClick={() => setSelectedAcaoCorretiva(bem)}
                            title="Ação Corretiva (Sindicância / Baixa)"
                            className="p-1.5 rounded bg-destructive/15 text-destructive hover:bg-destructive/30 transition-colors font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            <Wrench className="h-3.5 w-3.5" /> Corretiva (RF-MOD-13-07)
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedLinhaTempo(bem)}
                          className="px-2.5 py-1 rounded bg-muted hover:bg-primary/20 hover:text-primary transition-colors text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <History className="h-3.5 w-3.5" /> Linha do Tempo
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBens.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum bem encontrado no histórico para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL LINHA DO TEMPO CRONOLÓGICA DO BEM (RF-MOD-13-01 / REL-MOD-13-03) */}
      {selectedLinhaTempo && (
        <Dialog open={!!selectedLinhaTempo} onOpenChange={() => setSelectedLinhaTempo(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <History className="h-5 w-5" /> Linha do Tempo Patrimonial — #{selectedLinhaTempo.chapa}
              </DialogTitle>
              <DialogDescription>
                Histórico cronológico e imutável de todas as conferências e alterações de local.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 text-xs mt-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="font-bold text-foreground text-sm">{selectedLinhaTempo.descricao}</div>
                <div className="text-muted-foreground">{selectedLinhaTempo.setorAtual}</div>
              </div>

              {/* TIMELINE VERTICAL */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {selectedLinhaTempo.historico.map((ev, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>

                    <div className="glass-card p-3 border border-border/60 rounded-lg">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-foreground text-xs">Ciclo Anual {ev.cicloAno}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{ev.dataConferencia}</span>
                      </div>

                      <div className="space-y-1 text-muted-foreground">
                        <div><b>Setor/Sala:</b> {ev.setor} — {ev.salaFisica}</div>
                        <div><b>Responsável Vigente:</b> {ev.responsavelNome}</div>
                        <div><b>Estado Conservação:</b> {ev.conservacao}</div>
                        <div className="pt-1 flex items-center justify-between">
                          <StatusHistoricoBadge status={ev.status} />
                          {ev.fotoUrl && (
                            <button
                              onClick={() => setSelectedEvidencia(ev)}
                              className="text-primary hover:underline font-semibold inline-flex items-center gap-1 text-[11px]"
                            >
                              <Camera className="h-3.5 w-3.5" /> Ver Evidência Anexa (RF-MOD-13-04)
                            </button>
                          )}
                        </div>
                        {ev.observacao && (
                          <div className="p-2 rounded bg-muted/40 text-[11px] italic text-foreground mt-1">
                            Obs: "{ev.observacao}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL VISUALIZADOR DE EVIDÊNCIAS ANEXAS (RF-MOD-13-04 / RN-MOD-13-04) */}
      {selectedEvidencia && (
        <Dialog open={!!selectedEvidencia} onOpenChange={() => setSelectedEvidencia(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Camera className="h-5 w-5" /> Evidência Fotográfica Retida (RN-MOD-13-04)
              </DialogTitle>
              <DialogDescription>
                Registro visual anexado durante o Ciclo {selectedEvidencia.cicloAno}.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              {selectedEvidencia.fotoUrl ? (
                <img
                  src={selectedEvidencia.fotoUrl}
                  alt="Evidência do bem"
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg">
                  Nenhuma imagem registrada neste evento.
                </div>
              )}

              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1 text-muted-foreground">
                <div><b>Data da Captura:</b> {selectedEvidencia.dataConferencia}</div>
                <div><b>Responsável Registrado:</b> {selectedEvidencia.responsavelNome}</div>
                {selectedEvidencia.observacao && <div><b>Observação:</b> {selectedEvidencia.observacao}</div>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL AÇÃO CORRETIVA (RF-MOD-13-07) */}
      {selectedAcaoCorretiva && (
        <Dialog open={!!selectedAcaoCorretiva} onOpenChange={() => setSelectedAcaoCorretiva(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Wrench className="h-5 w-5" /> Abertura de Ação Corretiva (RF-MOD-13-07)
              </DialogTitle>
              <DialogDescription>
                Para patrimônios com divergência recorrente entre ciclos.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCriarAcaoCorretiva} className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive-foreground rounded-lg">
                <div className="font-bold">Bem #{selectedAcaoCorretiva.chapa}</div>
                <div>{selectedAcaoCorretiva.descricao}</div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Tipo de Ação Corretiva *</label>
                <select
                  value={tipoAcao}
                  onChange={(e) => setTipoAcao(e.target.value as any)}
                  className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
                >
                  <option value="sindicancia">🚨 Processo de Sindicância Patrimonial</option>
                  <option value="baixa">🗑️ Solicitação de Baixa Definitiva</option>
                  <option value="vistoria">🔍 Vistoria Técnica In Loco</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Justificativa da Comissão *</label>
                <textarea
                  required
                  rows={3}
                  value={justificativaAcao}
                  onChange={(e) => setJustificativaAcao(e.target.value)}
                  placeholder="Informe os detalhes para fundamentação do processo administrativo..."
                  className="p-2.5 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAcaoCorretiva(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-destructive text-destructive-foreground font-bold hover:opacity-90"
                >
                  Abrir Ação Corretiva
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusHistoricoBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    localizado: { label: "🟢 Localizado", cls: "bg-success/20 text-success border-success/40 font-bold" },
    nao_localizado: { label: "🔴 Não Localizado", cls: "bg-destructive/20 text-destructive border-destructive/40 font-bold" },
    avariado: { label: "⚠️ Avariado", cls: "bg-warning/20 text-warning border-warning/40 font-bold" },
    transferido: { label: "🔄 Transferido", cls: "bg-accent/20 text-accent-foreground border-accent/40 font-bold" },
  };
  const item = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
