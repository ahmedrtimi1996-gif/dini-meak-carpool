import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, Eye, ShieldCheck, Mail, Car } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { myVehicles } from "@/lib/profiles";
import {
  DOC_LABELS,
  STATUS_LABELS,
  daysUntil,
  effectiveStatus,
  fetchPublishRequirements,
  fetchVehicleStatuses,
  hasExpiry,
  latestByType,
  listMyDocuments,
  resendVerificationEmail,
  signedDocumentUrl,
  uploadDocument,
  type DocStatus,
  type DocType,
} from "@/lib/verification";
import { RequirementChecklist } from "@/components/profile/RequirementChecklist";

export const Route = createFileRoute("/verification")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Centre de vérification — DiniM3ak" },
      {
        name: "description",
        content:
          "Suivez l'état de vos vérifications DiniM3ak : identité, permis, carte grise et assurance, et envoyez vos documents en toute sécurité.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Centre de vérification — DiniM3ak" },
      {
        property: "og:description",
        content: "Envoyez vos documents et suivez leur validation par l'équipe DiniM3ak.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerificationPage,
});

const ROWS: { type: DocType; note?: string }[] = [
  { type: "national_id", note: "CIN marocaine ou passeport" },
  { type: "selfie", note: "Selfie tenant votre pièce d'identité" },
  { type: "driving_license" },
  { type: "vehicle_registration" },
  { type: "insurance", note: "Attestation en cours de validité" },
];

const STATUS_STYLES: Record<DocStatus, string> = {
  not_submitted: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  under_review: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  approved: "bg-primary/15 text-primary-dark",
  rejected: "bg-destructive/15 text-destructive",
  expired: "bg-destructive/15 text-destructive",
};

