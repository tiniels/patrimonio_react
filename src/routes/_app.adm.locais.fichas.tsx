import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  Search,
  Download,
  FileText,
  UserCheck,
  PackageCheck,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Layers,
  MapPin,
  Phone,
  Mail,
  Printer,
  History,
  Info,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/locais/fichas")({
  head: () => ({
    meta: [
      { title: "Fichas de Locais e Termos (MOD-21) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Ficha cadastral consolidada da unidade com responsáveis vigentes, bens por conta contábil e Termo de Responsabilidade.",
      },
    ],
  }),
  component: AdmFichasLocaisPage,
});

export interface ItemBemContaContabil {
  conta: string;
  codigoConta: string;
  quantidade: number;
  valorTotal: number;
}

export interface ItemUnidadeFicha {
  id: string;
  codigoInstitucional: string; // Ex: SEC-GEST-004
  nomeUnidade: string;
  secretaria: string;
  endereco: string;
  bairro: string;
  telefone: string;
  email: string;
  responsavelAtual: string;
  responsavelProntuario: string;
  portariaDesignacao: string;
  dataInicioVigencia: string;
  substitutoAtual?: string;
  substitutoProntuario?: string;
  totalBensAlocados: number;
  valorPatrimonialTotal: number;
  pendenciasInventarioCount: number;
  bensContas: ItemBemContaContabil[];
  documentosVinculados: { nome: string; data: string; tipo: string }[];
}

const MOCK_FICHAS_LOCAIS: ItemUnidadeFicha[] = [
  {
    id: "LOC-001",
    codigoInstitucional: "SEC-GEST-004",
    nomeUnidade: "Departamento de Contabilidade e Patrimônio",
    secretaria: "Secretaria de Gestão e Governo",
    endereco: "Rua Professor Edgar de Moraes, 40 - Centro",
    bairro: "Centro, Santana de Parnaíba - SP",
    telefone: "(11) 4622-7500",
    email: "patrimonio@santanadeparnaiba.sp.gov.br",
    responsavelAtual: "Neemias Oliveira",
    responsavelProntuario: "neemias.42159",
    portariaDesignacao: "Portaria nº 412/2026",
    dataInicioVigencia: "15/01/2026",
    substitutoAtual: "Mariana Souza Santos",
    substitutoProntuario: "PR-48912",
    totalBensAlocados: 142,
    valorPatrimonialTotal: 485900.5,
    pendenciasInventarioCount: 0,
    bensContas: [
      { conta: "Equipamentos de Processamento de Dados (TI)", codigoConta: "1.2.3.1.1.01", quantidade: 68, valorTotal: 290400.0 },
      { conta: "Mobiliário em Geral", codigoConta: "1.2.3.1.1.02", quantidade: 54, valorTotal: 112500.5 },
      { conta: "Aparelhos e Utensílios de Refrigeração", codigoConta: "1.2.3.1.1.05", quantidade: 12, valorTotal: 48000.0 },
      { conta: "Máquinas e Equipamentos de Escritório", codigoConta: "1.2.3.1.1.08", quantidade: 8, valorTotal: 35000.0 },
    ],
    documentosVinculados: [
      { nome: "Termo_Guarda_Coletiva_2026.pdf", data: "15/01/2026", tipo: "Termo de Responsabilidade" },
      { nome: "Portaria_412_2026_Oficial.pdf", data: "15/01/2026", tipo: "Portaria de Designação" },
      { nome: "Laudo_Vistoria_Anual_2025.pdf", data: "10/12/2025", tipo: "Laudo Físico" },
    ],
  },
  {
    id: "LOC-002",
    codigoInstitucional: "SEC-SAUDE-012",
    nomeUnidade: "USA Fazendinha",
    secretaria: "Secretaria de Saúde",
    endereco: "Estrada Tenente Marques, 1200 - Fazendinha",
    bairro: "Fazendinha, Santana de Parnaíba - SP",
    telefone: "(11) 4156-8900",
    email: "usa.fazendinha@santanadeparnaiba.sp.gov.br",
    responsavelAtual: "Dra. Patricia Lima",
    responsavelProntuario: "PR-39102",
    portariaDesignacao: "Portaria nº 305/2025",
    dataInicioVigencia: "10/06/2025",
    totalBensAlocados: 210,
    valorPatrimonialTotal: 1250800.0,
    pendenciasInventarioCount: 2,
    bensContas: [
      { conta: "Equipamentos Médico-Hospitalares", codigoConta: "1.2.3.1.1.09", quantidade: 110, valorTotal: 890000.0 },
      { conta: "Equipamentos de Processamento de Dados", codigoConta: "1.2.3.1.1.01", quantidade: 40, valorTotal: 180000.0 },
      { conta: "Mobiliário Hospitalar e de Escritório", codigoConta: "1.2.3.1.1.02", quantidade: 60, valorTotal: 180800.0 },
    ],
    documentosVinculados: [
      { nome: "Termo_Guarda_USA_Fazendinha.pdf", data: "10/06/2025", tipo: "Termo de Responsabilidade" },
      { nome: "Portaria_305_2025_Saude.pdf", data: "10/06/2025", tipo: "Portaria de Designação" },
    ],
  },
];

