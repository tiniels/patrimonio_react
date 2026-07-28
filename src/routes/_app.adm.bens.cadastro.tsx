import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History,
  Paperclip,
  CheckSquare,
  Square,
  Layers,
  FileText,
  ShieldCheck,
  Tag,
  Building,
  DollarSign,
  Calendar,
  XCircle,
  Eye,
  RotateCcw,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/bens/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro Mestre de Bens Patrimoniais (MOD-34) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Gestão mestre de bens patrimoniais: CRUD completo, chapa única, identificadores alternativos (RFID/Série), versão cadastral e ações em lote.",
      },
    ],
  }),
  component: AdmBensCadastroPage,
});

export interface VersaoRegistroBem {
  versao: number;
  dataAlteracao: string;
  operador: string;
  resumoAlteracao: string;
}

export interface BemPatrimonialMestre {
  chapa: string; // RN-MOD-34-01: Única e Normalizada
  tagRfid?: string;
  numeroSerie?: string;
  descricao: string;
  especificacao?: string;
  categoria: string;
  contaContabil: string;
  valorAquisicao: number; // RN-MOD-34-05: Decimal
  dataAquisicao: string;
  notaFiscalEmpenho?: string;
  status: "Ativo" | "Em Manutencao" | "Baixado" | "Inativo";
  situacaoOperacional: "Localizado" | "Não Localizado" | "Retirado" | "Transferência";
  localFisico: string;
  responsavelProntuario: string;
  responsavelNome: string;
  documentoAnexoNome?: string;
  historicoVersoes: VersaoRegistroBem[];
}

const INITIAL_BENS_MESTRE: BemPatrimonialMestre[] = [
  {
    chapa: "PAT-2026-8801",
    tagRfid: "RFID-9901-X8",
    numeroSerie: "SN-DELL-99812",
    descricao: "MONITOR LCD 27 IPS FULL HD DELL P2722H",
    especificacao: "Entradas HDMI/DisplayPort, ajuste de altura e rotação 90 graus",
    categoria: "Equipamentos de Informática",
    contaContabil: "4.4.9.0.52.12 - Equipamentos de TI",
    valorAquisicao: 2450.00,
    dataAquisicao: "2026-01-15",
    notaFiscalEmpenho: "NF-009842 / Empenho 2026-019",
    status: "Ativo",
    situacaoOperacional: "Localizado",
    localFisico: "Centro Administrativo Bandeirantes - Bloco A",
    responsavelProntuario: "42159",
    responsavelNome: "Neemias Oliveira",
    documentoAnexoNome: "NotaFiscal_DELL_2026.pdf",
    historicoVersoes: [
      { versao: 1, dataAlteracao: "2026-01-15 09:00", operador: "Sistema (Importação Empenho)", resumoAlteracao: "Registro Mestre Criado" },
    ],
  },
  {
    chapa: "PAT-2026-8802",
    tagRfid: "RFID-9902-Y9",
    numeroSerie: "SN-HP-44102",
    descricao: "IMPRESSORA MULTIFUNCIONAL HP LASERJET ENTERPRISE",
    especificacao: "Rede Gigabit, impressão frente e verso automática",
    categoria: "Equipamentos de Informática",
    contaContabil: "4.4.9.0.52.12 - Equipamentos de TI",
    valorAquisicao: 4890.50,
    dataAquisicao: "2026-02-10",
    notaFiscalEmpenho: "NF-010450 / Empenho 2026-042",
    status: "Ativo",
    situacaoOperacional: "Localizado",
    localFisico: "Secretaria de Saúde - Recepcão Central",
    responsavelProntuario: "33890",
    responsavelNome: "Dra. Patricia Lima",
    documentoAnexoNome: "Garantia_HP_Enterprise.pdf",
    historicoVersoes: [
      { versao: 1, dataAlteracao: "2026-02-10 11:30", operador: "Sistema", resumoAlteracao: "Registro Mestre Criado" },
      { versao: 2, dataAlteracao: "2026-03-01 14:20", operador: "Neemias Oliveira", resumoAlteracao: "Alteração de Local Físico para Recepcão Central" },
    ],
  },
  {
    chapa: "PAT-2026-8803",
    tagRfid: "RFID-9903-Z1",
    numeroSerie: "SN-INT-11203",
    descricao: "NOBREAK 1500VA INTELBRAS SENOIDAL",
    especificacao: "Tensão de entrada Bivolt, 8 tomadas de saída",
    categoria: "Instalações & Iluminação",
    contaContabil: "4.4.9.0.52.24 - Equipamentos de Proteção",
    valorAquisicao: 1280.00,
    dataAquisicao: "2025-11-20",
    notaFiscalEmpenho: "NF-007810 / Empenho 2025-889",
    status: "Em Manutencao",
    situacaoOperacional: "Retirado",
    localFisico: "Oficina Central de Manutenção",
    responsavelProntuario: "11204",
    responsavelNome: "João Roberto Mendes",
    historicoVersoes: [
      { versao: 1, dataAlteracao: "2025-11-20 08:00", operador: "Sistema", resumoAlteracao: "Registro Mestre Criado" },
    ],
  },
];

