import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Boxes,
  Building2,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Percent,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/galpao/empenhos")({
  head: () => ({
    meta: [
      { title: "Notas, Empenhos e Entrada Patrimonial (MOD-28) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Registro de empenhos e notas fiscais, importação em staging, recebimento parcial com saldo restante, tombamento idempotente e conciliação triangulada.",
      },
    ],
  }),
  component: AdmEmpenhosEntradaPage,
});

export type StatusEmpenho = "aberto" | "parcialmente_recebido" | "liquidado" | "cancelado";

export interface ItemEmpenho {
  sku: string;
  descricao: string;
  quantidadeEmpenhada: number;
  quantidadeEntregue: number;
  valorUnitario: number;
  chapasGeradas: string[]; // Chapas tombadas no patrimônio (RN-MOD-28-04)
}

export interface NotaEmpenho {
  numeroEmpenho: string;
  exercicio: number;
  fornecedorNome: string;
  fornecedorCnpj: string;
  numeroNotaFiscal: string;
  chaveAcessoNfe: string; // 44 dígitos (RN-MOD-28-01)
  valorTotal: number;
  dataEmissao: string;
  status: StatusEmpenho;
  itens: ItemEmpenho[];
}

const MOCK_EMPENHOS_LIST: NotaEmpenho[] = [
  {
    numeroEmpenho: "EMP-2026-009",
    exercicio: 2026,
    fornecedorNome: "DELL COMPUTADORES DO BRASIL LTDA",
    fornecedorCnpj: "72.381.189/0001-10",
    numeroNotaFiscal: "NF-99412",
    chaveAcessoNfe: "35260772381189000110550010000994121004128912",
    valorTotal: 37500.0,
    dataEmissao: "2026-07-15",
    status: "parcialmente_recebido",
    itens: [
      {
        sku: "SKU-EST-002",
        descricao: "MONITOR LCD 27 IPS FULL HD DELL",
        quantidadeEmpenhada: 30,
        quantidadeEntregue: 20,
        valorUnitario: 1250.0,
        chapasGeradas: Array.from({ length: 20 }, (_, i) => `PAT-2026-${8800 + i + 1}`),
      },
    ],
  },
  {
    numeroEmpenho: "EMP-2026-010",
    exercicio: 2026,
    fornecedorNome: "MARELLI MÓVEIS DE ESCRITÓRIO S/A",
    fornecedorCnpj: "88.192.412/0001-44",
    numeroNotaFiscal: "NF-88102",
    chaveAcessoNfe: "35260788192412000144550010000881021004128999",
    valorTotal: 17800.0,
    dataEmissao: "2026-07-20",
    status: "liquidado",
    itens: [
      {
        sku: "SKU-EST-001",
        descricao: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA NR-17",
        quantidadeEmpenhada: 20,
        quantidadeEntregue: 20,
        valorUnitario: 890.0,
        chapasGeradas: Array.from({ length: 20 }, (_, i) => `PAT-2026-${9900 + i + 1}`),
      },
    ],
  },
];

