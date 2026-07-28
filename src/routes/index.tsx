import { createFileRoute } from "@tanstack/react-router";
import { AuthLockdownPage } from "@/components/AuthLockdownPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contenção de segurança — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Acesso temporariamente indisponível durante a implantação da autenticação segura no servidor.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SecurityContainmentHome,
});

function SecurityContainmentHome() {
  return (
    <AuthLockdownPage
      title="Sistema temporariamente indisponível para acesso"
      description="O portal está em contenção preventiva após a identificação de credenciais e dados pessoais no frontend do protótipo. O acesso será reaberto somente depois da rotação das credenciais afetadas e da validação da autenticação, autorização e sessão no servidor."
      showBackLink={false}
    />
  );
}
