import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { BOOKING_STATUS_LABEL, myBookings, setBookingStatus } from "@/lib/bookings";

export const Route = createFileRoute("/bookings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mes réservations — DiniM3ak" },
      {
        name: "description",
        content:
          "Suivez vos réservations de covoiturage DiniM3ak : statut, places réservées et montant en MAD.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Mes réservations — DiniM3ak" },
      { property: "og:description", content: "Statut et détail de vos réservations DiniM3ak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookingsPage,
});

function BookingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { money, date: fmtDate } = useI18n();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const bookingsQuery = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: () => myBookings(user!.id),
    enabled: Boolean(user?.id),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => setBookingStatus(id, "cancelled_by_passenger"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-bookings"] });
      void qc.invalidateQueries({ queryKey: ["search-trips"] });
    },
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  const bookings = bookingsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold">Mes réservations</h1>
        <p className="mt-2 text-muted-foreground">
          Suivi de vos demandes et réservations confirmées.
        </p>

        {bookingsQuery.isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>
        ) : bookingsQuery.error ? (
          <p role="alert" className="mt-8 rounded-2xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
            {(bookingsQuery.error as Error).message}
          </p>
        ) : bookings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="font-bold">Aucune réservation pour le moment.</p>
            <Link
              to="/search"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Trouver un trajet
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {bookings.map((b) => (
              <li key={b.id} className="surface-panel rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold">
                      {b.trip ? `${b.trip.from_city} → ${b.trip.to_city}` : "Trajet supprimé"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums">
                      {b.trip
                        ? `${fmtDate(new Date(b.trip.depart_date))} · ${b.trip.depart_time.slice(0, 5)} · `
                        : ""}
                      {b.seats} place(s) · {money(Number(b.total_price))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Conducteur : {b.counterpart?.first_name ?? "—"}{" "}
                      {b.counterpart?.last_name?.charAt(0) ?? ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
                      {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                    </span>
                    {(b.status === "pending" || b.status === "accepted") && (
                      <button
                        type="button"
                        onClick={() => cancel.mutate(b.id)}
                        disabled={cancel.isPending}
                        className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:border-destructive/40 hover:text-destructive disabled:opacity-60"
                      >
                        Annuler
                      </button>
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
