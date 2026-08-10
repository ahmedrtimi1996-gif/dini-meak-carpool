import { supabase } from "@/integrations/supabase/client";
import { AVATAR_BUCKET } from "./verification";

export type PublicProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  languages: string[];
  rating: number;
  reviews_count: number;
  completed_trips: number;
  cancelled_trips: number;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  license_verified: boolean;
  vehicle_verified: boolean;
  insurance_verified: boolean;
  created_at: string;
  account_status: string;
};

const PUBLIC_COLUMNS =
  "id, first_name, last_name, avatar_url, city, bio, languages, rating, reviews_count, completed_trips, cancelled_trips, email_verified, phone_verified, identity_verified, license_verified, vehicle_verified, insurance_verified, created_at, account_status";

/** Public profile: private fields (phone, address, documents) are never selected. */
export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicProfile) ?? null;
}

export type ProfileUpdate = {
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  bio?: string | null;
  phone?: string | null;
  birthday?: string | null;
  gender?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  languages?: string[];
  preferred_locale?: string;
  avatar_url?: string | null;
  driving_experience_years?: number | null;
};

export async function updateMyProfile(userId: string, patch: ProfileUpdate) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    upsert: true,
    ...(file.type ? { contentType: file.type } : {}),
  });
  if (error) throw error;
  await updateMyProfile(userId, { avatar_url: path });
  return path;
}

/** Avatars live in a private bucket, so we mint short-lived signed URLs. */
export async function avatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

export type ReliabilityStats = {
  completed: number;
  cancelled: number;
  cancellationRate: number;
  acceptanceRate: number;
  responseRate: number;
  totalRequests: number;
};

/** Driver reliability computed from real bookings — never mocked. */
export async function driverReliability(driverId: string): Promise<ReliabilityStats> {
  const { data, error } = await supabase
    .from("bookings")
    .select("status")
    .eq("driver_id", driverId)
    .limit(1000);
  if (error) throw error;
  const rows = data ?? [];
  const total = rows.length;
  const accepted = rows.filter((r) => r.status === "accepted" || r.status === "completed").length;
  const rejected = rows.filter((r) => r.status === "rejected").length;
  const cancelledByDriver = rows.filter((r) => r.status === "cancelled_by_driver").length;
  const expired = rows.filter((r) => r.status === "expired").length;
  const answered = accepted + rejected + cancelledByDriver;
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
  return {
    completed: rows.filter((r) => r.status === "completed").length,
    cancelled: cancelledByDriver,
    cancellationRate: pct(cancelledByDriver, total),
    acceptanceRate: pct(accepted, total),
    responseRate: pct(answered, answered + expired),
    totalRequests: total,
  };
}

export type ReviewRow = {
  id: string;
  author_id: string;
  overall: number;
  comment: string | null;
  created_at: string;
};

export async function profileReviews(targetId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, author_id, overall, comment, created_at")
    .eq("target_id", targetId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  const reviews = (data ?? []) as ReviewRow[];
  if (reviews.length === 0) return { reviews, authors: new Map<string, PublicProfile>() };
  const { data: authors } = await supabase
    .from("profiles")
    .select(PUBLIC_COLUMNS)
    .in("id", [...new Set(reviews.map((r) => r.author_id))]);
  return {
    reviews,
    authors: new Map<string, PublicProfile>(
      (authors ?? []).map((a) => [(a as PublicProfile).id, a as PublicProfile]),
    ),
  };
}

export type Vehicle = {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  version: string | null;
  year: number | null;
  color: string | null;
  plate: string | null;
  seats: number;
  fuel: string | null;
  transmission: string | null;
  luggage: string;
  air_conditioning: boolean;
  usb_charger: boolean;
  wifi: boolean;
  music: boolean;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  photos: string[];
  insurance_valid_until: string | null;
  is_default: boolean;
  created_at: string;
};

export async function myVehicles(userId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Vehicle[];
}

export async function createVehicle(userId: string, v: Partial<Vehicle>) {
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      owner_id: userId,
      brand: v.brand ?? "",
      model: v.model ?? "",
      year: v.year ?? null,
      color: v.color ?? null,
      plate: v.plate ?? null,
      seats: v.seats ?? 4,
      fuel: v.fuel ?? null,
      transmission: v.transmission ?? null,
      air_conditioning: v.air_conditioning ?? true,
      insurance_valid_until: v.insurance_valid_until ?? null,
      is_default: v.is_default ?? true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Vehicle;
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw error;
}

export async function ensureDriverRole(userId: string) {
  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role: "driver" });
  // duplicate key = already a driver, which is fine
  if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
}

export function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString("fr-MA", { month: "long", year: "numeric" });
}
