import { createFileRoute } from "@tanstack/react-router";
import { AuthLockdownPage } from "@/components/AuthLockdownPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acesso administrativo indisponível — Patrimônio Inteligente" },
      {
        name: "description",
        content: "Acesso administrativo temporariamente bloqueado durante a correção de segurança da autenticação.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthLockdownPage
      title="Acesso administrativo em correção de segurança"
      description="A entrada de administradores, contabilidade, chefia e galpão está suspensa enquanto a sessão segura no servidor é implantada. Esta contenção impede o uso de credenciais que anteriormente estavam expostas no código do navegador."
    />
  );
}
