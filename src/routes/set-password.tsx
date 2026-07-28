import { createFileRoute } from "@tanstack/react-router";
import { AuthLockdownPage } from "@/components/AuthLockdownPage";

export const Route = createFileRoute("/set-password")({
  head: () => ({
    meta: [
      { title: "Redefinição indisponível — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Redefinição de senha temporariamente bloqueada durante a implantação do fluxo seguro no servidor.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SetPasswordPage,
});

function SetPasswordPage() {
  return (
    <AuthLockdownPage
      title="Primeiro acesso e redefinição temporariamente suspensos"
      description="A versão anterior permitia localizar usuários e armazenar novas senhas no navegador. Esse fluxo foi desativado. O novo processo exigirá canal verificado, token de uso único, expiração e registro de auditoria no servidor."
    />
  );
}
