import { supabase } from "@/integrations/supabase/client";

/** ---------- Types ---------- */

export type AdminStats = {
  total_users: number;
  active_users: number;
  online_users: number;
  suspended_users: number;
  banned_users: number;
  new_users_7d: number;
  drivers: number;
  passengers: number;
  verified_drivers: number;
  total_trips: number;
  active_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  total_bookings: number;
  pending_bookings: number;
  accepted_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  commission: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  open_reports: number;
  open_tickets: number;
  open_sos: number;
  pending_documents: number;
  revenue_series: { day: string; revenue: number; bookings: number }[];
  signup_series: { day: string; users: number }[];
  popular_routes: { from_city: string; to_city: string; trips: number }[];
  popular_cities: { city: string; trips: number }[];
  top_drivers: TopUser[];
  top_passengers: TopUser[];
  bookings_by_weekday_hour: { dow: number; hour: number; bookings: number }[];
};

export type TopUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  rating: number;
  bookings: number;
  revenue?: number;
  spend?: number;
};

export type AccountStatus = "active" | "suspended" | "banned" | "deleted";

export type AdminUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  rating: number;
  reviews_count: number;
  completed_trips: number;
  cancelled_trips: number;
  identity_verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  license_verified: boolean;
  account_status: AccountStatus;
  suspension_reason: string | null;
  suspended_until: string | null;
  ban_reason: string | null;
  last_seen_at: string | null;
  created_at: string;
  roles: string[];
};

export type AdminTrip = {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  depart_date: string;
  depart_time: string;
  price: number;
  currency: string;
  seats_total: number;
  seats_available: number;
  status: string;
  is_featured: boolean;
  is_hidden: boolean;
  created_at: string;
};

export type AdminBooking = {
  id: string;
  trip_id: string;
  passenger_id: string;
  driver_id: string;
  seats: number;
  total_price: number;
  commission: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
};

export type AdminReport = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  assigned_to: string | null;
  resolution_note: string | null;
  created_at: string;
};

export type AdminTicket = {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  last_reply_at: string;
  created_at: string;
};

/** ---------- Queries ---------- */

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  return data as unknown as AdminStats;
}

export async function fetchUsers(opts: {
  search?: string;
  status?: AccountStatus | "all";
  limit?: number;
}): Promise<AdminUser[]> {
  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.status && opts.status !== "all") query = query.eq("account_status", opts.status);
  const term = opts.search?.trim();
  if (term) {
    const safe = term.replace(/[%,()]/g, "");
    query = query.or(
      `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,phone.ilike.%${safe}%,city.ilike.%${safe}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as unknown as Omit<AdminUser, "roles">[];
  const ids = rows.map((r) => r.id);
  const roleMap = new Map<string, string[]>();
  if (ids.length) {
    const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
    for (const r of roles ?? []) {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role as string);
      roleMap.set(r.user_id, list);
    }
  }
  return rows.map((r) => ({ ...r, roles: roleMap.get(r.id) ?? [] }));
}

export async function setAccountStatus(
  userId: string,
  status: AccountStatus,
  opts: { reason?: string; until?: string | null } = {},
) {
  const patch: Record<string, unknown> = { account_status: status };
  if (status === "suspended") {
    patch['suspension_reason'] = opts.reason ?? null;
    patch['suspended_until'] = opts.until ?? null;
  }
  if (status === "banned") patch['ban_reason'] = opts.reason ?? null;
  if (status === "active") {
    patch['suspension_reason'] = null;
    patch['suspended_until'] = null;
    patch['ban_reason'] = null;
  }
  if (status === "deleted") patch['deleted_at'] = new Date().toISOString();

  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
  await logAudit("account_status_change", "profiles", userId, { status, ...opts });
}

export async function setVerification(
  userId: string,
  field: "identity_verified" | "license_verified" | "phone_verified" | "email_verified",
  value: boolean,
) {
  const { error } = await supabase.from("profiles").update({ [field]: value }).eq("id", userId);
  if (error) throw error;
  await logAudit("verification_change", "profiles", userId, { field, value });
}

export async function assignRole(userId: string, role: string) {
  const { error } = await supabase
    .from("user_roles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ user_id: userId, role: role as any });
  if (error && !`${error.message}`.includes("duplicate")) throw error;
  await logAudit("role_assigned", "user_roles", userId, { role });
}

export async function revokeRole(userId: string, role: string) {
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("role", role as any);
  if (error) throw error;
  await logAudit("role_revoked", "user_roles", userId, { role });
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?mode=reset`,
  });
  if (error) throw error;
}

