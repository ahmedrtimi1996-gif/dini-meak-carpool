import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, KeyRound, Search, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminEmpty, AdminShell } from "@/components/admin/AdminShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  assignRole,
  fetchUserDetail,
  fetchUsers,
  revokeRole,
  setAccountStatus,
  setVerification,
} from "@/lib/admin";
import type { AccountStatus, AdminUser } from "@/lib/admin";
import { downloadCsv, downloadJson, printTableAsPdf } from "@/lib/export";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

const STATUS_LABEL: Record<AccountStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
  banned: "Banni",
  deleted: "Supprimé",
};

const ROLES = ["passenger", "driver", "moderator", "support", "admin"] as const;

function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<AccountStatus | "all">("all");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [moderation, setModeration] = useState<{ user: AdminUser; next: AccountStatus } | null>(null);
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin", "users", term, status],
    queryFn: () => fetchUsers({ search: term, status }),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; next: AccountStatus; reason?: string; until?: string | null }) =>
      setAccountStatus(input.id, input.next, {
        ...(input.reason ? { reason: input.reason } : {}),
        until: input.until ?? null,
      }),
    onSuccess: (_d, input) => {
      toast.success(`Compte mis à jour : ${STATUS_LABEL[input.next]}`);
      setModeration(null);
      setReason("");
      setUntil("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyMutation = useMutation({
    mutationFn: (input: {
      id: string;
      field: "identity_verified" | "license_verified" | "phone_verified" | "email_verified";
      value: boolean;
    }) => setVerification(input.id, input.field, input.value),
    onSuccess: () => {
      toast.success("Vérification mise à jour");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMutation = useMutation({
    mutationFn: (input: { id: string; role: string; grant: boolean }) =>
      input.grant ? assignRole(input.id, input.role) : revokeRole(input.id, input.role),
    onSuccess: () => {
      toast.success("Rôles mis à jour");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = usersQuery.data ?? [];
  const exportRows = rows.map((u) => ({
    id: u.id,
    prenom: u.first_name,
    nom: u.last_name,
    telephone: u.phone,
    ville: u.city,
    statut: STATUS_LABEL[u.account_status],
    roles: u.roles.join(" / "),
    note: u.rating,
    trajets_termines: u.completed_trips,
    inscrit_le: u.created_at,
  }));

  return (
    <AdminShell
      title="Gestion des utilisateurs"
      description="Recherchez, vérifiez, suspendez ou bannissez des comptes et attribuez les rôles internes."
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={!exportRows.length}
            onClick={() => downloadCsv("dinim3ak-utilisateurs", exportRows)}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!exportRows.length}
            onClick={() => printTableAsPdf("Utilisateurs", exportRows)}
          >
            PDF
          </Button>
        </>
      }
    >
      <form
        className="surface-panel mb-6 flex flex-wrap items-end gap-3 rounded-2xl p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(search);
        }}
      >
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="user-search" className="text-xs font-bold uppercase tracking-widest">
            Recherche
          </Label>
          <Input
            id="user-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone ou ville"
            maxLength={80}
            className="mt-1"
          />
        </div>
        <div className="w-44">
          <Label className="text-xs font-bold uppercase tracking-widest">Statut</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as AccountStatus | "all")}>
            <SelectTrigger className="mt-1" aria-label="Filtrer par statut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
              <SelectItem value="banned">Banni</SelectItem>
              <SelectItem value="deleted">Supprimé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" size="sm">
          <Search className="h-4 w-4" aria-hidden="true" />
          Filtrer
        </Button>
      </form>

      {usersQuery.isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : !rows.length ? (
        <AdminEmpty label="Aucun utilisateur ne correspond à ces critères." />
      ) : (
        <div className="surface-panel overflow-x-auto rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead>Vérifications</TableHead>
                <TableHead className="text-end">Note</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar_url ?? undefined} alt="" />
                        <AvatarFallback>{(u.first_name ?? "U").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Membre"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.city ?? "—"} · {u.phone ?? "sans téléphone"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.account_status === "active"
                          ? "secondary"
                          : u.account_status === "suspended"
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {STATUS_LABEL[u.account_status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length ? (
                        u.roles.map((r) => (
                          <Badge key={r} variant="outline" className="text-[10px]">
                            {r}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 text-[10px] font-bold uppercase">
                      <Flag on={u.identity_verified} label="ID" />
                      <Flag on={u.license_verified} label="Permis" />
                      <Flag on={u.phone_verified} label="Tél" />
                      <Flag on={u.email_verified} label="Mail" />
                    </div>
                  </TableCell>
                  <TableCell className="text-end text-sm font-bold">{Number(u.rating).toFixed(1)}</TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSelected(u)}>
                        <UserCog className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Gérer</span>
                      </Button>
                      {u.account_status === "active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModeration({ user: u, next: "suspended" })}
                        >
                          Suspendre
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => statusMutation.mutate({ id: u.id, next: "active" })}
                        >
                          Réactiver
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setModeration({ user: u, next: "banned" })}
                      >
                        Bannir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Moderation dialog */}
      <Dialog open={!!moderation} onOpenChange={(o) => !o && setModeration(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderation?.next === "banned" ? "Bannir le compte" : "Suspendre le compte"}
            </DialogTitle>
            <DialogDescription>
              Le motif est enregistré dans le journal d'audit et reste consultable par l'équipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mod-reason">Motif</Label>
              <Textarea
                id="mod-reason"
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Comportement signalé, fraude suspectée…"
                className="mt-1"
              />
            </div>
            {moderation?.next === "suspended" && (
              <div>
                <Label htmlFor="mod-until">Jusqu'au (optionnel)</Label>
                <Input
                  id="mod-until"
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModeration(null)}>
              Annuler
            </Button>
            <Button
              disabled={reason.trim().length < 4 || statusMutation.isPending}
              onClick={() =>
                moderation &&
                statusMutation.mutate({
                  id: moderation.user.id,
                  next: moderation.next,
                  reason: reason.trim(),
                  until: until ? new Date(until).toISOString() : null,
                })
              }
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User drawer */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {[selected.first_name, selected.last_name].filter(Boolean).join(" ") || "Membre"}
                </DialogTitle>
                <DialogDescription>
                  Inscrit le {new Date(selected.created_at).toLocaleDateString("fr-MA")} · dernière
                  activité{" "}
                  {selected.last_seen_at
                    ? new Date(selected.last_seen_at).toLocaleString("fr-MA")
                    : "inconnue"}
                </DialogDescription>
              </DialogHeader>
              <UserDetail
                user={selected}
                onVerify={(field, value) => verifyMutation.mutate({ id: selected.id, field, value })}
                onRole={(role, grant) => roleMutation.mutate({ id: selected.id, role, grant })}
                onGdprDelete={() =>
                  statusMutation.mutate({ id: selected.id, next: "deleted", reason: "Demande RGPD" })
                }
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={
        on
          ? "rounded bg-primary/10 px-1.5 py-0.5 text-primary"
          : "rounded bg-muted px-1.5 py-0.5 text-muted-foreground"
      }
      title={`${label} ${on ? "vérifié" : "non vérifié"}`}
    >
      {label}
    </span>
  );
}

function UserDetail({
  user,
  onVerify,
  onRole,
  onGdprDelete,
}: {
  user: AdminUser;
  onVerify: (
    field: "identity_verified" | "license_verified" | "phone_verified" | "email_verified",
    value: boolean,
  ) => void;
  onRole: (role: string, grant: boolean) => void;
  onGdprDelete: () => void;
}) {
  const detail = useQuery({
    queryKey: ["admin", "user-detail", user.id],
    queryFn: () => fetchUserDetail(user.id),
  });

  return (
    <Tabs defaultValue="overview">
      <TabsList className="flex-wrap">
        <TabsTrigger value="overview">Aperçu</TabsTrigger>
        <TabsTrigger value="trips">Trajets</TabsTrigger>
        <TabsTrigger value="bookings">Réservations</TabsTrigger>
        <TabsTrigger value="reviews">Avis</TabsTrigger>
        <TabsTrigger value="payments">Paiements</TabsTrigger>
        <TabsTrigger value="activity">Connexions</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-5 pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["identity_verified", "Identité vérifiée"],
              ["license_verified", "Permis vérifié"],
              ["phone_verified", "Téléphone vérifié"],
              ["email_verified", "E-mail vérifié"],
            ] as const
          ).map(([field, label]) => (
            <div key={field} className="flex items-center justify-between rounded-xl border border-border p-3">
              <Label htmlFor={`v-${field}`} className="text-sm font-semibold">
                {label}
              </Label>
              <Switch
                id={`v-${field}`}
                checked={user[field]}
                onCheckedChange={(v) => onVerify(field, v)}
              />
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Rôles
          </p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((role) => {
              const has = user.roles.includes(role);
              return (
                <Button
                  key={role}
                  size="sm"
                  variant={has ? "default" : "outline"}
                  onClick={() => onRole(role, !has)}
                >
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {role}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              downloadJson(`utilisateur-${user.id}`, { profile: user, ...detail.data });
              toast.success("Données exportées");
            }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exporter les données
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast.info(
                "Un lien de réinitialisation ne peut être envoyé qu'à l'adresse du membre depuis la page de connexion.",
              )
            }
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Réinitialiser le mot de passe
          </Button>
          <Button size="sm" variant="destructive" onClick={onGdprDelete}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Suppression RGPD
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Les messages privés ne sont pas consultables depuis la console : seuls les échanges signalés
          apparaissent dans la modération, conformément à la loi 09-08.
        </p>
      </TabsContent>

      <TabsContent value="trips" className="pt-4">
        <MiniTable
          loading={detail.isLoading}
          rows={(detail.data?.trips ?? []).map((t) => ({
            Trajet: `${t.from_city} → ${t.to_city}`,
            Date: `${t.depart_date} ${t.depart_time?.slice(0, 5)}`,
            Prix: `${t.price} ${t.currency}`,
            Statut: t.status,
          }))}
        />
      </TabsContent>
      <TabsContent value="bookings" className="pt-4">
        <MiniTable
          loading={detail.isLoading}
          rows={(detail.data?.bookings ?? []).map((b) => ({
            Places: b.seats,
            Montant: `${b.total_price} ${b.currency}`,
            Statut: b.status,
            Paiement: b.payment_status,
            Date: new Date(b.created_at).toLocaleDateString("fr-MA"),
          }))}
        />
      </TabsContent>
      <TabsContent value="reviews" className="pt-4">
        <MiniTable
          loading={detail.isLoading}
          rows={(detail.data?.reviews ?? []).map((r) => ({
            Note: (r as { overall: number }).overall,
            Commentaire: (r as { comment: string | null }).comment ?? "—",
            Date: new Date((r as { created_at: string }).created_at).toLocaleDateString("fr-MA"),
          }))}
        />
      </TabsContent>
      <TabsContent value="payments" className="pt-4">
        <MiniTable
          loading={detail.isLoading}
          rows={(detail.data?.wallet ?? []).map((w) => ({
            Type: (w as { kind: string }).kind,
            Montant: (w as { amount: number }).amount,
            Statut: (w as { status: string }).status,
            Date: new Date((w as { created_at: string }).created_at).toLocaleDateString("fr-MA"),
          }))}
        />
      </TabsContent>
      <TabsContent value="activity" className="pt-4">
        <MiniTable
          loading={detail.isLoading}
          rows={(detail.data?.activity ?? []).map((a) => ({
            Évènement: (a as { kind: string }).kind,
            Appareil: (a as { user_agent: string | null }).user_agent ?? "—",
            IP: (a as { ip_address: string | null }).ip_address ?? "—",
            Date: new Date((a as { created_at: string }).created_at).toLocaleString("fr-MA"),
          }))}
        />
      </TabsContent>
    </Tabs>
  );
}

function MiniTable({ rows, loading }: { rows: Record<string, unknown>[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-40 rounded-xl" />;
  if (!rows.length) return <AdminEmpty label="Aucune donnée." />;
  const cols = Object.keys(rows[0] as Record<string, unknown>);
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {cols.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {cols.map((c) => (
                <TableCell key={c} className="max-w-[240px] truncate text-xs">
                  {String(r[c] ?? "—")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
