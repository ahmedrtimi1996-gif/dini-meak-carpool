import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, Pause, Play, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminEmpty, AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { duplicateTrip, fetchTrips, softDeleteTrip, updateTrip } from "@/lib/admin";
import type { AdminTrip } from "@/lib/admin";
import { downloadCsv, printTableAsPdf } from "@/lib/export";

export const Route = createFileRoute("/admin/trips")({
  component: AdminTripsPage,
});

function AdminTripsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");

  const tripsQuery = useQuery({
    queryKey: ["admin", "trips", term, status],
    queryFn: () => fetchTrips({ search: term, status }),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin", "trips"] });

  const patch = useMutation({
    mutationFn: (input: { id: string; patch: Record<string, unknown> }) => updateTrip(input.id, input.patch),
    onSuccess: () => {
      toast.success("Trajet mis à jour");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteTrip(id),
    onSuccess: () => {
      toast.success("Trajet archivé");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clone = useMutation({
    mutationFn: (trip: AdminTrip) => duplicateTrip(trip),
    onSuccess: () => {
      toast.success("Trajet dupliqué");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = tripsQuery.data ?? [];
  const exportRows = rows.map((t) => ({
    id: t.id,
    depart: t.from_city,
    arrivee: t.to_city,
    date: t.depart_date,
    heure: t.depart_time,
    prix: t.price,
    devise: t.currency,
    places: `${t.seats_available}/${t.seats_total}`,
    statut: t.status,
  }));

  return (
    <AdminShell
      title="Gestion des trajets"
      description="Modérez les annonces : mise en pause, correction, duplication ou archivage."
      actions={
        <>
          <Button variant="outline" size="sm" disabled={!exportRows.length} onClick={() => downloadCsv("dinim3ak-trajets", exportRows)}>
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </Button>
          <Button variant="outline" size="sm" disabled={!exportRows.length} onClick={() => printTableAsPdf("Trajets", exportRows)}>
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
          <Label htmlFor="trip-search" className="text-xs font-bold uppercase tracking-widest">
            Recherche
          </Label>
          <Input
            id="trip-search"
            value={search}
            maxLength={80}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ville de départ ou d'arrivée"
            className="mt-1"
          />
        </div>
        <div className="w-44">
          <Label className="text-xs font-bold uppercase tracking-widest">Statut</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1" aria-label="Filtrer par statut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="published">Publié</SelectItem>
              <SelectItem value="paused">En pause</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" size="sm">
          <Search className="h-4 w-4" aria-hidden="true" />
          Filtrer
        </Button>
      </form>

      {tripsQuery.isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : !rows.length ? (
        <AdminEmpty label="Aucun trajet trouvé." />
      ) : (
        <div className="surface-panel overflow-x-auto rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Itinéraire</TableHead>
                <TableHead>Départ</TableHead>
                <TableHead>Conducteur</TableHead>
                <TableHead className="text-end">Prix</TableHead>
                <TableHead className="text-end">Places</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-semibold">
                    {t.from_city} → {t.to_city}
                  </TableCell>
                  <TableCell className="text-xs">
                    {t.depart_date} · {t.depart_time?.slice(0, 5)}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">
                    {t.driver_id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-end font-bold">
                    {t.price} {t.currency}
                  </TableCell>
                  <TableCell className="text-end text-xs">
                    {t.seats_available}/{t.seats_total}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === "published" ? "secondary" : "outline"}>{t.status}</Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      {t.status === "published" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => patch.mutate({ id: t.id, patch: { status: "paused" } })}
                        >
                          <Pause className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Mettre en pause</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => patch.mutate({ id: t.id, patch: { status: "published" } })}
                        >
                          <Play className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Republier</span>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => clone.mutate(t)}>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Dupliquer</span>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remove.mutate(t.id)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Archiver</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminShell>
  );
}
