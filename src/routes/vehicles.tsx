import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { createVehicle, deleteVehicle, ensureDriverRole, myVehicles } from "@/lib/profiles";
import { fetchVehicleStatuses, type DocStatus } from "@/lib/verification";
import { StatusPill } from "@/components/profile/StatusPill";

export const Route = createFileRoute("/vehicles")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mes véhicules — DiniM3ak" },
      {
        name: "description",
        content:
          "Ajoutez et gérez les véhicules que vous utilisez pour vos trajets DiniM3ak : marque, modèle, places et assurance.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Mes véhicules — DiniM3ak" },
      { property: "og:description", content: "Gérez les véhicules liés à votre compte conducteur." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VehiclesPage,
});

function VehiclesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    color: "",
    plate: "",
    seats: 4,
    insurance_valid_until: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const list = useQuery({
    queryKey: ["my-vehicles", user?.id],
    queryFn: () => myVehicles(user!.id),
    enabled: Boolean(user?.id),
  });

  const statuses = useQuery({
    queryKey: ["vehicle-statuses", user?.id],
    queryFn: () => fetchVehicleStatuses(user!.id),
    enabled: Boolean(user?.id),
  });


  const add = useMutation({
    mutationFn: async () => {
      await ensureDriverRole(user!.id);
      return createVehicle(user!.id, {
        brand: form.brand,
        model: form.model,
        year: form.year ? Number(form.year) : null,
        color: form.color || null,
        plate: form.plate || null,
        seats: form.seats,
        insurance_valid_until: form.insurance_valid_until || null,
      });
    },
    onSuccess: async () => {
      setError(null);
      setForm({ brand: "", model: "", year: "", color: "", plate: "", seats: 4, insurance_valid_until: "" });
      await qc.invalidateQueries({ queryKey: ["my-vehicles"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-vehicles"] }),
    onError: (e: Error) => setError(e.message),
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold">Mes véhicules</h1>
        <p className="mt-2 text-muted-foreground">
          Un véhicule enregistré est requis pour publier un trajet.
        </p>

        {error ? (
          <p role="alert" className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <ul className="mt-8 space-y-3">
          {(list.data ?? []).map((v) => (
            <li key={v.id} className="surface-panel flex items-center justify-between rounded-2xl p-5">
              <div>
                <p className="text-sm font-extrabold">
                  {v.brand} {v.model} {v.year ? `· ${v.year}` : ""}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {v.seats} places {v.color ? `· ${v.color}` : ""}{" "}
                  {v.insurance_valid_until ? `· assurance jusqu'au ${v.insurance_valid_until}` : ""}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Supprimer ${v.brand} ${v.model}`}
                onClick={() => remove.mutate(v.id)}
                className="rounded-full border border-border p-2 text-destructive hover:border-destructive/50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <form
          className="surface-panel mt-8 space-y-6 rounded-2xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <h2 className="text-sm font-extrabold">Ajouter un véhicule</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="brand">
                Marque
              </label>
              <input
                id="brand"
                required
                className={input}
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Dacia"
              />
            </div>
            <div>
              <label className={label} htmlFor="model">
                Modèle
              </label>
              <input
                id="model"
                required
                className={input}
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Logan"
              />
            </div>
            <div>
              <label className={label} htmlFor="year">
                Année
              </label>
              <input
                id="year"
                type="number"
                min={1990}
                max={2030}
                className={input}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="color">
                Couleur
              </label>
              <input
                id="color"
                className={input}
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="plate">
                Immatriculation
              </label>
              <input
                id="plate"
                className={input}
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="seats">
                Places passagers
              </label>
              <select
                id="seats"
                className={input}
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
              >
                {[2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="insurance">
                Assurance valable jusqu'au
              </label>
              <input
                id="insurance"
                type="date"
                className={input}
                value={form.insurance_valid_until}
                onChange={(e) => setForm({ ...form, insurance_valid_until: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={add.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {add.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            Enregistrer
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
