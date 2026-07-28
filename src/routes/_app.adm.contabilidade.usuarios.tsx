import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Search, Plus, ShieldCheck, Mail, Building, Key, Download, CheckCircle2, UserX } from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";

export const Route = createFileRoute("/_app/adm/contabilidade/usuarios")({
  head: () => ({
    meta: [
      { title: "Contabilidade / Usuários e Responsáveis — Patrimônio Inteligente" },
      { name: "description", content: "Gerenciamento de usuários contábeis e responsáveis por locais." },
    ],
  }),
  component: ContabilidadeUsuariosPage,
});

interface UsuarioContabil {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  perfil: "Administrador" | "Contador" | "Auditor" | "Responsável";
  status: "ATIVO" | "INATIVO";
  ultimoAcesso: string;
}

const INITIAL_USUARIOS: UsuarioContabil[] = [
  { id: "USR-001", nome: "Carlos Eduardo Silva", email: "carlos.silva@santana.sp.gov.br", cargo: "Contador Chefe", setor: "Contabilidade Geral", perfil: "Contador", status: "ATIVO", ultimoAcesso: "Hoje, 14:20" },
  { id: "USR-002", nome: "Mariana Alencar", email: "mariana.alencar@santana.sp.gov.br", cargo: "Analista de Patrimônio", setor: "Gestão Patrimonial", perfil: "Administrador", status: "ATIVO", ultimoAcesso: "Hoje, 11:45" },
  { id: "USR-003", nome: "Roberto Mendes", email: "roberto.mendes@santana.sp.gov.br", cargo: "Diretor de TI", setor: "Tecnologia da Informação", perfil: "Responsável", status: "ATIVO", ultimoAcesso: "Ontem, 16:30" },
  { id: "USR-004", nome: "Ana Paula Souza", email: "ana.souza@santana.sp.gov.br", cargo: "Auditora Interna", setor: "Controladoria", perfil: "Auditor", status: "ATIVO", ultimoAcesso: "25/07/2026" },
];

function ContabilidadeUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioContabil[]>(INITIAL_USUARIOS);
  const [search, setSearch] = useState("");
  const [perfilFilter, setPerfilFilter] = useState("");

  const filteredUsers = useMemo(() => {
    return usuarios.filter((u) => {
      if (search && !u.nome.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase()) && !u.setor.toLowerCase().includes(search.toLowerCase())) return false;
      if (perfilFilter && u.perfil !== perfilFilter) return false;
      return true;
    });
  }, [usuarios, search, perfilFilter]);

  const kpis = useMemo(
    () => [
      { label: "Total de Usuários Contábeis", value: String(usuarios.length), hint: "Perfis autorizados" },
      { label: "Usuários Ativos", value: String(usuarios.filter((u) => u.status === "ATIVO").length), hint: "Acesso regular" },
      { label: "Contadores / Auditores", value: String(usuarios.filter((u) => u.perfil === "Contador" || u.perfil === "Auditor").length), hint: "Escopo de lançamento" },
      { label: "Responsáveis por Setor", value: String(usuarios.filter((u) => u.perfil === "Responsável").length), hint: "Ateste e aceite" },
    ],
    [usuarios]
  );

  const toggleStatus = (id: string) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "ATIVO" ? "INATIVO" : "ATIVO" } : u))
    );
  };

  const exportCsv = () => {
    const headers = ["ID", "Nome", "Email", "Cargo", "Setor", "Perfil", "Status", "UltimoAcesso"];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];
    for (const u of filteredUsers) {
      lines.push([escape(u.id), escape(u.nome), escape(u.email), escape(u.cargo), escape(u.setor), escape(u.perfil), escape(u.status), escape(u.ultimoAcesso)].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios-contabilidade-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contabilidade — Cadastro de Usuários e Responsáveis"
        description="Gestão de acesso, concessão de perfis contábeis e atribuição de responsabilidades por unidade."
        crumbs={[{ label: "Painel", to: "/adm" }, { label: "Contabilidade" }, { label: "Usuários" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Modal para inclusão de novo usuário contábil...")}
              className="h-9 px-3 rounded-md bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Novo Usuário
            </button>
            <button
              onClick={exportCsv}
              className="h-9 px-3 rounded-md border border-input bg-background font-bold text-xs inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Exportar (CSV)
            </button>
          </div>
        }
      />

      <KPIGrid items={kpis} />

      <section className="glass-card p-4 border border-border/60">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou setor..."
              className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background/60 text-xs"
            />
          </div>

          <select
            value={perfilFilter}
            onChange={(e) => setPerfilFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background/60 px-3 text-xs font-semibold"
          >
            <option value="">Todos os perfis</option>
            <option value="Administrador">Administrador</option>
            <option value="Contador">Contador</option>
            <option value="Auditor">Auditor</option>
            <option value="Responsável">Responsável</option>
          </select>
        </div>
      </section>

      <section className="glass-card p-0 overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">ID / Código</th>
                <th className="p-3">Nome do Usuário</th>
                <th className="p-3">E-mail Corporativo</th>
                <th className="p-3">Setor / Lotação</th>
                <th className="p-3">Perfil de Acesso</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-accent/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{u.id}</td>
                  <td className="p-3 font-medium text-foreground">
                    <div>{u.nome}</div>
                    <div className="text-[10px] text-muted-foreground">{u.cargo}</div>
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">{u.email}</td>
                  <td className="p-3 text-foreground">{u.setor}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                      {u.perfil}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === "ATIVO" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggleStatus(u.id)}
                      className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-[11px] font-semibold"
                    >
                      {u.status === "ATIVO" ? "Inativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
