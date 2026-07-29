import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Warehouse,
  MapPin,
  Camera,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { NAV_GROUPS, type NavGroup } from "@/lib/nav";
import { useAuth } from "@/lib/authStore";

const ICONS: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  ClipboardList,
  Warehouse,
  MapPin,
  Camera,
  Sparkles,
};

function GroupMenu({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[group.icon] ?? LayoutDashboard;
  const isActive = group.items.some((i) => pathname === i.to || pathname.startsWith(i.to + "/"));

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isActive
            ? "text-primary bg-sidebar-accent/60"
            : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {group.label}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-1 z-50 w-72">
          <div className="glass-card p-2 flex flex-col">
            {group.items.map((it) => {
              const active = pathname === it.to;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`px-3 py-2 rounded-md text-sm flex flex-col gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "hover:bg-accent/40 text-foreground"
                  }`}
                >
                  <span className="font-medium">{it.label}</span>
                  {it.description && (
                    <span className="text-xs text-muted-foreground">{it.description}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileNav({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span className="font-semibold gold-text">Patrimônio Inteligente</span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-md hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <nav className="p-4 flex flex-col gap-6" aria-label="Navegação principal móvel">
        {NAV_GROUPS.map((g) => {
          const Icon = ICONS[g.icon] ?? LayoutDashboard;
          return (
            <div key={g.label}>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {g.label}
              </div>
              <div className="flex flex-col">
                {g.items.map((it) => (
                  <Link
                    key={it.to}
                    to={it.to}
                    onClick={onClose}
                    className={`px-3 py-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      pathname === it.to ? "bg-primary/15 text-primary" : "hover:bg-accent/40"
                    }`}
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    navigate({ to: "/login", search: { signedOut: "1" } as any, replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-sidebar-border/60 bg-sidebar/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center gap-4">
          <Link to="/adm" className="flex items-center gap-2 shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-semibold tracking-tight gold-text">Patrimônio Inteligente</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4" aria-label="Navegação principal">
            {NAV_GROUPS.map((g) => (
              <GroupMenu key={g.label} group={g} pathname={pathname} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-xs text-muted-foreground">Sessão segura</span>
              <span className="text-sm font-medium">
                {loading ? "verificando..." : user?.name ?? "usuário autenticado"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm hover:bg-accent/40 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {signingOut ? "Saindo..." : "Sair"}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <MobileNav pathname={pathname} onClose={() => setMobileOpen(false)} />}

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 py-6">{children}</main>

      <footer className="border-t border-border/50 py-4 mt-8">
        <div className="mx-auto max-w-[1400px] px-4 text-xs text-muted-foreground flex flex-wrap gap-2 justify-between">
          <span>© {new Date().getFullYear()} Patrimônio Inteligente</span>
          <span className="tabular">v0.1 · sessão server-side</span>
        </div>
      </footer>
    </div>
  );
}
