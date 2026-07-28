import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  PackageCheck,
  Plus,
  Search,
  Download,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Building,
  AlertCircle,
  Warehouse,
  ShieldCheck,
  Tag,
  Boxes,
  Minus,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/galpao/retiradas")({
  head: () => ({
    meta: [
      { title: "Retiradas do Galpão (MOD-26) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Registro e separação de retiradas do estoque, reserva de saldo, conferência, confirmação transacional e comprovante PDF.",
      },
    ],
  }),
  component: AdmGalpaoRetiradasPage,
});

export type StatusRetirada = "reservado" | "em_separacao" | "confirmado" | "cancelado";

export interface ItemLinhaRetirada {
  sku: string;
  descricao: string;
  unidade: string;
  quantidadeSolicitada: number;
  saldoDisponivel: number;
}

export interface RegistroRetirada {
  protocolo: string;
  dataHora: string;
  setorDestino: string;
  nomeRecebedor: string;
  documentoRecebedor: string;
  itens: ItemLinhaRetirada[];
  status: StatusRetirada;
  operadorGalpao: string;
  observacoes?: string;
  hashComprovante: string;
}

const MOCK_ESTOQUE_DISPONIVEL = [
  { sku: "SKU-EST-001", descricao: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA NR-17", unidade: "UN", saldo: 14 },
  { sku: "SKU-EST-002", descricao: "MONITOR LCD 27 IPS FULL HD DELL", unidade: "UN", saldo: 15 },
  { sku: "SKU-EST-003", descricao: "CABO DE REDE UTP CAT6 AZUL (CAIXA 305M)", unidade: "CX", saldo: 8 },
  { sku: "SKU-EST-004", descricao: "AR CONDICIONADO SPLIT 12000 BTU INVERTER", unidade: "UN", saldo: 6 },
];

const MOCK_RETIRADAS_LIST: RegistroRetirada[] = [
  {
    protocolo: "RET-2026-044",
    dataHora: "2026-07-28 10:30",
    setorDestino: "Secretaria Municipal de Educação — Gabinete",
    nomeRecebedor: "Marcos Viana",
    documentoRecebedor: "CPF 412.981.002-88",
    itens: [
      { sku: "SKU-EST-001", descricao: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA NR-17", unidade: "UN", quantidadeSolicitada: 2, saldoDisponivel: 14 },
    ],
    status: "confirmado",
    operadorGalpao: "Carlos Eduardo",
    observacoes: "Retirada urgente para novas estações de trabalho.",
    hashComprovante: "a8f9c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b899",
  },
  {
    protocolo: "RET-2026-045",
    dataHora: "2026-07-28 14:15",
    setorDestino: "Departamento de Tecnologia e Informática",
    nomeRecebedor: "Alexandre Santos",
    documentoRecebedor: "CPF 981.200.412-11",
    itens: [
      { sku: "SKU-EST-002", descricao: "MONITOR LCD 27 IPS FULL HD DELL", unidade: "UN", quantidadeSolicitada: 4, saldoDisponivel: 15 },
      { sku: "SKU-EST-003", descricao: "CABO DE REDE UTP CAT6 AZUL (CAIXA 305M)", unidade: "CX", quantidadeSolicitada: 1, saldoDisponivel: 8 },
    ],
    status: "em_separacao",
    operadorGalpao: "Galpão Operações",
    observacoes: "Equipamentos para expansão da rede do prédio anexo.",
    hashComprovante: "b1c2d34298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c001",
  },
];

function AdmGalpaoRetiradasPage() {
  const [retiradas, setRetiradas] = useState<RegistroRetirada[]>(MOCK_RETIRADAS_LIST);
  const [qSearch, setQSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal Nova Retirada (RF-MOD-26-01 a RF-MOD-26-04)
  const [modalNovaRetiradaOpen, setModalNovaRetiradaOpen] = useState(false);
  const [formSetor, setFormSetor] = useState("Secretaria de Gestão e Governo");
  const [formRecebedor, setFormRecebedor] = useState("");
  const [formDocumento, setFormDocumento] = useState("");
  const [formObs, setFormObs] = useState("");
  const [itensForm, setItensForm] = useState<Array<{ sku: string; quantidade: number }>>([
    { sku: "SKU-EST-001", quantidade: 1 },
  ]);
  const [formError, setFormError] = useState("");

  // Modal Comprovante PDF (RF-MOD-26-08)
  const [selectedComprovante, setSelectedComprovante] = useState<RegistroRetirada | null>(null);

  const filteredRetiradas = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return retiradas.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!t) return true;

      return (
        r.protocolo.toLowerCase().includes(t) ||
        r.setorDestino.toLowerCase().includes(t) ||
        r.nomeRecebedor.toLowerCase().includes(t) ||
        r.documentoRecebedor.toLowerCase().includes(t)
      );
    });
  }, [retiradas, qSearch, statusFilter]);

  const kpis = useMemo(
    () => [
      { label: "Total de Retiradas Registradas", value: `${retiradas.length} requisições` },
      { label: "Em Separação / Reserva", value: `${retiradas.filter((r) => r.status === "em_separacao" || r.status === "reservado").length} pedidos` },
      { label: "Concluídas / Baixadas (RN-MOD-26-02)", value: `${retiradas.filter((r) => r.status === "confirmado").length} entregas` },
      { label: "Canceladas / Estornadas", value: `${retiradas.filter((r) => r.status === "cancelado").length} devoluções` },
    ],
    [retiradas]
  );

  const handleAddItemForm = () => {
    setItensForm([...itensForm, { sku: "SKU-EST-002", quantidade: 1 }]);
  };

  const handleRemoveItemForm = (index: number) => {
    setItensForm(itensForm.filter((_, idx) => idx !== index));
  };

  const handleSaveNovaRetirada = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formRecebedor.trim() || !formDocumento.trim()) {
      setFormError("Nome do Recebedor e Documento são obrigatórios (RN-MOD-26-04).");
      return;
    }

    // Validação Transacional de Saldo (RN-MOD-26-01)
    const linhasRetirada: ItemLinhaRetirada[] = [];
    for (const item of itensForm) {
      const est = MOCK_ESTOQUE_DISPONIVEL.find((e) => e.sku === item.sku);
      if (!est) continue;

      if (item.quantidade <= 0 || item.quantidade > est.saldo) {
        setFormError(`Quantidade de '${est.descricao}' excede o saldo físico disponível (${est.saldo} ${est.unidade}).`);
        return;
      }

      linhasRetirada.push({
        sku: est.sku,
        descricao: est.descricao,
        unidade: est.unidade,
        quantidadeSolicitada: item.quantidade,
        saldoDisponivel: est.saldo,
      });
    }

    const novoProtocolo = `RET-2026-0${Math.floor(100 + Math.random() * 900)}`;
    const novaRet: RegistroRetirada = {
      protocolo: novoProtocolo,
      dataHora: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      setorDestino: formSetor,
      nomeRecebedor: formRecebedor,
      documentoRecebedor: formDocumento,
      itens: linhasRetirada,
      status: "em_separacao",
      operadorGalpao: "Operador Atual",
      observacoes: formObs,
      hashComprovante: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
    };

    setRetiradas([novaRet, ...retiradas]);
    setModalNovaRetiradaOpen(false);
    setFormRecebedor("");
    setFormDocumento("");
    setFormObs("");
  };

  const handleConfirmarBaixaTransacional = (protocolo: string) => {
    setRetiradas((prev) =>
      prev.map((r) => (r.protocolo === protocolo ? { ...r, status: "confirmado" } : r))
    );
  };

  const handleCanceladaEstornoReserva = (protocolo: string) => {
    setRetiradas((prev) =>
      prev.map((r) => (r.protocolo === protocolo ? { ...r, status: "cancelado" } : r))
    );
  };

  const exportRetiradasCsv = () => {
    const headers = ["Protocolo", "DataHora", "SetorDestino", "Recebedor", "Documento", "QtdItens", "Status", "HashComprovante"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const r of filteredRetiradas) {
      lines.push(
        [
          escape(r.protocolo),
          escape(r.dataHora),
          escape(r.setorDestino),
          escape(r.nomeRecebedor),
          escape(r.documentoRecebedor),
          r.itens.reduce((acc, i) => acc + i.quantidadeSolicitada, 0),
          escape(r.status),
          escape(r.hashComprovante),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `retiradas-galpao-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Retiradas do Galpão (MOD-26)"
        description="Gestão de separação de requisições, reserva de saldo físico, confirmação de saída transacional e emissão de comprovante em PDF."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Galpão" }, { label: "Retiradas" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={exportRetiradasCsv}
              className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar (CSV)
            </button>
            <button
              onClick={() => setModalNovaRetiradaOpen(true)}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Nova Retirada
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* FILTROS E BUSCA (RF-MOD-26-07) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Buscar por protocolo, setor de destino, nome do recebedor ou CPF..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
          >
            <option value="">Todos os Status</option>
            <option value="em_separacao">🟡 Em Separação / Reserva</option>
            <option value="confirmado">🟢 Confirmado (Baixado)</option>
            <option value="cancelado">🔴 Cancelado / Estornado</option>
          </select>
        </div>
      </section>

      {/* TABELA DE RETIRADAS REGISTRADAS (RF-MOD-26-05 / RF-MOD-26-06) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Protocolo</th>
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Setor Solicitante / Recebedor</th>
                <th className="p-3">Itens e Quantidades</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredRetiradas.map((r) => (
                <tr key={r.protocolo} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{r.protocolo}</td>

                  <td className="p-3 font-medium text-foreground">{r.dataHora}</td>

                  <td className="p-3 font-semibold text-foreground">
                    <div>{r.setorDestino}</div>
                    <span className="text-[10px] text-muted-foreground">
                      Recebedor: <b>{r.nomeRecebedor}</b> ({r.documentoRecebedor})
                    </span>
                  </td>

                  <td className="p-3 space-y-1">
                    {r.itens.map((i, idx) => (
                      <div key={idx} className="text-[11px] font-medium text-foreground">
                        • {i.descricao} — <b>{i.quantidadeSolicitada} {i.unidade}</b>
                      </div>
                    ))}
                  </td>

                  <td className="p-3">
                    <StatusRetiradaBadge status={r.status} />
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* BOTAO CONFIRMAR BAIXA (RN-MOD-26-02) */}
                      {r.status === "em_separacao" && (
                        <button
                          onClick={() => handleConfirmarBaixaTransacional(r.protocolo)}
                          title="Confirmar Entrega e Baixar Estoque Transacional"
                          className="px-2.5 py-1.5 rounded bg-emerald-500 text-slate-950 font-bold text-[11px] hover:opacity-90 inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Efetivar Baixa
                        </button>
                      )}

                      {/* BOTAO CANCELAR (RN-MOD-26-03) */}
                      {r.status === "em_separacao" && (
                        <button
                          onClick={() => handleCanceladaEstornoReserva(r.protocolo)}
                          title="Cancelar e Devolver Reserva de Saldo"
                          className="p-1.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* BOTAO COMPROVANTE PDF (RF-MOD-26-08) */}
                      <button
                        onClick={() => setSelectedComprovante(r)}
                        title="Ver / Emitir Comprovante de Retirada PDF"
                        className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL NOVA RETIRADA (RF-MOD-26-01 a RF-MOD-26-04) */}
      {modalNovaRetiradaOpen && (
        <Dialog open={modalNovaRetiradaOpen} onOpenChange={setModalNovaRetiradaOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Boxes className="h-5 w-5" /> Registrar Nova Retirada do Galpão
              </DialogTitle>
              <DialogDescription>
                Reserva temporária de saldo e dados obrigatórios do recebedor autorizado.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveNovaRetirada} className="flex flex-col gap-3 text-xs mt-2">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Setor de Destino Solicitante</label>
                  <input
                    value={formSetor}
                    onChange={(e) => setFormSetor(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Nome Completo do Recebedor (RN-MOD-26-04)</label>
                  <input
                    value={formRecebedor}
                    onChange={(e) => setFormRecebedor(e.target.value)}
                    placeholder="Ex: Marcos Viana"
                    required
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-foreground">CPF ou Prontuário do Recebedor (RN-MOD-26-04)</label>
                  <input
                    value={formDocumento}
                    onChange={(e) => setFormDocumento(e.target.value)}
                    placeholder="Ex: CPF 412.981.002-88 ou Prontuário 42159"
                    required
                    className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* SELEÇÃO DE ITENS E QUANTIDADES (RF-MOD-26-02) */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Itens Requisitados do Estoque</span>
                  <button
                    type="button"
                    onClick={handleAddItemForm}
                    className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Adicionar Item
                  </button>
                </div>

                {itensForm.map((item, idx) => {
                  const itemEst = MOCK_ESTOQUE_DISPONIVEL.find((e) => e.sku === item.sku);
                  return (
                    <div key={idx} className="p-2.5 rounded bg-muted/40 border border-border flex items-center gap-2">
                      <select
                        value={item.sku}
                        onChange={(e) => {
                          const updated = [...itensForm];
                          updated[idx].sku = e.target.value;
                          setItensForm(updated);
                        }}
                        className="flex-1 h-9 px-2 rounded border border-input bg-background text-xs"
                      >
                        {MOCK_ESTOQUE_DISPONIVEL.map((est) => (
                          <option key={est.sku} value={est.sku}>
                            {est.descricao} (Saldo: {est.saldo} {est.unidade})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={1}
                        max={itemEst?.saldo || 999}
                        value={item.quantidade}
                        onChange={(e) => {
                          const updated = [...itensForm];
                          updated[idx].quantidade = Number(e.target.value);
                          setItensForm(updated);
                        }}
                        className="w-20 h-9 px-2 rounded border border-input bg-background text-xs font-mono font-bold"
                      />

                      {itensForm.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemForm(idx)}
                          className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Observações de Entrega</label>
                <textarea
                  value={formObs}
                  onChange={(e) => setFormObs(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaRetiradaOpen(false)}
                  className="px-4 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Reservar & Solicitar Retirada
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL COMPROVANTE DE RETIRADA PDF (RF-MOD-26-08) */}
      {selectedComprovante && (
        <Dialog open={!!selectedComprovante} onOpenChange={() => setSelectedComprovante(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" /> Comprovante Oficial de Retirada #{selectedComprovante.protocolo}
              </DialogTitle>
              <DialogDescription>
                Documento de baixa e protocolo de entrega de materiais do galpão.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-4 bg-background border border-border rounded-lg space-y-2">
                <div className="flex justify-between border-b border-border pb-2">
                  <span><b>Protocolo:</b> <span className="font-mono text-primary font-bold">{selectedComprovante.protocolo}</span></span>
                  <span><b>Data / Hora:</b> {selectedComprovante.dataHora}</span>
                </div>

                <div><b>Setor Solicitante:</b> {selectedComprovante.setorDestino}</div>
                <div><b>Recebedor Autorizado:</b> {selectedComprovante.nomeRecebedor} ({selectedComprovante.documentoRecebedor})</div>
                <div><b>Operador Responsável:</b> {selectedComprovante.operadorGalpao}</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-foreground">Relação de Itens Baixados</div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 font-semibold text-left">
                      <tr>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Descrição</th>
                        <th className="p-2 text-right">Qtd. Entregue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedComprovante.itens.map((i, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono">{i.sku}</td>
                          <td className="p-2">{i.descricao}</td>
                          <td className="p-2 text-right font-mono font-bold">{i.quantidadeSolicitada} {i.unidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-2.5 bg-muted/40 border border-border rounded-lg text-[10px] font-mono text-muted-foreground truncate">
                Hash de Autenticidade: {selectedComprovante.hashComprovante}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded border border-input bg-background font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
                >
                  <Printer className="h-4 w-4" /> Imprimir Comprovante
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedComprovante(null)}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Fechar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusRetiradaBadge({ status }: { status: StatusRetirada }) {
  const map: Record<StatusRetirada, { label: string; cls: string }> = {
    reservado: { label: "🟡 Saldo Reservado", cls: "bg-warning/20 text-warning border-warning/40 font-bold" },
    em_separacao: { label: "🟡 Em Separação", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold" },
    confirmado: { label: "🟢 Entrega Baixada", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold" },
    cancelado: { label: "🔴 Cancelado / Estornado", cls: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold" },
  };
  const item = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
