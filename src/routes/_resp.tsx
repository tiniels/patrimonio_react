import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RespShell } from "@/components/RespShell";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/_resp")({
  ssr: false,
  component: () => (
    <AuthGuard allowedRoles={["responsavel"]} fallbackLoginPath="/responsavel-login">
      <RespShell>
        <Outlet />
      </RespShell>
    </AuthGuard>
  ),
});
