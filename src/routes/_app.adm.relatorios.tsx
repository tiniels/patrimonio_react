import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Search,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Filter,
  RefreshCw,
  Bell,
  HardDrive,
  Lock,
  Layers,
  ChevronRight,
  Send,
  Zap,
  Check,
  FileCheck,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/relatorios")({
  head: () => ({
    meta: [
      { title: "Central de Relatórios e Exportações (MOD-37) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Catálogo oficial de 15 relatórios patrimoniais, geração síncrona/assíncrona via fila de jobs, formatos CSV/XLSX/PDF, hash SHA-256 de integridade e sanitização contra injeções.",
      },
    ],
  }),
  component: AdmRelatoriosPage,
});

export interface RelatorioCatalogItem {
  id: string; // Ex: REL-MOD-37-01
  titulo: string;
  categoria: "Patrimônio" | "Inventário" | "Galpão & Estoque" | "Contabilidade" | "Auditoria" | "Gestão";
  descricao: string;
  volumeEstimado: "Pequeno (< 1k)" | "Médio (1k-10k)" | "Alto (> 10k)";
  suportaAsync: boolean;
}

const CATALOGO_RELATORIOS: RelatorioCatalogItem[] = [
  { id: "REL-MOD-37-01", titulo: "Inventário por Setor e Responsável", categoria: "Inventário", descricao: "Listagem consolidada de bens alocados por unidade, setor e responsável de termo.", volumeEstimado: "Médio (1k-10k)", suportaAsync: true },
  { id: "REL-MOD-37-02", titulo: "Termo de Responsabilidade Ativos", categoria: "Patrimônio", descricao: "Relação de termos emitidos, assinados e pendentes com número de processo.", volumeEstimado: "Pequeno (< 1k)", suportaAsync: false },
  { id: "REL-MOD-37-03", titulo: "Transferências e Movimentações Internas", categoria: "Patrimônio", descricao: "Histórico completo de guias de transferência com origem, destino e ateste.", volumeEstimado: "Médio (1k-10k)", suportaAsync: true },
  { id: "REL-MOD-37-04", titulo: "Divergências de Inventário", categoria: "Inventário", descricao: "Relatório comparativo entre carga física lida (RFID/BC) e saldo mestre.", volumeEstimado: "Pequeno (< 1k)", suportaAsync: false },
  { id: "REL-MOD-37-05", titulo: "Bens Não Localizados / Em Apuração", categoria: "Inventário", descricao: "Listagem de bens ausentes na última contagem para instrução de sindicância.", volumeEstimado: "Pequeno (< 1k)", suportaAsync: false },
  { id: "REL-MOD-37-06", titulo: "Bens Baixados e Alienados", categoria: "Patrimônio", descricao: "Registro oficial de exclusões lógicas com motivo, laudo e portaria de baixa.", volumeEstimado: "Pequeno (< 1k)", suportaAsync: false },
  { id: "REL-MOD-37-07", titulo: "Avaliações e Reavaliações Patrimoniais", categoria: "Contabilidade", descricao: "Laudos de avaliação, valor justo e ajuste de vida útil dos bens.", volumeEstimado: "Pequeno (< 1k)", suportaAsync: false },
  { id: "REL-MOD-37-08", titulo: "Etiquetas e Chapas Geradas", categoria: "Patrimônio", descricao: "Relatório de lote de plaquetas geradas, impressas e aplicadas por período.", volumeEstimado: "Médio (1k-10k)", suportaAsync: true },
  { id: "REL-MOD-37-09", titulo: "Movimentações Patrimoniais Consolidadas", categoria: "Contabilidade", descricao: "Balancete mensal de incorporações, desincorporações e saldo acumulado.", volumeEstimado: "Médio (1k-10k)", suportaAsync: true },
  { id: "REL-MOD-37-10", titulo: "Estoque e Retiradas do Galpão", categoria: "Galpão & Estoque", descricao: "Relatório de saldos em depósito, giros de itens e requisições atendidas.", volumeEstimado: "Alto (> 10k)", suportaAsync: true },
  { id: "REL-MOD-37-11", titulo: "Notas Fiscais, Empenhos e Recebimentos", categoria: "Galpão & Estoque", descricao: "Documentos de entrada patrimonial, fornecedores e conciliação de empenho.", volumeEstimado: "Médio (1k-10k)", suportaAsync: true },
  { id: "REL-MOD-37-12", titulo: "Base de Responsáveis e Prontuários", categoria: "Gestão", descricao: "Mapeamento de servidores ativos com carga patrimonial sob guarda.", volumeEstimado: "Pequeno (< 1k)", suportaAsync: false },
  { id: "REL-MOD-37-13", titulo: "Auditoria Completa e Trilha de Eventos", categoria: "Auditoria", descricao: "Logs append-only de alterações com operador, IP, timestamp e hash SHA-256.", volumeEstimado: "Alto (> 10k)", suportaAsync: true },
  { id: "REL-MOD-37-14", titulo: "Qualidade de Dados e Cadastros Incompletos", categoria: "Auditoria", descricao: "Diagnóstico de bens sem nota fiscal, sem valor ou com inconsistência contábil.", volumeEstimado: "Médio (1k-10k)", suportaAsync: true },
  { id: "REL-MOD-37-15", titulo: "Painel Executivo e Indicadores Gerenciais", categoria: "Gestão", descricao: "Resumo executivo em PDF com gráficos de depreciação e valor total do acervo.", volumeEstimado: "Pequeno (< 1k)", suportaAsync: false },
];

