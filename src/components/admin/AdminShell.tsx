import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BadgeAlert,
  Car,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Utilisateurs", icon: Users, exact: false },
  { to: "/admin/trips", label: "Trajets", icon: Car, exact: false },
  { to: "/admin/payments", label: "Paiements", icon: CreditCard, exact: false },
  { to: "/admin/reports", label: "Modération", icon: ShieldAlert, exact: false },
  { to: "/admin/support", label: "Support", icon: LifeBuoy, exact: false },
  { to: "/admin/audit", label: "Journal d'audit", icon: ScrollText, exact: false },
] as const;

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-muted/30">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Aller au contenu
      </a>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col lg:flex-row">
        <aside
          aria-label="Navigation administration"
          className="border-b border-border bg-card lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-e"
        >
          <div className="flex items-center gap-2 px-5 py-5">
            <Logo compact />
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-primary">
              Admin
            </span>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
            {ADMIN_NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden px-5 py-4 lg:block">
            <Link
              to="/"
              className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              ← Retour au site
            </Link>
          </div>
        </aside>

        <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
              {description ? (
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminOutlet() {
  return <Outlet />;
}

export function AdminEmpty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <BadgeAlert className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}
