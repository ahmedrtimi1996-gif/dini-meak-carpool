import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Star,
  MessageSquare,
  CreditCard,
  Headphones,
  Search,
  CheckCircle2,
  Car,
  Leaf,
  Users,
  MapPinned,
  UserRound,
} from "lucide-react";
import heroRoad from "@/assets/hero-road.jpg";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { SearchBar } from "@/components/rides/SearchBar";
import { RideCard } from "@/components/rides/RideCard";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { POPULAR_ROUTES, RIDES } from "@/lib/rides";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DiniM3ak — Covoiturage au Maroc, voyagez ensemble" },
      {
        name: "description",
        content:
          "DiniM3ak relie conducteurs et passagers partout au Maroc. Trouvez un trajet en MAD, réservez en confiance et économisez sur chaque route.",
      },
      { property: "og:title", content: "DiniM3ak — Covoiturage au Maroc, voyagez ensemble" },
      {
        property: "og:description",
        content: "DiniM3ak relie conducteurs et passagers partout au Maroc. Trouvez un trajet en MAD, réservez en confiance et économisez sur chaque route.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "DiniM3ak",
          slogan: "Voyagez ensemble, économisez davantage.",
          areaServed: "MA",
          url: "/",
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { t, city, money } = useI18n();
  const { user } = useAuth();
  const featured = RIDES.slice(0, 4);

  const stats = [
    { icon: Users, value: "48 000+", label: t("stats.members") },
    { icon: MapPinned, value: "63", label: t("stats.routes") },
    { icon: CreditCard, value: "120 MAD", label: t("stats.saved") },
    { icon: Leaf, value: "1 400 t", label: t("stats.co2") },
  ];

  const steps = [
    { icon: Search, title: t("how.s1.title"), text: t("how.s1.text") },
    { icon: CheckCircle2, title: t("how.s2.title"), text: t("how.s2.text") },
    { icon: Car, title: t("how.s3.title"), text: t("how.s3.text") },
  ];

  const trust = [
    { icon: ShieldCheck, title: t("trust.t1"), text: t("trust.t1.text") },
    { icon: Star, title: t("trust.t2"), text: t("trust.t2.text") },
    { icon: CreditCard, title: t("trust.t3"), text: t("trust.t3.text") },
    { icon: Headphones, title: t("trust.t4"), text: t("trust.t4.text") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <img
            src={heroRoad}
            alt="Voiture sur une route côtière marocaine au coucher du soleil"
            width={1600}
            height={1104}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/90 via-primary-dark/70 to-primary-dark/95" />
          <div className="relative mx-auto w-full max-w-7xl px-4 pb-32 pt-20 sm:px-6 lg:px-8 lg:pt-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground backdrop-blur">
              {t("hero.badge")}
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] text-primary-foreground sm:text-5xl lg:text-6xl">
              {t("hero.title")}
              <br />
              <span className="text-amber">{t("hero.titleAccent")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-primary-foreground px-6 py-3 text-sm font-bold text-primary-dark shadow-glow transition-transform hover:-translate-y-0.5"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  Mon espace conducteur
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 rounded-full bg-primary-foreground px-6 py-3 text-sm font-bold text-primary-dark shadow-glow transition-transform hover:-translate-y-0.5"
                  >
                    {t("nav.signup")}
                  </Link>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-primary-foreground backdrop-blur transition-colors hover:bg-white/20"
                  >
                    {t("nav.login")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>


        {/* Search bar overlapping hero */}
        <section className="relative z-10 mx-auto -mt-20 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <SearchBar />
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("search.popular")}
            </span>
            {POPULAR_ROUTES.slice(0, 4).map((r) => (
              <Link
                key={`${r.from}-${r.to}`}
                to="/search"
                search={{ from: r.from, to: r.to }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary"
              >
                {city(r.from)}
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                {city(r.to)}
                <span className="text-muted-foreground">{money(r.price)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mx-auto mt-20 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface p-6">
                <s.icon className="h-5 w-5 text-primary" />
                <p className="mt-4 text-2xl font-extrabold tracking-tight">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming rides */}
        <section className="mx-auto mt-24 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold">{t("trips.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("trips.subtitle")}</p>
            </div>
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-dark"
            >
              {t("trips.viewAll")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {featured.map((r) => (
              <RideCard key={r.id} ride={r} />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-24 bg-surface py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold">{t("how.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("how.subtitle")}</p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.title} className="surface-panel rounded-2xl p-7">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-primary-foreground">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-extrabold text-muted-foreground">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="mx-auto mt-24 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold">{t("trust.title")}</h2>
          <p className="mt-2 text-muted-foreground">{t("trust.subtitle")}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border p-6">
                <item.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Driver CTA */}
        <section className="mx-auto mt-24 mb-24 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl gradient-brand px-8 py-14 text-primary-foreground sm:px-14">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                {t("driver.title")}
              </h2>
              <p className="mt-4 text-primary-foreground/85">{t("driver.text")}</p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {[t("driver.b1"), t("driver.b2"), t("driver.b3")].map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm font-semibold">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to="/publish"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3.5 text-sm font-bold text-amber-foreground transition-transform hover:-translate-y-0.5"
              >
                {t("driver.cta")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
