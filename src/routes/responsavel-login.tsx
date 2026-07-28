import { createFileRoute } from "@tanstack/react-router";
import { AuthLockdownPage } from "@/components/AuthLockdownPage";

export const Route = createFileRoute("/responsavel-login")({
  head: () => ({
    meta: [
      { title: "Acesso do responsável indisponível — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Acesso de responsáveis temporariamente bloqueado durante a correção de segurança da autenticação.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResponsibleLoginPage,
});

function ResponsibleLoginPage() {
  return (
    <AuthLockdownPage
      title="Portal do responsável em correção de segurança"
      description="O login, o primeiro acesso e a recuperação de senha estão suspensos até que identidade, vínculo temporal e sessão sejam validados exclusivamente no servidor. Nenhuma conta real ou senha temporária é exibida ou processada pelo navegador nesta versão."
    />
  );
}
