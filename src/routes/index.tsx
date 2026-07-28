import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, UserCog, ArrowRight, Building2, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/authStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — Patrimônio Inteligente" },
      {
        name: "description",
        content:
          "Escolha o tipo de acesso: servidor/administrador ou responsável de setor no sistema de gestão patrimonial.",
      },
    ],
  }),
  component: RolePicker,
});

function RolePicker() {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/60 bg-sidebar/60 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-[1200px] px-4 h-14 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight gold-text">Patrimônio Inteligente</span>
          <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
            Prefeitura de Santana de Parnaíba
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1200px] px-4 py-12 md:py-16 flex flex-col items-center">
        {/* Banner de Sessão Ativa caso usuário já esteja logado */}
        {isAuthenticated && user && (
          <div className="w-full max-w-3xl mb-8 p-4 rounded-xl glass-card border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-left">
              <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Sessão ativa detectada</div>
                <div className="text-sm font-bold text-foreground">{user.name} ({user.roleLabel})</div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to={
                  user.role === "chefia"
                    ? "/_app/chefia"
                    : user.role === "galpao"
                    ? "/_app/galpao/graficos"
                    : user.role === "responsavel"
                    ? "/responsavel"
                    : "/adm"
                }
                className="flex-1 sm:flex-none h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                Ir para o Painel <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="h-9 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center gap-1 transition-colors"
                title="Encerrar sessão"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>
          </div>
        )}

        <div className="text-center max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary/80 mb-3 font-semibold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <Building2 className="h-3.5 w-3.5" />
            Portal Único de Acesso
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Como você deseja <span className="gold-text">entrar</span>?
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Selecione o seu perfil funcional para ser direcionado ao ambiente correspondente.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 w-full max-w-3xl">
          <RoleCard
            to="/login"
            icon={ShieldCheck}
            title="Administrador / Servidor"
            subtitle="Contabilidade · Chefia · Galpão"
            description="Gestão completa do inventário, consultas, transferências, galpão e emissão de documentos."
            bullets={["Buscar patrimônios e responsáveis", "Gerenciar transferências e baixas", "Monitoramento de inventário"]}
            accent="primary"
          />
          <RoleCard
            to="/responsavel-login"
            icon={UserCog}
            title="Responsável de Setor"
            subtitle="Servidor Responsável por Local"
            description="Acesso exclusivo aos bens do seu setor, conferência, aceite de transferências e solicitações."
            bullets={["Inventário e conferência local", "Avaliar e solicitar baixas de bens", "Aceite de transferências pendentes"]}
            accent="accent"
          />
        </div>

        <div className="mt-10 text-xs text-muted-foreground text-center">
          Ao continuar você será direcionado para a tela de autenticação do perfil escolhido.
        </div>
      </main>

      <footer className="border-t border-border/50 py-4 mt-auto">
        <div className="mx-auto max-w-[1200px] px-4 text-xs text-muted-foreground flex justify-between items-center">
          <span>© {new Date().getFullYear()} Prefeitura de Santana de Parnaíba · Patrimônio Inteligente</span>
          <span className="font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded">v2.0 Clean & Fast</span>
        </div>
      </footer>
    </div>
  );
}

function RoleCard({
  to,
  icon: Icon,
  title,
  subtitle,
  description,
  bullets,
  accent,
}: {
  to: string;
  icon: typeof ShieldCheck;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  accent: "primary" | "accent";
}) {
  const ring =
    accent === "primary"
      ? "hover:border-primary/60 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]"
      : "hover:border-accent/60 hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)]";
  const iconBg = accent === "primary" ? "bg-primary/15 text-primary border border-primary/20" : "bg-accent/20 text-accent-foreground border border-accent/30";

  return (
    <Link
      to={to}
      className={`group glass-card p-6 flex flex-col gap-4 border border-border/60 transition-all duration-200 rounded-xl ${ring}`}
    >
      <div className="flex items-start justify-between">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{subtitle}</div>
        <h2 className="text-xl font-bold mt-1 text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <ul className="mt-auto pt-2 flex flex-col gap-2 text-xs text-foreground/90 border-t border-border/40">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${accent === "primary" ? "bg-primary" : "bg-accent"}`} />
            {b}
          </li>
        ))}
      </ul>
    </Link>
  );
}