export interface RelatorioHistoricoItem {
  idJob: string;
  relatorioId: string;
  titulo: string;
  formato: "CSV" | "XLSX" | "PDF";
  dataEmissao: string;
  dataCorte: string; // RN-MOD-37-04
  sha256Hash: string; // RF-MOD-37-09
  status: "Concluído" | "Em Processamento (Job)" | "Expirado";
  expiraEmDias: number; // RN-MOD-37-02
  totalLinhas: number;
}

const INITIAL_HISTORICO: RelatorioHistoricoItem[] = [
  {
    idJob: "JOB-2026-901",
    relatorioId: "REL-MOD-37-01",
    titulo: "Inventário por Setor e Responsável",
    formato: "CSV",
    dataEmissao: "2026-07-28 14:10:00",
    dataCorte: "2026-07-28 00:00:00",
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "Concluído",
    expiraEmDias: 7,
    totalLinhas: 4820,
  },
  {
    idJob: "JOB-2026-902",
    relatorioId: "REL-MOD-37-13",
    titulo: "Auditoria Completa e Trilha de Eventos",
    formato: "XLSX",
    dataEmissao: "2026-07-28 14:30:15",
    dataCorte: "2026-07-27 23:59:59",
    sha256Hash: "a8f5f167f44f4964e6c998dee827110c",
    status: "Concluído",
    expiraEmDias: 6,
    totalLinhas: 12450,
  },
];

