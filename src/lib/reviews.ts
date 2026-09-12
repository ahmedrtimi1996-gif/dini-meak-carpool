import { supabase } from "@/integrations/supabase/client";

export type Review = {
  id: string;
  booking_id: string;
  trip_id: string | null;
  author_id: string;
  target_id: string;
  overall: number;
  comment: string | null;
  is_hidden: boolean;
  created_at: string;
};

export type ReviewAuthor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  rating: number;
};

const REVIEW_COLUMNS =
  "id, booking_id, trip_id, author_id, target_id, overall, comment, is_hidden, created_at";

const REVIEW_ERRORS: Record<string, string> = {
  RIDE_NOT_COMPLETED: "Ce trajet n'est pas encore terminé : l'évaluation sera possible après.",
  NOT_A_PARTICIPANT: "Vous n'avez pas participé à ce trajet.",
  TARGET_NOT_A_PARTICIPANT: "Cette personne n'a pas participé à ce trajet.",
  SELF_REVIEW: "Vous ne pouvez pas vous évaluer vous-même.",
  BOOKING_NOT_FOUND: "Cette réservation n'existe plus.",
  reviews_unique_author_booking_target: "Vous avez déjà évalué cette personne pour ce trajet.",
  "duplicate key": "Vous avez déjà évalué cette personne pour ce trajet.",
  reviews_overall_range: "La note doit être comprise entre 1 et 5 étoiles.",
  REVIEW_IMMUTABLE: "Un avis publié ne peut pas être modifié.",
};

export function reviewErrorMessage(error: unknown): string {
  const raw = (error as { message?: string } | null)?.message ?? "";
  for (const [code, msg] of Object.entries(REVIEW_ERRORS)) {
    if (raw.includes(code)) return msg;
  }
  return raw || "L'envoi de l'avis a échoué. Réessayez.";
}

export type SubmitReviewInput = {
  bookingId: string;
  targetId: string;
  rating: number;
  comment?: string | null;
};

/** Inserts a review; the database validates completion, participation and duplicates. */
export async function submitReview(input: SubmitReviewInput): Promise<Review> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Connectez-vous pour laisser un avis.");
  if (input.rating < 1 || input.rating > 5) throw new Error("reviews_overall_range");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      booking_id: input.bookingId,
      author_id: auth.user.id,
      target_id: input.targetId,
      overall: input.rating,
      comment: input.comment?.trim() ? input.comment.trim() : null,
    })
    .select(REVIEW_COLUMNS)
    .single();
  if (error) throw error;
  return data as Review;
}

/** Reviews the signed-in user already wrote, keyed by `${booking_id}:${target_id}`. */
export async function myWrittenReviews(authorId: string): Promise<Map<string, Review>> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("author_id", authorId)
    .limit(500);
  if (error) throw error;
  return new Map(
    ((data ?? []) as Review[]).map((r) => [`${r.booking_id}:${r.target_id}`, r] as const),
  );
}

export type RatingSummary = {
  average: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ReviewsForUser = {
  reviews: Review[];
  authors: Map<string, ReviewAuthor>;
  summary: RatingSummary;
};

export async function reviewsForUser(targetId: string, limit = 20): Promise<ReviewsForUser> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("target_id", targetId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const reviews = (data ?? []) as Review[];

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingSummary["breakdown"];
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.overall)))) as 1 | 2 | 3 | 4 | 5;
    breakdown[star] += 1;
  }
  const count = reviews.length;
  const average =
    count > 0 ? reviews.reduce((sum, r) => sum + Number(r.overall), 0) / count : 0;

  let authors = new Map<string, ReviewAuthor>();
  if (count > 0) {
    const { data: people } = await supabase
      .from("profiles_public")
      .select("id, first_name, last_name, avatar_url, rating")
      .in("id", [...new Set(reviews.map((r) => r.author_id))]);
    authors = new Map(
      ((people ?? []) as ReviewAuthor[]).map((p) => [p.id, p] as const),
    );
  }

  return { reviews, authors, summary: { average, count, breakdown } };
}

export type AdminReview = Review & {
  author: ReviewAuthor | null;
  target: ReviewAuthor | null;
  trip: { id: string; from_city: string; to_city: string; depart_date: string } | null;
};

export async function adminReviews(limit = 200): Promise<AdminReview[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as Review[];
  if (rows.length === 0) return [];

  const people = [...new Set(rows.flatMap((r) => [r.author_id, r.target_id]))];
  const trips = [...new Set(rows.map((r) => r.trip_id).filter((v): v is string => Boolean(v)))];

  const [{ data: profiles }, { data: tripRows }] = await Promise.all([
    supabase
      .from("profiles_public")
      .select("id, first_name, last_name, avatar_url, rating")
      .in("id", people),
    trips.length
      ? supabase.from("trips").select("id, from_city, to_city, depart_date").in("id", trips)
      : Promise.resolve({ data: [] as AdminReview["trip"][] }),
  ]);

  const pMap = new Map(((profiles ?? []) as ReviewAuthor[]).map((p) => [p.id, p] as const));
  const tMap = new Map(
    ((tripRows ?? []) as NonNullable<AdminReview["trip"]>[]).map((t) => [t.id, t] as const),
  );

  return rows.map((r) => ({
    ...r,
    author: pMap.get(r.author_id) ?? null,
    target: pMap.get(r.target_id) ?? null,
    trip: r.trip_id ? tMap.get(r.trip_id) ?? null : null,
  }));
}

/** Staff-only moderation: hide or restore a review. */
export async function setReviewHidden(id: string, hidden: boolean, reason?: string | null) {
  const { error } = await supabase
    .from("reviews")
    .update({ is_hidden: hidden, hidden_reason: hidden ? (reason ?? null) : null })
    .eq("id", id);
  if (error) throw error;
}
