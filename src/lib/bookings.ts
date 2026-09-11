import { supabase } from "@/integrations/supabase/client";

export type BookingRow = {
  id: string;
  trip_id: string;
  passenger_id: string;
  driver_id: string;
  seats: number;
  unit_price: number;
  total_price: number;
  commission: number;
  currency: string;
  status: string;
  payment_status: string;
  message: string | null;
  created_at: string;
};

export type BookingWithTrip = BookingRow & {
  trip: {
    id: string;
    from_city: string;
    to_city: string;
    depart_date: string;
    depart_time: string;
    status: string;
  } | null;
  counterpart: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    rating: number;
  } | null;
};

const BOOKING_ERRORS: Record<string, string> = {
  AUTH_REQUIRED: "Connectez-vous pour réserver une place.",
  INVALID_SEATS: "Nombre de places invalide.",
  TRIP_NOT_FOUND: "Ce trajet n'existe plus.",
  TRIP_NOT_BOOKABLE: "Ce trajet n'est plus réservable (annulé, terminé ou en pause).",
  TRIP_DEPARTED: "Ce trajet est déjà parti.",
  OWN_TRIP: "Vous ne pouvez pas réserver votre propre trajet.",
  ACCOUNT_NOT_ACTIVE: "Votre compte n'est pas actif : contactez le support.",
  DUPLICATE_BOOKING: "Vous avez déjà une réservation en cours sur ce trajet.",
  NOT_ENOUGH_SEATS: "Il ne reste plus assez de places disponibles.",
};

/** Maps a Postgres error raised by public.create_booking to a readable message. */
export function bookingErrorMessage(error: unknown): string {
  const raw = (error as { message?: string } | null)?.message ?? "";
  for (const [code, msg] of Object.entries(BOOKING_ERRORS)) {
    if (raw.includes(code)) return msg;
  }
  return raw || "La réservation a échoué. Réessayez.";
}

export type CreateBookingInput = {
  tripId: string;
  seats: number;
  message?: string | null;
  pickupNote?: string | null;
  dropoffNote?: string | null;
};

/**
 * Books seats through the `create_booking` DB routine, which validates the
 * passenger, the ride availability and reserves the seats atomically.
 */
export async function createBooking(input: CreateBookingInput): Promise<BookingRow> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase.rpc("create_booking", {
    _trip_id: input.tripId,
    _seats: input.seats,
    ...(input.message ? { _message: input.message } : {}),
    ...(input.pickupNote ? { _pickup_note: input.pickupNote } : {}),
    ...(input.dropoffNote ? { _dropoff_note: input.dropoffNote } : {}),
  });
  if (error) throw error;
  if (!data) throw new Error("La réservation n'a pas été confirmée par la base de données.");
  return data as unknown as BookingRow;
}

async function hydrate(rows: BookingRow[], side: "passenger" | "driver"): Promise<BookingWithTrip[]> {
  if (rows.length === 0) return [];
  const tripIds = [...new Set(rows.map((r) => r.trip_id))];
  const peopleIds = [
    ...new Set(rows.map((r) => (side === "passenger" ? r.driver_id : r.passenger_id))),
  ];

  const [{ data: trips }, { data: people }] = await Promise.all([
    supabase
      .from("trips")
      .select("id, from_city, to_city, depart_date, depart_time, status")
      .in("id", tripIds),
    supabase
      .from("profiles_public")
      .select("id, first_name, last_name, avatar_url, rating")
      .in("id", peopleIds),
  ]);

  const tMap = new Map((trips ?? []).map((t) => [t.id, t]));
  const pMap = new Map((people ?? []).map((p) => [p.id, p]));

  return rows.map((r) => ({
    ...r,
    trip: tMap.get(r.trip_id) ?? null,
    counterpart: pMap.get(side === "passenger" ? r.driver_id : r.passenger_id) ?? null,
  }));
}

export async function myBookings(userId: string): Promise<BookingWithTrip[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("passenger_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return hydrate((data ?? []) as unknown as BookingRow[], "passenger");
}

export async function driverBookings(userId: string): Promise<BookingWithTrip[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("driver_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return hydrate((data ?? []) as unknown as BookingRow[], "driver");
}

export async function setBookingStatus(
  id: string,
  status: "accepted" | "rejected" | "cancelled_by_driver" | "cancelled_by_passenger" | "completed",
) {
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) throw error;
}

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: "En attente du conducteur",
  accepted: "Confirmée",
  rejected: "Refusée",
  cancelled_by_passenger: "Annulée par le passager",
  cancelled_by_driver: "Annulée par le conducteur",
  completed: "Terminée",
  expired: "Expirée",
};
