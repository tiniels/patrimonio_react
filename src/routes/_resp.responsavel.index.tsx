import { createFileRoute } from "@tanstack/react-router";
import { Clock3, LockKeyhole, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_resp/responsavel/")({
  head: () => ({
    meta: [
      { title: "Portal do responsável — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Portal do responsável temporariamente indisponível durante a implantação da identidade e autorização no servidor.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResponsiblePortalHome,
});

const REQUIRED_CONTROLS = [
  "identidade vinculada ao responsável e à vigência oficial",
  "sessão revogável em cookie seguro, sem credenciais no navegador",
  "autorização por secretaria, setor, local e ação",
  "auditoria de acessos e mutações sem dados pessoais desnecessários",
] as const;

function ResponsiblePortalHome() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)]">
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <LockKeyhole className="h-6 w-6" />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Contenção preventiva
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          O painel do responsável permanece bloqueado
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          O protótipo anterior inferia identidade e permissões pelo navegador. Nenhum inventário,
          transferência, avaliação, documento ou dado de responsável será exibido até que a sessão e
          o escopo sejam validados pela API no servidor.
        </p>

        <div className="mt-6 rounded-xl border border-border/70 bg-muted/35 p-4">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
            Estado atual
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A aplicação retorna uma indisponibilidade segura e não cria sessão, não consulta dados
            protegidos e não oferece atalhos de demonstração.
          </p>
        </div>
      </section>

      <aside className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-bold text-foreground">Controles exigidos</h2>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          {REQUIRED_CONTROLS.map((control) => (
            <li key={control} className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span>{control}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