function AdmRelatoriosPage() {
  const [qSearch, setQSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [historico, setHistorico] = useState<RelatorioHistoricoItem[]>(INITIAL_HISTORICO);

  // Modais
  const [selectedRelatorio, setSelectedRelatorio] = useState<RelatorioCatalogItem | null>(null);
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);

  // State Form Emissão
  const [formFormato, setFormFormato] = useState<"CSV" | "XLSX" | "PDF">("CSV");
  const [formAsync, setFormAsync] = useState(false);
  const [formFiltroSetor, setFormFiltroSetor] = useState("TODOS");

  // State Form Agendamento
  const [agendFrequencia, setAgendFrequencia] = useState("Semanal");
  const [agendEmail, setAgendEmail] = useState("patrimonio@santana.sp.gov.br");

  const filteredCatalog = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return CATALOGO_RELATORIOS.filter((item) => {
      if (categoriaFilter && item.categoria !== categoriaFilter) return false;
      if (!t) return true;

      return (
        item.id.toLowerCase().includes(t) ||
        item.titulo.toLowerCase().includes(t) ||
        item.descricao.toLowerCase().includes(t)
      );
    });
  }, [qSearch, categoriaFilter]);

  const kpis = useMemo(
    () => [
      { label: "Catálogo Oficial de Relatórios", value: `${CATALOGO_RELATORIOS.length} relatórios` },
      { label: "Relatórios Gerados na Sessão", value: `${historico.length} arquivos` },
      { label: "Formato de Hash de Integridade", value: "SHA-256 Imutável", hint: "Assinatura digital (RF-MOD-37-09)" },
      { label: "Neutralização de Injeção", value: "Sanitização Ativa", hint: "Conforme RN-MOD-37-05" },
    ],
    [historico]
  );

  // SANITIZAÇÃO DE FÓRMULAS MALICIOSAS EM CSV (RN-MOD-37-05)
  const sanitizeCsvValue = (val: any): string => {
    let str = String(val ?? "");
    // Se o valor inicia com =, +, -, @, insere apóstrofo para neutralizar execução de fórmula no Excel/Calc
    if (/^[=+@-]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleEmiteRelatorio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelatorio) return;

    const dataHoje = new Date().toISOString().slice(0, 10);
    const mockHash = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);

    if (formAsync) {
      // GERAÇÃO ASSÍNCRONA VIA JOBS (RN-MOD-37-01)
      const novoJob: RelatorioHistoricoItem = {
        idJob: `JOB-2026-${Math.floor(903 + Math.random() * 100)}`,
        relatorioId: selectedRelatorio.id,
        titulo: selectedRelatorio.titulo,
        formato: formFormato,
        dataEmissao: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
        dataCorte: `${dataHoje} 00:00:00`,
        sha256Hash: mockHash,
        status: "Em Processamento (Job)",
        expiraEmDias: 7,
        totalLinhas: 0,
      };

      setHistorico([novoJob, ...historico]);
      alert(`Job de relatórios iniciado em background (RN-MOD-37-01)! Você receberá uma notificação ao concluir o processamento.`);
      setSelectedRelatorio(null);

      // Simula conclusão do Job em background após 3s
      setTimeout(() => {
        setHistorico((prev) =>
          prev.map((j) => (j.idJob === novoJob.idJob ? { ...j, status: "Concluído", totalLinhas: 8500 } : j))
        );
      }, 3000);

      return;
    }

    // GERAÇÃO SÍNCRONA DIRETA (CSV COM SANITIZAÇÃO DE FÓRMULAS - RN-MOD-37-05)
    const headers = ["ID_Relatorio", "Nome_Relatorio", "Parametro_Setor", "Data_Corte", "Hash_SHA256"];
    const row = [
      sanitizeCsvValue(selectedRelatorio.id),
      sanitizeCsvValue(selectedRelatorio.titulo),
      sanitizeCsvValue(formFiltroSetor),
      sanitizeCsvValue(`${dataHoje} 00:00:00`),
      sanitizeCsvValue(mockHash),
    ];

    const csvContent = [headers.join(","), row.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedRelatorio.id.toLowerCase()}-${dataHoje}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    const novoHistorico: RelatorioHistoricoItem = {
      idJob: `JOB-2026-${Math.floor(903 + Math.random() * 100)}`,
      relatorioId: selectedRelatorio.id,
      titulo: selectedRelatorio.titulo,
      formato: formFormato,
      dataEmissao: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
      dataCorte: `${dataHoje} 00:00:00`,
      sha256Hash: mockHash,
      status: "Concluído",
      expiraEmDias: 7,
      totalLinhas: 1250,
    };

    setHistorico([novoHistorico, ...historico]);
    setSelectedRelatorio(null);
  };

  const handleSalvarAgendamento = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Agendamento de relatório '${agendFrequencia}' configurado para ser enviado para ${agendEmail}!`);
    setShowAgendamentoModal(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Central de Relatórios e Exportações (MOD-37)"
        description="Catálogo de 15 relatórios oficiais patrimoniais, geração síncrona/assíncrona via fila de jobs, assinatura com hash SHA-256 e neutralização de injeção de fórmulas."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Relatórios & Análise" }, { label: "Central Oficial" }]}
        actions={
          <button
            onClick={() => setShowAgendamentoModal(true)}
            className="h-9 px-4 rounded-md bg-accent text-accent-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
          >
            <Calendar className="h-4 w-4" /> Agendamento de Relatórios (RF-MOD-37-05)
          </button>
        }
      />

      <KPIGrid items={kpis} />

      {/* FILTROS E BUSCA DO CATÁLOGO */}
      <section className="glass-card p-4 border border-border/60 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={qSearch}
            onChange={(e) => setQSearch(e.target.value)}
            placeholder="Buscar por código de relatório (ex: REL-MOD-37-01), título ou palavra-chave..."
            className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={categoriaFilter}
          onChange={(e) => setCategoriaFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold shrink-0"
        >
          <option value="">Todas as categorias</option>
          <option value="Patrimônio">Patrimônio</option>
          <option value="Inventário">Inventário</option>
          <option value="Galpão & Estoque">Galpão & Estoque</option>
          <option value="Contabilidade">Contabilidade</option>
          <option value="Auditoria">Auditoria</option>
          <option value="Gestão">Gestão</option>
        </select>
      </section>

      {/* CATÁLOGO DOS 15 RELATÓRIOS OFICIAIS (RF-MOD-37-01 & REL-MOD-37-01 a 15) */}
      <section className="space-y-3">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" /> Catálogo Oficial de Relatórios Patrimoniais (15 Tipos)
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          {filteredCatalog.map((rel) => (
            <div
              key={rel.id}
              className="glass-card p-4 border border-border/60 hover:border-primary/50 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                    {rel.id}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {rel.categoria}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-tight">
                  {rel.titulo}
                </h4>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {rel.descricao}
                </p>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  Vol: {rel.volumeEstimado}
                </span>

                <button
                  onClick={() => {
                    setSelectedRelatorio(rel);
                    setFormAsync(rel.suportaAsync);
                  }}
                  className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1 hover:opacity-90 shadow-sm"
                >
                  <Play className="h-3.5 w-3.5" /> Gerar Relatório
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HISTÓRICO DE RELATÓRIOS GERADOS & HASH SHA-256 (RF-MOD-37-07, 08, 09 / RN-MOD-37-02, 04) */}
      <section className="glass-card p-6 border border-border/60 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" /> Histórico de Emissões & Hash SHA-256 (Expiração Segura)
          </h3>
          <span className="text-xs text-muted-foreground font-mono">Downloads válidos por 7 dias</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Relatório Emitido</th>
                <th className="p-3">Formato</th>
                <th className="p-3">Data / Hora Emissão</th>
                <th className="p-3">Data de Corte (RN-MOD-37-04)</th>
                <th className="p-3">Hash SHA-256 de Integridade</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {historico.map((h) => (
                <tr key={h.idJob} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{h.idJob}</td>
                  <td className="p-3 font-semibold text-foreground">{h.titulo}</td>
                  <td className="p-3 font-mono font-bold text-accent">{h.formato}</td>
                  <td className="p-3 font-mono text-muted-foreground">{h.dataEmissao}</td>
                  <td className="p-3 font-mono text-muted-foreground">{h.dataCorte}</td>
                  <td className="p-3 font-mono text-[10px] text-muted-foreground truncate max-w-[150px]" title={h.sha256Hash}>
                    {h.sha256Hash}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        h.status === "Concluído"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300 animate-pulse"
                      }`}
                    >
                      {h.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {h.status === "Concluído" ? (
                      <button
                        onClick={() => alert(`Baixando cópia auditada do relatório ${h.idJob}`)}
                        className="px-2.5 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 font-bold inline-flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                    ) : (
                      <span className="text-muted-foreground italic text-[11px]">Processando...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL GERAÇÃO DE RELATÓRIO (RF-MOD-37-03 / RF-MOD-37-04) */}
      {selectedRelatorio && (
        <Dialog open={!!selectedRelatorio} onOpenChange={() => setSelectedRelatorio(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileSpreadsheet className="h-5 w-5" /> Emitir {selectedRelatorio.id}
              </DialogTitle>
              <DialogDescription>{selectedRelatorio.titulo}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEmiteRelatorio} className="space-y-4 text-xs mt-2">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Formato de Saída *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["CSV", "XLSX", "PDF"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormFormato(fmt)}
                      className={`h-10 rounded-md font-bold text-xs border transition-all ${
                        formFormato === fmt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:bg-muted"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Filtro por Setor / Unidade</label>
                <select
                  value={formFiltroSetor}
                  onChange={(e) => setFormFiltroSetor(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                >
                  <option value="TODOS">Todos os Setores (Geral)</option>
                  <option value="FINANCAS">Secretaria de Finanças</option>
                  <option value="SAUDE">Secretaria de Saúde</option>
                  <option value="EDUCACAO">Secretaria de Educação</option>
                </select>
              </div>

              <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-2">
                <label className="flex items-center gap-2 font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAsync}
                    onChange={(e) => setFormAsync(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary"
                  />
                  Processamento Assíncrono via Jobs (RN-MOD-37-01)
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Recomendado para volumes volumosos. O relatório é processado em background sem travar a interface.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedRelatorio(null)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 inline-flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" /> Gerar & Baixar
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL AGENDAMENTO PERIÓDICO (RF-MOD-37-05) */}
      {showAgendamentoModal && (
        <Dialog open={showAgendamentoModal} onOpenChange={setShowAgendamentoModal}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-accent">
                <Calendar className="h-5 w-5" /> Agendamento de Relatórios Periódicos
              </DialogTitle>
              <DialogDescription>
                Configure envios automáticos para e-mails cadastrados.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSalvarAgendamento} className="space-y-3 text-xs mt-2">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Frequência de Envio *</label>
                <select
                  value={agendFrequencia}
                  onChange={(e) => setAgendFrequencia(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-bold"
                >
                  <option value="Diário">Diário (Toda manhã às 07:00)</option>
                  <option value="Semanal">Semanal (Toda Segunda-feira às 08:00)</option>
                  <option value="Mensal">Mensal (1º dia útil do mês)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">E-mail do Destinatário *</label>
                <input
                  type="email"
                  value={agendEmail}
                  onChange={(e) => setAgendEmail(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAgendamentoModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-accent text-accent-foreground font-bold hover:opacity-90"
                >
                  Salvar Agendamento
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
