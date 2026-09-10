import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MessagesSquare, Send, Star } from "lucide-react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  listConversations,
  listMessages,
  markConversationRead,
  messageErrorMessage,
  sendMessage,
  type ConversationView,
} from "@/lib/messaging";

export const Route = createFileRoute("/messages")({
  validateSearch: (search: Record<string, unknown>): { c?: string } =>
    typeof search['c'] === "string" ? { c: search['c'] as string } : {},
  head: () => ({
    meta: [
      { title: "Messages — DiniM3ak" },
      {
        name: "description",
        content:
          "Discutez avec les conducteurs et passagers DiniM3ak avant et après la réservation de votre trajet.",
      },
      { property: "og:title", content: "Messages — DiniM3ak" },
      {
        property: "og:description",
        content: "Échangez en direct avec les conducteurs et passagers DiniM3ak.",
      },
    ],
  }),
  component: MessagesPage,
});

function nameOf(p: ConversationView["other"]) {
  if (!p) return "Membre DiniM3ak";
  const last = p.last_name ? `${p.last_name.charAt(0)}.` : "";
  return [p.first_name ?? "Membre", last].filter(Boolean).join(" ");
}

function initialsOf(p: ConversationView["other"]) {
  if (!p) return "DM";
  return `${(p.first_name ?? "D").charAt(0)}${(p.last_name ?? "M").charAt(0)}`.toUpperCase();
}

function MessagesPage() {
  const { user, loading } = useAuth();
  const { c } = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const uid = user?.id;
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const conversations = useQuery({
    queryKey: ["conversations", uid],
    queryFn: () => listConversations(uid as string),
    enabled: Boolean(uid),
  });

  const active = useMemo<ConversationView | null>(() => {
    const list = conversations.data ?? [];
    return list.find((x) => x.id === c) ?? null;
  }, [conversations.data, c]);

  const messages = useQuery({
    queryKey: ["messages", active?.id],
    queryFn: () => listMessages(active?.id as string),
    enabled: Boolean(active?.id),
  });

  // Realtime: new messages in the open thread and elsewhere refresh instantly.
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`messages-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        void qc.invalidateQueries({ queryKey: ["conversations", uid] });
        void qc.invalidateQueries({ queryKey: ["messages"] });
        void qc.invalidateQueries({ queryKey: ["unread-messages", uid] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [uid, qc]);

  // Reading an open thread clears its unread counter.
  useEffect(() => {
    if (!uid || !active?.id) return;
    void markConversationRead(active.id, uid)
      .then(() => {
        void qc.invalidateQueries({ queryKey: ["conversations", uid] });
        void qc.invalidateQueries({ queryKey: ["unread-messages", uid] });
      })
      .catch(() => undefined);
  }, [uid, active?.id, messages.data?.length, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length, active?.id]);

  const send = useMutation({
    mutationFn: (body: string) => sendMessage(active?.id as string, body),
    onSuccess: () => {
      setDraft("");
      void qc.invalidateQueries({ queryKey: ["messages", active?.id] });
      void qc.invalidateQueries({ queryKey: ["conversations", uid] });
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12">
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold">Messages</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Connectez-vous pour discuter avec les conducteurs et les passagers.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Se connecter
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const list = conversations.data ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-extrabold">Messages</h1>

        <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
          {/* Conversation list — hidden on mobile while a thread is open */}
          <aside
            className={`surface-panel rounded-2xl p-2 ${active ? "hidden lg:block" : "block"}`}
          >
            {conversations.isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Chargement…</p>
            ) : list.length === 0 ? (
              <div className="p-6 text-center">
                <MessagesSquare className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Aucune conversation. Contactez un conducteur depuis un trajet.
                </p>
                <Link
                  to="/search"
                  className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                >
                  Chercher un trajet
                </Link>
              </div>
            ) : (
              <ul className="space-y-1">
                {list.map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => void navigate({ search: { c: conv.id } })}
                      className={`flex w-full items-start gap-3 rounded-xl p-3 text-start hover:bg-muted ${
                        conv.id === active?.id ? "bg-muted" : ""
                      }`}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-xs font-extrabold text-primary-dark">
                        {conv.other?.avatar_url ? (
                          <img src={conv.other.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initialsOf(conv.other)
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold">{nameOf(conv.other)}</span>
                          {conv.unread > 0 && (
                            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
                              {conv.unread}
                            </span>
                          )}
                        </span>
                        {conv.trip && (
                          <span className="block truncate text-[11px] font-semibold text-primary">
                            {conv.trip.from_city} → {conv.trip.to_city}
                          </span>
                        )}
                        <span className="block truncate text-xs text-muted-foreground">
                          {conv.lastMessage ?? "Nouvelle conversation"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Thread */}
          <section className={`surface-panel flex min-h-[28rem] flex-col rounded-2xl ${active ? "flex" : "hidden lg:flex"}`}>
            {!active ? (
              <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted-foreground">
                Sélectionnez une conversation.
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-border p-4">
                  <button
                    type="button"
                    onClick={() => void navigate({ search: {} })}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border lg:hidden"
                    aria-label="Retour aux conversations"
                  >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                  </button>
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-xs font-extrabold text-primary-dark">
                    {active.other?.avatar_url ? (
                      <img src={active.other.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initialsOf(active.other)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">
                      {nameOf(active.other)}{" "}
                      <span className="text-xs font-semibold text-muted-foreground">
                        · {active.role === "driver" ? "passager" : "conducteur"}
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-amber text-amber" aria-hidden="true" />
                      {Number(active.other?.rating ?? 0).toFixed(1)}
                      {active.trip && (
                        <span className="truncate font-semibold text-primary">
                          {active.trip.from_city} → {active.trip.to_city} · {active.trip.depart_date}{" "}
                          {active.trip.depart_time.slice(0, 5)}
                        </span>
                      )}
                    </p>
                  </div>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.isLoading ? (
                    <p className="text-sm text-muted-foreground">Chargement…</p>
                  ) : (messages.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun message. Écrivez le premier message ci-dessous.
                    </p>
                  ) : (
                    (messages.data ?? []).map((m) => {
                      const mine = m.sender_id === uid;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                              mine
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p
                              className={`mt-1 text-[10px] ${
                                mine ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {new Date(m.created_at).toLocaleTimeString("fr-MA", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                              {mine && (m.read_at ? " · lu" : " · envoyé")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form
                  className="flex items-end gap-2 border-t border-border p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (draft.trim()) send.mutate(draft.trim());
                  }}
                >
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={1}
                    placeholder="Écrire un message…"
                    aria-label="Message"
                    className="min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background p-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={send.isPending || !draft.trim()}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
                  >
                    {send.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    )}
                    Envoyer
                  </button>
                </form>
                {send.isError && (
                  <p role="alert" className="px-4 pb-3 text-sm font-semibold text-destructive">
                    {messageErrorMessage(send.error)}
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
