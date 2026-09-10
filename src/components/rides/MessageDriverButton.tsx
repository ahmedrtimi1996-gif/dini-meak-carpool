import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { messageErrorMessage, openConversation } from "@/lib/messaging";

/**
 * Starts (or reuses) the thread for this ride and opens it. Booking is never
 * required: the same conversation is reused if the passenger books later.
 */
export function MessageDriverButton({
  tripId,
  passengerId,
  className,
  label = "Contacter le conducteur",
}: {
  tripId: string;
  /** Set when the driver contacts a specific passenger. */
  passengerId?: string;
  className?: string;
  label?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base =
    className ??
    "inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:border-primary/40 hover:text-primary";

  if (!user) {
    return (
      <Link to="/auth" className={base}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {label}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        className={`${base} disabled:opacity-60`}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const conv = await openConversation(tripId, passengerId);
            await navigate({ to: "/messages", search: { c: conv.id } });
          } catch (e) {
            setError(messageErrorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        )}
        {label}
      </button>
      {error && (
        <span role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </span>
      )}
    </>
  );
}
