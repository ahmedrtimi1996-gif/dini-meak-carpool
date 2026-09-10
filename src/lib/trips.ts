import { supabase } from "@/integrations/supabase/client";
import type { Ride } from "./rides";

export const PLATFORM_COMMISSION_RATE = 0.08;

export type TripRow = {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  from_city: string;
  to_city: string;
  stops: string[];
  meeting_point: string | null;
  arrival_point: string | null;
  depart_date: string;
  depart_time: string;
  arrive_time: string | null;
  duration_minutes: number | null;
  distance_km: number | null;
  seats_total: number;
  seats_available: number;
  price: number;
  currency: string;
  luggage: string;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  women_only: boolean;
  instant_booking: boolean;
  description: string | null;
  status: string;
  created_at: string;
};

export type ProfileLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  rating: number;
  reviews_count: number;
  completed_trips: number;
  identity_verified: boolean;
  phone_verified: boolean;
};

export type TripWithDriver = TripRow & {
  driver: ProfileLite | null;
  vehicle: {
    brand: string;
    model: string;
    color: string | null;
    year: number | null;
    air_conditioning: boolean;
  } | null;
};

export function displayName(p: Pick<ProfileLite, "first_name" | "last_name"> | null) {
  if (!p) return "DiniM3ak";
  const last = p.last_name ? `${p.last_name.charAt(0)}.` : "";
  return [p.first_name ?? "Membre", last].filter(Boolean).join(" ");
}

export function initialsOf(p: Pick<ProfileLite, "first_name" | "last_name"> | null) {
  if (!p) return "DM";
  return `${(p.first_name ?? "D").charAt(0)}${(p.last_name ?? "M").charAt(0)}`.toUpperCase();
}

export function formatDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

export function commissionFor(total: number) {
  return Math.round(total * PLATFORM_COMMISSION_RATE * 100) / 100;
}

/** Adapts a database trip row to the presentational `Ride` shape used by RideCard. */
export function tripToRide(trip: TripWithDriver): Ride {
  return {
    id: trip.id,
    driverId: trip.driver_id,
    from: trip.from_city,
    to: trip.to_city,
    date: trip.depart_date,
    time: trip.depart_time.slice(0, 5),
    duration: formatDuration(trip.duration_minutes),
    price: Number(trip.price),
    seats: trip.seats_available,
    driver: displayName(trip.driver),
    initials: initialsOf(trip.driver),
    rating: Number(trip.driver?.rating ?? 0),
    reviews: trip.driver?.reviews_count ?? 0,
    car: trip.vehicle ? `${trip.vehicle.brand} ${trip.vehicle.model}` : "—",
    instant: trip.instant_booking,
    verified: Boolean(trip.driver?.identity_verified),
  };
}

const TRIP_SELECT = `
  *,
  driver:profiles!trips_driver_id_fkey(id, first_name, last_name, avatar_url, rating, reviews_count, completed_trips, identity_verified, phone_verified),
  vehicle:vehicles(brand, model, color, year, air_conditioning)
`;

/**
 * `trips.driver_id` is not a declared FK (auth-owned ids), so the embed above is
 * unavailable; we fetch profiles/vehicles in a second pass instead.
 */
