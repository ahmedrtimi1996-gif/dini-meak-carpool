import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Loader2, Pause, Play, Plus, ShieldCheck, Users } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { myTrips, tripBookingCounts, updateTripStatus } from "@/lib/trips";
import { canPublish, fetchPublishRequirements } from "@/lib/verification";
import { RequirementChecklist } from "@/components/profile/RequirementChecklist";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mon espace conducteur — DiniM3ak" },
      {
        name: "description",
        content:
          "Gérez vos trajets DiniM3ak publiés, suivez vos demandes de réservation et l'état de votre vérification conducteur.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Mon espace conducteur — DiniM3ak" },
      { property: "og:description", content: "Vos trajets, demandes et vérifications au même endroit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const { money, date: fmtDate } = useI18n();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const tripsQuery = useQuery({
    queryKey: ["my-trips", user?.id],
    queryFn: () => myTrips(user!.id),
    enabled: Boolean(user?.id),
  });

  const trips = tripsQuery.data ?? [];

  const countsQuery = useQuery({
    queryKey: ["my-trip-bookings", trips.map((t) => t.id).join(",")],
    queryFn: () => tripBookingCounts(trips.map((t) => t.id)),
    enabled: trips.length > 0,
  });

  const reqQuery = useQuery({
    queryKey: ["publish-requirements", user?.id],
    queryFn: () => fetchPublishRequirements(user!.id),
    enabled: Boolean(user?.id),
  });

  const toggle = useMutation({
    mutationFn: (args: { id: string; status: "published" | "paused" }) =>
      updateTripStatus(args.id, args.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-trips"] }),
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  const allowed = canPublish(reqQuery.data ?? null);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">
              Bonjour {profile?.first_name ?? "conducteur"} 👋
            </h1>
            <p className="mt-2 text-muted-foreground">
              Vos trajets publiés et l'état de votre dossier conducteur.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-primary/40"
            >
              <Car className="h-4 w-4" aria-hidden="true" />
              Véhicules
            </Link>
            <Link
              to="/publish"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Publier
            </Link>
          </div>
        </div>

        {!allowed ? (
          <div className="mt-8">
            <RequirementChecklist requirements={reqQuery.data ?? null} />
          </div>
        ) : (
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-4 py-2 text-sm font-bold text-primary-dark">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Dossier conducteur validé — vous pouvez publier des trajets
          </p>
        )}

        <h2 className="mt-12 text-xl font-extrabold">Mes trajets</h2>
        {tripsQuery.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
        ) : trips.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aucun trajet publié pour le moment.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {trips.map((trip) => (
              <li key={trip.id} className="surface-panel rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold">
                      {trip.from_city} → {trip.to_city}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums">
                      {fmtDate(new Date(trip.depart_date))} · {trip.depart_time.slice(0, 5)} ·{" "}
                      {money(Number(trip.price))} / place · {trip.seats_available}/{trip.seats_total}{" "}
                      places libres
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {countsQuery.data?.get(trip.id) ?? 0} demande(s)
                    </span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary-dark">
                      {trip.status}
                    </span>
                    {trip.status === "published" || trip.status === "paused" ? (
                      <button
                        type="button"
                        onClick={() =>
                          toggle.mutate({
                            id: trip.id,
                            status: trip.status === "published" ? "paused" : "published",
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:border-primary/40"
                      >
                        {trip.status === "published" ? (
                          <>
                            <Pause className="h-3.5 w-3.5" aria-hidden="true" /> Mettre en pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" aria-hidden="true" /> Republier
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-12 text-xl font-extrabold">Réservations reçues</h2>
        {driverBookingsQuery.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
        ) : (driverBookingsQuery.data ?? []).length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aucune réservation reçue pour le moment.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(driverBookingsQuery.data ?? []).map((b) => (
              <li key={b.id} className="surface-panel rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold">
                      {b.trip ? `${b.trip.from_city} → ${b.trip.to_city}` : "Trajet supprimé"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums">
                      {b.counterpart?.first_name ?? "Passager"}{" "}
                      {b.counterpart?.last_name?.charAt(0) ?? ""} · {b.seats} place(s) ·{" "}
                      {money(Number(b.total_price))}
                    </p>
                    {b.message ? (
                      <p className="mt-1 text-xs text-muted-foreground">« {b.message} »</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
                      {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                    </span>
                    {b.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => decide.mutate({ id: b.id, status: "accepted" })}
                          disabled={decide.isPending}
                          className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
                        >
                          Accepter
                        </button>
                        <button
                          type="button"
                          onClick={() => decide.mutate({ id: b.id, status: "rejected" })}
                          disabled={decide.isPending}
                          className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:border-destructive/40 hover:text-destructive disabled:opacity-60"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
