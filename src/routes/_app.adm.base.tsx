import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  Search,
  Plus,
  Merge,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Users,
  ShieldCheck,
  Building,
  RefreshCw,
  Info,
  Trash2,
  Edit,
  ArrowRight,
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

export const Route = createFileRoute("/_app/adm/base")({
  head: () => ({
    meta: [
      { title: "Base Organizacional de Locais (MOD-07) — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Gestão hierárquica de secretarias, setores, locais físicos, vigência e fusão controlada de duplicidades.",
      },
    ],
  }),
  component: AdmBasePage,
});

export interface LocalOrganizacional {
  codigoInstitucional: string; // RF-MOD-07-04
  secretaria: string;
  unidadeNome: string;
  localFisico: string;
  endereco: string;
  responsavelAtual: string;
  prontuarioResponsavel: string;
  vigente: boolean; // RF-MOD-07-03
  codigoLegado?: string; // RF-MOD-07-08
  totalBensAlocados: number;
}

const INITIAL_LOCAIS: LocalOrganizacional[] = [
  {
    codigoInstitucional: "FIN-101",
    secretaria: "Secretaria de Finanças e Patrimônio",
    unidadeNome: "Departamento de Contabilidade e Patrimônio",
    localFisico: "Centro Administrativo Bandeirantes - Bloco A",
    endereco: "Av. Marechal Rondon, 350 - Centro",
    responsavelAtual: "Neemias Oliveira",
    prontuarioResponsavel: "42159",
    vigente: true,
    codigoLegado: "LOC-001",
    totalBensAlocados: 1420,
  },
  {
    codigoInstitucional: "EDU-204",
    secretaria: "Secretaria de Educação",
    unidadeNome: "EMEF Aldeia de Barueri",
    localFisico: "Prédio Principal - Bloco Pedagógico",
    endereco: "Rua das Flores, 120 - Aldeia",
    responsavelAtual: "Marcos Antonio da Silva",
    prontuarioResponsavel: "42157",
    vigente: true,
    codigoLegado: "LOC-044",
    totalBensAlocados: 850,
  },
  {
    codigoInstitucional: "SAU-301",
    secretaria: "Secretaria de Saúde",
    unidadeNome: "USA Fazendinha",
    localFisico: "Unidade de Saúde Avançada",
    endereco: "Estrada da Fazendinha, 1500",
    responsavelAtual: "Dra. Patricia Lima",
    prontuarioResponsavel: "33890",
    vigente: true,
    codigoLegado: "LOC-089",
    totalBensAlocados: 610,
  },
  {
    codigoInstitucional: "SMA-402",
    secretaria: "Secretaria de Serviços Municipais",
    unidadeNome: "Galpão Central de Manutenção",
    localFisico: "Depósito Geral de Merenda e Almocharifado",
    endereco: "Av. Tenente Marques, 4000 - Fazendinha",
    responsavelAtual: "João Roberto Mendes",
    prontuarioResponsavel: "11204",
    vigente: true,
    codigoLegado: "GAL-001",
    totalBensAlocados: 2310,
  },
  {
    codigoInstitucional: "EDU-299",
    secretaria: "Secretaria de Educação",
    unidadeNome: "Creche Municipal Antiga (Inativa)",
    localFisico: "Prédio Desativado",
    endereco: "Rua do Rosário, 45",
    responsavelAtual: "Sem responsável ativo",
    prontuarioResponsavel: "00000",
    vigente: false,
    codigoLegado: "LOC-999",
    totalBensAlocados: 42,
  },
];

