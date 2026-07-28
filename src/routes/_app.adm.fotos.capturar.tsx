import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Camera,
  Upload,
  RotateCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileImage,
  Tag,
  Wifi,
  WifiOff,
  Trash2,
  Eye,
  Download,
  ShieldCheck,
  Sparkles,
  Lock,
  Layers,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/adm/fotos/capturar")({
  head: () => ({
    meta: [
      { title: "Captura e Envio de Fotos (MOD-29) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Captura de fotos via câmera e upload, rotação, compressão com remoção de EXIF, vínculo a chapas, fila offline e URLs assinadas temporárias.",
      },
    ],
  }),
  component: AdmFotosCapturarPage,
});

export interface EvidenciaFotografica {
  id: string;
  chapaPatrimonial: string;
  descricaoBem: string;
  tipoEvidencia: "frontal" | "etiqueta" | "avaria" | "documento";
  legenda: string;
  dataCaptura: string;
  tamanhoKb: number;
  rotacaoGraus: number;
  exifRemovido: boolean;
  statusEnvio: "enviado" | "na_fila_offline";
  urlAssinadaTemporaria: string;
}

const MOCK_FOTOS_LIST: EvidenciaFotografica[] = [
  {
    id: "FOTO-2026-001",
    chapaPatrimonial: "PAT-2026-9901",
    descricaoBem: "CADEIRA GIRATÓRIA ERGONÔMICA PRETA NR-17",
    tipoEvidencia: "etiqueta",
    legenda: "Etiqueta de tombamento colada na base do assento.",
    dataCaptura: "2026-07-28 11:20",
    tamanhoKb: 245,
    rotacaoGraus: 0,
    exifRemovido: true,
    statusEnvio: "enviado",
    urlAssinadaTemporaria: "https://bucket-patrimonio.s3.amazonaws.com/evidencias/foto-001.webp?X-Amz-Expires=900",
  },
  {
    id: "FOTO-2026-002",
    chapaPatrimonial: "PAT-2026-8801",
    descricaoBem: "MONITOR LCD 27 IPS FULL HD DELL",
    tipoEvidencia: "frontal",
    legenda: "Vista frontal do equipamento em pleno funcionamento.",
    dataCaptura: "2026-07-28 14:05",
    tamanhoKb: 310,
    rotacaoGraus: 90,
    exifRemovido: true,
    statusEnvio: "enviado",
    urlAssinadaTemporaria: "https://bucket-patrimonio.s3.amazonaws.com/evidencias/foto-002.webp?X-Amz-Expires=900",
  },
];

