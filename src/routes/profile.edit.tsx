import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Mail, Car } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { myVehicles, updateMyProfile } from "@/lib/profiles";
import { fetchVehicleStatuses, resendVerificationEmail, type DocStatus } from "@/lib/verification";
import { StatusPill } from "@/components/profile/StatusPill";
import { VerificationBadges } from "@/components/profile/VerificationBadges";

export const Route = createFileRoute("/profile/edit")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mon profil — DiniM3ak" },
      {
        name: "description",
        content:
          "Complétez votre profil DiniM3ak : nom, ville, téléphone, langues parlées et contact d'urgence.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Mon profil — DiniM3ak" },
      { property: "og:description", content: "Gérez vos informations personnelles DiniM3ak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfileEditPage,
});

function ProfileEditPage() {
  const { user, profile, loading, refresh, isDriver } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    city: "",
    phone: "",
    bio: "",
    emergency_contact: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        city: profile.city ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        emergency_contact: profile.emergency_contact ?? "",
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => updateMyProfile(user!.id, form),
    onSuccess: async () => {
      setError(null);
      setSaved(true);
      await refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  const resend = useMutation({
    mutationFn: () => resendVerificationEmail(user!.email!),
    onSuccess: () => setError(null),
    onError: (e: Error) => setError(e.message),
  });

  const vehiclesQuery = useQuery({
    queryKey: ["my-vehicles", user?.id],
    queryFn: () => myVehicles(user!.id),
    enabled: Boolean(user?.id) && isDriver,
  });

  const statusQuery = useQuery({
    queryKey: ["vehicle-statuses", user?.id],
    queryFn: () => fetchVehicleStatuses(user!.id),
    enabled: Boolean(user?.id) && isDriver,
  });

  const input =
    "mt-2 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold outline-none focus:border-primary";
  const label = "block text-xs font-bold uppercase tracking-widest text-muted-foreground";

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  const vehicles = vehiclesQuery.data ?? [];
  const hasVerifiedVehicle = vehicles.some((v) => statusQuery.data?.get(v.id) === "approved");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold">Mon profil</h1>
        <div className="mt-4">
          <VerificationBadges flags={profile ?? {}} />
        </div>

        {!profile?.email_verified && user.email ? (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
              Votre adresse e-mail n'est pas encore vérifiée.
            </p>
            <button
              type="button"
              onClick={() => resend.mutate()}
              disabled={resend.isPending}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {resend.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Mail className="h-4 w-4" aria-hidden="true" />
              )}
              Renvoyer l'e-mail de vérification
            </button>
            {resend.isSuccess ? (
              <p aria-live="polite" className="mt-2 text-xs font-semibold text-primary-dark">
                E-mail envoyé à {user.email} — pensez à vérifier vos spams.
              </p>
            ) : null}
          </div>
        ) : null}

        {isDriver ? (
          <section className="surface-panel mt-6 rounded-2xl p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Car className="h-4 w-4 text-primary" aria-hidden="true" />
              Vérification des véhicules
            </h2>
            {vehicles.length === 0 ? (
              <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
                Vérification du véhicule requise.{" "}
                <Link to="/vehicles" className="text-primary underline underline-offset-4">
                  Ajouter un véhicule
                </Link>
              </p>
            ) : (
              <>
                <ul className="mt-3 space-y-2">
                  {vehicles.map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {v.brand} {v.model}
                        {v.plate ? ` · ${v.plate}` : ""}
                      </span>
                      <StatusPill
                        status={(statusQuery.data?.get(v.id) ?? "not_submitted") as DocStatus}
                      />
                    </li>
                  ))}
                </ul>
                {!hasVerifiedVehicle ? (
                  <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
                    Vérification du véhicule requise : aucun véhicule vérifié, la publication de
                    trajets est bloquée.{" "}
                    <Link to="/verification" className="text-primary underline underline-offset-4">
                      Envoyer la carte grise
                    </Link>
                  </p>
                ) : null}
              </>
            )}
          </section>
        ) : null}


        <form
          className="surface-panel mt-8 space-y-6 rounded-2xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(false);
            save.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="first_name">
                Prénom
              </label>
              <input
                id="first_name"
                required
                maxLength={60}
                className={input}
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="last_name">
                Nom
              </label>
              <input
                id="last_name"
                maxLength={60}
                className={input}
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="phone">
                Téléphone
              </label>
              <input
                id="phone"
                type="tel"
                maxLength={20}
                className={input}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+212 6 12 34 56 78"
              />
            </div>
            <div>
              <label className={label} htmlFor="city">
                Ville
              </label>
              <input
                id="city"
                maxLength={80}
                className={input}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="emergency">
                Contact d'urgence
              </label>
              <input
                id="emergency"
                maxLength={120}
                className={input}
                value={form.emergency_contact}
                onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                maxLength={500}
                className={input}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="rounded-xl bg-primary-soft px-4 py-3 text-sm font-semibold text-primary-dark">
              Profil mis à jour.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Enregistrer
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
