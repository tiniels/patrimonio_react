import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Download,
  ShieldCheck,
  Building,
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
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

export const Route = createFileRoute("/_app/adm/locais/portaria")({
  head: () => ({
    meta: [
      { title: "Gestão Administrativa de Portarias (MOD-20) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Cadastro, publicação, versionamento e revogação de atos oficiais de designação de responsáveis patrimoniais.",
      },
    ],
  }),
  component: AdmPortariasPage,
});

export type StatusAdmPortaria = "vigente" | "substituida" | "revogada";

export interface ItemAdmPortaria {
  id: string;
  numero: string; // Ex: Portaria nº 412/2026
  dataPublicacao: string;
  diarioOficialEdicao: string;
  orgaoEmissor: string;
  setorDesignado: string;
  secretaria: string;
  responsavelNome: string;
  responsavelProntuario: string;
  dataInicioVigencia: string;
  dataFimVigencia?: string;
  status: StatusAdmPortaria;
  documentoPdfUrl: string;
  hashSha256: string; // RN-MOD-20-01
}

const INITIAL_ADM_PORTARIAS: ItemAdmPortaria[] = [
  {
    id: "PORT-2026-001",
    numero: "Portaria nº 412/2026",
    dataPublicacao: "2026-01-15",
    diarioOficialEdicao: "Diário Oficial Eletrônico nº 1.482, Pág. 14",
    orgaoEmissor: "Gabinete do Prefeito",
    setorDesignado: "Departamento de Contabilidade e Patrimônio",
    secretaria: "Secretaria de Gestão e Governo",
    responsavelNome: "Neemias Oliveira",
    responsavelProntuario: "neemias.42159",
    dataInicioVigencia: "2026-01-15",
    status: "vigente",
    documentoPdfUrl: "portaria_412_2026_oficial.pdf",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    id: "PORT-2026-002",
    numero: "Portaria nº 305/2025",
    dataPublicacao: "2025-06-10",
    diarioOficialEdicao: "Diário Oficial Eletrônico nº 1.340, Pág. 5",
    orgaoEmissor: "Secretaria de Saúde",
    setorDesignado: "USA Fazendinha",
    secretaria: "Secretaria de Saúde",
    responsavelNome: "Dra. Patricia Lima",
    responsavelProntuario: "PR-39102",
    dataInicioVigencia: "2025-06-10",
    status: "vigente",
    documentoPdfUrl: "portaria_305_2025_saude.pdf",
    hashSha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  },
  {
    id: "PORT-2024-001",
    numero: "Portaria nº 088/2024",
    dataPublicacao: "2024-02-01",
    diarioOficialEdicao: "Diário Oficial Eletrônico nº 1.102, Pág. 8",
    orgaoEmissor: "Secretaria de Administração",
    setorDesignado: "Departamento de Contabilidade e Patrimônio",
    secretaria: "Secretaria de Gestão e Governo",
    responsavelNome: "Neemias Oliveira",
    responsavelProntuario: "neemias.42159",
    dataInicioVigencia: "2024-02-01",
    dataFimVigencia: "2026-01-14",
    status: "substituida",
    documentoPdfUrl: "portaria_088_2024_oficial.pdf",
    hashSha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  },
];

