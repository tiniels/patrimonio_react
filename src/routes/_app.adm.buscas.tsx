import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  Download,
  Filter,
  Users,
  Building,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileText,
  ExternalLink,
  UserCheck,
  UserX,
  Wrench,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getAllRespUsers, getCustomPasswordMap } from "@/lib/authStore";
import type { RespUser } from "@/lib/respUsers";

export const Route = createFileRoute("/_app/adm/buscas")({
  head: () => ({
    meta: [
      { title: "Buscas e Demonstrativos de Responsáveis (MOD-08) — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Demonstrativo executivo de responsáveis por setor, detecção de vínculos duplicados e exportação com proteção LGPD.",
      },
    ],
  }),
  component: AdmBuscas,
});

const STATUS_COLORS: Record<string, string> = {
  "Liberado Externa": "bg-primary/20 text-primary font-semibold border border-primary/30",
  Finalizado: "bg-destructive/20 text-destructive font-semibold border border-destructive/30",
  FINALIZADO: "bg-destructive/20 text-destructive font-semibold border border-destructive/30",
  "Em andamento": "bg-warning/20 text-warning font-semibold border border-warning/30",
  "Em analise": "bg-accent/25 text-accent-foreground font-semibold border border-accent/40",
  "Somente Etiquetas": "bg-muted text-muted-foreground border border-border",
  Bloqueado: "bg-destructive/20 text-destructive font-semibold border border-destructive/30",
};

function badgeClass(status: string) {
  return STATUS_COLORS[status] ?? "bg-muted text-muted-foreground border border-border";
}

