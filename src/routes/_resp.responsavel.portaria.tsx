import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Building,
  UserCheck,
  ShieldCheck,
  History,
  CheckCircle2,
  Lock,
  Search,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import { getRespAuthSession } from "@/lib/authStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_resp/responsavel/portaria")({
  head: () => ({
    meta: [
      { title: "Portaria Vigente (MOD-20) — Responsável" },
      {
        name: "description",
        content:
          "Consulte o ato oficial e a portaria de designação patrimonial publicada no Diário Oficial.",
      },
    ],
  }),
  component: RespPortariaPage,
});

export interface ItemPortariaResp {
  numero: string; // Ex: Portaria nº 412/2026
  dataPublicacao: string;
  diarioOficialEdicao: string;
  orgaoEmissor: string;
  setorDesignado: string;
  responsavelNome: string;
  responsavelProntuario: string;
  dataInicioVigencia: string;
  dataFimVigencia?: string;
  status: "vigente" | "revogada" | "substituida";
  documentoPdfUrl: string;
  hashSha256: string; // RN-MOD-20-01 / RF-MOD-20-07
  portariaRevogadaRef?: string;
}

const MOCK_PORTARIAS_RESP: ItemPortariaResp[] = [
  {
    numero: "Portaria nº 412/2026",
    dataPublicacao: "2026-01-15",
    diarioOficialEdicao: "Diário Oficial Eletrônico nº 1.482, Pág. 14",
    orgaoEmissor: "Gabinete do Prefeito — Prefeitura de Santana de Parnaíba",
    setorDesignado: "Departamento de Contabilidade e Patrimônio",
    responsavelNome: "Neemias Oliveira",
    responsavelProntuario: "neemias.42159",
    dataInicioVigencia: "2026-01-15",
    status: "vigente",
    documentoPdfUrl: "portaria_412_2026_oficial.pdf",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    numero: "Portaria nº 088/2024",
    dataPublicacao: "2024-02-01",
    diarioOficialEdicao: "Diário Oficial Eletrônico nº 1.102, Pág. 8",
    orgaoEmissor: "Secretaria de Administração",
    setorDesignado: "Departamento de Contabilidade e Patrimônio",
    responsavelNome: "Neemias Oliveira",
    responsavelProntuario: "neemias.42159",
    dataInicioVigencia: "2024-02-01",
    dataFimVigencia: "2026-01-14",
    status: "substituida",
    documentoPdfUrl: "portaria_088_2024_oficial.pdf",
    hashSha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    portariaRevogadaRef: "Substituída pela Portaria nº 412/2026 em 15/01/2026",
  },
];

