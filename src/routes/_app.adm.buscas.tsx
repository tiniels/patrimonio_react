import { createFileRoute } from "@tanstack/react-router";
import { Database, LockKeyhole, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_app/adm/buscas")({
  head: () => ({
    meta: [
      { title: "Consultas protegidas — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Área de consultas temporariamente indisponível durante a implantação da API autenticada e da minimização de dados.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProtectedQueriesPage,
});

const REOPENING_REQUIREMENTS = [
  "API autenticada no servidor com autorização por secretaria, setor e finalidade",
  "respostas minimizadas sem credenciais, segredos ou dados pessoais desnecessários",
  "exportações auditadas, limitadas e protegidas contra extração indevida",
  "testes negativos de acesso horizontal e vertical aprovados",
] as const;

function ProtectedQueriesPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Database className="h-4 w-4" aria-hidden="true" />
          Administração · Consultas
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Consultas de responsáveis em contenção
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Esta tela foi desativada porque o protótipo anterior processava registros de identidade e
          credenciais no navegador. Nenhuma listagem, detalhe ou exportação será disponibilizada até
          que os dados sejam fornecidos por uma API autorizada no servidor.
        </p>
      </header>

      <section
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"
            aria-hidden="true"
          >
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Acesso preventivamente bloqueado
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A contenção remove a possibilidade de visualizar ou exportar material de autenticação.
              Credenciais nunca fazem parte de relatórios, tabelas administrativas ou arquivos de
              auditoria.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-base font-bold text-foreground">Critérios para reabertura</h2>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          {REOPENING_REQUIREMENTS.map((requirement) => (
            <li key={requirement} className="flex items-start gap-3">
              <span
                className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                aria-hidden="true"
              />
              <span>{requirement}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        Não envie credenciais ou dados pessoais em chamados, mensagens ou planilhas para contornar
        este bloqueio.
      </p>
    </main>
  );
}
