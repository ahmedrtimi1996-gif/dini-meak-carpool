import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, Loader2, X } from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import {
  DOC_LABELS,
  REJECTION_REASONS,
  STATUS_LABELS,
  adminListDocuments,
  reviewDocument,
  signedDocumentUrl,
  type DocStatus,
} from "@/lib/verification";

export const Route = createFileRoute("/admin/verifications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Centre de vérification — Admin DiniM3ak" },
      {
        name: "description",
        content: "Examinez et validez les documents conducteurs soumis sur DiniM3ak.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Centre de vérification — Admin DiniM3ak" },
      { property: "og:description", content: "Revue des documents conducteurs DiniM3ak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminVerifications,
});

const FILTERS: DocStatus[] = ["pending", "under_review", "approved", "rejected", "expired"];

function AdminVerifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<DocStatus>("pending");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const docs = useQuery({
    queryKey: ["admin-documents", status],
    queryFn: () => adminListDocuments({ status }),
  });

  const review = useMutation({
    mutationFn: (args: { id: string; approve: boolean; note?: string }) =>
      reviewDocument({
        documentId: args.id,
        reviewerId: user!.id,
        status: args.approve ? "approved" : "rejected",
        ...(args.note ? { note: args.note } : {}),
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-documents"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  async function open(path: string) {
    try {
      const url = await signedDocumentUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <AdminShell
      title="Centre de vérification"
      description="Validez les pièces d'identité, permis, cartes grises et assurances."
    >
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              status === s ? "bg-primary text-primary-foreground" : "border border-border"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      {docs.isLoading ? (
        <div className="mt-8 flex justify-center" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : (docs.data ?? []).length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aucun document dans cette file.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {(docs.data ?? []).map((d) => (
            <li key={d.id} className="surface-panel rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold">{DOC_LABELS[d.doc_type]}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    {d.owner?.first_name ?? "Membre"} {d.owner?.last_name ?? ""} ·{" "}
                    {new Date(d.created_at).toLocaleString("fr-MA")}
                    {d.expires_on ? ` · expire le ${d.expires_on}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void open(d.file_url)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-bold"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Voir
                  </button>
                  <select
                    aria-label="Motif de refus"
                    className="rounded-full border border-input bg-card px-3 py-2 text-xs font-semibold"
                    value={reason[d.id] ?? ""}
                    onChange={(e) => setReason({ ...reason, [d.id]: e.target.value })}
                  >
                    <option value="">Motif de refus…</option>
                    {REJECTION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!reason[d.id] || review.isPending}
                    onClick={() =>
                      review.mutate({ id: d.id, approve: false, note: reason[d.id] as string })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3 py-2 text-xs font-bold text-destructive disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Refuser
                  </button>
                  <button
                    type="button"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: d.id, approve: true })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Approuver
                  </button>
                </div>
              </div>
              {d.review_note ? (
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                  Note : {d.review_note}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
