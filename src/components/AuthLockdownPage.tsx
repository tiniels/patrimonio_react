import { Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldAlert } from "lucide-react";

interface AuthLockdownPageProps {
  title: string;
  description: string;
}

const REMEDIATION_STEPS = [
  "remoção de credenciais e dados pessoais do bundle público",
  "implantação de autenticação e sessão validadas no servidor",
  "validação de autorização, auditoria e recuperação de acesso",
] as const;

export function AuthLockdownPage({ title, description }: AuthLockdownPageProps) {
  const headingId = "security-lockdown-heading";
  const statusId = "security-lockdown-status";

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <main
        className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-border/70 bg-card p-6 shadow-2xl sm:p-8"
        aria-labelledby={headingId}
        aria-describedby={statusId}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive"
            aria-hidden="true"
          >
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">
              Contenção de segurança ativa
            </p>
            <h1 id={headingId} className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>

        <section
          id={statusId}
          role="status"
          aria-live="polite"
          className="rounded-xl border border-primary/25 bg-primary/5 p-4"
        >
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />
            Acesso temporariamente indisponível
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            O protótipo anterior validava credenciais no navegador. Por segurança, nenhum login será aceito até que a autenticação no servidor esteja configurada e validada.
          </p>
        </section>

        <section aria-labelledby="remediation-heading">
          <h2 id="remediation-heading" className="text-sm font-bold text-foreground">
            Critérios para reabertura
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {REMEDIATION_STEPS.map((step) => (
              <li key={step} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao portal
          </Link>
          <p className="text-center text-xs leading-5 text-muted-foreground sm:text-right">
            Não informe credenciais por e-mail, chat ou chamado.
          </p>
        </div>
      </main>
    </div>
  );
}
