import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  FileWarning,
  LifeBuoy,
  MapPin,
  PiggyBank,
  RefreshCw,
  Siren,
  TrendingUp,
  UserCheck,
  Users,
  Wifi,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell } from "@/components/admin/AdminShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminStats } from "@/lib/admin";
import type { AdminStats, TopUser } from "@/lib/admin";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

const money = (v: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(
    Number(v ?? 0),
  );
const num = (v: number) => new Intl.NumberFormat("fr-MA").format(Number(v ?? 0));
const DOW = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function AdminHome() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
    staleTime: 60_000,
  });

  return (
    <AdminShell
      title="Tableau de bord"
      description="Vue temps réel de l'activité DiniM3ak : croissance, revenus, trajets et signaux de risque."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            Actualiser
          </Button>
          <Button
            size="sm"
            disabled={!data}
            onClick={() =>
              data &&
              downloadCsv(
                `dinim3ak-revenus-${new Date().toISOString().slice(0, 10)}`,
                data.revenue_series as unknown as Record<string, unknown>[],
              )
            }
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exporter
          </Button>
        </>
      }
    >
      {isError ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm font-semibold text-destructive"
        >
          Impossible de charger les statistiques : {(error as Error).message}
        </div>
      ) : isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <Dashboard stats={data} />
      )}
    </AdminShell>
  );
}

