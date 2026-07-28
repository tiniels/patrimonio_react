import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  UserPlus,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  UserX,
} from "lucide-react";
import { PageHeader, KPIGrid } from "@/components/PageStub";
import { addDynamicUser, getAllRespUsers } from "@/lib/authStore";
import type { RespUser } from "@/lib/respUsers";

export const Route = createFileRoute("/_app/adm/locais/cadastro-usuarios")({
  head: () => ({
    meta: [
      { title: "Cadastro & Gestão de Usuários — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Gestão de usuários, perfis, escopos e cadastro automatizado de responsáveis de setor.",
      },
    ],
  }),
  component: CadastroUsuarios,
});

function CadastroUsuarios() {
  const [responsavelNome, setResponsavelNome] = useState("");
  const [prontuario, setProntuario] = useState("");
  const [cargo, setCargo] = useState("Responsável Patrimonial");
  const [secretaria, setSecretaria] = useState("Secretaria de Finanças e Patrimônio");
  const [setor, setSetor] = useState("");
  const [unidadeCodigo, setUnidadeCodigo] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("(11) 4622-7500");
  const [papel, setPapel] = useState<"Titular" | "Substituto" | "Auditor">("Titular");
  const [status, setStatus] = useState("Liberado Externa");

  const [qSearch, setQSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Geração Automática do Login (RF-MOD-04-02): PrimeiroNome.Prontuario
  const generatedLogin = useMemo(() => {
    const firstName = responsavelNome.trim().split(" ")[0] || "responsavel";
    const cleanName = firstName.replace(/[^a-zA-Z0-9]/g, "");
    const cleanProntuario = prontuario.trim().replace(/[^a-zA-Z0-9]/g, "") || "00000";
    return `${cleanName}.${cleanProntuario}`;
  }, [responsavelNome, prontuario]);

  // Geração Automática da Senha Temporária
  const generatedSenha = useMemo(() => {
    const cleanProntuario = prontuario.trim().replace(/[^a-zA-Z0-9]/g, "");
    return cleanProntuario ? cleanProntuario : "123456";
  }, [prontuario]);

  const allUsers = useMemo(() => {
    return getAllRespUsers();
  }, [refreshKey]);

  const filteredUsers = useMemo(() => {
    const t = qSearch.toLowerCase().trim();
    if (!t) return allUsers;
    return allUsers.filter(
      (u) =>
        u.login.toLowerCase().includes(t) ||
        (u.responsavelNome && u.responsavelNome.toLowerCase().includes(t)) ||
        (u.unidadeNome && u.unidadeNome.toLowerCase().includes(t)) ||
        (u.secretariaNome && u.secretariaNome.toLowerCase().includes(t)) ||
        (u.prontuarioResponsavel && u.prontuarioResponsavel.includes(t))
    );
  }, [allUsers, qSearch]);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!responsavelNome.trim()) {
      setErrorMsg("Informe o nome do responsável.");
      return;
    }
    if (!prontuario.trim()) {
      setErrorMsg("Informe o prontuário funcional.");
      return;
    }
    if (!setor.trim()) {
      setErrorMsg("Informe o nome da unidade ou setor.");
      return;
    }

    const code = unidadeCodigo.trim() || `SEC-${Math.floor(100 + Math.random() * 900)}`;

    const newUser: RespUser = {
      login: generatedLogin,
      senha: generatedSenha,
      responsavelNome: responsavelNome.trim(),
      prontuarioResponsavel: prontuario.trim(),
      cargoResponsavel: cargo.trim(),
      secretariaNome: secretaria.trim(),
      unidadeNome: setor.trim(),
      unidadeCodigo: code,
      email: email.trim() || `${generatedLogin.toLowerCase()}@santanadeparnaiba.sp.gov.br`,
      telefone: telefone.trim(),
      status: status,

      // Retrocompatibilidade
      responsavel: responsavelNome.trim(),
      setor: setor.trim(),
      prontuario: prontuario.trim(),
      secretaria: secretaria.trim(),
    };

    addDynamicUser(newUser);
    setRefreshKey((prev) => prev + 1);

    setSuccessMsg(`Usuário '${generatedLogin}' cadastrado com sucesso! Login liberado para acesso.`);

    // Limpar formulário
    setResponsavelNome("");
    setProntuario("");
    setSetor("");
    setUnidadeCodigo("");
    setEmail("");
  };

  const kpis = [
    { label: "Total de Responsáveis", value: String(allUsers.length) },
    {
      label: "Vínculos Ativos",
      value: String(allUsers.filter((u) => u.status === "Liberado Externa").length),
    },
    {
      label: "Vínculos Inativos/Encerrados",
      value: String(
        allUsers.filter((u) => u.status.toUpperCase() === "FINALIZADO" || u.status === "Bloqueado").length
      ),
    },
    {
      label: "Secretarias Atendidas",
      value: String(new Set(allUsers.map((u) => u.secretariaNome || u.secretaria)).size),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cadastro & Gestão de Usuários (MOD-04)"
        description="Gestão de identidades, vinculação de papéis, atribuição de escopo e geração de credenciais."
        crumbs={[
          { label: "Painel", to: "/adm" },
          { label: "Locais & Segurança" },
          { label: "Cadastro de Usuários" },
        ]}
      />

      <KPIGrid items={kpis} />

      {/* SEÇÃO 1: FORMULÁRIO DE CADASTRO AUTOMATIZADO DE USUÁRIO */}
      <section className="glass-card p-6 border border-border/60">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
          <UserPlus className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-bold text-foreground">Novo Cadastramento de Responsável</h2>
            <p className="text-xs text-muted-foreground">
              Preencha os dados do servidor para gerar a credencial automática de acesso ao setor.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveUser} className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Responsável */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-foreground">Nome Completo do Responsável *</label>
              <input
                required
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                placeholder="Ex: Carlos Eduardo de Oliveira"
                className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Prontuário */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-foreground">Prontuário Funcional *</label>
              <input
                required
                value={prontuario}
                onChange={(e) => setProntuario(e.target.value)}
                placeholder="Ex: 48921"
                className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Cargo */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-foreground">Cargo / Função</label>
              <input
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Diretor de Unidade"
                className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Unidade / Setor */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-foreground">Nome do Setor / Unidade *</label>
              <input
                required
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Ex: EMEF Aldeia de Barueri"
                className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Código da Unidade */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-foreground">Código do Local (Setor)</label>
              <input
                value={unidadeCodigo}
                onChange={(e) => setUnidadeCodigo(e.target.value)}
                placeholder="Ex: SEC-104 (Auto se vazio)"
                className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Secretaria */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-foreground">Secretaria Pertencente</label>
              <select
                value={secretaria}
                onChange={(e) => setSecretaria(e.target.value)}
                className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm"
              >
                <option value="Secretaria de Finanças e Patrimônio">Secretaria de Finanças e Patrimônio</option>
                <option value="Secretaria de Educação">Secretaria de Educação</option>
                <option value="Secretaria de Saúde">Secretaria de Saúde</option>
                <option value="Secretaria de Serviços Municipais">Secretaria de Serviços Municipais</option>
                <option value="Secretaria de Tecnologia e Gestão">Secretaria de Tecnologia e Gestão</option>
                <option value="Gabinete do Prefeito">Gabinete do Prefeito</option>
              </select>
            </div>

            {/* E-mail */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-foreground">E-mail Institucional</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: c.oliveira@santanadeparnaiba.sp.gov.br"
                className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm"
              />
            </div>

            {/* Papel / Função no Sistema */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-foreground">Papel Atribuído (RN-MOD-04-04)</label>
              <select
                value={papel}
                onChange={(e) => setPapel(e.target.value as any)}
                className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm font-medium"
              >
                <option value="Titular">Responsável Titular</option>
                <option value="Substituto">Substituto Vigente</option>
                <option value="Auditor">Auditor Local</option>
              </select>
            </div>

            {/* Status do Vínculo */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-foreground">Status do Vínculo (RF-MOD-04-03)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm font-medium"
              >
                <option value="Liberado Externa">Liberado Externa (Ativo)</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Finalizado">Finalizado (Acesso Bloqueado)</option>
                <option value="Somente Etiquetas">Somente Etiquetas (Acesso Restrito)</option>
              </select>
            </div>
          </div>

          {/* PAINEL DE GERAÇÃO AUTOMÁTICA DE CREDENCIAIS (RF-MOD-04-02) */}
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Credencial Automática de Acesso
                </div>
                <div className="text-sm font-bold text-foreground">
                  Login: <span className="font-mono text-primary">{generatedLogin}</span> | Senha Inicial: <span className="font-mono text-foreground">{generatedSenha}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-md shrink-0"
            >
              <CheckCircle2 className="h-4 w-4" /> Finalizar e Liberar Acesso
            </button>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-success/15 border border-success/30 rounded-lg text-xs text-success font-medium animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-destructive/15 border border-destructive/30 rounded-lg text-xs text-destructive font-medium animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
            </div>
          )}
        </form>
      </section>

      {/* SEÇÃO 2: LISTAGEM E PESQUISA DE USUÁRIOS (RF-MOD-04-01) */}
      <section className="glass-card p-4 border border-border/60">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <Users className="h-5 w-5 text-primary" />
            <span>Matriz de Usuários & Papéis</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                placeholder="Pesquisar por nome, login, setor..."
                className="h-9 pl-9 pr-3 rounded-md border border-input bg-background/60 text-xs w-64"
              />
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="h-9 px-3 rounded-md border border-input text-xs flex items-center gap-1 hover:bg-muted"
              title="Atualizar lista"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Atualizar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-foreground border-b border-border/60">
              <tr>
                <th className="p-3">Login</th>
                <th className="p-3">Responsável</th>
                <th className="p-3">Prontuário</th>
                <th className="p-3">Setor / Unidade</th>
                <th className="p-3">Secretaria</th>
                <th className="p-3">Status do Vínculo</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredUsers.slice(0, 20).map((u) => {
                const isLiberado = (u.status ?? "").trim().toUpperCase() === "LIBERADO EXTERNA";
                return (
                  <tr key={`${u.login}-${u.unidadeCodigo}`} className="hover:bg-accent/10 transition-colors">
                    <td className="p-3 font-mono font-semibold text-primary">{u.login}</td>
                    <td className="p-3 font-medium text-foreground">{u.responsavelNome || u.responsavel}</td>
                    <td className="p-3 text-muted-foreground font-mono">{u.prontuarioResponsavel || u.prontuario}</td>
                    <td className="p-3">{u.unidadeNome || u.setor}</td>
                    <td className="p-3 text-muted-foreground">{u.secretariaNome || u.secretaria}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          isLiberado
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {isLiberado ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Editar perfil do usuário ${u.login}`);
                        }}
                        className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-[11px] font-medium"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
