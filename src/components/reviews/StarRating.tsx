import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star display, e.g. ★★★★★ 4.8 (23). */
export function StarRating({
  value,
  count,
  size = "sm",
  showValue = true,
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(value);
  const px = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`${value.toFixed(1)} sur 5${count !== undefined ? `, ${count} avis` : ""}`}
    >
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn(px, s <= rounded ? "fill-amber text-amber" : "text-muted-foreground/40")}
          />
        ))}
      </span>
      {showValue ? (
        <span className="text-xs font-bold tabular-nums">{value.toFixed(1)}</span>
      ) : null}
      {count !== undefined ? (
        <span className="text-xs text-muted-foreground tabular-nums">({count})</span>
      ) : null}
    </span>
  );
}

export const RATING_LABEL: Record<number, string> = {
  1: "Très mauvais",
  2: "Mauvais",
  3: "Bien",
  4: "Très bien",
  5: "Excellent",
};

/** Interactive 1–5 star input. */
export function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Note de 1 à 5 étoiles" className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`${s} étoile${s > 1 ? "s" : ""} — ${RATING_LABEL[s]}`}
          disabled={disabled}
          onClick={() => onChange(s)}
          className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
        >
          <Star
            className={cn(
              "h-7 w-7",
              s <= value ? "fill-amber text-amber" : "text-muted-foreground/40",
            )}
            aria-hidden="true"
          />
        </button>
      ))}
      <span className="ms-2 text-xs font-semibold text-muted-foreground">
        {value > 0 ? RATING_LABEL[value] : "Choisissez une note"}
      </span>
    </div>
  );
}
