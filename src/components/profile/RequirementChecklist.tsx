import { Link } from "@tanstack/react-router";
import { Check, X, AlertTriangle } from "lucide-react";
import type { PublishRequirements } from "@/lib/verification";
import { requirementList } from "@/lib/verification";

/**
 * Shows exactly which verification requirements are missing — no generic message.
 */
export function RequirementChecklist({
  requirements,
  title = "Votre trajet ne peut pas encore être publié.",
  showCta = true,
}: {
  requirements: PublishRequirements | null;
  title?: string;
  showCta?: boolean;
}) {
  const items = requirementList(requirements);
  const missing = items.filter((i) => !i.ok && !i.optional);

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
      <p className="flex items-center gap-2 text-sm font-extrabold text-amber-900 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        {title}
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.key} className="flex items-start gap-2 text-sm font-semibold">
            {i.ok ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <X
                className={`mt-0.5 h-4 w-4 shrink-0 ${i.optional ? "text-muted-foreground" : "text-destructive"}`}
                aria-hidden="true"
              />
            )}
            <span className={i.ok || i.optional ? "text-foreground/80" : "text-foreground"}>
              {i.label}
              {i.hint ? <em className="ms-1 font-normal text-muted-foreground">({i.hint})</em> : null}
            </span>
          </li>
        ))}
      </ul>
      {showCta && missing.length > 0 ? (
        <Link
          to="/verification"
          className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
        >
          Compléter la vérification
        </Link>
      ) : null}
    </section>
  );
}