async function hydrate(rows: TripRow[]): Promise<TripWithDriver[]> {
  if (rows.length === 0) return [];
  const driverIds = [...new Set(rows.map((r) => r.driver_id))];
  const vehicleIds = [...new Set(rows.map((r) => r.vehicle_id).filter(Boolean))] as string[];

  const [{ data: profiles }, { data: vehicles }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, avatar_url, rating, reviews_count, completed_trips, identity_verified, phone_verified",
      )
      .in("id", driverIds),
    vehicleIds.length
      ? supabase
          .from("vehicles")
          .select("id, brand, model, color, year, air_conditioning")
          .in("id", vehicleIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const pMap = new Map((profiles ?? []).map((p) => [p.id, p as ProfileLite]));
  const vMap = new Map((vehicles ?? []).map((v) => [v.id, v]));

  return rows.map((r) => ({
    ...r,
    driver: pMap.get(r.driver_id) ?? null,
    vehicle: r.vehicle_id ? (vMap.get(r.vehicle_id) ?? null) : null,
  }));
}

export type TripFilters = {
  from?: string;
  to?: string;
  date?: string;
  seats?: number;
  maxPrice?: number;
  womenOnly?: boolean;
  instant?: boolean;
  pets?: boolean;
  noSmoking?: boolean;
};

export async function searchTrips(filters: TripFilters): Promise<TripWithDriver[]> {
  let query = supabase
    .from("trips")
    .select("*")
    .eq("status", "published")
    .gte("depart_date", filters.date ?? new Date().toISOString().slice(0, 10))
    .order("depart_date", { ascending: true })
    .order("depart_time", { ascending: true })
    .limit(60);

  if (filters.from) query = query.ilike("from_city", `%${filters.from}%`);
  if (filters.to) query = query.ilike("to_city", `%${filters.to}%`);
  if (filters.date) query = query.eq("depart_date", filters.date);
  if (filters.seats) query = query.gte("seats_available", filters.seats);
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
  if (filters.womenOnly) query = query.eq("women_only", true);
  if (filters.instant) query = query.eq("instant_booking", true);
  if (filters.pets) query = query.eq("pets_allowed", true);
  if (filters.noSmoking) query = query.eq("smoking_allowed", false);

  const { data, error } = await query;
  if (error) throw error;
  return hydrate((data ?? []) as TripRow[]);
}

export async function getTrip(id: string): Promise<TripWithDriver | null> {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [hydrated] = await hydrate([data as TripRow]);
  return hydrated ?? null;
}

export async function myTrips(userId: string): Promise<TripWithDriver[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("driver_id", userId)
    .order("depart_date", { ascending: false })
    .limit(50);
  if (error) throw error;
  return hydrate((data ?? []) as TripRow[]);
}

export { TRIP_SELECT };

/** ---------- Trip creation (real DB insert) ---------- */

export type NewTripInput = {
  from_city: string;
  to_city: string;
  depart_date: string;
  depart_time: string;
  arrive_time?: string | null;
  seats_total: number;
  price: number;
  vehicle_id?: string | null;
  stops?: string[];
  meeting_point?: string | null;
  arrival_point?: string | null;
  distance_km?: number | null;
  duration_minutes?: number | null;
  luggage?: string;
  smoking_allowed?: boolean;
  pets_allowed?: boolean;
  women_only?: boolean;
  instant_booking?: boolean;
  description?: string | null;
  status?: "published" | "paused";
};

/**
 * Inserts the trip owned by the authenticated user. `driver_id` is taken from the
 * live session — never from the form — and RLS re-checks it server-side.
 */
export async function createTrip(input: NewTripInput): Promise<TripRow> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Vous devez être connecté pour publier un trajet.");
  const driverId = auth.user.id;

  const payload = {
    driver_id: driverId,
    vehicle_id: input.vehicle_id || null,
    from_city: input.from_city.trim(),
    to_city: input.to_city.trim(),
    stops: input.stops ?? [],
    meeting_point: input.meeting_point?.trim() || null,
    arrival_point: input.arrival_point?.trim() || null,
    depart_date: input.depart_date,
    depart_time: input.depart_time.length === 5 ? `${input.depart_time}:00` : input.depart_time,
    arrive_time: input.arrive_time
      ? input.arrive_time.length === 5
        ? `${input.arrive_time}:00`
        : input.arrive_time
      : null,
    duration_minutes: input.duration_minutes ?? null,
    distance_km: input.distance_km ?? null,
    seats_total: input.seats_total,
    seats_available: input.seats_total,
    price: input.price,
    currency: "MAD",
    luggage: input.luggage ?? "medium",
    smoking_allowed: input.smoking_allowed ?? false,
    pets_allowed: input.pets_allowed ?? false,
    women_only: input.women_only ?? false,
    instant_booking: input.instant_booking ?? false,
    description: input.description?.trim() || null,
    status: input.status ?? "published",
  };

  const { data, error } = await supabase.from("trips").insert(payload).select("*").single();
  if (error) throw error;
  if (!data) throw new Error("La publication a échoué : aucun trajet retourné par la base.");
  return data as TripRow;
}

export async function updateTripStatus(id: string, status: "published" | "paused" | "cancelled" | "completed") {
  const { error } = await supabase.from("trips").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function tripBookingCounts(tripIds: string[]) {
  if (tripIds.length === 0) return new Map<string, number>();
  const { data, error } = await supabase
    .from("bookings")
    .select("trip_id, status")
    .in("trip_id", tripIds);
  if (error) throw error;
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.status === "accepted" || row.status === "completed" || row.status === "pending") {
      map.set(row.trip_id, (map.get(row.trip_id) ?? 0) + 1);
    }
  }
  return map;
}
