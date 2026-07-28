import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutGrid,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Download,
  FileCheck2,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  Printer,
  Eye,
  Info,
  ShieldCheck,
  Tag,
  Maximize2,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/fotos/canvas")({
  head: () => ({
    meta: [
      { title: "Canvas e Composição Visual de Fotos (MOD-30) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Composição visual padronizada de fotos e legendas em fichas em PDF/PNG com preservação dos arquivos originais e suporte a leitores de tela.",
      },
    ],
  }),
  component: AdmFotosCanvasPage,
});

export type TemplateLayoutType = "ficha_dupla" | "grid_4_oficial" | "laudo_avaria_3";

export interface QuadroFotoCanvas {
  id: string;
  urlOriginal: string;
  tituloQuadro: string;
  legendaQuadro: string;
  tipoEvidencia: string;
}

export interface ComposicaoSalva {
  idComposicao: string;
  chapaPatrimonial: string;
  templateUtilizado: TemplateLayoutType;
  versao: number;
  dataCriacao: string;
  autor: string;
  quadros: QuadroFotoCanvas[];
}

const MOCK_QUADROS_INICIAIS: QuadroFotoCanvas[] = [
  {
    id: "Q1",
    urlOriginal: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80",
    tituloQuadro: "1. Visão Geral Frontal do Equipamento",
    legendaQuadro: "Equipamento em estado operacional na mesa do usuário.",
    tipoEvidencia: "Vista Frontal",
  },
  {
    id: "Q2",
    urlOriginal: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80",
    tituloQuadro: "2. Etiqueta de Tombamento / Código de Barras",
    legendaQuadro: "Chapa PAT-2026-8801 perfeitamente legível na lateral inferior.",
    tipoEvidencia: "Etiqueta",
  },
  {
    id: "Q3",
    urlOriginal: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80",
    tituloQuadro: "3. Detalhe do Conector de Entrada / Fonte",
    legendaQuadro: "Cabo de alimentação original sem desgastes perceptíveis.",
    tipoEvidencia: "Conexões",
  },
  {
    id: "Q4",
    urlOriginal: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80",
    tituloQuadro: "4. Painel de Controle e Botões de Ajuste",
    legendaQuadro: "Botões frontais com respostas táteis normais.",
    tipoEvidencia: "Controles",
  },
];

