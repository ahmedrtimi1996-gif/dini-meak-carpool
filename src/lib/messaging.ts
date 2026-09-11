import { supabase } from "@/integrations/supabase/client";

export type ConversationRow = {
  id: string;
  trip_id: string | null;
  passenger_id: string;
  driver_id: string;
  last_message_at: string;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  read_at: string | null;
  created_at: string;
};

export type ConversationView = ConversationRow & {
  otherId: string;
  other: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    rating: number;
  } | null;
  trip: {
    id: string;
    from_city: string;
    to_city: string;
    depart_date: string;
    depart_time: string;
    status: string;
  } | null;
  lastMessage: string | null;
  unread: number;
  role: "driver" | "passenger";
};

const MESSAGE_ERRORS: Record<string, string> = {
  AUTH_REQUIRED: "Connectez-vous pour envoyer un message.",
  TRIP_NOT_FOUND: "Ce trajet n'existe plus.",
  CONVERSATION_NOT_FOUND: "Cette conversation n'existe plus.",
  EMPTY_MESSAGE: "Écrivez un message avant d'envoyer.",
  FORBIDDEN: "Vous n'avez pas accès à cette conversation.",
  PASSENGER_REQUIRED: "Passager introuvable.",
};

export function messageErrorMessage(error: unknown): string {
  const raw = (error as { message?: string } | null)?.message ?? "";
  for (const [code, msg] of Object.entries(MESSAGE_ERRORS)) {
    if (raw.includes(code)) return msg;
  }
  return raw || "L'envoi du message a échoué. Réessayez.";
}

/**
 * Opens the thread for (trip, driver, passenger), creating it only when absent.
 * Booking is never required, and a later booking reuses the same thread.
 */
export async function openConversation(tripId: string, passengerId?: string) {
  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    _trip_id: tripId,
    ...(passengerId ? { _passenger_id: passengerId } : {}),
  });
  if (error) throw error;
  return data as unknown as ConversationRow;
}

export async function sendMessage(conversationId: string, body: string) {
  const { data, error } = await supabase.rpc("send_message", {
    _conversation_id: conversationId,
    _body: body,
  });
  if (error) throw error;
  return data as unknown as MessageRow;
}

export async function listConversations(userId: string): Promise<ConversationView[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
    .order("last_message_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = (data ?? []) as unknown as ConversationRow[];
  if (rows.length === 0) return [];

  const otherIds = [...new Set(rows.map((r) => (r.passenger_id === userId ? r.driver_id : r.passenger_id)))];
  const tripIds = [...new Set(rows.map((r) => r.trip_id).filter(Boolean))] as string[];
  const convIds = rows.map((r) => r.id);

  const [{ data: people }, { data: trips }, { data: msgs }] = await Promise.all([
    supabase
      .from("profiles_public")
      .select("id, first_name, last_name, avatar_url, rating")
      .in("id", otherIds),
    tripIds.length
      ? supabase
          .from("trips")
          .select("id, from_city, to_city, depart_date, depart_time, status")
          .in("id", tripIds)
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, read_at, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const pMap = new Map(
    (people ?? []).map((p) => [p.id as string, p as ConversationView["other"]]),
  );
  const tMap = new Map((trips ?? []).map((t) => [t.id, t]));
  const last = new Map<string, string | null>();
  const unread = new Map<string, number>();
  for (const m of (msgs ?? []) as unknown as MessageRow[]) {
    if (!last.has(m.conversation_id)) last.set(m.conversation_id, m.body);
    if (m.sender_id !== userId && !m.read_at) {
      unread.set(m.conversation_id, (unread.get(m.conversation_id) ?? 0) + 1);
    }
  }

  return rows.map((r) => {
    const otherId = r.passenger_id === userId ? r.driver_id : r.passenger_id;
    return {
      ...r,
      otherId,
      other: pMap.get(otherId) ?? null,
      trip: r.trip_id ? (tMap.get(r.trip_id) ?? null) : null,
      lastMessage: last.get(r.id) ?? null,
      unread: unread.get(r.id) ?? 0,
      role: r.driver_id === userId ? "driver" : "passenger",
    };
  });
}

export async function listMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as MessageRow[];
}

/** Marks the counterpart's messages in this thread as read. */
export async function markConversationRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

export async function unreadMessageCount(userId: string): Promise<number> {
  const { data: convs } = await supabase
    .from("conversations")
    .select("id")
    .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
    .limit(200);
  const ids = (convs ?? []).map((c) => c.id);
  if (ids.length === 0) return 0;
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", ids)
    .neq("sender_id", userId)
    .is("read_at", null);
  return count ?? 0;
}
