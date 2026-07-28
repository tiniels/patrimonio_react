import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useId } from "react";
import {
  UserCog,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building,
  Loader2,
  ShieldCheck,
  FileText,
  KeyRound,
  ShieldAlert,
  Send,
  Check,
} from "lucide-react";
import {
  authenticateUserDetailed,
  recordTermsAcceptance,
  signInUser,
  getAllRespUsers,
  type AuthUser,
} from "@/lib/authStore";

export const Route = createFileRoute("/responsavel-login")({
  head: () => ({
    meta: [
      { title: "Entrar como Responsável — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Acesso exclusivo para responsáveis de setor e unidades no sistema de patrimônio.",
      },
    ],
  }),
  component: RespLoginPage,
});

function RespLoginPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { redirect?: string };

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [lgpdChecked, setLgpdChecked] = useState(false);

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryTarget, setRecoveryTarget] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryOtp, setRecoveryOtp] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const [showDemoUsers, setShowDemoUsers] = useState(false);

  const loginInputId = useId();
  const senhaInputId = useId();
  const errorId = useId();

  const handleKeyDownPassword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBlockedReason(null);

    const trimmedLogin = login.trim();
    const trimmedSenha = senha.trim();

    if (!trimmedLogin) {
      setErrorMsg("Informe o seu usuário ou login de responsável.");
      return;
    }
    if (!trimmedSenha) {
      setErrorMsg("Informe a sua senha.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const result = authenticateUserDetailed(trimmedLogin, trimmedSenha);
    setLoading(false);

    if (result.reason === "vinculo_expirado") {
      setBlockedReason(
        result.statusMessage || "Acesso negado: vínculo de responsabilidade finalizado ou suspenso."
      );
      return;
    }

    if (!result.user) {
      setErrorMsg("Login ou senha inválidos. Verifique as informações fornecidas pela Contabilidade.");
      return;
    }

    const user = result.user;

    // Se o usuário ainda não aceitou os termos LGPD, abrir modal de aceite obrigatório (RF-MOD-03-05)
    if (!user.termsAccepted) {
      setPendingUser(user);
      setShowTermsModal(true);
      return;
    }

    finalizeLogin(user);
  };

  const finalizeLogin = (user: AuthUser) => {
    signInUser(user, rememberMe);

    setTimeout(() => {
      if (searchParams.redirect) {
        navigate({ to: searchParams.redirect as any });
      } else {
        navigate({ to: "/responsavel" as any });
      }
    }, 400);
  };

  const handleAcceptTerms = () => {
    if (!lgpdChecked || !pendingUser) return;

    recordTermsAcceptance(pendingUser.login);
    pendingUser.termsAccepted = true;
    setShowTermsModal(false);
    finalizeLogin(pendingUser);
  };

  const handleSendRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryTarget.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRecoverySent(true);
    }, 500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryOtp.length < 4) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRecoverySuccess(true);
    }, 500);
  };

  const fillQuickUser = (l: string, s: string) => {
    setLogin(l);
    setSenha(s);
    setErrorMsg(null);
    setBlockedReason(null);
    setShowDemoUsers(false);
  };

  const allResp = getAllRespUsers();
  const sampleRespUsers = allResp.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <header className="w-full max-w-md flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-accent/20 text-accent-foreground flex items-center justify-center border border-accent/30">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground block font-medium">
              Santana de Parnaíba
            </span>
            <span className="text-sm font-bold gold-text">Portal do Responsável</span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 bg-muted/40 hover:bg-muted px-2.5 py-1.5 rounded-md border border-border/50"
        >
          Voltar ao portal
        </Link>
      </header>

      <main className="w-full max-w-md glass-card p-6 md:p-8 relative shadow-2xl border border-border/60">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-accent flex items-center gap-1 mb-1">
              <UserCog className="h-3.5 w-3.5" />
              Responsável de Setor
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Acesso ao Setor
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowDemoUsers(!showDemoUsers)}
            className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 text-accent-foreground hover:bg-accent/25 border border-accent/30 transition-all font-medium"
            title="Exemplos de responsáveis"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Exemplos
          </button>
        </div>

        {/* Modal Expansível de Demonstração */}
        {showDemoUsers && (
          <div className="mb-6 p-3.5 rounded-lg bg-accent/10 border border-accent/30 text-xs flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex justify-between items-center font-semibold text-foreground">
              <span>Exemplos de responsáveis cadastrados:</span>
              <button
                type="button"
                onClick={() => setShowDemoUsers(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 mt-1">
              {sampleRespUsers.map((r) => (
                <button
                  key={r.login}
                  type="button"
                  onClick={() => fillQuickUser(r.login, r.senha)}
                  className="flex items-center justify-between p-2 rounded bg-background/80 hover:bg-accent border border-border/60 text-left transition-colors"
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-foreground truncate">{r.responsavelNome || r.responsavel}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{r.unidadeNome || r.setor}</div>
                  </div>
                  <div className="text-[11px] font-mono bg-muted/60 px-1.5 py-0.5 rounded text-accent-foreground shrink-0">
                    {r.login}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Banner de Bloqueio por Vínculo Expirado (RF-MOD-03-07) */}
        {blockedReason && (
          <div role="alert" className="mb-6 p-4 rounded-xl bg-destructive/15 border border-destructive/40 text-xs flex flex-col gap-2 animate-in zoom-in-95">
            <div className="flex items-center gap-2 font-bold text-destructive text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>Acesso Suspenso / Vínculo Inativo</span>
            </div>
            <p className="text-foreground leading-relaxed">{blockedReason}</p>
            <div className="mt-1 pt-2 border-t border-destructive/20 text-muted-foreground flex justify-between items-center">
              <span>Contato Contabilidade: Ramal 42159</span>
              <button
                type="button"
                onClick={() => setBlockedReason(null)}
                className="text-primary hover:underline font-semibold"
              >
                Tentar outro login
              </button>
            </div>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleLoginSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={loginInputId} className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Login do Responsável</span>
              <span className="text-[11px] text-muted-foreground font-normal">Ex: Marcos.42157</span>
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
                  if (blockedReason) setBlockedReason(null);
                }}
                placeholder="Nome.Prontuário fornecido"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? errorId : undefined}
                className="h-11 w-full pl-9 pr-3 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
          </div>

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
                  if (blockedReason) setBlockedReason(null);
                }}
                placeholder="••••••••"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? errorId : undefined}
                className="h-11 w-full pl-9 pr-10 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-muted-foreground hover:text-foreground p-1 transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-input text-accent focus:ring-accent h-4 w-4 accent-accent"
              />
              <span>Manter conectado</span>
            </label>

            <button
              type="button"
              onClick={() => setShowRecoveryModal(true)}
              className="text-accent hover:underline font-medium"
            >
              Recuperar senha
            </button>
          </div>

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

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Autenticando...
              </>
            ) : (
              <>
                Acessar Meus Bens <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-border/50 flex flex-col gap-2 text-center text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/set-password"
              className="text-accent hover:underline flex items-center gap-1 font-medium"
            >
              <KeyRound className="h-3.5 w-3.5" /> Primeiro acesso / Criar senha
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link
              to="/login"
              className="text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              É administrador ou servidor? Login administrativo
            </Link>
          </div>
        </div>
      </main>

      {/* MODAL DE ACEITE OBRIGATÓRIO DOS TERMOS FIEL DEPOSITÁRIO & LGPD (RF-MOD-03-05) */}
      {showTermsModal && pendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg glass-card p-6 border border-border shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg border-b border-border pb-3">
              <FileText className="h-5 w-5 text-accent" />
              <span>Termo de Fiel Depositário & Declaração de Privacidade</span>
            </div>

            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-xs">
              <span className="font-bold text-foreground">Servidor Responsável:</span> {pendingUser.name}<br />
              <span className="font-bold text-foreground">Setor:</span> {pendingUser.unidade} ({pendingUser.secretaria})
            </div>

            <div className="p-4 bg-muted/30 rounded-lg text-xs space-y-3 border border-border/50 text-muted-foreground leading-relaxed overflow-y-auto max-h-60">
              <h4 className="font-bold text-foreground">1. Das Responsabilidades Patrimoniais</h4>
              <p>
                O servidor cadastrado assume o encargo de <strong>Fiel Depositário</strong> de todos os bens alocados sob seu setor ou unidade administrativa, devendo zelar pela guarda, preservação, integridade física e localização de cada patrimônio identificado.
              </p>
              <h4 className="font-bold text-foreground">2. Das Transferências e Baixas</h4>
              <p>
                Nenhuma movimentação, empréstimo, transferência de localidade ou proposta de baixa pode ser executada sem o prévio registro e aceite formal no sistema de Gestão Patrimonial.
              </p>
              <h4 className="font-bold text-foreground">3. Proteção de Dados (LGPD - Lei nº 13.709/2018)</h4>
              <p>
                Os dados de identificação funcional (nome, prontuário e setor) são utilizados exclusivamente para fins de auditoria interna, inventário oficial e prestação de contas aos órgãos de controle externo da Administração Pública Municipal.
              </p>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-foreground font-medium p-2 rounded-lg hover:bg-muted/40 transition-colors border border-border/40">
              <input
                type="checkbox"
                checked={lgpdChecked}
                onChange={(e) => setLgpdChecked(e.target.checked)}
                className="mt-0.5 rounded border-input text-accent focus:ring-accent h-4 w-4 accent-accent shrink-0"
              />
              <span>
                Li e concordo expressamente com o <strong>Termo de Fiel Depositário</strong> e com a <strong>Política de Privacidade LGPD</strong>.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowTermsModal(false);
                  setPendingUser(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-input text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!lgpdChecked}
                onClick={handleAcceptTerms}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Aceitar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECUPERAÇÃO ASSISTIDA (RF-MOD-03-04) */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm glass-card p-6 border border-border shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-bold text-foreground text-base">
                <KeyRound className="h-5 w-5 text-accent" />
                <span>Recuperação Assistida</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryModal(false);
                  setRecoverySent(false);
                  setRecoverySuccess(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {!recoverySent ? (
              <form onSubmit={handleSendRecovery} className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Informe o seu e-mail institucional ou prontuário para receber um token de uso único para redefinição.
                </p>
                <input
                  type="text"
                  required
                  value={recoveryTarget}
                  onChange={(e) => setRecoveryTarget(e.target.value)}
                  placeholder="Seu prontuário ou e-mail"
                  className="h-10 px-3 rounded-lg border border-input bg-background/60 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  disabled={loading || !recoveryTarget.trim()}
                  className="h-10 rounded-lg bg-accent text-accent-foreground font-semibold text-xs hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar Token de Recuperação
                </button>
              </form>
            ) : !recoverySuccess ? (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
                <div className="p-2.5 bg-accent/10 border border-accent/20 rounded text-xs text-foreground">
                  Token enviado para <strong>{recoveryTarget}</strong>.
                </div>
                <label className="text-xs font-semibold text-foreground">Informe o Código Token (4 dígitos):</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={recoveryOtp}
                  onChange={(e) => setRecoveryOtp(e.target.value)}
                  placeholder="Ex: 4829"
                  className="h-10 px-3 rounded-lg border border-input bg-background/60 text-center font-mono text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  disabled={loading || recoveryOtp.length < 4}
                  className="h-10 rounded-lg bg-accent text-accent-foreground font-semibold text-xs hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Validar Token
                </button>
              </form>
            ) : (
              <div className="py-4 text-center flex flex-col items-center gap-3">
                <CheckCircle2 className="h-10 w-10 text-accent animate-bounce" />
                <div className="font-bold text-foreground text-sm">Token Verificado!</div>
                <p className="text-xs text-muted-foreground">
                  Seu token foi validado. Redirecionando para a tela de nova senha...
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryModal(false);
                    navigate({ to: "/set-password" });
                  }}
                  className="mt-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-xs font-semibold"
                >
                  Definir Nova Senha Agora
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Prefeitura de Santana de Parnaíba · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
