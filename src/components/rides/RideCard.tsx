import { useState } from "react";
import { ArrowRight, Clock, Star, ShieldCheck, Zap, Users } from "lucide-react";
import type { Ride } from "@/lib/rides";
import { useI18n } from "@/lib/i18n";
import { BookingDialog } from "./BookingDialog";

export function RideCard({ ride }: { ride: Ride }) {
  const { t, city, money } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <article className="group surface-panel rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lift">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex flex-col items-center pt-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-primary" />
            <span className="my-1 h-10 w-px bg-gradient-to-b from-primary to-accent" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold tabular-nums text-muted-foreground">
                {ride.time}
              </span>
              <h3 className="truncate text-base font-bold">{city(ride.from)}</h3>
            </div>
            <p className="my-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {ride.duration}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="truncate text-base font-bold">{city(ride.to)}</h3>
            </div>

          </div>
        </div>

        <div className="text-end">
          <p className="text-xl font-extrabold text-primary">{money(ride.price)}</p>
          <p className="text-xs text-muted-foreground">{t("common.perSeat")}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-dark">
            {ride.initials}
          </span>
          <div>
            <p className="text-sm font-semibold">{ride.driver}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber text-amber" />
              <span className="font-semibold text-foreground">{ride.rating.toFixed(1)}</span>·{" "}
              {ride.reviews} {t("common.trips")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ride.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-dark">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("trips.verified")}
            </span>
          )}
          {ride.instant && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-semibold text-amber-foreground">
              <Zap className="h-3.5 w-3.5" />
              {t("trips.instant")}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
            <Users className="h-3.5 w-3.5" />
            {ride.seats} {ride.seats === 1 ? t("trips.seatLeft") : t("trips.seatsLeft")}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            {t("trips.book")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </article>
  );
}
