import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Camera,
  Upload,
  WifiOff,
  Wifi,
  RefreshCw,
  FileCheck,
  Building,
  Tag,
  FileText,
  MapPin,
  Clock,
  Send,
  Download,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getRespAuthSession } from "@/lib/authStore";

export const Route = createFileRoute("/_resp/responsavel/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário do Responsável (MOD-12) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Conferência física de bens, leitor de QR Code/Barcode, observações com foto, suporte offline e emissão de comprovante digital.",
      },
    ],
  }),
  component: RespInventarioPage,
});

export type StatusConferencia = "pendente" | "localizado" | "nao_localizado" | "avariado" | "transferencia";

export interface ItemInventarioResp {
  chapa: string;
  descricao: string;
  salaFisica: string;
  conservacao: "Ótimo" | "Bom" | "Regular" | "Péssimo / Avariado";
  status: StatusConferencia;
  observacao?: string;
  fotoUrl?: string;
  dataConferencia?: string;
  dispositivoId?: string;
  sincronizado: boolean; // RF-MOD-12-07
}

const INITIAL_BENS: ItemInventarioResp[] = [
  {
    chapa: "100452",
    descricao: "MESA PARA ESCRITÓRIO EM L COM GAVETEIRO",
    salaFisica: "Sala 01 - Recepção Principal",
    conservacao: "Bom",
    status: "localizado",
    dataConferencia: "2026-07-28 10:30",
    dispositivoId: "DEV-MOBILE-42",
    sincronizado: true,
  },
  {
    chapa: "100453",
    descricao: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA",
    salaFisica: "Sala 01 - Recepção Principal",
    conservacao: "Bom",
    status: "pendente",
    sincronizado: true,
  },
  {
    chapa: "ESP-9901",
    descricao: "NOTEBOOK DELL LATITUDE 5540 CORE I7 16GB",
    salaFisica: "Sala 02 - Chefia / Gabinete",
    conservacao: "Ótimo",
    status: "localizado",
    dataConferencia: "2026-07-28 11:15",
    dispositivoId: "DEV-MOBILE-42",
    sincronizado: true,
  },
  {
    chapa: "100120",
    descricao: "AR CONDICIONADO SPLIT 18000 BTU INVERTER",
    salaFisica: "Sala 03 - Arquivo Morto",
    conservacao: "Péssimo / Avariado",
    status: "avariado",
    observacao: "Compressor apresentando vazamento de gás refrigerante.",
    fotoUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
    dataConferencia: "2026-07-28 12:00",
    dispositivoId: "DEV-MOBILE-42",
    sincronizado: true,
  },
  {
    chapa: "100889",
    descricao: "IMPRESSORA MULTIFUNCIONAL HP LASERJET",
    salaFisica: "Sala 01 - Recepção Principal",
    conservacao: "Bom",
    status: "pendente",
    sincronizado: true,
  },
  {
    chapa: "100990",
    descricao: "ARMÁRIO DE AÇO 2 PORTAS COM CHAVE",
    salaFisica: "Corredor Central - Bloco B",
    conservacao: "Regular",
    status: "pendente",
    sincronizado: true,
  },
];

