import { Link } from "@tanstack/react-router";
import { Menu, X, Plus } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export function SiteHeader() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/search" as const, label: t("nav.search") },
    { to: "/publish" as const, label: t("nav.publish") },
    { to: "/how-it-works" as const, label: t("nav.how") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-4 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:bg-primary-soft hover:text-primary-dark"
              activeProps={{ className: "bg-primary-soft text-primary-dark" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="hidden rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary sm:inline-flex"
            >
              {t("nav.logout")}
            </button>
          ) : (
            <Link
              to="/auth"
              className="hidden rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary sm:inline-flex"
            >
              {t("nav.login")}
            </Link>
          )}
          <Link
            to="/publish"
            className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            {t("nav.publish")}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-semibold text-foreground/80 hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