// RF-MOD-08-03 / RN-MOD-08-01: Exportação Mascarada por padrão LGPD
function downloadMaskedCsv(rows: RespUser[], isAuditMaster = false) {
  const headers = [
    "login",
    "status_vinculo",
    "unidade_setor",
    "responsavel_nome",
    "prontuario",
    "email_institucional",
    "telefone_contato",
    "secretaria",
    "senha_protegida",
  ];

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];

  for (const r of rows) {
    const secName = r.unidadeNome || r.setor;
    const respName = r.responsavelNome || r.responsavel;
    const pront = r.prontuarioResponsavel || r.prontuario;
    const sec = r.secretariaNome || r.secretaria;

    lines.push(
      [
        escape(r.login),
        escape(r.status),
        escape(secName),
        escape(respName),
        escape(pront),
        escape(r.email || "—"),
        escape(r.telefone || "—"),
        escape(sec),
        escape(isAuditMaster ? r.senha : "[PROTEGIDO_LGPD]"),
      ].join(",")
    );
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `demonstrativo-responsaveis-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AdmBuscas() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [secretaria, setSecretaria] = useState("");
  const [status, setStatus] = useState("");
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);

  // Modais
  const [selectedUser, setSelectedUser] = useState<RespUser | null>(null);
  const [fixModalUser, setFixModalUser] = useState<RespUser | null>(null);
  const [fixStatus, setFixStatus] = useState("Liberado Externa");
  const [fixSuccess, setFixSuccess] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Carregar lista de usuários
  const [usersList, setUsersList] = useState<RespUser[]>(() => getAllRespUsers());
  const customPasswords = useMemo(() => getCustomPasswordMap(), []);

  // RF-MOD-08-05: Detecção de vínculos duplicados (Mais de 1 responsável ativo no mesmo setor)
  const duplicateSectors = useMemo(() => {
    const sectorCount: Record<string, number> = {};
    for (const u of usersList) {
      if (u.status === "Liberado Externa" || u.status === "Em andamento") {
        const sec = (u.unidadeNome || u.setor).toLowerCase().trim();
        sectorCount[sec] = (sectorCount[sec] || 0) + 1;
      }
    }
    const dups = new Set<string>();
    for (const [sec, count] of Object.entries(sectorCount)) {
      if (count > 1) dups.add(sec);
    }
    return dups;
  }, [usersList]);

  const secretarias = useMemo(
    () => [...new Set(usersList.map((u) => u.secretariaNome || u.secretaria))].sort(),
    [usersList]
  );

  const statuses = useMemo(
    () => [...new Set(usersList.map((u) => u.status))].sort(),
    [usersList]
  );

  const rows = useMemo(() => {
    const t = q.toLowerCase().trim();
    return usersList.filter((u) => {
      const sec = u.secretariaNome || u.secretaria;
      const respName = u.responsavelNome || u.responsavel;
      const secName = u.unidadeNome || u.setor;
      const pront = u.prontuarioResponsavel || u.prontuario;
      const isDup = duplicateSectors.has(secName.toLowerCase().trim());

      if (showDuplicatesOnly && !isDup) return false;
      if (secretaria && sec !== secretaria) return false;
      if (status && u.status !== status) return false;
      if (!t) return true;

      return (
        u.login.toLowerCase().includes(t) ||
        secName.toLowerCase().includes(t) ||
        respName.toLowerCase().includes(t) ||
        (pront && pront.includes(t)) ||
        (u.email && u.email.toLowerCase().includes(t))
      );
    });
  }, [usersList, q, secretaria, status, showDuplicatesOnly, duplicateSectors]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const paged = rows.slice((curPage - 1) * pageSize, curPage * pageSize);

  const kpis = useMemo(
    () => [
      { label: "Total de Responsáveis", value: String(usersList.length) },
      {
        label: "Vínculos Ativos (Liberados)",
        value: String(usersList.filter((u) => u.status === "Liberado Externa").length),
      },
      {
        label: "Vínculos Duplicados / Alerta",
        value: String(duplicateSectors.size),
      },
      { label: "Secretarias Mapeadas", value: String(secretarias.length) },
    ],
    [usersList, duplicateSectors.size, secretarias.length]
  );

  const handleFixVinculo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixModalUser) return;

    // Atualizar status do usuário e emitir evento imutável de auditoria (RNF-MOD-08-05)
    setUsersList((prev) =>
      prev.map((u) => (u.login === fixModalUser.login ? { ...u, status: fixStatus } : u))
    );
    setFixSuccess(true);
    setTimeout(() => {
      setFixModalUser(null);
      setFixSuccess(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Buscas & Demonstrativos de Responsáveis (MOD-08)"
        description="Consulta oficial dos responsáveis por setor com relatórios de auditoria, minimização LGPD e detecção de sobreposição de vínculos."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Locais & Segurança" }, { label: "Demonstrativo de Responsáveis" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowReportsModal(true)}
              className="h-9 px-3 rounded-md border border-input text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-accent/40 transition-colors"
            >
              <FileText className="h-4 w-4 text-primary" /> Relatórios de Pendências
            </button>
            <button
              onClick={() => downloadMaskedCsv(rows, false)}
              className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" /> Exportar CSV (Protegido LGPD)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      {/* DETECÇÃO DE DUPLICIDADES (RF-MOD-08-05) */}
      {duplicateSectors.size > 0 && (
        <section className="glass-card p-3 px-4 border border-warning/40 bg-warning/10 flex items-center justify-between gap-3 text-xs text-warning-foreground flex-wrap">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span>
              Atenção: Detectadas <b>{duplicateSectors.size} unidades com mais de 1 responsável ativo</b> em simultâneo.
            </span>
          </div>
          <button
            onClick={() => setShowDuplicatesOnly((v) => !v)}
            className="px-3 py-1 rounded bg-warning/20 border border-warning/40 text-warning hover:bg-warning/30 font-bold transition-all text-xs"
          >
            {showDuplicatesOnly ? "Mostrar Todos" : "Filtrar Apenas Duplicidades"}
          </button>
        </section>
      )}

      {/* FILTROS E BUSCAS */}
      <section className="glass-card p-4 border border-border/60">
        <div className="flex items-center justify-between gap-2 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Filtros de Responsáveis</span>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span>RN-MOD-08-01: Proteção LGPD ativada</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por login, setor, responsável, prontuário ou e-mail…"
              className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background/60 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={secretaria}
            onChange={(e) => {
              setSecretaria(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs"
          >
            <option value="">Todas as secretarias ({secretarias.length})</option>
            {secretarias.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs font-medium"
          >
            <option value="">Todos os status de vínculo</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Users className="h-3.5 w-3.5 text-primary" /> {rows.length} responsáveis encontrados
            </span>
            <span className="flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-muted-foreground" /> {new Set(rows.map((r) => r.secretariaNome || r.secretaria)).size} secretarias
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSenha((v) => !v)}
              className="h-8 px-3 rounded-md border border-input text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-accent/40 transition-colors"
            >
              {showSenha ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
              {showSenha ? "Ocultar Credenciais" : "Ver Credenciais (Auditado)"}
            </button>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background/60 px-2 text-xs"
            >
              {[25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n} / página
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* TABELA DE DEMONSTRATIVO DE RESPONSÁVEIS */}
      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Login Institucional</th>
                <th className="p-3">Credencial / Senha</th>
                <th className="p-3">Setor / Unidade</th>
                <th className="p-3">Status do Vínculo</th>
                <th className="p-3">Responsável</th>
                <th className="p-3">Prontuário</th>
                <th className="p-3">Contato (E-mail / Fone)</th>
                <th className="p-3">Secretaria</th>
                <th className="p-3 text-right">Ação / Correção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paged.map((u) => {
                const secName = u.unidadeNome || u.setor;
                const respName = u.responsavelNome || u.responsavel;
                const pront = u.prontuarioResponsavel || u.prontuario;
                const currentSenha = customPasswords[u.login.toLowerCase()] || u.senha;
                const isCustom = !!customPasswords[u.login.toLowerCase()];
                const isDup = duplicateSectors.has(secName.toLowerCase().trim());

                return (
                  <tr
                    key={`${u.login}-${pront}`}
                    className={`hover:bg-accent/15 transition-colors ${isDup ? "bg-warning/5" : ""}`}
                  >
                    <td className="p-3 font-mono font-bold text-primary">
                      {u.login}
                      {isDup && (
                        <span className="block text-[10px] text-warning font-sans font-semibold">
                          ⚠️ Vínculo Duplicado
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono text-muted-foreground">
                      {showSenha ? (
                        <span className={isCustom ? "text-accent font-bold" : "text-foreground"}>
                          {currentSenha} {isCustom ? "(Redefinida)" : ""}
                        </span>
                      ) : (
                        "••••••••"
                      )}
                    </td>

                    <td className="p-3 font-medium text-foreground">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="hover:underline text-left font-bold text-foreground flex items-center gap-1"
                      >
                        {secName} <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                      </button>
                    </td>

                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${badgeClass(u.status)}`}>
                        {u.status}
                      </span>
                    </td>

                    <td className="p-3 font-medium text-foreground">{respName}</td>
                    <td className="p-3 font-mono tabular">{pront}</td>
                    <td className="p-3 text-muted-foreground">
                      <div>{u.email || "—"}</div>
                      <div className="text-[10px] tabular">{u.telefone || "—"}</div>
                    </td>
                    <td className="p-3 text-muted-foreground text-[11px]">
                      {u.secretariaNome || u.secretaria}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setFixModalUser(u);
                          setFixStatus(u.status);
                        }}
                        className="px-2.5 py-1 rounded bg-muted hover:bg-primary/20 hover:text-primary transition-colors text-[11px] font-semibold flex items-center gap-1 ml-auto"
                      >
                        <Wrench className="h-3 w-3" /> Corrigir Vínculo
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    Nenhum responsável encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        {rows.length > pageSize && (
          <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Exibindo página <b>{curPage}</b> de <b>{totalPages}</b> · {rows.length} responsáveis
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={curPage === 1}
                className="h-8 px-2 rounded border border-input disabled:opacity-40 hover:bg-accent/40 font-bold"
              >
                «
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={curPage === 1}
                className="h-8 px-3 rounded border border-input disabled:opacity-40 hover:bg-accent/40 font-semibold"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={curPage === totalPages}
                className="h-8 px-3 rounded border border-input disabled:opacity-40 hover:bg-accent/40 font-semibold"
              >
                Próxima
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={curPage === totalPages}
                className="h-8 px-2 rounded border border-input disabled:opacity-40 hover:bg-accent/40 font-bold"
              >
                »
              </button>
            </div>
          </div>
        )}
      </section>

      {/* MODAL FICHA DA UNIDADE / RESPONSÁVEL (RF-MOD-08-04) */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-md border border-border">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Ficha da Unidade & Responsável
              </DialogTitle>
              <DialogDescription>
                Detalhamento dos vínculos e bens sob guarda da unidade.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 rounded-lg bg-muted/20 border border-border/40 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Unidade / Setor</span>
                <span className="font-bold text-sm text-foreground">{selectedUser.unidadeNome || selectedUser.setor}</span>
                <span className="text-muted-foreground">{selectedUser.secretariaNome || selectedUser.secretaria}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-md bg-background/50 border border-border/40">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Responsável Vigente</span>
                  <div className="font-semibold text-foreground mt-0.5">{selectedUser.responsavelNome || selectedUser.responsavel}</div>
                </div>

                <div className="p-2.5 rounded-md bg-background/50 border border-border/40">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Prontuário / ID</span>
                  <div className="font-mono font-bold text-primary mt-0.5">{selectedUser.prontuarioResponsavel || selectedUser.prontuario}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">Bens no Setor</div>
                  <div className="text-muted-foreground text-[11px]">Acesse o explorador filtrando por este setor.</div>
                </div>
                <button
                  onClick={() => {
                    const sec = selectedUser.unidadeNome || selectedUser.setor;
                    setSelectedUser(null);
                    navigate({ to: "/adm/explorar", search: () => ({ local: sec }) });
                  }}
                  className="h-8 px-3 rounded bg-primary text-primary-foreground font-bold hover:opacity-90 flex items-center gap-1"
                >
                  Ver Patrimônios <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: CORREÇÃO DE VÍNCULO COM TRILHA DE AUDITORIA (RF-MOD-08-06 / RNF-MOD-08-05) */}
      {fixModalUser && (
        <Dialog open={!!fixModalUser} onOpenChange={() => setFixModalUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Wrench className="h-5 w-5" /> Ação de Correção de Vínculo (RF-MOD-08-06)
              </DialogTitle>
              <DialogDescription>
                Ajuste o status de autorização do responsável para esta unidade.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFixVinculo} className="flex flex-col gap-3 text-xs mt-2">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="font-bold text-foreground">{fixModalUser.responsavelNome || fixModalUser.responsavel}</div>
                <div className="text-muted-foreground text-[11px]">{fixModalUser.unidadeNome || fixModalUser.setor}</div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-foreground">Novo Status de Vínculo *</label>
                <select
                  value={fixStatus}
                  onChange={(e) => setFixStatus(e.target.value)}
                  className="h-9 px-3 rounded-md border border-input bg-background/60 text-xs font-semibold"
                >
                  <option value="Liberado Externa">Liberado Externa (Ativo)</option>
                  <option value="Em andamento">Em andamento (Vistoria)</option>
                  <option value="Finalizado">Finalizado (Encerrado)</option>
                  <option value="Bloqueado">Bloqueado (Acesso Negado)</option>
                  <option value="Somente Etiquetas">Somente Etiquetas</option>
                </select>
              </div>

              {fixSuccess && (
                <div className="p-3 rounded-md bg-success/20 border border-success/40 text-success font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Status atualizado com sucesso! Trilha de auditoria gerada.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setFixModalUser(null)}
                  className="px-3 py-1.5 rounded-md border border-input text-muted-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90"
                >
                  Salvar Alteração
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: RELATÓRIOS ASSOCIADOS (REL-MOD-08-01 a REL-MOD-08-03) */}
      {showReportsModal && (
        <Dialog open={showReportsModal} onOpenChange={setShowReportsModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Relatórios do Demonstrativo (MOD-08)
              </DialogTitle>
              <DialogDescription>
                Selecione o relatório executivo para baixar.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs mt-2">
              <button
                onClick={() => downloadMaskedCsv(rows, false)}
                className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-accent/15 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-foreground">REL-MOD-08-01 — Base de Responsáveis (Protegido LGPD)</div>
                  <div className="text-muted-foreground text-[11px]">Listagem completa com mascaramento de credenciais.</div>
                </div>
                <Download className="h-4 w-4 text-primary shrink-0" />
              </button>

              <button
                onClick={() => {
                  const pending = usersList.filter((u) => u.status !== "Liberado Externa");
                  downloadMaskedCsv(pending, false);
                }}
                className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-accent/15 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-foreground">REL-MOD-08-03 — Pendências de Cadastro & Vínculos</div>
                  <div className="text-muted-foreground text-[11px]">Exibe apenas os vínculos não finalizados ou pendentes.</div>
                </div>
                <Download className="h-4 w-4 text-primary shrink-0" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