export function StatusPill({ status }: { status: DocStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function VerificationPage() {
  const { user, profile, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busyType, setBusyType] = useState<DocType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const docsQuery = useQuery({
    queryKey: ["my-documents", user?.id],
    queryFn: () => listMyDocuments(user!.id),
    enabled: Boolean(user?.id),
  });

  const reqQuery = useQuery({
    queryKey: ["publish-requirements", user?.id],
    queryFn: () => fetchPublishRequirements(user!.id),
    enabled: Boolean(user?.id),
  });

  const vehiclesQuery = useQuery({
    queryKey: ["my-vehicles", user?.id],
    queryFn: () => myVehicles(user!.id),
    enabled: Boolean(user?.id),
  });

  const vehicleStatusQuery = useQuery({
    queryKey: ["vehicle-statuses", user?.id],
    queryFn: () => fetchVehicleStatuses(user!.id),
    enabled: Boolean(user?.id),
  });

  const upload = useMutation({
    mutationFn: async (args: {
      docType: DocType;
      file: File;
      expiresOn: string;
      vehicleId?: string | null;
    }) =>
      uploadDocument({
        userId: user!.id,
        docType: args.docType,
        file: args.file,
        expiresOn: args.expiresOn || null,
        vehicleId: args.vehicleId ?? null,
      }),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["my-documents"] }),
        qc.invalidateQueries({ queryKey: ["publish-requirements"] }),
        qc.invalidateQueries({ queryKey: ["vehicle-statuses"] }),
      ]);
      await refresh();
    },
    onError: (e: Error) => setError(e.message),
    onSettled: () => setBusyType(null),
  });

  const resend = useMutation({
    mutationFn: () => resendVerificationEmail(user!.email!),
    onError: (e: Error) => setError(e.message),
    onSuccess: () => setError(null),
  });

  const [expiry, setExpiry] = useState<Record<string, string>>({});
  const [vehicleFor, setVehicleFor] = useState<Record<string, string>>({});
  const docs = docsQuery.data ?? [];
  const byType = latestByType(docs);
  const vehicles = vehiclesQuery.data ?? [];
  const vehicleStatuses = vehicleStatusQuery.data ?? new Map<string, DocStatus>();


  async function openDoc(path: string) {
    try {
      const url = await signedDocumentUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold">
          <ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" />
          Centre de vérification
        </h1>
        <p className="mt-2 text-muted-foreground">
          Vos documents sont stockés dans un espace privé et chiffré. Ils sont visibles uniquement
          par vous et par l'équipe de vérification DiniM3ak.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="surface-panel rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              E-mail
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StatusPill status={profile?.email_verified ? "approved" : "pending"} />
              {!profile?.email_verified && user.email ? (
                <button
                  type="button"
                  onClick={() => resend.mutate()}
                  disabled={resend.isPending}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:border-primary/40 disabled:opacity-60"
                >
                  {resend.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Renvoyer l'e-mail de vérification
                </button>
              ) : null}
            </div>
            {!profile?.email_verified && resend.isSuccess ? (
              <p aria-live="polite" className="mt-2 text-xs font-semibold text-primary-dark">
                E-mail envoyé à {user.email} — pensez à vérifier vos spams.
              </p>
            ) : null}
          </div>

          <div className="surface-panel rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Téléphone
            </p>
            <div className="mt-2 flex items-center gap-3">
              <StatusPill status={profile?.phone_verified ? "approved" : "not_submitted"} />
              {!profile?.phone_verified ? (
                <Link
                  to="/profile/edit"
                  className="text-xs font-bold text-primary underline-offset-4 hover:underline"
                >
                  Ajouter mon numéro
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-8 space-y-4">
          {ROWS.map((row) => {
            const perVehicle = row.type === "vehicle_registration";
            const selectedVehicle = perVehicle ? (vehicleFor[row.type] ?? vehicles[0]?.id ?? "") : "";
            const doc = perVehicle
              ? docs.find((d) => d.doc_type === row.type && d.vehicle_id === selectedVehicle) ??
                docs.find((d) => d.doc_type === row.type && !d.vehicle_id)
              : byType.get(row.type);
            const status = effectiveStatus(doc);
            const showExpiry = hasExpiry(row.type);
            const remaining = showExpiry ? daysUntil(doc?.expires_on ?? null) : null;
            return (
              <article key={row.type} className="surface-panel rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-extrabold">{DOC_LABELS[row.type]}</h2>
                    {row.note ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{row.note}</p>
                    ) : null}
                  </div>
                  <StatusPill status={status} />
                </div>

                {status === "rejected" && doc?.review_note ? (
                  <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                    Motif du refus : {doc.review_note} — vous pouvez renvoyer un nouveau document.
                  </p>
                ) : null}
                {status === "approved" && remaining !== null && remaining <= 30 ? (
                  <p className="mt-3 rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Ce document expire dans {remaining} jour{remaining > 1 ? "s" : ""}. Renouvelez-le
                    pour continuer à publier des trajets.
                  </p>
                ) : null}
                {status === "expired" ? (
                  <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                    Document expiré : la publication de nouveaux trajets est suspendue jusqu'au
                    renouvellement.
                  </p>
                ) : null}

                {perVehicle && vehicles.length === 0 ? (
                  <p className="mt-3 rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Vérification du véhicule requise. Ajoutez d'abord un véhicule pour envoyer sa
                    carte grise.{" "}
                    <Link to="/vehicles" className="underline underline-offset-4">
                      Ajouter un véhicule
                    </Link>
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  {perVehicle && vehicles.length > 0 ? (
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Véhicule concerné
                      <select
                        className="mt-1 block rounded-xl border border-input bg-card px-3 py-2 text-sm font-semibold"
                        value={selectedVehicle}
                        onChange={(e) => setVehicleFor({ ...vehicleFor, [row.type]: e.target.value })}
                      >
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.brand} {v.model}
                            {v.plate ? ` · ${v.plate}` : ""} —{" "}
                            {STATUS_LABELS[(vehicleStatuses.get(v.id) ?? "not_submitted") as DocStatus]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {showExpiry ? (
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Date d'expiration
                      <input
                        type="date"
                        className="mt-1 block rounded-xl border border-input bg-card px-3 py-2 text-sm font-semibold"
                        value={expiry[row.type] ?? ""}
                        onChange={(e) => setExpiry({ ...expiry, [row.type]: e.target.value })}
                      />
                    </label>
                  ) : null}

                  <label
                    className={`inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground ${
                      perVehicle && vehicles.length === 0
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    {busyType === row.type ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden="true" />
                    )}
                    {doc ? "Renvoyer" : "Envoyer"}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      disabled={perVehicle && vehicles.length === 0}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBusyType(row.type);
                        upload.mutate({
                          docType: row.type,
                          file,
                          expiresOn: showExpiry ? (expiry[row.type] ?? "") : "",
                          vehicleId: perVehicle ? selectedVehicle : null,
                        });
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {doc ? (
                    <button
                      type="button"
                      onClick={() => void openDoc(doc.file_url)}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:border-primary/40"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Voir mon document
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {vehicles.length > 0 ? (
          <section className="surface-panel mt-8 rounded-2xl p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Car className="h-4 w-4 text-primary" aria-hidden="true" />
              Vérification de mes véhicules
            </h2>
            <ul className="mt-4 space-y-2">
              {vehicles.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {v.brand} {v.model}
                    {v.plate ? ` · ${v.plate}` : ""}
                  </span>
                  <StatusPill status={(vehicleStatuses.get(v.id) ?? "not_submitted") as DocStatus} />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Vous pouvez publier un trajet uniquement avec un véhicule vérifié.
            </p>
          </section>
        ) : null}


        <div className="mt-10">
          <RequirementChecklist
            requirements={reqQuery.data ?? null}
            title="Conditions requises pour publier un trajet"
            showCta={false}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