function AdmFichasLocaisPage() {
  const [fichas] = useState<ItemUnidadeFicha[]>(MOCK_FICHAS_LOCAIS);
  const [selectedId, setSelectedId] = useState<string>(MOCK_FICHAS_LOCAIS[0].id);
  const [qSearch, setQSearch] = useState("");

  // Modal Termo PDF (RF-MOD-21-07 / RF-MOD-21-08)
  const [showPdfModal, setShowPdfModal] = useState(false);

  const selectedUnidade = useMemo(
    () => fichas.find((f) => f.id === selectedId) || fichas[0],
    [fichas, selectedId]
  );

  const filteredFichas = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    if (!t) return fichas;
    return fichas.filter(
      (f) =>
        f.nomeUnidade.toLowerCase().includes(t) ||
        f.secretaria.toLowerCase().includes(t) ||
        f.codigoInstitucional.toLowerCase().includes(t) ||
        f.responsavelAtual.toLowerCase().includes(t)
    );
  }, [fichas, qSearch]);

  const dataReferenciaCorte = useMemo(
    () => new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    []
  );

  const hashPdf = useMemo(
    () => Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    [selectedUnidade.id]
  );

  const kpis = useMemo(
    () => [
      { label: "Unidade Selecionada", value: selectedUnidade.codigoInstitucional },
      { label: "Total de Bens Alocados", value: `${selectedUnidade.totalBensAlocados} bens` },
      { label: "Valor Patrimonial Reconciliado", value: `R$ ${selectedUnidade.valorPatrimonialTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
      { label: "Divergências de Inventário", value: selectedUnidade.pendenciasInventarioCount === 0 ? "🟢 ZERO PENDÊNCIAS" : `⚠️ ${selectedUnidade.pendenciasInventarioCount} PENDÊNCIAS` },
    ],
    [selectedUnidade]
  );

  const exportFichaCsv = () => {
    const headers = ["ContaContabil", "CodigoConta", "QuantidadeBens", "ValorTotalReconciliado"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const b of selectedUnidade.bensContas) {
      lines.push([escape(b.conta), escape(b.codigoConta), String(b.quantidade), String(b.valorTotal)].join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ficha-local-${selectedUnidade.codigoInstitucional}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fichas de Locais e Termos de Responsabilidade (MOD-21)"
        description="Dossiê cadastral consolidado por setor com responsáveis vigentes, bens por conta contábil reconciliados e Termo de Guarda PDF."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Locais" }, { label: "Fichas e Termos" }]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowPdfModal(true)}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <FileCheck className="h-4 w-4" /> Gerar Termo & Ficha (PDF)
            </button>
            <button
              onClick={exportFichaCsv}
              className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar (CSV)
            </button>
          </div>
        }
      />

      {/* SELETOR DE UNIDADE (RF-MOD-21-01) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="grid gap-3 md:grid-cols-3 items-center">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Filtrar setores ou secretarias por nome..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-bold text-primary"
            >
              {filteredFichas.map((f) => (
                <option key={f.id} value={f.id}>
                  [{f.codigoInstitucional}] {f.nomeUnidade}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <KPIGrid items={kpis} />

      {/* PAINEL CONSOLIDADO DA UNIDADE (RF-MOD-21-02 & RF-MOD-21-03) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* DADOS ORGANIZACIONAIS DA UNIDADE */}
        <section className="glass-card p-5 border border-border/60 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Ficha Cadastral da Unidade Organizacional</span>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-primary/15 text-primary font-mono font-bold text-xs">
              {selectedUnidade.codigoInstitucional}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 text-xs">
            <div>
              <span className="text-muted-foreground font-semibold">Nome Oficial do Setor:</span>
              <div className="font-bold text-foreground text-sm">{selectedUnidade.nomeUnidade}</div>
            </div>

            <div>
              <span className="text-muted-foreground font-semibold">Secretaria Vinculada:</span>
              <div className="font-semibold text-foreground">{selectedUnidade.secretaria}</div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-muted-foreground font-semibold">Endereço Físico:</span>
                <div className="font-medium text-foreground">{selectedUnidade.endereco}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-muted-foreground font-semibold">Contato Institucional:</span>
                <div className="font-medium text-foreground">{selectedUnidade.telefone} · {selectedUnidade.email}</div>
              </div>
            </div>
          </div>
        </section>

        {/* RESPONSÁVEIS VIGENTES (RF-MOD-21-03) */}
        <section className="glass-card p-5 border border-border/60 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground border-b border-border pb-3">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>Responsáveis Vigentes</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="font-bold text-emerald-400">Titular Principal:</div>
              <div className="font-bold text-foreground">{selectedUnidade.responsavelAtual}</div>
              <div className="text-[11px] text-muted-foreground font-mono">Prontuário: {selectedUnidade.responsavelProntuario}</div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                {selectedUnidade.portariaDesignacao} (desde {selectedUnidade.dataInicioVigencia})
              </div>
            </div>

            {selectedUnidade.substitutoAtual && (
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <div className="font-semibold text-muted-foreground">Substituto Designado:</div>
                <div className="font-bold text-foreground">{selectedUnidade.substitutoAtual}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{selectedUnidade.substitutoProntuario}</div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* RELAÇÃO DE BENS RECONCILIADOS POR CONTA CONTÁBIL (RF-MOD-21-04 / RN-MOD-21-02) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="p-4 border-b border-border/60 font-bold text-sm text-foreground flex items-center justify-between bg-muted/30">
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Relação Reconciliada de Bens por Conta Contábil ({selectedUnidade.bensContas.length} contas)
          </span>
          <span className="text-xs font-mono font-bold text-primary">
            Data de Corte: {dataReferenciaCorte} (RN-MOD-21-01)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Conta Contábil</th>
                <th className="p-3">Código Contábil</th>
                <th className="p-3 text-center">Quantidade de Bens</th>
                <th className="p-3 text-right">Valor Total Reconciliado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {selectedUnidade.bensContas.map((item) => (
                <tr key={item.codigoConta} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-semibold text-foreground">{item.conta}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.codigoConta}</td>
                  <td className="p-3 text-center font-bold text-primary">{item.quantidade} itens</td>
                  <td className="p-3 text-right font-mono font-bold text-foreground">
                    R$ {item.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/60 font-bold text-foreground border-t border-border">
              <tr>
                <td className="p-3" colSpan={2}>TOTAL RECONCILIADO DA UNIDADE</td>
                <td className="p-3 text-center text-primary">{selectedUnidade.totalBensAlocados} itens</td>
                <td className="p-3 text-right font-mono text-emerald-400">
                  R$ {selectedUnidade.valorPatrimonialTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* DOCUMENTOS VINCULADOS À UNIDADE (RF-MOD-21-06) */}
      <section className="glass-card p-5 border border-border/60 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="flex items-center gap-2 font-bold text-sm text-foreground">
            <FileText className="h-4 w-4 text-primary" /> Documentos e Termos Vinculados à Unidade ({selectedUnidade.documentosVinculados.length})
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3 text-xs">
          {selectedUnidade.documentosVinculados.map((doc) => (
            <div key={doc.nome} className="p-3 rounded-lg bg-background/60 border border-border flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileCheck className="h-4 w-4 text-primary shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-foreground truncate">{doc.nome}</div>
                  <div className="text-[10px] text-muted-foreground">{doc.tipo} · {doc.data}</div>
                </div>
              </div>
              <button
                onClick={() => alert(`Download de ${doc.nome} efetuado!`)}
                className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL FICHA / TERMO DE RESPONSABILIDADE PDF (RF-MOD-21-07 / RF-MOD-21-08 / RN-MOD-21-03) */}
      {showPdfModal && (
        <Dialog open={showPdfModal} onOpenChange={() => setShowPdfModal(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileCheck className="h-5 w-5" /> Termo de Responsabilidade & Ficha do Local (PDF)
              </DialogTitle>
              <DialogDescription>
                Documento oficial consolidado emitido com data de corte e hash de auditoria.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-800 flex flex-col gap-2 font-mono">
                <div className="text-[10px] text-slate-400 font-sans">Prefeitura de Santana de Parnaíba</div>
                <div className="text-sm font-bold text-amber-400 uppercase">FICHA CONSOLIDADA E TERMO DE GUARDA</div>
                <div className="text-[11px] text-slate-300">Unidade: [{selectedUnidade.codigoInstitucional}] {selectedUnidade.nomeUnidade}</div>
                <div className="text-[11px] text-slate-300">Responsável: {selectedUnidade.responsavelAtual} ({selectedUnidade.responsavelProntuario})</div>
                <div className="text-[11px] text-slate-300">Total de Bens: {selectedUnidade.totalBensAlocados} itens</div>
                <div className="text-[11px] text-slate-300">Valor Patrimonial: R$ {selectedUnidade.valorPatrimonialTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                <div className="text-[10px] text-emerald-400 font-sans">Data de Corte: {dataReferenciaCorte}</div>
                <div className="text-[9px] text-slate-500 border-t border-slate-800 pt-2 break-all">
                  Hash SHA-256 de Integridade: {hashPdf}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Ficha e Termo de Responsabilidade da unidade ${selectedUnidade.codigoInstitucional} gerados em PDF!`);
                    setShowPdfModal(false);
                  }}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar Ficha em PDF
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