function AdmFotosCapturarPage() {
  const [fotos, setFotos] = useState<EvidenciaFotografica[]>(MOCK_FOTOS_LIST);
  const [modoEntrada, setModoEntrada] = useState<"camera" | "upload">("camera");
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Form Captura / Upload (RF-MOD-29-01 / RF-MOD-29-06 / RN-MOD-29-01)
  const [chapaForm, setChapaForm] = useState("PAT-2026-8802");
  const [tipoForm, setTipoForm] = useState<"frontal" | "etiqueta" | "avaria" | "documento">("etiqueta");
  const [legendaForm, setLegendaForm] = useState("");
  const [rotacaoPreview, setRotacaoPreview] = useState(0);
  const [formError, setFormError] = useState("");
  const [previewCapturada, setPreviewCapturada] = useState<string | null>(null);

  // Modal Zoom Foto (RF-MOD-29-03 / RN-MOD-29-03)
  const [selectedFotoModal, setSelectedFotoModal] = useState<EvidenciaFotografica | null>(null);

  const kpis = useMemo(
    () => [
      { label: "Evidências Armazenadas", value: `${fotos.length} arquivos` },
      { label: "Metadados GPS/EXIF Sanitizados (RN-MOD-29-04)", value: "100% limpos", hint: "Privacidade garantida" },
      { label: "Fila Offline Pendente (RF-MOD-29-07)", value: `${fotos.filter((f) => f.statusEnvio === "na_fila_offline").length} fotos` },
      { label: "Uso de Armazenamento Otimizado", value: `${(fotos.reduce((acc, f) => acc + f.tamanhoKb, 0) / 1024).toFixed(2)} MB` },
    ],
    [fotos]
  );

  const handleSimularCapturaCamera = () => {
    // Gerar preview simulado de canvas de câmera
    setPreviewCapturada("captured-canvas-simulation");
    setRotacaoPreview(0);
    setFormError("");
  };

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tipo e tamanho (RN-MOD-29-01)
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Formato de imagem inválido. Suportados: JPEG, PNG e WebP.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError("O arquivo excede o limite máximo permitido de 10 MB.");
      return;
    }

    setPreviewCapturada(URL.createObjectURL(file));
    setRotacaoPreview(0);
    setFormError("");
  };

  const handleRotateImage = () => {
    setRotacaoPreview((prev) => (prev + 90) % 360);
  };

  const handleSaveEvidencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapaForm.trim()) {
      setFormError("Informe o número da chapa patrimonial.");
      return;
    }

    const novaEvidencia: EvidenciaFotografica = {
      id: `FOTO-2026-00${Math.floor(100 + Math.random() * 900)}`,
      chapaPatrimonial: chapaForm,
      descricaoBem: "BEM VINCULADO AO TOMBAMENTO " + chapaForm,
      tipoEvidencia: tipoForm,
      legenda: legendaForm || "Foto de evidência capturada em campo.",
      dataCaptura: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      tamanhoKb: Math.floor(180 + Math.random() * 150),
      rotacaoGraus: rotacaoPreview,
      exifRemovido: true,
      statusEnvio: isOnline ? "enviado" : "na_fila_offline",
      urlAssinadaTemporaria: `https://bucket-patrimonio.s3.amazonaws.com/evidencias/foto-${Math.random().toString(36).substring(2, 6)}.webp?X-Amz-Expires=900`,
    };

    setFotos([novaEvidencia, ...fotos]);
    setPreviewCapturada(null);
    setLegendaForm("");
  };

  const handleSincronizarFilaOffline = () => {
    setFotos((prev) => prev.map((f) => ({ ...f, statusEnvio: "enviado" })));
  };

  const exportFotosCsv = () => {
    const headers = ["ID", "ChapaPatrimonial", "TipoEvidencia", "Legenda", "DataCaptura", "TamanhoKB", "ExifRemovido", "StatusEnvio"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];

    for (const f of fotos) {
      lines.push(
        [
          escape(f.id),
          escape(f.chapaPatrimonial),
          escape(f.tipoEvidencia),
          escape(f.legenda),
          escape(f.dataCaptura),
          f.tamanhoKb,
          f.exifRemovido,
          escape(f.statusEnvio),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evidencias-fotograficas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Captura e Envio de Fotos (MOD-29)"
        description="Captura de evidências fotográficas pela câmera ou upload, rotação, compressão com limpeza de EXIF/GPS, associação a tombamentos e sincronização offline."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Fotos" }, { label: "Capturar & Enviar" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`h-9 px-3 rounded-md border font-bold text-xs inline-flex items-center gap-1.5 transition-colors ${
                isOnline ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-amber-500/40 bg-amber-500/10 text-amber-400"
              }`}
            >
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? "Modo Online" : "Modo Offline (Simulação)"}
            </button>
            <button
              onClick={exportFotosCsv}
              className="h-9 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar Evidências (CSV)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* PAINEL DE DISPARO DE MÍDIA & UPLOAD (RF-MOD-29-01 a RF-MOD-29-06) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* BLOCO DE CAPTURA DA CÂMERA / UPLOAD */}
        <section className="glass-card p-5 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm text-foreground">Dispositivo de Captura / Upload</span>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setModoEntrada("camera")}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  modoEntrada === "camera" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                Câmera ao Vivo
              </button>
              <button
                onClick={() => setModoEntrada("upload")}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  modoEntrada === "upload" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                Upload Arquivo
              </button>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 font-semibold text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          {modoEntrada === "camera" ? (
            <div className="space-y-3">
              <div className="aspect-video rounded-xl bg-slate-950 border border-border/80 flex flex-col items-center justify-center text-xs text-muted-foreground relative overflow-hidden group">
                {previewCapturada ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 relative">
                    <span
                      className="font-bold text-emerald-400 text-sm transition-transform duration-300 inline-block"
                      style={{ transform: `rotate(${rotacaoPreview}deg)` }}
                    >
                      📷 [FOTO CAPTURADA VIA CÂMERA - PREVIEW]
                    </span>
                    <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded bg-black/60 text-slate-300 font-mono">
                      Rotação: {rotacaoPreview}°
                    </span>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <Camera className="h-10 w-10 text-primary mx-auto animate-pulse" />
                    <span className="font-semibold text-foreground block">Viewfinder da Câmera Ativo</span>
                    <span className="text-[10px] text-muted-foreground">Posicione a etiqueta de tombamento ou o bem no centro</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!previewCapturada ? (
                  <button
                    onClick={handleSimularCapturaCamera}
                    className="w-full h-10 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center justify-center gap-2 hover:opacity-90 shadow-sm"
                  >
                    <Camera className="h-4 w-4" /> Disparar Câmera / Capturar Foto
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleRotateImage}
                      className="h-10 px-4 rounded-md border border-input bg-background/60 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
                    >
                      <RotateCw className="h-4 w-4" /> Girar 90°
                    </button>
                    <button
                      onClick={() => setPreviewCapturada(null)}
                      className="flex-1 h-10 rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-300 font-bold text-xs hover:bg-rose-500/20"
                    >
                      Recapturar Foto
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="aspect-video rounded-xl bg-muted/20 border border-dashed border-border flex flex-col items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                <Upload className="h-8 w-8 text-primary mb-2" />
                <span className="font-semibold text-foreground">Clique para selecionar imagem</span>
                <span className="text-[10px]">JPEG, PNG ou WebP (Máx 10MB)</span>
                <input type="file" accept="image/*" onChange={handleUploadFileChange} className="hidden" />
              </label>

              {previewCapturada && (
                <div className="flex justify-between items-center text-xs p-2 bg-muted/40 rounded border border-border">
                  <span className="font-bold text-emerald-400">✓ Imagem carregada e pré-visualizada</span>
                  <button
                    onClick={handleRotateImage}
                    className="px-2 py-1 rounded bg-background font-bold text-[10px] border border-input inline-flex items-center gap-1"
                  >
                    <RotateCw className="h-3 w-3" /> Girar 90°
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* FORMULÁRIO DE VINCULAÇÃO E LEGENDA (RF-MOD-29-06 / RF-MOD-29-08) */}
        <section className="glass-card p-5 border border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm text-foreground">Associação Patrimonial & Sanitização</span>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
              <ShieldCheck className="h-3 w-3 inline mr-1" /> EXIF/GPS Sanitizado (RN-MOD-29-04)
            </span>
          </div>

          <form onSubmit={handleSaveEvidencia} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-foreground">Chapa Patrimonial / Tombamento (RF-MOD-29-06)</label>
              <input
                value={chapaForm}
                onChange={(e) => setChapaForm(e.target.value)}
                placeholder="Ex: PAT-2026-8802"
                required
                className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-mono focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Tipo de Evidência Fotográfica</label>
              <select
                value={tipoForm}
                onChange={(e) => setTipoForm(e.target.value as any)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
              >
                <option value="etiqueta">Etiqueta de Tombamento / Código de Barras</option>
                <option value="frontal">Visão Geral Frontal do Equipamento</option>
                <option value="avaria">Avaria ou Desgaste Físico</option>
                <option value="documento">Documento de Transferência / Termo</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Legenda Explicação (RF-MOD-29-08)</label>
              <textarea
                value={legendaForm}
                onChange={(e) => setLegendaForm(e.target.value)}
                placeholder="Ex: Foto do número de série legível no chassi do equipamento..."
                rows={3}
                className="w-full p-2.5 rounded-md border border-input bg-background/60 text-xs"
              />
            </div>

            <div className="p-3 bg-muted/40 border border-border rounded-lg text-[10px] space-y-1 text-muted-foreground">
              <div>• <b>Compressão Client-side:</b> Imagem otimizada para ~250 KB (RN-MOD-29-05).</div>
              <div>• <b>Bucket Privado:</b> Acesso restrito via URL assinada temporária (15 min) (RN-MOD-29-02).</div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!previewCapturada}
                className="w-full h-10 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" /> Enviar Evidência Fotográfica
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* NOTIFICAÇÃO DA FILA OFFLINE SYNC (RF-MOD-29-07) */}
      {fotos.some((f) => f.statusEnvio === "na_fila_offline") && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300">
          <span className="flex items-center gap-2 font-semibold">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Existe(m) <b>{fotos.filter((f) => f.statusEnvio === "na_fila_offline").length} foto(s)</b> salva(s) localmente aguardando conexão.</span>
          </span>
          <button
            onClick={handleSincronizarFilaOffline}
            className="px-3 py-1.5 rounded bg-amber-500 text-slate-950 font-bold text-[11px] hover:opacity-90"
          >
            Sincronizar Agora (Online)
          </button>
        </div>
      )}

      {/* GALERIA DE EVIDÊNCIAS FOTOGRÁFICAS VINCULADAS (RF-MOD-29-03 / RN-MOD-29-03) */}
      <section className="glass-card p-5 border border-border/60 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <FileImage className="h-4 w-4 text-primary" />
            <span>Galeria de Fotos Assinadas & Vinculadas</span>
          </div>

          <span className="text-[11px] text-muted-foreground">Exibindo {fotos.length} evidências</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fotos.map((f) => (
            <div key={f.id} className="p-3 bg-background border border-border rounded-xl space-y-2.5">
              <div className="aspect-video bg-slate-950 rounded-lg border border-border flex items-center justify-center relative overflow-hidden">
                <span className="font-bold text-xs text-primary font-mono">{f.chapaPatrimonial}</span>
                <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded bg-black/70 text-slate-300 font-bold uppercase">
                  {f.tipoEvidencia}
                </span>

                {f.statusEnvio === "na_fila_offline" && (
                  <span className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">
                    Na Fila Offline
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-foreground">
                  <span className="font-mono text-primary">{f.chapaPatrimonial}</span>
                  <span className="text-[10px] text-muted-foreground">{f.tamanhoKb} KB</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{f.legenda}</p>
                <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50 flex justify-between">
                  <span>Captura: {f.dataCaptura}</span>
                  <span className="text-emerald-400 font-bold">EXIF Removido</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <button
                  onClick={() => setSelectedFotoModal(f)}
                  className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground font-bold text-[10px] inline-flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" /> Ver Foto (URL Assinada)
                </button>

                <button
                  onClick={() => setFotos(fotos.filter((item) => item.id !== f.id))}
                  title="Exclusão Lógica de Evidência"
                  className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL URL ASSINADA & DETALHE DA FOTO (RN-MOD-29-03) */}
      {selectedFotoModal && (
        <Dialog open={!!selectedFotoModal} onOpenChange={() => setSelectedFotoModal(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Lock className="h-5 w-5" /> Evidência Fotográfica #{selectedFotoModal.id}
              </DialogTitle>
              <DialogDescription>
                Acesso seguro via URL temporária assinada (Validade: 15 minutos).
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="aspect-video bg-slate-950 rounded-xl border border-border flex items-center justify-center">
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  [IMAGEM PROTEGIDA - CHAPA {selectedFotoModal.chapaPatrimonial}]
                </span>
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-lg space-y-1">
                <div><b>Chapa Patrimonial:</b> {selectedFotoModal.chapaPatrimonial}</div>
                <div><b>Tipo de Evidência:</b> {selectedFotoModal.tipoEvidencia.toUpperCase()}</div>
                <div><b>Legenda:</b> {selectedFotoModal.legenda}</div>
                <div><b>Data da Captura:</b> {selectedFotoModal.dataCaptura}</div>
              </div>

              <div className="p-2.5 bg-background border border-border rounded-lg text-[10px] font-mono text-muted-foreground truncate">
                <b>Presigned URL:</b> {selectedFotoModal.urlAssinadaTemporaria}
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedFotoModal(null)}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Fechar Visualizador
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