function RespInventarioPage() {
  const session = getRespAuthSession();
  const setorNome = session?.unidadeNome || session?.setor || "Departamento de Contabilidade e Patrimônio";
  const responsavelNome = session?.responsavelNome || session?.responsavel || "Neemias Oliveira";

  const [bens, setBens] = useState<ItemInventarioResp[]>(INITIAL_BENS);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Modais
  const [activeScanner, setActiveScanner] = useState(false);
  const [bipeChapaInput, setBipeChapaInput] = useState("");
  const [editingItem, setEditingItem] = useState<ItemInventarioResp | null>(null);

  // Campos do Form de Conferência Detalhada
  const [editStatus, setEditStatus] = useState<StatusConferencia>("localizado");
  const [editSala, setEditSala] = useState("");
  const [editConservacao, setEditConservacao] = useState<"Ótimo" | "Bom" | "Regular" | "Péssimo / Avariado">("Bom");
  const [editObs, setEditObs] = useState("");
  const [editFoto, setEditFoto] = useState("");

  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    return bens.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!t) return true;

      return (
        b.chapa.toLowerCase().includes(t) ||
        b.descricao.toLowerCase().includes(t) ||
        b.salaFisica.toLowerCase().includes(t)
      );
    });
  }, [bens, q, statusFilter]);

  const conferidosCount = useMemo(() => bens.filter((b) => b.status !== "pendente").length, [bens]);
  const pctConferido = bens.length > 0 ? Math.round((conferidosCount / bens.length) * 100) : 0;
  const pendentesSincronizacao = useMemo(() => bens.filter((b) => !b.sincronizado).length, [bens]);

  const kpis = useMemo(
    () => [
      { label: "Total no Escopo", value: String(bens.length) },
      { label: "Progresso Conferido", value: `${pctConferido}%` },
      { label: "Localizados", value: String(bens.filter((b) => b.status === "localizado").length) },
      { label: "Avariados / Pendências", value: String(bens.filter((b) => b.status === "avariado" || b.status === "nao_localizado").length) },
    ],
    [bens, pctConferido]
  );

  // Bipe Rápido por Código (RF-MOD-12-03)
  const handleBipeRapido = (chapaParaBipar?: string) => {
    const targetChapa = (chapaParaBipar || bipeChapaInput).trim().toUpperCase();
    if (!targetChapa) return;

    const found = bens.find((b) => b.chapa.toUpperCase() === targetChapa);
    if (!found) {
      alert(`Chapa '${targetChapa}' não pertence ao escopo deste setor.`);
      return;
    }

    const dataHora = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setBens((prev) =>
      prev.map((b) => {
        if (b.chapa.toUpperCase() === targetChapa) {
          return {
            ...b,
            status: "localizado",
            dataConferencia: dataHora,
            dispositivoId: "DEV-MOBILE-42",
            sincronizado: !isOfflineMode,
          };
        }
        return b;
      })
    );

    setBipeChapaInput("");
    setActiveScanner(false);
  };

  // Abrir Modal de Edição Detalhada (RF-MOD-12-05 & RF-MOD-12-06)
  const openEditModal = (item: ItemInventarioResp) => {
    setEditingItem(item);
    setEditStatus(item.status === "pendente" ? "localizado" : item.status);
    setEditSala(item.salaFisica);
    setEditConservacao(item.conservacao);
    setEditObs(item.observacao || "");
    setEditFoto(item.fotoUrl || "");
  };

  // Salvar Conferência (RN-MOD-12-01 / RN-MOD-12-03)
  const handleSaveConferencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Regra RN-MOD-12-03: Avaria exige observação ou foto
    if (editStatus === "avariado" && !editObs.trim() && !editFoto) {
      alert("Avisos de avaria exigem o preenchimento de observação detalhada.");
      return;
    }

    const dataHora = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setBens((prev) =>
      prev.map((b) => {
        if (b.chapa === editingItem.chapa) {
          return {
            ...b,
            status: editStatus,
            salaFisica: editSala.trim() || b.salaFisica,
            conservacao: editConservacao,
            observacao: editObs.trim() || undefined,
            fotoUrl: editFoto || undefined,
            dataConferencia: dataHora,
            dispositivoId: "DEV-MOBILE-42",
            sincronizado: !isOfflineMode,
          };
        }
        return b;
      })
    );

    setEditingItem(null);
  };

  // Sincronização em Lote (RF-MOD-12-08 / RN-MOD-12-04)
  const handleSyncLote = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setBens((prev) => prev.map((b) => ({ ...b, sincronizado: true })));
      setIsSyncing(false);
      alert("Sincronização em lote concluída com sucesso! Todas as conferências foram gravadas no servidor.");
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Inventário do Setor — ${setorNome}`}
        description="Conferência física de bens, leitor de QR Code, registro de avarias e emissão do Comprovante Digital."
        crumbs={[{ label: "Responsável", to: "/responsavel" }, { label: "Inventário do Setor" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsOfflineMode((v) => !v)}
              className={`h-9 px-3 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                isOfflineMode
                  ? "bg-warning/20 border-warning text-warning"
                  : "bg-muted border-input text-muted-foreground"
              }`}
            >
              {isOfflineMode ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4 text-success" />}
              {isOfflineMode ? "Modo Offline Ativo" : "Online"}
            </button>

            {pendentesSincronizacao > 0 && (
              <button
                onClick={handleSyncLote}
                disabled={isSyncing}
                className="h-9 px-3 rounded-md bg-accent text-accent-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} /> Sincronizar ({pendentesSincronizacao})
              </button>
            )}

            <button
              onClick={() => setActiveScanner(true)}
              className="h-9 px-3 rounded-md border border-primary/40 bg-primary/10 text-primary font-bold text-xs inline-flex items-center gap-1.5 hover:bg-primary/20 transition-all"
            >
              <QrCode className="h-4 w-4" /> Bipar QR Code / Barcode
            </button>

            <button
              onClick={() => setShowComprovanteModal(true)}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <FileCheck className="h-4 w-4" /> Comprovante Digital
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* BARRA DE PROGRESSO DO INVENTÁRIO DO RESPONSÁVEL (RF-MOD-12-01) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Building className="h-4 w-4 text-primary" />
            <span>Progresso da Conferência de {setorNome}</span>
          </div>
          <span className="font-mono font-bold text-primary text-sm">{pctConferido}% concluído ({conferidosCount} / {bens.length})</span>
        </div>

        <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              pctConferido === 100 ? "bg-success" : pctConferido > 50 ? "bg-primary" : "bg-warning"
            }`}
            style={{ width: `${pctConferido}%` }}
          />
        </div>
      </section>

      {/* FILTROS E PESQUISA DE BENS */}
      <section className="glass-card p-4 border border-border/60">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-3 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por chapa (ex: 100452), descrição ou sala física..."
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs font-semibold"
          >
            <option value="all">Todos os status</option>
            <option value="pendente">⏳ Pendentes de Conferência</option>
            <option value="localizado">🟢 Localizados</option>
            <option value="nao_localizado">🔴 Não Localizados</option>
            <option value="avariado">⚠️ Avariados / Danificados</option>
          </select>
        </div>
      </section>

      {/* LISTA DO ESCOPO DE BENS DO RESPONSÁVEL (RF-MOD-12-01 a RF-MOD-12-04) */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Chapa</th>
                <th className="p-3">Descrição do Patrimônio</th>
                <th className="p-3">Sala / Local Interno</th>
                <th className="p-3">Conservação</th>
                <th className="p-3">Status Conferência</th>
                <th className="p-3">Data / Registro</th>
                <th className="p-3 text-right">Ação / Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((item) => (
                <tr key={item.chapa} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{item.chapa}</td>
                  <td className="p-3 font-medium text-foreground">
                    <div>{item.descricao}</div>
                    {item.observacao && (
                      <span className="text-[11px] text-warning font-sans italic block mt-0.5">
                        Obs: {item.observacao}
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" /> {item.salaFisica}
                    </span>
                  </td>

                  <td className="p-3 font-semibold text-foreground">{item.conservacao}</td>

                  <td className="p-3">
                    <StatusConferenciaBadge status={item.status} />
                    {!item.sincronizado && (
                      <span className="block text-[10px] text-warning font-mono font-bold mt-0.5">
                        ⏳ Pendente de Sincronização
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-muted-foreground text-[11px]">
                    {item.dataConferencia ? (
                      <div>
                        <div>{item.dataConferencia}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{item.dispositivoId}</div>
                      </div>
                    ) : (
                      "Não conferido"
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => openEditModal(item)}
                      className="px-2.5 py-1 rounded bg-muted hover:bg-primary/20 hover:text-primary transition-colors text-[11px] font-semibold"
                    >
                      Conferir / Detalhes
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhum bem encontrado no escopo para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL SIMULADOR / LEITOR DE QR CODE & BARCODE (RF-MOD-12-03) */}
      {activeScanner && (
        <Dialog open={activeScanner} onOpenChange={setActiveScanner}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <QrCode className="h-5 w-5" /> Leitor de Código de Barras / QR Code (RF-MOD-12-03)
              </DialogTitle>
              <DialogDescription>
                Aproxime a chapa da câmera ou digite o número do tombamento para conferência instantânea.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 text-xs mt-2">
              <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden">
                <div className="w-24 h-24 border-2 border-dashed border-primary rounded-lg flex items-center justify-center animate-pulse">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <span className="text-slate-300 font-medium text-[11px]">
                  Câmera ativa · Aguardando enquadramento da etiqueta homologada 50x30mm
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-foreground">Digitar ou Bipar Chapa Manualmente *</label>
                <div className="flex gap-2">
                  <input
                    value={bipeChapaInput}
                    onChange={(e) => setBipeChapaInput(e.target.value)}
                    placeholder="Ex: 100452"
                    className="h-10 px-3 rounded-md border border-input bg-background/60 font-mono text-sm w-full"
                  />
                  <button
                    onClick={() => handleBipeRapido()}
                    className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-bold text-xs shrink-0"
                  >
                    Bipar
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded bg-muted/40 text-[11px] text-muted-foreground">
                <span className="font-bold text-foreground">Bipe Rápido de Teste:</span> Clique em qualquer chapa abaixo para simular a leitura do código de barras:
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {bens.map((b) => (
                    <button
                      key={b.chapa}
                      onClick={() => handleBipeRapido(b.chapa)}
                      className="px-2 py-0.5 rounded bg-background border border-border font-mono font-bold text-primary hover:bg-accent/20"
                    >
                      {b.chapa}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL CONFERÊNCIA DETALHADA / OBSERVAÇÃO & FOTO (RF-MOD-12-05 & RF-MOD-12-06) */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" /> Conferência do Bem #{editingItem.chapa}
              </DialogTitle>
              <DialogDescription>
                {editingItem.descricao}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveConferencia} className="flex flex-col gap-3 text-xs mt-2">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Resultado da Conferência *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as StatusConferencia)}
                  className="h-10 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
                >
                  <option value="localizado">🟢 Localizado (Em conformidade)</option>
                  <option value="nao_localizado">🔴 Não Localizado no Setor</option>
                  <option value="avariado">⚠️ Avariado / Danificado</option>
                  <option value="transferencia">🔄 Transferência de Sala / Setor</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Localização Interna (Sala / Armário) *</label>
                <input
                  required
                  value={editSala}
                  onChange={(e) => setEditSala(e.target.value)}
                  className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Estado de Conservação *</label>
                <select
                  value={editConservacao}
                  onChange={(e) => setEditConservacao(e.target.value as any)}
                  className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs"
                >
                  <option value="Ótimo">Ótimo</option>
                  <option value="Bom">Bom</option>
                  <option value="Regular">Regular</option>
                  <option value="Péssimo / Avariado">Péssimo / Avariado</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">
                  Observações {editStatus === "avariado" ? "*" : "(Opcional)"}
                </label>
                <textarea
                  rows={2}
                  value={editObs}
                  onChange={(e) => setEditObs(e.target.value)}
                  placeholder="Detalhe o estado físico ou justificativa da alteração..."
                  className="p-2.5 rounded-md border border-input bg-background/60 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Salvar Conferência
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL COMPROVANTE DIGITAL DE ENVIO (REL-MOD-12-03) */}
      {showComprovanteModal && (
        <Dialog open={showComprovanteModal} onOpenChange={setShowComprovanteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-success">
                <FileCheck className="h-5 w-5" /> Comprovante Digital de Envio do Inventário
              </DialogTitle>
              <DialogDescription>
                Documento de prestação de contas com assinatura eletrônica institucional.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-700 flex flex-col gap-2 font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Prefeitura de Santana de Parnaíba</div>
                <div className="text-sm font-bold text-success">COMPROVANTE DE CONFERÊNCIA PATRIMONIAL</div>
                <div className="text-[11px] text-slate-300">Setor: {setorNome}</div>
                <div className="text-[11px] text-slate-300">Responsável: {responsavelNome}</div>
                <div className="text-[11px] text-slate-300">Total de Bens: {bens.length} | Conferidos: {conferidosCount} ({pctConferido}%)</div>
                <div className="text-[9px] text-slate-500 border-t border-slate-800 pt-2 break-all">
                  Hash SHA-256: 8f9b201a44c988a2176ff00192a3487c
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowComprovanteModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert("Comprovante Digital baixado com sucesso!");
                    setShowComprovanteModal(false);
                  }}
                  className="px-4 py-1.5 rounded-md bg-success text-success-foreground font-bold hover:opacity-90 flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar Comprovante (PDF)
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusConferenciaBadge({ status }: { status: StatusConferencia }) {
  const map: Record<StatusConferencia, { label: string; cls: string }> = {
    pendente: { label: "⏳ Pendente", cls: "bg-muted text-muted-foreground border-border" },
    localizado: { label: "🟢 Localizado", cls: "bg-success/20 text-success border-success/40 font-bold" },
    nao_localizado: { label: "🔴 Não Localizado", cls: "bg-destructive/20 text-destructive border-destructive/40 font-bold" },
    avariado: { label: "⚠️ Avariado", cls: "bg-warning/20 text-warning border-warning/40 font-bold" },
    transferencia: { label: "🔄 Transferência", cls: "bg-accent/20 text-accent-foreground border-accent/40 font-bold" },
  };
  const item = map[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${item.cls}`}>{item.label}</span>;
}
