import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { SearchBar } from "@/components/rides/SearchBar";
import { RideCard } from "@/components/rides/RideCard";
import { useI18n } from "@/lib/i18n";
import { searchTrips, tripToRide } from "@/lib/trips";


const searchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
  seats: z.coerce.number().min(1).max(4).optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Rechercher un trajet — DiniM3ak" },
      {
        name: "description",
        content:
          "Comparez les trajets de covoiturage au Maroc : horaires 24h, prix en MAD et conducteurs vérifiés.",
      },
      { property: "og:title", content: "Rechercher un trajet — DiniM3ak" },
      {
        property: "og:description",
        content: "Trouvez votre covoiturage au Maroc : prix en MAD et conducteurs vérifiés.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/search" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

type Sort = "early" | "price" | "rating";

function SearchPage() {
  const params = Route.useSearch();
  const { t } = useI18n();
  const [sort, setSort] = useState<Sort>("early");
  const [maxPrice, setMaxPrice] = useState(300);

  const { data: trips = [], isLoading, error } = useQuery({
    queryKey: ["search-trips", params.from, params.to, params.date, params.seats],
    queryFn: () =>
      searchTrips({
        ...(params.from ? { from: params.from } : {}),
        ...(params.to ? { to: params.to } : {}),
        ...(params.date ? { date: params.date } : {}),
        ...(params.seats ? { seats: params.seats } : {}),
      }),
  });

  const results = useMemo(() => {
    const list = trips.map(tripToRide).filter((r) => r.price <= maxPrice);
    return [...list].sort((a, b) => {
      if (sort === "price") return a.price - b.price;
      if (sort === "rating") return b.rating - a.rating;
      return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
    });
  }, [trips, sort, maxPrice]);


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SearchBar initial={params} variant="inline" />

        <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="surface-panel h-fit rounded-2xl p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              {t("filters.title")}
            </h2>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("filters.sort")}
              </p>
              <div className="mt-3 space-y-1.5">
                {(
                  [
                    ["early", t("filters.sort.early")],
                    ["price", t("filters.sort.price")],
                    ["rating", t("filters.sort.rating")],
                  ] as [Sort, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={`w-full rounded-lg px-3 py-2 text-start text-sm font-semibold transition-colors ${
                      sort === key
                        ? "bg-primary-soft text-primary-dark"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("filters.max")}
              </p>
              <input
                type="range"
                min={30}
                max={300}
                step={10}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--primary)]"
              />
              <p className="mt-1 text-sm font-bold tabular-nums text-primary">{maxPrice} MAD</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSort("early");
                setMaxPrice(300);
              }}
              className="mt-8 w-full rounded-full border border-border py-2 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary"
            >
              {t("filters.reset")}
            </button>
          </aside>

          <section>
            <h1 className="text-2xl font-extrabold">
              {isLoading ? "…" : results.length} {t("trips.results")}
            </h1>
            {isLoading ? (
              <div className="mt-6 grid gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : error ? (
              <div className="mt-8 rounded-2xl border border-dashed border-destructive/40 p-12 text-center">
                <p className="font-bold">{(error as Error).message}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="font-bold">{t("trips.empty")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t("trips.emptyHint")}</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {results.map((r) => (
                  <RideCard key={r.id} ride={r} />
                ))}
              </div>
            )}
          </section>

          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
