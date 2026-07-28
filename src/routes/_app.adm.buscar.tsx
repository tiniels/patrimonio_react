import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Command,
  Box,
  UserCheck,
  FileText,
  Building2,
  Sparkles,
  Clock,
  ArrowRight,
  Filter,
  Download,
  ExternalLink,
  ShieldCheck,
  Zap,
  CornerDownLeft,
  X,
  History,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/buscar")({
  head: () => ({
    meta: [
      { title: "Busca Global e Navegação Inteligente (MOD-40) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Busca unificada cross-entity, Command Palette Ctrl+K, sugestões em tempo real, dicionário de sinônimos e ações rápidas.",
      },
    ],
  }),
  component: AdmBuscarPage,
});

export interface SearchResultItem {
  id: string;
  tipo: "BEM" | "PESSOA" | "DOCUMENTO" | "LOCAL" | "MODULO";
  titulo: string;
  subtitulo: string;
  detalhe: string;
  linkTo: string;
  tags: string[];
  acoesRapidas: { rotulo: string; to: string }[];
}

const BASE_INDEX: SearchResultItem[] = [
  {
    id: "PAT-2026-0089",
    tipo: "BEM",
    titulo: "Notebook Dell Latitude 5420 i7 16GB",
    subtitulo: "Chapa: PAT-2026-0089 • Valor: R$ 5.800,00",
    detalhe: "Alocado na Secretaria de Saúde (Gabinete)",
    linkTo: "/_app/adm/bens/cadastro",
    tags: ["computador", "pc", "micro", "ti", "notebook", "dell"],
    acoesRapidas: [
      { rotulo: "Ver Cadastro Mestre", to: "/_app/adm/bens/cadastro" },
      { rotulo: "Linha do Tempo", to: "/_app/adm/auditoria" },
    ],
  },
  {
    id: "PAT-2026-0120",
    tipo: "BEM",
    titulo: "Servidor Rack PowerEdge R750 64GB",
    subtitulo: "Chapa: PAT-2026-0120 • Valor: R$ 42.000,00",
    detalhe: "Alocado no Datacenter Central (TI)",
    linkTo: "/_app/adm/bens/cadastro",
    tags: ["servidor", "rack", "datacenter", "dell", "poweredge"],
    acoesRapidas: [
      { rotulo: "Ver Cadastro Mestre", to: "/_app/adm/bens/cadastro" },
      { rotulo: "Ver Categorias", to: "/_app/adm/bens/categorias" },
    ],
  },
  {
    id: "SERV-42159",
    tipo: "PESSOA",
    titulo: "Neemias Oliveira — Prontuário 42159",
    subtitulo: "Cargo: Gestor de TI & Patrimônio",
    detalhe: "Responsável por 48 bens patrimoniais ativos",
    linkTo: "/_app/adm/bens/cadastro",
    tags: ["neemias", "gestor", "responsavel", "servidor", "42159"],
    acoesRapidas: [
      { rotulo: "Termos do Responsável", to: "/_app/adm/relatorios" },
    ],
  },
  {
    id: "DOC-NF-99201",
    tipo: "DOCUMENTO",
    titulo: "Nota Fiscal Eletrônica NF-99201",
    subtitulo: "Fornecedor: Dell Computadores do Brasil Ltda",
    detalhe: "Empenho EMP-2026-8801 • Exercício 2026",
    linkTo: "/_app/adm/relatorios",
    tags: ["nf", "nota fiscal", "empenho", "dell", "aquisiçao"],
    acoesRapidas: [
      { rotulo: "Ver Empenho & NF", to: "/_app/adm/relatorios" },
    ],
  },
  {
    id: "LOC-SAUDE-01",
    tipo: "LOCAL",
    titulo: "Secretaria Municipal de Saúde (Sede)",
    subtitulo: "Unidade Central • Cod: SEC-SAUDE",
    detalhe: "Possui 142 bens alocados e 3 inventários pendentes",
    linkTo: "/_app/adm/explorar",
    tags: ["saude", "secretaria", "posto", "unidade", "locais"],
    acoesRapidas: [
      { rotulo: "Explorar Bens no Mapa", to: "/_app/adm/explorar" },
    ],
  },
  {
    id: "MOD-AUDITORIA",
    tipo: "MODULO",
    titulo: "Histórico, Auditoria e Linha do Tempo (MOD-36)",
    subtitulo: "Trilha append-only, mascaramento PII e detecção de anomalias",
    detalhe: "Acesse para verificar logs de alterações",
    linkTo: "/_app/adm/auditoria",
    tags: ["auditoria", "logs", "linha do tempo", "eventos", "mod-36"],
    acoesRapidas: [
      { rotulo: "Ir para Módulo MOD-36", to: "/_app/adm/auditoria" },
    ],
  },
];

