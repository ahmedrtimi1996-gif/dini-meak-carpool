import { STATUS_LABELS, type DocStatus } from "@/lib/verification";

const STATUS_STYLES: Record<DocStatus, string> = {
  not_submitted: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  under_review: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  approved: "bg-primary/15 text-primary-dark",
  rejected: "bg-destructive/15 text-destructive",
  expired: "bg-destructive/15 text-destructive",
};

/** Verification status pill — the status always comes from the database. */
export function StatusPill({ status }: { status: DocStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