function RespPortariaPage() {
  const session = getRespAuthSession();
  const setorAtual = session?.unidadeNome || session?.setor || "Departamento de Contabilidade e Patrimônio";
  const responsavelAtual = session?.responsavelNome || session?.responsavel || "Neemias Oliveira";

  const [portarias] = useState<ItemPortariaResp[]>(MOCK_PORTARIAS_RESP);
  const [selectedViewPdf, setSelectedViewPdf] = useState<ItemPortariaResp | null>(null);

  const portariaVigente = useMemo(
    () => portarias.find((p) => p.status === "vigente"),
    [portarias]
  );

  const portariasHistoricas = useMemo(
    () => portarias.filter((p) => p.status !== "vigente"),
    [portarias]
  );

  const kpis = useMemo(
    () => [
      { label: "Status da Portaria", value: "🟢 VIGENTE E ATIVA" },
      { label: "Portaria Atual", value: portariaVigente?.numero || "—" },
      { label: "Publicação no D.O.", value: portariaVigente?.dataPublicacao || "—" },
      { label: "Atos Anteriores", value: String(portariasHistoricas.length) },
    ],
    [portariaVigente, portariasHistoricas]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Portaria e Ato de Designação (MOD-20)"
        description="Documento oficial publicado no Diário Oficial que designa formalmente o responsável pela guarda e gestão do patrimônio."
        crumbs={[{ label: "Responsável", to: "/responsavel" }, { label: "Portaria Vigente" }]}
      />

      <KPIGrid items={kpis} />

      {/* PAINEL DA PORTARIA VIGENTE (RF-MOD-20-06 / RF-MOD-20-07) */}
      {portariaVigente ? (
        <section className="glass-card p-6 border border-emerald-500/40 bg-emerald-500/5 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
                  ATO OFICIAL EM VIGOR
                </span>
                <h3 className="text-lg font-bold text-foreground">{portariaVigente.numero}</h3>
                <p className="text-xs text-muted-foreground">{portariaVigente.orgaoEmissor}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedViewPdf(portariaVigente)}
              className="h-10 px-4 rounded-md bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" /> Visualizar / Baixar PDF Oficial
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <div className="p-3 rounded-lg bg-background/60 border border-border">
              <span className="text-muted-foreground font-semibold">Diário Oficial Eletrônico</span>
              <div className="font-bold text-foreground mt-0.5">{portariaVigente.diarioOficialEdicao}</div>
            </div>

            <div className="p-3 rounded-lg bg-background/60 border border-border">
              <span className="text-muted-foreground font-semibold">Servidor Designado</span>
              <div className="font-bold text-foreground mt-0.5">{portariaVigente.responsavelNome}</div>
              <div className="text-[11px] text-muted-foreground font-mono">Prontuário: {portariaVigente.responsavelProntuario}</div>
            </div>

            <div className="p-3 rounded-lg bg-background/60 border border-border">
              <span className="text-muted-foreground font-semibold">Unidade de Escopo</span>
              <div className="font-bold text-foreground mt-0.5">{portariaVigente.setorDesignado}</div>
              <div className="text-[11px] text-emerald-400 font-bold mt-0.5">Vigência desde {portariaVigente.dataInicioVigencia}</div>
            </div>
          </div>

          {/* INTEGRIAADE SHA-256 (RF-MOD-20-07) */}
          <div className="p-3 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Hash SHA-256 de Integridade Publicada:</span>
            </div>
            <span className="text-emerald-400 font-bold text-[11px] truncate max-w-sm">
              {portariaVigente.hashSha256}
            </span>
          </div>
        </section>
      ) : (
        <div className="p-8 glass-card text-center text-muted-foreground border border-border">
          Nenhuma portaria vigente encontrada para a sua unidade.
        </div>
      )}

      {/* HISTÓRICO DE PORTARIAS ANTERIORES (RN-MOD-20-02) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="p-4 border-b border-border/60 font-bold text-sm text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Histórico de Portarias e Atos Anteriores ({portariasHistoricas.length})
          </span>
          <span className="text-xs font-normal text-muted-foreground">Versionamento temporal e revogações</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Número da Portaria</th>
                <th className="p-3">Data Publicação</th>
                <th className="p-3">Órgão Emissor</th>
                <th className="p-3">Período de Vigência</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {portariasHistoricas.map((item) => (
                <tr key={item.numero} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{item.numero}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.dataPublicacao}</td>
                  <td className="p-3 font-medium text-foreground">{item.orgaoEmissor}</td>
                  <td className="p-3 font-mono text-muted-foreground">
                    {item.dataInicioVigencia} até {item.dataFimVigencia || "Revogada"}
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border font-bold uppercase">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedViewPdf(item)}
                      className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL VISUALIZADOR DE PORTARIA (RF-MOD-20-07) */}
      {selectedViewPdf && (
        <Dialog open={!!selectedViewPdf} onOpenChange={() => setSelectedViewPdf(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" /> Documento Oficial — {selectedViewPdf.numero}
              </DialogTitle>
              <DialogDescription>
                Publicação oficial arquivada no acervo digital de portarias.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-800 flex flex-col gap-2 font-mono">
                <div className="text-[10px] text-slate-400 font-sans">PREFEITURA DE SANTANA DE PARNAÍBA</div>
                <div className="text-sm font-bold text-amber-400 uppercase">{selectedViewPdf.numero}</div>
                <div className="text-[11px] text-slate-300">Órgão Emissor: {selectedViewPdf.orgaoEmissor}</div>
                <div className="text-[11px] text-slate-300">Diário Oficial: {selectedViewPdf.diarioOficialEdicao}</div>
                <div className="text-[11px] text-slate-300">Designado: {selectedViewPdf.responsavelNome}</div>
                <div className="text-[11px] text-slate-300">Unidade: {selectedViewPdf.setorDesignado}</div>
                <div className="text-[9px] text-slate-500 border-t border-slate-800 pt-2 break-all">
                  SHA-256: {selectedViewPdf.hashSha256}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedViewPdf(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Download da ${selectedViewPdf.numero} em PDF realizado!`);
                    setSelectedViewPdf(null);
                  }}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar PDF Autêntico
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
