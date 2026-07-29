import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Filter } from "lucide-react";
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
    return patrimonioState.rows.filter((row) => {
      const chapa = row.chapa.toLowerCase();
      const description = (row.descricao ?? "").toLowerCase();
      const location = (row.local ?? "").toLowerCase();

      if (qChapa && !chapa.includes(qChapa.toLowerCase().trim())) return false;
      if (qDesc && !description.includes(qDesc.toLowerCase().trim())) return false;
      if (qLocal && !location.includes(qLocal.toLowerCase().trim())) return false;
      if (situacaoFilter && row.situacao !== situacaoFilter) return false;
      return true;
    });
  }, [patrimonioState.rows, qChapa, qDesc, qLocal, situacaoFilter]);

  const kpis = useMemo(
    () => [
      { label: "Total de Bens Filtrados", value: String(rows.length) },
      {
        label: "Bens Em Uso Regular",
        value: String(rows.filter((row) => row.situacao === "EM USO").length),
      },
      {
        label: "Transferências Pendentes",
        value: String(rows.filter((row) => row.situacao === "EM TRANSIÇÃO").length),
      },
      {
        label: "Sem Informação",
        value: String(rows.filter((row) => row.situacao === "NÃO INFORMADO").length),
      },
    ],
    [rows],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meu Inventário / Lista de Bens (MOD-12)"
        description="Listagem numérica ordenada de bens com busca por chapa, descrição e localização física."
        crumbs={[
          { label: "Painel", to: "/adm" },
          { label: "Inventário" },
          { label: "Lista de Bens" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => alert("Exportando lista de inventário em CSV...")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar Lista (CSV)
          </button>
        }
      />

      <KPIGrid items={kpis} />

      <section className="glass-card border border-border/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-medium text-foreground">Filtros da Lista de Inventário</span>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            aria-label="Filtrar por chapa"
            value={qChapa}
            onChange={(event) => setQChapa(event.target.value)}
            placeholder="Chapa (ex: 100452)..."
            className="h-10 rounded-md border border-input bg-background/60 px-3 font-mono text-xs"
          />

          <input
            aria-label="Filtrar por descrição"
            value={qDesc}
            onChange={(event) => setQDesc(event.target.value)}
            placeholder="Descrição do patrimônio..."
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs"
          />

          <input
            aria-label="Filtrar por localização"
            value={qLocal}
            onChange={(event) => setQLocal(event.target.value)}
            placeholder="Localização / Sala..."
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs"
          />

          <select
            aria-label="Filtrar por situação"
            value={situacaoFilter}
            onChange={(event) => setSituacaoFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs font-semibold"
          >
            <option value="">Todas as situações</option>
            <option value="EM USO">EM USO</option>
            <option value="EM TRANSIÇÃO">EM TRANSIÇÃO</option>
            <option value="NÃO INFORMADO">NÃO INFORMADO</option>
          </select>
        </div>
      </section>

      <section className="glass-card overflow-hidden border border-border/60 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border/60 bg-muted/50 text-left font-semibold text-foreground">
              <tr>
                <th scope="col" className="p-3">
                  Chapa
                </th>
                <th scope="col" className="p-3">
                  Descrição
                </th>
                <th scope="col" className="p-3">
                  Localização / Setor
                </th>
                <th scope="col" className="p-3">
                  Situação
                </th>
                <th scope="col" className="p-3">
                  Estado
                </th>
                <th scope="col" className="p-3 text-right">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.slice(0, 100).map((row) => (
                <tr key={row.chapa} className="transition-colors hover:bg-accent/10">
                  <td className="p-3 font-mono font-bold text-primary">{row.chapa}</td>
                  <td className="p-3 font-medium text-foreground">
                    {row.descricao ?? "Não informado"}
                  </td>
                  <td className="p-3 text-muted-foreground">{row.local ?? "Não informado"}</td>
                  <td className="p-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">
                      {row.situacao ?? "Não informado"}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {row.estadoConservacao ?? "Não informado"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`Ficha do patrimônio ${row.chapa}`)}
                      className="rounded bg-muted px-2.5 py-1 text-[11px] font-semibold hover:bg-muted/80"
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
