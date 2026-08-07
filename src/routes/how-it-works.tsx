import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  CheckCircle2,
  Car,
  ShieldCheck,
  Star,
  CreditCard,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "Comment fonctionne DiniM3ak — Covoiturage au Maroc" },
      {
        name: "description",
        content:
          "Rechercher, réserver, voyager : découvrez les trois étapes du covoiturage DiniM3ak et nos garanties de sécurité au Maroc.",
      },
      { property: "og:title", content: "Comment fonctionne DiniM3ak" },
      {
        property: "og:description",
        content: "Trois étapes pour voyager ensemble au Maroc, en toute sécurité.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/how-it-works" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/how-it-works" }],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  const { t } = useI18n();

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

      <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("how.pageTitle")}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("how.subtitle")}</p>

        <ol className="mt-12 space-y-5">
          {steps.map((s, i) => (
            <li key={s.title} className="surface-panel flex gap-5 rounded-2xl p-7">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-brand text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                  0{i + 1}
                </p>
                <h2 className="mt-1 text-lg font-bold">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="mt-16 text-2xl font-extrabold">{t("trust.title")}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {trust.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border p-6">
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            {t("nav.search")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <Link
            to="/publish"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-bold transition-colors hover:border-primary/40 hover:text-primary"
          >
            {t("nav.publish")}
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