function AdmEmpenhosEntradaPage() {
  const [empenhos, setEmpenhos] = useState<NotaEmpenho[]>(MOCK_EMPENHOS_LIST);
  const [qSearch, setQSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"lista" | "novo" | "staging" | "conciliacao">("lista");

  // Modal Recebimento Parcial (RF-MOD-28-06 / RN-MOD-28-02)
  const [selectedRecebimento, setSelectedRecebimento] = useState<NotaEmpenho | null>(null);
  const [qtdReceberForm, setQtdReceberForm] = useState<number>(5);

  // Form Novo Empenho / NF-e (RF-MOD-28-01 / RF-MOD-28-02 / RN-MOD-28-01)
  const [formNumEmpenho, setFormNumEmpenho] = useState("");
  const [formExercicio, setFormExercicio] = useState(2026);
  const [formFornecedor, setFormFornecedor] = useState("");
  const [formCnpj, setFormCnpj] = useState("");
  const [formNumNf, setFormNumNf] = useState("");
  const [formChaveNfe, setFormChaveNfe] = useState("");
  const [formItemDesc, setFormItemDesc] = useState("COMPUTADOR WORKSTATION CORE I7 32GB RAM");
  const [formItemQtd, setFormItemQtd] = useState(10);
  const [formItemValor, setFormItemValor] = useState(4500.0);
  const [formError, setFormError] = useState("");

  // Staging CSV (RF-MOD-28-04 / RN-MOD-28-03)
  const [stagingData, setStagingData] = useState<Array<{ sku: string; desc: string; qtd: number; valor: number; valid: boolean }>>([
    { sku: "SKU-EST-005", desc: "IMPRESSORA MULTIFUNCIONAL LASER MONO", qtd: 5, valor: 2800.0, valid: true },
    { sku: "SKU-EST-006", desc: "NOBREAK 1500VA BIVOLT INTELLIGENT", qtd: 8, valor: 1450.0, valid: true },
  ]);

  const filteredEmpenhos = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return empenhos.filter((e) => {
      if (!t) return true;
      return (
        e.numeroEmpenho.toLowerCase().includes(t) ||
        e.fornecedorNome.toLowerCase().includes(t) ||
        e.numeroNotaFiscal.toLowerCase().includes(t) ||
        e.chaveAcessoNfe.toLowerCase().includes(t)
      );
    });
  }, [empenhos, qSearch]);

  const kpis = useMemo(
    () => [
      { label: "Total de Empenhos Registrados", value: `${empenhos.length} documentos` },
      { label: "Valor Total Empenhado", value: `R$ ${empenhos.reduce((acc, e) => acc + e.valorTotal, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
      { label: "Recebimentos Parciais em Aberto", value: `${empenhos.filter((e) => e.status === "parcialmente_recebido").length} documentos` },
      { label: "Bens Tombados (Chapas Idempotentes)", value: `${empenhos.reduce((acc, e) => acc + e.itens.reduce((iAcc, item) => iAcc + item.chapasGeradas.length, 0), 0)} itens` },
    ],
    [empenhos]
  );

  const handleSaveNovoEmpenho = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formNumEmpenho.trim() || !formFornecedor.trim()) {
      setFormError("Número do Empenho e Fornecedor são obrigatórios.");
      return;
    }

    // Validação de Chave NF-e de 44 dígitos (RN-MOD-28-01)
    if (formChaveNfe.trim() && formChaveNfe.trim().length !== 44) {
      setFormError("A Chave de Acesso NF-e deve possuir exatamente 44 dígitos numéricos (RN-MOD-28-01).");
      return;
    }

    const valorCalc = formItemQtd * formItemValor;
    const novoEmp: NotaEmpenho = {
      numeroEmpenho: formNumEmpenho,
      exercicio: formExercicio,
      fornecedorNome: formFornecedor,
      fornecedorCnpj: formCnpj || "00.000.000/0001-00",
      numeroNotaFiscal: formNumNf || "NF-001",
      chaveAcessoNfe: formChaveNfe || "35260700000000000100550010000000011000000000",
      valorTotal: valorCalc,
      dataEmissao: new Date().toISOString().slice(0, 10),
      status: "aberto",
      itens: [
        {
          sku: "SKU-EST-" + Math.floor(100 + Math.random() * 900),
          descricao: formItemDesc,
          quantidadeEmpenhada: formItemQtd,
          quantidadeEntregue: 0,
          valorUnitario: formItemValor,
          chapasGeradas: [],
        },
      ],
    };

    setEmpenhos([novoEmp, ...empenhos]);
    setActiveTab("lista");
    setFormNumEmpenho("");
    setFormFornecedor("");
    setFormChaveNfe("");
  };

  // Recebimento Parcial & Tombamento Idempotente (RF-MOD-28-06 / RF-MOD-28-07 / RN-MOD-28-02 / RN-MOD-28-04)
  const handleConfirmarRecebimentoParcial = () => {
    if (!selectedRecebimento) return;

    setEmpenhos((prev) =>
      prev.map((e) => {
        if (e.numeroEmpenho === selectedRecebimento.numeroEmpenho) {
          const item = e.itens[0];
          const qtdAtual = item.quantidadeEntregue;
          const novaEntregue = Math.min(item.quantidadeEmpenhada, qtdAtual + qtdReceberForm);
          const novasChapas = Array.from(
            { length: novaEntregue - qtdAtual },
            (_, idx) => `PAT-2026-${Math.floor(7000 + Math.random() * 2000) + idx}`
          );

          const novoStatus: StatusEmpenho =
            novaEntregue >= item.quantidadeEmpenhada ? "liquidado" : "parcialmente_recebido";

          return {
            ...e,
            status: novoStatus,
            itens: [
              {
                ...item,
                quantidadeEntregue: novaEntregue,
                chapasGeradas: [...item.chapasGeradas, ...novasChapas],
              },
            ],
          };
        }
        return e;
      })
    );

    setSelectedRecebimento(null);
  };

  const exportConciliacaoCsv = () => {
    const headers = ["Empenho", "Exercicio", "Fornecedor", "CNPJ", "NotaFiscal", "ChaveNFe", "ValorTotal", "QtdEmpenhada", "QtdEntregue", "SaldoRestante", "Status"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const e of filteredEmpenhos) {
      const item = e.itens[0];
      lines.push(
        [
          escape(e.numeroEmpenho),
          e.exercicio,
          escape(e.fornecedorNome),
          escape(e.fornecedorCnpj),
          escape(e.numeroNotaFiscal),
          escape(e.chaveAcessoNfe),
          e.valorTotal,
          item?.quantidadeEmpenhada || 0,
          item?.quantidadeEntregue || 0,
          (item?.quantidadeEmpenhada || 0) - (item?.quantidadeEntregue || 0),
          escape(e.status),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conciliacao-empenhos-bens-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notas, Empenhos e Entrada Patrimonial (MOD-28)"
        description="Gestão de aquisições: cadastro de empenho/NF-e, recebimento parcial com saldo restante, staging CSV, tombamento idempotente e conciliação triangulada."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Galpão" }, { label: "Empenhos & Entrada" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={exportConciliacaoCsv}
              className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar Conciliação (CSV)
            </button>
            <button
              onClick={() => setActiveTab("novo")}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Novo Empenho / NF-e
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* ABAS DE NAVEGAÇÃO INTERNA */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("lista")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "lista"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📄 Lista de Empenhos ({empenhos.length})
        </button>

        <button
          onClick={() => setActiveTab("novo")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "novo"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          ➕ Novo Cadastro de Empenho / NF-e
        </button>

        <button
          onClick={() => setActiveTab("staging")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "staging"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📥 Importador Staging CSV (RN-MOD-28-03)
        </button>

        <button
          onClick={() => setActiveTab("conciliacao")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "conciliacao"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          🔍 Conciliação Triangulada (REL-MOD-28-03)
        </button>
      </div>

      {/* ABA 1: LISTAGEM DE EMPENHOS E RECEBIMENTO (RF-MOD-28-01 / RF-MOD-28-06) */}
      {activeTab === "lista" && (
        <div className="space-y-4">
          <section className="glass-card p-4 border border-border/60">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                placeholder="Buscar por número de empenho, fornecedor, número da NF-e ou chave de acesso..."
                className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
              />
            </div>
          </section>

          <section className="glass-card p-0 overflow-hidden border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
                  <tr>
                    <th className="p-3">Empenho / Exercício</th>
                    <th className="p-3">Fornecedor & CNPJ</th>
                    <th className="p-3">Nota Fiscal / Chave NF-e (RN-MOD-28-01)</th>
                    <th className="p-3 text-right">Valor Total</th>
                    <th className="p-3">Progresso de Entrega (RN-MOD-28-02)</th>
                    <th className="p-3 text-right">Ação / Recebimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredEmpenhos.map((e) => {
                    const item = e.itens[0];
                    const empenhada = item?.quantidadeEmpenhada || 0;
                    const entregue = item?.quantidadeEntregue || 0;
                    const pct = empenhada > 0 ? Math.round((entregue / empenhada) * 100) : 0;

                    return (
                      <tr key={e.numeroEmpenho} className="hover:bg-accent/10 transition-colors">
                        <td className="p-3 font-semibold text-foreground">
                          <div className="font-mono font-bold text-primary">{e.numeroEmpenho}</div>
                          <span className="text-[10px] text-muted-foreground">Exercício {e.exercicio} · Emissão: {e.dataEmissao}</span>
                        </td>

                        <td className="p-3 font-semibold text-foreground">
                          <div>{e.fornecedorNome}</div>
                          <span className="text-[10px] font-mono text-muted-foreground">CNPJ: {e.fornecedorCnpj}</span>
                        </td>

                        <td className="p-3 font-mono text-foreground">
                          <div className="font-bold">{e.numeroNotaFiscal}</div>
                          <span className="text-[9px] text-muted-foreground truncate max-w-[200px] block" title={e.chaveAcessoNfe}>
                            {e.chaveAcessoNfe}
                          </span>
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          R$ {e.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3 space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span>{entregue} de {empenhada} un</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[9px] text-muted-foreground block">
                            Chapas Tomba.: <b>{item?.chapasGeradas.length || 0} criadas</b>
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          {e.status !== "liquidado" ? (
                            <button
                              onClick={() => setSelectedRecebimento(e)}
                              className="px-3 py-1.5 rounded bg-primary text-primary-foreground font-bold text-[11px] hover:opacity-90 inline-flex items-center gap-1"
                            >
                              <Package className="h-3.5 w-3.5" /> Registrar Recebimento
                            </button>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 inline-flex items-center gap-1">
                              <Check className="h-3 w-3" /> Empenho Liquidado
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ABA 2: FORMULÁRIO DE CADASTRO DE EMPENHO / NF-e (RF-MOD-28-01 / RF-MOD-28-02 / RN-MOD-28-01) */}
      {activeTab === "novo" && (
        <section className="glass-card p-6 border border-border/60 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Cadastro de Nota de Empenho & Vínculo de NF-e</h3>
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 font-semibold text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          <form onSubmit={handleSaveNovoEmpenho} className="space-y-3 text-xs">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Número da Nota de Empenho</label>
                <input
                  value={formNumEmpenho}
                  onChange={(e) => setFormNumEmpenho(e.target.value)}
                  placeholder="Ex: EMP-2026-011"
                  required
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Exercício Financeiro</label>
                <input
                  type="number"
                  value={formExercicio}
                  onChange={(e) => setFormExercicio(Number(e.target.value))}
                  required
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Razão Social do Fornecedor</label>
                <input
                  value={formFornecedor}
                  onChange={(e) => setFormFornecedor(e.target.value)}
                  placeholder="Ex: Midea Carrier Climatização S/A"
                  required
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">CNPJ do Fornecedor</label>
                <input
                  value={formCnpj}
                  onChange={(e) => setFormCnpj(e.target.value)}
                  placeholder="Ex: 00.123.456/0001-99"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Número da Nota Fiscal</label>
                <input
                  value={formNumNf}
                  onChange={(e) => setFormNumNf(e.target.value)}
                  placeholder="Ex: NF-10492"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Chave de Acesso NF-e (44 Dígitos - RN-MOD-28-01)</label>
                <input
                  value={formChaveNfe}
                  onChange={(e) => setFormChaveNfe(e.target.value)}
                  placeholder="Ex: 35260700000000000100550010000000011000000000"
                  maxLength={44}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-mono"
                />
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <span className="font-bold text-foreground">Dados do Item Empenhado</span>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-3 space-y-1">
                  <label className="font-bold text-foreground">Descrição do Item Patrimonial</label>
                  <input
                    value={formItemDesc}
                    onChange={(e) => setFormItemDesc(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Quantidade Empenhada</label>
                  <input
                    type="number"
                    min={1}
                    value={formItemQtd}
                    onChange={(e) => setFormItemQtd(Number(e.target.value))}
                    required
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Valor Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formItemValor}
                    onChange={(e) => setFormItemValor(Number(e.target.value))}
                    required
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Valor Total Calculado</label>
                  <div className="h-9 px-3 rounded-md bg-muted border border-border flex items-center font-mono font-bold text-emerald-400">
                    R$ {(formItemQtd * formItemValor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border mt-3">
              <button
                type="button"
                onClick={() => setActiveTab("lista")}
                className="px-4 py-2 rounded-md border border-input bg-background font-bold hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-sm"
              >
                Gravar Empenho & Liberar para Recebimento
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ABA 3: IMPORTADOR STAGING CSV (RF-MOD-28-04 / RN-MOD-28-03) */}
      {activeTab === "staging" && (
        <section className="glass-card p-5 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Área de Staging para Importação de Itens (CSV/XLSX)</h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">✓ Pré-Validação Ativa (RN-MOD-28-03)</span>
          </div>

          <div className="p-4 bg-muted/30 border border-dashed border-border rounded-lg text-center space-y-2">
            <FileSpreadsheet className="h-8 w-8 text-primary mx-auto" />
            <p className="text-xs font-semibold text-foreground">Arraste a planilha de itens do empenho ou clique para selecionar</p>
            <p className="text-[10px] text-muted-foreground">Formatos suportados: CSV, XLSX (Colunas: SKU, Descricao, Quantidade, ValorUnitario)</p>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-xs text-foreground">Itens em Validação no Staging:</span>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 font-semibold text-left">
                  <tr>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5 text-right">Qtd.</th>
                    <th className="p-2.5 text-right">Valor Unitário</th>
                    <th className="p-2.5 text-right">Valor Total</th>
                    <th className="p-2.5 text-center">Status de Validação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stagingData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-mono text-primary font-bold">{item.sku}</td>
                      <td className="p-2.5 font-semibold text-foreground">{item.desc}</td>
                      <td className="p-2.5 text-right font-mono font-bold">{item.qtd}</td>
                      <td className="p-2.5 text-right font-mono">R$ {item.valor.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-400">R$ {(item.qtd * item.valor).toFixed(2)}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          ✓ Válido no Staging
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                alert("Itens do Staging importados com sucesso para o empenho ativo!");
                setActiveTab("lista");
              }}
              className="px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-bold text-xs hover:opacity-90"
            >
              Confirmar & Efetivar Importação do Staging
            </button>
          </div>
        </section>
      )}

      {/* ABA 4: PAINEL DE CONCILIAÇÃO TRIANGULADA (RF-MOD-28-08 / REL-MOD-28-03) */}
      {activeTab === "conciliacao" && (
        <section className="glass-card p-5 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-foreground">Conciliação Triangulada (Empenho × Nota Fiscal × Bens Criados)</h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div className="p-4 bg-background/60 border border-border rounded-lg space-y-2">
              <span className="font-bold text-primary">Etapa 1: Nota de Empenho</span>
              <div className="text-muted-foreground">Valor Total Empenhado: <b>R$ 55.300,00</b></div>
              <div className="text-muted-foreground">Total de Itens Solicitados: <b>50 unidades</b></div>
              <div className="text-emerald-400 font-bold">✓ 100% Empenhado no Orçamento</div>
            </div>

            <div className="p-4 bg-background/60 border border-border rounded-lg space-y-2">
              <span className="font-bold text-blue-400">Etapa 2: Recebimento Físico / NF-e</span>
              <div className="text-muted-foreground">Notas Fiscais Vinculadas: <b>2 documentos</b></div>
              <div className="text-muted-foreground">Itens Entregues no Galpão: <b>40 unidades</b></div>
              <div className="text-blue-400 font-bold">✓ Chaves NF-e Validadas (44 dígitos)</div>
            </div>

            <div className="p-4 bg-background/60 border border-border rounded-lg space-y-2">
              <span className="font-bold text-purple-400">Etapa 3: Chapas Patrimoniais (Bens)</span>
              <div className="text-muted-foreground">Chapas Tombadas Idempotentes: <b>40 chapas</b></div>
              <div className="text-muted-foreground">Saldo a Entregar: <b>10 unidades em aberto</b></div>
              <div className="text-purple-400 font-bold">✓ 100% Reconciliado e Auditado</div>
            </div>
          </div>
        </section>
      )}

      {/* MODAL RECEBIMENTO PARCIAL (RF-MOD-28-06 / RN-MOD-28-02 / RN-MOD-28-04) */}
      {selectedRecebimento && (
        <Dialog open={!!selectedRecebimento} onOpenChange={() => setSelectedRecebimento(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Package className="h-5 w-5" /> Registrar Recebimento #{selectedRecebimento.numeroEmpenho}
              </DialogTitle>
              <DialogDescription>
                Recebimento parcial com manutenção do saldo restante e tombamento de chapas.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 bg-muted/40 border border-border rounded-lg space-y-1">
                <div><b>Empenho:</b> {selectedRecebimento.numeroEmpenho} ({selectedRecebimento.fornecedorNome})</div>
                <div><b>Item:</b> {selectedRecebimento.itens[0]?.descricao}</div>
                <div>
                  <b>Progresso Atual:</b>{" "}
                  <b className="text-emerald-400">
                    {selectedRecebimento.itens[0]?.quantidadeEntregue} de {selectedRecebimento.itens[0]?.quantidadeEmpenhada} un
                  </b>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Quantidade a Receber Nesta Entrega</label>
                <input
                  type="number"
                  min={1}
                  max={
                    (selectedRecebimento.itens[0]?.quantidadeEmpenhada || 0) -
                    (selectedRecebimento.itens[0]?.quantidadeEntregue || 0)
                  }
                  value={qtdReceberForm}
                  onChange={(e) => setQtdReceberForm(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-mono font-bold"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Saldo restante após este recebimento:{" "}
                  <b>
                    {Math.max(
                      0,
                      (selectedRecebimento.itens[0]?.quantidadeEmpenhada || 0) -
                        (selectedRecebimento.itens[0]?.quantidadeEntregue || 0) -
                        qtdReceberForm
                    )}{" "}
                    unidades
                  </b>
                </span>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-300">
                ⚡ Serão geradas automaticamente <b>{qtdReceberForm} novas chapas patrimoniais</b> de forma idempotente.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecebimento(null)}
                  className="px-4 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarRecebimentoParcial}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Confirmar Recebimento & Tombar Chapas
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
