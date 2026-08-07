import { Link } from "@tanstack/react-router";
import { LogoMark } from "./Logo";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="text-lg font-extrabold tracking-tight">
              Dini<span className="text-primary">M3ak</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("footer.morocco")} · MAD · DD/MM/YYYY · 24h
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold">{t("footer.product")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/search" className="hover:text-primary">
                {t("nav.search")}
              </Link>
            </li>
            <li>
              <Link to="/publish" className="hover:text-primary">
                {t("nav.publish")}
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="hover:text-primary">
                {t("nav.how")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold">{t("footer.legal")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>{t("footer.terms")}</li>
            <li>{t("footer.privacy")}</li>
            <li>{t("footer.cookies")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DiniM3ak — {t("footer.rights")}
      </div>
    </footer>
  );
}