function AdmFotosCanvasPage() {
  const [chapaAtiva, setChapaAtiva] = useState("PAT-2026-8801");
  const [template, setTemplate] = useState<TemplateLayoutType>("grid_4_oficial");
  const [quadros, setQuadros] = useState<QuadroFotoCanvas[]>(MOCK_QUADROS_INICIAIS);
  const [versaoComposicao, setVersaoComposicao] = useState(1);
  const [composicoesSalvas, setComposicoesSalvas] = useState<ComposicaoSalva[]>([]);

  // Modal Ficha Visual PDF/PNG (RF-MOD-30-07 / REL-MOD-30-01)
  const [modalPreviewExportOpen, setModalPreviewExportOpen] = useState(false);

  const kpis = useMemo(
    () => [
      { label: "Chapa Patrimonial Ativa", value: chapaAtiva },
      { label: "Fotos Originais Preservadas", value: `${quadros.length} arquivos`, hint: "Imutáveis (RN-MOD-30-01)" },
      { label: "Template de Composição", value: template === "grid_4_oficial" ? "Grid 2x2 Oficial" : template === "ficha_dupla" ? "Ficha Dupla" : "Laudo Avaria" },
      { label: "Versão da Ficha Visual", value: `v${versaoComposicao} (RN-MOD-30-02)` },
    ],
    [chapaAtiva, quadros, template, versaoComposicao]
  );

  const handleMoverQuadro = (index: number, direcao: "up" | "down") => {
    const newArr = [...quadros];
    const targetIdx = direcao === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;

    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setQuadros(newArr);
  };

  const handleUpdateLegenda = (index: number, novaLegenda: string) => {
    const newArr = [...quadros];
    newArr[index].legendaQuadro = novaLegenda;
    setQuadros(newArr);
  };

  const handleSalvarComposicaoVersionada = () => {
    const novaComp: ComposicaoSalva = {
      idComposicao: `COMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      chapaPatrimonial: chapaAtiva,
      templateUtilizado: template,
      versao: versaoComposicao,
      dataCriacao: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      autor: "Administrador do Patrimônio",
      quadros: [...quadros],
    };

    setComposicoesSalvas([novaComp, ...composicoesSalvas]);
    setVersaoComposicao((prev) => prev + 1);
  };

  const exportFichaVisualPng = () => {
    alert(`Gerando e baixando PNG da Ficha Visual v${versaoComposicao} da chapa ${chapaAtiva} em alta resolução...`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Canvas e Composição Visual de Fotos (MOD-30)"
        description="Montagem de fichas visuais padronizadas em templates, com adição de legendas e tarjas sem alterar as imagens fotográficas originais."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Fotos" }, { label: "Editor Canvas" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleSalvarComposicaoVersionada}
              className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Save className="h-4 w-4" /> Salvar Composição (v{versaoComposicao})
            </button>
            <button
              onClick={() => setModalPreviewExportOpen(true)}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <FileCheck2 className="h-4 w-4" /> Gerar Ficha Visual PDF (Oficial)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* BARRA DE CONTROLE DE TEMPLATE E CHAPA PATRIMONIAL (RF-MOD-30-04 / RF-MOD-30-05) */}
      <section className="glass-card p-4 border border-border/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="space-y-1">
            <label className="font-bold text-xs text-foreground block">Chapa Patrimonial Ativa</label>
            <input
              value={chapaAtiva}
              onChange={(e) => setChapaAtiva(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-mono font-bold w-40"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-xs text-foreground block">Template de Layout (RF-MOD-30-05)</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as TemplateLayoutType)}
              className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-bold"
            >
              <option value="grid_4_oficial">Grid 2x2 — Ficha Oficial Patrimonial (4 Quadros)</option>
              <option value="ficha_dupla">Ficha Dupla — Frontal & Etiqueta (2 Quadros)</option>
              <option value="laudo_avaria_3">Laudo de Avarias & Desgastes (3 Quadros)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span><b>Imutabilidade Garantida (RN-MOD-30-01):</b> Os arquivos de foto originais permanecem inalterados no banco.</span>
        </div>
      </section>

      {/* ÁREA PRINCIPAL DO CANVAS & PAINEL DE REORDENAÇÃO (RF-MOD-30-01 a RF-MOD-30-06) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* COLUNA ESQUERDA: PAINEL DE EDICAO DE QUADROS & LEGENDAS (RF-MOD-30-02 / RF-MOD-30-04) */}
        <div className="space-y-3 lg:col-span-1">
          <div className="glass-card p-4 border border-border/60 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-primary" /> Quadros da Composição ({quadros.length})
              </span>
              <span className="text-[10px] text-muted-foreground">Reordene ou edite as legendas</span>
            </div>

            <div className="space-y-2.5">
              {quadros.map((q, idx) => (
                <div key={q.id} className="p-3 bg-background border border-border rounded-lg space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span className="text-primary truncate max-w-[180px]">{q.tituloQuadro}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoverQuadro(idx, "up")}
                        disabled={idx === 0}
                        title="Mover para Cima"
                        className="p-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleMoverQuadro(idx, "down")}
                        disabled={idx === quadros.length - 1}
                        title="Mover para Baixo"
                        className="p-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Legenda do Quadro (RN-MOD-30-03)</label>
                    <textarea
                      value={q.legendaQuadro}
                      onChange={(e) => handleUpdateLegenda(idx, e.target.value)}
                      rows={2}
                      className="w-full p-2 rounded border border-input bg-background/60 text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACESSIBILIDADE TEXTUAL ASSOCIADA (RN-MOD-30-04) */}
          <div className="glass-card p-4 border border-border/60 space-y-2 text-xs">
            <span className="font-bold text-foreground flex items-center gap-1 text-primary">
              <Info className="h-4 w-4" /> Descrição Textual Acessível (RN-MOD-30-04)
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Ficha visual composta da chapa <b>{chapaAtiva}</b> contendo {quadros.length} evidências fotográficas ordenadas. 
              Adequado para leitores de tela (WCAG 2.2 Level AA).
            </p>
          </div>
        </div>

        {/* COLUNA DIREITA: CANVAS PREVIEW EM TEMPO REAL (RF-MOD-30-06) */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 border border-border/60 space-y-4 bg-slate-950/40">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm text-foreground">Canvas de Pré-visualização Interativa</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportFichaVisualPng}
                  className="h-8 px-3 rounded bg-muted hover:bg-muted/80 text-foreground font-bold text-xs inline-flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar PNG
                </button>
              </div>
            </div>

            {/* DOCUMENTO DA FICHA VISUAL PADRONIZADA (TARJA + GRID + LEGENDAS) */}
            <div className="p-6 bg-slate-900 border-2 border-border/80 rounded-xl space-y-4 shadow-2xl">
              {/* TARJA SUPERIOR DA FICHA */}
              <div className="p-4 bg-slate-950 border border-border/60 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-l-4 border-l-primary">
                <div>
                  <h4 className="font-bold text-sm text-foreground tracking-wide">FICHA VISUAL DE EVIDÊNCIAS PATRIMONIAIS</h4>
                  <span className="text-xs text-muted-foreground">Prefeitura Municipal · Diretoria de Patrimônio Inteligente</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-extrabold text-base text-primary">{chapaAtiva}</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Versão v{versaoComposicao} · {new Date().toLocaleDateString("pt-BR")}</span>
                </div>
              </div>

              {/* GRID DE QUADROS CONFORME TEMPLATE SELECIONADO */}
              <div
                className={`grid gap-4 ${
                  template === "ficha_dupla"
                    ? "grid-cols-1 md:grid-cols-2"
                    : template === "laudo_avaria_3"
                    ? "grid-cols-1 md:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {quadros.slice(0, template === "ficha_dupla" ? 2 : template === "laudo_avaria_3" ? 3 : 4).map((q) => (
                  <div key={q.id} className="bg-slate-950 border border-border/80 rounded-lg p-2.5 space-y-2">
                    <div className="aspect-video bg-slate-900 rounded border border-border overflow-hidden relative group">
                      <img src={q.urlOriginal} alt={q.tituloQuadro} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 text-[9px] px-2 py-0.5 rounded bg-black/80 text-emerald-400 font-mono font-bold border border-emerald-500/40">
                        {q.tipoEvidencia}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-foreground block">{q.tituloQuadro}</span>
                      <p className="text-[10px] text-muted-foreground leading-tight bg-slate-900/60 p-1.5 rounded border border-border/40">
                        {q.legendaQuadro}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* RODAPÉ DA FICHA COM SELO DE AUDITORIA */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Certificado de Integridade Fotográfica · Imagens Originais Preservadas</span>
                <span className="font-mono text-primary font-bold">Template: {template.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE COMPOSIÇÕES VERSIONADAS SALVAS (RF-MOD-30-08 / RN-MOD-30-02) */}
      {composicoesSalvas.length > 0 && (
        <section className="glass-card p-5 border border-border/60 space-y-3">
          <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" /> Histórico de Composições Versionadas Gravadas (RN-MOD-30-02)
          </span>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 font-semibold text-left">
                <tr>
                  <th className="p-2.5">ID Composição</th>
                  <th className="p-2.5">Chapa</th>
                  <th className="p-2.5">Template</th>
                  <th className="p-2.5 text-center">Versão Doc</th>
                  <th className="p-2.5">Data / Autor</th>
                  <th className="p-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {composicoesSalvas.map((c) => (
                  <tr key={c.idComposicao}>
                    <td className="p-2.5 font-mono text-primary font-bold">{c.idComposicao}</td>
                    <td className="p-2.5 font-bold font-mono">{c.chapaPatrimonial}</td>
                    <td className="p-2.5 font-semibold text-foreground">{c.templateUtilizado}</td>
                    <td className="p-2.5 text-center font-mono font-bold">v{c.versao}</td>
                    <td className="p-2.5 text-muted-foreground">{c.dataCriacao} ({c.autor})</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => setModalPreviewExportOpen(true)}
                        className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground font-bold text-[10px]"
                      >
                        Visualizar Ficha PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL FICHA VISUAL PDF (REL-MOD-30-01) */}
      {modalPreviewExportOpen && (
        <Dialog open={modalPreviewExportOpen} onOpenChange={setModalPreviewExportOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileCheck2 className="h-5 w-5" /> Ficha Visual do Bem (Documento Oficial em PDF)
              </DialogTitle>
              <DialogDescription>
                Composição fotográfica final formatada para instrução de processos e laudos técnicos.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-4 bg-background border border-border rounded-lg space-y-2">
                <div className="flex justify-between border-b border-border pb-2">
                  <span><b>Chapa Patrimonial:</b> <span className="font-mono text-primary font-bold">{chapaAtiva}</span></span>
                  <span><b>Versão:</b> v{versaoComposicao}</span>
                </div>
                <div><b>Template Aplicado:</b> {template}</div>
                <div><b>Total de Evidências Incluídas:</b> {quadros.length} fotografias</div>
                <div><b>Imutabilidade dos Originais:</b> Preservada (RN-MOD-30-01)</div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded border border-input bg-background font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
                >
                  <Printer className="h-4 w-4" /> Imprimir Ficha Oficial
                </button>

                <button
                  type="button"
                  onClick={() => setModalPreviewExportOpen(false)}
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
