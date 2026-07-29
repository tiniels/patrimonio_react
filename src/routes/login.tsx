import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { refreshAuthSession, type AuthUser } from "@/lib/authStore";

interface LoginApiResponse {
  authenticated?: boolean;
  user?: AuthUser;
  code?: string;
  message?: string;
}

interface AuthStatusResponse {
  configured: boolean;
  lockdownEnabled: boolean;
  provider: string;
  message: string;
}

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acesso administrativo — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Login administrativo seguro com autenticação server-side e sessão HttpOnly.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { redirect?: string; signedOut?: string };

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatusResponse | null>(null);
  const [successUser, setSuccessUser] = useState<AuthUser | null>(null);

  const loginInputId = useId();
  const passwordInputId = useId();
  const statusId = useId();
  const errorId = useId();

  useEffect(() => {
    let active = true;

    fetch("/api/v1/auth/status", {
      method: "GET",
      credentials: "same-origin",
      headers: { accept: "application/json" },
    })
      .then((response) => response.json() as Promise<AuthStatusResponse>)
      .then((payload) => {
        if (active) setStatus(payload);
      })
      .catch(() => {
        if (active) {
          setStatus({
            configured: false,
            lockdownEnabled: true,
            provider: "unavailable",
            message: "Não foi possível consultar o estado do provedor de autenticação.",
          });
        }
      })
      .finally(() => {
        if (active) setCheckingStatus(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleKeyDownPassword = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.getModifierState) {
      setCapsLockOn(event.getModifierState("CapsLock"));
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    const normalizedLogin = login.trim();
    if (!normalizedLogin) {
      setErrorMsg("Informe o usuário administrativo.");
      return;
    }
    if (!password) {
      setErrorMsg("Informe a senha.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/v1/auth/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-csrf-intent": "admin-login",
        },
        body: JSON.stringify({ login: normalizedLogin, password }),
      });

      const payload = (await response.json().catch(() => null)) as LoginApiResponse | null;

      if (!response.ok || !payload?.authenticated || !payload.user) {
        setErrorMsg(payload?.message ?? "Não foi possível autenticar com segurança.");
        return;
      }

      await refreshAuthSession();
      setSuccessUser(payload.user);

      const redirect = getSafeRedirect(searchParams.redirect);
      setTimeout(() => {
        navigate({ to: redirect, replace: true } as any);
      }, 350);
    } catch {
      setErrorMsg("Falha de comunicação com o serviço de autenticação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const authUnavailable = Boolean(status && (!status.configured || status.lockdownEnabled));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <header className="w-full max-w-md flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center border border-primary/20">
            <Building className="h-5 w-5" aria-hidden="true" />
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
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 bg-muted/40 hover:bg-muted px-2.5 py-1.5 rounded-md border border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Voltar ao portal
        </Link>
      </header>

      <main className="w-full max-w-md glass-card p-6 md:p-8 relative shadow-2xl border border-border/60">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary/90 flex items-center gap-1 mb-1">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Acesso Administrativo
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Entrar com sessão segura
            </h1>
          </div>
        </div>

        {searchParams.signedOut === "1" && !successUser ? (
          <div className="mb-4 rounded-lg border border-primary/25 bg-primary/10 p-3 text-xs text-foreground" role="status">
            Sessão encerrada com segurança.
          </div>
        ) : null}

        {checkingStatus ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Verificando provedor de autenticação...
          </div>
        ) : null}

        {status && (
          <div
            id={statusId}
            role={authUnavailable ? "alert" : "status"}
            className={`mb-5 rounded-lg border p-3 text-xs leading-5 ${
              authUnavailable
                ? "border-destructive/35 bg-destructive/10 text-foreground"
                : "border-primary/25 bg-primary/10 text-foreground"
            }`}
          >
            <div className="flex items-start gap-2">
              {authUnavailable ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              )}
              <div>
                <strong>{authUnavailable ? "Acesso indisponível:" : "Provedor ativo:"}</strong> {status.message}
                <div className="mt-1 text-muted-foreground">Provedor: {status.provider}</div>
              </div>
            </div>
          </div>
        )}

        {successUser ? (
          <div className="py-8 text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
            <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground">Acesso autenticado</h2>
            <p className="text-sm text-muted-foreground">
              Bem-vindo(a), <strong>{successUser.name}</strong>. Redirecionando para seu painel...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mt-2" aria-hidden="true" />
          </div>
        ) : (
          <form onSubmit={handleLoginSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={loginInputId} className="text-xs font-semibold text-foreground">
                Usuário administrativo
              </label>
              <div className="relative flex items-center">
                <User className="h-4 w-4 absolute left-3 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <input
                  id={loginInputId}
                  type="text"
                  autoFocus
                  autoComplete="username"
                  value={login}
                  onChange={(event) => {
                    setLogin(event.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Usuário institucional"
                  aria-invalid={!!errorMsg}
                  aria-describedby={[statusId, errorMsg ? errorId : undefined].filter(Boolean).join(" ")}
                  className="h-11 w-full pl-9 pr-3 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={passwordInputId} className="text-xs font-semibold text-foreground">
                  Senha
                </label>
                {capsLockOn && (
                  <span className="text-[10px] font-semibold uppercase text-warning bg-warning/15 px-1.5 py-0.5 rounded flex items-center gap-1 border border-warning/30">
                    Caps Lock ativo
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="h-4 w-4 absolute left-3 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <input
                  id={passwordInputId}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onKeyDown={handleKeyDownPassword}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!errorMsg}
                  aria-describedby={[statusId, errorMsg ? errorId : undefined].filter(Boolean).join(" ")}
                  className="h-11 w-full pl-9 pr-10 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha em texto limpo"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                id={errorId}
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3 animate-in fade-in duration-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || checkingStatus || authUnavailable}
              className="mt-2 h-11 w-full rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Autenticando no servidor...
                </>
              ) : (
                <>
                  Entrar com segurança <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

function getSafeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/adm";
  if (["/login", "/responsavel-login", "/set-password"].includes(value)) return "/adm";
  return value;
}
