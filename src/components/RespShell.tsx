import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  UserCog,
  Menu,
  X,
  LogOut,
  ClipboardList,
  FileCheck2,
  ScrollText,
  ArrowLeftRight,
  Inbox,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import { RESP_NAV } from "@/lib/navResp";
import { getSession, signOut } from "@/lib/respAuth";


const ICONS: Record<string, typeof UserCog> = {
  UserCog,
  ClipboardList,
  FileCheck2,
  ScrollText,
  ArrowLeftRight,
  Inbox,
  GraduationCap,
  LayoutDashboard,
};

export function RespShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = getSession();

  function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    signOut();
    navigate({ to: "/" });
  }


  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-sidebar-border/60 bg-sidebar/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center gap-4">
          <Link to="/responsavel" className="flex items-center gap-2 shrink-0">
            <UserCog className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">
              <span className="gold-text">Patrimônio</span>{" "}
              <span className="text-muted-foreground text-sm">· Responsável</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4">
            <Link
              to="/responsavel"
              className={`px-3 h-9 inline-flex items-center rounded-md text-sm ${
                pathname === "/responsavel"
                  ? "bg-sidebar-accent/60 text-primary"
                  : "hover:bg-accent/40 text-sidebar-foreground/80"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 mr-1.5" /> Painel
            </Link>
            {RESP_NAV.map((it) => {
              const Icon = ICONS[it.icon] ?? UserCog;
              const active = pathname === it.to;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`px-3 h-9 inline-flex items-center rounded-md text-sm ${
                    active
                      ? "bg-sidebar-accent/60 text-primary"
                      : "hover:bg-accent/40 text-sidebar-foreground/80"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {it.label.split(" ")[0]}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end leading-tight max-w-[260px]">
              <span className="text-xs text-muted-foreground truncate w-full text-right">
                {user?.setor ?? "Responsável"}
              </span>
              <span className="text-sm font-medium truncate w-full text-right">
                {user?.responsavel ?? "—"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm hover:bg-accent/40"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-accent/40"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

        </div>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-semibold gold-text">Responsável</span>
            <button onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-accent/40">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4 flex flex-col gap-1">
            <Link
              to="/responsavel"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-md text-sm hover:bg-accent/40"
            >
              Painel
            </Link>
            {RESP_NAV.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm ${
                  pathname === it.to ? "bg-primary/15 text-primary" : "hover:bg-accent/40"
                }`}
              >
                {it.label}
              </Link>
            ))}
            <button
              onClick={(e) => {
                setMobileOpen(false);
                handleLogout(e);
              }}
              className="mt-4 px-3 py-2 rounded-md text-sm text-left hover:bg-accent/40 inline-flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </nav>

        </div>
      )}

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 py-6">{children}</main>

      <footer className="border-t border-border/50 py-4 mt-8">
        <div className="mx-auto max-w-[1400px] px-4 text-xs text-muted-foreground flex flex-wrap gap-2 justify-between">
          <span>© {new Date().getFullYear()} Patrimônio Inteligente</span>
          <span className="tabular">Área do responsável</span>
        </div>
      </footer>
    </div>
  );
}