function AdmBensCadastroPage() {
  const [bens, setBens] = useState<BemPatrimonialMestre[]>(INITIAL_BENS_MESTRE);
  const [qSearch, setQSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedChapasLote, setSelectedChapasLote] = useState<string[]>([]);

  // Modais de Operação
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [editingBem, setEditingBem] = useState<BemPatrimonialMestre | null>(null);
  const [showHistoricoModal, setShowHistoricoModal] = useState<BemPatrimonialMestre | null>(null);

  // Form State para Cadastro/Edição
  const [formChapa, setFormChapa] = useState("");
  const [formRfid, setFormRfid] = useState("");
  const [formSerie, setFormSerie] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEspec, setFormEspec] = useState("");
  const [formCategoria, setFormCategoria] = useState("Equipamentos de Informática");
  const [formConta, setFormConta] = useState("4.4.9.0.52.12 - Equipamentos de TI");
  const [formValor, setFormValor] = useState("2450.00");
  const [formDataAquisicao, setFormDataAquisicao] = useState("2026-07-28");
  const [formNotaEmpenho, setFormNotaEmpenho] = useState("");
  const [formLocal, setFormLocal] = useState("Centro Administrativo Bandeirantes");
  const [formRespNome, setFormRespNome] = useState("Neemias Oliveira");
  const [formError, setFormError] = useState<string | null>(null);

  const filteredBens = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return bens.filter((b) => {
      if (categoriaFilter && b.categoria !== categoriaFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (!t) return true;

      return (
        b.chapa.toLowerCase().includes(t) ||
        b.descricao.toLowerCase().includes(t) ||
        (b.tagRfid && b.tagRfid.toLowerCase().includes(t)) ||
        (b.numeroSerie && b.numeroSerie.toLowerCase().includes(t)) ||
        b.localFisico.toLowerCase().includes(t) ||
        b.responsavelNome.toLowerCase().includes(t)
      );
    });
  }, [bens, qSearch, categoriaFilter, statusFilter]);

  const categoriasList = useMemo(
    () => [...new Set(bens.map((b) => b.categoria))].sort(),
    [bens]
  );

  const kpis = useMemo(
    () => [
      { label: "Total de Bens no Acervo Mestre", value: `${bens.length} itens` },
      { label: "Bens Ativos e Operacionais", value: `${bens.filter((b) => b.status === "Ativo").length} itens` },
      {
        label: "Valor Consolidado do Acervo",
        value: fmtMoeda(bens.reduce((acc, b) => acc + b.valorAquisicao, 0)),
      },
      { label: "Bens em Manutenção / Retirados", value: `${bens.filter((b) => b.status === "Em Manutencao").length} itens` },
    ],
    [bens]
  );

  const openNewForm = () => {
    setEditingBem(null);
    setFormChapa(`PAT-2026-${Math.floor(8800 + Math.random() * 900)}`);
    setFormRfid("");
    setFormSerie("");
    setFormDesc("");
    setFormEspec("");
    setFormCategoria("Equipamentos de Informática");
    setFormConta("4.4.9.0.52.12 - Equipamentos de TI");
    setFormValor("1500.00");
    setFormDataAquisicao(new Date().toISOString().slice(0, 10));
    setFormNotaEmpenho("");
    setFormLocal("Centro Administrativo Bandeirantes");
    setFormRespNome("Neemias Oliveira");
    setFormError(null);
    setShowCadastroModal(true);
  };

  const openEditForm = (bem: BemPatrimonialMestre) => {
    setEditingBem(bem);
    setFormChapa(bem.chapa);
    setFormRfid(bem.tagRfid || "");
    setFormSerie(bem.numeroSerie || "");
    setFormDesc(bem.descricao);
    setFormEspec(bem.especificacao || "");
    setFormCategoria(bem.categoria);
    setFormConta(bem.contaContabil);
    setFormValor(String(bem.valorAquisicao));
    setFormDataAquisicao(bem.dataAquisicao);
    setFormNotaEmpenho(bem.notaFiscalEmpenho || "");
    setFormLocal(bem.localFisico);
    setFormRespNome(bem.responsavelNome);
    setFormError(null);
    setShowCadastroModal(true);
  };

  const handleSaveBem = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const normChapa = formChapa.trim().toUpperCase();

    // VALIDAR UNICIDADE DE CHAPA NO CADASTRO NOVO (RN-MOD-34-01)
    if (!editingBem) {
      const existe = bens.some((b) => b.chapa.toUpperCase() === normChapa);
      if (existe) {
        setFormError(`A chapa patrimonial ${normChapa} já está cadastrada no sistema (RN-MOD-34-01).`);
        return;
      }
    }

    const valorNum = parseFloat(formValor.replace(",", "."));
    if (isNaN(valorNum) || valorNum < 0) {
      setFormError("Informe um valor de aquisição válido em formato decimal BRL (RN-MOD-34-05).");
      return;
    }

    if (editingBem) {
      // EDIÇÃO COM GERAMENTO DE NOVA VERSÃO CADASTRAL (RN-MOD-34-02)
      setBens((prev) =>
        prev.map((b) => {
          if (b.chapa === editingBem.chapa) {
            const novaVersaoNum = b.historicoVersoes.length + 1;
            const novaVersaoItem: VersaoRegistroBem = {
              versao: novaVersaoNum,
              dataAlteracao: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              operador: "Neemias Oliveira (Gestor)",
              resumoAlteracao: `Atualização de atributos da chapa (Versão v${novaVersaoNum}).`,
            };

            return {
              ...b,
              tagRfid: formRfid.trim() || undefined,
              numeroSerie: formSerie.trim() || undefined,
              descricao: formDesc.trim(),
              especificacao: formEspec.trim() || undefined,
              categoria: formCategoria,
              contaContabil: formConta,
              valorAquisicao: valorNum,
              dataAquisicao: formDataAquisicao,
              notaFiscalEmpenho: formNotaEmpenho.trim() || undefined,
              localFisico: formLocal.trim(),
              responsavelNome: formRespNome.trim(),
              historicoVersoes: [novaVersaoItem, ...b.historicoVersoes],
            };
          }
          return b;
        })
      );
    } else {
      // NOVO REGISTRO MESTRE
      const novoBem: BemPatrimonialMestre = {
        chapa: normChapa,
        tagRfid: formRfid.trim() || undefined,
        numeroSerie: formSerie.trim() || undefined,
        descricao: formDesc.trim(),
        especificacao: formEspec.trim() || undefined,
        categoria: formCategoria,
        contaContabil: formConta,
        valorAquisicao: valorNum,
        dataAquisicao: formDataAquisicao,
        notaFiscalEmpenho: formNotaEmpenho.trim() || undefined,
        status: "Ativo",
        situacaoOperacional: "Localizado",
        localFisico: formLocal.trim(),
        responsavelProntuario: "42159",
        responsavelNome: formRespNome.trim(),
        historicoVersoes: [
          {
            versao: 1,
            dataAlteracao: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            operador: "Neemias Oliveira (Inclusão Manual)",
            resumoAlteracao: "Criação do Registro Mestre (v1)",
          },
        ],
      };

      setBens([novoBem, ...bens]);
    }

    setShowCadastroModal(false);
  };

  // INATIVAÇÃO LÓGICA (RN-MOD-34-03: EXCLUSÃO FÍSICA PROIBIDA)
  const handleInativarLogico = (chapa: string) => {
    if (confirm(`Confirmar a INATIVAÇÃO LÓGICA do bem ${chapa}? (Exclusão física proibida - RN-MOD-34-03)`)) {
      setBens((prev) =>
        prev.map((b) => (b.chapa === chapa ? { ...b, status: "Inativo" } : b))
      );
    }
  };

  // OPERAÇÕES EM LOTE (RF-MOD-34-10)
  const handleInativarLote = () => {
    if (selectedChapasLote.length === 0) return;
    if (confirm(`Inativar os ${selectedChapasLote.length} bens selecionados em lote?`)) {
      setBens((prev) =>
        prev.map((b) => (selectedChapasLote.includes(b.chapa) ? { ...b, status: "Inativo" } : b))
      );
      setSelectedChapasLote([]);
    }
  };

  const toggleSelectChapa = (chapa: string) => {
    setSelectedChapasLote((prev) =>
      prev.includes(chapa) ? prev.filter((c) => c !== chapa) : [...prev, chapa]
    );
  };

  const exportBensDataCsv = () => {
    const headers = ["Chapa", "TagRFID", "NumeroSerie", "Descricao", "Categoria", "ContaContabil", "ValorAquisicao", "DataAquisicao", "Status", "LocalFisico", "Responsavel"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const b of filteredBens) {
      lines.push(
        [
          escape(b.chapa),
          escape(b.tagRfid || ""),
          escape(b.numeroSerie || ""),
          escape(b.descricao),
          escape(b.categoria),
          escape(b.contaContabil),
          b.valorAquisicao.toFixed(2),
          escape(b.dataAquisicao),
          escape(b.status),
          escape(b.localFisico),
          escape(b.responsavelNome),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-cadastro-mestre-bens-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cadastro Mestre de Bens Patrimoniais (MOD-34)"
        description="Criação, consulta, edição e inativação de bens com validação de chapa única, identificadores alternativos (RFID/Série), histórico de versões e ações em lote."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Bens Patrimoniais" }, { label: "Cadastro Mestre" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportBensDataCsv}
              className="h-9 px-3 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar Relatório (CSV)
            </button>
            <button
              onClick={openNewForm}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Novo Bem Patrimonial
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* BARRA DE FILTROS E OPERAÇÕES EM LOTE (RF-MOD-34-10) */}
      <section className="glass-card p-4 border border-border/60 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Buscar por chapa, descrição, RFID, nº de série, local ou responsável..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
          >
            <option value="">Todas as categorias ({categoriasList.length})</option>
            {categoriasList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
          >
            <option value="">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Em Manutencao">Em Manutenção</option>
            <option value="Baixado">Baixado</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>

        {/* BARRA DE AÇÕES EM LOTE SELECIONADOS */}
        {selectedChapasLote.length > 0 && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Layers className="h-4 w-4" /> {selectedChapasLote.length} bens selecionados para ação em lote
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInativarLote}
                className="px-3 py-1 rounded bg-rose-500 text-white font-bold text-xs hover:opacity-90"
              >
                Inativar Selecionados em Lote
              </button>
            </div>
          </div>
        )}
      </section>

      {/* TABELA DE BENS MESTRE (RF-MOD-34-01 a RF-MOD-34-08) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedChapasLote.length === filteredBens.length && filteredBens.length > 0}
                    onChange={() => {
                      if (selectedChapasLote.length === filteredBens.length) {
                        setSelectedChapasLote([]);
                      } else {
                        setSelectedChapasLote(filteredBens.map((b) => b.chapa));
                      }
                    }}
                    className="h-4 w-4 rounded border-input text-primary"
                  />
                </th>
                <th className="p-3">Chapa & Identificadores (RF-MOD-34-02)</th>
                <th className="p-3">Descrição & Especificação</th>
                <th className="p-3">Categoria & Conta</th>
                <th className="p-3 text-right">Valor Aquisição (RN-MOD-34-05)</th>
                <th className="p-3">Local & Responsável</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredBens.map((bem) => {
                const isSelected = selectedChapasLote.includes(bem.chapa);
                return (
                  <tr key={bem.chapa} className={`hover:bg-accent/10 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectChapa(bem.chapa)}
                        className="h-4 w-4 rounded border-input text-primary cursor-pointer"
                      />
                    </td>

                    <td className="p-3 font-semibold text-foreground">
                      <div className="font-mono font-bold text-primary">{bem.chapa}</div>
                      {bem.tagRfid && (
                        <div className="text-[10px] text-muted-foreground font-mono">RFID: {bem.tagRfid}</div>
                      )}
                      {bem.numeroSerie && (
                        <div className="text-[10px] text-muted-foreground font-mono">Série: {bem.numeroSerie}</div>
                      )}
                    </td>

                    <td className="p-3 font-semibold text-foreground max-w-[240px]">
                      <div className="truncate" title={bem.descricao}>{bem.descricao}</div>
                      {bem.documentoAnexoNome && (
                        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 font-mono mt-0.5">
                          <Paperclip className="h-3 w-3 text-primary" /> {bem.documentoAnexoNome}
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-muted-foreground">
                      <div className="font-semibold text-foreground">{bem.categoria}</div>
                      <div className="text-[10px] font-mono">{bem.contaContabil}</div>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-primary">
                      {fmtMoeda(bem.valorAquisicao)}
                      <div className="text-[9px] text-muted-foreground font-normal">Em: {bem.dataAquisicao}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-foreground">{bem.localFisico}</div>
                      <div className="text-[10px] text-muted-foreground">{bem.responsavelNome}</div>
                    </td>

                    <td className="p-3">
                      <StatusBemBadge status={bem.status} />
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setShowHistoricoModal(bem)}
                          title="Ver Histórico de Versões (RN-MOD-34-02)"
                          className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditForm(bem)}
                          title="Editar Cadastro Mestre"
                          className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        {bem.status !== "Inativo" && (
                          <button
                            onClick={() => handleInativarLogico(bem.chapa)}
                            title="Inativação Lógica (RN-MOD-34-03)"
                            className="p-1.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL CADASTRO / EDIÇÃO MESTRE (RF-MOD-34-01 a RF-MOD-34-08) */}
      {showCadastroModal && (
        <Dialog open={showCadastroModal} onOpenChange={setShowCadastroModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Package className="h-5 w-5" />
                {editingBem ? `Editar Cadastro Mestre — ${editingBem.chapa}` : "Cadastrar Novo Bem Patrimonial Mestre"}
              </DialogTitle>
              <DialogDescription>
                Informe os atributos do bem patrimonial com validação de chapa única e auditoria.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveBem} className="space-y-4 text-xs mt-2">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Chapa Única (RN-MOD-34-01) *</label>
                  <input
                    value={formChapa}
                    onChange={(e) => setFormChapa(e.target.value)}
                    disabled={!!editingBem}
                    required
                    placeholder="PAT-2026-8801"
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-mono text-xs font-bold uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Tag RFID (Opcional)</label>
                  <input
                    value={formRfid}
                    onChange={(e) => setFormRfid(e.target.value)}
                    placeholder="RFID-9901-X8"
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Número de Série (Opcional)</label>
                  <input
                    value={formSerie}
                    onChange={(e) => setFormSerie(e.target.value)}
                    placeholder="SN-DELL-99812"
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Descrição Principal do Bem *</label>
                <input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  required
                  placeholder="Ex: MONITOR LCD 27 IPS FULL HD DELL"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Categoria do Bem</label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
                  >
                    <option value="Equipamentos de Informática">Equipamentos de Informática</option>
                    <option value="Instalações & Iluminação">Instalações & Iluminação</option>
                    <option value="Mobiliário em Geral">Mobiliário em Geral</option>
                    <option value="Veículos e Maquinário">Veículos e Maquinário</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Conta Contábil Vinculada</label>
                  <select
                    value={formConta}
                    onChange={(e) => setFormConta(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
                  >
                    <option value="4.4.9.0.52.12 - Equipamentos de TI">4.4.9.0.52.12 - Equipamentos de TI</option>
                    <option value="4.4.9.0.52.24 - Equipamentos de Proteção">4.4.9.0.52.24 - Equipamentos de Proteção</option>
                    <option value="4.4.9.0.52.42 - Mobiliário em Geral">4.4.9.0.52.42 - Mobiliário em Geral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Valor de Aquisição (R$) (RN-MOD-34-05)</label>
                  <input
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    required
                    placeholder="2450.00"
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Data de Aquisição</label>
                  <input
                    type="date"
                    value={formDataAquisicao}
                    onChange={(e) => setFormDataAquisicao(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Nota Fiscal / Empenho</label>
                  <input
                    value={formNotaEmpenho}
                    onChange={(e) => setFormNotaEmpenho(e.target.value)}
                    placeholder="NF-009842 / Empenho 2026-019"
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Local Físico Alocado</label>
                  <input
                    value={formLocal}
                    onChange={(e) => setFormLocal(e.target.value)}
                    required
                    placeholder="Ex: Centro Administrativo Bandeirantes"
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Responsável Vigente</label>
                  <input
                    value={formRespNome}
                    onChange={(e) => setFormRespNome(e.target.value)}
                    required
                    placeholder="Ex: Neemias Oliveira"
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCadastroModal(false)}
                  className="px-4 py-2 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-sm"
                >
                  {editingBem ? "Salvar Nova Versão (v+1)" : "Cadastrar Bem Mestre"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL HISTÓRICO DE VERSÕES CADASTRAIS (RF-MOD-34-09 / RN-MOD-34-02) */}
      {showHistoricoModal && (
        <Dialog open={!!showHistoricoModal} onOpenChange={() => setShowHistoricoModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <History className="h-5 w-5" /> Histórico de Versões — {showHistoricoModal.chapa}
              </DialogTitle>
              <DialogDescription>
                Registro imutável de alterações do cadastro mestre (RN-MOD-34-02).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs mt-2 max-h-80 overflow-y-auto">
              {showHistoricoModal.historicoVersoes.map((v) => (
                <div key={v.versao} className="p-3 bg-background border border-border rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-primary font-mono">Versão v{v.versao}</span>
                    <span className="text-[10px] text-muted-foreground">{v.dataAlteracao}</span>
                  </div>
                  <div className="text-foreground"><b>Operador:</b> {v.operador}</div>
                  <div className="text-muted-foreground text-[11px]">{v.resumoAlteracao}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowHistoricoModal(null)}
                className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
              >
                Fechar Histórico
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusBemBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Ativo: { label: "🟢 Ativo", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold" },
    EmManutencao: { label: "🟡 Em Manutenção", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold" },
    Baixado: { label: "🔴 Baixado", cls: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold" },
    Inativo: { label: "⚪ Inativo (Lógico)", cls: "bg-muted text-muted-foreground border-border font-bold" },
  };
  const item = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}

function fmtMoeda(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}
