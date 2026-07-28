import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useId } from "react";
import {
  KeyRound,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  Lock,
} from "lucide-react";
import { getAllRespUsers, setCustomPassword } from "@/lib/authStore";
import type { RespUser } from "@/lib/respUsers";

export const Route = createFileRoute("/set-password")({
  head: () => ({
    meta: [
      { title: "Primeiro Acesso / Redefinir Senha — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Definição segura de primeira senha ou redefinição de acesso para responsáveis de setor.",
      },
    ],
  }),
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const navigate = useNavigate();

  // Etapa 1: Identificação | Etapa 2: Nova Senha | Etapa 3: Concluído
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [identityInput, setIdentityInput] = useState("");
  const [foundUser, setFoundUser] = useState<RespUser | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const identityInputId = useId();
  const newPassInputId = useId();
  const confirmPassInputId = useId();

  // Requisitos de Força de Senha
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isPasswordValid = hasMinLength && hasLetter && hasNumber && passwordsMatch;

  // Etapa 1: Buscar Responsável por login, prontuário ou e-mail
  const handleSearchIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const term = identityInput.trim().toLowerCase();
    if (!term) {
      setErrorMsg("Informe seu login (ex: Marcos.42157), prontuário ou e-mail.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const allResp = getAllRespUsers();
      const match = allResp.find(
        (r) =>
          r.login.toLowerCase() === term ||
          (r.prontuario && r.prontuario.toLowerCase() === term) ||
          (r.email && r.email.toLowerCase() === term)
      );

      setLoading(false);

      if (!match) {
        setErrorMsg("Nenhum cadastro de responsável encontrado com estas informações. Verifique os dados ou contate a Contabilidade.");
        return;
      }

      setFoundUser(match);
      setStep(2);
    }, 400);
  };

  // Etapa 2: Salvar nova senha
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isPasswordValid) {
      if (!hasMinLength) setErrorMsg("A senha deve ter no mínimo 8 caracteres.");
      else if (!hasLetter || !hasNumber) setErrorMsg("A senha deve conter letras e números.");
      else if (!passwordsMatch) setErrorMsg("A confirmação de senha não confere.");
      return;
    }

    if (!foundUser) return;

    setLoading(true);
    setTimeout(() => {
      setCustomPassword(foundUser.login, newPassword);
      setLoading(false);
      setStep(3);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Luzes decorativas de fundo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <header className="w-full max-w-md flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center border border-primary/20">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground block font-medium">
              Santana de Parnaíba
            </span>
            <span className="text-sm font-bold gold-text">Primeiro Acesso / Redefinição</span>
          </div>
        </div>

        <Link
          to="/responsavel-login"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 bg-muted/40 hover:bg-muted px-2.5 py-1.5 rounded-md border border-border/50"
        >
          Voltar ao login
        </Link>
      </header>

      <main className="w-full max-w-md glass-card p-6 md:p-8 relative shadow-2xl border border-border/60">
        {/* Indicador Visual de Etapas */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50 text-xs">
          <span className={`flex items-center gap-1 font-semibold ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px]">1</span>
            Identificação
          </span>
          <span className="text-muted-foreground">→</span>
          <span className={`flex items-center gap-1 font-semibold ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px]">2</span>
            Nova Senha
          </span>
          <span className="text-muted-foreground">→</span>
          <span className={`flex items-center gap-1 font-semibold ${step === 3 ? "text-primary" : "text-muted-foreground"}`}>
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px]">3</span>
            Pronto
          </span>
        </div>

        {/* ETAPA 1: Identificação do Responsável */}
        {step === 1 && (
          <form onSubmit={handleSearchIdentity} className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Localizar seu Cadastro</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Informe o seu login de responsável, prontuário ou e-mail cadastrado na Contabilidade.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label htmlFor={identityInputId} className="text-xs font-semibold text-foreground">
                Login, Prontuário ou E-mail
              </label>
              <input
                id={identityInputId}
                type="text"
                autoFocus
                value={identityInput}
                onChange={(e) => {
                  setIdentityInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ex: Marcos.42157 ou 42157"
                className="h-11 w-full px-3 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {errorMsg && (
              <div role="alert" className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando cadastro...
                </>
              ) : (
                <>
                  Verificar Cadastro <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ETAPA 2: Definição da Nova Senha */}
        {step === 2 && foundUser && (
          <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-primary font-bold">
                <UserCheck className="h-4 w-4" /> Responsável Encontrado
              </div>
              <div className="font-semibold text-foreground">{foundUser.responsavelNome || foundUser.responsavel}</div>
              <div className="text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {foundUser.unidadeNome || foundUser.setor} ({foundUser.secretariaNome || foundUser.secretaria})
              </div>
              <div className="text-[11px] font-mono text-primary font-medium mt-0.5">
                Login: {foundUser.login}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground">Definir Nova Senha</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Escolha uma senha segura para seus acessos futuros ao sistema de patrimônio.
              </p>
            </div>

            {/* Campo Nova Senha */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={newPassInputId} className="text-xs font-semibold text-foreground">
                Nova Senha
              </label>
              <div className="relative flex items-center">
                <Lock className="h-4 w-4 absolute left-3 text-muted-foreground pointer-events-none" />
                <input
                  id={newPassInputId}
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="••••••••"
                  className="h-11 w-full pl-9 pr-10 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Campo Confirmação de Senha */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={confirmPassInputId} className="text-xs font-semibold text-foreground">
                Confirmar Nova Senha
              </label>
              <input
                id={confirmPassInputId}
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="••••••••"
                className="h-11 w-full px-3 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Indicadores Visuais de Requisitos de Senha */}
            <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-xs flex flex-col gap-1.5">
              <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">
                Requisitos da senha:
              </span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? "bg-primary" : "bg-muted-foreground/50"}`} />
                  Mínimo 8 caracteres
                </div>
                <div className={`flex items-center gap-1.5 ${hasLetter ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${hasLetter ? "bg-primary" : "bg-muted-foreground/50"}`} />
                  Contém letras
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${hasNumber ? "bg-primary" : "bg-muted-foreground/50"}`} />
                  Contém números
                </div>
                <div className={`flex items-center gap-1.5 ${passwordsMatch ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${passwordsMatch ? "bg-primary" : "bg-muted-foreground/50"}`} />
                  Senhas coincidem
                </div>
              </div>
            </div>

            {errorMsg && (
              <div role="alert" className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-11 px-4 rounded-lg border border-input text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="h-11 flex-1 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    Salvar Nova Senha <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ETAPA 3: Concluído com Sucesso */}
        {step === 3 && (
          <div className="py-6 text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="h-14 w-14 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Senha Definida com Sucesso!</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Sua nova senha de acesso foi registrada com segurança. Você já pode acessar o Portal do Responsável.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/responsavel-login" })}
              className="mt-2 h-11 w-full rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              Ir para o Login de Responsável <ShieldCheck className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Prefeitura de Santana de Parnaíba · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
