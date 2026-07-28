import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  HelpCircle,
  BookOpen,
  CheckSquare,
  PlayCircle,
  Search,
  ExternalLink,
  Download,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Zap,
  Tag,
  ArrowRight,
  LifeBuoy,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_resp/responsavel/tutorial")({
  head: () => ({
    meta: [
      { title: "Tutorial & Central de Conhecimento (MOD-33) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Guia passo a passo por perfil, checklists interativos de inventário, vídeos com transcrição acessível, atalhos contextuais e changelog de versão.",
      },
    ],
  }),
  component: RespTutorialPage,
});

export interface ItemChecklist {
  id: string;
  titulo: string;
  descricao: string;
  concluido: boolean;
  linkRota?: string;
  labelRota?: string;
}

export interface ArtigoAjuda {
  id: string;
  categoria: string;
  titulo: string;
  resumo: string;
  perfilPublico: string;
  acessosCount: number;
  conteudoExtenso: string;
}

const MOCK_CHECKLIST_INICIAL: ItemChecklist[] = [
  {
    id: "CHK-1",
    titulo: "1. Consulta e Conferência do Quadro de Bens do Setor",
    descricao: "Verifique a lista de equipamentos sob sua guarda e certifique-se da localização física de cada item.",
    concluido: true,
    linkRota: "/responsavel/inventario",
    labelRota: "Acessar Meu Inventário",
  },
  {
    id: "CHK-2",
    titulo: "2. Verificação e Aceite de Transferências Pendentes",
    descricao: "Confira equipamentos que foram movimentados para o seu setor e realize o aceite formal no sistema.",
    concluido: false,
    linkRota: "/responsavel/transferencias-pendentes",
    labelRota: "Ver Transferências Pendentes",
  },
  {
    id: "CHK-3",
    titulo: "3. Solicitante de Avaliação de Bens Inservíveis ou Danificados",
    descricao: "Abra laudo de avaliação técnica para equipamentos que necessitam de manutenção, reparo ou baixa patrimonial.",
    concluido: false,
    linkRota: "/responsavel/avaliacao",
    labelRota: "Solicitar Avaliação Técnica",
  },
  {
    id: "CHK-4",
    titulo: "4. Indicação de Substituto em Caso de Troca de Responsabilidade",
    descricao: "Formalize o desligamento ou substituição do responsável sem lacunas na guarda dos bens do setor.",
    concluido: false,
    linkRota: "/responsavel/troca-responsabilidade",
    labelRota: "Trocar Responsável de Setor",
  },
];

const MOCK_ARTIGOS: ArtigoAjuda[] = [
  {
    id: "ART-001",
    categoria: "Inventário Patrimonial",
    titulo: "Como realizar a conferência física e confirmação do inventário anual",
    resumo: "Passo a passo para checagem das chapas, registro de divergências e assinatura do termo digital.",
    perfilPublico: "Responsáveis de Setor",
    acessosCount: 342,
    conteudoExtenso:
      "A conferência física deve ser realizada presencialmente verificando a etiqueta de código de barras ou RFID de cada equipamento. Caso um item esteja danificado ou não seja localizado, deve-se registrar a ocorrência no painel do responsável antes do encerramento oficial.",
  },
  {
    id: "ART-002",
    categoria: "Movimentações & Transferências",
    titulo: "Processo de transferência de guarda entre secretarias e setores",
    resumo: "Instruções para emissão de guias de transporte, aceite do destinatário e geração do termo assinado.",
    perfilPublico: "Todos os Perfis",
    acessosCount: 289,
    conteudoExtenso:
      "A transferência de guarda exige autorização prévia da chefia do setor de origem e aceite formal do responsável de destino. Durante a movimentação, a responsabilidade do transporte é da unidade emissora até a recepção.",
  },
  {
    id: "ART-003",
    categoria: "Depósito & Galpão",
    titulo: "Procedimento de solicitação e retirada de materiais no Galpão Central",
    resumo: "Como agendar retiradas, emitir o recibo com QR Code e validar a entrega dos itens estocados.",
    perfilPublico: "Operadores & Requisições",
    acessosCount: 195,
    conteudoExtenso:
      "As retiradas no Galpão Central ocorrem mediante agendamento prévio. O recebedor deve apresentar o documento oficial ou QR Code de autorização na guichê de saída.",
  },
];

