import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileCheck,
  Building,
  Tag,
  MapPin,
  RefreshCw,
  Download,
  Filter,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import { usePatrimonioData } from "@/hooks/usePatrimonioData";

export const Route = createFileRoute("/_app/inventario/lista")({
  head: () => ({
    meta: [
      { title: "Lista de Inventário — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Bens alocados do setor com busca por chapa, conservação e conferência física.",
      },
    ],
  }),
  component: InventarioListaPage,
});

function InventarioListaPage() {
  const patrimonioState = usePatrimonioData();
  const [qChapa, setQChapa] = useState("");
  const [qDesc, setQDesc] = useState("");
  const [qLocal, setQLocal] = useState("");
  const [situacaoFilter, setSituacaoFilter] = useState("");

  const rows = useMemo(() => {
    if (!patrimonioState.rows) return [];
    return patrimonioState.rows.filter((r) => {
      if (qChapa && !r.chapa.toLowerCase().includes(qChapa.toLowerCase().trim())) return false;
      if (qDesc && !r.descricao.toLowerCase().includes(qDesc.toLowerCase().trim())) return false;
      if (qLocal && !r.local.toLowerCase().includes(qLocal.toLowerCase().trim())) return false;
      if (situacaoFilter && r.situacao !== situacaoFilter) return false;
      return true;
    });
  }, [patrimonioState.rows, qChapa, qDesc, qLocal, situacaoFilter]);

  const kpis = useMemo(
    () => [
      { label: "Total de Bens Filtrados", value: String(rows.length) },
      { label: "Bens Em Uso Regular", value: String(rows.filter((r) => r.situacao === "EM USO").length) },
      { label: "Transferências Pendentes", value: String(rows.filter((r) => r.situacao === "EM TRANSIÇÃO").length) },
      { label: "Sem Informação", value: String(rows.filter((r) => r.situacao === "NÃO INFORMADO").length) },
    ],
    [rows]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meu Inventário / Lista de Bens (MOD-12)"
        description="Listagem numérica ordenada de bens com busca por chapa, descrição e localização física."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Inventário" }, { label: "Lista de Bens" }]}
        actions={
          <button
            onClick={() => alert("Exportando lista de inventário em CSV...")}
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Exportar Lista (CSV)
          </button>
        }
      />

      <KPIGrid items={kpis} />

      {/* FILTROS MULTI-CAMPO */}
      <section className="glass-card p-4 border border-border/60">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Filtros da Lista de Inventário</span>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={qChapa}
            onChange={(e) => setQChapa(e.target.value)}
            placeholder="Chapa (ex: 100452)..."
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-mono"
          />

          <input
            value={qDesc}
            onChange={(e) => setQDesc(e.target.value)}
            placeholder="Descrição do patrimônio..."
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs"
          />

          <input
            value={qLocal}
            onChange={(e) => setQLocal(e.target.value)}
            placeholder="Localização / Sala..."
            className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs"
          />

          <select
            value={situacaoFilter}
            onChange={(e) => setSituacaoFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs font-semibold"
          >
            <option value="">Todas as situações</option>
            <option value="EM USO">EM USO</option>
            <option value="EM TRANSIÇÃO">EM TRANSIÇÃO</option>
            <option value="NÃO INFORMADO">NÃO INFORMADO</option>
          </select>
        </div>
      </section>

      {/* TABELA DE BENS */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Chapa</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Localização / Setor</th>
                <th className="p-3">Situação</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.slice(0, 100).map((r) => (
                <tr key={r.chapa} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{r.chapa}</td>
                  <td className="p-3 font-medium text-foreground">{r.descricao}</td>
                  <td className="p-3 text-muted-foreground">{r.local}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-muted text-[10px] uppercase font-bold">
                      {r.situacao}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{r.estadoConservacao || "BOM"}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => alert(`Ficha do patrimônio ${r.chapa}`)}
                      className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-[11px] font-semibold"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum bem encontrado para os filtros informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
