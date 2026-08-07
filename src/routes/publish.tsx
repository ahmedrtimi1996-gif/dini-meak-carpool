import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MapPin, Navigation } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { useI18n } from "@/lib/i18n";
import { MOROCCAN_CITIES } from "@/lib/rides";

export const Route = createFileRoute("/publish")({
  head: () => ({
    meta: [
      { title: "Publier un trajet — DiniM3ak" },
      {
        name: "description",
        content:
          "Publiez votre trajet en une minute sur DiniM3ak : fixez votre prix par place en MAD et partagez les frais de route.",
      },
      { property: "og:title", content: "Publier un trajet — DiniM3ak" },
      {
        property: "og:description",
        content: "Rentabilisez vos places vides : publication gratuite, vous validez chaque demande.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/publish" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/publish" }],
  }),
  component: PublishPage,
});

type Draft = {
  from: string;
  to: string;
  date: string;
  time: string;
  price: string;
  seats: number;
  car: string;
  notes: string;
};

const empty: Draft = {
  from: "",
  to: "",
  date: "",
  time: "",
  price: "",
  seats: 2,
  car: "",
  notes: "",
};

function PublishPage() {
  const { t, money, date: fmtDate } = useI18n();
  const [draft, setDraft] = useState<Draft>(empty);
  const [submitted, setSubmitted] = useState<Draft | null>(null);

  const label = "block text-xs font-bold uppercase tracking-widest text-muted-foreground";
  const input =
    "mt-2 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold outline-none transition-colors focus:border-primary";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold">{t("publish.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("publish.subtitle")}</p>

        <form
          className="surface-panel mt-10 space-y-8 rounded-2xl p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(draft);
          }}
        >
          <fieldset>
            <legend className="text-sm font-extrabold">{t("publish.route")}</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="from">
                  <MapPin className="me-1 inline h-3.5 w-3.5 text-primary" />
                  {t("search.from")}
                </label>
                <input
                  id="from"
                  required
                  list="dm-publish-cities"
                  className={input}
                  value={draft.from}
                  onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                  placeholder={t("search.fromPlaceholder")}
                />
              </div>
              <div>
                <label className={label} htmlFor="to">
                  <Navigation className="me-1 inline h-3.5 w-3.5 text-accent" />
                  {t("search.to")}
                </label>
                <input
                  id="to"
                  required
                  list="dm-publish-cities"
                  className={input}
                  value={draft.to}
                  onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                  placeholder={t("search.toPlaceholder")}
                />
              </div>
            </div>
            <datalist id="dm-publish-cities">
              {MOROCCAN_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={label} htmlFor="date">
                {t("publish.when")}
              </label>
              <input
                id="date"
                type="date"
                required
                className={input}
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="time">
                {t("publish.time")}
              </label>
              <input
                id="time"
                type="time"
                required
                step={300}
                className={input}
                value={draft.time}
                onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="seats">
                {t("search.seats")}
              </label>
              <select
                id="seats"
                className={input}
                value={draft.seats}
                onChange={(e) => setDraft({ ...draft, seats: Number(e.target.value) })}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="price">
                {t("publish.price")}
              </label>
              <input
                id="price"
                type="number"
                min={10}
                max={2000}
                required
                className={input}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                placeholder="120"
              />
            </div>
            <div>
              <label className={label} htmlFor="car">
                {t("publish.car")}
              </label>
              <input
                id="car"
                className={input}
                value={draft.car}
                onChange={(e) => setDraft({ ...draft, car: e.target.value })}
                placeholder={t("publish.carPlaceholder")}
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="notes">
              {t("publish.notes")}
            </label>
            <textarea
              id="notes"
              rows={4}
              className={input}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder={t("publish.notesPlaceholder")}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
          >
            {t("publish.submit")}
          </button>
        </form>

        {submitted && (
          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary-soft p-6">
            <p className="flex items-center gap-2 font-bold text-primary-dark">
              <CheckCircle2 className="h-5 w-5" />
              {t("publish.success")}
            </p>
            <p className="mt-1 text-sm text-primary-dark/80">{t("publish.successText")}</p>
            <dl className="mt-4 grid gap-2 text-sm text-primary-dark">
              <div className="flex justify-between gap-4">
                <dt>{t("publish.route")}</dt>
                <dd className="font-bold">
                  {submitted.from} → {submitted.to}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>{t("publish.when")}</dt>
                <dd className="font-bold tabular-nums">
                  {submitted.date ? fmtDate(new Date(submitted.date)) : "—"} · {submitted.time}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>{t("publish.price")}</dt>
                <dd className="font-bold">
                  {money(Number(submitted.price || 0))} {t("common.perSeat")} ×{submitted.seats}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