function Dashboard({ stats }: { stats: AdminStats }) {
  const revenueSeries = stats.revenue_series ?? [];
  const signupSeries = stats.signup_series ?? [];

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Utilisateurs" value={num(stats.total_users)} hint={`+${num(stats.new_users_7d)} sur 7 j`} />
        <Kpi icon={Activity} label="Comptes actifs" value={num(stats.active_users)} hint={`${num(stats.suspended_users)} suspendus · ${num(stats.banned_users)} bannis`} />
        <Kpi icon={Wifi} label="En ligne" value={num(stats.online_users)} hint="Actifs < 5 min" tone="accent" />
        <Kpi icon={UserCheck} label="Conducteurs" value={num(stats.drivers)} hint={`${num(stats.verified_drivers)} vérifiés`} />
        <Kpi icon={Users} label="Passagers" value={num(stats.passengers)} />
        <Kpi icon={Car} label="Trajets" value={num(stats.total_trips)} hint={`${num(stats.active_trips)} en ligne`} />
        <Kpi icon={CheckCircle2} label="Trajets terminés" value={num(stats.completed_trips)} tone="primary" />
        <Kpi icon={XCircle} label="Trajets annulés" value={num(stats.cancelled_trips)} tone="danger" />
        <Kpi icon={CircleDollarSign} label="Revenu total" value={money(stats.total_revenue)} tone="primary" />
        <Kpi icon={PiggyBank} label="Commission plateforme" value={money(stats.commission)} tone="accent" />
        <Kpi icon={TrendingUp} label="Revenu du mois" value={money(stats.revenue_month)} hint={`Semaine ${money(stats.revenue_week)}`} />
        <Kpi icon={Clock} label="Revenu du jour" value={money(stats.revenue_today)} />
      </section>

      {/* Risk row */}
      <section aria-label="Signaux à traiter" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={AlertTriangle} label="Signalements ouverts" value={num(stats.open_reports)} tone="danger" />
        <Kpi icon={LifeBuoy} label="Tickets support ouverts" value={num(stats.open_tickets)} tone="accent" />
        <Kpi icon={Siren} label="Alertes SOS" value={num(stats.open_sos)} tone="danger" />
        <Kpi icon={FileWarning} label="Documents à vérifier" value={num(stats.pending_documents)} />
      </section>

      {/* Charts */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Revenus — 30 derniers jours" subtitle="Réservations acceptées et terminées">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueSeries} margin={{ left: -10, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(8)} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={54} />
              <Tooltip formatter={(v: number) => money(v)} labelFormatter={(l: string) => l} />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Croissance des inscriptions" subtitle="Nouveaux comptes par jour">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={signupSeries} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(8)} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="users" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </section>

      {/* Routes / cities */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Itinéraires les plus demandés" subtitle="Nombre de trajets publiés">
          <ul className="space-y-3">
            {(stats.popular_routes ?? []).map((r) => (
              <li key={`${r.from_city}-${r.to_city}`} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate">
                    {r.from_city} → {r.to_city}
                  </span>
                </span>
                <Badge variant="secondary">{num(r.trips)}</Badge>
              </li>
            ))}
            {!stats.popular_routes?.length && <Muted>Pas encore de trajets publiés.</Muted>}
          </ul>
        </Panel>

        <Panel title="Villes les plus actives" subtitle="Départs + arrivées">
          <ul className="space-y-3">
            {(stats.popular_cities ?? []).map((c) => {
              const max = Math.max(...(stats.popular_cities ?? []).map((x) => Number(x.trips)), 1);
              return (
                <li key={c.city}>
                  <div className="mb-1 flex items-center justify-between text-sm font-semibold">
                    <span className="truncate">{c.city}</span>
                    <span className="text-muted-foreground">{num(c.trips)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="presentation">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(Number(c.trips) / max) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {!stats.popular_cities?.length && <Muted>Aucune donnée de ville.</Muted>}
          </ul>
        </Panel>
      </section>

      {/* Heat map */}
      <Panel
        title="Carte de chaleur des réservations"
        subtitle="Volume par jour de la semaine et heure (24h)"
      >
        <Heatmap data={stats.bookings_by_weekday_hour ?? []} />
      </Panel>

      {/* Top users */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Meilleurs conducteurs" subtitle="Par chiffre d'affaires généré">
          <TopList users={stats.top_drivers ?? []} valueKey="revenue" />
        </Panel>
        <Panel title="Meilleurs passagers" subtitle="Par dépenses cumulées">
          <TopList users={stats.top_passengers ?? []} valueKey="spend" />
        </Panel>
      </section>

      {/* Booking analytics */}
      <Panel title="Analytique des réservations" subtitle="Répartition par statut">
        <div className="grid gap-4 sm:grid-cols-4">
          <MiniStat label="Total" value={num(stats.total_bookings)} />
          <MiniStat label="En attente" value={num(stats.pending_bookings)} />
          <MiniStat label="Acceptées" value={num(stats.accepted_bookings)} />
          <MiniStat label="Annulées" value={num(stats.cancelled_bookings)} />
        </div>
      </Panel>
    </div>
  );
}

/** ---------- building blocks ---------- */

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "primary" | "accent" | "danger";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "accent"
        ? "bg-secondary/15 text-secondary-foreground"
        : tone === "danger"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground";
  return (
    <div className="surface-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
        <span className={`rounded-xl p-2 ${toneClass}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-panel rounded-2xl p-5">
      <header className="mb-4">
        <h2 className="text-sm font-extrabold uppercase tracking-widest">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}

function TopList({ users, valueKey }: { users: TopUser[]; valueKey: "revenue" | "spend" }) {
  if (!users.length) return <Muted>Aucune activité pour le moment.</Muted>;
  return (
    <ol className="space-y-3">
      {users.map((u, i) => (
        <li key={u.id} className="flex items-center gap-3">
          <span className="w-5 text-xs font-extrabold text-muted-foreground">{i + 1}</span>
          <Avatar className="h-9 w-9">
            <AvatarImage src={u.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{(u.first_name ?? "U").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">
              {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Membre DiniM3ak"}
            </p>
            <p className="text-xs text-muted-foreground">
              {num(u.bookings)} réservations · <BadgeCheck className="inline h-3 w-3" aria-hidden="true" />{" "}
              {Number(u.rating ?? 0).toFixed(1)}
            </p>
          </div>
          <span className="text-sm font-extrabold text-primary">{money(Number(u[valueKey] ?? 0))}</span>
        </li>
      ))}
    </ol>
  );
}

function Heatmap({ data }: { data: { dow: number; hour: number; bookings: number }[] }) {
  const map = new Map<string, number>();
  let max = 1;
  for (const d of data) {
    map.set(`${d.dow}-${d.hour}`, Number(d.bookings));
    max = Math.max(max, Number(d.bookings));
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-[2px] text-[10px]">
        <caption className="sr-only">Réservations par jour de la semaine et par heure</caption>
        <thead>
          <tr>
            <th scope="col" className="w-10" />
            {Array.from({ length: 24 }).map((_, h) => (
              <th key={h} scope="col" className="font-semibold text-muted-foreground">
                {String(h).padStart(2, "0")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DOW.map((label, dow) => (
            <tr key={label}>
              <th scope="row" className="pe-2 text-end font-bold text-muted-foreground">
                {label}
              </th>
              {Array.from({ length: 24 }).map((_, hour) => {
                const value = map.get(`${dow}-${hour}`) ?? 0;
                const intensity = value === 0 ? 0 : 0.15 + (value / max) * 0.85;
                return (
                  <td key={hour} className="p-0">
                    <div
                      className="h-6 rounded-[3px] bg-primary"
                      style={{ opacity: intensity || 0.06 }}
                      title={`${label} ${String(hour).padStart(2, "0")}h — ${value} réservation(s)`}
                      aria-label={`${label} ${hour} heures : ${value} réservations`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
