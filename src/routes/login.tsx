import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useId, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Sparkles,
  KeyRound,
  Building,
  Loader2,
} from "lucide-react";
import { authenticateUser, signInUser, ADMIN_USERS, type AuthUser } from "@/lib/authStore";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acesso Administrativo — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Portal de entrada para servidores, administradores e gestão patrimonial municipal.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { redirect?: string };

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<AuthUser | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDemoUsers, setShowDemoUsers] = useState(false);

  const loginInputId = useId();
  const senhaInputId = useId();
  const errorId = useId();

  // Detectar Caps Lock ao digitar na senha
  const handleKeyDownPassword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedLogin = login.trim();
    const trimmedSenha = senha.trim();

    if (!trimmedLogin) {
      setErrorMsg("Informe o login ou usuário institucional.");
      return;
    }
    if (!trimmedSenha) {
      setErrorMsg("Informe a sua senha de acesso.");
      return;
    }

    setLoading(true);

    // Simulação com pequeno delay para fluidez de UI
    await new Promise((resolve) => setTimeout(resolve, 300));

    const user = authenticateUser(trimmedLogin, trimmedSenha);

    if (!user) {
      setErrorMsg("Login ou senha incorretos. Verifique suas credenciais.");
      setLoading(false);
      return;
    }

    signInUser(user, rememberMe);
    setSuccessUser(user);
    setLoading(false);

    // Redirecionamento baseado no perfil e parâmetro redirect
    setTimeout(() => {
      if (searchParams.redirect) {
        navigate({ to: searchParams.redirect as any });
        return;
      }

      switch (user.role) {
        case "chefia":
          navigate({ to: "/_app/chefia" as any });
          break;
        case "galpao":
          navigate({ to: "/_app/galpao/graficos" as any });
          break;
        case "responsavel":
          navigate({ to: "/responsavel" as any });
          break;
        default:
          navigate({ to: "/adm" as any });
          break;
      }
    }, 500);
  };

  const fillQuickUser = (l: string, s: string) => {
    setLogin(l);
    setSenha(s);
    setErrorMsg(null);
    setShowDemoUsers(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Elementos visuais decorativos de fundo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Institucional */}
      <header className="w-full max-w-md flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center border border-primary/20">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground block font-medium">
              Santana de Parnaíba
            </span>
            <span className="text-sm font-bold gold-text">Patrimônio Inteligente</span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 bg-muted/40 hover:bg-muted px-2.5 py-1.5 rounded-md border border-border/50"
        >
          Voltar ao portal
        </Link>
      </header>

      {/* Card Principal de Login */}
      <main className="w-full max-w-md glass-card p-6 md:p-8 relative shadow-2xl border border-border/60">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary/90 flex items-center gap-1 mb-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Acesso Administrativo
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Entrar no Sistema
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowDemoUsers(!showDemoUsers)}
            className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 transition-all font-medium"
            title="Contas de teste para demonstração rápida"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Contas Teste
          </button>
        </div>

        {/* Modal/Painel Expansível de Contas Teste */}
        {showDemoUsers && (
          <div className="mb-6 p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-xs flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex justify-between items-center font-semibold text-primary">
              <span>Selecione uma conta de demonstração:</span>
              <button
                type="button"
                onClick={() => setShowDemoUsers(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 mt-1">
              {ADMIN_USERS.map((acc) => (
                <button
                  key={acc.login}
                  type="button"
                  onClick={() => fillQuickUser(acc.login, acc.senha)}
                  className="flex items-center justify-between p-2 rounded bg-background/80 hover:bg-accent border border-border/60 text-left transition-colors"
                >
                  <div>
                    <div className="font-semibold text-foreground">{acc.user.name}</div>
                    <div className="text-[11px] text-muted-foreground">{acc.user.roleLabel}</div>
                  </div>
                  <div className="text-[11px] font-mono bg-muted/60 px-1.5 py-0.5 rounded text-primary">
                    {acc.login}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status de Sucesso pós-login */}
        {successUser ? (
          <div className="py-8 text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
            <CheckCircle2 className="h-12 w-12 text-primary animate-bounce" />
            <h2 className="text-lg font-bold text-foreground">Acesso Autenticado!</h2>
            <p className="text-sm text-muted-foreground">
              Bem-vindo(a), <strong>{successUser.name}</strong>. Redirecionando para o seu painel...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mt-2" />
          </div>
        ) : (
          /* Formulário de Login */
          <form onSubmit={handleLoginSubmit} noValidate className="flex flex-col gap-4">
            {/* Campo Login / Usuário */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={loginInputId} className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Usuário / Login</span>
                <span className="text-[11px] text-muted-foreground font-normal">Ex: neemias.42159</span>
              </label>
              <div className="relative flex items-center">
                <User className="h-4 w-4 absolute left-3 text-muted-foreground pointer-events-none" />
                <input
                  id={loginInputId}
                  type="text"
                  autoFocus
                  autoComplete="username"
                  value={login}
                  onChange={(e) => {
                    setLogin(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Seu usuário institucional"
                  aria-invalid={!!errorMsg}
                  aria-describedby={errorMsg ? errorId : undefined}
                  className="h-11 w-full pl-9 pr-3 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={senhaInputId} className="text-xs font-semibold text-foreground">
                  Senha
                </label>
                {capsLockOn && (
                  <span className="text-[10px] font-semibold uppercase text-warning bg-warning/15 px-1.5 py-0.5 rounded flex items-center gap-1 border border-warning/30">
                    ⚠️ Caps Lock Ativo
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="h-4 w-4 absolute left-3 text-muted-foreground pointer-events-none" />
                <input
                  id={senhaInputId}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={senha}
                  onKeyDown={handleKeyDownPassword}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!errorMsg}
                  aria-describedby={errorMsg ? errorId : undefined}
                  className="h-11 w-full pl-9 pr-10 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha em texto limpo"}
                  title={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Opções extras: Lembrar-me e Redefinição */}
            <div className="flex items-center justify-between text-xs mt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4 accent-primary"
                />
                <span>Lembrar meu acesso</span>
              </label>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-primary hover:underline font-medium"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Mensagem de Erro de Validação/Autenticação */}
            {errorMsg && (
              <div
                id={errorId}
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3 animate-in fade-in duration-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            {/* Botão Principal de Submissão */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Autenticando...
                </>
              ) : (
                <>
                  Entrar no Painel <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Divisor Institucional */}
        <div className="mt-6 pt-5 border-t border-border/50 flex flex-col gap-2 text-center text-xs text-muted-foreground">
          <div>
            Acesso exclusivo para servidores e gestores autorizados da Prefeitura.
          </div>
          <div className="flex items-center justify-center gap-4 mt-1">
            <Link
              to="/responsavel-login"
              className="text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <KeyRound className="h-3.5 w-3.5" />
              É responsável de setor? Clique aqui
            </Link>
          </div>
        </div>
      </main>

      {/* Modal de Ajuda / Redefinição de Senha */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm glass-card p-6 border border-border shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <HelpCircle className="h-5 w-5 text-primary" />
              <span>Suporte a Senha e Acesso</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Para redefinir sua senha de acesso administrativo ou resolver bloqueios de conta, entre em contato com a <strong>Divisão de Gestão Patrimonial</strong> ou com o Suporte Técnico de TI.
            </p>
            <div className="p-3 bg-muted/50 rounded-lg text-xs flex flex-col gap-1 border border-border/50">
              <div className="font-semibold text-foreground">Contabilidade / Patrimônio:</div>
              <div className="text-muted-foreground">Ramais 42159 / 42160</div>
              <div className="text-muted-foreground font-mono">patrimonio@santanadeparnaiba.sp.gov.br</div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Prefeitura de Santana de Parnaíba · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