function RespTutorialPage() {
  const [checklist, setChecklist] = useState<ItemChecklist[]>(MOCK_CHECKLIST_INICIAL);
  const [artigos, setArtigos] = useState<ArtigoAjuda[]>(MOCK_ARTIGOS);
  const [qSearch, setQSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"checklist" | "artigos" | "video" | "changelog">("checklist");

  // Modal Player de Vídeo Acessível (RF-MOD-33-03 / RN-MOD-33-02)
  const [modalVideoOpen, setModalVideoOpen] = useState(false);

  // Modal Suporte Técnico (RF-MOD-33-07)
  const [modalSuporteOpen, setModalSuporteOpen] = useState(false);
  const [suporteMensagem, setSuporteMensagem] = useState("");

  const percentualProgresso = useMemo(() => {
    const conc = checklist.filter((c) => c.concluido).length;
    return Math.round((conc / checklist.length) * 100);
  }, [checklist]);

  const filteredArtigos = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    return artigos.filter((a) => {
      if (!t) return true;
      return (
        a.titulo.toLowerCase().includes(t) ||
        a.resumo.toLowerCase().includes(t) ||
        a.categoria.toLowerCase().includes(t)
      );
    });
  }, [artigos, qSearch]);

  const kpis = useMemo(
    () => [
      { label: "Versão Ativa da Aplicação", value: "v2.5.0 (Sincronizada)", hint: "Atualizada (RN-MOD-33-01)" },
      { label: "Progresso do Checklist", value: `${percentualProgresso}% concluído`, hint: `${checklist.filter((c) => c.concluido).length} de ${checklist.length} etapas` },
      { label: "Manuais & Artigos Acessíveis", value: `${artigos.length} artigos`, hint: "Acessibilidade WCAG 2.2 AA" },
      { label: "Canal de Suporte Técnico", value: "Ativo / Online", hint: "Resposta em até 2h" },
    ],
    [percentualProgresso, checklist, artigos]
  );

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, concluido: !item.concluido } : item))
    );
  };

  const handleEnviarSuporte = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Sua dúvida/chamado foi registrado com sucesso na Central de Suporte Patrimonial.");
    setModalSuporteOpen(false);
    setSuporteMensagem("");
  };

  const exportMétricasAjudaCsv = () => {
    const headers = ["IDArtigo", "Categoria", "Titulo", "PerfilPublico", "AcessosCount"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const a of artigos) {
      lines.push([escape(a.id), escape(a.categoria), escape(a.titulo), escape(a.perfilPublico), a.acessosCount].join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `metricas-central-conhecimento-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tutorial, Ajuda Contextual e Central de Conhecimento (MOD-33)"
        description="Orientações passo a passo por perfil, checklists interativos de conformidade, vídeos com transcrição acessível, links contextuais e suporte ao usuário."
        crumbs={[{ label: "Responsável", to: "/responsavel" }, { label: "Tutorial & Central de Conhecimento" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={exportMétricasAjudaCsv}
              className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar Métricas (CSV)
            </button>
            <button
              onClick={() => setModalSuporteOpen(true)}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <LifeBuoy className="h-4 w-4" /> Abrir Chamado no Suporte
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* CARD DE DESTAQUE COM VÍDEO EXPLICATIVO ACESSÍVEL (RF-MOD-33-03 / RN-MOD-33-02) */}
      <div className="glass-card p-6 border border-primary/30 flex flex-col md:flex-row items-center justify-between gap-4 bg-primary/5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shrink-0">
            <PlayCircle className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Vídeo Introdutório — Guia do Responsável (5 min)</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Legendas & Transcrição (WCAG 2.2 AA)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Assista à visão geral do processo de inventário, transferência e encerramento anual de inventário do setor.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalVideoOpen(true)}
          className="h-10 px-5 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-2 shrink-0 hover:opacity-90 shadow-sm"
        >
          <PlayCircle className="h-4 w-4" /> Assistir Vídeo Acessível
        </button>
      </div>

      {/* ABAS DE NAVEGAÇÃO DA AJUDA */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("checklist")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "checklist"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          ✅ Checklist do Responsável ({percentualProgresso}%)
        </button>

        <button
          onClick={() => setActiveTab("artigos")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "artigos"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📚 Central de Artigos e Manuais ({artigos.length})
        </button>

        <button
          onClick={() => setActiveTab("changelog")}
          className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-colors border-b-2 ${
            activeTab === "changelog"
              ? "border-primary text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          🚀 Novidades por Versão (Changelog v2.5)
        </button>
      </div>

      {/* ABA 1: CHECKLIST INTERATIVO DE PROGRESO (RF-MOD-33-01 / RF-MOD-33-02 / RF-MOD-33-05) */}
      {activeTab === "checklist" && (
        <section className="glass-card p-5 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" /> Checklist de Atribuições Patrimoniais
              </h3>
              <span className="text-xs text-muted-foreground">Marque as etapas conforme executa as rotinas do seu setor.</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-32 bg-slate-950 rounded-full h-2 overflow-hidden border border-border">
                <div className="bg-primary h-full transition-all duration-500" style={{ width: `${percentualProgresso}%` }} />
              </div>
              <span className="font-mono font-bold text-xs text-primary">{percentualProgresso}% Concluído</span>
            </div>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  item.concluido ? "bg-emerald-500/5 border-emerald-500/30" : "bg-background border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.concluido}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="h-5 w-5 rounded border-input text-primary focus:ring-primary mt-0.5 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <h4 className={`font-bold text-xs ${item.concluido ? "text-emerald-300 line-through" : "text-foreground"}`}>
                      {item.titulo}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">{item.descricao}</p>
                  </div>
                </div>

                {item.linkRota && (
                  <Link
                    to={item.linkRota}
                    className="h-8 px-3 rounded-md bg-muted hover:bg-muted/80 text-foreground font-bold text-xs inline-flex items-center gap-1.5 shrink-0 border border-input"
                  >
                    {item.labelRota} <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABA 2: CENTRAL DE ARTIGOS E BUSCA (RF-MOD-33-04 / RF-MOD-33-05) */}
      {activeTab === "artigos" && (
        <div className="space-y-4">
          <section className="glass-card p-4 border border-border/60">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                placeholder="Buscar por títulos de manuais, categorias ou palavras-chave de apoio..."
                className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
              />
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            {filteredArtigos.map((art) => (
              <div key={art.id} className="glass-card p-5 border border-border/60 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{art.categoria}</span>
                    <span className="text-muted-foreground font-mono">{art.acessosCount} visualizações</span>
                  </div>

                  <h4 className="font-bold text-xs text-foreground leading-snug">{art.titulo}</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">{art.resumo}</p>
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground">Público: {art.perfilPublico}</span>
                  <button
                    onClick={() => alert(`Exibindo artigo completo "${art.titulo}":\n\n${art.conteudoExtenso}`)}
                    className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Ler Artigo Completo <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: NOVIDADES POR VERSÃO (CHANGELOG v2.5) (RF-MOD-33-06 / RN-MOD-33-01) */}
      {activeTab === "changelog" && (
        <section className="glass-card p-6 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Histórico de Novidades por Versão (Changelog)</h3>
            </div>
            <span className="px-3 py-1 rounded bg-primary/10 text-primary font-mono font-bold text-xs border border-primary/30">
              Versão Atual: v2.5.0
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-background border border-border rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-primary">Versão 2.5.0 — Lançamento Atual</span>
                <span className="text-muted-foreground font-mono text-[10px]">28/07/2026</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground leading-relaxed">
                <li><b>MOD-29 & MOD-30:</b> Adicionada captura de fotos por câmera com remoção de EXIF/GPS e editor Canvas com templates de ficha visual em PDF.</li>
                <li><b>MOD-31:</b> Lançado Painel de E-mails com retentativa automatizada por Backoff Exponencial e monitor de Bounces.</li>
                <li><b>MOD-32:</b> Novo Assistente de IA para consultas patrimoniais em linguagem natural via camada semântica com allowlist (sem SQL livre).</li>
                <li><b>MOD-33:</b> Central de Ajuda com tutoriais acessíveis, playlists de vídeo e suporte técnico integrado.</li>
              </ul>
            </div>

            <div className="p-4 bg-background/50 border border-border rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-muted-foreground">Versão 2.4.0 — Módulos Galpão & Operações</span>
                <span className="text-muted-foreground font-mono text-[10px]">15/07/2026</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><b>MOD-27 & MOD-28:</b> Entrada patrimonial por notas de empenho, staging CSV e conciliação triangulada de notas.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* MODAL PLAYER DE VÍDEO ACESSÍVEL (RF-MOD-33-03 / RN-MOD-33-02) */}
      {modalVideoOpen && (
        <Dialog open={modalVideoOpen} onOpenChange={setModalVideoOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <PlayCircle className="h-5 w-5" /> Vídeo Explicativo — Tutorial do Responsável
              </DialogTitle>
              <DialogDescription>
                Player com suporte a legendas e transcrição textual acessível (WCAG 2.2 Level AA).
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="aspect-video bg-slate-950 rounded-xl border border-border flex flex-col items-center justify-center relative overflow-hidden text-center p-4">
                <PlayCircle className="h-12 w-12 text-primary animate-pulse mb-2" />
                <span className="font-bold text-foreground">REPRODUZINDO VÍDEO TUTORIAL (SIMULAÇÃO)</span>
                <span className="text-[10px] text-emerald-400 mt-1">[Legendas em Português Ativas]</span>
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-lg space-y-1.5">
                <span className="font-bold text-foreground block">Transcrição Textual Acessível (Leitores de Tela):</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  "Neste tutorial de 5 minutos, você aprenderá como acessar seu inventário patrimonial, conferir as chapas físicas dos equipamentos do seu setor, aceitar ou recusar transferências recebidas e emitir o Termo Final assinado."
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalVideoOpen(false)}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Fechar Player
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL SUPORTE TÉCNICO (RF-MOD-33-07) */}
      {modalSuporteOpen && (
        <Dialog open={modalSuporteOpen} onOpenChange={setModalSuporteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <LifeBuoy className="h-5 w-5" /> Abrir Chamado no Suporte Patrimonial
              </DialogTitle>
              <DialogDescription>
                Envie sua dúvida ou reporte de problema para a equipe técnica da Diretoria de Patrimônio.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEnviarSuporte} className="space-y-3 text-xs mt-2">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Assunto da Solicitação</label>
                <input
                  placeholder="Ex: Dúvida sobre código de chapa não localizada..."
                  required
                  className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Descrição do Chamado</label>
                <textarea
                  value={suporteMensagem}
                  onChange={(e) => setSuporteMensagem(e.target.value)}
                  placeholder="Descreva detalhadamente sua dúvida ou inconsistência..."
                  rows={4}
                  required
                  className="w-full p-2.5 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalSuporteOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background font-bold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Enviar Chamado
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
