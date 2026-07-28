import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Send,
  Building,
  UserCheck,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";

export const Route = createFileRoute("/_app/inventario/transferir")({
  head: () => ({
    meta: [
      { title: "Registrar Transferência — Patrimônio Inteligente" },
      { name: "description", content: "Solicitação de transferência de bens com validações e termo oficial." },
    ],
  }),
  component: TransferirPage,
});

function TransferirPage() {
  const [selectedChapas, setSelectedChapas] = useState<string[]>([]);
  const [targetSetor, setTargetSetor] = useState("Galpão Central de Manutenção");
  const [justificativa, setJustificativa] = useState("");
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChapas.length === 0) {
      alert("Selecione ao menos um bem para a transferência.");
      return;
    }
    if (!justificativa.trim()) {
      alert("Informe a justificativa.");
      return;
    }

    const prot = `TRF-2026-ADM-${Math.floor(100 + Math.random() * 900)}`;
    setProtocoloGerado(prot);
    setSelectedChapas([]);
    setJustificativa("");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Registrar Transferência de Bens (MOD-14)"
        description="Solicitar a movimentação de bens patrimoniais para outro setor com geração de protocolo e anexo."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Inventário" }, { label: "Registrar Transferência" }]}
      />

      {protocoloGerado && (
        <div className="p-4 bg-success/20 border border-success/40 rounded-xl text-success font-semibold text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Transferência solicitada com sucesso! <b>Protocolo: {protocoloGerado}</b>. Aguardando autorização do setor de destino.</span>
          </div>
          <button onClick={() => setProtocoloGerado(null)} className="underline text-xs">Fechar</button>
        </div>
      )}

      <section className="glass-card p-5 border border-border/60">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">Chapas dos Bens (separadas por vírgula) *</label>
            <input
              placeholder="Ex: 100452, 100453, ESP-9901"
              value={selectedChapas.join(", ")}
              onChange={(e) => setSelectedChapas(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">Setor de Destino *</label>
            <select
              value={targetSetor}
              onChange={(e) => setTargetSetor(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
            >
              <option value="Galpão Central de Manutenção">Galpão Central de Manutenção (Serviços Municipais)</option>
              <option value="EMEF Aldeia de Barueri">EMEF Aldeia de Barueri (Educação)</option>
              <option value="USA Fazendinha">USA Fazendinha (Saúde)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground">Justificativa *</label>
            <textarea
              required
              rows={3}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Justifique a necessidade de movimentação dos bens..."
              className="p-2.5 rounded-md border border-input bg-background/60 text-xs"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <button
              type="submit"
              className="h-10 px-6 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-2 hover:opacity-90"
            >
              <Send className="h-4 w-4" /> Gerar Protocolo & Enviar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