function AdmBasePage() {
  const [locais, setLocais] = useState<LocalOrganizacional[]>(INITIAL_LOCAIS);
  const [qSearch, setQSearch] = useState("");
  const [secFilter, setSecFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Form de Novo Local
  const [newCod, setNewCod] = useState("");
  const [newSec, setNewSec] = useState("Secretaria de Finanças e Patrimônio");
  const [newUnidade, setNewUnidade] = useState("");
  const [newLocalFisico, setNewLocalFisico] = useState("");
  const [newEndereco, setNewEndereco] = useState("");
  const [newResp, setNewResp] = useState("");

  // Form de Fusão (RF-MOD-07-06)
  const [origemCod, setOrigemCod] = useState("");
  const [destinoCod, setDestinoCod] = useState("");
  const [fusionSuccess, setFusionSuccess] = useState<string | null>(null);

  const filteredLocais = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return locais.filter((l) => {
      if (secFilter && l.secretaria !== secFilter) return false;
      if (statusFilter === "active" && !l.vigente) return false;
      if (statusFilter === "inactive" && l.vigente) return false;
      if (!t) return true;

      return (
        l.codigoInstitucional.toLowerCase().includes(t) ||
        l.unidadeNome.toLowerCase().includes(t) ||
        l.secretaria.toLowerCase().includes(t) ||
        l.localFisico.toLowerCase().includes(t) ||
        l.responsavelAtual.toLowerCase().includes(t) ||
        (l.codigoLegado && l.codigoLegado.toLowerCase().includes(t))
      );
    });
  }, [locais, qSearch, secFilter, statusFilter]);

  const secretariasList = useMemo(
    () => [...new Set(locais.map((l) => l.secretaria))].sort(),
    [locais]
  );

  const kpis = useMemo(
    () => [
      { label: "Total de Locais Cadastrados", value: String(locais.length) },
      { label: "Unidades Vigentes (Ativas)", value: String(locais.filter((l) => l.vigente).length) },
      {
        label: "Unidades Inativas (Com Bens)",
        value: String(locais.filter((l) => !l.vigente && l.totalBensAlocados > 0).length),
      },
      {
        label: "Bens Totais Alocados",
        value: fmtNumber(locais.reduce((acc, l) => acc + l.totalBensAlocados, 0)),
      },
    ],
    [locais]
  );

  const handleAddLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnidade.trim() || !newCod.trim()) return;

    const newLoc: LocalOrganizacional = {
      codigoInstitucional: newCod.trim().toUpperCase(),
      secretaria: newSec,
      unidadeNome: newUnidade.trim(),
      localFisico: newLocalFisico.trim() || "Prédio Principal",
      endereco: newEndereco.trim() || "Santana de Parnaíba - SP",
      responsavelAtual: newResp.trim() || "A Atribuir",
      prontuarioResponsavel: "42159",
      vigente: true,
      totalBensAlocados: 0,
    };

    setLocais((prev) => [newLoc, ...prev]);
    setShowAddModal(false);
    setNewCod("");
    setNewUnidade("");
    setNewLocalFisico("");
    setNewEndereco("");
    setNewResp("");
  };

  const handleExecuteMerge = (e: React.FormEvent) => {
    e.preventDefault();
    setFusionSuccess(null);

    const orig = locais.find((l) => l.codigoInstitucional === origemCod);
    const dest = locais.find((l) => l.codigoInstitucional === destinoCod);

    if (!orig || !dest || orig.codigoInstitucional === dest.codigoInstitucional) {
      alert("Selecione um local de origem e um local de destino válidos e distintos.");
      return;
    }

    const bensMover = orig.totalBensAlocados;

    // Atualizar estado reatribuindo os bens do local origem para o destino e inativando origem
    setLocais((prev) =>
      prev.map((l) => {
        if (l.codigoInstitucional === dest.codigoInstitucional) {
          return { ...l, totalBensAlocados: l.totalBensAlocados + bensMover };
        }
        if (l.codigoInstitucional === orig.codigoInstitucional) {
          return { ...l, totalBensAlocados: 0, vigente: false };
        }
        return l;
      })
    );

    setFusionSuccess(
      `Fusão concluída com sucesso! ${bensMover} patrimônios foram reatribuídos de '${orig.unidadeNome}' para '${dest.unidadeNome}'.`
    );
  };

  const exportStructureCsv = () => {
    const headers = [
      "CodigoInstitucional",
      "Secretaria",
      "UnidadeNome",
      "LocalFisico",
      "Endereco",
      "ResponsavelAtual",
      "StatusVigencia",
      "TotalBensAlocados",
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];
    for (const l of locais) {
      lines.push(
        [
          escape(l.codigoInstitucional),
          escape(l.secretaria),
          escape(l.unidadeNome),
          escape(l.localFisico),
          escape(l.endereco),
          escape(l.responsavelAtual),
          escape(l.vigente ? "Vigente" : "Inativo"),
          l.totalBensAlocados,
        ].join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estrutura-organizacional-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Base Organizacional de Secretarias & Locais (MOD-07)"
        description="Estrutura hierárquica oficial para escopos de responsabilidade, inventário e fusão de duplicidades."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Locais & Segurança" }, { label: "Base Organizacional" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowMergeModal(true)}
              className="h-9 px-3 rounded-md border border-accent/40 bg-accent/10 text-accent-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-accent/20 transition-all"
            >
              <Merge className="h-4 w-4" /> Fusão de Duplicidades
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90 transition-all"
            >
              <Plus className="h-4 w-4" /> Cadastrar Novo Local
            </button>
            <button
              onClick={exportStructureCsv}
              className="h-9 px-3 rounded-md border border-input text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-muted transition-colors"
            >
              <Download className="h-4 w-4" /> Exportar Estrutura (CSV)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* FILTROS E PESQUISA DA BASE ORGANIZACIONAL */}
      <section className="glass-card p-4 border border-border/60">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Filtros de Locais & Unidades</span>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <FileText className="h-3.5 w-3.5" /> Ver Relatórios de Inconsistências
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Buscar por código (ex: FIN-101), nome da unidade, local ou responsável…"
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs font-medium"
          >
            <option value="all">Todos os status de vigência</option>
            <option value="active">Somente Unidades Vigentes (Ativas)</option>
            <option value="inactive">Somente Unidades Inativas</option>
          </select>
        </div>
      </section>

      {/* TABELA DA ESTRUTURA ORGANIZACIONAL (RF-MOD-07-01 a RF-MOD-07-05) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Código Institucional</th>
                <th className="p-3">Unidade / Setor</th>
                <th className="p-3">Secretaria Pertencente</th>
                <th className="p-3">Local Físico / Endereço</th>
                <th className="p-3">Responsável Atual</th>
                <th className="p-3 text-center">Bens Alocados</th>
                <th className="p-3">Vigência</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredLocais.map((loc) => (
                <tr key={loc.codigoInstitucional} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{loc.codigoInstitucional}</td>
                  <td className="p-3 font-semibold text-foreground">
                    <div>{loc.unidadeNome}</div>
                    {loc.codigoLegado && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Legado: {loc.codigoLegado}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{loc.secretaria}</td>
                  <td className="p-3">
                    <div className="text-foreground">{loc.localFisico}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" /> {loc.endereco}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-foreground">{loc.responsavelAtual}</span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-accent-foreground">
                    {fmtNumber(loc.totalBensAlocados)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        loc.vigente ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {loc.vigente ? "Vigente" : "Inativa"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => alert(`Editar detalhes da unidade ${loc.codigoInstitucional}`)}
                      className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-[11px] font-medium"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLocais.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhum local encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: CADASTRO DE NOVO LOCAL (RF-MOD-07-01 / RF-MOD-07-04) */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Cadastrar Novo Local Organizacional
              </DialogTitle>
              <DialogDescription>
                Informe o código institucional e os detalhes do novo setor.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddLocal} className="flex flex-col gap-3 mt-2 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Código Institucional Único *</label>
                <input
                  required
                  value={newCod}
                  onChange={(e) => setNewCod(e.target.value)}
                  placeholder="Ex: SEC-104"
                  className="h-9 px-3 rounded-md border border-input bg-background/60 font-mono text-sm uppercase"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Secretaria Pertencente *</label>
                <select
                  value={newSec}
                  onChange={(e) => setNewSec(e.target.value)}
                  className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                >
                  {secretariasList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Nome da Unidade / Setor *</label>
                <input
                  required
                  value={newUnidade}
                  onChange={(e) => setNewUnidade(e.target.value)}
                  placeholder="Ex: EMEF Aldeia de Barueri"
                  className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Local Físico / Prédio</label>
                <input
                  value={newLocalFisico}
                  onChange={(e) => setNewLocalFisico(e.target.value)}
                  placeholder="Ex: Bloco Pedagógico II"
                  className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Endereço Completo</label>
                <input
                  value={newEndereco}
                  onChange={(e) => setNewEndereco(e.target.value)}
                  placeholder="Ex: Av. Marechal Rondon, 350"
                  className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Responsável Vigente</label>
                <input
                  value={newResp}
                  onChange={(e) => setNewResp(e.target.value)}
                  placeholder="Ex: Neemias Oliveira"
                  className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Salvar Local
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: FUSÃO CONTROLADA DE DUPLICIDADES (RF-MOD-07-06 / RN-MOD-07-04) */}
      {showMergeModal && (
        <Dialog open={showMergeModal} onOpenChange={setShowMergeModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-accent">
                <Merge className="h-5 w-5" /> Fusão Controlada de Duplicidades (RF-MOD-07-06)
              </DialogTitle>
              <DialogDescription>
                Unifique dois locais duplicados. Todos os patrimônios do local de origem serão automaticamente reatribuídos para o local de destino.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleExecuteMerge} className="flex flex-col gap-4 text-xs mt-2">
              <div className="p-3 bg-warning/15 border border-warning/30 rounded-lg text-warning-foreground flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                <div>
                  <span className="font-bold">Prévia de Impacto de Negócio:</span>
                  <p className="text-[11px] leading-relaxed mt-0.5">
                    O local de origem terá sua vigência encerrada (inativado) e todos os seus patrimônios serão transferidos sem perda de histórico de auditoria.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-destructive">1. Local Origem (Duplicado) *</label>
                  <select
                    value={origemCod}
                    onChange={(e) => setOrigemCod(e.target.value)}
                    className="h-10 px-2 rounded-md border border-input bg-background/60 text-xs"
                  >
                    <option value="">Selecione a origem...</option>
                    {locais.map((l) => (
                      <option key={l.codigoInstitucional} value={l.codigoInstitucional}>
                        {l.codigoInstitucional} - {l.unidadeNome} ({l.totalBensAlocados} bens)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-success">2. Local Destino (Consolidado) *</label>
                  <select
                    value={destinoCod}
                    onChange={(e) => setDestinoCod(e.target.value)}
                    className="h-10 px-2 rounded-md border border-input bg-background/60 text-xs"
                  >
                    <option value="">Selecione o destino...</option>
                    {locais.map((l) => (
                      <option key={l.codigoInstitucional} value={l.codigoInstitucional}>
                        {l.codigoInstitucional} - {l.unidadeNome} ({l.totalBensAlocados} bens)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {fusionSuccess && (
                <div className="p-3 bg-success/20 border border-success/40 rounded-lg text-success font-semibold text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {fusionSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowMergeModal(false);
                    setFusionSuccess(null);
                  }}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-accent text-accent-foreground font-bold hover:opacity-90 flex items-center gap-1.5"
                >
                  <Merge className="h-4 w-4" /> Simular & Executar Fusão
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: RELATÓRIOS E INCONSISTÊNCIAS (REL-MOD-07-01 a REL-MOD-07-03) */}
      {showReportModal && (
        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Relatórios da Base Organizacional
              </DialogTitle>
              <DialogDescription>
                Relatórios consolidados de integridade e unidades inativas.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <button
                onClick={exportStructureCsv}
                className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-accent/15 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-foreground">REL-MOD-07-01 — Estrutura Vigente</div>
                  <div className="text-muted-foreground text-[11px]">Listagem completa das unidades ativas e responsabilidades.</div>
                </div>
                <Download className="h-4 w-4 text-primary shrink-0" />
              </button>

              <button
                onClick={() => {
                  const inativos = locais.filter((l) => !l.vigente);
                  alert(`REL-MOD-07-02: Encontradas ${inativos.length} unidades inativas.`);
                }}
                className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-accent/15 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-foreground">REL-MOD-07-02 — Unidades Inativas com Bens</div>
                  <div className="text-muted-foreground text-[11px]">Identifica locais desativados que ainda contêm bens pendentes.</div>
                </div>
                <Info className="h-4 w-4 text-primary shrink-0" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}
