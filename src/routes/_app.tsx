import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AuthGuard allowedRoles={["admin", "contabilidade", "chefia", "galpao"]}>
      <AppShell>
        <Outlet />
      </AppShell>
    </AuthGuard>
  );
}