// DICIONÁRIO DE SINÔNIMOS (RF-MOD-40-06)
const MAPA_SINONIMOS: Record<string, string[]> = {
  pc: ["computador", "notebook", "dell"],
  micro: ["notebook", "computador"],
  veiculo: ["carro", "frota", "transporte"],
  prontuario: ["servidor", "pessoa", "responsavel"],
};

function AdmBuscarPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("TODOS");
  const [recents, setRecents] = useState<string[]>([
    "PAT-2026-0089",
    "Notebook Dell",
    "Secretaria de Saúde",
  ]);

  // Command Palette State (RF-MOD-40-03)
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  // Pressionar Ctrl+K para abrir a Command Palette (RF-MOD-40-03)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // FILTRAGEM & SINÔNIMOS (RF-MOD-40-01, 04, 06)
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return BASE_INDEX;

    // Resolve sinônimos
    const sinonimosExp = MAPA_SINONIMOS[q] || [q];

    return BASE_INDEX.filter((item) => {
      if (tipoFilter !== "TODOS" && item.tipo !== tipoFilter) return false;

      const textoItem = `${item.id} ${item.titulo} ${item.subtitulo} ${item.detalhe} ${item.tags.join(" ")}`.toLowerCase();

      return (
        textoItem.includes(q) ||
        sinonimosExp.some((sin) => textoItem.includes(sin))
      );
    });
  }, [query, tipoFilter]);

  const paletteResults = useMemo(() => {
    const q = paletteQuery.toLowerCase().trim();
    if (!q) return BASE_INDEX.slice(0, 5);
    return BASE_INDEX.filter((i) =>
      `${i.id} ${i.titulo} ${i.subtitulo}`.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [paletteQuery]);

  const kpis = useMemo(
    () => [
      { label: "Entidades Indexadas", value: `${BASE_INDEX.length} registros`, hint: "Cross-entity search (RF-MOD-40-01)" },
      { label: "Atalho da Command Palette", value: "Ctrl + K / Cmd + K", hint: "Conforme RF-MOD-40-03" },
      { label: "Tempo de Resposta P95", value: "< 45 ms", hint: "Alta performance de consulta" },
      { label: "Privacidade & PII", value: "Resumo Anonimizado", hint: "Conforme RN-MOD-40-04" },
    ],
    []
  );

  const handleSelectResult = (item: SearchResultItem) => {
    if (!recents.includes(item.titulo)) {
      setRecents([item.titulo, ...recents.slice(0, 4)]);
    }
    navigate({ to: item.linkTo as any });
  };

  const exportBuscaCsv = () => {
    const headers = ["ID", "Tipo", "Titulo", "Subtitulo", "Detalhe"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const r of results) {
      lines.push([escape(r.id), escape(r.tipo), escape(r.titulo), escape(r.subtitulo), escape(r.detalhe)].join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-busca-unificada-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Busca Global e Navegação Inteligente (MOD-40)"
        description="Localizador unificado cross-entity, Command Palette (Ctrl+K), sugestões com sinônimos e ações rápidas."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Navegação & Busca" }, { label: "Central Global" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPalette(true)}
              className="h-9 px-3 rounded-md bg-accent text-accent-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Command className="h-4 w-4" /> Command Palette <span className="font-mono text-[10px] bg-accent-foreground/10 px-1 rounded">Ctrl+K</span>
            </button>
            <button
              onClick={exportBuscaCsv}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Download className="h-4 w-4" /> Exportar Resultados (CSV)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* CAMPO DE BUSCA PRINCIPAL E FILTROS (RF-MOD-40-01 / RF-MOD-40-04) */}
      <section className="glass-card p-6 border border-border/60 space-y-4">
        <div className="relative w-full">
          <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite qualquer termo (ex: PAT-2026-0089, Dell, Neemias, NF-99201, Saúde)..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-input bg-background/60 text-sm font-semibold focus:ring-2 focus:ring-primary shadow-inner"
          />
        </div>

        {/* FILTROS POR TIPO DE ENTIDADE (RF-MOD-40-04) */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-foreground mr-1">Filtrar por Entidade:</span>
            {[
              { key: "TODOS", label: "Todas" },
              { key: "BEM", label: "Bens Patrimoniais" },
              { key: "PESSOA", label: "Servidores / Pessoas" },
              { key: "DOCUMENTO", label: "Notas / Empenhos" },
              { key: "LOCAL", label: "Setores & Locais" },
              { key: "MODULO", label: "Módulos do Sistema" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setTipoFilter(f.key)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  tipoFilter === f.key
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* MENSAGEM DE SINÔNIMOS (RF-MOD-40-06) */}
          {MAPA_SINONIMOS[query.toLowerCase().trim()] && (
            <div className="text-xs text-accent font-semibold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Dicionário de Sinônimos ativo: buscando também por "
              {MAPA_SINONIMOS[query.toLowerCase().trim()].join(", ")}"
            </div>
          )}
        </div>
      </section>

      {/* BUSCAS RECENTES (RF-MOD-40-05) */}
      {recents.length > 0 && !query && (
        <section className="flex items-center gap-2 text-xs text-muted-foreground">
          <History className="h-4 w-4 text-primary shrink-0" />
          <span className="font-bold text-foreground">Pesquisas Recentes:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {recents.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                className="px-2.5 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-foreground text-[11px] font-mono"
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* LISTAGEM DOS RESULTADOS DA BUSCA (RF-MOD-40-01 / RF-MOD-40-08) */}
      <section className="space-y-3">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" /> Resultados Encontrados ({results.length})
        </h3>

        {results.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground space-y-2 border border-border/60">
            <Search className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
            <p className="font-bold text-sm text-foreground">Nenhum registro encontrado para "{query}"</p>
            <p className="text-xs">Tente utilizar sinônimos como "pc" para "Notebook" ou verifique a ortografia.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {results.map((item) => (
              <div
                key={item.id}
                className="glass-card p-5 border border-border/60 hover:border-primary/50 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                      {item.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {item.tipo}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-tight">
                    {item.titulo}
                  </h4>

                  <p className="text-[11px] font-semibold text-muted-foreground">{item.subtitulo}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.detalhe}</p>
                </div>

                {/* AÇÕES RÁPIDAS (RF-MOD-40-08) */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {item.acoesRapidas.map((act) => (
                      <button
                        key={act.rotulo}
                        onClick={() => navigate({ to: act.to as any })}
                        className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground font-bold text-[10px] inline-flex items-center gap-1"
                      >
                        {act.rotulo} <ExternalLink className="h-3 w-3" />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectResult(item)}
                    className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1 hover:opacity-90 shadow-sm"
                  >
                    Acessar <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL COMMAND PALETTE (RF-MOD-40-03) */}
      {showPalette && (
        <Dialog open={showPalette} onOpenChange={setShowPalette}>
          <DialogContent className="max-w-xl p-0 overflow-hidden border-border/80">
            <div className="p-3 border-b border-border flex items-center gap-2 bg-background">
              <Command className="h-4 w-4 text-primary shrink-0" />
              <input
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Digite um comando ou pesquise (ex: Auditoria, Dell, Saúde)..."
                autoFocus
                className="w-full h-9 bg-transparent border-none text-xs font-semibold focus:outline-none text-foreground"
              />
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                ESC para fechar
              </span>
            </div>

            <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
              {paletteResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    handleSelectResult(item);
                    setShowPalette(false);
                  }}
                  className="p-2.5 rounded-lg hover:bg-primary/10 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <span className="font-bold text-xs text-foreground block">{item.titulo}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.subtitulo}</span>
                  </div>
                  <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
