import { Link } from "@tanstack/react-router";
import { Menu, X, Plus, UserRound, LayoutDashboard, ShieldCheck, LogOut, Ticket, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { NotificationBell } from "./NotificationBell";
import { unreadMessageCount } from "@/lib/messaging";

export function SiteHeader() {
  const { t } = useI18n();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: () => unreadMessageCount(user?.id as string),
    enabled: Boolean(user?.id),
    refetchInterval: 60_000,
  });

  const links = [
    { to: "/search" as const, label: t("nav.search") },
    { to: "/publish" as const, label: t("nav.publish") },
    { to: "/how-it-works" as const, label: t("nav.how") },
  ];

  const initials =
    `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.trim().toUpperCase() ||
    (user?.email?.[0]?.toUpperCase() ?? "?");

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
          {user && <NotificationBell />}

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="inline-flex items-center gap-2 rounded-full border border-border py-1.5 pe-3 ps-1.5 text-sm font-semibold transition-colors hover:border-primary/40"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xs font-extrabold text-primary-dark">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </span>
                <span className="hidden sm:inline">Mon profil</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute end-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-background p-1.5 shadow-xl"
                >
                  <Link
                    to="/profile/edit"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                    Mon profil
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    Messages
                    {unreadMessages > 0 && (
                      <span className="ms-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/bookings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    <Ticket className="h-4 w-4" aria-hidden="true" />
                    Mes réservations
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Mon espace conducteur
                  </Link>
                  <Link
                    to="/verification"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Vérification
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
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
          {user ? (
            <>
              <Link
                to="/profile/edit"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-foreground/80 hover:bg-muted"
              >
                Mon profil
              </Link>
              <Link
                to="/messages"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-foreground/80 hover:bg-muted"
              >
                Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ""}
              </Link>
              <Link
                to="/bookings"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-foreground/80 hover:bg-muted"
              >
                Mes réservations
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-foreground/80 hover:bg-muted"
              >
                Mon espace conducteur
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="block w-full rounded-lg px-3 py-3 text-start text-sm font-semibold text-destructive hover:bg-muted"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-semibold text-foreground/80 hover:bg-muted"
            >
              {t("nav.login")}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
