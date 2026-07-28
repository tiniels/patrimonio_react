import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Construction } from "lucide-react";

export type Crumb = { label: string; to?: string };

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
}: {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {crumbs && crumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              {c.to ? (
                <Link to={c.to} className="hover:text-foreground transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function StubSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        {title}
      </h2>
      <div className="text-sm text-foreground/90 space-y-2">{children}</div>
    </section>
  );
}

export function PlaceholderBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-warning/15 text-warning border border-warning/30">
      <Construction className="h-3 w-3" />
      Stub — pronto para lógica
    </span>
  );
}

export function KPIGrid({ items }: { items: { label: string; value: string; hint?: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((k) => (
        <div key={k.label} className="stat-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
          <div className="mt-1 text-2xl font-semibold tabular">{k.value}</div>
          {k.hint && <div className="text-xs text-muted-foreground mt-0.5">{k.hint}</div>}
        </div>
      ))}
    </div>
  );
}
