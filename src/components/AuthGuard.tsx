import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, LogOut, ShieldAlert } from "lucide-react";
import { useAuth, type UserRole } from "@/lib/authStore";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  fallbackLoginPath?: "/login" | "/responsavel-login";
}

export function AuthGuard({
  children,
  allowedRoles,
  fallbackLoginPath = "/login",
}: AuthGuardProps) {
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    if (!isAuthenticated) {
      const redirect = location.pathname !== "/" ? location.pathname : undefined;
      const targetLogin = allowedRoles?.includes("responsavel")
        ? "/responsavel-login"
        : fallbackLoginPath;

      navigate({
        to: targetLogin,
        search: redirect ? { redirect } : undefined,
        replace: true,
      });
    }
  }, [
    allowedRoles,
    fallbackLoginPath,
    isAuthenticated,
    loading,
    location.pathname,
    mounted,
    navigate,
  ]);

  const handleSwitchAccount = async () => {
    setSwitchingAccount(true);
    try {
      await signOut();
    } catch {
      // The current page remains protected; the login route will display service availability.
    } finally {
      setSwitchingAccount(false);
      navigate({
        to: user?.role === "responsavel" ? "/responsavel-login" : "/login",
        replace: true,
      });
    }
  };

  if (!mounted || loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Verificando credenciais de acesso...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Redirecionando para a tela de autenticação...
        </p>
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <main className="w-full max-w-md glass-card p-8 text-center flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Acesso restrito</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Seu perfil (<strong>{user.roleLabel}</strong>) não possui permissão para acessar esta
              área do sistema.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full mt-4">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="flex-1 h-10 rounded-md border border-input bg-background/80 hover:bg-accent hover:text-accent-foreground flex items-center justify-center gap-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Página inicial
            </button>
            <button
              type="button"
              onClick={handleSwitchAccount}
              disabled={switchingAccount}
              className="flex-1 h-10 rounded-md bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2 text-sm font-medium transition-opacity disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {switchingAccount ? "Encerrando..." : "Trocar conta"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
