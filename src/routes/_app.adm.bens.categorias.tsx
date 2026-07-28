import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Merge,
  ArrowRight,
  ShieldCheck,
  Tag,
  DollarSign,
  Percent,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Info,
  AlertCircle,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/bens/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias e Contas Contábeis (MOD-35) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Plano de contas contábeis e taxonomia hierárquica: parâmetros de depreciação, vida útil, reclassificação em massa com simulação e detecção de órfãos.",
      },
    ],
  }),
  component: AdmBensCategoriasPage,
});

export interface CategoriaContabilNode {
  id: string;
  codigoConta: string; // RF-MOD-35-02
  nome: string;
  categoriaPaiId?: string;
  codigoLegado?: string; // RF-MOD-35-04
  vidaUtilAnos: number; // RF-MOD-35-03
  taxaDepreciacaoAnual: number; // RF-MOD-35-03 (%)
  totalBensVinculados: number;
  vigente: boolean; // RF-MOD-35-05
  subcategorias?: CategoriaContabilNode[];
}

const INITIAL_CATEGORIAS: CategoriaContabilNode[] = [
  {
    id: "CAT-100",
    codigoConta: "4.4.9.0.52.12",
    nome: "Equipamentos de Informática e Processamento de Dados",
    codigoLegado: "INF-LEG-01",
    vidaUtilAnos: 5,
    taxaDepreciacaoAnual: 20.0,
    totalBensVinculados: 1420,
    vigente: true,
    subcategorias: [
      {
        id: "CAT-101",
        codigoConta: "4.4.9.0.52.12.01",
        nome: "Microcomputadores, Notebooks e Servidores",
        categoriaPaiId: "CAT-100",
        codigoLegado: "INF-LEG-01A",
        vidaUtilAnos: 5,
        taxaDepreciacaoAnual: 20.0,
        totalBensVinculados: 980,
        vigente: true,
      },
      {
        id: "CAT-102",
        codigoConta: "4.4.9.0.52.12.02",
        nome: "Monitores, Periféricos e Acessórios de TI",
        categoriaPaiId: "CAT-100",
        codigoLegado: "INF-LEG-01B",
        vidaUtilAnos: 5,
        taxaDepreciacaoAnual: 20.0,
        totalBensVinculados: 440,
        vigente: true,
      },
    ],
  },
  {
    id: "CAT-200",
    codigoConta: "4.4.9.0.52.42",
    nome: "Mobiliário em Geral e Equipamentos de Escritório",
    codigoLegado: "MOB-LEG-02",
    vidaUtilAnos: 10,
    taxaDepreciacaoAnual: 10.0,
    totalBensVinculados: 2150,
    vigente: true,
    subcategorias: [
      {
        id: "CAT-201",
        codigoConta: "4.4.9.0.52.42.01",
        nome: "Mesas, Estações de Trabalho e Armários",
        categoriaPaiId: "CAT-200",
        codigoLegado: "MOB-LEG-02A",
        vidaUtilAnos: 10,
        taxaDepreciacaoAnual: 10.0,
        totalBensVinculados: 1600,
        vigente: true,
      },
      {
        id: "CAT-202",
        codigoConta: "4.4.9.0.52.42.02",
        nome: "Cadeiras, Poltronas e Sofás",
        categoriaPaiId: "CAT-200",
        codigoLegado: "MOB-LEG-02B",
        vidaUtilAnos: 10,
        taxaDepreciacaoAnual: 10.0,
        totalBensVinculados: 550,
        vigente: true,
      },
    ],
  },
  {
    id: "CAT-300",
    codigoConta: "4.4.9.0.52.24",
    nome: "Equipamentos de Proteção, Segurança e Socorro",
    codigoLegado: "SEG-LEG-03",
    vidaUtilAnos: 8,
    taxaDepreciacaoAnual: 12.5,
    totalBensVinculados: 610,
    vigente: true,
  },
  {
    id: "CAT-900",
    codigoConta: "4.4.9.0.52.99",
    nome: "Conta Transitória de Classificação (Legado)",
    codigoLegado: "LEG-ORFAN-99",
    vidaUtilAnos: 0,
    taxaDepreciacaoAnual: 0.0,
    totalBensVinculados: 0, // Categoria Órfã (RF-MOD-35-08)
    vigente: false,
  },
];

function AdmBensCategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaContabilNode[]>(INITIAL_CATEGORIAS);
  const [qSearch, setQSearch] = useState("");
  const [onlyOrphans, setOnlyOrphans] = useState(false);

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReclassificacaoModal, setShowReclassificacaoModal] = useState(false);

  // State Form Nova Categoria
  const [formCodigo, setFormCodigo] = useState("");
  const [formNome, setFormNome] = useState("");
  const [formVidaUtil, setFormVidaUtil] = useState("5");
  const [formTaxa, setFormTaxa] = useState("20.0");
  const [formLegado, setFormLegado] = useState("");

  // State Reclassificação em Massa (RF-MOD-35-06 / RN-MOD-35-03)
  const [origemCatId, setOrigemCatId] = useState("");
  const [destinoCatId, setDestinoCatId] = useState("");
  const [simulacaoResultado, setSimulacaoResultado] = useState<string | null>(null);

  const flatCategorias = useMemo(() => {
    const list: CategoriaContabilNode[] = [];
    function traverse(nodes: CategoriaContabilNode[]) {
      for (const n of nodes) {
        list.push(n);
        if (n.subcategorias && n.subcategorias.length > 0) {
          traverse(n.subcategorias);
        }
      }
    }
    traverse(categorias);
    return list;
  }, [categorias]);

  const filteredCategorias = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return flatCategorias.filter((c) => {
      if (onlyOrphans && c.totalBensVinculados > 0) return false;
      if (!t) return true;

      return (
        c.codigoConta.toLowerCase().includes(t) ||
        c.nome.toLowerCase().includes(t) ||
        (c.codigoLegado && c.codigoLegado.toLowerCase().includes(t))
      );
    });
  }, [flatCategorias, qSearch, onlyOrphans]);

  const kpis = useMemo(
    () => [
      { label: "Total de Contas no Plano", value: `${flatCategorias.length} contas` },
      { label: "Contas Vigentes (Ativas)", value: `${flatCategorias.filter((c) => c.vigente).length} contas` },
      {
        label: "Contas Órfãs / Sem Bens (RF-MOD-35-08)",
        value: `${flatCategorias.filter((c) => c.totalBensVinculados === 0).length} detectadas`,
        hint: "Inconsistência contábil",
      },
      {
        label: "Bens Totais Classificados",
        value: fmtNumber(flatCategorias.reduce((acc, c) => acc + c.totalBensVinculados, 0)),
      },
    ],
    [flatCategorias]
  );

  const handleAddCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCodigo.trim() || !formNome.trim()) return;

    const nova: CategoriaContabilNode = {
      id: `CAT-${Math.floor(400 + Math.random() * 500)}`,
      codigoConta: formCodigo.trim(),
      nome: formNome.trim(),
      codigoLegado: formLegado.trim() || undefined,
      vidaUtilAnos: parseInt(formVidaUtil, 10) || 5,
      taxaDepreciacaoAnual: parseFloat(formTaxa) || 20.0,
      totalBensVinculados: 0,
      vigente: true,
    };

    setCategorias([nova, ...categorias]);
    setShowAddModal(false);
    setFormCodigo("");
    setFormNome("");
    setFormLegado("");
  };

  // RECLASSIFICAÇÃO EM MASSA COM SIMULAÇÃO PRÉVIA (RF-MOD-35-06 / RN-MOD-35-03)
  const handleSimularReclassificacao = (e: React.FormEvent) => {
    e.preventDefault();
    setSimulacaoResultado(null);

    const orig = flatCategorias.find((c) => c.id === origemCatId);
    const dest = flatCategorias.find((c) => c.id === destinoCatId);

    if (!orig || !dest || orig.id === dest.id) {
      alert("Selecione categorias de origem e destino válidas e distintas.");
      return;
    }

    setSimulacaoResultado(
      `SIMULAÇÃO DE IMPACTO: Reclassificar ${orig.totalBensVinculados} bens da conta '${orig.codigoConta} - ${orig.nome}' para a nova conta '${dest.codigoConta} - ${dest.nome}'.`
    );
  };

  const handleExecutarReclassificacao = () => {
    const orig = flatCategorias.find((c) => c.id === origemCatId);
    const dest = flatCategorias.find((c) => c.id === destinoCatId);
    if (!orig || !dest) return;

    const qtdMover = orig.totalBensVinculados;

    setCategorias((prev) =>
      prev.map((c) => {
        if (c.id === orig.id) return { ...c, totalBensVinculados: 0 };
        if (c.id === dest.id) return { ...c, totalBensVinculados: c.totalBensVinculados + qtdMover };
        return c;
      })
    );

    alert(`Reclassificação concluída com sucesso! ${qtdMover} bens foram atualizados no cadastro mestre.`);
    setShowReclassificacaoModal(false);
    setSimulacaoResultado(null);
  };

  // BLOQUEIO DE EXCLUSÃO DE CATEGORIA EM USO (RN-MOD-35-02)
  const handleDeleteCategoria = (cat: CategoriaContabilNode) => {
    if (cat.totalBensVinculados > 0) {
      alert(
        `BLOQUEADO (RN-MOD-35-02): A categoria '${cat.nome}' possui ${cat.totalBensVinculados} bens patrimoniais associados e não pode ser excluída fisicamente. Utilize a reclassificação em massa.`
      );
      return;
    }

    if (confirm(`Confirmar a exclusão da categoria ${cat.codigoConta}?`)) {
      setCategorias((prev) => prev.filter((c) => c.id !== cat.id));
    }
  };

  const exportPlanoCategoriasCsv = () => {
    const headers = ["CodigoConta", "NomeCategoria", "CodigoLegado", "VidaUtilAnos", "TaxaDepreciacaoAnual", "TotalBensVinculados", "StatusVigencia"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const c of flatCategorias) {
      lines.push(
        [
          escape(c.codigoConta),
          escape(c.nome),
          escape(c.codigoLegado || ""),
          c.vidaUtilAnos,
          c.taxaDepreciacaoAnual.toFixed(2),
          c.totalBensVinculados,
          escape(c.vigente ? "Vigente" : "Inativa"),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plano-de-categorias-contabeis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categorias, Classificações e Contas Contábeis (MOD-35)"
        description="Árvore hierárquica de taxonomias, parâmetros de vida útil e depreciação, reclassificação controlada em massa com simulação e detecção de contas órfãs."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Bens Patrimoniais" }, { label: "Plano de Categorias" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowReclassificacaoModal(true)}
              className="h-9 px-3 rounded-md border border-accent/40 bg-accent/10 text-accent-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-accent/20"
            >
              <Merge className="h-4 w-4" /> Reclassificação em Massa (RN-MOD-35-03)
            </button>
            <button
              onClick={exportPlanoCategoriasCsv}
              className="h-9 px-3 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar Plano (CSV)
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Nova Categoria / Conta
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* FILTROS E DIAGNÓSTICO DE ÓRFÃOS (RF-MOD-35-08) */}
      <section className="glass-card p-4 border border-border/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={qSearch}
            onChange={(e) => setQSearch(e.target.value)}
            placeholder="Buscar por código de conta (ex: 4.4.9.0.52.12), nome da categoria ou código legado..."
            className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={onlyOrphans}
            onChange={(e) => setOnlyOrphans(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary"
          />
          Somente Contas Órfãs / Sem Bens (RF-MOD-35-08)
        </label>
      </section>

      {/* ÁRVORE E LISTAGEM DE CATEGORIAS (RF-MOD-35-01 a RF-MOD-35-05) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Código da Conta Contábil (RF-MOD-35-02)</th>
                <th className="p-3">Nome da Categoria / Taxonomia</th>
                <th className="p-3">Código Legado (DE-PARA)</th>
                <th className="p-3 text-center">Vida Útil (Anos)</th>
                <th className="p-3 text-center">Taxa Depreciação / Ano</th>
                <th className="p-3 text-center">Bens Vinculados</th>
                <th className="p-3">Vigência</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredCategorias.map((cat) => {
                const isSub = !!cat.categoriaPaiId;
                return (
                  <tr key={cat.id} className={`hover:bg-accent/10 transition-colors ${isSub ? "bg-muted/20" : ""}`}>
                    <td className="p-3 font-mono font-bold text-primary flex items-center gap-2">
                      {isSub && <span className="text-muted-foreground/50 pl-2">↳</span>}
                      {cat.codigoConta}
                    </td>

                    <td className="p-3 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <FolderTree className="h-4 w-4 text-primary shrink-0" />
                        <span>{cat.nome}</span>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-muted-foreground">
                      {cat.codigoLegado || "—"}
                    </td>

                    <td className="p-3 text-center font-bold text-foreground">
                      {cat.vidaUtilAnos > 0 ? `${cat.vidaUtilAnos} anos` : "Isento"}
                    </td>

                    <td className="p-3 text-center font-bold text-emerald-400 font-mono">
                      {cat.taxaDepreciacaoAnual.toFixed(1)}% / ano
                    </td>

                    <td className="p-3 text-center">
                      <span className={`font-mono font-bold ${cat.totalBensVinculados === 0 ? "text-amber-400" : "text-foreground"}`}>
                        {fmtNumber(cat.totalBensVinculados)}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cat.vigente ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {cat.vigente ? "Vigente" : "Inativa"}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => alert(`Editar detalhes da categoria ${cat.codigoConta}`)}
                          className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground"
                          title="Editar Categoria"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategoria(cat)}
                          className="p-1.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL CADASTRO DE NOVA CATEGORIA (RF-MOD-35-01 / RF-MOD-35-03) */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FolderTree className="h-5 w-5" /> Nova Categoria / Conta Contábil
              </DialogTitle>
              <DialogDescription>
                Cadastre novos parâmetros de taxonomia patrimonial e taxa de depreciação.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddCategoria} className="space-y-3 text-xs mt-2">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Código da Conta Contábil *</label>
                <input
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  required
                  placeholder="Ex: 4.4.9.0.52.12.03"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Nome da Categoria *</label>
                <input
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  required
                  placeholder="Ex: Servidores e Storage de Alto Desempenho"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Vida Útil Estimada (Anos)</label>
                  <input
                    type="number"
                    value={formVidaUtil}
                    onChange={(e) => setFormVidaUtil(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Taxa Depreciação / Ano (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formTaxa}
                    onChange={(e) => setFormTaxa(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Código Legado (Mapeamento DE-PARA)</label>
                <input
                  value={formLegado}
                  onChange={(e) => setFormLegado(e.target.value)}
                  placeholder="Ex: INF-LEG-99"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL RECLASSIFICAÇÃO EM MASSA COM SIMULAÇÃO (RF-MOD-35-06 / RN-MOD-35-03) */}
      {showReclassificacaoModal && (
        <Dialog open={showReclassificacaoModal} onOpenChange={setShowReclassificacaoModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-accent">
                <Merge className="h-5 w-5" /> Reclassificação Controlada em Massa (RN-MOD-35-03)
              </DialogTitle>
              <DialogDescription>
                Transfira bens entre contas contábeis com simulação prévia de impacto e auditabilidade.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSimularReclassificacao} className="space-y-4 text-xs mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-destructive">1. Categoria Origem *</label>
                  <select
                    value={origemCatId}
                    onChange={(e) => setOrigemCatId(e.target.value)}
                    required
                    className="w-full h-10 px-2 rounded-md border border-input bg-background/60 text-xs"
                  >
                    <option value="">Selecione a origem...</option>
                    {flatCategorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigoConta} - {c.nome} ({c.totalBensVinculados} bens)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-emerald-400">2. Categoria Destino *</label>
                  <select
                    value={destinoCatId}
                    onChange={(e) => setDestinoCatId(e.target.value)}
                    required
                    className="w-full h-10 px-2 rounded-md border border-input bg-background/60 text-xs"
                  >
                    <option value="">Selecione o destino...</option>
                    {flatCategorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigoConta} - {c.nome} ({c.totalBensVinculados} bens)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {simulacaoResultado && (
                <div className="p-3 bg-accent/15 border border-accent/30 rounded-xl space-y-2 text-accent-foreground animate-in fade-in">
                  <div className="font-bold flex items-center gap-2 text-xs">
                    <Info className="h-4 w-4 text-accent" /> Resultado da Simulação de Impacto
                  </div>
                  <p className="text-[11px] leading-relaxed">{simulacaoResultado}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowReclassificacaoModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground font-bold"
                >
                  Simular Impacto
                </button>

                {simulacaoResultado && (
                  <button
                    type="button"
                    onClick={handleExecutarReclassificacao}
                    className="px-4 py-1.5 rounded-md bg-accent text-accent-foreground font-bold hover:opacity-90"
                  >
                    Confirmar & Executar Reclassificação
                  </button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}