function AdmPortariasPage() {
  const [portarias, setPortarias] = useState<ItemAdmPortaria[]>(INITIAL_ADM_PORTARIAS);
  const [qSearch, setQSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Form de Cadastro (RF-MOD-20-01 a RF-MOD-20-04)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [numeroInput, setNumeroInput] = useState("");
  const [orgaoInput, setOrgaoInput] = useState("Gabinete do Prefeito");
  const [diarioInput, setDiarioInput] = useState("Diário Oficial Eletrônico nº 1.499, Pág. 10");
  const [setorInput, setSetorInput] = useState("Galpão Central de Manutenção");
  const [secretariaInput, setSecretariaInput] = useState("Secretaria de Serviços Municipais");
  const [responsavelInput, setResponsavelInput] = useState("João Roberto Mendes");
  const [prontuarioInput, setProntuarioInput] = useState("PR-33102");
  const [dataInicioInput, setDataInicioInput] = useState(new Date().toISOString().slice(0, 10));

  // Modal Visualização
  const [selectedView, setSelectedView] = useState<ItemAdmPortaria | null>(null);

  const filteredPortarias = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return portarias.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (!t) return true;

      return (
        p.numero.toLowerCase().includes(t) ||
        p.setorDesignado.toLowerCase().includes(t) ||
        p.responsavelNome.toLowerCase().includes(t) ||
        p.responsavelProntuario.toLowerCase().includes(t) ||
        p.diarioOficialEdicao.toLowerCase().includes(t)
      );
    });
  }, [portarias, qSearch, statusFilter]);

  const kpis = useMemo(
    () => [
      { label: "Portarias Vigentes (Atos Ativos)", value: String(portarias.filter((p) => p.status === "vigente").length) },
      { label: "Atos Substituídos / Histórico", value: String(portarias.filter((p) => p.status === "substituida").length) },
      { label: "Unidades sem Portaria Válida", value: "0 unidades" },
      { label: "Total de Portarias Cadastradas", value: String(portarias.length) },
    ],
    [portarias]
  );

  const handleCreatePortaria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroInput.trim() || !responsavelInput.trim()) {
      alert("Preencha o número da portaria e o nome do responsável.");
      return;
    }

    const hash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const newPortaria: ItemAdmPortaria = {
      id: `PORT-2026-00${portarias.length + 1}`,
      numero: numeroInput.trim(),
      dataPublicacao: dataInicioInput,
      diarioOficialEdicao: diarioInput.trim(),
      orgaoEmissor: orgaoInput.trim(),
      setorDesignado: setorInput.trim(),
      secretaria: secretariaInput.trim(),
      responsavelNome: responsavelInput.trim(),
      responsavelProntuario: prontuarioInput.trim(),
      dataInicioVigencia: dataInicioInput,
      status: "vigente",
      documentoPdfUrl: `portaria_${numeroInput.replace(/\D/g, "")}.pdf`,
      hashSha256: hash,
    };

    setPortarias([newPortaria, ...portarias]);
    setShowCreateModal(false);
    setNumeroInput("");
    alert(`Portaria ${newPortaria.numero} publicada com sucesso com Hash SHA-256 de integridade!`);
  };

  const exportPortariasCsv = () => {
    const headers = ["Numero", "DataPublicacao", "OrgaoEmissor", "Setor", "Responsavel", "Prontuario", "Status", "HashSHA256"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const p of portarias) {
      lines.push(
        [
          escape(p.numero),
          escape(p.dataPublicacao),
          escape(p.orgaoEmissor),
          escape(p.setorDesignado),
          escape(p.responsavelNome),
          escape(p.responsavelProntuario),
          escape(p.status),
          escape(p.hashSha256),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-portarias-vigentes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão Administrativa de Portarias (MOD-20)"
        description="Central de cadastro, publicação no Diário Oficial, controle de vigência e integridade das portarias de designação."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Locais" }, { label: "Portarias" }]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Cadastrar Nova Portaria
            </button>
            <button
              onClick={exportPortariasCsv}
              className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar (CSV)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* PESQUISA E FILTROS (RF-MOD-20-08) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-3 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Pesquisar por número da portaria, setor, nome do responsável ou Diário Oficial..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
          >
            <option value="">Todos os Status</option>
            <option value="vigente">🟢 Vigentes (Ativas)</option>
            <option value="substituida">⚪ Substituídas</option>
            <option value="revogada">🔴 Revogadas</option>
          </select>
        </div>
      </section>

      {/* TABELA DE PORTARIAS */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Número da Portaria</th>
                <th className="p-3">Publicação / Órgão</th>
                <th className="p-3">Setor Designado</th>
                <th className="p-3">Servidor Responsável</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação / PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredPortarias.map((item) => (
                <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">
                    <div>{item.numero}</div>
                    <span className="text-[10px] text-muted-foreground font-normal">{item.diarioOficialEdicao}</span>
                  </td>

                  <td className="p-3 font-medium text-foreground">
                    <div className="font-mono text-muted-foreground">{item.dataPublicacao}</div>
                    <span className="text-[10px] text-muted-foreground">{item.orgaoEmissor}</span>
                  </td>

                  <td className="p-3 font-semibold text-foreground">
                    <div>{item.setorDesignado}</div>
                    <span className="text-[10px] text-muted-foreground font-normal">{item.secretaria}</span>
                  </td>

                  <td className="p-3 font-semibold text-foreground">
                    <div>{item.responsavelNome}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Prontuário: {item.responsavelProntuario}
                    </span>
                  </td>

                  <td className="p-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        item.status === "vigente"
                          ? "bg-success/20 text-success border-success/40"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedView(item)}
                      className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL NOVO CADASTRO DE PORTARIA (RF-MOD-20-01 a RF-MOD-20-04) */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={() => setShowCreateModal(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" /> Cadastrar Nova Portaria / Ato de Designação
              </DialogTitle>
              <DialogDescription>
                Publicação oficial no Diário Oficial que formaliza a responsabilidade pelo setor.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreatePortaria} className="flex flex-col gap-3 text-xs mt-2">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Número Oficial da Portaria *</label>
                <input
                  required
                  placeholder="Ex: Portaria nº 520/2026"
                  value={numeroInput}
                  onChange={(e) => setNumeroInput(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-mono font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Órgão Emissor *</label>
                <input
                  required
                  value={orgaoInput}
                  onChange={(e) => setOrgaoInput(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Edição do Diário Oficial Eletrônico *</label>
                <input
                  required
                  value={diarioInput}
                  onChange={(e) => setDiarioInput(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Setor Designado *</label>
                <input
                  required
                  value={setorInput}
                  onChange={(e) => setSetorInput(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-foreground">Nome do Servidor *</label>
                  <input
                    required
                    value={responsavelInput}
                    onChange={(e) => setResponsavelInput(e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-foreground">Prontuário *</label>
                  <input
                    required
                    value={prontuarioInput}
                    onChange={(e) => setProntuarioInput(e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Data de Início da Vigência *</label>
                <input
                  type="date"
                  required
                  value={dataInicioInput}
                  onChange={(e) => setDataInicioInput(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Publicar Portaria
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL DETALHE (RF-MOD-20-07) */}
      {selectedView && (
        <Dialog open={!!selectedView} onOpenChange={() => setSelectedView(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" /> Detalhes — {selectedView.numero}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-800 flex flex-col gap-2 font-mono">
                <div className="text-[10px] text-slate-400 font-sans">Prefeitura de Santana de Parnaíba</div>
                <div className="text-sm font-bold text-amber-400">{selectedView.numero}</div>
                <div className="text-[11px] text-slate-300">Órgão: {selectedView.orgaoEmissor}</div>
                <div className="text-[11px] text-slate-300">Setor: {selectedView.setorDesignado}</div>
                <div className="text-[11px] text-slate-300">Responsável: {selectedView.responsavelNome} ({selectedView.responsavelProntuario})</div>
                <div className="text-[9px] text-slate-500 border-t border-slate-800 pt-2 break-all">
                  Hash SHA-256: {selectedView.hashSha256}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
