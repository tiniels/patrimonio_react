import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/adm")({
  component: AdmLayout,
});

function AdmLayout() {
  return <Outlet />;
}