export async function fetchUserDetail(userId: string) {
  const [trips, bookings, reviews, activity, wallet, tickets] = await Promise.all([
    supabase.from("trips").select("*").eq("driver_id", userId).order("depart_date", { ascending: false }).limit(25),
    supabase
      .from("bookings")
      .select("*")
      .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase.from("reviews").select("*").eq("target_id", userId).order("created_at", { ascending: false }).limit(25),
    supabase.from("activity_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(25),
    supabase.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(25),
    supabase.from("support_tickets").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(25),
  ]);
  return {
    trips: (trips.data ?? []) as unknown as AdminTrip[],
    bookings: (bookings.data ?? []) as unknown as AdminBooking[],
    reviews: reviews.data ?? [],
    activity: activity.data ?? [],
    wallet: wallet.data ?? [],
    tickets: (tickets.data ?? []) as unknown as AdminTicket[],
  };
}

export async function fetchTrips(opts: { search?: string; status?: string; limit?: number }) {
  let query = supabase
    .from("trips")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.status && opts.status !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq("status", opts.status as any);
  }
  const term = opts.search?.trim();
  if (term) {
    const safe = term.replace(/[%,()]/g, "");
    query = query.or(`from_city.ilike.%${safe}%,to_city.ilike.%${safe}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AdminTrip[];
}

export async function updateTrip(id: string, patch: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("trips").update(patch as any).eq("id", id);
  if (error) throw error;
  await logAudit("trip_update", "trips", id, patch);
}

export async function softDeleteTrip(id: string) {
  await updateTrip(id, { deleted_at: new Date().toISOString(), status: "archived" });
}

export async function duplicateTrip(trip: AdminTrip) {
  const { data: full, error: readError } = await supabase.from("trips").select("*").eq("id", trip.id).single();
  if (readError) throw readError;
  const row = { ...(full as Record<string, unknown>) };
  delete row['id'];
  delete row['created_at'];
  delete row['updated_at'];
  row['status'] = "paused";
  row['seats_available'] = row['seats_total'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("trips").insert(row as any);
  if (error) throw error;
  await logAudit("trip_duplicated", "trips", trip.id, {});
}

export async function fetchBookings(opts: { status?: string; payment?: string; limit?: number }) {
  let query = supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.status && opts.status !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq("status", opts.status as any);
  }
  if (opts.payment && opts.payment !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq("payment_status", opts.payment as any);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AdminBooking[];
}

export async function fetchReports(status: string) {
  let query = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
  if (status !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq("status", status as any);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AdminReport[];
}

export async function updateReport(id: string, patch: Record<string, unknown>) {
  const next = { ...patch };
  if (patch['status'] === "resolved" || patch['status'] === "rejected") {
    next['resolved_at'] = new Date().toISOString();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("reports").update(next as any).eq("id", id);
  if (error) throw error;
  await logAudit("report_update", "reports", id, next);
}

export async function fetchTickets(status: string) {
  let query = supabase
    .from("support_tickets")
    .select("*")
    .order("last_reply_at", { ascending: false })
    .limit(200);
  if (status !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq("status", status as any);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AdminTicket[];
}

export async function updateTicket(id: string, patch: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("support_tickets").update(patch as any).eq("id", id);
  if (error) throw error;
  await logAudit("ticket_update", "support_tickets", id, patch);
}

export async function fetchTicketThread(ticketId: string) {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function replyToTicket(ticketId: string, body: string, isInternal: boolean) {
  const { data: auth } = await supabase.auth.getUser();
  const senderId = auth.user?.id;
  if (!senderId) throw new Error("not authenticated");
  const { error } = await supabase
    .from("support_messages")
    .insert({ ticket_id: ticketId, sender_id: senderId, body, is_internal: isInternal });
  if (error) throw error;
  await supabase
    .from("support_tickets")
    .update({ last_reply_at: new Date().toISOString() })
    .eq("id", ticketId);
}

export async function fetchAuditLogs(limit = 100) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  after: Record<string, unknown>,
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    after_data: after as never,
    user_agent: typeof navigator === "undefined" ? null : navigator.userAgent,
  });
}
