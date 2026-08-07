import { useNavigate } from "@tanstack/react-router";
import { MapPin, Navigation, CalendarDays, Users, Search } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { MOROCCAN_CITIES } from "@/lib/rides";

type Props = {
  initial?: { from?: string; to?: string; date?: string; seats?: number };
  variant?: "hero" | "inline";
};

export function SearchBar({ initial, variant = "hero" }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [seats, setSeats] = useState(initial?.seats ?? 1);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/search",
      search: { from: from || undefined, to: to || undefined, date: date || undefined, seats },
    });
  }

  const field =
    "w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground";
  const cell =
    "flex items-center gap-2.5 px-4 py-3 border-border md:border-e last:md:border-e-0 rtl:md:border-s rtl:md:border-e-0";

  return (
    <form
      onSubmit={submit}
      className={`surface-panel grid gap-px overflow-hidden rounded-2xl md:grid-cols-[1.2fr_1.2fr_1fr_.8fr_auto] ${
        variant === "hero" ? "shadow-lift" : ""
      }`}
    >
      <label className={cell}>
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <span className="sr-only">{t("search.from")}</span>
        <input
          className={field}
          list="dm-cities"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder={`${t("search.from")} — ${t("search.fromPlaceholder")}`}
        />
      </label>

      <label className={cell}>
        <Navigation className="h-4 w-4 shrink-0 text-accent" />
        <span className="sr-only">{t("search.to")}</span>
        <input
          className={field}
          list="dm-cities"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder={`${t("search.to")} — ${t("search.toPlaceholder")}`}
        />
      </label>

      <label className={cell}>
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
        <span className="sr-only">{t("search.date")}</span>
        <input
          type="date"
          className={field}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <label className={cell}>
        <Users className="h-4 w-4 shrink-0 text-primary" />
        <span className="sr-only">{t("search.seats")}</span>
        <select
          className={field}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} {t("search.seats")}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="m-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
      >
        <Search className="h-4 w-4" />
        {t("search.cta")}
      </button>

      <datalist id="dm-cities">
        {MOROCCAN_CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </form>
  );
}
