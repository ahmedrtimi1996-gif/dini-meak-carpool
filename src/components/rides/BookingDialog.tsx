import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Minus, Plus, X } from "lucide-react";
import type { Ride } from "@/lib/rides";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { bookingErrorMessage, createBooking, type BookingRow } from "@/lib/bookings";

export function BookingDialog({ ride, onClose }: { ride: Ride; onClose: () => void }) {
  const { money } = useI18n();
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState<BookingRow | null>(null);

  const mutation = useMutation({
    mutationFn: () => createBooking({ tripId: ride.id, seats, message }),
    onSuccess: (row) => {
      setBooking(row);
      void qc.invalidateQueries({ queryKey: ["search-trips"] });
      void qc.invalidateQueries({ queryKey: ["my-bookings"] });
      void qc.invalidateQueries({ queryKey: ["driver-bookings"] });
    },
  });

  const total = ride.price * seats;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Réserver ce trajet"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lift">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">
              {ride.from} → {ride.to}
            </h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums">
              {ride.date} · {ride.time} · {money(ride.price)} / place
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {booking ? (
          <div className="mt-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
            <p className="mt-3 font-extrabold">
              {booking.status === "accepted"
                ? "Réservation confirmée !"
                : "Demande envoyée au conducteur"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {booking.seats} place(s) · {money(Number(booking.total_price))} · réf.{" "}
              {booking.id.slice(0, 8)}
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/bookings"
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground"
              >
                Mes réservations
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>
        ) : !user ? (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour réserver une place sur ce trajet.
            </p>
            <Link
              to="/auth"
              className="mt-5 block rounded-full bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground"
            >
              Se connecter
            </Link>
          </div>
        ) : (
          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Places
            </p>
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                aria-label="Moins de places"
                onClick={() => setSeats((s) => Math.max(1, s - 1))}
                className="grid h-9 w-9 place-items-center rounded-full border border-border"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="w-8 text-center text-lg font-extrabold tabular-nums">{seats}</span>
              <button
                type="button"
                aria-label="Plus de places"
                onClick={() => setSeats((s) => Math.min(ride.seats, s + 1))}
                className="grid h-9 w-9 place-items-center rounded-full border border-border"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="text-xs text-muted-foreground">
                {ride.seats} place(s) disponible(s)
              </span>
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Message au conducteur (optionnel)
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm"
                placeholder="Point de rendez-vous, bagages…"
              />
            </label>

            <p className="mt-5 flex items-center justify-between text-sm font-bold">
              <span>Total</span>
              <span className="text-primary">{money(total)}</span>
            </p>

            {mutation.isError && (
              <p role="alert" className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                {bookingErrorMessage(mutation.error)}
              </p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Confirmer la réservation
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
