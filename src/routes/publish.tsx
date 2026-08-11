import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MapPin, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { RequirementChecklist } from "@/components/profile/RequirementChecklist";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { MOROCCAN_CITIES } from "@/lib/rides";
import { canPublish, fetchPublishRequirements, fetchVehicleStatuses } from "@/lib/verification";
import { myVehicles } from "@/lib/profiles";
import { commissionFor } from "@/lib/trips";
import { createTrip } from "@/lib/trips";

export const Route = createFileRoute("/publish")({
  ssr: false,
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
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublishPage,
});

type Draft = {
  from: string;
  to: string;
  date: string;
  time: string;
  arriveTime: string;
  price: string;
  seats: number;
  vehicleId: string;
  meetingPoint: string;
  arrivalPoint: string;
  notes: string;
  instant: boolean;
  womenOnly: boolean;
  pets: boolean;
  smoking: boolean;
  luggage: string;
};

const empty: Draft = {
  from: "",
  to: "",
  date: "",
  time: "",
  arriveTime: "",
  price: "",
  seats: 2,
  vehicleId: "",
  meetingPoint: "",
  arrivalPoint: "",
  notes: "",
  instant: false,
  womenOnly: false,
  pets: false,
  smoking: false,
  luggage: "medium",
};

function PublishPage() {
  const { t, money, date: fmtDate } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const reqQuery = useQuery({
    queryKey: ["publish-requirements", user?.id],
    queryFn: () => fetchPublishRequirements(user!.id),
    enabled: Boolean(user?.id),
  });

  const vehiclesQuery = useQuery({
    queryKey: ["my-vehicles", user?.id],
    queryFn: () => myVehicles(user!.id),
    enabled: Boolean(user?.id),
  });

  const vehicleStatusQuery = useQuery({
    queryKey: ["vehicle-statuses", user?.id],
    queryFn: () => fetchVehicleStatuses(user!.id),
    enabled: Boolean(user?.id),
  });


  const publish = useMutation({
    mutationFn: async (d: Draft) =>
      createTrip({
        from_city: d.from,
        to_city: d.to,
        depart_date: d.date,
        depart_time: d.time,
        arrive_time: d.arriveTime || null,
        seats_total: d.seats,
        price: Number(d.price),
        vehicle_id: d.vehicleId || null,
        meeting_point: d.meetingPoint,
        arrival_point: d.arrivalPoint,
        description: d.notes,
        instant_booking: d.instant,
        women_only: d.womenOnly,
        pets_allowed: d.pets,
        smoking_allowed: d.smoking,
        luggage: d.luggage,
      }),
    onError: (e: Error) => setError(e.message),
  });

  const vehicles = vehiclesQuery.data ?? [];
  const vehicleStatuses = vehicleStatusQuery.data ?? new Map<string, string>();
  const verifiedVehicles = vehicles.filter((v) => vehicleStatuses.get(v.id) === "approved");
  const hasVerifiedVehicle = verifiedVehicles.length > 0;
  const selectedVehicleVerified =
    Boolean(draft.vehicleId) && vehicleStatuses.get(draft.vehicleId) === "approved";
  const allowed = canPublish(reqQuery.data ?? null) && hasVerifiedVehicle;
  const label = "block text-xs font-bold uppercase tracking-widest text-muted-foreground";
  const input =
    "mt-2 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold outline-none transition-colors focus:border-primary";

  if (loading || !user || reqQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  const created = publish.data;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold">{t("publish.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("publish.subtitle")}</p>

        {!allowed ? (
          <div className="mt-8">
            <RequirementChecklist requirements={reqQuery.data ?? null} />
          </div>
        ) : null}

        {created ? (
          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary-soft p-6">
            <p className="flex items-center gap-2 font-bold text-primary-dark">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              {t("publish.success")}
            </p>
            <p className="mt-1 text-sm text-primary-dark/80">
              Votre trajet {created.from_city} → {created.to_city} du{" "}
              {fmtDate(new Date(created.depart_date))} est en ligne.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                Voir mes trajets
              </Link>
              <button
                type="button"
                onClick={() => {
                  publish.reset();
                  setDraft(empty);
                }}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
              >
                Publier un autre trajet
              </button>
            </div>
          </div>
        ) : (
          <form
            className="surface-panel mt-10 space-y-8 rounded-2xl p-6 sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              if (!allowed) {
                setError("Vérification incomplète : complétez les éléments listés ci-dessus.");
                return;
              }
              publish.mutate(draft);
            }}
          >
            <fieldset disabled={!allowed || publish.isPending} className="space-y-8">
              <div>
                <legend className="text-sm font-extrabold">{t("publish.route")}</legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="from">
                      <MapPin className="me-1 inline h-3.5 w-3.5 text-primary" aria-hidden="true" />
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
                      <Navigation className="me-1 inline h-3.5 w-3.5 text-accent" aria-hidden="true" />
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="meeting">
                    Point de rendez-vous
                  </label>
                  <input
                    id="meeting"
                    className={input}
                    value={draft.meetingPoint}
                    onChange={(e) => setDraft({ ...draft, meetingPoint: e.target.value })}
                    placeholder="Gare Casa-Voyageurs"
                  />
                </div>
                <div>
                  <label className={label} htmlFor="arrival">
                    Point d'arrivée
                  </label>
                  <input
                    id="arrival"
                    className={input}
                    value={draft.arrivalPoint}
                    onChange={(e) => setDraft({ ...draft, arrivalPoint: e.target.value })}
                    placeholder="Place Jemaa el-Fna"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className={label} htmlFor="date">
                    {t("publish.when")}
                  </label>
                  <input
                    id="date"
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
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
                  <label className={label} htmlFor="arriveTime">
                    Arrivée estimée
                  </label>
                  <input
                    id="arriveTime"
                    type="time"
                    step={300}
                    className={input}
                    value={draft.arriveTime}
                    onChange={(e) => setDraft({ ...draft, arriveTime: e.target.value })}
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
                    {[1, 2, 3, 4, 5, 6].map((n) => (
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
                  {Number(draft.price) > 0 ? (
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      Commission plateforme : {money(commissionFor(Number(draft.price)))} par place
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className={label} htmlFor="vehicle">
                    {t("publish.car")}
                  </label>
                  <select
                    id="vehicle"
                    className={input}
                    value={draft.vehicleId}
                    onChange={(e) => setDraft({ ...draft, vehicleId: e.target.value })}
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {(vehiclesQuery.data ?? []).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} {v.color ? `· ${v.color}` : ""}
                      </option>
                    ))}
                  </select>
                  <Link
                    to="/vehicles"
                    className="mt-2 inline-block text-xs font-bold text-primary underline-offset-4 hover:underline"
                  >
                    Gérer mes véhicules
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["instant", "Réservation instantanée"],
                    ["womenOnly", "Trajet réservé aux femmes"],
                    ["pets", "Animaux acceptés"],
                    ["smoking", "Fumeur autorisé"],
                  ] as const
                ).map(([key, text]) => (
                  <label key={key} className="flex items-center gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--color-primary)]"
                      checked={draft[key]}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                    />
                    {text}
                  </label>
                ))}
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

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {publish.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {t("publish.submit")}
              </button>
            </fieldset>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
